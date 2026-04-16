import fs from "fs/promises";
import path from "path";
import type { ILLMProvider } from "../providers/interfaces";
import type { IVectorStore } from "../vectorstore/interfaces";
import type {
  RagDocument,
  Chunk,
  ChatMessage,
  Citation,
  RagResponse,
  StreamChunk,
  VectorFilter,
} from "../types";
import { DocumentProcessingService } from "./documentProcessingService";
import { EmbeddingService } from "./embeddingService";
import { config } from "../config";
import {
  DOCUMENTS_FILE,
  MAX_CONTEXT_CHARS,
  CITATION_EXCERPT_MAX_CHARS,
  SESSION_TTL_MS,
  SESSION_CLEANUP_INTERVAL_MS,
} from "../config/constants";

interface SessionEntry {
  messages: ChatMessage[];
  lastAccessedAt: number;
}

function truncateAtSentenceBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const candidate = text.slice(0, maxChars);
  const lastBoundary = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf(".\n"),
    candidate.lastIndexOf("! "),
    candidate.lastIndexOf("? "),
    candidate.lastIndexOf("\n\n"),
  );
  if (lastBoundary > maxChars * 0.5) {
    return candidate.slice(0, lastBoundary + 1);
  }
  return candidate;
}

export class RagService {
  private readonly docProcessor: DocumentProcessingService;
  private readonly embeddingService: EmbeddingService;
  private readonly vectorStore: IVectorStore;
  private readonly llmProvider: ILLMProvider;
  private readonly dataDir: string;
  private readonly sessions = new Map<string, SessionEntry>();

  constructor(
    embeddingService: EmbeddingService,
    vectorStore: IVectorStore,
    llmProvider: ILLMProvider
  ) {
    this.docProcessor = new DocumentProcessingService();
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
    this.llmProvider = llmProvider;
    this.dataDir = config.rag.dataDir;

    const interval = setInterval(
      () => this.cleanupExpiredSessions(),
      SESSION_CLEANUP_INTERVAL_MS
    );
    // Allow Node to exit even if the interval is still pending
    if (typeof (interval as NodeJS.Timeout).unref === "function") {
      (interval as NodeJS.Timeout).unref();
    }
  }

  // ── Document Management ──────────────────────────────────────────────────────

  async ingestDocument(
    id: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
    contentHash: string
  ): Promise<RagDocument> {
    await this.ensureDataDir();

    const doc: RagDocument = {
      id,
      filename,
      mimeType,
      uploadedAt: new Date().toISOString(),
      chunkCount: 0,
      status: "queued",
      contentHash,
    };

    await this.saveDocument(doc);

    // Fire-and-forget: run pipeline in background without blocking the HTTP response
    this.processDocumentAsync(id, filename, buffer, mimeType).catch((err: unknown) => {
      console.error(`Background processing failed for document "${filename}" (${id}):`, err);
    });

    return doc;
  }

  private async processDocumentAsync(
    id: string,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<void> {
    const doc = (await this.getDocumentById(id))!;

    try {
      doc.status = "parsing";
      await this.saveDocument(doc);
      const { text } = await this.docProcessor.parseDocument(buffer, mimeType);

      doc.status = "chunking";
      await this.saveDocument(doc);
      const chunks = this.docProcessor.buildChunks(
        text,
        { chunkSize: config.rag.chunkSize, chunkOverlap: config.rag.chunkOverlap },
        id,
        filename
      );

      doc.status = "embedding";
      await this.saveDocument(doc);
      const embedded = await this.embeddingService.embedChunks(chunks);

      for (const ec of embedded) {
        await this.vectorStore.upsert(ec.id, ec.vector, ec as Chunk);
      }

      doc.chunkCount = chunks.length;
      doc.status = "ready";
      await this.saveDocument(doc);
    } catch (err) {
      doc.status = "error";
      doc.errorMessage = err instanceof Error ? err.message : "Unknown error";
      await this.saveDocument(doc);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    await this.vectorStore.deleteByDocumentId(id);
    const docs = await this.loadDocuments();
    const updated = docs.filter((d) => d.id !== id);
    await this.persistDocuments(updated);
  }

  async listDocuments(): Promise<RagDocument[]> {
    return this.loadDocuments();
  }

  async getDocumentById(id: string): Promise<RagDocument | null> {
    const docs = await this.loadDocuments();
    return docs.find((d) => d.id === id) ?? null;
  }

  async findDocumentByHash(contentHash: string): Promise<RagDocument | null> {
    const docs = await this.loadDocuments();
    return docs.find((d) => d.contentHash === contentHash) ?? null;
  }

  async getChunk(chunkId: string): Promise<Chunk | null> {
    return this.vectorStore.getChunk(chunkId);
  }

  // ── Chat ─────────────────────────────────────────────────────────────────────

  async chat(
    sessionId: string,
    userMessage: string,
    documentIds?: string[]
  ): Promise<RagResponse> {
    const history = this.getOrCreateSession(sessionId);
    const { systemPrompt, citations } = await this.buildContext(userMessage, documentIds);

    history.push({ role: "user", content: userMessage });

    const { content, model } = await this.llmProvider.generateResponse(systemPrompt, [...history]);
    history.push({ role: "assistant", content });

    return { answer: content, citations, sessionId, model };
  }

  async *chatStream(
    sessionId: string,
    userMessage: string,
    documentIds?: string[]
  ): AsyncIterable<StreamChunk> {
    const history = this.getOrCreateSession(sessionId);
    const { systemPrompt, citations } = await this.buildContext(userMessage, documentIds);

    history.push({ role: "user", content: userMessage });

    // Emit citations first so the client can render them immediately
    yield { type: "citations", citations };

    let fullAnswer = "";
    try {
      // Use .next() instead of for-await-of so we can capture the generator's
      // return value, which carries the model name that was actually used.
      const generator = this.llmProvider.generateStream(systemPrompt, [...history]);
      let modelUsed = "unknown";
      while (true) {
        const step = await generator.next();
        if (step.done) {
          modelUsed = step.value; // string return value = model name
          break;
        }
        const delta = step.value; // string yield value = text delta
        fullAnswer += delta;
        yield { type: "delta", content: delta };
      }
      history.push({ role: "assistant", content: fullAnswer });
      yield { type: "done", model: modelUsed };
    } catch (err) {
      yield { type: "error", error: err instanceof Error ? err.message : "Stream failed" };
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // ── Private Helpers ──────────────────────────────────────────────────────────

  private getOrCreateSession(sessionId: string): ChatMessage[] {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.lastAccessedAt = Date.now();
      return existing.messages;
    }
    const entry: SessionEntry = { messages: [], lastAccessedAt: Date.now() };
    this.sessions.set(sessionId, entry);
    return entry.messages;
  }

  private cleanupExpiredSessions(): void {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, entry] of this.sessions) {
      if (entry.lastAccessedAt < cutoff) {
        this.sessions.delete(id);
      }
    }
  }

  private async buildContext(
    userMessage: string,
    documentIds?: string[]
  ): Promise<{ systemPrompt: string; citations: Citation[] }> {
    const queryVector = await this.embeddingService.embedQuery(userMessage);
    const filter: VectorFilter | undefined =
      documentIds && documentIds.length > 0 ? { documentIds } : undefined;

    const results = await this.vectorStore.search(queryVector, config.rag.topK, filter);

    const citations: Citation[] = results.map((r) => ({
      chunkId: r.chunkId,
      documentId: r.documentId,
      filename: r.chunk.metadata.filename,
      pageNumber: r.chunk.metadata.pageNumber,
      excerpt: truncateAtSentenceBoundary(r.chunk.content, CITATION_EXCERPT_MAX_CHARS),
    }));

    const contextBlocks = results.map((r, i) => {
      const page = r.chunk.metadata.pageNumber ? `, page ${r.chunk.metadata.pageNumber}` : "";
      return `[${i + 1}] Source: ${r.chunk.metadata.filename}${page}\n${r.chunk.content}`;
    });

    const contextText = truncateAtSentenceBoundary(
      contextBlocks.join("\n\n---\n\n"),
      MAX_CONTEXT_CHARS
    );

    const systemPrompt =
      results.length === 0
        ? "You are a helpful assistant. The knowledge base is empty or no relevant documents were found. Let the user know you cannot find relevant information to answer their question."
        : `You are a helpful assistant. Answer the user's question using ONLY the context below. Cite sources by their number [1], [2], etc. If the answer is not in the context, say so clearly.

Context:
${contextText}`;

    return { systemPrompt, citations };
  }

  private async ensureDataDir(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  private documentsFilePath(): string {
    return path.join(this.dataDir, DOCUMENTS_FILE);
  }

  private async loadDocuments(): Promise<RagDocument[]> {
    try {
      const raw = await fs.readFile(this.documentsFilePath(), "utf-8");
      return JSON.parse(raw) as RagDocument[];
    } catch {
      return [];
    }
  }

  private async saveDocument(doc: RagDocument): Promise<void> {
    const docs = await this.loadDocuments();
    const idx = docs.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      docs[idx] = doc;
    } else {
      docs.push(doc);
    }
    await this.persistDocuments(docs);
  }

  private async persistDocuments(docs: RagDocument[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(this.documentsFilePath(), JSON.stringify(docs, null, 2), "utf-8");
  }
}

// ── Singleton factory ─────────────────────────────────────────────────────────

let instance: RagService | null = null;

export function getRagService(
  embeddingService: EmbeddingService,
  vectorStore: IVectorStore,
  llmProvider: ILLMProvider
): RagService {
  if (!instance) {
    instance = new RagService(embeddingService, vectorStore, llmProvider);
  }
  return instance;
}

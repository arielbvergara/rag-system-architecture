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

const DOCUMENTS_FILE = "documents.json";
const MAX_CONTEXT_CHARS = 8000;

export class RagService {
  private readonly docProcessor: DocumentProcessingService;
  private readonly embeddingService: EmbeddingService;
  private readonly vectorStore: IVectorStore;
  private readonly llmProvider: ILLMProvider;
  private readonly dataDir: string;
  private readonly sessions = new Map<string, ChatMessage[]>();

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
  }

  // ── Document Management ──────────────────────────────────────────────────────

  async ingestDocument(
    id: string,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<RagDocument> {
    await this.ensureDataDir();

    const doc: RagDocument = {
      id,
      filename,
      mimeType,
      uploadedAt: new Date().toISOString(),
      chunkCount: 0,
      status: "processing",
    };

    await this.saveDocument(doc);

    try {
      const { text } = await this.docProcessor.parseDocument(buffer, mimeType);

      const chunks = this.docProcessor.buildChunks(text, {
        chunkSize: config.rag.chunkSize,
        chunkOverlap: config.rag.chunkOverlap,
      }, id, filename);

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
      throw err;
    }

    return doc;
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

  // ── Chat ─────────────────────────────────────────────────────────────────────

  async chat(
    sessionId: string,
    userMessage: string,
    documentIds?: string[]
  ): Promise<RagResponse> {
    const history = this.getOrCreateSession(sessionId);
    const { systemPrompt, citations } = await this.buildContext(userMessage, documentIds);

    history.push({ role: "user", content: userMessage });

    const answer = await this.llmProvider.generateResponse(systemPrompt, [...history]);
    history.push({ role: "assistant", content: answer });

    return { answer, citations, sessionId };
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
      for await (const delta of this.llmProvider.generateStream(systemPrompt, [...history])) {
        fullAnswer += delta;
        yield { type: "delta", content: delta };
      }
      history.push({ role: "assistant", content: fullAnswer });
      yield { type: "done" };
    } catch (err) {
      yield { type: "error", error: err instanceof Error ? err.message : "Stream failed" };
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // ── Private Helpers ──────────────────────────────────────────────────────────

  private getOrCreateSession(sessionId: string): ChatMessage[] {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId)!;
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
      excerpt: r.chunk.content.slice(0, 300),
    }));

    const contextBlocks = results
      .map((r, i) => {
        const page = r.chunk.metadata.pageNumber ? `, page ${r.chunk.metadata.pageNumber}` : "";
        return `[${i + 1}] Source: ${r.chunk.metadata.filename}${page}\n${r.chunk.content}`;
      })
      .join("\n\n---\n\n")
      .slice(0, MAX_CONTEXT_CHARS);

    const systemPrompt = results.length === 0
      ? "You are a helpful assistant. The knowledge base is empty or no relevant documents were found. Let the user know you cannot find relevant information to answer their question."
      : `You are a helpful assistant. Answer the user's question using ONLY the context below. Cite sources by their number [1], [2], etc. If the answer is not in the context, say so clearly.

Context:
${contextBlocks}`;

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

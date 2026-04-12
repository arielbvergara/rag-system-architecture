import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { RagService } from "../services/ragService";
import type { IVectorStore, SearchResult } from "../vectorstore/interfaces";
import type { IEmbeddingProvider, ILLMProvider } from "../providers/interfaces";
import type { Chunk, ChatMessage } from "../types";
import { EmbeddingService } from "../services/embeddingService";

// ── Fakes ──────────────────────────────────────────────────────────────────────

function makeChunk(documentId: string, content: string): Chunk {
  return {
    id: randomUUID(),
    content,
    metadata: { documentId, filename: "test.txt", chunkIndex: 0, charStart: 0, charEnd: content.length },
  };
}

function makeSearchResult(documentId: string, content: string): SearchResult {
  const chunk = makeChunk(documentId, content);
  return { chunkId: chunk.id, documentId, score: 0.9, chunk };
}

function makeFakeEmbeddingProvider(): IEmbeddingProvider {
  return {
    embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    getDimensions: vi.fn().mockReturnValue(3),
  };
}

function makeFakeVectorStore(results: SearchResult[] = []): IVectorStore {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue(results),
    deleteByDocumentId: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
  };
}

function makeFakeLLMProvider(answer = "Mocked answer"): ILLMProvider {
  return {
    generateResponse: vi.fn().mockResolvedValue(answer),
    generateStream: vi.fn().mockImplementation(async function* () {
      yield answer;
    }),
  };
}

// We bypass the config.rag.dataDir by overriding filesystem methods
vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue({ code: "ENOENT" }),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("RagService", () => {
  let ragService: RagService;

  beforeEach(() => {
    vi.clearAllMocks();
    const embeddingProvider = makeFakeEmbeddingProvider();
    const embeddingService = new EmbeddingService(embeddingProvider);
    const vectorStore = makeFakeVectorStore([
      makeSearchResult("doc-1", "The capital of France is Paris."),
    ]);
    const llmProvider = makeFakeLLMProvider("Paris is the capital of France.");

    ragService = new RagService(embeddingService, vectorStore, llmProvider);
  });

  // ── chat ───────────────────────────────────────────────────────────────────

  it("chat_ShouldReturnAnswer_WhenCalled", async () => {
    const response = await ragService.chat("session-1", "What is the capital of France?");
    expect(response.answer).toBe("Paris is the capital of France.");
  });

  it("chat_ShouldIncludeCitations_WhenContextIsRetrieved", async () => {
    const response = await ragService.chat("session-2", "What is the capital of France?");
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.citations[0].filename).toBe("test.txt");
  });

  it("chat_ShouldReturnEmptyCitations_WhenVectorStoreIsEmpty", async () => {
    const embeddingProvider = makeFakeEmbeddingProvider();
    const embeddingService = new EmbeddingService(embeddingProvider);
    const emptyStore = makeFakeVectorStore([]);
    const llmProvider = makeFakeLLMProvider("I don't have information about that.");

    const service = new RagService(embeddingService, emptyStore, llmProvider);
    const response = await service.chat("session-empty", "What is the capital of France?");

    expect(response.citations).toHaveLength(0);
    expect(response.answer).toBeTruthy();
  });

  it("chat_ShouldMaintainHistory_WhenCalledMultipleTimes", async () => {
    const llmProvider = makeFakeLLMProvider("Follow-up answer.");
    const embeddingProvider = makeFakeEmbeddingProvider();
    const embeddingService = new EmbeddingService(embeddingProvider);
    const vectorStore = makeFakeVectorStore([makeSearchResult("doc-1", "Some context.")]);
    const service = new RagService(embeddingService, vectorStore, llmProvider);

    await service.chat("session-hist", "First question?");
    await service.chat("session-hist", "Follow-up question?");

    // generateResponse should have been called twice with growing history
    expect(llmProvider.generateResponse).toHaveBeenCalledTimes(2);
    const secondCall = (llmProvider.generateResponse as ReturnType<typeof vi.fn>).mock.calls[1];
    const history: ChatMessage[] = secondCall[1];
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  // ── chatStream ─────────────────────────────────────────────────────────────

  it("chatStream_ShouldYieldDeltaChunks_WhenStreaming", async () => {
    const chunks = [];
    for await (const chunk of ragService.chatStream("session-stream", "Stream test?")) {
      chunks.push(chunk);
    }

    const delta = chunks.find((c) => c.type === "delta");
    const done = chunks.find((c) => c.type === "done");
    expect(delta).toBeDefined();
    expect(done).toBeDefined();
  });

  it("chatStream_ShouldEmitCitations_WhenContextIsRetrieved", async () => {
    const chunks = [];
    for await (const chunk of ragService.chatStream("session-cite", "Cite test?")) {
      chunks.push(chunk);
    }

    const citationChunk = chunks.find((c) => c.type === "citations");
    expect(citationChunk).toBeDefined();
    expect(citationChunk?.citations?.length).toBeGreaterThan(0);
  });

  // ── clearSession ──────────────────────────────────────────────────────────

  it("clearSession_ShouldResetHistory_WhenCalled", async () => {
    await ragService.chat("session-clear", "First question?");
    ragService.clearSession("session-clear");

    const llmProvider = (ragService as unknown as { llmProvider: ILLMProvider }).llmProvider;
    (llmProvider.generateResponse as ReturnType<typeof vi.fn>).mockClear();

    await ragService.chat("session-clear", "After clear?");
    const callArgs = (llmProvider.generateResponse as ReturnType<typeof vi.fn>).mock.calls[0];
    const history: ChatMessage[] = callArgs[1];
    // Only the new message should be in history, not the old one
    expect(history).toHaveLength(1);
  });
});

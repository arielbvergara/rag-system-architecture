import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiEmbeddingProvider, GeminiLLMProvider, isRetryableGeminiError } from "../providers/gemini";

// ── Hoisted mock handles ───────────────────────────────────────────────────────
// vi.hoisted() runs before vi.mock() hoisting, making the refs available
// inside the factory without circular-reference problems.

const { mockSendMessage, mockSendMessageStream, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockSendMessage = vi.fn();
  const mockSendMessageStream = vi.fn();
  const mockStartChat = vi.fn().mockReturnValue({
    sendMessage: mockSendMessage,
    sendMessageStream: mockSendMessageStream,
  });
  const mockGetGenerativeModel = vi.fn().mockReturnValue({ startChat: mockStartChat });
  return { mockSendMessage, mockSendMessageStream, mockGetGenerativeModel };
});

vi.mock("@google/generative-ai", () => ({
  // Use a regular function (not arrow) so it can be called with `new`
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel: mockGetGenerativeModel };
  }),
}));

const { mockEmbedContent } = vi.hoisted(() => {
  const mockEmbedContent = vi.fn().mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.1) }] });
  return { mockEmbedContent };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return {
      models: {
        embedContent: mockEmbedContent,
      },
    };
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeError(statusPrefix: string): Error {
  return new Error(`Error fetching from https://example.com: ${statusPrefix} Service Error]`);
}

const HISTORY = [{ role: "user" as const, content: "Hello?" }];

// ── GeminiEmbeddingProvider ───────────────────────────────────────────────────

describe("GeminiEmbeddingProvider", () => {
  let provider: GeminiEmbeddingProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiEmbeddingProvider("fake-api-key");
  });

  it("embed_ShouldPassOutputDimensionality_WhenCalled", async () => {
    await provider.embed(["test text"]);

    expect(mockEmbedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-embedding-001",
        config: expect.objectContaining({ outputDimensionality: 768 }),
      })
    );
  });

  it("embed_ShouldReturnEmbeddingVectors_WhenApiResponds", async () => {
    const result = await provider.embed(["test text"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(768);
  });

  it("embed_ShouldCallApiOncePerText_WhenMultipleTextsProvided", async () => {
    await provider.embed(["text one", "text two", "text three"]);

    expect(mockEmbedContent).toHaveBeenCalledTimes(3);
  });

  it("getDimensions_ShouldReturn768_WhenCalled", () => {
    expect(provider.getDimensions()).toBe(768);
  });

  it("embed_ShouldReturnEmptyArray_WhenApiReturnsNoEmbeddings", async () => {
    mockEmbedContent.mockResolvedValueOnce({ embeddings: [{}] });

    const result = await provider.embed(["test"]);

    expect(result[0]).toEqual([]);
  });
});

// ── isRetryableGeminiError ─────────────────────────────────────────────────────

describe("isRetryableGeminiError", () => {
  it("isRetryableGeminiError_ShouldReturnTrue_For503Error", () => {
    expect(isRetryableGeminiError(makeError("[503"))).toBe(true);
  });

  it("isRetryableGeminiError_ShouldReturnTrue_For429Error", () => {
    expect(isRetryableGeminiError(makeError("[429"))).toBe(true);
  });

  it("isRetryableGeminiError_ShouldReturnTrue_For500Error", () => {
    expect(isRetryableGeminiError(makeError("[500"))).toBe(true);
  });

  it("isRetryableGeminiError_ShouldReturnFalse_For401Error", () => {
    expect(isRetryableGeminiError(makeError("[401"))).toBe(false);
  });

  it("isRetryableGeminiError_ShouldReturnFalse_For400Error", () => {
    expect(isRetryableGeminiError(makeError("[400"))).toBe(false);
  });

  it("isRetryableGeminiError_ShouldReturnFalse_WhenValueIsNotAnError", () => {
    expect(isRetryableGeminiError("string error")).toBe(false);
    expect(isRetryableGeminiError(null)).toBe(false);
    expect(isRetryableGeminiError(42)).toBe(false);
  });
});

// ── GeminiLLMProvider.generateResponse ────────────────────────────────────────

describe("GeminiLLMProvider.generateResponse", () => {
  let provider: GeminiLLMProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiLLMProvider("fake-api-key");
  });

  it("generateResponse_ShouldReturnAnswer_WhenPrimaryModelSucceeds", async () => {
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "The answer." } });

    const result = await provider.generateResponse("You are helpful.", HISTORY);

    expect(result.content).toBe("The answer.");
    expect(result.model).toBe("gemini-2.5-flash");
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("generateResponse_ShouldFallbackToNextModel_When503IsReceived", async () => {
    mockSendMessage
      .mockRejectedValueOnce(makeError("[503")) // primary fails
      .mockResolvedValueOnce({ response: { text: () => "Fallback answer." } }); // fallback 1 succeeds

    const result = await provider.generateResponse("You are helpful.", HISTORY);

    expect(result.content).toBe("Fallback answer.");
    expect(result.model).toBe("gemini-2.5-flash-lite");
    expect(mockSendMessage).toHaveBeenCalledTimes(2);
  });

  it("generateResponse_ShouldExhaustAllModels_WhenAllReturn503", async () => {
    mockSendMessage.mockRejectedValue(makeError("[503"));

    await expect(provider.generateResponse("You are helpful.", HISTORY)).rejects.toThrow("[503");
    // 4 attempts: primary + 3 fallbacks (the chain has 4 entries including the repeated primary)
    expect(mockSendMessage).toHaveBeenCalledTimes(4);
  });

  it("generateResponse_ShouldThrowImmediately_WhenNonRetryableErrorOccurs", async () => {
    mockSendMessage.mockRejectedValueOnce(makeError("[401"));

    await expect(provider.generateResponse("You are helpful.", HISTORY)).rejects.toThrow("[401");
    // Must NOT attempt any fallback models
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it("generateResponse_ShouldSucceedOnThirdAttempt_WhenFirstTwoFail", async () => {
    mockSendMessage
      .mockRejectedValueOnce(makeError("[503")) // primary fails
      .mockRejectedValueOnce(makeError("[503")) // fallback 1 fails
      .mockResolvedValueOnce({ response: { text: () => "Third time lucky." } }); // fallback 2 succeeds

    const result = await provider.generateResponse("You are helpful.", HISTORY);

    expect(result.content).toBe("Third time lucky.");
    expect(result.model).toBe("gemini-2-flash");
    expect(mockSendMessage).toHaveBeenCalledTimes(3);
  });
});

// ── GeminiLLMProvider.generateStream ──────────────────────────────────────────

describe("GeminiLLMProvider.generateStream", () => {
  let provider: GeminiLLMProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiLLMProvider("fake-api-key");
  });

  async function* makeStream(chunks: string[]) {
    for (const chunk of chunks) {
      yield { text: () => chunk };
    }
  }

  async function collectStream(
    gen: AsyncGenerator<string, string, unknown>
  ): Promise<{ deltas: string[]; model: string }> {
    const deltas: string[] = [];
    while (true) {
      const step = await gen.next();
      if (step.done) return { deltas, model: step.value };
      deltas.push(step.value);
    }
  }

  it("generateStream_ShouldYieldDeltas_WhenPrimaryModelSucceeds", async () => {
    mockSendMessageStream.mockResolvedValueOnce({ stream: makeStream(["Hello ", "world"]) });

    const { deltas } = await collectStream(provider.generateStream("You are helpful.", HISTORY));

    expect(deltas).toEqual(["Hello ", "world"]);
    expect(mockSendMessageStream).toHaveBeenCalledTimes(1);
  });

  it("generateStream_ShouldReturnModelName_WhenPrimaryModelSucceeds", async () => {
    mockSendMessageStream.mockResolvedValueOnce({ stream: makeStream(["Hello"]) });

    const { model } = await collectStream(provider.generateStream("You are helpful.", HISTORY));

    expect(model).toBe("gemini-2.5-flash");
  });

  it("generateStream_ShouldReturnFallbackModelName_When503IsReceived", async () => {
    mockSendMessageStream
      .mockRejectedValueOnce(makeError("[503"))
      .mockResolvedValueOnce({ stream: makeStream(["Fallback"]) });

    const { model } = await collectStream(provider.generateStream("You are helpful.", HISTORY));

    expect(model).toBe("gemini-2.5-flash-lite");
  });

  it("generateStream_ShouldFallbackToNextModel_When503IsReceived", async () => {
    mockSendMessageStream
      .mockRejectedValueOnce(makeError("[503")) // primary fails before streaming
      .mockResolvedValueOnce({ stream: makeStream(["Fallback response."]) }); // fallback 1 works

    const { deltas } = await collectStream(provider.generateStream("You are helpful.", HISTORY));

    expect(deltas).toEqual(["Fallback response."]);
    expect(mockSendMessageStream).toHaveBeenCalledTimes(2);
  });

  it("generateStream_ShouldThrowImmediately_WhenNonRetryableErrorOccurs", async () => {
    mockSendMessageStream.mockRejectedValueOnce(makeError("[401"));

    await expect(
      collectStream(provider.generateStream("You are helpful.", HISTORY))
    ).rejects.toThrow("[401");
    expect(mockSendMessageStream).toHaveBeenCalledTimes(1);
  });

  it("generateStream_ShouldExhaustAllModels_WhenAllReturn503", async () => {
    mockSendMessageStream.mockRejectedValue(makeError("[503"));

    await expect(
      collectStream(provider.generateStream("You are helpful.", HISTORY))
    ).rejects.toThrow("[503");
    expect(mockSendMessageStream).toHaveBeenCalledTimes(4);
  });
});

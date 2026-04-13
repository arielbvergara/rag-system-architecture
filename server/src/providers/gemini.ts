import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IEmbeddingProvider, ILLMProvider, LLMGenerateResult } from "./interfaces";
import type { ChatMessage } from "../types";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

/**
 * Ordered list of generation models to attempt.
 * When the primary model returns a retryable error (e.g. 503 overload), the
 * provider walks down the chain until one succeeds or all are exhausted.
 * The primary model is intentionally repeated at the end so that a brief
 * retry is made after the alternatives have been tried.
 */
const GENERATION_MODEL_CHAIN: readonly string[] = [
  "gemini-2.5-flash",  // primary
  "gemini-2.5-flash-lite",  // fallback 1
  "gemini-2-flash",  // fallback 2
  "gemini-2-flash-lite",  // fallback 3
];

/**
 * HTTP status prefixes that indicate a transient server-side problem.
 * The Google SDK embeds the status code in the error message, e.g.
 * "[503 Service Unavailable]", so simple substring matching is sufficient.
 */
const RETRYABLE_STATUS_PATTERNS: readonly string[] = [
  "[503", // Service Unavailable (overloaded)
  "[429", // Too Many Requests (rate limited)
  "[408", // Request Timeout
  "[500", // Internal Server Error
  "[502", // Bad Gateway
  "[504", // Gateway Timeout
];

export function isRetryableGeminiError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return RETRYABLE_STATUS_PATTERNS.some((pattern) => err.message.includes(pattern));
}

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const result = await this.ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      });
      results.push(result.embeddings?.[0]?.values ?? []);
    }
    return results;
  }

  getDimensions(): number {
    return EMBEDDING_DIMENSIONS;
  }
}

export class GeminiLLMProvider implements ILLMProvider {
  private readonly genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(systemPrompt: string, history: ChatMessage[]): Promise<LLMGenerateResult> {
    const geminiHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));
    const lastMessage = history[history.length - 1];

    let lastError: unknown;

    for (const modelId of GENERATION_MODEL_CHAIN) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelId,
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(lastMessage.content);
        return { content: result.response.text(), model: modelId };
      } catch (err) {
        if (isRetryableGeminiError(err)) {
          lastError = err;
          continue; // try the next model in the chain
        }
        throw err; // non-retryable (e.g. 401, 400) — fail immediately
      }
    }

    throw lastError; // all models exhausted
  }

  async *generateStream(
    systemPrompt: string,
    history: ChatMessage[]
  ): AsyncGenerator<string, string, unknown> {
    const geminiHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));
    const lastMessage = history[history.length - 1];

    let lastError: unknown;

    for (const modelId of GENERATION_MODEL_CHAIN) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelId,
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history: geminiHistory });
        // sendMessageStream throws before yielding anything if the model is
        // overloaded, so the fallback logic activates cleanly here.
        const stream = await chat.sendMessageStream(lastMessage.content);

        for await (const chunk of stream.stream) {
          const text = chunk.text();
          if (text) yield text;
        }
        return modelId; // success — return the model that was actually used
      } catch (err) {
        if (isRetryableGeminiError(err)) {
          lastError = err;
          continue; // try the next model in the chain
        }
        throw err; // non-retryable — fail immediately
      }
    }

    throw lastError; // all models exhausted
  }
}

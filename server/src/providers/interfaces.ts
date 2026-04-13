import type { ChatMessage } from "../types";

export interface IEmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

/**
 * Result returned by generateResponse, including the model that was actually
 * used (relevant for providers with fallback chains, e.g. Gemini).
 */
export interface LLMGenerateResult {
  content: string;
  model: string;
}

export interface ILLMProvider {
  generateResponse(systemPrompt: string, history: ChatMessage[]): Promise<LLMGenerateResult>;
  /**
   * Yields text deltas as they arrive. The generator return value (accessible
   * after the generator is exhausted) is the model name that was actually used.
   */
  generateStream(
    systemPrompt: string,
    history: ChatMessage[]
  ): AsyncGenerator<string, string, unknown>;
}

import type { ChatMessage } from "../types";

export interface IEmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

export interface ILLMProvider {
  generateResponse(systemPrompt: string, history: ChatMessage[]): Promise<string>;
  generateStream(systemPrompt: string, history: ChatMessage[]): AsyncIterable<string>;
}

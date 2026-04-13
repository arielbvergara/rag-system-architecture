import type { IEmbeddingProvider, ILLMProvider } from "./interfaces";
import { GeminiEmbeddingProvider, GeminiLLMProvider } from "./gemini";
import { OpenAIEmbeddingProvider, OpenAILLMProvider } from "./openai";
import { config } from "../config";

export interface Providers {
  embedding: IEmbeddingProvider;
  llm: ILLMProvider;
}

export function createProviders(): Providers {
  const { provider, geminiApiKey, openaiApiKey, openaiBaseUrl, openaiModel, openaiEmbeddingModel } =
    config.ai;

  if (provider === "openai") {
    return {
      embedding: new OpenAIEmbeddingProvider(openaiApiKey, openaiEmbeddingModel, openaiBaseUrl),
      llm: new OpenAILLMProvider(openaiApiKey, openaiModel, openaiBaseUrl),
    };
  }

  // Default: gemini
  return {
    embedding: new GeminiEmbeddingProvider(geminiApiKey),
    llm: new GeminiLLMProvider(geminiApiKey),
  };
}

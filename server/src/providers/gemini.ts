import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IEmbeddingProvider, ILLMProvider } from "./interfaces";
import type { ChatMessage } from "../types";

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSIONS = 768;
const GENERATION_MODEL = "gemini-2.5-flash";

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private readonly genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const results = await Promise.all(
      texts.map((text) => model.embedContent(text))
    );
    return results.map((r) => r.embedding.values);
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

  async generateResponse(systemPrompt: string, history: ChatMessage[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: GENERATION_MODEL,
      systemInstruction: systemPrompt,
    });

    const geminiHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));

    const lastMessage = history[history.length - 1];
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  }

  async *generateStream(systemPrompt: string, history: ChatMessage[]): AsyncIterable<string> {
    const model = this.genAI.getGenerativeModel({
      model: GENERATION_MODEL,
      systemInstruction: systemPrompt,
    });

    const geminiHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));

    const lastMessage = history[history.length - 1];
    const chat = model.startChat({ history: geminiHistory });
    const stream = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}

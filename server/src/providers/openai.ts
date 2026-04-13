import OpenAI from "openai";
import type { IEmbeddingProvider, ILLMProvider, LLMGenerateResult } from "./interfaces";
import type { ChatMessage } from "../types";

const OPENAI_EMBEDDING_DIMENSIONS: Record<string, number> = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
  "text-embedding-ada-002": 1536,
};

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }

  getDimensions(): number {
    return OPENAI_EMBEDDING_DIMENSIONS[this.model] ?? 1536;
  }
}

export class OpenAILLMProvider implements ILLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
    this.model = model;
  }

  async generateResponse(systemPrompt: string, history: ChatMessage[]): Promise<LLMGenerateResult> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
    });

    return {
      content: response.choices[0]?.message?.content ?? "",
      model: this.model,
    };
  }

  async *generateStream(
    systemPrompt: string,
    history: ChatMessage[]
  ): AsyncGenerator<string, string, unknown> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }

    return this.model;
  }
}

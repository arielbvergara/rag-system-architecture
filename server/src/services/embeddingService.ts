import type { IEmbeddingProvider } from "../providers/interfaces";
import type { Chunk, EmbeddedChunk } from "../types";

const BATCH_SIZE = 20;

export class EmbeddingService {
  private readonly provider: IEmbeddingProvider;

  constructor(provider: IEmbeddingProvider) {
    this.provider = provider;
  }

  async embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    const embedded: EmbeddedChunk[] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const vectors = await this.provider.embed(batch.map((c) => c.content));
      batch.forEach((chunk, idx) => {
        embedded.push({ ...chunk, vector: vectors[idx] });
      });
    }

    return embedded;
  }

  async embedQuery(query: string): Promise<number[]> {
    const vectors = await this.provider.embed([query]);
    return vectors[0];
  }
}

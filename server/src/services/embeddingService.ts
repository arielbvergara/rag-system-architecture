import type { IEmbeddingProvider } from "../providers/interfaces";
import type { Chunk, EmbeddedChunk } from "../types";

const BATCH_SIZE = 20;
const EMBED_MAX_ATTEMPTS = 3;
const EMBED_BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= EMBED_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < EMBED_MAX_ATTEMPTS) {
        await sleep(EMBED_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError;
}

export class EmbeddingService {
  private readonly provider: IEmbeddingProvider;

  constructor(provider: IEmbeddingProvider) {
    this.provider = provider;
  }

  async embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    const embedded: EmbeddedChunk[] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const vectors = await withRetry(() =>
        this.provider.embed(batch.map((c) => c.content))
      );
      batch.forEach((chunk, idx) => {
        embedded.push({ ...chunk, vector: vectors[idx] });
      });
    }

    return embedded;
  }

  async embedQuery(query: string): Promise<number[]> {
    const vectors = await withRetry(() => this.provider.embed([query]));
    return vectors[0];
  }
}

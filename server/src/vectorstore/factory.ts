import type { IEmbeddingProvider } from "../providers/interfaces";
import { config } from "../config";
import type { IVectorStore } from "./interfaces";
import { LocalFileVectorStore } from "./localFileStore";
import { QdrantVectorStore } from "./qdrantStore";

/**
 * Select the vector store implementation based on `VECTOR_STORE_TYPE`.
 *
 * Mirrors the pattern used by `providers/factory.ts` so the DI container
 * stays a single straight-line function. The embedding provider is passed
 * in because remote stores (Qdrant) need the vector dimension at
 * collection-creation time, and `IEmbeddingProvider.getDimensions()` is
 * already the authoritative source.
 */
export function createVectorStore(embedding: IEmbeddingProvider): IVectorStore {
  const { type, qdrant } = config.vectorStore;

  if (type === "qdrant") {
    if (!qdrant.url) {
      throw new Error(
        'VECTOR_STORE_TYPE="qdrant" requires QDRANT_URL (e.g. http://localhost:6333 or https://<cluster>.cloud.qdrant.io:6333)'
      );
    }
    return new QdrantVectorStore({
      url: qdrant.url,
      apiKey: qdrant.apiKey || undefined,
      collectionName: qdrant.collection,
      vectorSize: embedding.getDimensions(),
    });
  }

  // Default: local JSON file
  return new LocalFileVectorStore(config.rag.dataDir);
}

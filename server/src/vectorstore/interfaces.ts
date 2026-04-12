import type { Chunk, VectorFilter } from "../types";

export interface SearchResult {
  chunkId: string;
  documentId: string;
  score: number;
  chunk: Chunk;
}

export interface IVectorStore {
  upsert(id: string, vector: number[], chunk: Chunk): Promise<void>;
  search(queryVector: number[], topK: number, filter?: VectorFilter): Promise<SearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<void>;
  count(): Promise<number>;
}

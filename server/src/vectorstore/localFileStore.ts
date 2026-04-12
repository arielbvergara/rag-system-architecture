import fs from "fs/promises";
import path from "path";
import type { Chunk, VectorFilter } from "../types";
import type { IVectorStore, SearchResult } from "./interfaces";

interface StoredVector {
  id: string;
  documentId: string;
  vector: number[];
}

interface VectorStoreData {
  vectors: StoredVector[];
  chunks: Record<string, Chunk>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class LocalFileVectorStore implements IVectorStore {
  private readonly storePath: string;
  private data: VectorStoreData = { vectors: [], chunks: {} };
  private loaded = false;

  constructor(dataDir: string) {
    this.storePath = path.join(dataDir, "vectorstore.json");
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.storePath, "utf-8");
      this.data = JSON.parse(raw) as VectorStoreData;
    } catch {
      this.data = { vectors: [], chunks: {} };
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(this.data), "utf-8");
  }

  async upsert(id: string, vector: number[], chunk: Chunk): Promise<void> {
    await this.load();
    const existing = this.data.vectors.findIndex((v) => v.id === id);
    const record: StoredVector = { id, documentId: chunk.metadata.documentId, vector };
    if (existing >= 0) {
      this.data.vectors[existing] = record;
    } else {
      this.data.vectors.push(record);
    }
    this.data.chunks[id] = chunk;
    await this.persist();
  }

  async search(queryVector: number[], topK: number, filter?: VectorFilter): Promise<SearchResult[]> {
    await this.load();

    let candidates = this.data.vectors;
    if (filter?.documentIds && filter.documentIds.length > 0) {
      const allowed = new Set(filter.documentIds);
      candidates = candidates.filter((v) => allowed.has(v.documentId));
    }

    const scored = candidates.map((v) => ({
      chunkId: v.id,
      documentId: v.documentId,
      score: cosineSimilarity(queryVector, v.vector),
      chunk: this.data.chunks[v.id],
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((r) => r.chunk !== undefined);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.load();
    const idsToRemove = new Set(
      this.data.vectors.filter((v) => v.documentId === documentId).map((v) => v.id)
    );
    this.data.vectors = this.data.vectors.filter((v) => !idsToRemove.has(v.id));
    for (const id of idsToRemove) {
      delete this.data.chunks[id];
    }
    await this.persist();
  }

  async count(): Promise<number> {
    await this.load();
    return this.data.vectors.length;
  }
}

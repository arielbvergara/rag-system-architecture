import { QdrantClient } from "@qdrant/js-client-rest";
import type { Chunk, VectorFilter } from "../types";
import { getErrorMessage } from "../lib/errorUtils";
import type { IVectorStore, SearchResult } from "./interfaces";

export interface QdrantVectorStoreOptions {
  url: string;
  apiKey?: string;
  collectionName: string;
  vectorSize: number;
}

// Flat payload shape: mirrors Chunk.metadata plus `content`, so a single
// `retrieve` call reconstructs the full Chunk without a secondary store.
interface QdrantChunkPayload {
  content: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  charStart: number;
  charEnd: number;
}

const VECTOR_DISTANCE = "Cosine" as const;
const DOCUMENT_ID_FIELD = "documentId" as const;

export class QdrantVectorStore implements IVectorStore {
  private readonly client: QdrantClient;
  private readonly collectionName: string;
  private readonly vectorSize: number;
  private initPromise: Promise<void> | null = null;

  constructor(opts: QdrantVectorStoreOptions) {
    this.client = new QdrantClient({ url: opts.url, apiKey: opts.apiKey });
    this.collectionName = opts.collectionName;
    this.vectorSize = opts.vectorSize;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Lazily create the collection on first use. Mirrors the load-on-demand
   * pattern used by `LocalFileVectorStore`. A single-flight promise guards
   * against concurrent first-call races; on failure the guard is cleared so
   * the next call can retry instead of returning a poisoned promise.
   */
  private async ensureCollection(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doEnsureCollection();
    }
    return this.initPromise;
  }

  private async doEnsureCollection(): Promise<void> {
    try {
      const { collections } = await this.client.getCollections();
      const exists = collections.some((c) => c.name === this.collectionName);
      if (exists) return;

      await this.client.createCollection(this.collectionName, {
        vectors: { size: this.vectorSize, distance: VECTOR_DISTANCE },
      });
      // Index documentId so filter-based search and deleteByDocumentId are fast.
      // Swallow "already exists" when the collection was created concurrently.
      try {
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: DOCUMENT_ID_FIELD,
          field_schema: "keyword",
        });
      } catch {
        /* idempotent */
      }
    } catch (err) {
      this.initPromise = null;
      throw new Error(
        `Qdrant collection init failed: ${getErrorMessage(err, "unknown")}`,
        { cause: err }
      );
    }
  }

  // ── IVectorStore ───────────────────────────────────────────────────────────

  async upsert(id: string, vector: number[], chunk: Chunk): Promise<void> {
    await this.ensureCollection();
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id,
            vector,
            payload: this.chunkToPayload(chunk) as unknown as Record<string, unknown>,
          },
        ],
      });
    } catch (err) {
      throw new Error(`Qdrant upsert failed: ${getErrorMessage(err, "unknown")}`, { cause: err });
    }
  }

  async search(
    queryVector: number[],
    topK: number,
    filter?: VectorFilter
  ): Promise<SearchResult[]> {
    await this.ensureCollection();
    const qdrantFilter = this.buildDocumentIdFilter(filter);

    try {
      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit: topK,
        filter: qdrantFilter,
        with_payload: true,
        with_vector: false,
      });

      return results.map((r) => {
        const payload = r.payload as unknown as QdrantChunkPayload;
        return {
          chunkId: String(r.id),
          documentId: payload.documentId,
          score: r.score,
          chunk: this.payloadToChunk(String(r.id), payload),
        };
      });
    } catch (err) {
      throw new Error(`Qdrant search failed: ${getErrorMessage(err, "unknown")}`, { cause: err });
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.ensureCollection();
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [{ key: DOCUMENT_ID_FIELD, match: { value: documentId } }],
        },
      });
    } catch (err) {
      throw new Error(`Qdrant delete failed: ${getErrorMessage(err, "unknown")}`, { cause: err });
    }
  }

  async count(): Promise<number> {
    await this.ensureCollection();
    try {
      const result = await this.client.count(this.collectionName, { exact: true });
      return result.count;
    } catch (err) {
      throw new Error(`Qdrant count failed: ${getErrorMessage(err, "unknown")}`, { cause: err });
    }
  }

  async getChunk(chunkId: string): Promise<Chunk | null> {
    await this.ensureCollection();
    try {
      const results = await this.client.retrieve(this.collectionName, {
        ids: [chunkId],
        with_payload: true,
        with_vector: false,
      });
      if (results.length === 0) return null;
      const r = results[0];
      const payload = r.payload as unknown as QdrantChunkPayload;
      return this.payloadToChunk(String(r.id), payload);
    } catch (err) {
      throw new Error(`Qdrant retrieve failed: ${getErrorMessage(err, "unknown")}`, { cause: err });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildDocumentIdFilter(filter?: VectorFilter) {
    if (!filter?.documentIds || filter.documentIds.length === 0) return undefined;
    return {
      must: [{ key: DOCUMENT_ID_FIELD, match: { any: filter.documentIds } }],
    };
  }

  private chunkToPayload(chunk: Chunk): QdrantChunkPayload {
    return {
      content: chunk.content,
      documentId: chunk.metadata.documentId,
      filename: chunk.metadata.filename,
      chunkIndex: chunk.metadata.chunkIndex,
      pageNumber: chunk.metadata.pageNumber,
      charStart: chunk.metadata.charStart,
      charEnd: chunk.metadata.charEnd,
    };
  }

  private payloadToChunk(id: string, p: QdrantChunkPayload): Chunk {
    return {
      id,
      content: p.content,
      metadata: {
        documentId: p.documentId,
        filename: p.filename,
        chunkIndex: p.chunkIndex,
        pageNumber: p.pageNumber,
        charStart: p.charStart,
        charEnd: p.charEnd,
      },
    };
  }
}

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

/**
 * Extract a useful message from a Qdrant client error.
 *
 * The underlying `@qdrant/openapi-typescript-fetch` throws an `ApiError`
 * whose `.message` is just `response.statusText` (e.g. "Bad Request"). The
 * actionable detail lives in `.data` (the parsed response body) — Qdrant
 * typically returns `{ status: { error: "…dim mismatch…" }, time: … }`.
 * Falling back to `getErrorMessage` alone hides the root cause.
 */
function formatQdrantError(err: unknown): string {
  if (typeof err !== "object" || err === null) {
    return getErrorMessage(err, "unknown");
  }

  const apiError = err as {
    status?: number;
    statusText?: string;
    data?: unknown;
    message?: string;
  };

  if (typeof apiError.status !== "number") {
    return getErrorMessage(err, "unknown");
  }

  const detail = extractQdrantErrorDetail(apiError.data);
  const statusPrefix = `${apiError.status}${apiError.statusText ? ` (${apiError.statusText})` : ""}`;

  if (detail) return `${statusPrefix} — ${detail}`;
  if (apiError.message) return `${statusPrefix} — ${apiError.message}`;
  return statusPrefix;
}

function extractQdrantErrorDetail(data: unknown): string | null {
  // Direct string response
  if (typeof data === "string" && data.length > 0) return data;
  
  // Not an object - can't extract details
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;

  // Try common error field names
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.detail === "string") return obj.detail;
  
  // Try nested status.error (Qdrant's common pattern)
  if (typeof obj.status === "object" && obj.status !== null) {
    const statusError = (obj.status as Record<string, unknown>).error;
    if (typeof statusError === "string") return statusError;
  }
  
  // Fallback to status if it's a string
  if (typeof obj.status === "string") return obj.status;

  // Last resort: stringify the whole data object
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
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
      if (exists) {
        // Existing collection: validate vector size up-front so we fail with
        // a clear, actionable message instead of the opaque "Bad Request"
        // Qdrant returns on every subsequent upsert when dims disagree.
        await this.assertDimensionMatches();
        return;
      }

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
      // Dimension-mismatch errors are already descriptive — don't re-wrap.
      if (err instanceof Error && err.message.includes("vector size")) throw err;
      throw new Error(
        `Qdrant collection init failed: ${formatQdrantError(err)}`,
        { cause: err }
      );
    }
  }

  /**
   * Read the existing collection's configured vector size and compare it to
   * the current embedding provider's dimensions. On mismatch, throw an error
   * that names both numbers and the escape hatches (rename collection or
   * delete the existing one).
   */
  private async assertDimensionMatches(): Promise<void> {
    const info = (await this.client.getCollection(this.collectionName)) as {
      config?: {
        params?: {
          vectors?: { size?: number } | Record<string, { size?: number }>;
        };
      };
    };
    const vectors = info.config?.params?.vectors;
    if (!vectors) return; // Unknown shape — let the upsert surface it.

    // Qdrant returns either a single config `{ size, distance }` or a named-
    // vectors map `{ myVec: { size, distance } }`. We only create single-
    // vector collections, so the first branch is the common path.
    const existingSize =
      typeof (vectors as { size?: number }).size === "number"
        ? (vectors as { size: number }).size
        : Object.values(vectors as Record<string, { size?: number }>)
            .map((v) => v?.size)
            .find((s): s is number => typeof s === "number");

    if (typeof existingSize !== "number") return;

    if (existingSize !== this.vectorSize) {
      throw new Error(
        `Qdrant collection "${this.collectionName}" was created with vector size ${existingSize} ` +
          `but the current embedding provider produces size ${this.vectorSize}. ` +
          `Set QDRANT_COLLECTION to a different name, or delete the existing collection in Qdrant.`
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
      throw new Error(`Qdrant upsert failed: ${formatQdrantError(err)}`, { cause: err });
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
      throw new Error(`Qdrant search failed: ${formatQdrantError(err)}`, { cause: err });
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
      throw new Error(`Qdrant delete failed: ${formatQdrantError(err)}`, { cause: err });
    }
  }

  async count(): Promise<number> {
    await this.ensureCollection();
    try {
      const result = await this.client.count(this.collectionName, { exact: true });
      return result.count;
    } catch (err) {
      throw new Error(`Qdrant count failed: ${formatQdrantError(err)}`, { cause: err });
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
      throw new Error(`Qdrant retrieve failed: ${formatQdrantError(err)}`, { cause: err });
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

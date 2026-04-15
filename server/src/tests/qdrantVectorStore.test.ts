import { describe, it, expect, beforeEach, vi } from "vitest";
import { randomUUID } from "crypto";
import type { Chunk } from "../types";

// ─── In-memory Qdrant fake ───────────────────────────────────────────────────
// A small fake that implements the subset of the Qdrant REST API used by
// QdrantVectorStore. It exists only here (no runtime impact); its job is to
// prove that the store speaks the client API correctly, not to validate
// cosine math against a canonical source — LocalFileVectorStore remains the
// reference implementation.
//
// Defined inside vi.hoisted so the vi.mock factory below (which is hoisted
// above module-level code) can reference it without TDZ errors.

const { FakeQdrantClient, clientRef } = vi.hoisted(() => {
  interface FakePoint {
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }

  interface FakeCollection {
    name: string;
    vectorSize: number;
    distance: string;
    points: Map<string, FakePoint>;
    indexedFields: Set<string>;
  }

  function cosine(a: number[], b: number[]): number {
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

  type FilterCondition = { key: string; match: { value?: string; any?: string[] } };
  type QdrantFilter = { must?: FilterCondition[] };

  function payloadMatchesFilter(
    payload: Record<string, unknown>,
    filter?: QdrantFilter
  ): boolean {
    if (!filter?.must) return true;
    return filter.must.every((cond) => {
      const val = payload[cond.key];
      if (cond.match.value !== undefined) return val === cond.match.value;
      if (cond.match.any !== undefined) return cond.match.any.includes(val as string);
      return true;
    });
  }

  class FakeQdrantClient {
    readonly collections = new Map<string, FakeCollection>();
    readonly constructorArgs: unknown;
    readonly lastSearchFilter = vi.fn();

    constructor(args: unknown) {
      this.constructorArgs = args;
    }

    async getCollections() {
      return {
        collections: [...this.collections.values()].map((c) => ({ name: c.name })),
      };
    }

    async createCollection(
      name: string,
      opts: { vectors: { size: number; distance: string } }
    ) {
      this.collections.set(name, {
        name,
        vectorSize: opts.vectors.size,
        distance: opts.vectors.distance,
        points: new Map(),
        indexedFields: new Set(),
      });
      return true;
    }

    async createPayloadIndex(name: string, opts: { field_name: string }) {
      this.collections.get(name)?.indexedFields.add(opts.field_name);
      return { operation_id: 0, status: "completed" };
    }

    async upsert(
      name: string,
      opts: {
        points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>;
      }
    ) {
      const coll = this.collections.get(name);
      if (!coll) throw new Error(`unknown collection: ${name}`);
      for (const p of opts.points) {
        coll.points.set(String(p.id), {
          id: String(p.id),
          vector: p.vector,
          payload: p.payload,
        });
      }
      return { operation_id: 0, status: "completed" };
    }

    async search(
      name: string,
      opts: { vector: number[]; limit: number; filter?: QdrantFilter }
    ) {
      this.lastSearchFilter(opts.filter);
      const coll = this.collections.get(name);
      if (!coll) throw new Error(`unknown collection: ${name}`);
      return [...coll.points.values()]
        .filter((p) => payloadMatchesFilter(p.payload, opts.filter))
        .map((p) => ({
          id: p.id,
          version: 0,
          score: cosine(opts.vector, p.vector),
          payload: p.payload,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, opts.limit);
    }

    async delete(name: string, opts: { filter: QdrantFilter }) {
      const coll = this.collections.get(name);
      if (!coll) throw new Error(`unknown collection: ${name}`);
      for (const [id, p] of [...coll.points.entries()]) {
        if (payloadMatchesFilter(p.payload, opts.filter)) coll.points.delete(id);
      }
      return { operation_id: 0, status: "completed" };
    }

    async count(name: string) {
      const coll = this.collections.get(name);
      if (!coll) throw new Error(`unknown collection: ${name}`);
      return { count: coll.points.size };
    }

    async retrieve(name: string, opts: { ids: string[] }) {
      const coll = this.collections.get(name);
      if (!coll) throw new Error(`unknown collection: ${name}`);
      return opts.ids
        .map((id) => coll.points.get(String(id)))
        .filter((p): p is FakePoint => p !== undefined)
        .map((p) => ({ id: p.id, version: 0, payload: p.payload }));
    }
  }

  // Shared ref so tests can grab the most-recently-constructed fake.
  const clientRef: { latest: FakeQdrantClient | null } = { latest: null };
  return { FakeQdrantClient, clientRef };
});

vi.mock("@qdrant/js-client-rest", () => ({
  QdrantClient: class extends FakeQdrantClient {
    constructor(args: unknown) {
      super(args);
      clientRef.latest = this;
    }
  },
}));

function getLatestClient(): InstanceType<typeof FakeQdrantClient> {
  if (!clientRef.latest) throw new Error("no FakeQdrantClient has been constructed yet");
  return clientRef.latest;
}

// Import after mock so QdrantVectorStore receives the fake constructor.
import { QdrantVectorStore } from "../vectorstore/qdrantStore";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const COLLECTION = "test_chunks";
const VECTOR_SIZE = 4;

function makeChunk(documentId: string, chunkIndex = 0): Chunk {
  return {
    id: randomUUID(),
    content: `Chunk content ${chunkIndex}`,
    metadata: {
      documentId,
      filename: "test.txt",
      chunkIndex,
      charStart: chunkIndex * 100,
      charEnd: (chunkIndex + 1) * 100,
    },
  };
}

function makeVector(seed = 1): number[] {
  return Array.from({ length: VECTOR_SIZE }, (_, i) => (seed + i) / (VECTOR_SIZE * seed + 1));
}

function newStore(apiKey?: string): QdrantVectorStore {
  return new QdrantVectorStore({
    url: "http://localhost:6333",
    apiKey,
    collectionName: COLLECTION,
    vectorSize: VECTOR_SIZE,
  });
}

let store: QdrantVectorStore;

describe("QdrantVectorStore", () => {
  beforeEach(() => {
    store = newStore();
  });

  // ── upsert / count ─────────────────────────────────────────────────────────

  it("upsert_ShouldPersistVector_WhenCalled", async () => {
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(), chunk);
    expect(await store.count()).toBe(1);
  });

  it("upsert_ShouldUpdateExistingVector_WhenSameIdProvided", async () => {
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(1), chunk);
    await store.upsert(chunk.id, makeVector(2), chunk);
    expect(await store.count()).toBe(1);
  });

  // ── search ─────────────────────────────────────────────────────────────────

  it("search_ShouldReturnTopKResults_WhenVectorsAreStored", async () => {
    for (let i = 0; i < 5; i++) {
      const chunk = makeChunk("doc-1", i);
      await store.upsert(chunk.id, makeVector(i + 1), chunk);
    }
    const results = await store.search(makeVector(1), 3);
    expect(results).toHaveLength(3);
  });

  it("search_ShouldReturnEmptyArray_WhenStoreIsEmpty", async () => {
    const results = await store.search(makeVector(), 5);
    expect(results).toHaveLength(0);
  });

  it("search_ShouldFilterByDocumentId_WhenFilterProvided", async () => {
    const chunkA = makeChunk("doc-A");
    const chunkB = makeChunk("doc-B");
    await store.upsert(chunkA.id, makeVector(1), chunkA);
    await store.upsert(chunkB.id, makeVector(1), chunkB);

    const results = await store.search(makeVector(1), 10, { documentIds: ["doc-A"] });
    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe("doc-A");
  });

  it("search_ShouldPassDocumentIdsFilterToQdrant_WhenFilterProvided", async () => {
    const chunk = makeChunk("doc-A");
    await store.upsert(chunk.id, makeVector(1), chunk);
    await store.search(makeVector(1), 5, { documentIds: ["doc-A", "doc-B"] });

    expect(getLatestClient().lastSearchFilter).toHaveBeenLastCalledWith({
      must: [{ key: "documentId", match: { any: ["doc-A", "doc-B"] } }],
    });
  });

  it("search_ShouldOmitFilter_WhenNoFilterProvided", async () => {
    const chunk = makeChunk("doc-A");
    await store.upsert(chunk.id, makeVector(1), chunk);
    await store.search(makeVector(1), 5);

    expect(getLatestClient().lastSearchFilter).toHaveBeenLastCalledWith(undefined);
  });

  it("search_ShouldRankByCosineSimilarity_WhenMultipleVectorsPresent", async () => {
    const query = [1, 0, 0, 0];
    const closeChunk = makeChunk("doc-1", 0);
    const farChunk = makeChunk("doc-1", 1);
    await store.upsert(closeChunk.id, [0.99, 0.01, 0, 0], closeChunk);
    await store.upsert(farChunk.id, [0, 1, 0, 0], farChunk);

    const results = await store.search(query, 2);
    expect(results[0].chunkId).toBe(closeChunk.id);
  });

  // ── deleteByDocumentId ─────────────────────────────────────────────────────

  it("deleteByDocumentId_ShouldRemoveAllChunks_WhenDocumentDeleted", async () => {
    for (let i = 0; i < 3; i++) {
      const chunk = makeChunk("doc-to-delete", i);
      await store.upsert(chunk.id, makeVector(i + 1), chunk);
    }
    const keepChunk = makeChunk("doc-keep");
    await store.upsert(keepChunk.id, makeVector(9), keepChunk);

    await store.deleteByDocumentId("doc-to-delete");

    expect(await store.count()).toBe(1);
    const results = await store.search(makeVector(), 10);
    expect(results.every((r) => r.documentId === "doc-keep")).toBe(true);
  });

  it("deleteByDocumentId_ShouldBeIdempotent_WhenDocumentDoesNotExist", async () => {
    await expect(store.deleteByDocumentId("nonexistent")).resolves.not.toThrow();
  });

  // ── getChunk ───────────────────────────────────────────────────────────────

  it("getChunk_ShouldReturnChunk_WhenChunkExists", async () => {
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(), chunk);
    const found = await store.getChunk(chunk.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(chunk.id);
    expect(found?.metadata.documentId).toBe("doc-1");
  });

  it("getChunk_ShouldReturnNull_WhenChunkDoesNotExist", async () => {
    const result = await store.getChunk("nonexistent-chunk-id");
    expect(result).toBeNull();
  });

  // ── Collection lifecycle ───────────────────────────────────────────────────

  it("ensureCollection_ShouldCreateCollection_WhenAbsent", async () => {
    // First call triggers init.
    await store.count();
    expect(getLatestClient().collections.has(COLLECTION)).toBe(true);
    const created = getLatestClient().collections.get(COLLECTION)!;
    expect(created.vectorSize).toBe(VECTOR_SIZE);
    expect(created.distance).toBe("Cosine");
  });

  it("ensureCollection_ShouldIndexDocumentIdField_WhenCollectionIsCreated", async () => {
    await store.count();
    const created = getLatestClient().collections.get(COLLECTION)!;
    expect(created.indexedFields.has("documentId")).toBe(true);
  });

  it("ensureCollection_ShouldReuseCollection_WhenPresent", async () => {
    await store.count(); // creates collection
    const createSpy = vi.spyOn(getLatestClient(), "createCollection");
    await store.count(); // should NOT create again
    await store.count();
    expect(createSpy).not.toHaveBeenCalled();
  });

  // ── Error wrapping ─────────────────────────────────────────────────────────

  it("upsert_ShouldWrapErrors_WhenClientThrows", async () => {
    await store.count(); // trigger collection creation so we can mutate the client safely
    vi.spyOn(getLatestClient(), "upsert").mockRejectedValueOnce(new Error("boom"));
    const chunk = makeChunk("doc-1");
    await expect(store.upsert(chunk.id, makeVector(), chunk)).rejects.toThrow(
      /Qdrant upsert failed: boom/
    );
  });

  it("search_ShouldWrapErrors_WhenClientThrows", async () => {
    await store.count();
    vi.spyOn(getLatestClient(), "search").mockRejectedValueOnce(new Error("network"));
    await expect(store.search(makeVector(), 5)).rejects.toThrow(/Qdrant search failed: network/);
  });

  it("deleteByDocumentId_ShouldWrapErrors_WhenClientThrows", async () => {
    await store.count();
    vi.spyOn(getLatestClient(), "delete").mockRejectedValueOnce(new Error("timeout"));
    await expect(store.deleteByDocumentId("doc-1")).rejects.toThrow(
      /Qdrant delete failed: timeout/
    );
  });

  // ── Constructor / client wiring ────────────────────────────────────────────

  it("constructor_ShouldForwardApiKey_WhenProvided", async () => {
    newStore("secret-key");
    expect(getLatestClient().constructorArgs).toEqual({
      url: "http://localhost:6333",
      apiKey: "secret-key",
    });
  });

  it("constructor_ShouldOmitApiKey_WhenUndefined", async () => {
    newStore(undefined);
    expect(getLatestClient().constructorArgs).toEqual({
      url: "http://localhost:6333",
      apiKey: undefined,
    });
  });
});

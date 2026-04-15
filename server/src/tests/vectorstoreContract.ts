import { it, expect } from "vitest";
import { randomUUID } from "crypto";
import type { Chunk } from "../types";
import type { IVectorStore } from "../vectorstore/interfaces";

/**
 * Behavioral contract every `IVectorStore` implementation must satisfy.
 *
 * Consumed by the per-implementation test file via
 * `runVectorStoreContract(async () => new MyStore(...))`. Keeping the
 * contract here (rather than duplicating tests in each implementation's
 * file) guarantees parity: a bug that breaks one implementation can't
 * hide in the other.
 *
 * Note: not named `*.test.ts` on purpose — vitest only picks up files
 * matching its include pattern, so this module will not run as a
 * standalone test suite.
 */

const VECTOR_DIMS = 4;

export function makeChunk(documentId: string, chunkIndex = 0): Chunk {
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

export function makeVector(seed = 1): number[] {
  return Array.from(
    { length: VECTOR_DIMS },
    (_, i) => (seed + i) / (VECTOR_DIMS * seed + 1)
  );
}

export interface VectorStoreContractOptions {
  /** Optional override of the default 4-dimension vectors used throughout the suite. */
  dims?: number;
}

/**
 * Run the shared contract against a store factory. The factory is invoked
 * per test case so each test starts with a fresh, empty store.
 */
export function runVectorStoreContract(
  factory: () => IVectorStore | Promise<IVectorStore>,
  _opts: VectorStoreContractOptions = {}
): void {
  // ── upsert / count ────────────────────────────────────────────────────────

  it("upsert_ShouldPersistVector_WhenCalled", async () => {
    const store = await factory();
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(), chunk);
    expect(await store.count()).toBe(1);
  });

  it("upsert_ShouldUpdateExistingVector_WhenSameIdProvided", async () => {
    const store = await factory();
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(1), chunk);
    await store.upsert(chunk.id, makeVector(2), chunk);
    expect(await store.count()).toBe(1);
  });

  // ── search ────────────────────────────────────────────────────────────────

  it("search_ShouldReturnTopKResults_WhenVectorsAreStored", async () => {
    const store = await factory();
    for (let i = 0; i < 5; i++) {
      const chunk = makeChunk("doc-1", i);
      await store.upsert(chunk.id, makeVector(i + 1), chunk);
    }
    const results = await store.search(makeVector(1), 3);
    expect(results).toHaveLength(3);
  });

  it("search_ShouldReturnEmptyArray_WhenStoreIsEmpty", async () => {
    const store = await factory();
    const results = await store.search(makeVector(), 5);
    expect(results).toHaveLength(0);
  });

  it("search_ShouldFilterByDocumentId_WhenFilterProvided", async () => {
    const store = await factory();
    const chunkA = makeChunk("doc-A");
    const chunkB = makeChunk("doc-B");
    await store.upsert(chunkA.id, makeVector(1), chunkA);
    await store.upsert(chunkB.id, makeVector(1), chunkB);

    const results = await store.search(makeVector(1), 10, { documentIds: ["doc-A"] });
    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe("doc-A");
  });

  it("search_ShouldRankByCosineSimilarity_WhenMultipleVectorsPresent", async () => {
    const store = await factory();
    const query = [1, 0, 0, 0];
    const closeChunk = makeChunk("doc-1", 0);
    const farChunk = makeChunk("doc-1", 1);
    await store.upsert(closeChunk.id, [0.99, 0.01, 0, 0], closeChunk);
    await store.upsert(farChunk.id, [0, 1, 0, 0], farChunk);

    const results = await store.search(query, 2);
    expect(results[0].chunkId).toBe(closeChunk.id);
  });

  // ── deleteByDocumentId ────────────────────────────────────────────────────

  it("deleteByDocumentId_ShouldRemoveAllChunks_WhenDocumentDeleted", async () => {
    const store = await factory();
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
    const store = await factory();
    await expect(store.deleteByDocumentId("nonexistent")).resolves.not.toThrow();
  });

  // ── getChunk ──────────────────────────────────────────────────────────────

  it("getChunk_ShouldReturnChunk_WhenChunkExists", async () => {
    const store = await factory();
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(), chunk);
    const found = await store.getChunk(chunk.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(chunk.id);
    expect(found?.metadata.documentId).toBe("doc-1");
  });

  it("getChunk_ShouldReturnNull_WhenChunkDoesNotExist", async () => {
    const store = await factory();
    const result = await store.getChunk("nonexistent-chunk-id");
    expect(result).toBeNull();
  });
}

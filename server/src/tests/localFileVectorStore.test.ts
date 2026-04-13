import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { LocalFileVectorStore } from "../vectorstore/localFileStore";
import type { Chunk } from "../types";

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

function makeVector(dims = 4, seed = 1): number[] {
  return Array.from({ length: dims }, (_, i) => (seed + i) / (dims * seed + 1));
}

let tmpDir: string;
let store: LocalFileVectorStore;

describe("LocalFileVectorStore", () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rag-test-"));
    store = new LocalFileVectorStore(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ── upsert / count ─────────────────────────────────────────────────────────

  it("upsert_ShouldPersistVector_WhenCalled", async () => {
    const chunk = makeChunk("doc-1");
    await store.upsert(chunk.id, makeVector(), chunk);
    expect(await store.count()).toBe(1);
  });

  it("upsert_ShouldUpdateExistingVector_WhenSameIdProvided", async () => {
    const chunk = makeChunk("doc-1");
    const newVector = makeVector(4, 2);
    await store.upsert(chunk.id, makeVector(), chunk);
    await store.upsert(chunk.id, newVector, chunk);
    expect(await store.count()).toBe(1);
  });

  // ── search ─────────────────────────────────────────────────────────────────

  it("search_ShouldReturnTopKResults_WhenVectorsAreStored", async () => {
    for (let i = 0; i < 5; i++) {
      const chunk = makeChunk("doc-1", i);
      await store.upsert(chunk.id, makeVector(4, i + 1), chunk);
    }
    const results = await store.search(makeVector(4, 1), 3);
    expect(results).toHaveLength(3);
  });

  it("search_ShouldReturnEmptyArray_WhenStoreIsEmpty", async () => {
    const results = await store.search(makeVector(), 5);
    expect(results).toHaveLength(0);
  });

  it("search_ShouldFilterByDocumentId_WhenFilterProvided", async () => {
    const chunkA = makeChunk("doc-A");
    const chunkB = makeChunk("doc-B");
    await store.upsert(chunkA.id, makeVector(4, 1), chunkA);
    await store.upsert(chunkB.id, makeVector(4, 1), chunkB);

    const results = await store.search(makeVector(4, 1), 10, { documentIds: ["doc-A"] });
    expect(results.every((r) => r.documentId === "doc-A")).toBe(true);
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
      await store.upsert(chunk.id, makeVector(4, i + 1), chunk);
    }
    const keepChunk = makeChunk("doc-keep");
    await store.upsert(keepChunk.id, makeVector(4, 9), keepChunk);

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

  // ── persistence ────────────────────────────────────────────────────────────

  it("search_ShouldReturnResults_WhenStoreIsReloadedFromDisk", async () => {
    const chunk = makeChunk("doc-persist");
    await store.upsert(chunk.id, makeVector(4, 5), chunk);

    // Create a new instance pointing to the same directory
    const store2 = new LocalFileVectorStore(tmpDir);
    const results = await store2.search(makeVector(4, 5), 1);
    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe("doc-persist");
  });
});

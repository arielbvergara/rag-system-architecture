import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { LocalFileVectorStore } from "../vectorstore/localFileStore";
import { runVectorStoreContract, makeChunk, makeVector } from "./vectorstoreContract";

let tmpDir: string;

describe("LocalFileVectorStore", () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rag-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // Behavioral contract shared with every IVectorStore implementation.
  runVectorStoreContract(() => new LocalFileVectorStore(tmpDir));

  // ── File-system-specific behavior (not part of the shared contract) ──────

  it("search_ShouldReturnResults_WhenStoreIsReloadedFromDisk", async () => {
    const store1 = new LocalFileVectorStore(tmpDir);
    const chunk = makeChunk("doc-persist");
    await store1.upsert(chunk.id, makeVector(5), chunk);

    // New instance pointing to the same directory — forces a disk read.
    const store2 = new LocalFileVectorStore(tmpDir);
    const results = await store2.search(makeVector(5), 1);
    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe("doc-persist");
  });
});

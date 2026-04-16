import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IEmbeddingProvider } from "../providers/interfaces";

// The factory reads from `config`, which is captured at module load. Tests
// mutate this mocked object via `setConfig(...)` before calling the factory.
const { configState } = vi.hoisted(() => {
  const configState: {
    vectorStore: {
      type: "local" | "qdrant";
      qdrant: { url: string; apiKey: string; collection: string };
    };
    rag: { dataDir: string };
  } = {
    vectorStore: {
      type: "local",
      qdrant: { url: "", apiKey: "", collection: "documents_chunks" },
    },
    rag: { dataDir: "/tmp/rag-factory-test" },
  };
  return { configState };
});

vi.mock("../config", () => ({
  get config() {
    return configState;
  },
}));

// Mock the Qdrant client so constructing the store doesn't attempt a real
// connection. The fake records its constructor args for assertions.
const { qdrantConstructorArgs } = vi.hoisted(() => {
  const qdrantConstructorArgs: { latest: unknown } = { latest: null };
  return { qdrantConstructorArgs };
});

vi.mock("@qdrant/js-client-rest", () => ({
  QdrantClient: class {
    constructor(args: unknown) {
      qdrantConstructorArgs.latest = args;
    }
  },
}));

import { createVectorStore } from "../vectorstore/factory";
import { LocalFileVectorStore } from "../vectorstore/localFileStore";
import { QdrantVectorStore } from "../vectorstore/qdrantStore";

function fakeEmbedding(dims: number): IEmbeddingProvider {
  return {
    embed: async () => [],
    getDimensions: () => dims,
  };
}

describe("createVectorStore", () => {
  beforeEach(() => {
    configState.vectorStore.type = "local";
    configState.vectorStore.qdrant = { url: "", apiKey: "", collection: "documents_chunks" };
    qdrantConstructorArgs.latest = null;
  });

  it("createVectorStore_ShouldReturnLocalFileStore_WhenTypeIsLocal", () => {
    configState.vectorStore.type = "local";
    const store = createVectorStore(fakeEmbedding(768));
    expect(store).toBeInstanceOf(LocalFileVectorStore);
  });

  it("createVectorStore_ShouldReturnQdrantStore_WhenTypeIsQdrant", () => {
    configState.vectorStore.type = "qdrant";
    configState.vectorStore.qdrant.url = "http://localhost:6333";
    const store = createVectorStore(fakeEmbedding(768));
    expect(store).toBeInstanceOf(QdrantVectorStore);
  });

  it("createVectorStore_ShouldForwardEmbeddingDimensions_WhenTypeIsQdrant", () => {
    configState.vectorStore.type = "qdrant";
    configState.vectorStore.qdrant.url = "http://localhost:6333";
    // Smoke test: if the dim were hardcoded, OpenAI large (3072) would break
    // the Qdrant collection shape. We can't introspect the constructed store
    // directly, but this at least proves the factory accepts non-default dims.
    expect(() => createVectorStore(fakeEmbedding(3072))).not.toThrow();
  });

  it("createVectorStore_ShouldThrow_WhenTypeIsQdrantButUrlMissing", () => {
    configState.vectorStore.type = "qdrant";
    configState.vectorStore.qdrant.url = "";
    expect(() => createVectorStore(fakeEmbedding(768))).toThrow(/QDRANT_URL/);
  });

  it("createVectorStore_ShouldPassApiKeyToClient_WhenProvided", () => {
    configState.vectorStore.type = "qdrant";
    configState.vectorStore.qdrant.url = "http://localhost:6333";
    configState.vectorStore.qdrant.apiKey = "secret";
    createVectorStore(fakeEmbedding(768));
    expect(qdrantConstructorArgs.latest).toMatchObject({
      url: "http://localhost:6333",
      apiKey: "secret",
    });
  });

  it("createVectorStore_ShouldOmitApiKey_WhenEmpty", () => {
    configState.vectorStore.type = "qdrant";
    configState.vectorStore.qdrant.url = "http://localhost:6333";
    configState.vectorStore.qdrant.apiKey = "";
    createVectorStore(fakeEmbedding(768));
    expect(qdrantConstructorArgs.latest).toMatchObject({
      url: "http://localhost:6333",
      apiKey: undefined,
    });
  });
});

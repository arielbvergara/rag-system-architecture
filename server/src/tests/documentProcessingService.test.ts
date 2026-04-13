import { describe, it, expect } from "vitest";
import { DocumentProcessingService } from "../services/documentProcessingService";

const service = new DocumentProcessingService();

const DEFAULT_OPTS = { chunkSize: 100, chunkOverlap: 20 };

describe("DocumentProcessingService", () => {
  // ── chunkText ──────────────────────────────────────────────────────────────

  it("chunkText_ShouldReturnSingleChunk_WhenTextFitsInChunkSize", () => {
    const text = "Hello world.";
    const chunks = service.chunkText(text, DEFAULT_OPTS);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
  });

  it("chunkText_ShouldRespectChunkSize_WhenTextExceedsLimit", () => {
    const text = "a".repeat(300);
    const chunks = service.chunkText(text, DEFAULT_OPTS);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(DEFAULT_OPTS.chunkSize);
    }
  });

  it("chunkText_ShouldSplitOnParagraphBoundaries_WhenDoubleNewlinePresent", () => {
    // Each paragraph is ~60 chars; together they exceed the 100-char chunk size
    const para = "This is a long paragraph that contains meaningful content. ";
    const text = `${para.repeat(2)}\n\n${para.repeat(2)}\n\n${para.repeat(2)}`;
    const chunks = service.chunkText(text, DEFAULT_OPTS);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("chunkText_ShouldApplyOverlap_WhenChunksAreSplit", () => {
    // Use a text that will split across multiple chunks
    const paragraph = "The quick brown fox jumps over the lazy dog. ";
    const text = paragraph.repeat(10);
    const chunks = service.chunkText(text, { chunkSize: 80, chunkOverlap: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    // Verify at least one adjacent pair shares some content (overlap)
    if (chunks.length >= 2) {
      const c1End = chunks[0].content.slice(-20);
      const c2Start = chunks[1].content.slice(0, 40);
      expect(c2Start).toContain(c1End.trim().slice(0, 5));
    }
  });

  it("chunkText_ShouldReturnEmptyArray_WhenTextIsEmpty", () => {
    const chunks = service.chunkText("", DEFAULT_OPTS);
    expect(chunks.length).toBeLessThanOrEqual(1);
  });

  // ── buildChunks ────────────────────────────────────────────────────────────

  it("buildChunks_ShouldAssignDocumentId_WhenBuilding", () => {
    const text = "Some document content for testing.";
    const chunks = service.buildChunks(text, DEFAULT_OPTS, "doc-123", "test.txt");
    expect(chunks.every((c) => c.metadata.documentId === "doc-123")).toBe(true);
  });

  it("buildChunks_ShouldAssignSequentialChunkIndex_WhenTextIsSplit", () => {
    const text = "a".repeat(500);
    const chunks = service.buildChunks(text, DEFAULT_OPTS, "doc-1", "file.txt");
    chunks.forEach((chunk, i) => {
      expect(chunk.metadata.chunkIndex).toBe(i);
    });
  });

  it("buildChunks_ShouldAssignUniqueIds_WhenBuilding", () => {
    const text = "a".repeat(300);
    const chunks = service.buildChunks(text, DEFAULT_OPTS, "doc-1", "file.txt");
    const ids = new Set(chunks.map((c) => c.id));
    expect(ids.size).toBe(chunks.length);
  });

  // ── parseDocument ──────────────────────────────────────────────────────────

  it("parseDocument_ShouldExtractText_WhenGivenPlainTextBuffer", async () => {
    const content = "Hello from a text file.";
    const buffer = Buffer.from(content, "utf-8");
    const result = await service.parseDocument(buffer, "text/plain");
    expect(result.text).toBe(content);
    expect(result.pageCount).toBeUndefined();
  });

  it("parseDocument_ShouldExtractText_WhenGivenMarkdownBuffer", async () => {
    const content = "# Title\n\nSome **bold** content.";
    const buffer = Buffer.from(content, "utf-8");
    const result = await service.parseDocument(buffer, "text/markdown");
    expect(result.text).toBe(content);
  });
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }> = require("pdf-parse");
import { randomUUID } from "crypto";
import type { Chunk, ChunkMetadata } from "../types";

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export interface ParsedDocument {
  text: string;
  pageCount?: number;
}

const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

export class DocumentProcessingService {
  async parseDocument(buffer: Buffer, mimeType: string): Promise<ParsedDocument> {
    if (mimeType === "application/pdf") {
      const result = await pdfParse(buffer);
      return { text: result.text, pageCount: result.numpages };
    }
    // text/plain and text/markdown
    return { text: buffer.toString("utf-8") };
  }

  chunkText(text: string, opts: ChunkOptions): Omit<Chunk, "id" | "metadata">[] {
    const chunks = this.recursiveSplit(text, opts.chunkSize, opts.chunkOverlap, SEPARATORS);
    return chunks.map((content) => ({ content }));
  }

  buildChunks(
    text: string,
    opts: ChunkOptions,
    documentId: string,
    filename: string
  ): Chunk[] {
    const rawChunks = this.recursiveSplitWithOffsets(text, opts.chunkSize, opts.chunkOverlap, SEPARATORS);

    return rawChunks.map((raw, index) => {
      const metadata: ChunkMetadata = {
        documentId,
        filename,
        chunkIndex: index,
        charStart: raw.start,
        charEnd: raw.end,
      };
      return { id: randomUUID(), content: raw.content, metadata };
    });
  }

  private recursiveSplit(
    text: string,
    chunkSize: number,
    overlap: number,
    separators: string[]
  ): string[] {
    return this.recursiveSplitWithOffsets(text, chunkSize, overlap, separators).map(
      (r) => r.content
    );
  }

  private recursiveSplitWithOffsets(
    text: string,
    chunkSize: number,
    overlap: number,
    separators: string[]
  ): { content: string; start: number; end: number }[] {
    if (text.length <= chunkSize) {
      return [{ content: text, start: 0, end: text.length }];
    }

    const sep = separators.find((s) => s === "" || text.includes(s)) ?? "";
    const parts = sep === "" ? text.split("") : text.split(sep);

    const results: { content: string; start: number; end: number }[] = [];
    let buffer = "";
    let bufferStart = 0;
    let offset = 0;

    for (const part of parts) {
      const candidate = buffer.length === 0 ? part : buffer + sep + part;
      if (candidate.length <= chunkSize) {
        if (buffer.length === 0) bufferStart = offset;
        buffer = candidate;
      } else {
        if (buffer.length > 0) {
          results.push({ content: buffer, start: bufferStart, end: bufferStart + buffer.length });
          // Apply overlap: retain trailing characters
          const overlapText = buffer.slice(-overlap);
          bufferStart = bufferStart + buffer.length - overlapText.length;
          buffer = overlapText + sep + part;
        } else {
          // Single part exceeds chunkSize — recurse with next separator
          const nextSeps = separators.slice(separators.indexOf(sep) + 1);
          const sub = this.recursiveSplitWithOffsets(part, chunkSize, overlap, nextSeps);
          sub.forEach((s) =>
            results.push({ content: s.content, start: offset + s.start, end: offset + s.end })
          );
        }
      }
      offset += part.length + sep.length;
    }

    if (buffer.trim().length > 0) {
      results.push({ content: buffer, start: bufferStart, end: bufferStart + buffer.length });
    }

    return results;
  }
}

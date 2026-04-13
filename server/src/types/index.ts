export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AdminSession {
  token: string;
  expiresAt: number;
}

// ── RAG Domain Types ──────────────────────────────────────────────────────────

export type DocumentStatus = "queued" | "parsing" | "chunking" | "embedding" | "ready" | "error";

export interface RagDocument {
  id: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  chunkCount: number;
  status: DocumentStatus;
  errorMessage?: string;
  contentHash?: string;
}

export interface ChunkMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  charStart: number;
  charEnd: number;
}

export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface EmbeddedChunk extends Chunk {
  vector: number[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber?: number;
  excerpt: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  sessionId: string;
  /** The model that generated the answer. */
  model: string;
}

export interface StreamChunk {
  type: "delta" | "citations" | "done" | "error";
  content?: string;
  citations?: Citation[];
  error?: string;
  /** Present on "done" chunks — the model that generated the response. */
  model?: string;
}

export interface VectorRecord {
  id: string;
  documentId: string;
  vector: number[];
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  score: number;
  chunk: Chunk;
}

export interface VectorFilter {
  documentIds?: string[];
}

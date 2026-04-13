export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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

export interface ChunkDetail {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber?: number;
  excerpt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  sessionId: string;
}

export interface StreamChunk {
  type: "delta" | "citations" | "done" | "error";
  content?: string;
  citations?: Citation[];
  error?: string;
}

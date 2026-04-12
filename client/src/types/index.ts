export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RagDocument {
  id: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  chunkCount: number;
  status: "processing" | "ready" | "error";
  errorMessage?: string;
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

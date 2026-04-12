import type { ApiResponse, RagDocument, RagResponse, StreamChunk } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    return { success: false, error: error.error || "Request failed" };
  }

  return response.json();
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const admin = {
  authenticate: (password: string) =>
    request<{ token: string }>("/admin/auth", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const documents = {
  list: () => request<RagDocument[]>("/documents"),

  upload: async (file: File, token: string): Promise<ApiResponse<RagDocument>> => {
    const formData = new FormData();
    formData.append("document", file);

    const response = await fetch(`${API_BASE}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      return { success: false, error: error.error || "Upload failed" };
    }

    return response.json();
  },

  delete: (id: string, token: string) =>
    request(`/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ── RAG ───────────────────────────────────────────────────────────────────────

export const rag = {
  chat: (sessionId: string, message: string, documentIds?: string[]) =>
    request<RagResponse>("/rag/chat", {
      method: "POST",
      body: JSON.stringify({ sessionId, message, documentIds }),
    }),

  chatStream: (
    sessionId: string,
    message: string,
    documentIds: string[] | undefined,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: string) => void
  ): (() => void) => {
    const controller = new AbortController();

    fetch(`${API_BASE}/rag/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message, documentIds }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          onError(`HTTP ${response.status}: ${response.statusText}`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const chunk: StreamChunk = JSON.parse(line.slice(6));
                onChunk(chunk);
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          onError(err.message);
        }
      });

    return () => controller.abort();
  },
};

export const api = { admin, documents, rag };
export default api;

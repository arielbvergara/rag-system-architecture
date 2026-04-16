"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { ChatMessage, Citation, RagDocument, StreamChunk } from "@/types";
import { ChatInterface } from "@/components/ui/ChatInterface";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { STORAGE_KEYS } from "@/config/constants";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.SESSION_ID, id);
  return id;
}

export default function ChatPage() {
  // Messages persist across page refreshes within the same browser tab session.
  const [messages, setMessages] = useSessionStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const sessionIdRef = useRef<string>("");
  const cancelStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  useEffect(() => {
    api.documents.list().then((res) => {
      if (res.success && res.data) setDocuments(res.data);
    });
  }, []);

  function handleSend() {
    if (!input.trim() || streaming) return;
    const userMessage = input.trim();
    setInput("");
    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setStreaming(true);
    setStreamBuffer("");

    let buffer = "";
    let citations: Citation[] = [];

    cancelStreamRef.current = api.rag.chatStream(
      sessionIdRef.current,
      userMessage,
      selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
      (chunk: StreamChunk) => {
        if (chunk.type === "citations" && chunk.citations) {
          citations = chunk.citations;
        } else if (chunk.type === "delta" && chunk.content) {
          buffer += chunk.content;
          setStreamBuffer(buffer);
        } else if (chunk.type === "done") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: buffer, citations, model: chunk.model },
          ]);
          setStreamBuffer("");
          setStreaming(false);
          cancelStreamRef.current = null;
        } else if (chunk.type === "error") {
          setError(chunk.error ?? "Stream error");
          setStreamBuffer("");
          setStreaming(false);
          cancelStreamRef.current = null;
        }
      },
      (err: string) => {
        setError(err);
        setStreamBuffer("");
        setStreaming(false);
        cancelStreamRef.current = null;
      }
    );
  }

  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto overflow-hidden">

        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--border)] shrink-0">
          <h1 className="text-lg font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-family-heading)" }}>
            Chat
          </h1>
          {error && <div className="mt-2"><ErrorAlert error={error} /></div>}
        </div>

        {/* Chat interface fills remaining space */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            streaming={streaming}
            streamBuffer={streamBuffer}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            documents={documents}
            selectedDocumentIds={selectedDocumentIds}
            onDocumentFilterChange={setSelectedDocumentIds}
          />
        </div>

      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, RagDocument } from "@/types";
import { CitationCard } from "./CitationCard";
import { SkeletonPulse } from "./SkeletonPulse";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  streaming: boolean;
  streamBuffer: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  documents: RagDocument[];
  selectedDocumentIds: string[];
  onDocumentFilterChange: (ids: string[]) => void;
}

export function ChatInterface({
  messages,
  streaming,
  streamBuffer,
  input,
  onInputChange,
  onSend,
  documents,
  selectedDocumentIds,
  onDocumentFilterChange,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuffer]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && input.trim()) onSend();
    }
  }

  function toggleDocument(id: string) {
    if (selectedDocumentIds.includes(id)) {
      onDocumentFilterChange(selectedDocumentIds.filter((d) => d !== id));
    } else {
      onDocumentFilterChange([...selectedDocumentIds, id]);
    }
  }

  const readyDocs = documents.filter((d) => d.status === "ready");

  return (
    <div className="flex flex-col h-full">
      {/* Document filter */}
      {readyDocs.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <p className="text-xs text-[var(--muted)] mb-2 font-medium">Filter by document (all if none selected)</p>
          <div className="flex flex-wrap gap-2">
            {readyDocs.map((doc) => {
              const active = selectedDocumentIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-150 cursor-pointer ${
                    active
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
                  }`}
                >
                  {doc.filename}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center pt-10">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)]">Start a conversation</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {readyDocs.length === 0
                ? "Upload documents first, then ask questions about them."
                : "Ask anything about your uploaded documents."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[var(--accent)] text-white rounded-tr-sm"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "assistant" && msg.model && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--muted)] font-mono bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5 leading-none">
                    {msg.model}
                  </span>
                </div>
              )}
              {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 w-full">
                  <CitationCard citations={msg.citations} />
                </div>
              )}
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              {streamBuffer ? (
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] whitespace-pre-wrap">
                  {streamBuffer}
                  <span className="inline-block w-1 h-4 ml-0.5 bg-[var(--accent)] animate-pulse align-text-bottom" />
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <SkeletonPulse className="h-4 w-48" />
                  <SkeletonPulse className="h-4 w-64" />
                  <SkeletonPulse className="h-4 w-40" />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 disabled:opacity-50 min-h-[44px] max-h-[160px]"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={onSend}
            disabled={streaming || !input.trim()}
            aria-label="Send message"
            className="shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

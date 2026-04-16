"use client";

import { useState, useEffect } from "react";
import type { Citation, ChunkDetail } from "@/types";
import { api } from "@/lib/api";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";

interface CitationCardProps {
  citations: Citation[];
}

interface ChunkModalProps {
  citation: Citation;
  onClose: () => void;
}

function ChunkModal({ citation, onClose }: ChunkModalProps) {
  const [chunk, setChunk] = useState<ChunkDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    api.documents
      .getChunk(citation.documentId, citation.chunkId)
      .then((res) => {
        if (res.success && res.data) {
          setChunk(res.data);
        } else {
          setFetchError(res.error ?? "Failed to load source text");
        }
      })
      .finally(() => setFetching(false));
  }, [citation.documentId, citation.chunkId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)] truncate max-w-[400px]">
              {citation.filename}
            </p>
            {citation.pageNumber && (
              <p className="text-xs text-[var(--muted)] mt-0.5">Page {citation.pageNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors duration-150 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5">
          {fetching && (
            <div className="space-y-2">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-5/6" />
              <SkeletonPulse className="h-4 w-4/6" />
            </div>
          )}
          {fetchError && (
            <p className="text-sm text-[var(--error)]">{fetchError}</p>
          )}
          {chunk && (
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
              {chunk.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CitationCard({ citations }: CitationCardProps) {
  const [openCitation, setOpenCitation] = useState<Citation | null>(null);

  if (citations.length === 0) return null;

  return (
    <>
      <div className="mt-2 space-y-2">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Sources</p>
        {citations.map((citation, index) => (
          <button
            key={citation.chunkId}
            onClick={() => setOpenCitation(citation)}
            className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/3 transition-colors duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold shrink-0">
                {index + 1}
              </span>
              <span className="text-xs font-medium text-[var(--foreground)] truncate">
                {citation.filename}
                {citation.pageNumber ? ` · p. ${citation.pageNumber}` : ""}
              </span>
              <span className="ml-auto shrink-0 text-[var(--muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-3">
              {citation.excerpt}
            </p>
          </button>
        ))}
      </div>

      {openCitation && (
        <ChunkModal
          citation={openCitation}
          onClose={() => setOpenCitation(null)}
        />
      )}
    </>
  );
}

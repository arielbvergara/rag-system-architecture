import type { Citation } from "@/types";

interface CitationCardProps {
  citations: Citation[];
}

export function CitationCard({ citations }: CitationCardProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Sources</p>
      {citations.map((citation, index) => (
        <div
          key={citation.chunkId}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold shrink-0">
              {index + 1}
            </span>
            <span className="text-xs font-medium text-[var(--foreground)] truncate">
              {citation.filename}
              {citation.pageNumber ? ` · p. ${citation.pageNumber}` : ""}
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-3">
            {citation.excerpt}
          </p>
        </div>
      ))}
    </div>
  );
}

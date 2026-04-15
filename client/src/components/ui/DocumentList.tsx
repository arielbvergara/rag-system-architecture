"use client";

import type { RagDocument } from "@/types";
import { formatDate } from "@/lib/utils";
import { STATUS_STYLES, STATUS_LABELS } from "@/lib/documentStatus";
import { Card } from "@/components/ui/Card";

interface DocumentListProps {
  documents: RagDocument[];
  onDelete: (id: string) => void;
  deleting: string | null;
}

export function DocumentList({ documents, onDelete, deleting }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[var(--muted)]">No documents yet. Upload one to get started.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--background)]">
            <th className="text-left px-4 py-3 font-medium text-[var(--muted)] text-xs uppercase tracking-wider">File</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--muted)] text-xs uppercase tracking-wider hidden sm:table-cell">Chunks</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--muted)] text-xs uppercase tracking-wider hidden md:table-cell">Uploaded</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--muted)] text-xs uppercase tracking-wider">Status</th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-[var(--background)] transition-colors duration-100">
              <td className="px-4 py-3">
                <span className="font-medium text-[var(--foreground)] truncate max-w-[200px] block">
                  {doc.filename}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--muted)] hidden sm:table-cell">
                {doc.chunkCount}
              </td>
              <td className="px-4 py-3 text-[var(--muted)] hidden md:table-cell">
                {formatDate(doc.uploadedAt)}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                  {STATUS_LABELS[doc.status]}
                </span>
                {doc.errorMessage && (
                  <p className="text-xs text-[var(--error)] mt-1 max-w-[200px] truncate">{doc.errorMessage}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(doc.id)}
                  disabled={deleting === doc.id}
                  aria-label={`Delete ${doc.filename}`}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

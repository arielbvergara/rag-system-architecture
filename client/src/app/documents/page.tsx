"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { RagDocument } from "@/types";
import { DocumentUploader } from "@/components/ui/DocumentUploader";
import { DocumentList } from "@/components/ui/DocumentList";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";

const ADMIN_TOKEN_KEY = "rag_admin_token";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_TOKEN_KEY) : null
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    api.documents.list().then((res) => {
      if (res.success && res.data) setDocuments(res.data);
      else setError(res.error ?? "Failed to load documents");
      setLoading(false);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const res = await api.admin.authenticate(password);
    if (res.success && res.data) {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
      setToken(res.data.token);
    } else {
      setAuthError(res.error ?? "Authentication failed");
    }
    setAuthLoading(false);
    setPassword("");
  }

  async function handleUpload(file: File) {
    if (!token) return;
    setUploading(true);
    setUploadError(null);
    const res = await api.documents.upload(file, token);
    if (res.success && res.data) {
      setDocuments((prev) => [res.data!, ...prev]);
    } else {
      setUploadError(res.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeleting(id);
    const res = await api.documents.delete(id, token);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      setError(res.error ?? "Delete failed");
    }
    setDeleting(null);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-family-heading)" }}>
            Documents
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Upload documents to build the knowledge base. Uploaded files are chunked and embedded automatically.
          </p>
        </div>

        {error && <ErrorAlert error={error} />}

        {/* Upload section — requires admin auth */}
        {token ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Upload a document</h2>
            <DocumentUploader onUpload={handleUpload} loading={uploading} />
            {uploadError && <ErrorAlert error={uploadError} />}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Admin access required to upload</h2>
            <form onSubmit={handleLogin} className="flex gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
              />
              <button
                type="submit"
                disabled={authLoading || !password}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {authLoading ? "…" : "Unlock"}
              </button>
            </form>
            {authError && <ErrorAlert error={authError} />}
          </div>
        )}

        {/* Document list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Knowledge base</h2>
          {loading ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonPulse key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <DocumentList
              documents={documents}
              onDelete={handleDelete}
              deleting={deleting}
            />
          )}
        </div>

      </div>
    </main>
  );
}

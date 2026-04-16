"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { DocumentStatus, RagDocument } from "@/types";
import { DocumentUploader } from "@/components/ui/DocumentUploader";
import { DocumentList } from "@/components/ui/DocumentList";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { STORAGE_KEYS, POLLING } from "@/config/constants";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState<DocumentStatus | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) : null
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.documents.list().then((res) => {
      if (res.success && res.data) setDocuments(res.data);
      else setError(res.error ?? "Failed to load documents");
      setLoading(false);
    });
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  function startPolling(docId: string, attempt = 0): void {
    if (attempt >= POLLING.MAX_ATTEMPTS) {
      setProcessingStep(null);
      return;
    }

    pollingRef.current = setTimeout(async () => {
      const res = await api.documents.getStatus(docId);
      if (!res.success || !res.data) {
        setProcessingStep(null);
        return;
      }
      const doc = res.data;
      setProcessingStep(doc.status);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? doc : d)));

      if (POLLING.TERMINAL_STATUSES.includes(doc.status)) {
        setProcessingStep(null);
      } else {
        startPolling(docId, attempt + 1);
      }
    }, POLLING.INTERVAL_MS);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const res = await api.admin.authenticate(password);
    if (res.success && res.data) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.data.token);
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
    setUploading(false);
    if (res.success && res.data) {
      const doc = res.data;
      setDocuments((prev) => [doc, ...prev]);
      setProcessingStep(doc.status);
      startPolling(doc.id);
    } else {
      setUploadError(res.error ?? "Upload failed");
    }
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
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Upload a document</h2>
            <DocumentUploader
              onUpload={handleUpload}
              loading={uploading}
              processingStep={processingStep}
            />
            {uploadError && <ErrorAlert error={uploadError} />}
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Admin access required to upload</h2>
            <form onSubmit={handleLogin} className="flex gap-3">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                className="flex-1 bg-[var(--background)]"
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
          </Card>
        )}

        {/* Document list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Knowledge base</h2>
          {loading ? (
            <Card className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonPulse key={i} className="h-8 w-full" />
              ))}
            </Card>
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

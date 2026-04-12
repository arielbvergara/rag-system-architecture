"use client";

import { useState } from "react";
import type { MenuScanResult, ScannedMenuSection } from "@/types";
import { AdminAuth } from "@/components/ui/AdminAuth";
import { MenuScannerUploader } from "@/components/ui/MenuScannerUploader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";
import api from "@/lib/api";

const SESSION_STORAGE_KEY = "adminToken";

type ScanState = "idle" | "loading" | "success" | "error";

function countTotalItems(sections: ScannedMenuSection[]): number {
  return sections.reduce((sum, s) => sum + s.items.length, 0);
}

function ScanResultPreview({
  result,
  onReset,
}: {
  result: MenuScanResult;
  onReset: () => void;
}) {
  const totalItems = countTotalItems(result.sections);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--success)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[var(--foreground)]">Menu exported successfully!</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {result.sections.length} {result.sections.length === 1 ? "section" : "sections"},{" "}
              {totalItems} {totalItems === 1 ? "item" : "items"} written to Google Sheets.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={result.sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity duration-150"
          >
            View in Google Sheets
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors duration-150"
          >
            Scan Another
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Exported Sections
        </h2>
        {result.sections.map((section) => (
          <details
            key={section.section}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] select-none">
              <span>{section.section}</span>
              <span className="text-xs text-[var(--muted)]">
                {section.items.length} {section.items.length === 1 ? "item" : "items"}
              </span>
            </summary>
            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 px-4 py-2 text-sm">
                  <div>
                    <span className="font-medium text-[var(--foreground)]">{item.name}</span>
                    {item.description && (
                      <span className="ml-2 text-[var(--muted)]">{item.description}</span>
                    )}
                  </div>
                  {item.price && (
                    <span className="shrink-0 text-[var(--foreground)]">{item.price}</span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function MenuScannerPage() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<MenuScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAuthenticated(newToken: string) {
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setToken(null);
    reset();
  }

  function reset() {
    setSelectedFiles([]);
    setScanState("idle");
    setResult(null);
    setError(null);
  }

  async function handleScan() {
    if (selectedFiles.length === 0 || !token) return;
    setScanState("loading");
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach((f) => formData.append("images", f));

    const response = await api.menuScanner.scan(formData, token);

    if (response.success && response.data) {
      setResult(response.data);
      setScanState("success");
    } else {
      setError(response.error ?? "Scan failed. Please try again.");
      setScanState("error");
    }
  }

  if (!token) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  const isLoading = scanState === "loading";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Menu Scanner</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Upload up to 5 menu images to extract and export the content to Google Sheets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors duration-150"
          >
            Log out
          </button>
        </div>

        {scanState === "success" && result ? (
          <ScanResultPreview result={result} onReset={reset} />
        ) : (
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10">
                <SkeletonPulse className="h-32 w-full" />
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Scanning {selectedFiles.length > 1 ? `${selectedFiles.length} pages` : "menu"} with Gemini Vision…
                </p>
                <p className="text-xs text-[var(--muted)]">This may take a few seconds.</p>
              </div>
            ) : (
              <MenuScannerUploader
                onFilesChanged={(files) => {
                  setSelectedFiles(files);
                  if (scanState === "error") setScanState("idle");
                  if (files.length === 0) setError(null);
                }}
                selectedFiles={selectedFiles}
                disabled={isLoading}
              />
            )}

            <ErrorAlert error={error} />

            <button
              type="button"
              onClick={handleScan}
              disabled={selectedFiles.length === 0 || isLoading}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? "Scanning…" : "Scan & Export to Google Sheets"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

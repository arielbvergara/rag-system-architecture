"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import type { DocumentStatus } from "@/types";
import { STEP_LABELS, PROCESSING_STEPS } from "@/lib/documentStatus";
import { IconCircle } from "@/components/ui/IconCircle";

const ACCEPTED_TYPES = new Set(["application/pdf", "text/plain", "text/markdown"]);
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md", ".markdown"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface DocumentUploaderProps {
  onUpload: (file: File) => void;
  loading: boolean;
  processingStep?: DocumentStatus | null;
}

export function DocumentUploader({ onUpload, loading, processingStep }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED_TYPES.has(file.type) && !ACCEPTED_EXTENSIONS.some((ext) => file.name.endsWith(ext))) {
      return "Only PDF, TXT, and Markdown files are accepted.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }
    return null;
  }

  function handleFile(file: File) {
    const error = validate(file);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onUpload(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isProcessing = processingStep != null && PROCESSING_STEPS.includes(processingStep);
  const isDisabled = loading || isProcessing;
  const currentStepIndex = processingStep ? PROCESSING_STEPS.indexOf(processingStep) : -1;

  const statusLabel = loading
    ? "Uploading…"
    : isProcessing
    ? STEP_LABELS[processingStep!]
    : "Drop a file here or click to browse";

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isDisabled && inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors duration-150 cursor-pointer ${
          isDisabled
            ? "opacity-50 cursor-not-allowed border-[var(--border)]"
            : dragging
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/3"
        }`}
      >
        <IconCircle size="md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
        </IconCircle>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">{statusLabel}</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            PDF, TXT, Markdown · Max 10 MB
          </p>
        </div>
      </div>

      {/* Multi-step progress indicator */}
      {isProcessing && (
        <div className="flex items-center gap-1.5">
          {PROCESSING_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 flex-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                  i < currentStepIndex
                    ? "bg-[var(--accent)]"
                    : i === currentStepIndex
                    ? "bg-[var(--accent)] animate-pulse"
                    : "bg-[var(--border)]"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleChange}
        disabled={isDisabled}
      />

      {validationError && (
        <p className="text-xs text-[var(--error)]">{validationError}</p>
      )}
    </div>
  );
}

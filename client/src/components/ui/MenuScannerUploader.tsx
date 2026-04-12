"use client";

import { useRef, DragEvent, ChangeEvent } from "react";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE_LABEL = "10 MB";
const MAX_IMAGES_COUNT = 5;

export interface MenuScannerUploaderProps {
  onFilesChanged: (files: File[]) => void;
  selectedFiles: File[];
  disabled: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a JPEG, PNG, or WEBP image.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE_LABEL}.`;
  }
  return null;
}

function mergeFiles(existing: File[], incoming: File[]): File[] {
  const names = new Set(existing.map((f) => f.name));
  const novel = incoming.filter((f) => !names.has(f.name) && validateFile(f) === null);
  return [...existing, ...novel].slice(0, MAX_IMAGES_COUNT);
}

export function MenuScannerUploader({
  onFilesChanged,
  selectedFiles,
  disabled,
}: MenuScannerUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtMax = selectedFiles.length >= MAX_IMAGES_COUNT;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) return;
    onFilesChanged(mergeFiles(selectedFiles, incoming));
    // Reset input so the same file can be re-added after removal
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled || isAtMax) return;
    const incoming = Array.from(e.dataTransfer.files ?? []);
    if (incoming.length === 0) return;
    onFilesChanged(mergeFiles(selectedFiles, incoming));
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleRemove(index: number) {
    const updated = selectedFiles.filter((_, i) => i !== index);
    onFilesChanged(updated);
  }

  function handleAddMoreClick() {
    if (!disabled && !isAtMax) inputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Thumbnail grid */}
      {selectedFiles.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Images will be processed in the order shown (Page 1 first)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="relative rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
                >
                  <img
                    src={previewUrl}
                    alt={`Page ${index + 1} preview`}
                    className="h-32 w-full object-cover"
                    onLoad={() => URL.revokeObjectURL(previewUrl)}
                  />
                  {/* Page label badge */}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white">
                    Page {index + 1}
                  </span>
                  {/* Remove button */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      aria-label={`Remove page ${index + 1}`}
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                  {/* File size */}
                  <p className="truncate px-2 py-1 text-xs text-[var(--muted)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drop zone — hidden when at max or loading */}
      {isAtMax ? (
        <p className="text-center text-xs text-[var(--muted)]">
          Maximum {MAX_IMAGES_COUNT} images reached
        </p>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={selectedFiles.length === 0 ? "Upload menu images" : "Add more menu images"}
          onClick={handleAddMoreClick}
          onKeyDown={(e) => e.key === "Enter" && handleAddMoreClick()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-[var(--muted)]"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {selectedFiles.length === 0
                ? "Drop menu images here, or click to browse"
                : "Drop more images here, or click to add"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              JPEG, PNG, WEBP — max {MAX_FILE_SIZE_LABEL} each · up to {MAX_IMAGES_COUNT} images
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={handleFileChange}
            disabled={disabled || isAtMax}
            className="sr-only"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

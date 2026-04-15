import type { DocumentStatus } from "@/types";

export const STATUS_STYLES: Record<DocumentStatus, string> = {
  queued:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  parsing:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  chunking:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  embedding: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ready:     "bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]",
  error:     "bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error-border)]",
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  queued:    "Queued",
  parsing:   "Parsing…",
  chunking:  "Chunking…",
  embedding: "Embedding…",
  ready:     "Ready",
  error:     "Error",
};

export const STEP_LABELS: Partial<Record<DocumentStatus, string>> = {
  queued:    "Queued for processing…",
  parsing:   "Parsing document…",
  chunking:  "Splitting into chunks…",
  embedding: "Generating embeddings…",
};

export const PROCESSING_STEPS: DocumentStatus[] = ["queued", "parsing", "chunking", "embedding"];

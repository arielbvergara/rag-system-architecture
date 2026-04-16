/**
 * Client-side application constants
 */

// ── Storage Keys ──────────────────────────────────────────────────────────────

/** LocalStorage and SessionStorage keys used throughout the application */
export const STORAGE_KEYS = {
  /** Admin authentication token (session storage) */
  ADMIN_TOKEN: "rag_admin_token",
  /** Unique session ID for RAG chat (local storage) */
  SESSION_ID: "rag_session_id",
  /** Chat message history (session storage) */
  CHAT_MESSAGES: "rag_chat_messages",
} as const;

// ── Polling Configuration ─────────────────────────────────────────────────────

/** Configuration for document status polling */
export const POLLING = {
  /** Interval between status checks in milliseconds */
  INTERVAL_MS: 1500,
  /** Maximum number of polling attempts before giving up */
  MAX_ATTEMPTS: 120, // ~3 minutes total (120 × 1.5s)
  /** Document statuses that indicate processing is complete */
  TERMINAL_STATUSES: ["ready", "error"] as const,
} as const;

// ── Transitions ───────────────────────────────────────────────────────────────

/** Reusable Tailwind transition classes */
export const TRANSITIONS = {
  /** Smooth color transitions (150ms) */
  colors: "transition-colors duration-150",
  /** Smooth shadow transitions (150ms) */
  shadow: "transition-shadow duration-150",
  /** Smooth opacity transitions (150ms) */
  opacity: "transition-opacity duration-150",
  /** Smooth all property transitions (150ms) */
  all: "transition-all duration-150",
} as const;

// ── Design System ─────────────────────────────────────────────────────────────

/** Standardized border radius values */
export const BORDER_RADIUS = {
  sm: "rounded-lg",    // 0.5rem
  md: "rounded-xl",    // 0.75rem
  lg: "rounded-2xl",   // 1rem
  full: "rounded-full",
} as const;

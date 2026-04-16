/**
 * Server-side application constants
 *
 * These constants define default values for RAG processing, embedding,
 * and session management. Most can be overridden via environment variables
 * (see config/index.ts).
 */

// ── RAG Processing ────────────────────────────────────────────────────────────

/** Maximum characters to include in RAG context window */
export const MAX_CONTEXT_CHARS = 8000;

/** Maximum characters for citation excerpts shown to users */
export const CITATION_EXCERPT_MAX_CHARS = 300;

// ── Embedding Service ─────────────────────────────────────────────────────────

/** Number of text chunks to embed in a single API call */
export const EMBEDDING_BATCH_SIZE = 20;

/** Maximum retry attempts for embedding API calls */
export const EMBEDDING_MAX_ATTEMPTS = 3;

/** Base delay in milliseconds before first retry (uses exponential backoff) */
export const EMBEDDING_BASE_DELAY_MS = 500;

// ── Session Management ────────────────────────────────────────────────────────

/** RAG chat session TTL in milliseconds (2 hours of inactivity) */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/** Interval for cleaning up expired sessions in milliseconds (15 minutes) */
export const SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

/** Admin session TTL in milliseconds (24 hours) */
export const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// ── Document Storage ──────────────────────────────────────────────────────────

/** Filename for documents metadata JSON file */
export const DOCUMENTS_FILE = "documents.json";

/** Filename for local vector store JSON file */
export const VECTOR_STORE_FILE = "vectorstore.json";

// ── Cache ─────────────────────────────────────────────────────────────────────

/** Default TTL for cache entries in milliseconds (5 minutes) */
export const CACHE_TTL_MS = 5 * 60 * 1000;

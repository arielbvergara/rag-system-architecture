import rateLimit from "express-rate-limit";

const DEFAULT_MESSAGE = { success: false, error: "Too many requests, please try again later." };

function createLimiter(
  windowMs: number,
  max: number,
  message: Record<string, unknown> = DEFAULT_MESSAGE
) {
  return rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message });
}

// 60 requests per minute for read (GET) endpoints
export const readLimiter = createLimiter(60 * 1000, 60);

// 10 requests per minute for write (POST/DELETE) endpoints
export const writeLimiter = createLimiter(60 * 1000, 10);

// 20 requests per minute for RAG chat endpoints
export const ragLimiter = createLimiter(60 * 1000, 20);

// 5 requests per minute for document upload endpoints (embedding generation is resource-intensive)
export const uploadLimiter = createLimiter(60 * 1000, 5, {
  success: false,
  error: "Too many upload requests, please try again later.",
});

// 5 requests per 15 minutes for authentication endpoints
export const authLimiter = createLimiter(15 * 60 * 1000, 5, {
  success: false,
  error: "Too many login attempts, please try again later.",
});

import rateLimit from "express-rate-limit";

// 60 requests per minute for read (GET) endpoints
export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

// 10 requests per minute for write (POST) endpoints
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

// 20 requests per minute for AI chat endpoints
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});

// 5 requests per 15 minutes for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts, please try again later." },
});

// 5 requests per minute for menu scan endpoints (Gemini Vision calls are resource-intensive)
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many scan requests, please try again later." },
});

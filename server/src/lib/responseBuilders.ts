import type { ApiResponse } from "../types";

/**
 * Standardized API response builders for consistent error and success responses
 * across all controllers.
 */

// ── Success Responses ─────────────────────────────────────────────────────────

/**
 * Creates a successful API response with data.
 *
 * @example
 * res.json(success({ token: "abc123" }));
 * res.json(success(documents));
 */
export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Creates a successful API response with a message (no data payload).
 *
 * @example
 * res.json(successMessage("Document deleted"));
 */
export function successMessage(message: string): ApiResponse {
  return { success: true, message };
}

// ── Error Responses ───────────────────────────────────────────────────────────

/**
 * Creates a 400 Bad Request error response.
 *
 * @example
 * return res.status(400).json(badRequest("Missing required field"));
 */
export function badRequest(error: string): ApiResponse {
  return { success: false, error };
}

/**
 * Creates a 401 Unauthorized error response.
 *
 * @example
 * return res.status(401).json(unauthorized("Invalid token"));
 */
export function unauthorized(error: string = "Unauthorized"): ApiResponse {
  return { success: false, error };
}

/**
 * Creates a 404 Not Found error response.
 *
 * @example
 * return res.status(404).json(notFound("Document not found"));
 */
export function notFound(error: string = "Resource not found"): ApiResponse {
  return { success: false, error };
}

/**
 * Creates a 409 Conflict error response.
 *
 * @example
 * return res.status(409).json(conflict("Document already exists"));
 */
export function conflict(error: string): ApiResponse {
  return { success: false, error };
}

/**
 * Creates a 500 Internal Server Error response.
 *
 * @example
 * return res.status(500).json(serverError("Failed to process document"));
 */
export function serverError(error: string = "Internal server error"): ApiResponse {
  return { success: false, error };
}

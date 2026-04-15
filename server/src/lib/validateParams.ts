import type { Response } from "express";
import type { ApiResponse } from "../types";

interface RagChatParams {
  message?: string;
  sessionId?: string;
}

interface ValidatedRagChatParams {
  message: string;
  sessionId: string;
}

/**
 * Validates and normalizes the message and sessionId fields from a RAG chat
 * request body. Returns the validated params on success, or sends a 400
 * response and returns null.
 */
export function validateChatParams(
  params: RagChatParams,
  res: Response<ApiResponse>
): ValidatedRagChatParams | null {
  const { message, sessionId } = params;

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ success: false, error: "Message is required" });
    return null;
  }

  const trimmedSession = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!trimmedSession) {
    res.status(400).json({ success: false, error: "sessionId is required" });
    return null;
  }

  return { message: message.trim(), sessionId: trimmedSession };
}

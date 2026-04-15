import { Request, Response } from "express";
import type { ApiResponse, RagResponse } from "../types";
import { getRagContainer } from "../lib/ragContainer";
import { getErrorMessage } from "../lib/errorUtils";
import { validateChatParams } from "../lib/validateParams";

export async function chat(
  req: Request,
  res: Response<ApiResponse<RagResponse>>
): Promise<void> {
  const { message, sessionId, documentIds } = req.body as {
    message?: string;
    sessionId?: string;
    documentIds?: string[];
  };

  const validated = validateChatParams({ message, sessionId }, res as Response);
  if (!validated) return;

  const ragService = getRagContainer();
  try {
    const response = await ragService.chat(validated.sessionId, validated.message, documentIds);
    res.json({ success: true, data: response });
  } catch (err) {
    const errMsg = getErrorMessage(err, "Failed to generate response");
    res.status(500).json({ success: false, error: errMsg });
  }
}

export async function chatStream(req: Request, res: Response): Promise<void> {
  const { message, sessionId, documentIds } = req.body as {
    message?: string;
    sessionId?: string;
    documentIds?: string[];
  };

  const validated = validateChatParams({ message, sessionId }, res as Response);
  if (!validated) return;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Disable buffering in Nginx / reverse-proxy environments
  res.setHeader("X-Accel-Buffering", "no");
  // Flush headers immediately so the SSE connection is established before
  // the first chunk arrives (important for long-running embedding calls)
  res.flushHeaders();

  const ragService = getRagContainer();
  try {
    for await (const chunk of ragService.chatStream(validated.sessionId, validated.message, documentIds)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
  } catch (err) {
    const errMsg = getErrorMessage(err, "Stream failed");
    res.write(`data: ${JSON.stringify({ type: "error", error: errMsg })}\n\n`);
  } finally {
    res.end();
  }
}

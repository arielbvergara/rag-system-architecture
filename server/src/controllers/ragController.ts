import { Request, Response } from "express";
import type { ApiResponse, RagResponse } from "../types";
import { getRagContainer } from "../lib/ragContainer";

export async function chat(
  req: Request,
  res: Response<ApiResponse<RagResponse>>
): Promise<void> {
  const { message, sessionId, documentIds } = req.body as {
    message?: string;
    sessionId?: string;
    documentIds?: string[];
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ success: false, error: "Message is required" });
    return;
  }

  const sid = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : undefined;
  if (!sid) {
    res.status(400).json({ success: false, error: "sessionId is required" });
    return;
  }

  const ragService = getRagContainer();
  try {
    const response = await ragService.chat(sid, message.trim(), documentIds);
    res.json({ success: true, data: response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate response";
    res.status(500).json({ success: false, error: message });
  }
}

export async function chatStream(req: Request, res: Response): Promise<void> {
  const { message, sessionId, documentIds } = req.body as {
    message?: string;
    sessionId?: string;
    documentIds?: string[];
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ success: false, error: "Message is required" });
    return;
  }

  const sid = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : undefined;
  if (!sid) {
    res.status(400).json({ success: false, error: "sessionId is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const ragService = getRagContainer();
  try {
    for await (const chunk of ragService.chatStream(sid, message.trim(), documentIds)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Stream failed";
    res.write(`data: ${JSON.stringify({ type: "error", error: errMsg })}\n\n`);
  } finally {
    res.end();
  }
}

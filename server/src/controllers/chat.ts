import { Request, Response } from "express";
import { googleAuth } from "../config/google";
import { config } from "../config";
import { ChatService, ChatQuotaExceededError } from "../services/chat";
import { ApiResponse } from "../types";

const MAX_MESSAGE_LENGTH = 500;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const SCRIPT_PATTERN = /javascript:|data:|vbscript:/gi;

export interface ChatReply {
  reply: string;
}

export async function sendMessage(
  req: Request,
  res: Response<ApiResponse<ChatReply>>
): Promise<void> {
  const { message } = req.body;

  if (typeof message !== "string") {
    res.status(400).json({ success: false, error: "Message is required" });
    return;
  }

  let sanitized = message.trim();

  if (sanitized === "") {
    res.status(400).json({ success: false, error: "Message cannot be empty" });
    return;
  }

  sanitized = sanitized.replace(HTML_TAG_PATTERN, "").replace(SCRIPT_PATTERN, "").trim();

  if (sanitized === "") {
    res.status(400).json({ success: false, error: "Message cannot be empty" });
    return;
  }

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ success: false, error: "Message exceeds 500 character limit" });
    return;
  }

  try {
    if (!config.google.sheetsId) {
      res.status(500).json({ success: false, error: "GOOGLE_SHEETS_ID is not configured" });
      return;
    }

    if (!config.gemini.apiKey) {
      res.status(500).json({ success: false, error: "GEMINI_API_KEY is not configured" });
      return;
    }

    const chatService = new ChatService(googleAuth, config.gemini.apiKey, config.google.sheetsId);
    const reply = await chatService.generateReply(sanitized);

    res.json({ success: true, data: { reply } });
  } catch (error: unknown) {
    if (error instanceof ChatQuotaExceededError) {
      res.status(503).json({
        success: false,
        error: "Our menu assistant is temporarily busy. Please try again in a moment.",
      });
      return;
    }
    const errMessage = error instanceof Error ? error.message : "Failed to generate response";
    console.error("Chat error:", errMessage);
    res.status(500).json({ success: false, error: "Failed to generate response" });
  }
}

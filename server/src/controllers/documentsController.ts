import { Request, Response } from "express";
import { randomUUID } from "crypto";
import type { ApiResponse, RagDocument } from "../types";
import { getRagContainer } from "../lib/ragContainer";

export async function uploadDocument(
  req: Request,
  res: Response<ApiResponse<RagDocument>>
): Promise<void> {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    res.status(400).json({ success: false, error: "No document file provided" });
    return;
  }

  const ragService = getRagContainer();
  const id = randomUUID();

  try {
    const doc = await ragService.ingestDocument(id, file.originalname, file.buffer, file.mimetype);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process document";
    res.status(500).json({ success: false, error: message });
  }
}

export async function listDocuments(
  _req: Request,
  res: Response<ApiResponse<RagDocument[]>>
): Promise<void> {
  const ragService = getRagContainer();
  try {
    const docs = await ragService.listDocuments();
    res.json({ success: true, data: docs });
  } catch {
    res.status(500).json({ success: false, error: "Failed to list documents" });
  }
}

export async function deleteDocument(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  const id = req.params["id"];
  if (typeof id !== "string" || !id) {
    res.status(400).json({ success: false, error: "Document ID is required" });
    return;
  }

  const ragService = getRagContainer();
  try {
    await ragService.deleteDocument(id);
    res.json({ success: true, message: "Document deleted" });
  } catch {
    res.status(500).json({ success: false, error: "Failed to delete document" });
  }
}

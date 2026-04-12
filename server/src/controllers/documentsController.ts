import { Request, Response } from "express";
import { randomUUID } from "crypto";
import type { ApiResponse, RagDocument } from "../types";
import { getRagService } from "../services/ragService";
import { EmbeddingService } from "../services/embeddingService";
import { LocalFileVectorStore } from "../vectorstore/localFileStore";
import { createProviders } from "../providers/factory";
import { config } from "../config";

function getServices() {
  const { embedding, llm } = createProviders();
  const vectorStore = new LocalFileVectorStore(config.rag.dataDir);
  const embeddingService = new EmbeddingService(embedding);
  return getRagService(embeddingService, vectorStore, llm);
}

export async function uploadDocument(
  req: Request,
  res: Response<ApiResponse<RagDocument>>
): Promise<void> {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    res.status(400).json({ success: false, error: "No document file provided" });
    return;
  }

  const ragService = getServices();
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
  const ragService = getServices();
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

  const ragService = getServices();
  try {
    await ragService.deleteDocument(id);
    res.json({ success: true, message: "Document deleted" });
  } catch {
    res.status(500).json({ success: false, error: "Failed to delete document" });
  }
}

import { Request, Response } from "express";
import { randomUUID, createHash } from "crypto";
import type { ApiResponse, RagDocument, Chunk } from "../types";
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
  const contentHash = createHash("sha256").update(file.buffer).digest("hex");

  const duplicate = await ragService.findDocumentByHash(contentHash);
  if (duplicate) {
    res.status(409).json({
      success: false,
      error: `A document with this content already exists: "${duplicate.filename}"`,
    });
    return;
  }

  const id = randomUUID();

  try {
    const doc = await ragService.ingestDocument(
      id,
      file.originalname,
      file.buffer,
      file.mimetype,
      contentHash
    );
    res.status(202).json({ success: true, data: doc });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to queue document";
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

export async function getDocumentStatus(
  req: Request,
  res: Response<ApiResponse<RagDocument>>
): Promise<void> {
  const id = req.params["id"];
  if (typeof id !== "string" || !id) {
    res.status(400).json({ success: false, error: "Document ID is required" });
    return;
  }

  const ragService = getRagContainer();
  try {
    const doc = await ragService.getDocumentById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }
    res.json({ success: true, data: doc });
  } catch {
    res.status(500).json({ success: false, error: "Failed to get document status" });
  }
}

export async function getDocumentChunk(
  req: Request,
  res: Response<ApiResponse<Chunk>>
): Promise<void> {
  const { id, chunkId } = req.params as { id: string; chunkId: string };
  if (!id || !chunkId) {
    res.status(400).json({ success: false, error: "Document ID and chunk ID are required" });
    return;
  }

  const ragService = getRagContainer();
  try {
    const chunk = await ragService.getChunk(chunkId);
    if (!chunk || chunk.metadata.documentId !== id) {
      res.status(404).json({ success: false, error: "Chunk not found" });
      return;
    }
    res.json({ success: true, data: chunk });
  } catch {
    res.status(500).json({ success: false, error: "Failed to get chunk" });
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

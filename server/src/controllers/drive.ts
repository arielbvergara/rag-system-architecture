import { Request, Response } from "express";
import { googleAuth } from "../config/google";
import { DriveService } from "../services/drive";
import { isValidDriveFileId } from "../lib/validation";
import { ApiResponse } from "../types";

export async function listFiles(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  try {
    const driveService = new DriveService(googleAuth);
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const query = req.query.q as string | undefined;
    const files = await driveService.listFiles(pageSize, query);
    res.json({ success: true, data: files });
  } catch (error: any) {
    console.error("Drive listFiles error:", error.message);
    res.status(500).json({ success: false, error: "Failed to list drive files" });
  }
}

export async function downloadFile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const fileId = req.params.fileId as string;

    if (!isValidDriveFileId(fileId)) {
      res.status(400).json({ success: false, error: "Invalid file ID" });
      return;
    }

    const driveService = new DriveService(googleAuth);
    const { data, mimeType, fileName } = await driveService.downloadFile(fileId);
    res.setHeader("Content-Type", mimeType);
    // RFC 5987 encoding prevents header injection via filenames with special characters
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    data.pipe(res);
  } catch (error: any) {
    console.error("Drive download error:", error.message);
    res.status(500).json({ success: false, error: "Failed to download file" });
  }
}

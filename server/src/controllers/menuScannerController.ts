import { Request, Response } from "express";
import multer from "multer";
import { googleAuth } from "../config/google";
import { config } from "../config";
import { MenuScannerService, MenuScanParseError } from "../services/menuScannerService";
import { MenuScannerSheetsWriter, SheetNotFoundError } from "../services/menuScannerSheetsWriter";
import { ChatQuotaExceededError } from "../services/chat";
import { cache } from "../lib/cache";
import { MENU_CACHE_KEY } from "../lib/cacheKeys";
import { ApiResponse, MenuScanResult } from "../types";

export async function scanMenu(
  req: Request,
  res: Response<ApiResponse<MenuScanResult>>
): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    res.status(400).json({ success: false, error: "No image files uploaded" });
    return;
  }

  try {
    const images = files.map((f) => ({ buffer: f.buffer, mimeType: f.mimetype }));

    const scannerService = new MenuScannerService(config.gemini.apiKey);
    const sections = await scannerService.scanMenu(images);

    if (sections.length === 0) {
      res.status(422).json({
        success: false,
        error: "No menu content could be extracted from the image(s). Please upload clear menu photo(s).",
      });
      return;
    }

    const writer = new MenuScannerSheetsWriter(
      googleAuth,
      config.menuScanner.spreadsheetId,
      config.menuScanner.sheetGid
    );
    const sheetUrl = await writer.write(sections);

    // Invalidate the menu page cache so the next visit reflects the fresh scan
    cache.invalidate(MENU_CACHE_KEY);

    const result: MenuScanResult = {
      sections,
      scannedAt: new Date().toISOString(),
      sheetUrl,
    };

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ success: false, error: "One or more files exceed the 10 MB size limit" });
      return;
    }

    if (err instanceof Error && err.message === "Invalid file type. Only JPEG, PNG, and WEBP images are allowed.") {
      res.status(400).json({ success: false, error: err.message });
      return;
    }

    if (err instanceof ChatQuotaExceededError) {
      res.status(503).json({
        success: false,
        error: "The AI service is temporarily busy. Please try again in a moment.",
      });
      return;
    }

    if (err instanceof MenuScanParseError) {
      res.status(502).json({
        success: false,
        error: "Failed to parse menu content from the AI response. Please try again.",
      });
      return;
    }

    if (err instanceof SheetNotFoundError) {
      res.status(500).json({ success: false, error: "Target spreadsheet sheet not found" });
      return;
    }

    const errMessage = err instanceof Error ? err.message : "Failed to scan menu";
    console.error("Menu scanner error:", errMessage);
    res.status(500).json({ success: false, error: "Failed to scan menu" });
  }
}

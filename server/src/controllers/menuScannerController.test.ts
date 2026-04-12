import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// ── Hoist mock refs ────────────────────────────────────────────────────────────
const {
  mockScanMenu,
  mockWrite,
  mockConfig,
  MockChatQuotaExceededError,
  MockMenuScanParseError,
  MockSheetNotFoundError,
} = vi.hoisted(() => {
  class MockChatQuotaExceededError extends Error {
    constructor() {
      super("Quota exceeded");
      this.name = "ChatQuotaExceededError";
    }
  }
  class MockMenuScanParseError extends Error {
    constructor() {
      super("Parse error");
      this.name = "MenuScanParseError";
    }
  }
  class MockSheetNotFoundError extends Error {
    constructor() {
      super("Sheet not found");
      this.name = "SheetNotFoundError";
    }
  }
  return {
    mockScanMenu: vi.fn(),
    mockWrite: vi.fn(),
    mockConfig: {
      gemini: { apiKey: "test-api-key" },
      menuScanner: { spreadsheetId: "test-sheet-id", sheetGid: 990327283 },
    },
    MockChatQuotaExceededError,
    MockMenuScanParseError,
    MockSheetNotFoundError,
  };
});

vi.mock("../services/menuScannerService", () => ({
  MenuScannerService: vi.fn().mockImplementation(function (
    this: { scanMenu: typeof mockScanMenu }
  ) {
    this.scanMenu = mockScanMenu;
  }),
  MenuScanParseError: MockMenuScanParseError,
}));

vi.mock("../services/menuScannerSheetsWriter", () => ({
  MenuScannerSheetsWriter: vi.fn().mockImplementation(function (
    this: { write: typeof mockWrite }
  ) {
    this.write = mockWrite;
  }),
  SheetNotFoundError: MockSheetNotFoundError,
}));

vi.mock("../services/chat", () => ({
  ChatQuotaExceededError: MockChatQuotaExceededError,
}));

vi.mock("../config", () => ({ config: mockConfig }));
vi.mock("../config/google", () => ({ googleAuth: {} }));
vi.mock("../lib/cache", () => ({ cache: { invalidate: vi.fn() } }));
vi.mock("../lib/cacheKeys", () => ({ MENU_CACHE_KEY: "menu:items" }));

import { scanMenu } from "./menuScannerController";
import { cache } from "../lib/cache";

function makeFile(name = "menu.jpg", mimetype = "image/jpeg"): Express.Multer.File {
  return {
    buffer: Buffer.from("fake-image"),
    mimetype,
    originalname: name,
  } as Express.Multer.File;
}

const SAMPLE_FILES = [makeFile("page1.jpg"), makeFile("page2.jpg")];

const SAMPLE_SECTIONS = [
  {
    section: "Drinks",
    items: [{ name: "Espresso", description: "Coffee", price: "$2.50" }],
  },
];

const SAMPLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/test-sheet-id/edit#gid=990327283";

function buildRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("menuScannerController — scanMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScanMenu.mockResolvedValue(SAMPLE_SECTIONS);
    mockWrite.mockResolvedValue(SAMPLE_SHEET_URL);
  });

  it("scanMenu_ShouldReturn200WithResult_WhenFilesUploadedAndParsed", async () => {
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          sections: SAMPLE_SECTIONS,
          sheetUrl: SAMPLE_SHEET_URL,
        }),
      })
    );
  });

  it("scanMenu_ShouldPassAllFilesAsImages_WhenMultipleFilesUploaded", async () => {
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(mockScanMenu).toHaveBeenCalledWith([
      { buffer: SAMPLE_FILES[0].buffer, mimeType: SAMPLE_FILES[0].mimetype },
      { buffer: SAMPLE_FILES[1].buffer, mimeType: SAMPLE_FILES[1].mimetype },
    ]);
  });

  it("scanMenu_ShouldReturn400_WhenNoFilesUploaded", async () => {
    const req = { files: undefined } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "No image files uploaded" });
    expect(mockScanMenu).not.toHaveBeenCalled();
  });

  it("scanMenu_ShouldReturn400_WhenEmptyFilesArray", async () => {
    const req = { files: [] as Express.Multer.File[] } as unknown as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "No image files uploaded" });
    expect(mockScanMenu).not.toHaveBeenCalled();
  });

  it("scanMenu_ShouldReturn422_WhenGeminiReturnsEmptySections", async () => {
    mockScanMenu.mockResolvedValue([]);
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("scanMenu_ShouldReturn503_WhenGeminiQuotaExceeded", async () => {
    mockScanMenu.mockRejectedValue(new MockChatQuotaExceededError());
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("scanMenu_ShouldReturn502_WhenMenuScanParseErrorThrown", async () => {
    mockScanMenu.mockRejectedValue(new MockMenuScanParseError());
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("scanMenu_ShouldReturn500_WhenSheetsWriterThrows", async () => {
    mockWrite.mockRejectedValue(new MockSheetNotFoundError());
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("scanMenu_ShouldInvalidateMenuCache_WhenScanSucceeds", async () => {
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(cache.invalidate).toHaveBeenCalledWith("menu:items");
  });

  it("scanMenu_ShouldNotInvalidateMenuCache_WhenScanFails", async () => {
    mockScanMenu.mockRejectedValue(new Error("Scan failed"));
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it("scanMenu_ShouldReturn500_WhenGenericErrorThrown", async () => {
    mockScanMenu.mockRejectedValue(new Error("Unexpected error"));
    const req = { files: SAMPLE_FILES } as Request;
    const res = buildRes();

    await scanMenu(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Failed to scan menu" });
  });
});

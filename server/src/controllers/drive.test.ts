import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const mockDownloadFile = vi.hoisted(() => vi.fn());
const mockListFiles = vi.hoisted(() => vi.fn());

vi.mock("../services/drive", () => ({
  DriveService: vi.fn().mockImplementation(function (this: any) {
    this.downloadFile = mockDownloadFile;
    this.listFiles = mockListFiles;
  }),
}));

vi.mock("../config/google", () => ({ googleAuth: {} }));

import { downloadFile, listFiles } from "./drive";

function buildRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("drive controller — downloadFile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("downloadFile_ShouldReturn400_WhenFileIdFormatIsInvalid", async () => {
    const req = { params: { fileId: "bad id!" } } as unknown as Request;
    const res = buildRes();

    await downloadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid file ID" });
    expect(mockDownloadFile).not.toHaveBeenCalled();
  });

  it("downloadFile_ShouldEncodeFilename_WhenFilenameHasSpecialChars", async () => {
    const pipeMock = vi.fn();
    mockDownloadFile.mockResolvedValueOnce({
      data: { pipe: pipeMock },
      mimeType: "application/pdf",
      fileName: 'Report "Q1" 2024.pdf',
    });

    const req = {
      params: { fileId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs" },
    } as unknown as Request;
    const res = buildRes();

    await downloadFile(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent('Report "Q1" 2024.pdf')}`
    );
    expect(pipeMock).toHaveBeenCalledWith(res);
  });

  it("downloadFile_ShouldReturn500_WhenServiceThrows", async () => {
    mockDownloadFile.mockRejectedValueOnce(new Error("Drive error"));

    const req = {
      params: { fileId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs" },
    } as unknown as Request;
    const res = buildRes();

    await downloadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Failed to download file" });
  });
});

describe("drive controller — listFiles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listFiles_ShouldReturn200WithFiles_WhenServiceSucceeds", async () => {
    mockListFiles.mockResolvedValueOnce([{ id: "abc", name: "file.pdf" }]);

    const req = { query: {} } as unknown as Request;
    const res = buildRes();

    await listFiles(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: "abc", name: "file.pdf" }],
    });
  });

  it("listFiles_ShouldReturn500_WhenServiceThrows", async () => {
    mockListFiles.mockRejectedValueOnce(new Error("API error"));

    const req = { query: {} } as unknown as Request;
    const res = buildRes();

    await listFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Failed to list drive files" });
  });
});

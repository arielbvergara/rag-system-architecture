import { describe, it, expect, vi, afterEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../config", () => ({
  config: {
    admin: { password: "correct-password" },
    cloudinary: { folder: "test-project" },
  },
}));

vi.mock("../middleware/adminAuth", () => ({
  createSession: vi.fn().mockReturnValue("mock-token"),
  invalidateExpiredSessions: vi.fn(),
}));

vi.mock("../services/cloudinaryService");

import { authenticate, listImages, deleteImage } from "./adminController";
import * as cloudinaryService from "../services/cloudinaryService";

function buildRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function buildReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

describe("adminController", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── authenticate ───────────────────────────────────────────────────────────

  it("authenticate_ShouldReturn200WithToken_WhenPasswordIsCorrect", async () => {
    const req = buildReq({ body: { password: "correct-password" } });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: "mock-token" },
    });
  });

  it("authenticate_ShouldReturn401_WhenPasswordIsWrong", async () => {
    const req = buildReq({ body: { password: "wrong-password" } });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid password" });
  });

  it("authenticate_ShouldReturn400_WhenPasswordIsMissing", async () => {
    const req = buildReq({ body: {} });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Password is required" });
  });

  it("authenticate_ShouldReturn400_WhenPasswordIsNotAString", async () => {
    const req = buildReq({ body: { password: 12345 } });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Password is required" });
  });

  // ── listImages ────────────────────────────────────────────────────────────

  it("listImages_ShouldReturn200WithImages_WhenServiceSucceeds", async () => {
    const mockImages = [
      {
        publicId: "test-project/img1",
        url: "http://res.cloudinary.com/img1",
        secureUrl: "https://res.cloudinary.com/img1",
        format: "jpg",
        width: 800,
        height: 600,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    vi.mocked(cloudinaryService.listImages).mockResolvedValue(mockImages);

    const res = buildRes();
    await listImages(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockImages });
  });

  it("listImages_ShouldReturn500_WhenServiceThrows", async () => {
    vi.mocked(cloudinaryService.listImages).mockRejectedValue(new Error("API error"));

    const res = buildRes();
    await listImages(buildReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Failed to fetch images" });
  });

  // ── deleteImage ───────────────────────────────────────────────────────────

  it("deleteImage_ShouldReturn200_WhenPublicIdIsValid", async () => {
    vi.mocked(cloudinaryService.deleteImage).mockResolvedValue(undefined);

    const req = buildReq({ params: { publicId: "test-project/my-image" } });
    const res = buildRes();

    await deleteImage(req, res);

    expect(cloudinaryService.deleteImage).toHaveBeenCalledWith("test-project/my-image");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("deleteImage_ShouldReturn400_WhenPublicIdIsMissing", async () => {
    const req = buildReq({ params: { publicId: "" } });
    const res = buildRes();

    await deleteImage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "publicId is required" });
  });

  it("deleteImage_ShouldReturn403_WhenPublicIdIsOutsideConfiguredFolder", async () => {
    const req = buildReq({ params: { publicId: "other-folder/image" } });
    const res = buildRes();

    await deleteImage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Forbidden" });
  });

  it("deleteImage_ShouldReturn500_WhenServiceThrows", async () => {
    vi.mocked(cloudinaryService.deleteImage).mockRejectedValue(new Error("API error"));

    const req = buildReq({ params: { publicId: "test-project/my-image" } });
    const res = buildRes();

    await deleteImage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Failed to delete image" });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { authenticate } from "./adminController";

vi.mock("../middleware/adminAuth", () => ({
  createSession: vi.fn(() => "mock-token-abc123"),
}));

vi.mock("../config", () => ({
  config: {
    admin: { password: "correct-password" },
  },
}));

function buildReq(body: Record<string, unknown> = {}): Request {
  return { body } as unknown as Request;
}

function buildRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("adminController.authenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticate_ShouldReturnToken_WhenPasswordIsCorrect", async () => {
    const req = buildReq({ password: "correct-password" });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: "mock-token-abc123" },
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("authenticate_ShouldReturn401_WhenPasswordIsWrong", async () => {
    const req = buildReq({ password: "wrong-password" });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid password" });
  });

  it("authenticate_ShouldReturn401_WhenPasswordHasCorrectCharsButWrongLength", async () => {
    const req = buildReq({ password: "correct-passwor" }); // one char short
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid password" });
  });

  it("authenticate_ShouldReturn400_WhenPasswordIsMissing", async () => {
    const req = buildReq({});
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Password is required" });
  });

  it("authenticate_ShouldReturn400_WhenPasswordIsNotAString", async () => {
    const req = buildReq({ password: 12345 });
    const res = buildRes();

    await authenticate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Password is required" });
  });
});

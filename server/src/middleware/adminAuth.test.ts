import { describe, it, expect, vi, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// Import the module under test — we re-import inside tests to get a fresh
// module state for session isolation.
import {
  createSession,
  adminAuth,
  invalidateExpiredSessions,
} from "./adminAuth";

function buildRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function buildReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

describe("adminAuth middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── createSession ──────────────────────────────────────────────────────────

  it("createSession_ShouldReturnToken_WhenCalled", () => {
    const token = createSession();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("createSession_ShouldReturnUniqueTokens_WhenCalledTwice", () => {
    const token1 = createSession();
    const token2 = createSession();
    expect(token1).not.toBe(token2);
  });

  // ── adminAuth ─────────────────────────────────────────────────────────────

  it("adminAuth_ShouldCallNext_WhenTokenIsValid", () => {
    const token = createSession();
    const next = vi.fn() as unknown as NextFunction;
    const res = buildRes();

    adminAuth(buildReq(`Bearer ${token}`), res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("adminAuth_ShouldReturn401_WhenTokenIsMissing", () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = buildRes();

    adminAuth(buildReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("adminAuth_ShouldReturn401_WhenTokenIsInvalid", () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = buildRes();

    adminAuth(buildReq("Bearer unknown-token-that-was-never-created"), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("adminAuth_ShouldReturn401_WhenTokenIsExpired", () => {
    const token = createSession();
    // Back-date the session by manipulating Date.now
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 25 * 60 * 60 * 1000);

    const next = vi.fn() as unknown as NextFunction;
    const res = buildRes();

    adminAuth(buildReq(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── invalidateExpiredSessions ─────────────────────────────────────────────

  it("invalidateExpiredSessions_ShouldRemoveExpiredSession_WhenCalled", () => {
    const token = createSession();

    // Advance time past the 24 h TTL
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 25 * 60 * 60 * 1000);
    invalidateExpiredSessions();

    // Restore real time so the adminAuth check uses current time
    vi.restoreAllMocks();

    const next = vi.fn() as unknown as NextFunction;
    const res = buildRes();

    // Token should no longer exist in the store
    adminAuth(buildReq(`Bearer ${token}`), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

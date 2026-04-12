import { describe, it, expect, vi, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "./error";

function buildRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("errorHandler middleware", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("errorHandler_ShouldReturnGenericMessage_WhenInProduction", () => {
    process.env.NODE_ENV = "production";
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("Sensitive internal error");
    const res = buildRes();

    errorHandler(err, {} as Request, res, (() => {}) as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Internal server error" });
  });

  it("errorHandler_ShouldNotLogStack_WhenInProduction", () => {
    process.env.NODE_ENV = "production";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("Some error");
    err.stack = "Error: Some error\n    at sensitive/path/file.ts:42";

    errorHandler(err, {} as Request, buildRes(), (() => {}) as NextFunction);

    const stackCall = consoleSpy.mock.calls.find((call) =>
      String(call[0]).includes("at sensitive")
    );
    expect(stackCall).toBeUndefined();
  });

  it("errorHandler_ShouldLogStack_WhenInDevelopment", () => {
    process.env.NODE_ENV = "development";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("Dev error");
    err.stack = "Error: Dev error\n    at dev/path/file.ts:10";

    errorHandler(err, {} as Request, buildRes(), (() => {}) as NextFunction);

    const stackLogged = consoleSpy.mock.calls.some((call) =>
      String(call[0]).includes("Dev error")
    );
    expect(stackLogged).toBe(true);
  });

  it("errorHandler_ShouldReturnErrorMessage_WhenInDevelopment", () => {
    process.env.NODE_ENV = "development";
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("Detailed dev error");
    const res = buildRes();

    errorHandler(err, {} as Request, res, (() => {}) as NextFunction);

    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Detailed dev error" });
  });
});

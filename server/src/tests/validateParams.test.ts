import { describe, it, expect, vi } from "vitest";
import type { Response } from "express";
import type { ApiResponse } from "../types";
import { validateChatParams } from "../lib/validateParams";

function makeFakeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json, _status: status, _json: json } as unknown as Response<ApiResponse> & {
    _status: ReturnType<typeof vi.fn>;
    _json: ReturnType<typeof vi.fn>;
  };
}

describe("validateChatParams", () => {
  it("validateChatParams_ShouldReturnValidatedParams_WhenBothFieldsAreValid", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ message: "Hello", sessionId: "abc-123" }, res);
    expect(result).toEqual({ message: "Hello", sessionId: "abc-123" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateChatParams_ShouldReturnNull_WhenMessageIsMissing", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ sessionId: "abc" }, res);
    expect(result).toBeNull();
  });

  it("validateChatParams_ShouldReturnNull_WhenMessageIsEmptyString", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ message: "", sessionId: "abc" }, res);
    expect(result).toBeNull();
  });

  it("validateChatParams_ShouldReturnNull_WhenMessageIsWhitespaceOnly", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ message: "   ", sessionId: "abc" }, res);
    expect(result).toBeNull();
  });

  it("validateChatParams_ShouldReturnNull_WhenSessionIdIsMissing", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ message: "Hello" }, res);
    expect(result).toBeNull();
  });

  it("validateChatParams_ShouldReturnNull_WhenSessionIdIsEmptyString", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ message: "Hello", sessionId: "" }, res);
    expect(result).toBeNull();
  });

  it("validateChatParams_ShouldTrimBothFields_WhenCalledWithPaddedStrings", () => {
    const res = makeFakeRes();
    const result = validateChatParams({ message: "  Hello  ", sessionId: "  abc-123  " }, res);
    expect(result).toEqual({ message: "Hello", sessionId: "abc-123" });
  });

  it("validateChatParams_ShouldReturn400_WhenMessageInvalid", () => {
    const res = makeFakeRes();
    validateChatParams({ message: "", sessionId: "abc" }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("validateChatParams_ShouldReturn400_WhenSessionIdInvalid", () => {
    const res = makeFakeRes();
    validateChatParams({ message: "Hello", sessionId: "" }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

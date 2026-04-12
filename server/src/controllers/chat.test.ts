import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// ── Hoist mock refs ───────────────────────────────────────────────────────────
const { mockGenerateReply, mockConfig, MockChatQuotaExceededError } = vi.hoisted(() => {
  class MockChatQuotaExceededError extends Error {
    constructor() {
      super("Quota exceeded");
      this.name = "ChatQuotaExceededError";
    }
  }
  return {
    mockGenerateReply: vi.fn(),
    mockConfig: {
      google: { sheetsId: "test-sheet-id" },
      gemini: { apiKey: "test-api-key" },
    },
    MockChatQuotaExceededError,
  };
});

vi.mock("../services/chat", () => ({
  ChatService: vi.fn().mockImplementation(function (this: { generateReply: typeof mockGenerateReply }) {
    this.generateReply = mockGenerateReply;
  }),
  ChatQuotaExceededError: MockChatQuotaExceededError,
}));

vi.mock("../config", () => ({ config: mockConfig }));
vi.mock("../config/google", () => ({ googleAuth: {} }));

import { sendMessage } from "./chat";

function buildRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("chat controller — sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendMessage_ShouldReturn200WithReply_WhenMessageIsValid", async () => {
    mockGenerateReply.mockResolvedValueOnce("We have burgers and pizza!");
    const req = { body: { message: "What do you have?" } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { reply: "We have burgers and pizza!" },
    });
  });

  it("sendMessage_ShouldReturn400_WhenMessageIsMissing", async () => {
    const req = { body: {} } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Message is required" });
    expect(mockGenerateReply).not.toHaveBeenCalled();
  });

  it("sendMessage_ShouldReturn400_WhenMessageIsEmptyString", async () => {
    const req = { body: { message: "   " } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Message cannot be empty" });
    expect(mockGenerateReply).not.toHaveBeenCalled();
  });

  it("sendMessage_ShouldReturn400_WhenMessageExceedsMaxLength", async () => {
    const req = { body: { message: "a".repeat(501) } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Message exceeds 500 character limit",
    });
    expect(mockGenerateReply).not.toHaveBeenCalled();
  });

  it("sendMessage_ShouldReturn400_WhenMessageContainsOnlyHtmlTags", async () => {
    const req = { body: { message: "<b><i><span></span></i></b>" } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Message cannot be empty" });
    expect(mockGenerateReply).not.toHaveBeenCalled();
  });

  it("sendMessage_ShouldReturn500_WhenChatServiceThrows", async () => {
    mockGenerateReply.mockRejectedValueOnce(new Error("Gemini unavailable"));
    const req = { body: { message: "What salads do you have?" } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to generate response",
    });
  });

  it("sendMessage_ShouldReturn503WithFriendlyMessage_WhenQuotaIsExceeded", async () => {
    mockGenerateReply.mockRejectedValueOnce(new MockChatQuotaExceededError());
    const req = { body: { message: "What do you have?" } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Our menu assistant is temporarily busy. Please try again in a moment.",
    });
  });

  it("sendMessage_ShouldSanitizeHtmlTags_WhenMessageContainsMixedContent", async () => {
    mockGenerateReply.mockResolvedValueOnce("The burger has beef!");
    const req = { body: { message: "What is in the <b>burger</b>?" } } as Request;
    const res = buildRes();

    await sendMessage(req, res);

    expect(mockGenerateReply).toHaveBeenCalledWith("What is in the burger?");
  });
});

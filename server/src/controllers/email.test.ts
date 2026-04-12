import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

// ── Hoist mock ref so it is available inside the vi.mock factory ─────────────
const mockSendEmail = vi.hoisted(() => vi.fn());

vi.mock("../services/email", () => ({
  EmailService: vi.fn().mockImplementation(function (this: any) {
    this.sendEmail = mockSendEmail;
  }),
}));

vi.mock("../config", () => ({
  config: {
    email: {
      allowedRecipients: ["allowed@example.com"],
    },
  },
}));

import { sendEmail } from "./email";

function buildRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("email controller — sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendEmail_ShouldReturn201_WhenPayloadIsValid", async () => {
    mockSendEmail.mockResolvedValueOnce(undefined);

    const req = {
      body: { to: "allowed@example.com", subject: "Hi", body: "Hello!" },
    } as Request;
    const res = buildRes();

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Email sent successfully",
    });
  });

  it("sendEmail_ShouldReturn400_WhenRequiredFieldIsMissing", async () => {
    const req = {
      body: { to: "allowed@example.com", subject: "Hi" }, // missing body
    } as Request;
    const res = buildRes();

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "to, subject, and body are required",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sendEmail_ShouldReturn400_WhenEmailFormatIsInvalid", async () => {
    const req = {
      body: { to: "not-an-email", subject: "Hi", body: "Hello!" },
    } as Request;
    const res = buildRes();

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid email address",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sendEmail_ShouldReturn403_WhenRecipientNotInWhitelist", async () => {
    const req = {
      body: { to: "stranger@example.com", subject: "Hi", body: "Hello!" },
    } as Request;
    const res = buildRes();

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Recipient not allowed",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sendEmail_ShouldReturn500_WhenEmailServiceThrows", async () => {
    mockSendEmail.mockRejectedValueOnce(new Error("Gmail API error"));

    const req = {
      body: { to: "allowed@example.com", subject: "Hi", body: "Hello!" },
    } as Request;
    const res = buildRes();

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to send email",
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock refs so they are available inside vi.mock factories ────────────
const mockSend = vi.hoisted(() => vi.fn());

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function (this: any) {
        this.setCredentials = vi.fn();
      }),
    },
    gmail: vi.fn().mockReturnValue({
      users: {
        messages: {
          send: mockSend,
        },
      },
    }),
  },
}));

vi.mock("../config", () => ({
  config: {
    gmail: {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      refreshToken: "test-refresh-token",
      senderEmail: "sender@example.com",
    },
  },
}));

import { EmailService } from "./email";

describe("EmailService", () => {
  let service: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailService();
  });

  it("sendEmail_ShouldCallGmailApi_WhenPayloadIsValid", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg-123" } });

    await service.sendEmail({
      to: "recipient@example.com",
      subject: "Hello",
      body: "Test body",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.userId).toBe("me");
    expect(call.requestBody.raw).toBeDefined();

    // Verify the encoded message contains expected headers
    const decoded = Buffer.from(call.requestBody.raw, "base64url").toString();
    expect(decoded).toContain("To: recipient@example.com");
    expect(decoded).toContain("Subject: Hello");
    expect(decoded).toContain("From: sender@example.com");
    expect(decoded).toContain("Test body");
  });

  it("sendEmail_ShouldThrow_WhenGmailApiReturnsError", async () => {
    mockSend.mockRejectedValueOnce(new Error("Gmail API error"));

    await expect(
      service.sendEmail({
        to: "recipient@example.com",
        subject: "Hello",
        body: "Test body",
      })
    ).rejects.toThrow("Gmail API error");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MenuChatbot } from "../MenuChatbot";

// ── Mock the API client ────────────────────────────────────────────────────────
const mockSend = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    chat: {
      send: (...args: unknown[]) => mockSend(...args),
    },
  },
}));

describe("MenuChatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("MenuChatbot_ShouldRenderChatBubble_WhenMounted", () => {
    render(<MenuChatbot />);
    expect(screen.getByRole("button", { name: /open menu chat/i })).toBeInTheDocument();
  });

  it("MenuChatbot_ShouldOpenChatPanel_WhenBubbleIsClicked", async () => {
    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));
    expect(screen.getByText("Menu Assistant")).toBeInTheDocument();
  });

  it("MenuChatbot_ShouldCloseChatPanel_WhenBubbleIsClickedAgain", async () => {
    render(<MenuChatbot />);
    const bubble = screen.getByRole("button", { name: /open menu chat/i });
    await userEvent.click(bubble);
    expect(screen.getByText("Menu Assistant")).toBeInTheDocument();
    await userEvent.click(bubble);
    expect(screen.queryByText("Menu Assistant")).not.toBeInTheDocument();
  });

  it("MenuChatbot_ShouldDisplayUserMessage_WhenMessageIsSent", async () => {
    mockSend.mockResolvedValueOnce({ success: true, data: { reply: "We have burgers!" } });
    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));

    const textarea = screen.getByPlaceholderText(/ask about our menu/i);
    await userEvent.type(textarea, "What do you have?");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("What do you have?")).toBeInTheDocument();
  });

  it("MenuChatbot_ShouldDisplayAssistantReply_WhenApiRespondsSuccessfully", async () => {
    mockSend.mockResolvedValueOnce({ success: true, data: { reply: "We have burgers!" } });
    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));

    const textarea = screen.getByPlaceholderText(/ask about our menu/i);
    await userEvent.type(textarea, "What do you have?");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("We have burgers!")).toBeInTheDocument();
    });
  });

  it("MenuChatbot_ShouldDisplayErrorMessage_WhenApiCallFails", async () => {
    mockSend.mockResolvedValueOnce({ success: false, error: "Service unavailable" });
    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));

    const textarea = screen.getByPlaceholderText(/ask about our menu/i);
    await userEvent.type(textarea, "What salads do you have?");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    });
  });

  it("MenuChatbot_ShouldDisableSendButton_WhenLoading", async () => {
    // Keep the promise pending so we can inspect the loading state
    let resolvePromise: (value: unknown) => void;
    mockSend.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));

    const textarea = screen.getByPlaceholderText(/ask about our menu/i);
    await userEvent.type(textarea, "Any specials?");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();

    // Resolve to clean up
    resolvePromise!({ success: true, data: { reply: "Yes!" } });
  });

  it("MenuChatbot_ShouldNotSendMessage_WhenInputIsEmpty", async () => {
    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(mockSend).not.toHaveBeenCalled();
  });

  it("MenuChatbot_ShouldEnforceMaxLength_WhenTypingMoreThan500Characters", async () => {
    render(<MenuChatbot />);
    await userEvent.click(screen.getByRole("button", { name: /open menu chat/i }));

    const textarea = screen.getByPlaceholderText(/ask about our menu/i);
    expect(textarea).toHaveAttribute("maxLength", "500");
  });
});

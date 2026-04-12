import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleAuth } from "google-auth-library";
import type { MenuItem } from "../types";

// ── Hoist mocks so they are available inside vi.mock factories ────────────────
const { mockGenerateContent, mockGetMenuItems } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockGetMenuItems: vi.fn(),
}));

// ── Mock @google/generative-ai ────────────────────────────────────────────────
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    };
  }),
}));

// ── Mock MenuService ──────────────────────────────────────────────────────────
vi.mock("./menu", () => ({
  MenuService: vi.fn().mockImplementation(function () {
    return { getMenuItems: mockGetMenuItems };
  }),
}));

import { ChatService, ChatQuotaExceededError } from "./chat";

const SAMPLE_ITEMS: MenuItem[] = [
  {
    title: "Burger",
    description: "Juicy beef burger",
    price1Description: "Single",
    price1: "8.99",
    imageUrl: "",
    ingredients: "Beef patty, bun, lettuce, tomato",
  },
  {
    title: "Pizza",
    description: "Margherita pizza",
    price1Description: "Slice",
    price1: "3.50",
    price2Description: "Whole",
    price2: "18.00",
    imageUrl: "",
  },
];

function makeService(): ChatService {
  return new ChatService({} as GoogleAuth, "test-api-key", "test-sheet-id");
}

function makeSuccessResponse(text: string) {
  return { response: { text: () => text } };
}

describe("ChatService.generateReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMenuItems.mockResolvedValue(SAMPLE_ITEMS);
  });

  it("generateReply_ShouldReturnAssistantText_WhenGeminiRespondsSuccessfully", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse("Try our Caesar Salad!"));
    const service = makeService();
    const reply = await service.generateReply("What do you recommend?");
    expect(reply).toBe("Try our Caesar Salad!");
  });

  it("generateReply_ShouldThrow_WhenGeminiApiThrows", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Network error"));
    const service = makeService();
    await expect(service.generateReply("Hello")).rejects.toThrow("Failed to generate response");
  });

  it("generateReply_ShouldThrowChatQuotaExceededError_WhenGeminiReturnsQuotaError", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Quota exceeded for metric: generativelanguage"));
    const service = makeService();
    await expect(service.generateReply("Hello")).rejects.toBeInstanceOf(ChatQuotaExceededError);
  });

  it("generateReply_ShouldThrowChatQuotaExceededError_WhenGeminiReturnsRateLimitError", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Resource exhausted"));
    const service = makeService();
    await expect(service.generateReply("Hello")).rejects.toBeInstanceOf(ChatQuotaExceededError);
  });

  it("generateReply_ShouldFetchMenuItems_WhenCalled", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse("We have burgers!"));
    const service = makeService();
    await service.generateReply("What do you have?");
    expect(mockGetMenuItems).toHaveBeenCalledOnce();
    expect(mockGetMenuItems).toHaveBeenCalledWith("test-sheet-id");
  });

  it("generateReply_ShouldTruncateReply_WhenResponseExceedsMaxLength", async () => {
    const longText = "This is a sentence. ".repeat(120); // ~2400 chars
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(longText));
    const service = makeService();
    const reply = await service.generateReply("Tell me everything");
    expect(reply.length).toBeLessThanOrEqual(2003); // 2000 + "..."
    expect(reply.endsWith("...")).toBe(true);
  });

  it("generateReply_ShouldIncludeIngredientsInContext_WhenItemHasIngredients", async () => {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    let capturedSystemInstruction = "";

    vi.mocked(GoogleGenerativeAI).mockImplementationOnce(function () {
      return {
        getGenerativeModel: vi.fn().mockImplementation(
          ({ systemInstruction }: { systemInstruction: string }) => {
            capturedSystemInstruction = systemInstruction;
            return { generateContent: mockGenerateContent };
          }
        ),
      };
    } as never);

    mockGenerateContent.mockResolvedValue(makeSuccessResponse("The burger has beef!"));
    const service = makeService();
    await service.generateReply("What is in the burger?");

    expect(capturedSystemInstruction).toContain("Beef patty, bun, lettuce, tomato");
  });
});

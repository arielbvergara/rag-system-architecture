import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock refs ────────────────────────────────────────────────────────────
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
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

import { MenuScannerService, MenuScanParseError, ImageInput } from "./menuScannerService";
import { ChatQuotaExceededError } from "./chat";

const VALID_GEMINI_RESPONSE = JSON.stringify({
  sections: [
    {
      section: "Drinks",
      items: [
        { name: "Espresso", description: "Rich espresso shot", price: "$2.50" },
        { name: "Latte", description: "Steamed milk coffee", price: "$3.50" },
      ],
    },
    {
      section: "Mains",
      items: [
        { name: "Steak", description: "8oz sirloin", price: "$28.00" },
      ],
    },
  ],
});

function makeService(): MenuScannerService {
  return new MenuScannerService("test-api-key");
}

function makeSuccessResponse(text: string) {
  return { response: { text: () => text } };
}

const TEST_IMAGE: ImageInput = { buffer: Buffer.from("fake-image-data"), mimeType: "image/jpeg" };
const TEST_IMAGE_2: ImageInput = { buffer: Buffer.from("fake-image-data-2"), mimeType: "image/png" };

describe("MenuScannerService.scanMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scanMenu_ShouldReturnParsedSections_WhenGeminiRespondsWithValidJSON", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(VALID_GEMINI_RESPONSE));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE]);

    expect(sections).toHaveLength(2);
    expect(sections[0].section).toBe("Drinks");
    expect(sections[0].items).toHaveLength(2);
    expect(sections[1].section).toBe("Mains");
  });

  it("scanMenu_ShouldThrowMenuScanParseError_WhenGeminiReturnsNonJsonText", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse("Sorry, I cannot analyze this."));
    const service = makeService();
    await expect(service.scanMenu([TEST_IMAGE])).rejects.toBeInstanceOf(MenuScanParseError);
  });

  it("scanMenu_ShouldReturnParsedSections_WhenGeminiWrapsJsonInMarkdownFences", async () => {
    const fenced = "```json\n" + VALID_GEMINI_RESPONSE + "\n```";
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(fenced));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE]);
    expect(sections).toHaveLength(2);
    expect(sections[0].section).toBe("Drinks");
  });

  it("scanMenu_ShouldReturnParsedSections_WhenGeminiWrapsJsonInPlainFences", async () => {
    const fenced = "```\n" + VALID_GEMINI_RESPONSE + "\n```";
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(fenced));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE]);
    expect(sections).toHaveLength(2);
  });

  it("scanMenu_ShouldReturnParsedSections_WhenGeminiPrependsProse", async () => {
    const withProse = "Here is the extracted menu:\n" + VALID_GEMINI_RESPONSE;
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(withProse));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE]);
    expect(sections).toHaveLength(2);
  });

  it("scanMenu_ShouldReturnEmptySections_WhenImageIsNotAMenu", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse('{"sections":[]}'));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE]);
    expect(sections).toHaveLength(0);
  });

  it("scanMenu_ShouldFilterOutEmptySections_WhenSectionHasNoItems", async () => {
    const responseWithEmpty = JSON.stringify({
      sections: [
        { section: "Drinks", items: [{ name: "Water", description: "", price: "Free" }] },
        { section: "Empty Section", items: [] },
      ],
    });
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(responseWithEmpty));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE]);
    expect(sections).toHaveLength(1);
    expect(sections[0].section).toBe("Drinks");
  });

  it("scanMenu_ShouldThrowChatQuotaExceededError_WhenGeminiReturnsQuotaError", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Quota exceeded for metric: generativelanguage"));
    const service = makeService();
    await expect(service.scanMenu([TEST_IMAGE])).rejects.toBeInstanceOf(ChatQuotaExceededError);
  });

  it("scanMenu_ShouldThrowChatQuotaExceededError_WhenGeminiReturnsRateLimitError", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Resource exhausted"));
    const service = makeService();
    await expect(service.scanMenu([TEST_IMAGE])).rejects.toBeInstanceOf(ChatQuotaExceededError);
  });

  it("scanMenu_ShouldThrow_WhenGeminiApiThrowsGenericError", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Network error"));
    const service = makeService();
    await expect(service.scanMenu([TEST_IMAGE])).rejects.toThrow("Failed to scan menu image");
  });

  it("scanMenu_ShouldPassBase64EncodedInlineDataAsFirstPart_WhenSingleImageProvided", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(VALID_GEMINI_RESPONSE));
    const service = makeService();
    await service.scanMenu([TEST_IMAGE]);

    const [parts] = mockGenerateContent.mock.calls[0];
    // Single image: first part is inlineData, last part is text prompt (no page label)
    expect(parts[0]).toEqual({
      inlineData: {
        data: TEST_IMAGE.buffer.toString("base64"),
        mimeType: TEST_IMAGE.mimeType,
      },
    });
    expect(parts[parts.length - 1]).toHaveProperty("text");
    expect(parts.some((p: { text?: string }) => p.text?.startsWith("Page"))).toBe(false);
  });

  it("scanMenu_ShouldPrependPageLabels_WhenMultipleImagesProvided", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(VALID_GEMINI_RESPONSE));
    const service = makeService();
    await service.scanMenu([TEST_IMAGE, TEST_IMAGE_2]);

    const [parts] = mockGenerateContent.mock.calls[0];
    // Multi-image: parts should be [text"Page 1", inlineData1, text"Page 2", inlineData2, textPrompt]
    expect(parts[0]).toEqual({ text: "Page 1 of 2:" });
    expect(parts[1]).toHaveProperty("inlineData");
    expect(parts[2]).toEqual({ text: "Page 2 of 2:" });
    expect(parts[3]).toHaveProperty("inlineData");
  });

  it("scanMenu_ShouldIncludeMultiPagePreamble_WhenMultipleImagesProvided", async () => {
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(VALID_GEMINI_RESPONSE));
    const service = makeService();
    await service.scanMenu([TEST_IMAGE, TEST_IMAGE_2]);

    const [parts] = mockGenerateContent.mock.calls[0];
    const promptPart = parts[parts.length - 1] as { text: string };
    expect(promptPart.text).toContain("consecutive pages");
  });

  it("scanMenu_ShouldReturnSectionsInOrder_WhenMultipleImagesProvided", async () => {
    const multiPageResponse = JSON.stringify({
      sections: [
        { section: "Starters", items: [{ name: "Soup", description: "", price: "$5" }] },
        { section: "Mains", items: [{ name: "Burger", description: "", price: "$12" }] },
        { section: "Desserts", items: [{ name: "Cake", description: "", price: "$6" }] },
      ],
    });
    mockGenerateContent.mockResolvedValue(makeSuccessResponse(multiPageResponse));
    const service = makeService();
    const sections = await service.scanMenu([TEST_IMAGE, TEST_IMAGE_2]);

    expect(sections[0].section).toBe("Starters");
    expect(sections[1].section).toBe("Mains");
    expect(sections[2].section).toBe("Desserts");
  });
});

import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { ScannedMenuSection } from "../types";
import { ChatQuotaExceededError } from "./chat";

const GEMINI_MODEL = "gemini-2.5-flash";
const QUOTA_EXCEEDED_PATTERN = /quota exceeded/i;
const RATE_LIMIT_PATTERN = /rate limit|resource exhausted/i;

const BASE_SCAN_PROMPT = `Analyze the restaurant menu image(s) and extract all menu items, grouped by section (e.g. Drinks, Starters, Mains, Desserts, Specials).

Return ONLY a valid JSON object — no markdown, no code fences, no commentary:
{
  "sections": [
    {
      "section": "Section Name",
      "items": [
        { "name": "Item Name", "description": "Brief description or empty string", "price": "Price as written or empty string" }
      ]
    }
  ]
}

ORDERING IS CRITICAL — violations will cause incorrect output:
1. Output sections in the exact order they FIRST APPEAR, reading each page left-to-right, top-to-bottom.
2. Output items within each section in the exact visual order they appear on the menu.
3. Never reorder, sort alphabetically, or group items differently from how they are printed.
4. Use an empty string for missing fields — never omit a key.
5. Do NOT invent or hallucinate items, prices, or descriptions.
6. If the image is not a menu or is unreadable, return: {"sections":[]}`;

const MULTI_PAGE_PREAMBLE = (n: number): string =>
  `You are analyzing ${n} consecutive pages of the same restaurant menu (shown in order, Page 1 first).\n` +
  `Process them sequentially. If a section continues across pages, merge all its items into a single section entry — do not create duplicate section names.\n\n`;

function buildScanPrompt(imageCount: number): string {
  return (imageCount > 1 ? MULTI_PAGE_PREAMBLE(imageCount) : "") + BASE_SCAN_PROMPT;
}

export interface ImageInput {
  buffer: Buffer;
  mimeType: string;
}

export class MenuScanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MenuScanParseError";
  }
}

/**
 * Extracts a raw JSON string from a Gemini response that may be wrapped in
 * markdown code fences (```json … ``` or ``` … ```) or contain leading/trailing
 * prose. Falls back to the trimmed original string when no fence is detected.
 */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  // Fallback: find the first { … } block in case there is surrounding prose
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }
  return trimmed;
}

interface GeminiMenuResponse {
  sections: Array<{
    section: string;
    items: Array<{ name: string; description: string; price: string }>;
  }>;
}

function isValidGeminiResponse(parsed: unknown): parsed is GeminiMenuResponse {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "sections" in parsed &&
    Array.isArray((parsed as GeminiMenuResponse).sections)
  );
}

export class MenuScannerService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async scanMenu(images: ImageInput[]): Promise<ScannedMenuSection[]> {
    const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const parts: Part[] = [];
    images.forEach((img, index) => {
      if (images.length > 1) {
        parts.push({ text: `Page ${index + 1} of ${images.length}:` });
      }
      parts.push({ inlineData: { data: img.buffer.toString("base64"), mimeType: img.mimeType } });
    });
    parts.push({ text: buildScanPrompt(images.length) });

    let raw: string;
    try {
      const result = await model.generateContent(parts);
      raw = result.response.text();
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error("Gemini Vision API error:", errMessage);
      if (QUOTA_EXCEEDED_PATTERN.test(errMessage) || RATE_LIMIT_PATTERN.test(errMessage)) {
        throw new ChatQuotaExceededError();
      }
      throw new Error("Failed to scan menu image");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      console.error("Gemini non-JSON response:", raw.slice(0, 300));
      throw new MenuScanParseError("Gemini returned non-JSON response");
    }

    if (!isValidGeminiResponse(parsed)) {
      throw new MenuScanParseError("Gemini response missing required sections array");
    }

    return parsed.sections.filter((s) => s.items && s.items.length > 0);
  }
}

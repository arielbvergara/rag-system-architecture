/**
 * One-time script to fill the "Ingredients" column (column H) of the Menu
 * Google Sheet using Gemini to generate plausible ingredients from each
 * item's title and description.
 *
 * Run with: pnpm --filter server tsx src/scripts/fill-ingredients.ts
 *
 * Only rows that currently have an empty Ingredients cell are updated.
 */
import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";
import { googleAuth } from "../config/google";
import { SheetsService } from "../services/sheets";

const MENU_SHEET_RANGE = "Menu";
const INGREDIENTS_COLUMN = "H";
const GEMINI_MODEL = "gemini-2.5-flash";
const HEADER_ROW_INDEX = 0;
const TITLE_COLUMN_INDEX = 0;
const DESCRIPTION_COLUMN_INDEX = 1;
const INGREDIENTS_COLUMN_INDEX = 7;

interface MenuRow {
  rowNumber: number; // 1-based sheet row number (header = 1, first data row = 2)
  title: string;
  description: string;
}

async function readMenuRows(sheetsService: SheetsService, spreadsheetId: string): Promise<MenuRow[]> {
  const data = await sheetsService.readSpreadsheet(spreadsheetId, MENU_SHEET_RANGE);
  const rows: MenuRow[] = [];

  data.values.forEach((row, index) => {
    if (index === HEADER_ROW_INDEX) return; // skip header
    const title = row[TITLE_COLUMN_INDEX]?.trim() ?? "";
    const description = row[DESCRIPTION_COLUMN_INDEX]?.trim() ?? "";
    const existingIngredients = row[INGREDIENTS_COLUMN_INDEX]?.trim() ?? "";

    if (title && !existingIngredients) {
      rows.push({
        rowNumber: index + 1, // +1 because index is 0-based; header is row 1
        title,
        description,
      });
    }
  });

  return rows;
}

async function generateIngredients(
  apiKey: string,
  rows: MenuRow[]
): Promise<Map<number, string>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const itemList = rows
    .map((r, i) => `${i + 1}. Title: "${r.title}" | Description: "${r.description}"`)
    .join("\n");

  const prompt = `For each menu item below, generate a short, realistic, comma-separated list of main ingredients. Be specific and accurate based on the dish name and description. Return ONLY a valid JSON array of strings — one string per item, in the same order, with no extra text or markdown.

Menu items:
${itemList}

Example output format (for 3 items): ["Ingredient A, Ingredient B", "Ingredient C, Ingredient D", "Ingredient E, Ingredient F"]`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip markdown code fences if present
  const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const parsed: unknown = JSON.parse(jsonText);

  if (!Array.isArray(parsed) || parsed.length !== rows.length) {
    throw new Error(
      `Gemini returned ${Array.isArray(parsed) ? parsed.length : "non-array"} items but expected ${rows.length}`
    );
  }

  const map = new Map<number, string>();
  rows.forEach((row, i) => {
    const value = String(parsed[i]).trim();
    map.set(row.rowNumber, value);
  });

  return map;
}

async function writeIngredients(
  spreadsheetId: string,
  ingredientsMap: Map<number, string>
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: googleAuth });

  const data = Array.from(ingredientsMap.entries()).map(([rowNumber, value]) => ({
    range: `${MENU_SHEET_RANGE}!${INGREDIENTS_COLUMN}${rowNumber + 1}`, // +1: header is row 1, first data row is row 2
    values: [[value]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });
}

async function fillIngredients(): Promise<void> {
  const sheetsId = config.google.sheetsId;
  if (!sheetsId) {
    console.error("GOOGLE_SHEETS_ID is not configured");
    process.exit(1);
  }

  const geminiApiKey = config.gemini.apiKey;
  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY is not configured");
    process.exit(1);
  }

  console.log(`Reading Menu sheet from: ${sheetsId}`);
  const sheetsService = new SheetsService(googleAuth);
  const rows = await readMenuRows(sheetsService, sheetsId);

  if (rows.length === 0) {
    console.log("No rows with empty Ingredients found. Nothing to do.");
    return;
  }

  console.log(`Found ${rows.length} row(s) with empty Ingredients. Generating via Gemini...`);
  rows.forEach((r) => console.log(`  → Row ${r.rowNumber + 1}: "${r.title}"`));

  const ingredientsMap = await generateIngredients(geminiApiKey, rows);

  console.log("\nGenerated ingredients:");
  ingredientsMap.forEach((value, rowNumber) => {
    const row = rows.find((r) => r.rowNumber === rowNumber)!;
    console.log(`  Row ${rowNumber + 1} (${row.title}): ${value}`);
  });

  console.log("\nWriting to sheet...");
  await writeIngredients(sheetsId, ingredientsMap);

  console.log("Done. ✓");
}

fillIngredients().catch((err: Error) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});

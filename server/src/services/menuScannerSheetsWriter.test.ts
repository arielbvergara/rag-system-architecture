import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleAuth } from "google-auth-library";

// ── Hoist mock refs ────────────────────────────────────────────────────────────
const {
  mockSpreadsheetsGet,
  mockValuesClear,
  mockValuesUpdate,
  mockBatchUpdate,
} = vi.hoisted(() => ({
  mockSpreadsheetsGet: vi.fn(),
  mockValuesClear: vi.fn(),
  mockValuesUpdate: vi.fn(),
  mockBatchUpdate: vi.fn(),
}));

// ── Mock googleapis ────────────────────────────────────────────────────────────
vi.mock("googleapis", () => ({
  google: {
    sheets: vi.fn().mockReturnValue({
      spreadsheets: {
        get: mockSpreadsheetsGet,
        values: {
          clear: mockValuesClear,
          update: mockValuesUpdate,
        },
        batchUpdate: mockBatchUpdate,
      },
    }),
  },
}));

import { MenuScannerSheetsWriter, SheetNotFoundError } from "./menuScannerSheetsWriter";
import type { ScannedMenuSection } from "../types";

const TEST_SPREADSHEET_ID = "test-spreadsheet-id";
const TEST_SHEET_GID = 990327283;
const TEST_SHEET_TITLE = "Menu Scanner";

const SAMPLE_SECTIONS: ScannedMenuSection[] = [
  {
    section: "Drinks",
    items: [
      { name: "Espresso", description: "Rich espresso", price: "$2.50" },
      { name: "Latte", description: "Steamed milk", price: "$3.50" },
    ],
  },
  {
    section: "Mains",
    items: [
      { name: "Steak", description: "8oz sirloin", price: "$28.00" },
    ],
  },
];

function makeWriter(): MenuScannerSheetsWriter {
  const mockAuth = {
    getClient: vi.fn().mockResolvedValue({}),
  } as unknown as GoogleAuth;
  return new MenuScannerSheetsWriter(mockAuth, TEST_SPREADSHEET_ID, TEST_SHEET_GID);
}

function makeGetResponse(sheetId: number, title: string) {
  return {
    data: {
      sheets: [{ properties: { sheetId, title } }],
    },
  };
}

describe("MenuScannerSheetsWriter.write", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpreadsheetsGet.mockResolvedValue(makeGetResponse(TEST_SHEET_GID, TEST_SHEET_TITLE));
    mockValuesClear.mockResolvedValue({});
    mockValuesUpdate.mockResolvedValue({});
    mockBatchUpdate.mockResolvedValue({});
  });

  it("write_ShouldResolveSheetNameFromGid_WhenSheetExists", async () => {
    const writer = makeWriter();
    await writer.write(SAMPLE_SECTIONS);
    expect(mockValuesClear).toHaveBeenCalledWith(
      expect.objectContaining({ range: `'${TEST_SHEET_TITLE}'` })
    );
  });

  it("write_ShouldThrow_WhenGidDoesNotMatchAnySheet", async () => {
    mockSpreadsheetsGet.mockResolvedValue({
      data: { sheets: [{ properties: { sheetId: 999, title: "Other" } }] },
    });
    const writer = makeWriter();
    await expect(writer.write(SAMPLE_SECTIONS)).rejects.toBeInstanceOf(SheetNotFoundError);
  });

  it("write_ShouldCallClearBeforeUpdate_WhenSheetExists", async () => {
    const callOrder: string[] = [];
    mockValuesClear.mockImplementation(async () => { callOrder.push("clear"); });
    mockValuesUpdate.mockImplementation(async () => { callOrder.push("update"); });

    const writer = makeWriter();
    await writer.write(SAMPLE_SECTIONS);

    expect(callOrder[0]).toBe("clear");
    expect(callOrder[1]).toBe("update");
  });

  it("write_ShouldBuildCorrectRowLayout_WhenSectionsProvided", async () => {
    const writer = makeWriter();
    await writer.write(SAMPLE_SECTIONS);

    const updateCall = mockValuesUpdate.mock.calls[0][0];
    const rows: string[][] = updateCall.requestBody.values;

    // First section header — 7 columns, only first is non-empty (MenuService isSectionTitleRow)
    expect(rows[0]).toEqual(["DRINKS", "", "", "", "", "", ""]);
    // Column headers — "Title" at col 0 (MenuService isHeaderRow marker), "Price" at col 3, "Image URL" at col 6
    expect(rows[1]).toEqual(["Title", "Description", "", "Price", "", "", "Image URL"]);
    // Item rows — price at col 3, empty Image URL at col 6
    expect(rows[2]).toEqual(["Espresso", "Rich espresso", "", "$2.50", "", "", ""]);
    expect(rows[3]).toEqual(["Latte", "Steamed milk", "", "$3.50", "", "", ""]);
    // Blank separator
    expect(rows[4]).toEqual([]);
    // Second section header
    expect(rows[5]).toEqual(["MAINS", "", "", "", "", "", ""]);
    // Column headers
    expect(rows[6]).toEqual(["Title", "Description", "", "Price", "", "", "Image URL"]);
    // Item rows
    expect(rows[7]).toEqual(["Steak", "8oz sirloin", "", "$28.00", "", "", ""]);
  });

  it("write_ShouldNotAddTrailingSeparatorAfterLastSection_WhenWriting", async () => {
    const writer = makeWriter();
    await writer.write(SAMPLE_SECTIONS);

    const updateCall = mockValuesUpdate.mock.calls[0][0];
    const rows: string[][] = updateCall.requestBody.values;
    const lastRow = rows[rows.length - 1];

    expect(lastRow).toEqual(["Steak", "8oz sirloin", "", "$28.00", "", "", ""]);
  });

  it("write_ShouldApplyBoldToSectionAndColumnHeaderRows_WhenWriting", async () => {
    const writer = makeWriter();
    await writer.write(SAMPLE_SECTIONS);

    const batchCall = mockBatchUpdate.mock.calls[0][0];
    const boldRowIndices = batchCall.requestBody.requests.map(
      (r: { repeatCell: { range: { startRowIndex: number } } }) =>
        r.repeatCell.range.startRowIndex
    );

    // Section headers at row 0 and 5, column headers at row 1 and 6
    expect(boldRowIndices).toContain(0);
    expect(boldRowIndices).toContain(1);
    expect(boldRowIndices).toContain(5);
    expect(boldRowIndices).toContain(6);
  });

  it("write_ShouldReturnSheetUrl_WhenWritingSucceeds", async () => {
    const writer = makeWriter();
    const url = await writer.write(SAMPLE_SECTIONS);
    expect(url).toBe(
      `https://docs.google.com/spreadsheets/d/${TEST_SPREADSHEET_ID}/edit#gid=${TEST_SHEET_GID}`
    );
  });
});

import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { ScannedMenuSection } from "../types";

// Columns are ordered to match MenuService's fixed column indices:
// 0=Title  1=Description  2=Price1Label  3=Price1  4=Price2Label  5=Price2  6=ImageUrl
const COLUMN_HEADERS = ["Title", "Description", "", "Price", "", "", "Image URL"];
const SHEET_URL_BASE = "https://docs.google.com/spreadsheets/d";

export class SheetNotFoundError extends Error {
  constructor(gid: number) {
    super(`No sheet found with gid ${gid}`);
    this.name = "SheetNotFoundError";
  }
}

export class MenuScannerSheetsWriter {
  private readonly auth: GoogleAuth;
  private readonly spreadsheetId: string;
  private readonly sheetGid: number;

  constructor(auth: GoogleAuth, spreadsheetId: string, sheetGid: number) {
    this.auth = auth;
    this.spreadsheetId = spreadsheetId;
    this.sheetGid = sheetGid;
  }

  async write(sections: ScannedMenuSection[]): Promise<string> {
    const authClient = await this.auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient as never });

    const sheetTitle = await this.resolveSheetTitle(sheets);
    await this.clearSheet(sheets, sheetTitle);
    const { allRows, boldRowIndices } = this.buildRows(sections);
    await this.writeValues(sheets, sheetTitle, allRows);
    await this.applyBoldFormatting(sheets, boldRowIndices);

    return `${SHEET_URL_BASE}/${this.spreadsheetId}/edit#gid=${this.sheetGid}`;
  }

  private async resolveSheetTitle(
    sheets: ReturnType<typeof google.sheets>
  ): Promise<string> {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const sheet = response.data.sheets?.find(
      (s) => s.properties?.sheetId === this.sheetGid
    );

    if (!sheet?.properties?.title) {
      throw new SheetNotFoundError(this.sheetGid);
    }

    return sheet.properties.title;
  }

  private async clearSheet(
    sheets: ReturnType<typeof google.sheets>,
    sheetTitle: string
  ): Promise<void> {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetTitle}'`,
    });
  }

  private buildRows(sections: ScannedMenuSection[]): {
    allRows: string[][];
    boldRowIndices: number[];
  } {
    const allRows: string[][] = [];
    const boldRowIndices: number[] = [];

    sections.forEach((section, sectionIndex) => {
      // Section header row (bold) — single value, rest empty so MenuService identifies it as a section title
      boldRowIndices.push(allRows.length);
      allRows.push([section.section.toUpperCase(), "", "", "", "", "", ""]);

      // Column headers row (bold)
      boldRowIndices.push(allRows.length);
      allRows.push(COLUMN_HEADERS);

      // Data rows
      section.items.forEach((item) => {
        // price at col 3 (COL_PRICE1), Image URL at col 6 left empty for the user to fill in
        allRows.push([item.name, item.description, "", item.price, "", "", ""]);
      });

      // Blank separator row between sections (not after the last one)
      if (sectionIndex < sections.length - 1) {
        allRows.push([]);
      }
    });

    return { allRows, boldRowIndices };
  }

  private async writeValues(
    sheets: ReturnType<typeof google.sheets>,
    sheetTitle: string,
    allRows: string[][]
  ): Promise<void> {
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetTitle}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: allRows },
    });
  }

  private async applyBoldFormatting(
    sheets: ReturnType<typeof google.sheets>,
    boldRowIndices: number[]
  ): Promise<void> {
    if (boldRowIndices.length === 0) return;

    const requests = boldRowIndices.map((rowIndex) => ({
      repeatCell: {
        range: {
          sheetId: this.sheetGid,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: COLUMN_HEADERS.length,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true },
          },
        },
        fields: "userEnteredFormat.textFormat.bold",
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: { requests },
    });
  }
}

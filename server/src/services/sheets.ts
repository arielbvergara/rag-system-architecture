import { google, sheets_v4 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { SheetData } from "../types";

// Internal shape of the `tables[]` field returned by the Sheets API (not yet in googleapis types)
interface SheetApiTable {
  name: string;
  range: {
    startRowIndex: number;
    endRowIndex: number;
    startColumnIndex: number;
    endColumnIndex: number;
  };
}

export interface SheetTableMetadata {
  displayName: string;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

export class SheetsService {
  private sheets: sheets_v4.Sheets;

  constructor(auth: GoogleAuth) {
    this.sheets = google.sheets({ version: "v4", auth });
  }

  async readSpreadsheet(
    spreadsheetId: string,
    range = "Sheet1"
  ): Promise<SheetData> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return {
      range: response.data.range || range,
      values: (response.data.values as string[][]) || [],
    };
  }

  async getSheetTables(
    spreadsheetId: string,
    sheetName: string
  ): Promise<SheetTableMetadata[]> {
    let response;
    try {
      // Fetch without a fields mask so the request succeeds even if the `tables`
      // field is not yet supported by all API versions/regions.
      response = await this.sheets.spreadsheets.get({ spreadsheetId });
    } catch {
      // If the metadata fetch fails for any reason, fall back to row-based parsing.
      return [];
    }

    const sheet = response.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );

    // `tables` is a newer API field not yet reflected in the googleapis type definitions
    const tables = (sheet as any)?.tables as SheetApiTable[] | undefined;
    if (!tables?.length) return [];

    return tables
      .filter((t) => t.name && t.range)
      .map((t) => ({
        displayName: t.name,
        startRowIndex: t.range.startRowIndex ?? 0,
        endRowIndex: t.range.endRowIndex ?? 0,
        startColumnIndex: t.range.startColumnIndex ?? 0,
        endColumnIndex: t.range.endColumnIndex ?? 0,
      }))
      .sort((a, b) => a.startRowIndex - b.startRowIndex);
  }

  async appendRow(spreadsheetId: string, values: string[]): Promise<void> {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });
  }
}

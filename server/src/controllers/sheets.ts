import { Request, Response } from "express";
import { googleAuth } from "../config/google";
import { config } from "../config";
import { SheetsService } from "../services/sheets";
import { EmailService } from "../services/email";
import { cache } from "../lib/cache";
import { isValidEmail, isValidSpreadsheetId } from "../lib/validation";
import { ApiResponse, ContactRow } from "../types";

export async function readSpreadsheet(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  try {
    const spreadsheetId = req.params.spreadsheetId as string;

    if (!isValidSpreadsheetId(spreadsheetId)) {
      res.status(400).json({ success: false, error: "Invalid spreadsheet ID" });
      return;
    }

    const range = (req.query.range as string) || "Sheet1";
    const cacheKey = `sheets:${spreadsheetId}:${range}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const sheetsService = new SheetsService(googleAuth);
    const data = await sheetsService.readSpreadsheet(spreadsheetId, range);

    cache.set(cacheKey, data);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Sheets read error:", error.message);
    res.status(500).json({ success: false, error: "Failed to read spreadsheet" });
  }
}

export async function appendRow(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  try {
    const { name, email, phone, message }: ContactRow = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ success: false, error: "name, email, and message are required" });
      return;
    }

    if (!config.google.sheetsId) {
      res.status(500).json({ success: false, error: "GOOGLE_SHEETS_ID is not configured" });
      return;
    }

    const timestamp = new Date().toISOString();
    const values = [timestamp, name, email, phone || "", message];

    const sheetsService = new SheetsService(googleAuth);
    await sheetsService.appendRow(config.google.sheetsId, values);

    // Invalidate cached reads for this sheet so the next GET reflects the new row
    cache.invalidatePrefix(`sheets:${config.google.sheetsId}:`);

    // Send receipt email to the submitter (non-blocking, only when address is valid)
    if (isValidEmail(email)) {
      const emailService = new EmailService();
      emailService
        .sendEmail({
          to: email,
          subject: "We received your message",
          body: `Hi ${name},\n\nThank you for reaching out! We've received your message and will get back to you shortly.\n\nYour message:\n${message}`,
        })
        .catch((err) => console.error("Contact receipt email error:", err.message));
    }

    res.status(201).json({ success: true, message: "Contact registered successfully" });
  } catch (error: any) {
    console.error("Sheets appendRow error:", error.message);
    res.status(500).json({ success: false, error: "Failed to register contact" });
  }
}

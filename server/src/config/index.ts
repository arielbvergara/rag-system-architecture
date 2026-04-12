import dotenv from "dotenv";
import path from "path";

// Load .env then .env.local from project root (.env.local overrides .env)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  google: {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    sheetsId: process.env.GOOGLE_SHEETS_ID || "",
  },
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || "",
    senderEmail: process.env.GMAIL_SENDER_EMAIL || "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  },
  email: {
    allowedRecipients: process.env.ALLOWED_EMAIL_RECIPIENTS
      ? process.env.ALLOWED_EMAIL_RECIPIENTS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
      : [],
  },
  admin: {
    password: process.env.ADMIN_PASSWORD || "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "",
  },
  menuScanner: {
    spreadsheetId: process.env.MENU_SCANNER_SPREADSHEET_ID || "1f1RxKGchgGyGHl9lQdOG8DIiOa6lh8xVIk-tLOLVezM",
    sheetGid: parseInt(process.env.MENU_SCANNER_SHEET_GID || "990327283", 10),
  },
} as const;

// Validate required config in production
if (config.env === "production") {
  const required = [
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REFRESH_TOKEN",
    "GMAIL_SENDER_EMAIL",
    "GEMINI_API_KEY",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

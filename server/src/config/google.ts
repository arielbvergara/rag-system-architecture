import { google } from "googleapis";
import { config } from "./index";

export const googleAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: config.google.serviceAccountEmail,
    private_key: config.google.privateKey,
  },
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
});

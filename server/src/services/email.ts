import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config";
import { EmailPayload } from "../types";

export class EmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.gmail.clientId,
      config.gmail.clientSecret
    );
    this.oauth2Client.setCredentials({
      refresh_token: config.gmail.refreshToken,
    });
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

    const mimeMessage = [
      `From: ${config.gmail.senderEmail}`,
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      payload.body,
    ].join("\r\n");

    const encodedMessage = Buffer.from(mimeMessage).toString("base64url");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });
  }
}

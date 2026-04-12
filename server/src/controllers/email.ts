import { Request, Response } from "express";
import { EmailService } from "../services/email";
import { config } from "../config";
import { isValidEmail } from "../lib/validation";
import { ApiResponse, EmailPayload } from "../types";

export async function sendEmail(
  req: Request,
  res: Response<ApiResponse>
): Promise<void> {
  try {
    const { to, subject, body }: EmailPayload = req.body;

    if (!to || !subject || !body) {
      res.status(400).json({
        success: false,
        error: "to, subject, and body are required",
      });
      return;
    }

    if (!isValidEmail(to)) {
      res.status(400).json({ success: false, error: "Invalid email address" });
      return;
    }

    const { allowedRecipients } = config.email;
    if (allowedRecipients.length > 0 && !allowedRecipients.includes(to.toLowerCase())) {
      res.status(403).json({ success: false, error: "Recipient not allowed" });
      return;
    }

    const emailService = new EmailService();
    await emailService.sendEmail({ to, subject, body });

    res.status(201).json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Email sendEmail error:", error.message);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
}

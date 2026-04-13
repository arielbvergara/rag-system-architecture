import { Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import type { ApiResponse } from "../types";
import { createSession } from "../middleware/adminAuth";
import { config } from "../config";
import { authLimiter } from "../middleware/rateLimit";

export { authLimiter };

export async function authenticate(
  req: Request,
  res: Response<ApiResponse<{ token: string }>>
): Promise<void> {
  const { password } = req.body as { password?: string };

  if (typeof password !== "string" || !password) {
    res.status(400).json({ success: false, error: "Password is required" });
    return;
  }

  const storedPassword = config.admin.password;
  if (
    !storedPassword ||
    password.length !== storedPassword.length ||
    !timingSafeEqual(Buffer.from(password), Buffer.from(storedPassword))
  ) {
    res.status(401).json({ success: false, error: "Invalid password" });
    return;
  }

  const token = createSession();
  res.json({ success: true, data: { token } });
}

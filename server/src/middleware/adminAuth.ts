import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import type { AdminSession } from "../types";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sessions = new Map<string, AdminSession>();

export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { token, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function invalidateExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  const session = sessions.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  next();
}

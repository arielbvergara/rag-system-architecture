import { Request, Response } from "express";
import { config } from "../config";
import { createSession, invalidateExpiredSessions } from "../middleware/adminAuth";
import * as cloudinaryService from "../services/cloudinaryService";

export async function authenticate(req: Request, res: Response): Promise<void> {
  const { password } = req.body as { password?: unknown };

  if (!password || typeof password !== "string") {
    res.status(400).json({ success: false, error: "Password is required" });
    return;
  }

  if (password !== config.admin.password) {
    res.status(401).json({ success: false, error: "Invalid password" });
    return;
  }

  invalidateExpiredSessions();
  const token = createSession();
  res.status(200).json({ success: true, data: { token } });
}

export async function listImages(_req: Request, res: Response): Promise<void> {
  try {
    const images = await cloudinaryService.listImages();
    res.status(200).json({ success: true, data: images });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch images" });
  }
}

export async function deleteImage(req: Request, res: Response): Promise<void> {
  const rawId = req.params["publicId"];
  const publicId = Array.isArray(rawId) ? rawId.join("/") : rawId;

  if (!publicId) {
    res.status(400).json({ success: false, error: "publicId is required" });
    return;
  }

  if (!publicId.startsWith(`${config.cloudinary.folder}/`)) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  try {
    await cloudinaryService.deleteImage(publicId);
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
}

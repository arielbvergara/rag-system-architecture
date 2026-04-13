import multer from "multer";
import { RequestHandler } from "express";
import path from "path";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain", "text/markdown"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".markdown"]);
const UPLOAD_FIELD_NAME = "document";

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, plain text, and Markdown files are allowed."));
  }
};

export const uploadDocument: RequestHandler = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single(UPLOAD_FIELD_NAME);

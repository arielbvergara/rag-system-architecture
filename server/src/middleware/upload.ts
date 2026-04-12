import multer from "multer";
import { RequestHandler } from "express";
import path from "path";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES_COUNT = 5;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const UPLOAD_FIELD_NAME = "images";

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP images are allowed."));
  }
};

export const uploadMenuImage: RequestHandler = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).array(UPLOAD_FIELD_NAME, MAX_IMAGES_COUNT);

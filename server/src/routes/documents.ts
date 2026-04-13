import { Router, IRouter } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { readLimiter, writeLimiter, uploadLimiter } from "../middleware/rateLimit";
import { uploadDocument as uploadMiddleware } from "../middleware/upload";
import {
  uploadDocument,
  listDocuments,
  getDocumentStatus,
  getDocumentChunk,
  deleteDocument,
} from "../controllers/documentsController";

const router: IRouter = Router();

router.post("/", adminAuth, uploadLimiter, uploadMiddleware, uploadDocument);
router.get("/", readLimiter, listDocuments);
router.get("/:id/status", readLimiter, getDocumentStatus);
router.get("/:id/chunks/:chunkId", readLimiter, getDocumentChunk);
router.delete("/:id", adminAuth, writeLimiter, deleteDocument);

export default router;

import { Router, IRouter } from "express";
import { authLimiter, readLimiter, writeLimiter } from "../middleware/rateLimit";
import { adminAuth } from "../middleware/adminAuth";
import { authenticate, listImages, deleteImage } from "../controllers/adminController";

const router: IRouter = Router();

router.post("/auth", authLimiter, authenticate);
router.get("/images", adminAuth, readLimiter, listImages);
router.delete("/images/:publicId", adminAuth, writeLimiter, deleteImage);

export default router;

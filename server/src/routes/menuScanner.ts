import { Router, IRouter } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { scanLimiter } from "../middleware/rateLimit";
import { uploadMenuImage } from "../middleware/upload";
import { scanMenu } from "../controllers/menuScannerController";

const router: IRouter = Router();

router.post("/scan", adminAuth, scanLimiter, uploadMenuImage, scanMenu);

export default router;

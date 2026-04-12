import { Router, IRouter } from "express";
import { listFiles, downloadFile } from "../controllers/drive";
import { readLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.get("/files", readLimiter, listFiles);
router.get("/files/:fileId", readLimiter, downloadFile);

export default router;

import { Router, IRouter } from "express";
import { authLimiter } from "../middleware/rateLimit";
import { authenticate } from "../controllers/adminController";

const router: IRouter = Router();

router.post("/auth", authLimiter, authenticate);

export default router;

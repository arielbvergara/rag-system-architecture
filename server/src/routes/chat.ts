import { Router, IRouter } from "express";
import { chatLimiter } from "../middleware/rateLimit";
import { sendMessage } from "../controllers/chat";

const router: IRouter = Router();

router.post("/", chatLimiter, sendMessage);

export default router;

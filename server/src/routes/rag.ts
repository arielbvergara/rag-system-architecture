import { Router, IRouter } from "express";
import { ragLimiter } from "../middleware/rateLimit";
import { chat, chatStream } from "../controllers/ragController";

const router: IRouter = Router();

router.post("/chat", ragLimiter, chat);
router.post("/chat/stream", ragLimiter, chatStream);

export default router;

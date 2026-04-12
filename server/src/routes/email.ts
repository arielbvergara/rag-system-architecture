import { Router, IRouter } from "express";
import { sendEmail } from "../controllers/email";
import { writeLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.post("/send", writeLimiter, sendEmail);

export default router;

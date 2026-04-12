import { Router, IRouter } from "express";
import { getMenu } from "../controllers/menu";
import { readLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.get("/", readLimiter, getMenu);

export default router;

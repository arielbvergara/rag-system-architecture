import { Router, IRouter } from "express";
import { listEvents, createEvent } from "../controllers/calendar";
import { readLimiter, writeLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.get("/events", readLimiter, listEvents);
router.post("/events", writeLimiter, createEvent);

export default router;

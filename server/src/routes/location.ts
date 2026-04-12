import { Router, IRouter } from "express";
import { getLocationDetails } from "../controllers/location";
import { readLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.get("/", readLimiter, getLocationDetails);

export default router;

import { Router, IRouter } from "express";
import { getNearbyRestaurants } from "../controllers/nearbyRestaurants";
import { readLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.get("/", readLimiter, getNearbyRestaurants);

export default router;

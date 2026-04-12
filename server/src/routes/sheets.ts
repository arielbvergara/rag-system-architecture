import { Router, IRouter } from "express";
import { readSpreadsheet, appendRow } from "../controllers/sheets";
import { readLimiter, writeLimiter } from "../middleware/rateLimit";

const router: IRouter = Router();

router.post("/rows", writeLimiter, appendRow);
router.get("/:spreadsheetId", readLimiter, readSpreadsheet);

export default router;

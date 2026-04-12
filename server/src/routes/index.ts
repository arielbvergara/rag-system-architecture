import { Router, IRouter } from "express";
import calendarRoutes from "./calendar";
import sheetsRoutes from "./sheets";
import driveRoutes from "./drive";
import emailRoutes from "./email";
import menuRoutes from "./menu";
import chatRoutes from "./chat";
import locationRoutes from "./location";
import nearbyRestaurantsRoutes from "./nearbyRestaurants";
import adminRoutes from "./admin";
import menuScannerRoutes from "./menuScanner";

const router: IRouter = Router();

router.use("/calendar", calendarRoutes);
router.use("/sheets", sheetsRoutes);
router.use("/drive", driveRoutes);
router.use("/email", emailRoutes);
router.use("/menu", menuRoutes);
router.use("/chat", chatRoutes);
router.use("/location", locationRoutes);
router.use("/nearby-restaurants", nearbyRestaurantsRoutes);
router.use("/admin", adminRoutes);
router.use("/menu-scanner", menuScannerRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

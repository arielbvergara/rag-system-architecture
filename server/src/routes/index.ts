import { Router, IRouter } from "express";
import adminRoutes from "./admin";
import documentsRoutes from "./documents";
import ragRoutes from "./rag";

const router: IRouter = Router();

router.use("/admin", adminRoutes);
router.use("/documents", documentsRoutes);
router.use("/rag", ragRoutes);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

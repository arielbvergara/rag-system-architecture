import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { errorHandler } from "./middleware/error";
import routes from "./routes";

const app: Express = express();

// ── Security & Parsing ──────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logging ─────────────────────────────────────────
app.use(morgan(config.env === "production" ? "combined" : "dev"));

// ── Routes ──────────────────────────────────────────
app.use("/api", routes);

// ── Error Handler ───────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   Server running on port ${config.port}           │
  │   http://localhost:${config.port}                 │
  │   Environment: ${config.env.padEnd(24)}│
  │                                         │
  └─────────────────────────────────────────┘
  `);

});

export default app;

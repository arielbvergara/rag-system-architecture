import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}

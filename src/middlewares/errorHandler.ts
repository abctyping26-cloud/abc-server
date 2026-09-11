import type { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status,
    message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
};

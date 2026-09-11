import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/index.js";
import apiRouter from "./routes/index.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { getHealth } from "./controllers/health.controller.js";

export const createApp = (): Application => {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);
        if (
          config.nodeEnv === "development" ||
          config.allowedOrigins.includes(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error("Blocked by CORS policy"));
      },
      credentials: true,
    })
  );

  // Request logger
  app.use(morgan(config.isProduction ? "combined" : "dev"));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root health check
  app.get("/health", getHealth);

  // API router
  app.use("/api/v1", apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

export default createApp;

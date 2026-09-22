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

  // Security HTTP headers with cross-origin allowed for API consumers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);

        // Always allow localhost and local IP addresses
        const isLocal =
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|192\.0\.0\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(
            origin
          );

        if (isLocal || config.nodeEnv === "development" || config.allowedOrigins.includes("*")) {
          return callback(null, true);
        }

        const cleanOrigin = origin.replace(/\/$/, "").toLowerCase();
        const configuredOrigins = [
          ...config.allowedOrigins,
          ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
        ].map((o) => o.trim().replace(/\/$/, "").toLowerCase());

        if (configuredOrigins.includes(cleanOrigin)) {
          return callback(null, true);
        }

        try {
          const parsed = new URL(origin);
          const hostname = parsed.hostname.toLowerCase();
          // Allow all Vercel and Render frontend deployments
          if (hostname.endsWith(".vercel.app") || hostname.endsWith(".onrender.com")) {
            return callback(null, true);
          }
        } catch {
          // Ignore URL parsing errors
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-admin-id",
        "x-admin-role",
        "x-admin-identifier",
      ],
    })
  );

  // Request logger
  app.use(morgan(config.isProduction ? "combined" : "dev"));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root health check (open CORS to allow pre-warming from any client domain)
  app.get("/health", cors({ origin: true }), getHealth);

  // API router
  app.use("/api/v1", apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

export default createApp;

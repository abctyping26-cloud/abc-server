import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

const app = createApp();

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
    console.log(`📡 Health check: http://localhost:${config.port}/health`);
    console.log(`🌐 API base:    http://localhost:${config.port}/api/v1`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      await disconnectDatabase();
      console.log("Process terminated.");
      process.exit(0);
    });

    // Force close after 10s if connections linger
    setTimeout(() => {
      console.error("Forcefully shutting down server due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();

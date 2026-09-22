import type { Request, Response } from "express";
import mongoose from "mongoose";
import { cloudinary } from "../config/cloudinary.js";
import { config } from "../config/index.js";

/**
 * Format bytes into human-readable strings (e.g. 1.25 MB)
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${parseFloat(val.toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format uptime seconds into human-readable duration
 */
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

/**
 * Fetch Cloudinary, MongoDB, and Render plan & infrastructure usage metrics
 */
export const getCloudUsageAnalytics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  // 1. Fetch Cloudinary Usage
  const fetchCloudinary = async () => {
    if (!config.cloudinaryApiKey || !config.cloudinaryCloudName || !config.cloudinaryApiSecret) {
      return {
        status: "unconfigured",
        message: "Cloudinary credentials are not configured in environment.",
      };
    }

    try {
      const usage = await cloudinary.api.usage();
      const storageBytes = usage.storage?.usage ?? 0;
      const bandwidthBytes = usage.bandwidth?.usage ?? 0;
      const creditsUsage = usage.credits?.usage ?? 0;
      const creditsLimit = usage.credits?.limit ?? 25;
      const percentUsage =
        typeof usage.credits?.percent_usage === "number"
          ? usage.credits.percent_usage
          : creditsLimit > 0
          ? parseFloat(((creditsUsage / creditsLimit) * 100).toFixed(1))
          : 0;

      return {
        status: "active",
        plan: usage.plan || "Free",
        lastUpdated: usage.last_updated || new Date().toISOString(),
        credits: {
          usage: creditsUsage,
          limit: creditsLimit,
          percentUsage: Math.min(100, percentUsage),
        },
        storage: {
          bytes: storageBytes,
          formatted: formatBytes(storageBytes),
          creditsUsage: usage.storage?.credits_usage ?? 0,
        },
        bandwidth: {
          bytes: bandwidthBytes,
          formatted: formatBytes(bandwidthBytes),
          creditsUsage: usage.bandwidth?.credits_usage ?? 0,
        },
        transformations: {
          usage: usage.transformations?.usage ?? 0,
          creditsUsage: usage.transformations?.credits_usage ?? 0,
        },
        objects: {
          count: usage.objects?.usage ?? 0,
        },
      };
    } catch (error: any) {
      console.error("Cloudinary usage fetch error:", error?.message || error);
      return {
        status: "error",
        message: error?.message || "Failed to fetch Cloudinary usage report.",
      };
    }
  };

  // 2. Fetch MongoDB Database Statistics
  const fetchMongo = async () => {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return {
        status: "disconnected",
        message: "MongoDB connection is not currently established.",
      };
    }

    try {
      const db = mongoose.connection.db;
      const stats = await db.command({ dbStats: 1 });
      const freeTierQuotaBytes = 512 * 1024 * 1024; // Standard MongoDB Atlas Free Tier M0 (512 MB)
      const storageBytes = stats.storageSize ?? 0;
      const dataBytes = stats.dataSize ?? 0;
      const indexBytes = stats.indexSize ?? 0;
      const totalBytes = storageBytes + indexBytes;
      const percentUsed = parseFloat(
        ((storageBytes / freeTierQuotaBytes) * 100).toFixed(2)
      );

      return {
        status: "connected",
        dbName: stats.db || mongoose.connection.name || "abc_db",
        collections: stats.collections ?? 0,
        documents: stats.objects ?? 0,
        avgObjectSizeFormatted: formatBytes(stats.avgObjSize ?? 0),
        storage: {
          bytes: storageBytes,
          formatted: formatBytes(storageBytes),
          percentUsed: Math.min(100, percentUsed),
          quotaBytes: freeTierQuotaBytes,
          quotaFormatted: "512 MB (Atlas Free Tier)",
        },
        data: {
          bytes: dataBytes,
          formatted: formatBytes(dataBytes),
        },
        indexes: {
          count: stats.indexes ?? 0,
          bytes: indexBytes,
          formatted: formatBytes(indexBytes),
        },
        totalSize: {
          bytes: totalBytes,
          formatted: formatBytes(totalBytes),
        },
      };
    } catch (error: any) {
      console.error("MongoDB stats fetch error:", error?.message || error);
      return {
        status: "error",
        message: error?.message || "Failed to query MongoDB database statistics.",
      };
    }
  };

  // 3. Render / Node Server Runtime Metrics
  const fetchRender = async () => {
    try {
      const mem = process.memoryUsage();
      const renderMemoryLimitBytes = 512 * 1024 * 1024; // 512 MB RAM on Render Free Web Service
      const memoryPercent = parseFloat(
        ((mem.rss / renderMemoryLimitBytes) * 100).toFixed(1)
      );
      const isRender = Boolean(process.env.RENDER);

      return {
        status: "operational",
        isRender,
        serviceName: process.env.RENDER_SERVICE_NAME || "abc-server",
        serviceId: process.env.RENDER_SERVICE_ID || null,
        plan: isRender ? "Render Free Web Service" : "Node.js Server Runtime",
        uptimeSeconds: Math.floor(process.uptime()),
        uptimeFormatted: formatUptime(process.uptime()),
        nodeVersion: process.version,
        environment: config.nodeEnv,
        memory: {
          rssBytes: mem.rss,
          rssFormatted: formatBytes(mem.rss),
          heapUsedBytes: mem.heapUsed,
          heapUsedFormatted: formatBytes(mem.heapUsed),
          heapTotalBytes: mem.heapTotal,
          heapTotalFormatted: formatBytes(mem.heapTotal),
          limitBytes: renderMemoryLimitBytes,
          limitFormatted: "512 MB RAM",
          percentUsed: Math.min(100, memoryPercent),
        },
      };
    } catch (error: any) {
      console.error("Render runtime metrics error:", error?.message || error);
      return {
        status: "error",
        message: error?.message || "Failed to gather server runtime metrics.",
      };
    }
  };

  // Execute in parallel safely
  const [cloudinaryResult, mongoResult, renderResult] = await Promise.all([
    fetchCloudinary(),
    fetchMongo(),
    fetchRender(),
  ]);

  res.status(200).json({
    status: "success",
    timestamp: new Date().toISOString(),
    data: {
      cloudinary: cloudinaryResult,
      mongodb: mongoResult,
      render: renderResult,
    },
  });
};

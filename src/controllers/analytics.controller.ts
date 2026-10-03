import type { Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
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

/**
 * Singleton Google Analytics Data API client
 */
let gaClient: BetaAnalyticsDataClient | null = null;

function getGAClient(): BetaAnalyticsDataClient | null {
  if (gaClient) return gaClient;

  try {
    if (config.gaCredentialsJson) {
      const credentials = JSON.parse(config.gaCredentialsJson);
      gaClient = new BetaAnalyticsDataClient({ credentials });
      return gaClient;
    }

    if (config.gaKeyFile) {
      let resolvedPath = path.isAbsolute(config.gaKeyFile)
        ? config.gaKeyFile
        : path.resolve(process.cwd(), config.gaKeyFile);

      if (!fs.existsSync(resolvedPath)) {
        resolvedPath = path.resolve(process.cwd(), "server", config.gaKeyFile);
      }

      if (fs.existsSync(resolvedPath)) {
        gaClient = new BetaAnalyticsDataClient({ keyFilename: resolvedPath });
        return gaClient;
      }
    }
  } catch (error: any) {
    console.error("Failed to initialize Google Analytics client:", error?.message || error);
  }

  return null;
}

/**
 * Fetch Google Analytics 4 live web traffic, real-time visitors, entry/exit pages & sources
 */
export const getWebTrafficAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const propertyId = config.gaPropertyId;

  if (!propertyId) {
    res.status(200).json({
      status: "unconfigured",
      message: "Google Analytics property ID is not configured.",
      data: null,
    });
    return;
  }

  const client = getGAClient();
  if (!client) {
    res.status(200).json({
      status: "unconfigured",
      message: "Google Analytics service account credentials file is missing or unreadable.",
      data: null,
    });
    return;
  }

  // Parse time window (default 30 days)
  const range = (req.query.range as string) || "30d";
  let startDate = "30daysAgo";
  if (range === "today") startDate = "today";
  else if (range === "7d") startDate = "7daysAgo";
  else if (range === "14d") startDate = "14daysAgo";
  else if (range === "90d") startDate = "90daysAgo";

  const property = `properties/${propertyId}`;

  try {
    const [
      realtimeRes,
      overviewRes,
      landingRes,
      topPagesRes,
      sourcesRes,
      devicesRes,
      trendRes,
      hostsRes,
    ] = await Promise.allSettled([
      // 1. Real-time active users (now)
      client.runRealtimeReport({
        property,
        metrics: [{ name: "activeUsers" }],
      }),

      // 2. High-level aggregate metrics for the period
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),

      // 3. Entry / Landing Pages (Where people entered)
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "landingPage" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      }),

      // 4. Most Visited Pages & Engagement
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 15,
      }),

      // 5. Traffic Sources (Google, Direct, WhatsApp, Social)
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),

      // 6. Device Categories (Mobile vs Desktop)
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      }),

      // 7. Day-by-Day Trend (Dates)
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),

      // 8. Websites / Hostnames (abcneon vs abctyping)
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate: "today" }],
        dimensions: [{ name: "hostName" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        limit: 10,
      }),
    ]);

    // Parse Realtime
    let liveActiveUsers = 0;
    if (realtimeRes.status === "fulfilled" && realtimeRes.value[0]?.rows?.length) {
      liveActiveUsers = parseInt(
        realtimeRes.value[0].rows[0].metricValues?.[0]?.value || "0",
        10
      );
    }

    // Parse Overview
    let overview = {
      activeUsers: 0,
      sessions: 0,
      screenPageViews: 0,
      bounceRate: 0,
      avgSessionDurationSeconds: 0,
    };
    if (overviewRes.status === "fulfilled" && overviewRes.value[0]?.rows?.length) {
      const row = overviewRes.value[0].rows[0];
      overview = {
        activeUsers: parseInt(row.metricValues?.[0]?.value || "0", 10),
        sessions: parseInt(row.metricValues?.[1]?.value || "0", 10),
        screenPageViews: parseInt(row.metricValues?.[2]?.value || "0", 10),
        bounceRate: parseFloat(
          (parseFloat(row.metricValues?.[3]?.value || "0") * 100).toFixed(1)
        ),
        avgSessionDurationSeconds: Math.round(
          parseFloat(row.metricValues?.[4]?.value || "0")
        ),
      };
    }

    // Parse Landing Pages (Entry Pages)
    const landingPages =
      landingRes.status === "fulfilled"
        ? (landingRes.value[0]?.rows || []).map((r) => ({
            page: r.dimensionValues?.[0]?.value || "/",
            sessions: parseInt(r.metricValues?.[0]?.value || "0", 10),
            users: parseInt(r.metricValues?.[1]?.value || "0", 10),
            bounceRate: parseFloat(
              (parseFloat(r.metricValues?.[2]?.value || "0") * 100).toFixed(1)
            ),
          }))
        : [];

    // Parse Top Visited Pages
    const topPages =
      topPagesRes.status === "fulfilled"
        ? (topPagesRes.value[0]?.rows || []).map((r) => ({
            path: r.dimensionValues?.[0]?.value || "/",
            title: r.dimensionValues?.[1]?.value || "Untitled",
            views: parseInt(r.metricValues?.[0]?.value || "0", 10),
            users: parseInt(r.metricValues?.[1]?.value || "0", 10),
            bounceRate: parseFloat(
              (parseFloat(r.metricValues?.[2]?.value || "0") * 100).toFixed(1)
            ),
          }))
        : [];

    // Parse Sources
    const sources =
      sourcesRes.status === "fulfilled"
        ? (sourcesRes.value[0]?.rows || []).map((r) => ({
            source: r.dimensionValues?.[0]?.value || "(direct)",
            sessions: parseInt(r.metricValues?.[0]?.value || "0", 10),
            users: parseInt(r.metricValues?.[1]?.value || "0", 10),
          }))
        : [];

    // Parse Devices
    const devices =
      devicesRes.status === "fulfilled"
        ? (devicesRes.value[0]?.rows || []).map((r) => ({
            category: r.dimensionValues?.[0]?.value || "desktop",
            users: parseInt(r.metricValues?.[0]?.value || "0", 10),
            sessions: parseInt(r.metricValues?.[1]?.value || "0", 10),
          }))
        : [];

    // Parse Trend
    const dailyTrend =
      trendRes.status === "fulfilled"
        ? (trendRes.value[0]?.rows || []).map((r) => {
            const rawDate = r.dimensionValues?.[0]?.value || "";
            // Format YYYYMMDD to readable "MMM DD"
            const formattedDate =
              rawDate.length === 8
                ? `${rawDate.slice(4, 6)}/${rawDate.slice(6, 8)}`
                : rawDate;
            return {
              date: formattedDate,
              rawDate,
              users: parseInt(r.metricValues?.[0]?.value || "0", 10),
              views: parseInt(r.metricValues?.[1]?.value || "0", 10),
            };
          })
        : [];

    // Parse Hostnames (Websites)
    const hostnames =
      hostsRes.status === "fulfilled"
        ? (hostsRes.value[0]?.rows || []).map((r) => ({
            host: r.dimensionValues?.[0]?.value || "unknown",
            users: parseInt(r.metricValues?.[0]?.value || "0", 10),
            views: parseInt(r.metricValues?.[1]?.value || "0", 10),
          }))
        : [];

    res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      range,
      data: {
        propertyId,
        liveActiveUsers,
        overview,
        landingPages,
        topPages,
        sources,
        devices,
        dailyTrend,
        hostnames,
      },
    });
  } catch (error: any) {
    console.error("Google Analytics query error:", error?.message || error);
    res.status(500).json({
      status: "error",
      message: error?.message || "Failed to query Google Analytics data.",
    });
  }
};


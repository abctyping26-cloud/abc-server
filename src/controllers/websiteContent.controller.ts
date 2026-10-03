import type { Request, Response } from "express";
import { TopMarqueeConfig } from "../models/websiteContent.model.js";
import {
  ensureWebsiteContentSeeded,
  DEFAULT_MARQUEE_CONFIG,
} from "../services/websiteContentSeed.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * GET /api/v1/admin/website-content/top-marquee or GET /api/v1/client/website-content/top-marquee
 * Retrieves current top marquee configuration from MongoDB.
 */
export const getTopMarqueeConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await ensureWebsiteContentSeeded();

    let config = await TopMarqueeConfig.findOne({ key: "top_marquee" }).populate(
      "updatedBy",
      "name identifier role"
    );

    if (!config) {
      config = await TopMarqueeConfig.create(DEFAULT_MARQUEE_CONFIG);
    }

    res.status(200).json({
      success: true,
      data: {
        config,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch top marquee configuration";
    console.error("❌ getTopMarqueeConfig error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * PUT /api/v1/admin/website-content/top-marquee
 * Updates top marquee configuration in MongoDB.
 */
export const updateTopMarqueeConfig = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { isActive, speedSeconds, items } = req.body;

    // Basic validation
    if (typeof isActive !== "undefined" && typeof isActive !== "boolean") {
      res.status(400).json({
        success: false,
        message: "Field 'isActive' must be a boolean",
      });
      return;
    }

    if (
      typeof speedSeconds !== "undefined" &&
      (typeof speedSeconds !== "number" || speedSeconds < 10 || speedSeconds > 120)
    ) {
      res.status(400).json({
        success: false,
        message: "Field 'speedSeconds' must be a number between 10 and 120",
      });
      return;
    }

    if (items) {
      if (!Array.isArray(items)) {
        res.status(400).json({
          success: false,
          message: "Field 'items' must be an array",
        });
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.message || typeof item.message !== "string" || !item.message.trim()) {
          res.status(400).json({
            success: false,
            message: `Item at index ${i} requires a non-empty 'message'`,
          });
          return;
        }
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (typeof isActive === "boolean") updatePayload.isActive = isActive;
    if (typeof speedSeconds === "number") updatePayload.speedSeconds = speedSeconds;
    if (Array.isArray(items)) {
      updatePayload.items = items.map((it: { badgeText?: string; message: string; ctaText?: string; linkUrl?: string }) => ({
        badgeText: (it.badgeText || "NEW").trim(),
        message: it.message.trim(),
        ctaText: (it.ctaText || "Explore").trim(),
        linkUrl: (it.linkUrl || "/services/uae-pass-assistance").trim(),
      }));
    }

    if (req.admin?.id && req.admin.id !== "master_admin") {
      updatePayload.updatedBy = req.admin.id;
    }

    const config = await TopMarqueeConfig.findOneAndUpdate(
      { key: "top_marquee" },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true }
    ).populate("updatedBy", "name identifier role");

    res.status(200).json({
      success: true,
      message: "Top announcement bar updated successfully",
      data: {
        config,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update top marquee configuration";
    console.error("❌ updateTopMarqueeConfig error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/v1/admin/website-content/top-marquee/reset
 * Resets top marquee configuration to default state.
 */
export const resetTopMarqueeConfig = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const config = await TopMarqueeConfig.findOneAndUpdate(
      { key: "top_marquee" },
      {
        $set: {
          isActive: DEFAULT_MARQUEE_CONFIG.isActive,
          speedSeconds: DEFAULT_MARQUEE_CONFIG.speedSeconds,
          items: DEFAULT_MARQUEE_CONFIG.items,
          updatedBy:
            req.admin?.id && req.admin.id !== "master_admin"
              ? req.admin.id
              : undefined,
        },
      },
      { new: true, upsert: true }
    ).populate("updatedBy", "name identifier role");

    res.status(200).json({
      success: true,
      message: "Top announcement bar reset to default",
      data: {
        config,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reset top marquee configuration";
    console.error("❌ resetTopMarqueeConfig error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

import type { Request, Response } from "express";
import { HeroTimelineItem, type IHeroTimelineItem } from "../models/heroContent.model.js";
import {
  ensureHeroContentSeeded,
  DEFAULT_HERO_CONFIG,
} from "../services/heroContentSeed.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { uploadStreamToCloudinary } from "../config/cloudinary.js";

/**
 * Checks if the currently active hero has expired based on endDate.
 * If expired, auto-reverts to default hero entry.
 */
const resolveActiveHeroWithAutoRevert = async (): Promise<IHeroTimelineItem | null> => {
  await ensureHeroContentSeeded();

  const now = new Date();
  const currentActive = await HeroTimelineItem.findOne({ isActive: true });

  if (currentActive) {
    // If active item has an endDate that has already passed, auto-revert
    if (currentActive.endDate && currentActive.endDate.getTime() <= now.getTime()) {
      currentActive.isActive = false;
      await currentActive.save();

      // Reactivate default
      const defaultItem = await HeroTimelineItem.findOne({ isDefault: true });
      if (defaultItem) {
        defaultItem.isActive = true;
        await defaultItem.save();
        return defaultItem;
      }
    }
    return currentActive;
  }

  // Fallback to default
  const defaultItem = await HeroTimelineItem.findOne({ isDefault: true });
  if (defaultItem) {
    defaultItem.isActive = true;
    await defaultItem.save();
    return defaultItem;
  }

  return null;
};

/**
 * GET /api/v1/client/website-content/hero or GET /api/v1/admin/website-content/hero
 * Retrieves the currently active hero configuration.
 */
export const getActiveHero = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const hero = await resolveActiveHeroWithAutoRevert();

    res.status(200).json({
      success: true,
      data: {
        hero: hero || DEFAULT_HERO_CONFIG,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch active hero configuration";
    console.error("❌ getActiveHero error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/v1/admin/website-content/hero/timeline
 * Retrieves all hero timeline entries and current active status.
 */
export const getHeroTimeline = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const activeHero = await resolveActiveHeroWithAutoRevert();

    const items = await HeroTimelineItem.find()
      .populate("updatedBy", "name identifier role")
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        items,
        activeId: activeHero?._id || null,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch hero timeline";
    console.error("❌ getHeroTimeline error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/v1/admin/website-content/hero
 * Creates a new hero timeline version or updates an existing one.
 */
export const createOrUpdateHeroTimeline = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, title, hook, bgImageUrl, isActive, startDate, endDate } = req.body;

    if (!hook || typeof hook !== "string" || !hook.trim()) {
      res.status(400).json({
        success: false,
        message: "Hero hook title is required.",
      });
      return;
    }

    if (!bgImageUrl || typeof bgImageUrl !== "string" || !bgImageUrl.trim()) {
      res.status(400).json({
        success: false,
        message: "Background image URL is required.",
      });
      return;
    }

    const payload: Record<string, unknown> = {
      title: (title || "Custom Hero").trim(),
      hook: hook.trim(),
      bgImageUrl: bgImageUrl.trim(),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    if (req.admin?.id && req.admin.id !== "master_admin") {
      payload.updatedBy = req.admin.id;
    }

    let item: IHeroTimelineItem | null = null;

    if (id) {
      // Update existing
      item = await HeroTimelineItem.findById(id);
      if (!item) {
        res.status(404).json({
          success: false,
          message: "Timeline entry not found.",
        });
        return;
      }

      Object.assign(item, payload);

      if (typeof isActive === "boolean") {
        item.isActive = isActive;
      }

      await item.save();

      // If set to active, deactivate all other entries
      if (item.isActive) {
        await HeroTimelineItem.updateMany(
          { _id: { $ne: item._id } },
          { $set: { isActive: false } }
        );
      }
    } else {
      // Create new
      const shouldActivate = Boolean(isActive);
      item = await HeroTimelineItem.create({
        ...payload,
        isActive: shouldActivate,
        isDefault: false,
      });

      if (shouldActivate) {
        await HeroTimelineItem.updateMany(
          { _id: { $ne: item._id } },
          { $set: { isActive: false } }
        );
      }
    }

    await item.populate("updatedBy", "name identifier role");

    res.status(200).json({
      success: true,
      message: id ? "Hero timeline entry updated." : "Hero timeline entry created.",
      data: {
        item,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save hero timeline entry";
    console.error("❌ createOrUpdateHeroTimeline error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/v1/admin/website-content/hero/activate/:id
 * Activates a specific hero timeline entry, deactivating all others.
 */
export const activateHeroTimelineEntry = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await HeroTimelineItem.findById(id);
    if (!item) {
      res.status(404).json({
        success: false,
        message: "Timeline entry not found.",
      });
      return;
    }

    // Atomically deactivate others and activate target
    await HeroTimelineItem.updateMany(
      { _id: { $ne: item._id } },
      { $set: { isActive: false } }
    );

    item.isActive = true;
    if (req.admin?.id && req.admin.id !== "master_admin") {
      item.updatedBy = req.admin.id as any;
    }
    await item.save();
    await item.populate("updatedBy", "name identifier role");

    res.status(200).json({
      success: true,
      message: `"${item.title}" is now active on the website.`,
      data: {
        item,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to activate hero timeline entry";
    console.error("❌ activateHeroTimelineEntry error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * DELETE /api/v1/admin/website-content/hero/:id
 * Deletes a custom timeline entry (default hero is protected).
 */
export const deleteHeroTimelineEntry = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await HeroTimelineItem.findById(id);
    if (!item) {
      res.status(404).json({
        success: false,
        message: "Timeline entry not found.",
      });
      return;
    }

    if (item.isDefault) {
      res.status(400).json({
        success: false,
        message: "Cannot delete the default hero configuration.",
      });
      return;
    }

    const wasActive = item.isActive;
    await HeroTimelineItem.findByIdAndDelete(id);

    // If deleted item was active, reactivate default
    if (wasActive) {
      const defaultItem = await HeroTimelineItem.findOne({ isDefault: true });
      if (defaultItem) {
        defaultItem.isActive = true;
        await defaultItem.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Hero timeline entry deleted successfully.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete hero timeline entry";
    console.error("❌ deleteHeroTimelineEntry error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/v1/admin/website-content/hero/reset
 * Resets the active hero to the default configuration.
 */
export const resetHeroToDefault = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    await ensureHeroContentSeeded();

    await HeroTimelineItem.updateMany(
      { isDefault: false },
      { $set: { isActive: false } }
    );

    const defaultItem = await HeroTimelineItem.findOneAndUpdate(
      { isDefault: true },
      {
        $set: {
          isActive: true,
          hook: DEFAULT_HERO_CONFIG.hook,
          bgImageUrl: DEFAULT_HERO_CONFIG.bgImageUrl,
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
      message: "Reset hero to default template.",
      data: {
        item: defaultItem,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reset hero configuration";
    console.error("❌ resetHeroToDefault error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/v1/admin/website-content/hero/upload
 * Accepts an image file and streams to Cloudinary, returning the secure URL.
 */
export const uploadHeroImage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
      return;
    }

    const result = await uploadStreamToCloudinary(req.file.buffer, {
      folder: "abc_typing/hero",
      resource_type: "image",
    });

    res.status(200).json({
      success: true,
      message: "Hero background image uploaded successfully.",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to upload hero image";
    console.error("❌ uploadHeroImage error:", error);
    res.status(500).json({
      success: false,
      message,
    });
  }
};

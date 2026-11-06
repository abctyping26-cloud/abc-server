import type { Request, Response } from "express";
import { ClinicHsnCode, DEFAULT_HSN_CODES } from "../models/clinicHsnCode.model.js";
import {
  ClinicInventoryItem,
  DEFAULT_CLINIC_ITEMS,
} from "../models/clinicInventoryItem.model.js";

/**
 * GET /api/v1/clinic/inventory/hsn-codes
 * Returns list of HSN codes. Auto-seeds defaults if empty.
 */
export const getHsnCodes = async (_req: Request, res: Response): Promise<void> => {
  try {
    let codes = await ClinicHsnCode.find().sort({ category: 1, hsnCode: 1 });
    if (codes.length === 0) {
      await ClinicHsnCode.insertMany(DEFAULT_HSN_CODES);
      codes = await ClinicHsnCode.find().sort({ category: 1, hsnCode: 1 });
    }
    res.status(200).json({ status: "success", count: codes.length, data: codes });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "Failed to load HSN codes" });
  }
};

/**
 * POST /api/v1/clinic/inventory/hsn-codes
 * Upsert an HSN code definition.
 */
export const upsertHsnCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hsnCode, category, description, gstRate } = req.body;
    if (!hsnCode || !category || gstRate === undefined) {
      res.status(400).json({ status: "error", message: "hsnCode, category, and gstRate are required" });
      return;
    }

    const updated = await ClinicHsnCode.findOneAndUpdate(
      { hsnCode: hsnCode.trim() },
      {
        hsnCode: hsnCode.trim(),
        category: category.trim(),
        description: description?.trim() || "",
        gstRate: Number(gstRate) || 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ status: "success", data: updated });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "Failed to save HSN code" });
  }
};

/**
 * GET /api/v1/clinic/inventory/cached
 * Returns active Tier 1 clinic inventory items. Auto-seeds defaults if empty.
 */
export const getCachedInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    let totalCount = await ClinicInventoryItem.countDocuments();
    if (totalCount === 0) {
      await ClinicInventoryItem.insertMany(DEFAULT_CLINIC_ITEMS);
    }

    const filter: Record<string, any> = {};
    if (category && category !== "all") {
      filter.category = category;
    }

    if (query) {
      filter.$or = [
        { searchName: { $regex: query, $options: "i" } },
        { genericName: { $regex: query, $options: "i" } },
        { hsnCode: { $regex: query, $options: "i" } },
        { manufacturer: { $regex: query, $options: "i" } },
      ];
    }

    const items = await ClinicInventoryItem.find(filter)
      .sort({ usageCount: -1, lastUsedAt: -1, itemName: 1 })
      .limit(100);

    res.status(200).json({ status: "success", count: items.length, data: items });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to load clinic inventory cache",
    });
  }
};

/**
 * POST /api/v1/clinic/inventory/promote
 * Save or promote an item into the Tier 1 clinic cache (with 3-tier pricing).
 */
export const saveOrPromoteClinicItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      itemName,
      genericName,
      category,
      hsnCode,
      gstRate,
      costPrice,
      mrp,
      defaultBilledPrice,
      packSize,
      manufacturer,
      source,
    } = req.body;

    if (!itemName || !hsnCode) {
      res.status(400).json({ status: "error", message: "itemName and hsnCode are required" });
      return;
    }

    const cleanItemName = itemName.trim();
    const searchName = cleanItemName.toLowerCase();

    // Upsert into ClinicInventoryItem
    const item = await ClinicInventoryItem.findOneAndUpdate(
      { searchName },
      {
        itemName: cleanItemName,
        searchName,
        genericName: genericName?.trim() || "",
        category: category?.trim() || "Medicaments",
        hsnCode: hsnCode.trim(),
        gstRate: Number(gstRate) || 0,
        costPrice: Number(costPrice) || 0,
        mrp: Number(mrp) || 0,
        defaultBilledPrice: Number(defaultBilledPrice) || 0,
        packSize: packSize?.trim() || "",
        manufacturer: manufacturer?.trim() || "",
        source: source || "promoted_from_master",
        lastUsedAt: new Date(),
        $inc: { usageCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ status: "success", data: item });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to promote item into clinic cache",
    });
  }
};

/**
 * PATCH /api/v1/clinic/inventory/items/:id/usage
 * Increment usage counter for a cached item.
 */
export const recordItemUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await ClinicInventoryItem.findByIdAndUpdate(
      id,
      { $inc: { usageCount: 1 }, lastUsedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ status: "error", message: "Item not found" });
      return;
    }
    res.status(200).json({ status: "success", data: updated });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "Failed to record usage" });
  }
};

/**
 * DELETE /api/v1/clinic/inventory/items/:id
 * Remove an item from the clinic cache.
 */
export const deleteClinicItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await ClinicInventoryItem.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ status: "error", message: "Item not found" });
      return;
    }
    res.status(200).json({ status: "success", message: "Item removed from cache" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message || "Failed to delete item" });
  }
};

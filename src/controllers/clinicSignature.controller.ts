import type { Request, Response } from "express";
import {
  ClinicSignature,
  DEFAULT_CLINIC_SIGNATURES,
} from "../models/clinicSignature.model.js";

/**
 * GET /api/v1/clinic/signatures
 * Returns all saved doctor signatures. Auto-seeds defaults if collection is empty.
 */
export const getSignatures = async (_req: Request, res: Response): Promise<void> => {
  try {
    let signatures = await ClinicSignature.find().sort({ isDefault: -1, createdAt: -1 });

    if (signatures.length === 0) {
      await ClinicSignature.insertMany(DEFAULT_CLINIC_SIGNATURES);
      signatures = await ClinicSignature.find().sort({ isDefault: -1, createdAt: -1 });
    }

    res.status(200).json({
      status: "success",
      count: signatures.length,
      data: signatures,
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch doctor signatures",
    });
  }
};

/**
 * POST /api/v1/clinic/signatures
 * Creates and persists a new doctor signature.
 */
export const createSignature = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, title, signatureData, source, isDefault } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ status: "error", message: "Signatory name is required" });
      return;
    }

    if (!signatureData || typeof signatureData !== "string" || !signatureData.startsWith("data:")) {
      res.status(400).json({ status: "error", message: "Valid signature image data is required" });
      return;
    }

    const totalCount = await ClinicSignature.countDocuments();
    const shouldBeDefault = Boolean(isDefault) || totalCount === 0;

    if (shouldBeDefault) {
      await ClinicSignature.updateMany({}, { $set: { isDefault: false } });
    }

    const newSig = await ClinicSignature.create({
      name: name.trim(),
      title: typeof title === "string" ? title.trim() : "",
      signatureData,
      source: source === "uploaded" ? "uploaded" : "drawn",
      isDefault: shouldBeDefault,
    });

    res.status(201).json({ status: "success", data: newSig });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to create doctor signature",
    });
  }
};

/**
 * PATCH /api/v1/clinic/signatures/:id/default
 * Sets a signature as the default clinic signature.
 */
export const setDefaultSignature = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const target = await ClinicSignature.findById(id);
    if (!target) {
      res.status(404).json({ status: "error", message: "Signature not found" });
      return;
    }

    await ClinicSignature.updateMany({}, { $set: { isDefault: false } });
    target.isDefault = true;
    await target.save();

    res.status(200).json({ status: "success", data: target });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to set default signature",
    });
  }
};

/**
 * DELETE /api/v1/clinic/signatures/:id
 * Removes a signature from MongoDB.
 */
export const deleteSignature = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await ClinicSignature.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ status: "error", message: "Signature not found" });
      return;
    }

    // If deleted was default, promote another signature to default if available
    if (deleted.isDefault) {
      const remaining = await ClinicSignature.findOne().sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.status(200).json({ status: "success", message: "Signature deleted" });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to delete signature",
    });
  }
};

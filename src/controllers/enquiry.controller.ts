import type { Request, Response, NextFunction } from "express";
import { Enquiry } from "../models/enquiry.model.js";

/**
 * Create a new Enquiry (Client Facing)
 * POST /api/v1/client/enquiry
 */
export const createEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, service, otherService, submittedAt, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Full name is required",
      });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Phone number is required",
      });
      return;
    }

    if (!service || !service.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Service requested is required",
      });
      return;
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      service: service.trim(),
      otherService: otherService?.trim() || undefined,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      status: "pending",
      notes: notes?.trim() || undefined,
    });

    res.status(201).json({
      status: "success",
      message: "Enquiry submitted successfully",
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Enquiries (Admin Facing)
 * GET /api/v1/admin/enquiries
 */
export const getEnquiries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, q } = req.query;

    const filter: Record<string, unknown> = {};

    if (status && status !== "all" && (status === "pending" || status === "responded")) {
      filter.status = status;
    }

    if (q && typeof q === "string" && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { name: regex },
        { phone: regex },
        { service: regex },
        { otherService: regex },
        { respondedBy: regex },
      ];
    }

    const [enquiries, total, pending, responded] = await Promise.all([
      Enquiry.find(filter).sort({ submittedAt: -1, createdAt: -1 }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "pending" }),
      Enquiry.countDocuments({ status: "responded" }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        enquiries,
        counts: {
          total,
          pending,
          responded,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Enquiry Responded or Toggle Status (Admin Facing)
 * PATCH /api/v1/admin/enquiries/:id/respond
 */
export const markEnquiryResponded = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { respondedBy, respondedByRole, status, notes } = req.body;

    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      res.status(404).json({
        status: "fail",
        message: "Enquiry not found",
      });
      return;
    }

    // If explicit status passed or toggle
    const targetStatus =
      status || (enquiry.status === "responded" ? "pending" : "responded");

    if (targetStatus === "responded") {
      enquiry.status = "responded";
      enquiry.respondedBy = respondedBy?.trim() || enquiry.respondedBy || "Team Member";
      enquiry.respondedByRole =
        respondedByRole || enquiry.respondedByRole || "worker_admin";
      enquiry.respondedAt = new Date();
      if (notes !== undefined) {
        enquiry.notes = notes?.trim() || undefined;
      }
    } else {
      enquiry.status = "pending";
      enquiry.respondedBy = undefined;
      enquiry.respondedByRole = undefined;
      enquiry.respondedAt = undefined;
    }

    await enquiry.save();

    res.status(200).json({
      status: "success",
      message: `Enquiry marked as ${enquiry.status}`,
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Enquiry (Admin Facing)
 * DELETE /api/v1/admin/enquiries/:id
 */
export const deleteEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findByIdAndDelete(id);

    if (!enquiry) {
      res.status(404).json({
        status: "fail",
        message: "Enquiry not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

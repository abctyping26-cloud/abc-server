import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import type {
  AuthenticatedAdmin,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";
import { Enquiry } from "../models/enquiry.model.js";
import {
  sendEnquiryNotification,
  sendReplyToCustomer,
} from "../services/email.service.js";

/**
 * Helper to extract authenticated admin identity from request
 * Checks: req.admin (middleware), Authorization Bearer JWT, x-admin-* headers, query params
 */
const extractAdminFromRequest = (req: Request): AuthenticatedAdmin | null => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.admin) {
    return authReq.admin;
  }

  // 1. Authorization Bearer Token
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }
    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedAdmin;
      if (decoded && (decoded.id || decoded.identifier)) {
        return decoded;
      }
    }
  } catch {
    // Ignore JWT decode failure
  }

  // 2. Fallback x-admin headers
  const fallbackId = (req.headers["x-admin-id"] as string)?.trim();
  const rawFallbackRole = (req.headers["x-admin-role"] as string)?.trim?.();
  const fallbackIdentifier = (req.headers["x-admin-identifier"] as string)?.trim();

  if (fallbackId || rawFallbackRole || fallbackIdentifier) {
    return {
      id: fallbackId || "",
      identifier: fallbackIdentifier || "",
      role: (rawFallbackRole as AuthenticatedAdmin["role"]) || "worker_admin",
      type: "admin",
    };
  }

  // 3. Fallback query parameters
  const qId = (req.query.adminId as string)?.trim();
  const rawQRole = (req.query.adminRole as string)?.trim?.();
  const qIdentifier = (req.query.adminIdentifier as string)?.trim();

  if (qId || rawQRole || qIdentifier) {
    return {
      id: qId || "",
      identifier: qIdentifier || "",
      role: (rawQRole as AuthenticatedAdmin["role"]) || "worker_admin",
      type: "admin",
    };
  }

  return null;
};

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
    const { name, email, phone, service, otherService, submittedAt, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Full name is required",
      });
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Email address is required",
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
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      service: service.trim(),
      otherService: otherService?.trim() || undefined,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      status: "pending",
      notes: notes?.trim() || undefined,
    });

    // Dispatch real-time email alert to worker admin email via Resend
    try {
      await sendEnquiryNotification({
        customerName: enquiry.name,
        customerEmail: enquiry.email,
        customerPhone: enquiry.phone,
        service: enquiry.service,
        message:
          enquiry.otherService ||
          enquiry.notes ||
          "New enquiry submitted from the commercial website.",
        workerEmail: "abctyping26@gmail.com",
      });
    } catch (emailErr) {
      console.warn("Failed to dispatch enquiry email alert via Resend:", emailErr);
    }

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
    const { status, q, claimStatus } = req.query;
    const admin = extractAdminFromRequest(req);

    const isMaster =
      !admin ||
      admin.role === "master_admin" ||
      admin.role === "superadmin" ||
      admin.identifier === "masteradmin@abc.com";

    const andConditions: any[] = [];

    // 1. Role-based scoping for worker admins:
    // Worker admins only see: Unclaimed & unresponded enquiries OR enquiries claimed by this worker admin
    const unclaimedCondition = {
      status: { $ne: "responded" },
      $or: [
        { claimedBy: null },
        { claimedBy: { $exists: false } },
        { claimedBy: "" },
      ],
    };

    if (!isMaster && admin) {
      const myClaimOrs: any[] = [];
      if (admin.id) {
        myClaimOrs.push({ claimedBy: String(admin.id) });
      }
      if (admin.identifier) {
        myClaimOrs.push({ claimedBy: String(admin.identifier) });
      }
      andConditions.push({
        $or: [unclaimedCondition, ...myClaimOrs],
      });
    }

    // 2. Status filter (pending / responded)
    if (
      status &&
      status !== "all" &&
      (status === "pending" || status === "responded")
    ) {
      andConditions.push({ status });
    }

    // 3. Optional claimStatus filter (unclaimed / my_claims / all)
    if (claimStatus === "unclaimed") {
      andConditions.push(unclaimedCondition);
    } else if (claimStatus === "my_claims" && admin) {
      const myClaimOrs: any[] = [];
      if (admin.id) myClaimOrs.push({ claimedBy: String(admin.id) });
      if (admin.identifier) myClaimOrs.push({ claimedBy: String(admin.identifier) });
      if (myClaimOrs.length > 0) {
        andConditions.push({ $or: myClaimOrs });
      }
    }

    // 4. Search query filter
    if (q && typeof q === "string" && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      andConditions.push({
        $or: [
          { name: regex },
          { phone: regex },
          { email: regex },
          { service: regex },
          { otherService: regex },
          { respondedBy: regex },
          { claimedByName: regex },
        ],
      });
    }

    const filter: Record<string, unknown> =
      andConditions.length > 0 ? { $and: andConditions } : {};

    // Base scope filter for counters (respecting worker scope, but not status/search filter)
    const baseScopeConditions: any[] = [];
    if (!isMaster && admin) {
      const myClaimOrs: any[] = [];
      if (admin.id) myClaimOrs.push({ claimedBy: String(admin.id) });
      if (admin.identifier)
        myClaimOrs.push({ claimedBy: String(admin.identifier) });
      baseScopeConditions.push({
        $or: [unclaimedCondition, ...myClaimOrs],
      });
    }
    const baseScopeFilter: Record<string, unknown> =
      baseScopeConditions.length > 0 ? { $and: baseScopeConditions } : {};

    const [enquiries, total, pending, responded, unclaimedCount, myClaimsCount] =
      await Promise.all([
        Enquiry.find(filter).sort({ submittedAt: -1, createdAt: -1 }),
        Enquiry.countDocuments(baseScopeFilter),
        Enquiry.countDocuments({ ...baseScopeFilter, status: "pending" }),
        Enquiry.countDocuments({ ...baseScopeFilter, status: "responded" }),
        Enquiry.countDocuments({
          ...baseScopeFilter,
          ...unclaimedCondition,
        }),
        admin && (admin.id || admin.identifier)
          ? Enquiry.countDocuments({
              $or: [
                ...(admin.id ? [{ claimedBy: String(admin.id) }] : []),
                ...(admin.identifier ? [{ claimedBy: String(admin.identifier) }] : []),
              ],
            })
          : Promise.resolve(0),
      ]);

    res.status(200).json({
      status: "success",
      data: {
        enquiries,
        counts: {
          total,
          pending,
          responded,
          unclaimed: unclaimedCount,
          myClaims: myClaimsCount,
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
      // Once responded by anyone, it is no longer open or unclaimed
      if (!enquiry.claimedBy) {
        const admin = extractAdminFromRequest(req);
        enquiry.claimedBy =
          admin?.id ||
          (admin?.role === "master_admin" ? "master_admin" : enquiry.respondedBy);
        enquiry.claimedByName =
          admin?.identifier || enquiry.respondedBy || "Team Member";
        enquiry.claimedByRole =
          admin?.role || enquiry.respondedByRole || "worker_admin";
        enquiry.claimedAt = new Date();
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

/**
 * Reply to Enquiry by Email (Admin/Worker Facing)
 * POST /api/v1/admin/enquiries/:id/reply
 */
export const replyToEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject, message, senderName, responderRole } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Reply message body is required",
      });
      return;
    }

    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      res.status(404).json({
        status: "fail",
        message: "Enquiry not found",
      });
      return;
    }

    if (!enquiry.email) {
      res.status(400).json({
        status: "fail",
        message: "This enquiry does not have a customer email address on file.",
      });
      return;
    }

    // 1. Send reply email via Resend
    await sendReplyToCustomer({
      customerEmail: enquiry.email,
      customerName: enquiry.name,
      senderName: senderName?.trim() || "ABC Typing Support",
      subject:
        subject?.trim() ||
        `Re: Your Enquiry for ${enquiry.service} - ABC Typing`,
      message: message.trim(),
    });

    // 2. Mark enquiry as responded in MongoDB
    enquiry.status = "responded";
    enquiry.respondedBy = senderName?.trim() || "Admin";
    enquiry.respondedByRole = responderRole || "worker_admin";
    enquiry.respondedAt = new Date();
    // Once responded by anyone, it is no longer open or unclaimed
    if (!enquiry.claimedBy) {
      const admin = extractAdminFromRequest(req);
      enquiry.claimedBy =
        admin?.id ||
        (admin?.role === "master_admin" ? "master_admin" : enquiry.respondedBy);
      enquiry.claimedByName =
        senderName?.trim() || admin?.identifier || "Admin";
      enquiry.claimedByRole =
        responderRole || admin?.role || "worker_admin";
      enquiry.claimedAt = new Date();
    }
    if (enquiry.notes) {
      enquiry.notes += `\n[Reply Sent by ${enquiry.respondedBy}]: ${message.trim()}`;
    } else {
      enquiry.notes = `[Reply Sent by ${enquiry.respondedBy}]: ${message.trim()}`;
    }

    await enquiry.save();

    res.status(200).json({
      status: "success",
      message: `Reply successfully delivered to ${enquiry.email} and marked as responded.`,
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Opt In / Claim an Enquiry (Admin / Worker Facing)
 * PATCH /api/v1/admin/enquiries/:id/claim
 */
export const claimEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = extractAdminFromRequest(req);

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({
        status: "fail",
        message: "Enquiry not found",
      });
      return;
    }

    // Once responded by anyone, it is no longer open or unclaimed
    if (enquiry.status === "responded") {
      res.status(400).json({
        status: "fail",
        message: "This enquiry has already been responded to and is closed.",
        data: { enquiry },
      });
      return;
    }

    const isMaster =
      admin?.role === "master_admin" ||
      admin?.role === "superadmin" ||
      admin?.identifier === "masteradmin@abc.com";

    const claimantId =
      req.body.adminId || admin?.id || (isMaster ? "master_admin" : "worker_admin");
    const claimantName =
      req.body.adminName || admin?.identifier || (isMaster ? "Master Admin" : "Worker Admin");
    const claimantRole =
      req.body.adminRole || admin?.role || (isMaster ? "master_admin" : "worker_admin");
    const claimantEmail =
      req.body.adminEmail || admin?.identifier || undefined;

    // Check if already claimed by someone else (Worker admins cannot steal claims; Master admin can)
    if (
      enquiry.claimedBy &&
      enquiry.claimedBy !== claimantId &&
      enquiry.claimedBy !== admin?.identifier &&
      !isMaster
    ) {
      res.status(409).json({
        status: "fail",
        message: `This enquiry has already been opted in by ${
          enquiry.claimedByName || "another team member"
        }.`,
        data: { enquiry },
      });
      return;
    }

    enquiry.claimedBy = claimantId;
    enquiry.claimedByName = claimantName;
    enquiry.claimedByRole = claimantRole as any;
    enquiry.claimedByEmail = claimantEmail;
    enquiry.claimedAt = new Date();

    await enquiry.save();

    res.status(200).json({
      status: "success",
      message: `Enquiry successfully claimed by ${claimantName}`,
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Opt Out / Release / Unclaim an Enquiry (Admin / Worker Facing)
 * PATCH /api/v1/admin/enquiries/:id/unclaim
 */
export const unclaimEnquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = extractAdminFromRequest(req);

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({
        status: "fail",
        message: "Enquiry not found",
      });
      return;
    }

    // Once responded by anyone, it is no longer open or unclaimed
    if (enquiry.status === "responded") {
      res.status(400).json({
        status: "fail",
        message: "This enquiry has already been responded to and cannot be released as open.",
        data: { enquiry },
      });
      return;
    }

    const isMaster =
      admin?.role === "master_admin" ||
      admin?.role === "superadmin" ||
      admin?.identifier === "masteradmin@abc.com";

    const requesterId = req.body.adminId || admin?.id;
    const requesterIdentifier = admin?.identifier;

    // Permissions: Master Admin can release any enquiry; Worker Admin can only release their own claim
    if (
      !isMaster &&
      enquiry.claimedBy &&
      enquiry.claimedBy !== requesterId &&
      enquiry.claimedBy !== requesterIdentifier
    ) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to release an enquiry claimed by another admin.",
      });
      return;
    }

    enquiry.claimedBy = null;
    enquiry.claimedByName = undefined;
    enquiry.claimedByRole = undefined;
    enquiry.claimedByEmail = undefined;
    enquiry.claimedAt = undefined;

    await enquiry.save();

    res.status(200).json({
      status: "success",
      message: "Enquiry released successfully and is now open for all worker admins.",
      data: {
        enquiry,
      },
    });
  } catch (error) {
    next(error);
  }
};


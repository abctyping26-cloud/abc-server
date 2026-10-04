import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { AdminUser } from "../models/adminUser.model.js";

export const getAdminStatus = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    service: "admin-api",
    message: "Admin API endpoint ready for abc-admin subproject",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get all Worker Admins directly from MongoDB ('user-admin' collection)
 */
export const getWorkerAdmins = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workers = await AdminUser.find({ role: "worker_admin" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: {
        workers: workers.map((w) => ({
          id: w._id.toString(),
          identifier: w.identifier,
          name: w.name || "",
          phone: w.phone || "",
          location: w.location || "",
          deviceInfo: w.deviceInfo || "",
          role: w.role,
          assignedRoles: w.assignedRoles || ["accounting", "enquiries", "whatsapp_enquiries", "clients"],
          canDeleteData: Boolean(w.canDeleteData),
          profileCompleted: Boolean(w.profileCompleted && w.name),
          isFirstLogin: w.isFirstLogin ?? true,
          createdAt: w.createdAt,
          lastLoginAt: w.lastLoginAt,
          status: "active",
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Worker Admin directly in MongoDB ('user-admin' collection)
 */
export const createWorkerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, assignedRoles, canDeleteData } = req.body;
    let { identifier, password } = req.body;

    if (!identifier && name && typeof name === "string" && name.trim()) {
      const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      identifier = `${cleanName || "employee"}${Math.floor(100 + Math.random() * 900)}@abc.com`;
    }

    if (!password) {
      password = "TempPassword@123";
    }

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Admin email or employee name is required",
      });
      return;
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Prevent duplicates
    const existing = await AdminUser.findOne({
      identifier: normalizedIdentifier,
    });

    if (existing) {
      res.status(409).json({
        status: "fail",
        message: "An admin account with this email already exists",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newWorker = await AdminUser.create({
      identifier: normalizedIdentifier,
      password: hashedPassword,
      role: "worker_admin",
      name: name ? String(name).trim() : "",
      phone: phone ? String(phone).trim() : "",
      profileCompleted: Boolean(name && String(name).trim()),
      isFirstLogin: true,
      assignedRoles: Array.isArray(assignedRoles) && assignedRoles.length > 0
        ? assignedRoles
        : ["accounting", "enquiries", "whatsapp_enquiries", "clients"],
      canDeleteData: Boolean(canDeleteData),
    });

    res.status(201).json({
      status: "success",
      message: "Worker admin created successfully",
      data: {
        worker: {
          id: newWorker._id.toString(),
          identifier: newWorker.identifier,
          name: newWorker.name || "",
          phone: newWorker.phone || "",
          location: newWorker.location || "",
          role: newWorker.role,
          assignedRoles: newWorker.assignedRoles,
          canDeleteData: newWorker.canDeleteData,
          profileCompleted: newWorker.profileCompleted,
          isFirstLogin: true,
          createdAt: newWorker.createdAt,
          lastLoginAt: newWorker.lastLoginAt,
          status: "active",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Worker Admin Permissions and Roles directly in MongoDB
 */
export const updateWorkerAdminPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedRoles, canDeleteData, name, phone, location } = req.body;

    const worker = await AdminUser.findById(id);

    if (!worker) {
      res.status(404).json({
        status: "fail",
        message: "Worker admin not found",
      });
      return;
    }

    if (Array.isArray(assignedRoles)) {
      worker.assignedRoles = assignedRoles;
    }

    if (canDeleteData !== undefined) {
      worker.canDeleteData = Boolean(canDeleteData);
    }

    if (name !== undefined) {
      worker.name = String(name).trim();
    }

    if (phone !== undefined) {
      worker.phone = String(phone).trim();
    }

    if (location !== undefined) {
      worker.location = String(location).trim();
    }

    await worker.save();

    res.status(200).json({
      status: "success",
      message: "Worker admin permissions updated successfully in MongoDB",
      data: {
        worker: {
          id: worker._id.toString(),
          identifier: worker.identifier,
          name: worker.name || "",
          phone: worker.phone || "",
          location: worker.location || "",
          deviceInfo: worker.deviceInfo || "",
          role: worker.role,
          assignedRoles: worker.assignedRoles || [],
          canDeleteData: Boolean(worker.canDeleteData),
          profileCompleted: Boolean(worker.profileCompleted && worker.name),
          isFirstLogin: worker.isFirstLogin ?? false,
          createdAt: worker.createdAt,
          lastLoginAt: worker.lastLoginAt,
          status: "active",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Worker Admin Profile (Mandatory first-time details) directly in MongoDB
 */
export const updateWorkerAdminProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, location, deviceInfo } = req.body;

    if (!name || !phone) {
      res.status(400).json({
        status: "fail",
        message: "Full Name and Phone Number are mandatory",
      });
      return;
    }

    const worker = await AdminUser.findById(id);

    if (!worker) {
      res.status(404).json({
        status: "fail",
        message: "Admin user not found",
      });
      return;
    }

    worker.name = name.trim();
    worker.phone = phone.trim();
    worker.profileCompleted = true;
    worker.isFirstLogin = false;
    if (location) worker.location = location;
    if (deviceInfo) worker.deviceInfo = deviceInfo;

    await worker.save();

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        worker: {
          id: worker._id.toString(),
          identifier: worker.identifier,
          name: worker.name,
          phone: worker.phone,
          location: worker.location || "",
          deviceInfo: worker.deviceInfo || "",
          role: worker.role,
          profileCompleted: true,
          isFirstLogin: false,
          lastLoginAt: worker.lastLoginAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Worker Admin directly from MongoDB
 */
export const deleteWorkerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await AdminUser.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({
        status: "fail",
        message: "Admin user not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Worker admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

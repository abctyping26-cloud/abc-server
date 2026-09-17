import type { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { CommercialUser, type IClientFile } from "../models/commercialUser.model.js";
import { uploadStreamToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * Check if the authenticated admin has permission to view or manage this client
 */
const hasClientPermission = (admin: AuthenticatedRequest["admin"], client: any): boolean => {
  if (!admin) return false;
  if (admin.role === "master_admin" || admin.role === "superadmin") return true;
  // Website users are accessible to all worker admins
  if (client.source === "website") return true;
  // Worker-created clients are only accessible to their creator
  if (client.createdBy && client.createdBy.toString() === admin.id) return true;
  return false;
};

/**
 * Get all Clients / Commercial Users with role-based scoping
 * - Master Admin: Sees ALL clients (website + all workers)
 * - Worker Admin: Sees Website users + clients they created themselves
 */
export const getClients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ status: "fail", message: "Unauthorized" });
      return;
    }

    const isMaster = admin.role === "master_admin" || admin.role === "superadmin";
    const filter: Record<string, any> = {};

    // Apply role-based scoping
    if (!isMaster) {
      filter.$or = [
        { source: "website" },
        { createdBy: new Types.ObjectId(admin.id) },
      ];
    }

    // Optional status filter: completed = true / false
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === "true";
    }

    // Optional source filter: website / manual
    if (req.query.source) {
      filter.source = req.query.source;
    }

    // Optional search filter
    if (req.query.search && typeof req.query.search === "string") {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      const searchCondition = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { identifier: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    const clients = await CommercialUser.find(filter)
      .populate("createdBy", "name identifier role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: clients.length,
      data: {
        clients: clients.map((c) => ({
          id: c._id.toString(),
          identifier: c.identifier,
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          address: c.address || "",
          pin: c.pin || "",
          completed: Boolean(c.completed),
          photo: c.photo || null,
          files: c.files || [],
          fileCount: c.files?.length || 0,
          source: c.source || "manual",
          createdBy: c.createdBy || null,
          lastLoginAt: c.lastLoginAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single client by ID
 */
export const getClientById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await CommercialUser.findById(id).populate(
      "createdBy",
      "name identifier role"
    );

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to access this client record.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        client: {
          id: client._id.toString(),
          identifier: client.identifier,
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
          pin: client.pin || "",
          completed: Boolean(client.completed),
          photo: client.photo || null,
          files: client.files || [],
          source: client.source || "manual",
          createdBy: client.createdBy || null,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Client manually (Supports sparse fields)
 */
export const createClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ status: "fail", message: "Unauthorized" });
      return;
    }

    const { name, email, phone, address, pin, completed } = req.body;

    const trimmedName = name?.trim() || "";
    const trimmedEmail = email?.trim().toLowerCase() || "";
    const trimmedPhone = phone?.trim() || "";

    // Require at least one field to create a record
    if (!trimmedName && !trimmedEmail && !trimmedPhone) {
      res.status(400).json({
        status: "fail",
        message: "Please provide at least a Name, Phone number, or Email for the client.",
      });
      return;
    }

    // Determine unique identifier
    let identifier = trimmedEmail || trimmedPhone;
    if (!identifier) {
      const slug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .slice(0, 15);
      identifier = `client_${slug}_${Date.now()}`;
    }

    // Check if identifier is already in use
    const existing = await CommercialUser.findOne({ identifier });
    if (existing) {
      res.status(409).json({
        status: "fail",
        message: `A client with ${trimmedEmail ? "email " + trimmedEmail : "identifier " + identifier} already exists.`,
      });
      return;
    }

    const newClient = await CommercialUser.create({
      identifier,
      name: trimmedName,
      email: trimmedEmail || undefined,
      phone: trimmedPhone || undefined,
      address: address?.trim() || "",
      pin: pin?.trim() || "",
      completed: completed === true || completed === "true",
      source: "manual",
      createdBy: new Types.ObjectId(admin.id),
      files: [],
    });

    res.status(201).json({
      status: "success",
      message: "Client created successfully",
      data: {
        client: {
          id: newClient._id.toString(),
          identifier: newClient.identifier,
          name: newClient.name,
          email: newClient.email || "",
          phone: newClient.phone || "",
          address: newClient.address || "",
          pin: newClient.pin || "",
          completed: newClient.completed,
          photo: null,
          files: [],
          source: newClient.source,
          createdBy: admin.id,
          createdAt: newClient.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update client details
 */
export const updateClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await CommercialUser.findById(id);

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to edit this client.",
      });
      return;
    }

    const { name, email, phone, address, pin, completed } = req.body;

    if (name !== undefined) client.name = name.trim();
    if (email !== undefined) client.email = email.trim().toLowerCase() || undefined;
    if (phone !== undefined) client.phone = phone.trim() || undefined;
    if (address !== undefined) client.address = address.trim();
    if (pin !== undefined) client.pin = pin.trim();
    if (completed !== undefined) {
      client.completed = completed === true || completed === "true";
    }

    await client.save();

    res.status(200).json({
      status: "success",
      message: "Client updated successfully",
      data: {
        client: {
          id: client._id.toString(),
          identifier: client.identifier,
          name: client.name,
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
          pin: client.pin || "",
          completed: client.completed,
          photo: client.photo || null,
          files: client.files || [],
          source: client.source,
          updatedAt: client.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick toggle for service completed status
 */
export const toggleClientCompleted = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await CommercialUser.findById(id);

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to update this client's status.",
      });
      return;
    }

    const newCompleted =
      req.body.completed !== undefined
        ? req.body.completed === true || req.body.completed === "true"
        : !client.completed;

    client.completed = newCompleted;
    await client.save();

    res.status(200).json({
      status: "success",
      message: `Service status marked as ${newCompleted ? "Completed" : "In Progress"}`,
      data: {
        id: client._id.toString(),
        completed: client.completed,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload one or multiple files to Cloudinary for a specific client
 */
export const uploadClientFiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await CommercialUser.findById(id);

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to upload files for this client.",
      });
      return;
    }

    // Handle files from multer (either req.files as array or req.file as single)
    const uploadedFiles: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      uploadedFiles.push(...req.files);
    } else if (req.file) {
      uploadedFiles.push(req.file);
    }

    if (uploadedFiles.length === 0) {
      res.status(400).json({ status: "fail", message: "No files provided for upload" });
      return;
    }

    const uploadedRecords: IClientFile[] = [];

    // Stream each file to Cloudinary in its client-specific folder
    for (const file of uploadedFiles) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const isImage = file.mimetype.startsWith("image/");
      const resourceType = isImage ? "image" : "raw";

      const cloudResult = await uploadStreamToCloudinary(file.buffer, {
        folder: `abc_clients/${client._id}/documents`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      });

      const fileRecord: IClientFile = {
        public_id: cloudResult.public_id,
        url: cloudResult.secure_url,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date(),
        uploadedBy: req.admin ? new Types.ObjectId(req.admin.id) : undefined,
      };

      client.files.push(fileRecord);
      uploadedRecords.push(fileRecord);
    }

    await client.save();

    res.status(201).json({
      status: "success",
      message: `${uploadedRecords.length} file(s) uploaded successfully`,
      data: {
        files: client.files,
        newlyUploaded: uploadedRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific file from Cloudinary and MongoDB
 */
export const deleteClientFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, fileId } = req.params;
    const client = await CommercialUser.findById(id);

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to delete this file.",
      });
      return;
    }

    // Find the file entry in client's files array
    const fileIndex = client.files.findIndex(
      (f) => f._id?.toString() === fileId || f.public_id === fileId
    );

    if (fileIndex === -1) {
      res.status(404).json({ status: "fail", message: "File record not found on client" });
      return;
    }

    const fileToDelete = client.files[fileIndex];

    // Remove from Cloudinary
    try {
      const isImage = fileToDelete.fileType?.startsWith("image/");
      await deleteFromCloudinary(fileToDelete.public_id, isImage ? "image" : "raw");
    } catch (cloudErr) {
      console.warn("⚠️ Could not delete asset from Cloudinary (might already be removed):", cloudErr);
    }

    // Remove from MongoDB
    client.files.splice(fileIndex, 1);
    await client.save();

    res.status(200).json({
      status: "success",
      message: "File deleted successfully",
      data: {
        files: client.files,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload or replace client's profile photo
 */
export const uploadClientPhoto = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await CommercialUser.findById(id);

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to update this client's photo.",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ status: "fail", message: "No photo file provided" });
      return;
    }

    // Remove previous photo from Cloudinary if one exists
    if (client.photo?.public_id) {
      try {
        await deleteFromCloudinary(client.photo.public_id, "image");
      } catch (err) {
        console.warn("Could not delete old photo from Cloudinary:", err);
      }
    }

    // Stream new photo to Cloudinary
    const result = await uploadStreamToCloudinary(req.file.buffer, {
      folder: `abc_clients/${client._id}/profile`,
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
      ],
    });

    client.photo = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    await client.save();

    res.status(200).json({
      status: "success",
      message: "Profile photo updated successfully",
      data: {
        photo: client.photo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete client and clean up all associated Cloudinary assets
 */
export const deleteClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await CommercialUser.findById(id);

    if (!client) {
      res.status(404).json({ status: "fail", message: "Client not found" });
      return;
    }

    if (!hasClientPermission(req.admin, client)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to delete this client.",
      });
      return;
    }

    // Clean up all client files from Cloudinary
    if (client.files && client.files.length > 0) {
      for (const f of client.files) {
        try {
          const isImage = f.fileType?.startsWith("image/");
          await deleteFromCloudinary(f.public_id, isImage ? "image" : "raw");
        } catch (e) {
          // Continue cleanup
        }
      }
    }

    // Clean up photo
    if (client.photo?.public_id) {
      try {
        await deleteFromCloudinary(client.photo.public_id, "image");
      } catch (e) {
        // Continue cleanup
      }
    }

    await CommercialUser.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Client and all associated files deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

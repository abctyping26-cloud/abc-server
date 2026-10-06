import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { Note, type INoteConnection } from "../models/note.model.js";
import { CommercialUser } from "../models/commercialUser.model.js";
import { AccountingInvoice } from "../models/invoice.model.js";
import { uploadStreamToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

/**
 * Format bytes to readable string (KB, MB)
 */
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * GET /api/v1/admin/notes
 * Fetch all notes for the active project
 */
export const getNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const project = (req.query.project as string) || "abc_typing";
    const notes = await Note.find({ project }).sort({ zIndex: 1, createdAt: 1 }).lean().exec();

    res.status(200).json({
      status: "success",
      results: notes.length,
      data: {
        notes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/notes
 * Create a new sticky note
 */
export const createNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title = "",
      content = "",
      color = "yellow",
      x = 100,
      y = 100,
      width = 290,
      height = 260,
      isPinned = false,
      project = "abc_typing",
      connections = [],
    } = req.body;

    // Determine the highest zIndex so new note is on top
    const highestNote = await Note.findOne({ project }).sort({ zIndex: -1 }).select("zIndex").lean().exec();
    const newZIndex = (highestNote?.zIndex || 0) + 1;

    const note = await Note.create({
      title,
      content,
      color,
      x: Number(x) || 100,
      y: Number(y) || 100,
      zIndex: newZIndex,
      width: Number(width) || 290,
      height: Number(height) || 260,
      isPinned: Boolean(isPinned),
      project,
      createdBy: req.admin?.id || "admin",
      createdByName: req.admin?.identifier || "Admin",
      connections,
    });

    res.status(201).json({
      status: "success",
      message: "Sticky note created successfully",
      data: {
        note,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/notes/:id
 * Update title, content, color, pin, dimensions, etc.
 */
export const updateNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, color, isPinned, width, height, connections } = req.body;

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ status: "fail", message: "Note not found" });
      return;
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = Boolean(isPinned);
    if (width !== undefined) note.width = Number(width);
    if (height !== undefined) note.height = Number(height);
    if (connections !== undefined && Array.isArray(connections)) note.connections = connections;

    await note.save();

    res.status(200).json({
      status: "success",
      message: "Sticky note updated",
      data: {
        note,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/notes/:id/position
 * Fast coordinate update for drag and drop persistence
 */
export const updateNotePosition = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { x, y, zIndex } = req.body;

    const updateFields: Record<string, any> = {};
    if (x !== undefined) updateFields.x = Number(x);
    if (y !== undefined) updateFields.y = Number(y);
    if (zIndex !== undefined) updateFields.zIndex = Number(zIndex);

    const note = await Note.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });
    if (!note) {
      res.status(404).json({ status: "fail", message: "Note not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        note,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/notes/:id
 * Delete note and clean up any uploaded Cloudinary assets
 */
export const deleteNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ status: "fail", message: "Note not found" });
      return;
    }

    // Clean up Cloudinary files if attached to this note
    for (const conn of note.connections) {
      if (conn.type === "file" && conn.metadata?.public_id) {
        try {
          await deleteFromCloudinary(conn.metadata.public_id, conn.metadata?.resource_type || "raw");
        } catch {
          // Non-blocking if file is already deleted
        }
      }
    }

    await note.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Sticky note deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/notes/:id/files
 * Upload files via Cloudinary stream and attach to note
 */
export const uploadNoteFiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ status: "fail", message: "Note not found" });
      return;
    }

    const uploadedFiles: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      uploadedFiles.push(...req.files);
    } else if (req.file) {
      uploadedFiles.push(req.file);
    }

    if (uploadedFiles.length === 0) {
      res.status(400).json({ status: "fail", message: "No files uploaded" });
      return;
    }

    const newConnections: INoteConnection[] = [];

    for (const file of uploadedFiles) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const isImage = file.mimetype.startsWith("image/");
      const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
      const resourceType = isImage || isPdf ? "image" : "raw";

      const uploadResult = await uploadStreamToCloudinary(file.buffer, {
        folder: "abc-typing/notes",
        public_id: `${Date.now()}_${safeName}`,
        resource_type: resourceType,
      });

      const connection: INoteConnection = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: "file",
        title: file.originalname,
        value: uploadResult.secure_url,
        subtitle: formatBytes(file.size),
        metadata: {
          public_id: uploadResult.public_id,
          format: uploadResult.format || file.mimetype,
          size: file.size,
          resource_type: resourceType,
        },
      };

      note.connections.push(connection);
      newConnections.push(connection);
    }

    await note.save();

    res.status(200).json({
      status: "success",
      message: `${uploadedFiles.length} file(s) uploaded and connected`,
      data: {
        note,
        addedConnections: newConnections,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/notes/:id/connections
 * Add a connection (client, invoice, file, number)
 */
export const addNoteConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, title, value, subtitle = "", metadata = {} } = req.body;

    if (!type || !title || !value) {
      res.status(400).json({
        status: "fail",
        message: "Connection type, title, and value are required",
      });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ status: "fail", message: "Note not found" });
      return;
    }

    const newConnection: INoteConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title: title.trim(),
      value: value.trim(),
      subtitle: subtitle.trim(),
      metadata,
    };

    note.connections.push(newConnection);
    await note.save();

    res.status(200).json({
      status: "success",
      message: "Connection added to sticky note",
      data: {
        note,
        connection: newConnection,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/notes/:id/connections/:connId
 * Remove a connection from note
 */
export const removeNoteConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, connId } = req.params;
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ status: "fail", message: "Note not found" });
      return;
    }

    const conn = note.connections.find((c) => c.id === connId);
    if (conn && conn.type === "file" && conn.metadata?.public_id) {
      try {
        await deleteFromCloudinary(conn.metadata.public_id, conn.metadata?.resource_type || "raw");
      } catch {
        // ignore deletion failure
      }
    }

    note.connections = note.connections.filter((c) => c.id !== connId);
    await note.save();

    res.status(200).json({
      status: "success",
      message: "Connection removed from note",
      data: {
        note,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/notes/connectables/search
 * Search across clients and invoices for quick connecting
 */
export const searchConnectables = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = String(req.query.q || "").trim();
    const type = String(req.query.type || "all").toLowerCase();

    const results: { clients: any[]; invoices: any[] } = {
      clients: [],
      invoices: [],
    };

    const regex = new RegExp(query, "i");

    if (type === "all" || type === "client") {
      const clientFilter: Record<string, any> = query
        ? {
            $or: [{ name: regex }, { phone: regex }, { email: regex }, { identifier: regex }],
          }
        : {};

      const clients = await CommercialUser.find(clientFilter)
        .sort({ updatedAt: -1 })
        .limit(20)
        .select("_id identifier name phone email completed")
        .lean()
        .exec();

      results.clients = clients.map((c) => ({
        id: c._id.toString(),
        identifier: c.identifier,
        name: c.name || c.identifier || "Unnamed Client",
        phone: c.phone || "",
        email: c.email || "",
        completed: c.completed,
      }));
    }

    if (type === "all" || type === "invoice") {
      const invoiceFilter: Record<string, any> = query
        ? {
            $or: [
              { invoiceNo: regex },
              { "customer.name": regex },
              { "customer.mobile": regex },
            ],
          }
        : {};

      const invoices = await AccountingInvoice.find(invoiceFilter)
        .sort({ createdAt: -1 })
        .limit(20)
        .select("_id invoiceNo date customer financialSummary status")
        .lean()
        .exec();

      results.invoices = invoices.map((inv: any) => ({
        id: inv._id.toString(),
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        customerName: inv.customer?.name || "Customer",
        customerMobile: inv.customer?.mobile || "",
        grandTotal: inv.financialSummary?.grossAmount || inv.financialSummary?.total || "0.00",
        balance: inv.financialSummary?.balance || "0.00",
        status: inv.status || "Pending",
      }));
    }

    res.status(200).json({
      status: "success",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

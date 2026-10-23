import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CommercialUser } from "../models/commercialUser.model.js";
import { AdminUser } from "../models/adminUser.model.js";
import { config } from "../config/index.js";

// Helper function to sign JWT
const generateToken = (payload: object): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Commercial User Login
 * - Stored in 'user-commercial' collection
 * - Automatically registers the user if no existing account is found
 */
// Helper function to normalize phone numbers
const normalizePhone = (input: string): string => {
  return input.replace(/[\s\-\(\)\.]/g, "").trim();
};

/**
 * Commercial User Login
 * - Supports phone number (with or without country code) and email
 * - Verifies bcrypt-hashed 6-digit PIN or password
 * - Connects walk-in clients created by store admin directly to their progress
 */
export const loginCommercial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, password, name, isSignUp } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        status: "fail",
        message: "Phone number (or email) and password/PIN are required.",
      });
      return;
    }

    const rawInput = identifier.toString().trim();
    const isEmail = rawInput.includes("@");
    const normalizedIdentifier = rawInput.toLowerCase();
    const cleanPhone = normalizePhone(rawInput);

    // Build flexible query conditions
    let searchConditions: Array<Record<string, any>> = [];

    if (isEmail) {
      searchConditions = [
        { identifier: normalizedIdentifier },
        { email: normalizedIdentifier },
      ];
    } else {
      const lastDigits = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;
      searchConditions = [
        { identifier: normalizedIdentifier },
        { identifier: cleanPhone },
        { phone: cleanPhone },
        { phone: `+${cleanPhone}` },
        { phone: cleanPhone.startsWith("+") ? cleanPhone.substring(1) : cleanPhone },
      ];
      if (lastDigits.length >= 7) {
        const regex = new RegExp(`${lastDigits}$`);
        searchConditions.push({ phone: { $regex: regex } });
        searchConditions.push({ identifier: { $regex: regex } });
      }
    }

    // Check if commercial user already exists in MongoDB 'user-commercial'
    let user = await CommercialUser.findOne({ $or: searchConditions });

    if (!user) {
      // If user specifically requested to Sign Up as a new website client
      if (isSignUp) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.toString().trim(), salt);

        user = await CommercialUser.create({
          identifier: isEmail ? normalizedIdentifier : cleanPhone,
          password: hashedPassword,
          name: name?.trim() || "",
          email: isEmail ? normalizedIdentifier : undefined,
          phone: !isEmail ? cleanPhone : undefined,
          source: "website",
          completed: false,
          lastLoginAt: new Date(),
        });

        const token = generateToken({
          id: user._id.toString(),
          identifier: user.identifier,
          type: "commercial",
        });

        res.status(201).json({
          status: "success",
          isNewUser: true,
          message: "Welcome! Your account was created successfully.",
          data: {
            user: {
              id: user._id.toString(),
              identifier: user.identifier,
              name: user.name,
              phone: user.phone || "",
              createdAt: user.createdAt,
            },
            token,
          },
        });
        return;
      }

      res.status(404).json({
        status: "fail",
        message:
          "No account found with this phone number. If you are a walk-in client, please ensure you use the exact phone number given at the store.",
      });
      return;
    }

    // Existing commercial user: verify password / PIN
    if (!user.password) {
      res.status(401).json({
        status: "fail",
        message:
          "This account does not have a PIN configured yet. Please check your store receipt or ask the store admin for your PIN.",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password.toString().trim(),
      user.password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        status: "fail",
        message: "Invalid PIN or password. Please verify the credentials given by the store.",
      });
      return;
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({
      id: user._id.toString(),
      identifier: user.identifier,
      type: "commercial",
    });

    res.status(200).json({
      status: "success",
      isNewUser: false,
      message: "Login successful. Welcome back!",
      data: {
        user: {
          id: user._id.toString(),
          identifier: user.identifier,
          name: user.name,
          phone: user.phone || "",
          completed: user.completed,
          lastLoginAt: user.lastLoginAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a phone number or identifier already exists in MongoDB
 */
export const checkClientPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      res.status(400).json({ status: "fail", message: "Phone or identifier is required" });
      return;
    }

    const rawInput = identifier.toString().trim();
    const cleanPhone = normalizePhone(rawInput);
    const lastDigits = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;

    const conditions: Array<Record<string, any>> = [
      { identifier: rawInput.toLowerCase() },
      { identifier: cleanPhone },
      { phone: cleanPhone },
      { phone: `+${cleanPhone}` },
    ];
    if (lastDigits.length >= 7) {
      conditions.push({ phone: { $regex: new RegExp(`${lastDigits}$`) } });
    }

    const existing = await CommercialUser.findOne({ $or: conditions }).select("identifier name source");

    res.status(200).json({
      status: "success",
      exists: Boolean(existing),
      source: existing?.source || null,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Admin User Login
 * - Stored in 'user-admin' collection
 * - Strict login only: DOES NOT create an account if not found
 */
export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, password, location, deviceInfo } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        status: "fail",
        message: "Admin identifier and password are required",
      });
      return;
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Look for admin in 'user-admin' collection
    let admin = await AdminUser.findOne({
      identifier: normalizedIdentifier,
    });

    // Auto-seed Master Admin on first authorized login if not already created
    if (
      !admin &&
      normalizedIdentifier === "masteradmin@abc.com" &&
      password === "Arun@2026"
    ) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Arun@2026", salt);
      admin = await AdminUser.create({
        identifier: "masteradmin@abc.com",
        password: hashedPassword,
        role: "master_admin",
        name: "Master Admin",
        profileCompleted: true,
        isFirstLogin: false,
      });
    }

    if (!admin) {
      // STRICT: Do not create admin account automatically
      res.status(404).json({
        status: "fail",
        message:
          "Admin account does not exist. Admin registration is restricted. Please contact your system administrator.",
      });
      return;
    }

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({
        status: "fail",
        message: "Invalid admin credentials.",
      });
      return;
    }

    // Update last login, location & device info
    admin.lastLoginAt = new Date();
    if (location) admin.location = location;
    if (deviceInfo) admin.deviceInfo = deviceInfo;
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress;
    if (clientIp) admin.ipAddress = clientIp;
    await admin.save();

    const isMaster = admin.role === "master_admin" || admin.role === "superadmin";
    const assignedRoles = isMaster
      ? ["accounting", "enquiries", "whatsapp_enquiries", "clients", "website_edit", "analytics", "notes", "overview"]
      : (admin.assignedRoles && admin.assignedRoles.length > 0
          ? admin.assignedRoles
          : ["accounting", "enquiries", "whatsapp_enquiries", "clients", "notes"]);
    const canDeleteData = isMaster ? true : Boolean(admin.canDeleteData);

    const token = generateToken({
      id: admin._id,
      identifier: admin.identifier,
      role: admin.role,
      type: "admin",
      assignedRoles,
      canDeleteData,
    });

    res.status(200).json({
      status: "success",
      message: "Admin authenticated successfully",
      data: {
        admin: {
          id: admin._id,
          identifier: admin.identifier,
          role: admin.role,
          name: admin.name || "",
          phone: admin.phone || "",
          location: admin.location || "",
          deviceInfo: admin.deviceInfo || "",
          assignedRoles,
          canDeleteData,
          isFirstLogin: admin.isFirstLogin ?? (admin.role !== "master_admin"),
          profileCompleted:
            admin.profileCompleted ?? (admin.role === "master_admin"),
          lastLoginAt: admin.lastLoginAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

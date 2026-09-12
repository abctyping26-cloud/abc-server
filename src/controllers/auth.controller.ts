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
export const loginCommercial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, password, name } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        status: "fail",
        message: "Email or phone identifier and password are required",
      });
      return;
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Check if commercial user already exists
    let user = await CommercialUser.findOne({
      identifier: normalizedIdentifier,
    });

    if (!user) {
      // Auto-create new commercial account
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await CommercialUser.create({
        identifier: normalizedIdentifier,
        password: hashedPassword,
        name: name?.trim() || undefined,
        lastLoginAt: new Date(),
      });

      const token = generateToken({
        id: user._id,
        identifier: user.identifier,
        type: "commercial",
      });

      res.status(201).json({
        status: "success",
        isNewUser: true,
        message: "Welcome! Your account was automatically created and logged in.",
        data: {
          user: {
            id: user._id,
            identifier: user.identifier,
            name: user.name,
            createdAt: user.createdAt,
          },
          token,
        },
      });
      return;
    }

    // Existing commercial user: verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        status: "fail",
        message: "Invalid credentials. Please verify your password.",
      });
      return;
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      identifier: user.identifier,
      type: "commercial",
    });

    res.status(200).json({
      status: "success",
      isNewUser: false,
      message: "Login successful. Welcome back!",
      data: {
        user: {
          id: user._id,
          identifier: user.identifier,
          name: user.name,
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

    const token = generateToken({
      id: admin._id,
      identifier: admin.identifier,
      role: admin.role,
      type: "admin",
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

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export interface AuthenticatedAdmin {
  id: string;
  identifier: string;
  role: "admin" | "superadmin" | "master_admin" | "worker_admin";
  type: "admin";
}

export interface AuthenticatedRequest extends Request {
  admin?: AuthenticatedAdmin;
}

/**
 * Middleware to authenticate Admin / Worker Admin requests using JWT
 */
export const authenticateAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
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
      req.admin = decoded;
      return next();
    }

    // Fallback support for requests passing admin headers directly
    const fallbackId = req.headers["x-admin-id"] as string;
    const fallbackRole = req.headers["x-admin-role"] as AuthenticatedAdmin["role"];
    const fallbackIdentifier = req.headers["x-admin-identifier"] as string;

    if (fallbackId) {
      req.admin = {
        id: fallbackId,
        identifier: fallbackIdentifier || "admin",
        role: fallbackRole || "worker_admin",
        type: "admin",
      };
      return next();
    }

    res.status(401).json({
      status: "fail",
      message: "Authentication required. Please provide a valid admin token.",
    });
  } catch (error) {
    res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

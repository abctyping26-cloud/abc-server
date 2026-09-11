import type { Request, Response } from "express";

export const getAdminStatus = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    service: "admin-api",
    message: "Admin API endpoint ready for abc-admin subproject",
    timestamp: new Date().toISOString(),
  });
};

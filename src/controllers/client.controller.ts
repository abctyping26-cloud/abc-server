import type { Request, Response } from "express";

export const getClientStatus = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    service: "commercial-api",
    message: "Commercial client API endpoint ready for abctyping subproject",
    timestamp: new Date().toISOString(),
  });
};

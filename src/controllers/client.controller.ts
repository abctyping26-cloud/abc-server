import type { Response, NextFunction } from "express";
import { CommercialUser } from "../models/commercialUser.model.js";
import { AccountingInvoice } from "../models/invoice.model.js";
import type { ClientAuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const getClientStatus = (_req: any, res: Response): void => {
  res.status(200).json({
    status: "ok",
    service: "commercial-api",
    message: "Commercial client API endpoint ready for abctyping subproject",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get comprehensive client dashboard data
 * - Current service status (in progress / completed)
 * - Expiration / delivery timer
 * - Completed documents / files for download
 * - Invoices & Quotations
 * - Account details
 */
export const getClientDashboard = async (
  req: ClientAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clientId = req.clientUser?.id;
    if (!clientId) {
      res.status(401).json({ status: "fail", message: "Client authentication required." });
      return;
    }

    const client = await CommercialUser.findById(clientId).select("-password");
    if (!client) {
      res.status(404).json({ status: "fail", message: "Client profile not found." });
      return;
    }

    // Build query for client invoices / quotations
    const phone = client.phone ? client.phone.replace(/\D/g, "") : "";
    const last7 = phone.length >= 7 ? phone.slice(-7) : "";

    const invoiceConditions: Array<Record<string, any>> = [
      { "customer.clientId": client._id },
    ];
    if (client.phone) {
      invoiceConditions.push({ "customer.mobile": client.phone });
    }
    if (client.identifier) {
      invoiceConditions.push({ "customer.mobile": client.identifier });
    }
    if (last7) {
      invoiceConditions.push({ "customer.mobile": { $regex: new RegExp(`${last7}$`) } });
    }

    const invoices = await AccountingInvoice.find({ $or: invoiceConditions })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("invoiceNo invoiceDate status financialSummary lineItems createdAt");

    res.status(200).json({
      status: "success",
      data: {
        client: {
          id: client._id.toString(),
          identifier: client.identifier,
          name: client.name || "Client",
          phone: client.phone || client.identifier,
          email: client.email || "",
          address: client.address || "",
          pin: client.pin || "",
          completed: client.completed,
          expirationTimer: client.expirationTimer || null,
          files: client.files || [],
          services: (client.services || []).map((s: any) => ({
            id: s._id?.toString(),
            name: s.name,
            status: s.status,
            targetDate: s.targetDate || null,
            files: s.files || [],
            notes: s.notes || "",
            createdAt: s.createdAt,
          })),
          source: client.source,
          createdAt: client.createdAt,
        },
        invoices: invoices.map((inv) => ({
          id: inv._id.toString(),
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          status: inv.status,
          total: inv.financialSummary?.grossAmount || inv.financialSummary?.total || "0",
          balance: inv.financialSummary?.balance || "0",
          paid: inv.financialSummary?.paid || "0",
          itemsCount: inv.lineItems?.length || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

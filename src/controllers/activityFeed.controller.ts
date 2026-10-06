import type { Request, Response, NextFunction } from "express";
import { AccountingInvoice } from "../models/invoice.model.js";
import { WhatsAppMessage } from "../models/whatsappMessage.model.js";
import { AdminUser } from "../models/adminUser.model.js";
import { Enquiry } from "../models/enquiry.model.js";
import { AccountingExpense } from "../models/accountingExpense.model.js";

export interface UnifiedActivityItem {
  id: string;
  category: "invoices" | "whatsapp_files" | "admins" | "enquiries" | "expenses";
  action: string;
  title: string;
  description: string;
  actorName: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * Get aggregated activity feed with bounded cursor pagination
 * GET /api/v1/admin/activities
 */
export const getActivityFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10), 1), 50);
    const before = req.query.before ? new Date(String(req.query.before)) : null;
    const category = String(req.query.category || "all").toLowerCase();
    const search = req.query.search ? String(req.query.search).trim() : "";

    const dateFilter = before && !isNaN(before.getTime()) ? { createdAt: { $lt: before } } : {};

    const items: UnifiedActivityItem[] = [];

    // Helper functions to fetch from each collection with bounded limit
    const fetchInvoices = async (): Promise<UnifiedActivityItem[]> => {
      const query: Record<string, any> = { ...dateFilter };
      if (search) {
        query.$or = [
          { invoiceNo: new RegExp(search, "i") },
          { "customer.name": new RegExp(search, "i") },
          { salesMan: new RegExp(search, "i") },
        ];
      }
      const docs = await AccountingInvoice.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map((doc: any) => ({
        id: `inv_${doc._id}`,
        category: "invoices",
        action: "invoice_created",
        title: `Invoice #${doc.invoiceNo || "N/A"} created`,
        description: `Issued for ${doc.customer?.name || "Customer"} with total AED ${doc.financialSummary?.grandTotal || doc.financialSummary?.total || "0.00"}`,
        actorName: doc.salesMan || "Admin Accountant",
        timestamp: (doc.createdAt || new Date()).toISOString(),
        metadata: {
          invoiceId: doc._id,
          invoiceNo: doc.invoiceNo,
          customerName: doc.customer?.name,
          customerMobile: doc.customer?.mobile,
          grandTotal: doc.financialSummary?.grandTotal || doc.financialSummary?.total,
          salesMan: doc.salesMan,
          status: doc.status,
          itemCount: Array.isArray(doc.lineItems) ? doc.lineItems.length : 0,
        },
      }));
    };

    const fetchWhatsAppFiles = async (): Promise<UnifiedActivityItem[]> => {
      const query: Record<string, any> = {
        ...dateFilter,
        type: { $in: ["image", "document", "audio", "video"] },
      };
      if (search) {
        query.$or = [
          { customerPhone: new RegExp(search, "i") },
          { customerName: new RegExp(search, "i") },
          { mediaFileName: new RegExp(search, "i") },
          { text: new RegExp(search, "i") },
        ];
      }
      const docs = await WhatsAppMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map((doc: any) => {
        const fileLabel = doc.mediaFileName || `${doc.type || "file"}`;
        const sender = doc.customerName || doc.customerPhone || "WhatsApp User";
        return {
          id: `wa_${doc._id}`,
          category: "whatsapp_files",
          action: "whatsapp_file_received",
          title: `WhatsApp File: ${fileLabel}`,
          description: `Received from ${sender} (${doc.customerPhone || ""})`,
          actorName: sender,
          timestamp: (doc.createdAt || doc.timestamp || new Date()).toISOString(),
          metadata: {
            messageId: doc.messageId,
            customerPhone: doc.customerPhone,
            customerName: doc.customerName,
            mediaType: doc.type,
            mediaUrl: doc.mediaUrl,
            mediaFileName: doc.mediaFileName,
            mediaFileSize: doc.mediaFileSize,
            mediaMimeType: doc.mediaMimeType,
            caption: doc.text,
          },
        };
      });
    };

    const fetchAdmins = async (): Promise<UnifiedActivityItem[]> => {
      const query: Record<string, any> = { ...dateFilter };
      if (search) {
        query.$or = [
          { identifier: new RegExp(search, "i") },
          { name: new RegExp(search, "i") },
          { phone: new RegExp(search, "i") },
        ];
      }
      const docs = await AdminUser.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map((doc: any) => ({
        id: `adm_${doc._id}`,
        category: "admins",
        action: "admin_created",
        title: `Admin Account: ${doc.name || doc.identifier}`,
        description: `Role: ${doc.role} (${(doc.assignedRoles || []).join(", ") || "Full Access"})`,
        actorName: "Master Admin",
        timestamp: (doc.createdAt || new Date()).toISOString(),
        metadata: {
          adminId: doc._id,
          identifier: doc.identifier,
          name: doc.name,
          phone: doc.phone,
          role: doc.role,
          assignedRoles: doc.assignedRoles,
          canDeleteData: doc.canDeleteData,
        },
      }));
    };

    const fetchEnquiries = async (): Promise<UnifiedActivityItem[]> => {
      const query: Record<string, any> = { ...dateFilter };
      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { phone: new RegExp(search, "i") },
          { service: new RegExp(search, "i") },
        ];
      }
      const docs = await Enquiry.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map((doc: any) => ({
        id: `enq_${doc._id}`,
        category: "enquiries",
        action: "enquiry_received",
        title: `New Enquiry from ${doc.name || "Visitor"}`,
        description: `Interested in: ${doc.service || "General Service"} (Status: ${doc.status || "pending"})`,
        actorName: doc.name || doc.phone || "Web Visitor",
        timestamp: (doc.createdAt || new Date()).toISOString(),
        metadata: {
          enquiryId: doc._id,
          name: doc.name,
          phone: doc.phone,
          service: doc.service,
          status: doc.status,
          notes: doc.notes,
        },
      }));
    };

    const fetchExpenses = async (): Promise<UnifiedActivityItem[]> => {
      const query: Record<string, any> = { ...dateFilter };
      if (search) {
        query.$or = [
          { expenseNo: new RegExp(search, "i") },
          { title: new RegExp(search, "i") },
          { supplier: new RegExp(search, "i") },
        ];
      }
      const docs = await AccountingExpense.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map((doc: any) => ({
        id: `exp_${doc._id}`,
        category: "expenses",
        action: "expense_recorded",
        title: `Expense #${doc.expenseNo || doc.title || "Record"}`,
        description: `Amount: AED ${doc.amount || "0.00"} (${doc.category || "General"})`,
        actorName: "Admin Accountant",
        timestamp: (doc.createdAt || new Date()).toISOString(),
        metadata: {
          expenseId: doc._id,
          expenseNo: doc.expenseNo,
          title: doc.title,
          amount: doc.amount,
          category: doc.category,
          supplier: doc.supplier,
        },
      }));
    };

    // Branch based on category selection
    if (category === "invoices") {
      items.push(...(await fetchInvoices()));
    } else if (category === "whatsapp_files") {
      items.push(...(await fetchWhatsAppFiles()));
    } else if (category === "admins") {
      items.push(...(await fetchAdmins()));
    } else if (category === "enquiries") {
      items.push(...(await fetchEnquiries()));
    } else if (category === "expenses") {
      items.push(...(await fetchExpenses()));
    } else {
      // Parallel bounded fetch across all collections
      const [invoices, waFiles, admins, enquiries, expenses] = await Promise.all([
        fetchInvoices(),
        fetchWhatsAppFiles(),
        fetchAdmins(),
        fetchEnquiries(),
        fetchExpenses(),
      ]);

      items.push(...invoices, ...waFiles, ...admins, ...enquiries, ...expenses);
    }

    // Sort by timestamp descending
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Slice to the requested limit
    const paginatedItems = items.slice(0, limit);

    // Compute nextCursor for the client
    const nextCursor =
      paginatedItems.length === limit
        ? paginatedItems[paginatedItems.length - 1].timestamp
        : null;

    res.status(200).json({
      status: "success",
      data: {
        items: paginatedItems,
        count: paginatedItems.length,
        nextCursor,
        hasMore: Boolean(nextCursor),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quick summary statistics for Master Admin Activity dashboard
 * GET /api/v1/admin/activities/stats
 */
export const getActivityStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFilter = { createdAt: { $gte: today } };

    const [invoicesToday, waFilesToday, enquiriesToday, totalAdmins] = await Promise.all([
      AccountingInvoice.countDocuments(todayFilter),
      WhatsAppMessage.countDocuments({
        ...todayFilter,
        type: { $in: ["image", "document", "audio", "video"] },
      }),
      Enquiry.countDocuments(todayFilter),
      AdminUser.countDocuments(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        invoicesToday,
        waFilesToday,
        enquiriesToday,
        totalAdmins,
      },
    });
  } catch (error) {
    next(error);
  }
};

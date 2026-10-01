import type { Request, Response, NextFunction } from "express";
import { InvoiceSequence } from "../models/invoiceSequence.model.js";
import { AccountingPersonnel, type PersonnelType } from "../models/accountingPersonnel.model.js";
import { AccountingBank } from "../models/accountingBank.model.js";
import { AccountingInvoice } from "../models/invoice.model.js";

/**
 * Format a number as zero-padded string (e.g. 0 -> "0000", 1 -> "0001")
 */
const formatSequenceNumber = (num: number, padding = 4): string => {
  return String(num).padStart(padding, "0");
};

/**
 * Get current Invoice Number sequence counter from MongoDB
 */
export const getInvoiceSequence = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let seq = await InvoiceSequence.findOne({ key: "invoice_number" });
    if (!seq) {
      seq = await InvoiceSequence.create({
        key: "invoice_number",
        count: 0,
        padding: 4,
        lastInvoiceNo: "0000",
      });
    }

    const currentFormatted = formatSequenceNumber(seq.count, seq.padding);
    // If count is 0, recent is "0000" and next is "0000" (start sequence)
    // If count > 0, next is count, and recent is count - 1
    const nextInvoiceNo = currentFormatted;
    const recentInvoiceNo =
      seq.lastInvoiceNo || (seq.count > 0 ? formatSequenceNumber(seq.count - 1, seq.padding) : "0000");

    res.status(200).json({
      status: "success",
      data: {
        count: seq.count,
        nextInvoiceNo,
        recentInvoiceNo,
        padding: seq.padding,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atomically increment Invoice Number sequence counter in MongoDB
 */
export const incrementInvoiceSequence = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const seq = await InvoiceSequence.findOneAndUpdate(
      { key: "invoice_number" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    const newFormatted = formatSequenceNumber(seq.count, seq.padding);
    const recentFormatted = formatSequenceNumber(Math.max(0, seq.count - 1), seq.padding);

    seq.lastInvoiceNo = recentFormatted;
    await seq.save();

    res.status(200).json({
      status: "success",
      data: {
        count: seq.count,
        nextInvoiceNo: newFormatted,
        recentInvoiceNo: recentFormatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset / Set Invoice sequence count in MongoDB
 */
export const resetInvoiceSequence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { count = 0 } = req.body;
    const num = Number(count) || 0;

    const seq = await InvoiceSequence.findOneAndUpdate(
      { key: "invoice_number" },
      { count: num, lastInvoiceNo: formatSequenceNumber(Math.max(0, num - 1)) },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        count: seq.count,
        nextInvoiceNo: formatSequenceNumber(seq.count, seq.padding),
        recentInvoiceNo: seq.lastInvoiceNo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Personnel (Salesmen, Referrers, Divisions) from MongoDB
 */
export const getPersonnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    if (req.query.type && typeof req.query.type === "string") {
      filter.type = req.query.type;
    }

    if (req.query.search && typeof req.query.search === "string") {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ name: regex }, { phone: regex }, { code: regex }];
    }

    const items = await AccountingPersonnel.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name identifier role");

    res.status(200).json({
      status: "success",
      count: items.length,
      data: {
        personnel: items.map((p) => ({
          id: p._id.toString(),
          _id: p._id.toString(),
          type: p.type,
          name: p.name,
          phone: p.phone || "",
          code: p.code || "",
          status: p.status,
          createdBy: p.createdBy || null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Personnel (Salesman, Referrer, or Division) directly in MongoDB
 */
export const createPersonnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, name, phone = "", code = "" } = req.body;

    if (!type || !["salesman", "referrer", "division", "supplier"].includes(type)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid type. Must be 'salesman', 'referrer', 'division', or 'supplier'.",
      });
      return;
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Name is required.",
      });
      return;
    }

    const item = await AccountingPersonnel.create({
      type: type as PersonnelType,
      name: name.trim(),
      phone: String(phone).trim(),
      code: String(code).trim(),
      status: "active",
    });

    res.status(201).json({
      status: "success",
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully in MongoDB.`,
      data: {
        item: {
          id: item._id.toString(),
          _id: item._id.toString(),
          type: item.type,
          name: item.name,
          phone: item.phone,
          code: item.code,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Personnel by ID from MongoDB
 */
export const deletePersonnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await AccountingPersonnel.findByIdAndDelete(id);

    if (!item) {
      res.status(404).json({
        status: "fail",
        message: "Personnel record not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Personnel record deleted successfully from MongoDB.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Banks from MongoDB
 */
export const getBanks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = { status: "active" };

    if (req.query.search && typeof req.query.search === "string") {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { bankName: regex },
        { accountName: regex },
        { accountNumber: regex },
        { iban: regex },
      ];
    }

    const banks = await AccountingBank.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name identifier role");

    res.status(200).json({
      status: "success",
      count: banks.length,
      data: {
        banks: banks.map((b) => ({
          id: b._id.toString(),
          _id: b._id.toString(),
          bankName: b.bankName,
          accountName: b.accountName || "",
          accountNumber: b.accountNumber || "",
          iban: b.iban || "",
          swiftCode: b.swiftCode || "",
          currency: b.currency || "AED",
          openingBalance: b.openingBalance || 0,
          status: b.status,
          createdBy: b.createdBy || null,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Bank in MongoDB
 */
export const createBank = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      bankName,
      accountName = "",
      accountNumber = "",
      iban = "",
      swiftCode = "",
      currency = "AED",
      openingBalance = 0,
    } = req.body;

    if (!bankName || typeof bankName !== "string" || !bankName.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Bank name is required.",
      });
      return;
    }

    const bank = await AccountingBank.create({
      bankName: bankName.trim(),
      accountName: String(accountName).trim(),
      accountNumber: String(accountNumber).trim(),
      iban: String(iban).trim(),
      swiftCode: String(swiftCode).trim(),
      currency: String(currency).trim() || "AED",
      openingBalance: Number(openingBalance) || 0,
      status: "active",
    });

    res.status(201).json({
      status: "success",
      message: "Bank created successfully in MongoDB.",
      data: {
        bank: {
          id: bank._id.toString(),
          _id: bank._id.toString(),
          bankName: bank.bankName,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          iban: bank.iban,
          swiftCode: bank.swiftCode,
          currency: bank.currency,
          openingBalance: bank.openingBalance,
          status: bank.status,
          createdAt: bank.createdAt,
          updatedAt: bank.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Bank by ID from MongoDB
 */
export const deleteBank = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const bank = await AccountingBank.findByIdAndDelete(id);

    if (!bank) {
      res.status(404).json({
        status: "fail",
        message: "Bank record not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Bank record deleted successfully from MongoDB.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Invoice in MongoDB and advance sequence counter
 */
export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      invoiceNo: requestedInvoiceNo,
      invoiceDate = new Date().toISOString().split("T")[0],
      invoiceTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      lpoNo = "",
      salesMan = "",
      salesManId = null,
      referredBy = "",
      division = "",
      customer,
      lineItems = [],
      paymentDetails = {},
      financialSummary = {},
      bank = "",
      bankC = "",
      supplier = "",
      supplierC = "",
      govtFeePaidByCustomer = false,
      govtFeeAmount = "",
      notes = "",
    } = req.body;

    if (!customer || !customer.name || !customer.name.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Customer name is required to generate an invoice.",
      });
      return;
    }

    // Determine invoice number
    let finalInvoiceNo = requestedInvoiceNo ? String(requestedInvoiceNo).trim() : "";
    let seq = await InvoiceSequence.findOne({ key: "invoice_number" });
    if (!seq) {
      seq = await InvoiceSequence.create({
        key: "invoice_number",
        count: 0,
        padding: 4,
        lastInvoiceNo: "0000",
      });
    }

    if (!finalInvoiceNo) {
      finalInvoiceNo = formatSequenceNumber(seq.count, seq.padding);
    }

    // Check if an invoice with this number already exists
    const existing = await AccountingInvoice.findOne({ invoiceNo: finalInvoiceNo });
    if (existing) {
      seq.count += 1;
      finalInvoiceNo = formatSequenceNumber(seq.count, seq.padding);
    }

    // Compute status
    const paidVal = Number(financialSummary.paid || 0);
    const balanceVal = Number(financialSummary.balance || 0);
    let status: "paid" | "partial" | "unpaid" = "unpaid";
    if (balanceVal <= 0 && paidVal > 0) {
      status = "paid";
    } else if (paidVal > 0) {
      status = "partial";
    }

    const newInvoice = await AccountingInvoice.create({
      invoiceNo: finalInvoiceNo,
      invoiceDate,
      invoiceTime,
      lpoNo: String(lpoNo).trim(),
      salesMan: String(salesMan).trim(),
      salesManId,
      referredBy: String(referredBy).trim(),
      division: String(division).trim(),
      customer: {
        name: customer.name.trim(),
        mobile: customer.mobile ? String(customer.mobile).trim() : "",
        code: customer.code ? String(customer.code).trim() : "",
        address: customer.address ? String(customer.address).trim() : "",
        email: customer.email ? String(customer.email).trim() : "",
        company: customer.company ? String(customer.company).trim() : "",
        customerType: customer.customerType || "registered",
        clientId: customer.clientId || null,
      },
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      paymentDetails,
      financialSummary,
      bank: String(bank).trim(),
      bankC: String(bankC).trim(),
      supplier: String(supplier).trim(),
      supplierC: String(supplierC).trim(),
      govtFeePaidByCustomer: Boolean(govtFeePaidByCustomer),
      govtFeeAmount: String(govtFeeAmount || ""),
      status,
      notes: String(notes || ""),
    });

    // Advance sequence counter atomically in DB
    const nextCount = Math.max(seq.count + 1, (Number(finalInvoiceNo) || 0) + 1);
    seq.count = nextCount;
    seq.lastInvoiceNo = finalInvoiceNo;
    await seq.save();

    res.status(201).json({
      status: "success",
      message: `Invoice #${finalInvoiceNo} created and saved successfully in MongoDB.`,
      data: {
        invoice: newInvoice,
        nextInvoiceNo: formatSequenceNumber(seq.count, seq.padding),
        recentInvoiceNo: finalInvoiceNo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Invoices from MongoDB with multi-field search and filters
 */
export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    // Customer / Client filters
    if (req.query.clientIdentifier && typeof req.query.clientIdentifier === "string") {
      filter["customer.code"] = req.query.clientIdentifier;
    } else if (req.query.clientPhone && typeof req.query.clientPhone === "string") {
      filter["customer.mobile"] = req.query.clientPhone;
    } else if (req.query.clientId && typeof req.query.clientId === "string") {
      filter["customer.clientId"] = req.query.clientId;
    }

    if (req.query.customerName && typeof req.query.customerName === "string") {
      filter["customer.name"] = new RegExp(req.query.customerName.trim(), "i");
    }

    // Employee / Worker Admin filter
    if (req.query.employee && typeof req.query.employee === "string") {
      const empRegex = new RegExp(req.query.employee.trim(), "i");
      filter["lineItems.employee"] = empRegex;
    }

    // Salesman filter
    if (req.query.salesman && typeof req.query.salesman === "string") {
      filter.salesMan = new RegExp(req.query.salesman.trim(), "i");
    }

    // Status filter
    if (req.query.status && typeof req.query.status === "string" && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Global Search across Invoice #, Customer Name, Mobile, Code
    if (req.query.search && typeof req.query.search === "string") {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { invoiceNo: regex },
        { "customer.name": regex },
        { "customer.mobile": regex },
        { "customer.code": regex },
        { salesMan: regex },
        { "lineItems.description": regex },
      ];
    }

    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const invoices = await AccountingInvoice.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      status: "success",
      count: invoices.length,
      data: {
        invoices: invoices.map((inv) => ({
          id: inv._id.toString(),
          _id: inv._id.toString(),
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          invoiceTime: inv.invoiceTime,
          lpoNo: inv.lpoNo || "",
          salesMan: inv.salesMan || "",
          referredBy: inv.referredBy || "",
          division: inv.division || "",
          customer: inv.customer,
          lineItems: inv.lineItems || [],
          paymentDetails: inv.paymentDetails || {},
          financialSummary: inv.financialSummary || {},
          bank: inv.bank || "",
          bankC: inv.bankC || "",
          supplier: inv.supplier || "",
          supplierC: inv.supplierC || "",
          govtFeePaidByCustomer: inv.govtFeePaidByCustomer,
          govtFeeAmount: inv.govtFeeAmount || "",
          status: inv.status,
          notes: inv.notes || "",
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Invoice by ID
 */
export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await AccountingInvoice.findById(id);

    if (!invoice) {
      res.status(404).json({
        status: "fail",
        message: "Invoice not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        invoice: {
          ...invoice.toObject(),
          id: invoice._id.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Invoice by ID
 */
export const deleteInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await AccountingInvoice.findByIdAndDelete(id);

    if (!invoice) {
      res.status(404).json({
        status: "fail",
        message: "Invoice record not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: `Invoice #${invoice.invoiceNo} deleted successfully from MongoDB.`,
    });
  } catch (error) {
    next(error);
  }
};


import type { Request, Response, NextFunction } from "express";
import { InvoiceSequence } from "../models/invoiceSequence.model.js";
import { AccountingPersonnel, type PersonnelType } from "../models/accountingPersonnel.model.js";
import { AccountingBank } from "../models/accountingBank.model.js";
import { AccountingInvoice } from "../models/invoice.model.js";
import { AccountingIncome } from "../models/accountingIncome.model.js";
import { AccountingExpense } from "../models/accountingExpense.model.js";
import { AccountingBankTransaction } from "../models/accountingBankTransaction.model.js";
import { AccountingCashAccount } from "../models/accountingCashAccount.model.js";
import { AccountingCashTransaction } from "../models/accountingCashTransaction.model.js";

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
          email: p.email || "",
          address: p.address || "",
          category: p.category || "",
          notes: p.notes || "",
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
 * Create Personnel (Salesman, Referrer, Division, or Supplier) directly in MongoDB
 */
export const createPersonnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      type,
      name,
      phone = "",
      code = "",
      email = "",
      address = "",
      category = "",
      notes = "",
    } = req.body;

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
      email: String(email).trim(),
      address: String(address).trim(),
      category: String(category).trim(),
      notes: String(notes).trim(),
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
          email: item.email,
          address: item.address,
          category: item.category,
          notes: item.notes,
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
 * Update Personnel by ID in MongoDB
 */
export const updatePersonnel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, code, email, address, category, notes, status } = req.body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (code !== undefined) updateData.code = String(code).trim();
    if (email !== undefined) updateData.email = String(email).trim();
    if (address !== undefined) updateData.address = String(address).trim();
    if (category !== undefined) updateData.category = String(category).trim();
    if (notes !== undefined) updateData.notes = String(notes).trim();
    if (status !== undefined) updateData.status = status;

    const item = await AccountingPersonnel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      res.status(404).json({
        status: "fail",
        message: "Personnel record not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        item: {
          id: item._id.toString(),
          _id: item._id.toString(),
          type: item.type,
          name: item.name,
          phone: item.phone,
          code: item.code,
          email: item.email,
          address: item.address,
          category: item.category,
          notes: item.notes,
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

/**
 * ============================================================================
 * INCOMES CONTROLLERS (MongoDB: accounting-incomes)
 * ============================================================================
 */
export const getIncomes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    if (req.query.type && typeof req.query.type === "string" && req.query.type !== "all") {
      filter.type = req.query.type;
    }

    if (req.query.payMode && typeof req.query.payMode === "string" && req.query.payMode !== "all") {
      filter.payMode = req.query.payMode;
    }

    if (req.query.search && typeof req.query.search === "string") {
      const q = req.query.search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [{ incomeId: regex }, { type: regex }, { description: regex }, { division: regex }];
    }

    const items = await AccountingIncome.find(filter).sort({ incomeDate: -1, createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: items.length,
      data: {
        incomes: items.map((inc) => ({
          id: inc._id.toString(),
          _id: inc._id.toString(),
          incomeId: inc.incomeId,
          incomeDate: inc.incomeDate,
          type: inc.type,
          description: inc.description,
          amount: inc.amount,
          payMode: inc.payMode,
          bank: inc.bank,
          division: inc.division,
          status: inc.status,
          createdAt: inc.createdAt,
          updatedAt: inc.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createIncome = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      incomeId,
      incomeDate,
      type,
      description = "",
      amount,
      payMode = "cash",
      bank = "",
      division = "",
    } = req.body;

    if (!type || !String(type).trim()) {
      res.status(400).json({ status: "fail", message: "Income type is required." });
      return;
    }

    const numAmount = Number(amount) || 0;
    const finalId = incomeId?.trim() || `IN/${Math.floor(10 + Math.random() * 900)}`;

    const newIncome = await AccountingIncome.create({
      incomeId: finalId,
      incomeDate: incomeDate ? new Date(incomeDate) : new Date(),
      type: String(type).trim(),
      description: String(description).trim(),
      amount: numAmount,
      payMode: payMode === "bank" ? "bank" : "cash",
      bank: String(bank).trim(),
      division: String(division).trim(),
      status: "received",
    });

    res.status(201).json({
      status: "success",
      message: `Income #${newIncome.incomeId} recorded successfully in MongoDB.`,
      data: { income: newIncome },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIncome = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await AccountingIncome.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ status: "fail", message: "Income record not found." });
      return;
    }

    res.status(200).json({
      status: "success",
      message: `Income #${deleted.incomeId} deleted successfully from MongoDB.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================================
 * EXPENSES CONTROLLERS (MongoDB: accounting-expenses)
 * ============================================================================
 */
export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    if (req.query.type && typeof req.query.type === "string" && req.query.type !== "all") {
      filter.type = req.query.type;
    }

    if (req.query.status && typeof req.query.status === "string" && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    if (req.query.search && typeof req.query.search === "string") {
      const q = req.query.search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { expenseId: regex },
        { supplierName: regex },
        { type: regex },
        { subType: regex },
        { description: regex },
      ];
    }

    const items = await AccountingExpense.find(filter).sort({ expenseDate: -1, createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: items.length,
      data: {
        expenses: items.map((exp) => ({
          id: exp._id.toString(),
          _id: exp._id.toString(),
          expenseId: exp.expenseId,
          expenseDate: exp.expenseDate,
          supplierName: exp.supplierName,
          type: exp.type,
          subType: exp.subType,
          description: exp.description,
          amount: exp.amount,
          payMode: exp.payMode,
          bank: exp.bank,
          status: exp.status,
          division: exp.division,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      expenseId,
      expenseDate,
      supplierName = "",
      type,
      subType = "",
      description = "",
      amount,
      payMode = "cash",
      bank = "",
      status = "Paid",
      division = "",
    } = req.body;

    if (!type || !String(type).trim()) {
      res.status(400).json({ status: "fail", message: "Expense type is required." });
      return;
    }

    const numAmount = Number(amount) || 0;
    const finalId = expenseId?.trim() || `EX/${Math.floor(100 + Math.random() * 900)}`;

    const newExpense = await AccountingExpense.create({
      expenseId: finalId,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      supplierName: String(supplierName).trim(),
      type: String(type).trim(),
      subType: String(subType).trim(),
      description: String(description).trim(),
      amount: numAmount,
      payMode: payMode === "bank" ? "bank" : "cash",
      bank: String(bank).trim(),
      status: status === "Unpaid" ? "Unpaid" : status === "Partial" ? "Partial" : "Paid",
      division: String(division).trim(),
    });

    res.status(201).json({
      status: "success",
      message: `Expense #${newExpense.expenseId} recorded successfully in MongoDB.`,
      data: { expense: newExpense },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await AccountingExpense.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ status: "fail", message: "Expense record not found." });
      return;
    }

    res.status(200).json({
      status: "success",
      message: `Expense #${deleted.expenseId} deleted successfully from MongoDB.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================================
 * BANK TRANSACTIONS CONTROLLERS (MongoDB: accounting-bank-transactions)
 * ============================================================================
 */

export const createBankTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      txType,
      txDate,
      bankName,
      toBank = "",
      amount,
      paymentType = "Cash",
      description = "",
    } = req.body;

    if (!txType || !["Deposit", "Withdrawel", "Bank To Bank"].includes(txType)) {
      res.status(400).json({
        status: "fail",
        message: "Valid txType is required (Deposit, Withdrawel, Bank To Bank).",
      });
      return;
    }

    if (!bankName || !String(bankName).trim() || bankName === "-Select One-") {
      res.status(400).json({ status: "fail", message: "Bank Name is required." });
      return;
    }

    if (txType === "Bank To Bank" && (!toBank || !String(toBank).trim() || toBank === "-Select One-")) {
      res.status(400).json({
        status: "fail",
        message: "Destination bank (toBank) is required for Bank To Bank transfers.",
      });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ status: "fail", message: "Amount must be greater than 0." });
      return;
    }

    const newTx = await AccountingBankTransaction.create({
      txType,
      txDate: txDate ? new Date(txDate) : new Date(),
      bankName: String(bankName).trim(),
      toBank: String(toBank).trim(),
      amount: numAmount,
      paymentType: paymentType === "Cheque" ? "Cheque" : "Cash",
      description: String(description).trim(),
      createdBy: (req as any).user?._id || (req as any).user?.id || null,
    });

    res.status(201).json({
      status: "success",
      message: `Bank Transaction (${txType}) of ${numAmount} recorded successfully in MongoDB.`,
      data: { transaction: newTx },
    });
  } catch (error) {
    next(error);
  }
};

export const getBankTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bankName } = req.query;

    if (!bankName || typeof bankName !== "string" || !bankName.trim()) {
      const directTxs = await AccountingBankTransaction.find().sort({ txDate: -1, createdAt: -1 });
      res.status(200).json({
        status: "success",
        count: directTxs.length,
        data: { transactions: directTxs },
      });
      return;
    }

    const targetBank = bankName.trim();
    const regex = new RegExp(`^${targetBank.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    // 1. Get bank record to find opening balance
    const bankDoc = await AccountingBank.findOne({ bankName: regex });
    const openingBalance = Number(bankDoc?.openingBalance || 0);

    // 2. Direct bank transactions
    const directTxs = await AccountingBankTransaction.find({
      $or: [{ bankName: regex }, { toBank: regex }],
    });

    // 3. Incomes
    const incomes = await AccountingIncome.find({ bank: regex });

    // 4. Expenses
    const expenses = await AccountingExpense.find({ bank: regex });

    // 5. Invoices
    const invoices = await AccountingInvoice.find({
      $or: [{ bank: regex }, { bankC: regex }],
    });

    interface UnifiedTx {
      id: string;
      date: Date;
      type: string;
      category: "income" | "expense" | "transfer" | "deposit" | "withdrawal" | "invoice";
      reference: string;
      description: string;
      paymentType: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }

    const allItems: UnifiedTx[] = [];

    // Map Direct Transactions
    for (const dt of directTxs) {
      const isSource = dt.bankName.toLowerCase() === targetBank.toLowerCase();
      const isDest = dt.toBank && dt.toBank.toLowerCase() === targetBank.toLowerCase();

      if (dt.txType === "Deposit") {
        allItems.push({
          id: dt._id.toString(),
          date: dt.txDate || dt.createdAt,
          type: "Bank Deposit",
          category: "deposit",
          reference: "DEP-" + dt._id.toString().slice(-4).toUpperCase(),
          description: dt.description || "Cash/Cheque Deposit",
          paymentType: dt.paymentType || "Cash",
          debit: 0,
          credit: dt.amount,
          runningBalance: 0,
        });
      } else if (dt.txType === "Withdrawel") {
        allItems.push({
          id: dt._id.toString(),
          date: dt.txDate || dt.createdAt,
          type: "Bank Withdrawal",
          category: "withdrawal",
          reference: "WTH-" + dt._id.toString().slice(-4).toUpperCase(),
          description: dt.description || "Bank Withdrawal",
          paymentType: dt.paymentType || "Cash",
          debit: dt.amount,
          credit: 0,
          runningBalance: 0,
        });
      } else if (dt.txType === "Bank To Bank") {
        if (isSource) {
          allItems.push({
            id: dt._id.toString() + "-out",
            date: dt.txDate || dt.createdAt,
            type: "Transfer Out",
            category: "transfer",
            reference: "TRF-" + dt._id.toString().slice(-4).toUpperCase(),
            description: `Transfer to ${dt.toBank}${dt.description ? ` (${dt.description})` : ""}`,
            paymentType: dt.paymentType || "Cash",
            debit: dt.amount,
            credit: 0,
            runningBalance: 0,
          });
        }
        if (isDest) {
          allItems.push({
            id: dt._id.toString() + "-in",
            date: dt.txDate || dt.createdAt,
            type: "Transfer In",
            category: "transfer",
            reference: "TRF-" + dt._id.toString().slice(-4).toUpperCase(),
            description: `Transfer from ${dt.bankName}${dt.description ? ` (${dt.description})` : ""}`,
            paymentType: dt.paymentType || "Cash",
            debit: 0,
            credit: dt.amount,
            runningBalance: 0,
          });
        }
      }
    }

    // Map Incomes
    for (const inc of incomes) {
      allItems.push({
        id: inc._id.toString(),
        date: inc.incomeDate || inc.createdAt,
        type: `Income (${inc.type})`,
        category: "income",
        reference: inc.incomeId,
        description: inc.description || inc.type,
        paymentType: inc.payMode,
        debit: 0,
        credit: inc.amount,
        runningBalance: 0,
      });
    }

    // Map Expenses
    for (const exp of expenses) {
      allItems.push({
        id: exp._id.toString(),
        date: exp.expenseDate || exp.createdAt,
        type: `Expense (${exp.type})`,
        category: "expense",
        reference: exp.expenseId,
        description: exp.supplierName
          ? `${exp.supplierName} - ${exp.description || exp.type}`
          : exp.description || exp.type,
        paymentType: exp.payMode,
        debit: exp.amount,
        credit: 0,
        runningBalance: 0,
      });
    }

    // Map Invoices (paid invoices)
    for (const inv of invoices) {
      const isBankMatch = inv.bank && inv.bank.toLowerCase() === targetBank.toLowerCase();
      const isBankCMatch = inv.bankC && inv.bankC.toLowerCase() === targetBank.toLowerCase();
      if (isBankMatch || isBankCMatch) {
        const amt = Number(inv.financialSummary?.paid || inv.financialSummary?.grossAmount || inv.financialSummary?.total || 0);
        if (amt > 0) {
          allItems.push({
            id: inv._id.toString(),
            date: inv.invoiceDate ? new Date(inv.invoiceDate) : inv.createdAt,
            type: "Customer Invoice",
            category: "invoice",
            reference: inv.invoiceNo ? `#${inv.invoiceNo}` : "INV",
            description: inv.customer?.name ? `Invoice Payment - ${inv.customer.name}` : "Invoice Payment",
            paymentType: "Bank",
            debit: 0,
            credit: amt,
            runningBalance: 0,
          });
        }
      }
    }

    // Sort chronologically ascending to compute accurate running balance
    allItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = openingBalance;
    let totalCredit = 0;
    let totalDebit = 0;

    for (const item of allItems) {
      running = running + item.credit - item.debit;
      item.runningBalance = running;
      totalCredit += item.credit;
      totalDebit += item.debit;
    }

    // Reverse to show newest transactions first
    const transactionsDesc = [...allItems].reverse();

    res.status(200).json({
      status: "success",
      count: transactionsDesc.length,
      data: {
        bank: {
          bankName: bankDoc?.bankName || targetBank,
          accountName: bankDoc?.accountName || "",
          accountNumber: bankDoc?.accountNumber || "",
          iban: bankDoc?.iban || "",
          swiftCode: bankDoc?.swiftCode || "",
          currency: bankDoc?.currency || "AED",
          openingBalance,
          totalCredit,
          totalDebit,
          currentBalance: running,
        },
        transactions: transactionsDesc,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================================
 * CASH ACCOUNTS & CASH TRANSACTIONS CONTROLLERS (MongoDB)
 * ============================================================================
 */

/**
 * Get Cash Accounts (Registers / Drawers) from MongoDB
 * Auto-initializes "Main Cash" if no cash accounts exist yet.
 */
export const getCashAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = { status: "active" };

    if (req.query.search && typeof req.query.search === "string") {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ accountName: regex }, { description: regex }];
    }

    let accounts = await AccountingCashAccount.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name identifier role");

    // Auto-seed default "Main Cash" register if no accounts exist
    if (accounts.length === 0 && !req.query.search) {
      const defaultAccount = await AccountingCashAccount.create({
        accountName: "Main Cash",
        description: "Primary cash in hand & office drawer",
        currency: "AED",
        openingBalance: 0,
        status: "active",
      });
      accounts = [defaultAccount];
    }

    res.status(200).json({
      status: "success",
      count: accounts.length,
      data: {
        cashAccounts: accounts.map((a) => ({
          id: a._id.toString(),
          _id: a._id.toString(),
          accountName: a.accountName,
          description: a.description || "",
          currency: a.currency || "AED",
          openingBalance: a.openingBalance || 0,
          status: a.status,
          createdBy: a.createdBy || null,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Cash Account in MongoDB
 */
export const createCashAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      accountName,
      description = "",
      currency = "AED",
      openingBalance = 0,
    } = req.body;

    if (!accountName || typeof accountName !== "string" || !accountName.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Account name is required (e.g. Counter Cash, Petty Cash).",
      });
      return;
    }

    const existing = await AccountingCashAccount.findOne({
      accountName: new RegExp(`^${accountName.trim()}$`, "i"),
    });
    if (existing) {
      res.status(400).json({
        status: "fail",
        message: `Cash account '${accountName.trim()}' already exists.`,
      });
      return;
    }

    const cashAccount = await AccountingCashAccount.create({
      accountName: accountName.trim(),
      description: String(description).trim(),
      currency: String(currency).trim() || "AED",
      openingBalance: Number(openingBalance) || 0,
      status: "active",
      createdBy: (req as any).user?._id || (req as any).user?.id || null,
    });

    res.status(201).json({
      status: "success",
      message: "Cash account created successfully in MongoDB.",
      data: {
        cashAccount: {
          id: cashAccount._id.toString(),
          _id: cashAccount._id.toString(),
          accountName: cashAccount.accountName,
          description: cashAccount.description,
          currency: cashAccount.currency,
          openingBalance: cashAccount.openingBalance,
          status: cashAccount.status,
          createdAt: cashAccount.createdAt,
          updatedAt: cashAccount.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Cash Account from MongoDB
 */
export const deleteCashAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const account = await AccountingCashAccount.findByIdAndDelete(id);

    if (!account) {
      res.status(404).json({
        status: "fail",
        message: "Cash account record not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Cash account deleted successfully from MongoDB.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a Direct Cash Transaction in MongoDB
 */
export const createCashTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      txType,
      txDate,
      accountName = "Main Cash",
      amount,
      customerOrParty = "",
      category = "General",
      reference = "",
      description = "",
      toBank = "",
    } = req.body;

    if (!txType || !["Cash In", "Cash Out", "Deposit to Bank", "Withdrawal from Bank"].includes(txType)) {
      res.status(400).json({
        status: "fail",
        message: "Valid txType is required (Cash In, Cash Out, Deposit to Bank, Withdrawal from Bank).",
      });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ status: "fail", message: "Amount must be greater than 0." });
      return;
    }

    let finalReference = String(reference || "").trim();
    if (!finalReference) {
      const allDirect = await AccountingCashTransaction.find({}, { reference: 1 });
      let maxNum = 0;
      allDirect.forEach((item) => {
        const match = String(item.reference || "").match(/(\d+)/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxNum) maxNum = val;
        }
      });
      finalReference = `REC-${String(maxNum + 1).padStart(4, "0")}`;
    }

    const newTx = await AccountingCashTransaction.create({
      txType,
      txDate: txDate ? new Date(txDate) : new Date(),
      accountName: String(accountName).trim() || "Main Cash",
      amount: numAmount,
      customerOrParty: String(customerOrParty).trim(),
      category: String(category).trim() || "General",
      reference: finalReference,
      description: String(description).trim(),
      toBank: String(toBank).trim(),
      createdBy: (req as any).user?._id || (req as any).user?.id || null,
    });

    res.status(201).json({
      status: "success",
      message: `Cash Transaction (${txType}) of ${numAmount} recorded successfully in MongoDB.`,
      data: { transaction: newTx },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Cash Transactions Ledger from MongoDB
 * Unifies:
 * 1. Direct cash transactions (AccountingCashTransaction)
 * 2. Incomes received in cash (AccountingIncome payMode: cash)
 * 3. Expenses paid in cash (AccountingExpense payMode: cash)
 * 4. Paid Invoices paid in cash (AccountingInvoice)
 * 5. Bank cash deposits & withdrawals (AccountingBankTransaction)
 */
export const getCashTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountName } = req.query;
    const targetAccount = (typeof accountName === "string" && accountName.trim()) ? accountName.trim() : "Main Cash";
    const regex = new RegExp(`^${targetAccount.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

    // 1. Get cash account opening balance
    const accountDoc = await AccountingCashAccount.findOne({ accountName: regex });
    const openingBalance = Number(accountDoc?.openingBalance || 0);

    // 2. Direct Physical Cash Transactions (Isolated - only real paper cash entries)
    const directTxs = await AccountingCashTransaction.find({
      $or: [{ accountName: regex }, { accountName: { $exists: false } }],
    });

    interface UnifiedCashTx {
      id: string;
      date: Date;
      type: string;
      category: string;
      reference: string;
      description: string;
      customerOrParty?: string;
      debit: number;   // Outflow (-)
      credit: number;  // Inflow (+)
      runningBalance: number;
    }

    const allItems: UnifiedCashTx[] = [];

    // Map Direct Physical Cash Transactions only
    for (const dt of directTxs) {
      if (dt.txType === "Cash In") {
        allItems.push({
          id: dt._id.toString(),
          date: dt.txDate || dt.createdAt,
          type: "Cash In",
          category: dt.category || "Cash In",
          reference: dt.reference || "REC-" + dt._id.toString().slice(-4).toUpperCase(),
          description: dt.description || "Cash Received",
          customerOrParty: dt.customerOrParty || "",
          debit: 0,
          credit: dt.amount,
          runningBalance: 0,
        });
      } else if (dt.txType === "Cash Out") {
        allItems.push({
          id: dt._id.toString(),
          date: dt.txDate || dt.createdAt,
          type: "Cash Out",
          category: dt.category || "Cash Out",
          reference: dt.reference || "REC-" + dt._id.toString().slice(-4).toUpperCase(),
          description: dt.description || "Cash Paid Out",
          customerOrParty: dt.customerOrParty || "",
          debit: dt.amount,
          credit: 0,
          runningBalance: 0,
        });
      } else if (dt.txType === "Deposit to Bank") {
        allItems.push({
          id: dt._id.toString(),
          date: dt.txDate || dt.createdAt,
          type: "Deposit to Bank",
          category: dt.category || "transfer",
          reference: dt.reference || "BNK-DEP-" + dt._id.toString().slice(-4).toUpperCase(),
          description: `Cash deposited to ${dt.toBank || "Bank"}${dt.description ? ` (${dt.description})` : ""}`,
          customerOrParty: dt.toBank || "",
          debit: dt.amount, // cash leaving cash drawer
          credit: 0,
          runningBalance: 0,
        });
      } else if (dt.txType === "Withdrawal from Bank") {
        allItems.push({
          id: dt._id.toString(),
          date: dt.txDate || dt.createdAt,
          type: "Bank Withdrawal (To Cash)",
          category: dt.category || "transfer",
          reference: dt.reference || "BNK-WTH-" + dt._id.toString().slice(-4).toUpperCase(),
          description: `Cash withdrawn from bank into drawer${dt.description ? ` (${dt.description})` : ""}`,
          customerOrParty: dt.toBank || "",
          debit: 0,
          credit: dt.amount, // cash entering cash drawer
          runningBalance: 0,
        });
      }
    }

    // Sort chronologically ascending
    allItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = openingBalance;
    let totalCredit = 0;
    let totalDebit = 0;

    for (const item of allItems) {
      running = running + item.credit - item.debit;
      item.runningBalance = running;
      totalCredit += item.credit;
      totalDebit += item.debit;
    }

    // Reverse to show newest transactions first
    const transactionsDesc = [...allItems].reverse();

    // Calculate next sequential receipt number
    let maxReceiptNum = 0;
    directTxs.forEach((dt) => {
      const match = String(dt.reference || "").match(/(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxReceiptNum) maxReceiptNum = val;
      }
    });
    const nextReceiptNo = `REC-${String(maxReceiptNum + 1).padStart(4, "0")}`;
    const recentReceiptNo = maxReceiptNum > 0 ? `REC-${String(maxReceiptNum).padStart(4, "0")}` : "None";

    res.status(200).json({
      status: "success",
      count: transactionsDesc.length,
      data: {
        account: {
          accountName: accountDoc?.accountName || targetAccount,
          description: accountDoc?.description || "",
          currency: accountDoc?.currency || "AED",
          openingBalance,
          totalCredit,
          totalDebit,
          currentBalance: running,
        },
        nextReceiptNo,
        recentReceiptNo,
        transactions: transactionsDesc,
      },
    });
  } catch (error) {
    next(error);
  }
};

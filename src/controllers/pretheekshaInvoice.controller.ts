import type { Request, Response, NextFunction } from "express";
import { PretheekshaInvoice } from "../models/pretheekshaInvoice.model.js";
import { PretheekshaSequence } from "../models/pretheekshaSequence.model.js";
import { AccountingInvoice } from "../models/invoice.model.js";

/**
 * Format a number as zero-padded string (e.g. 1 -> "0001")
 */
const formatSequenceNumber = (num: number, padding = 4): string => {
  return String(num).padStart(padding, "0");
};

/**
 * Format full clinic invoice number string: INV-YYYY-NNNN
 */
const formatClinicInvoiceNo = (seq: number, year = new Date().getFullYear()): string => {
  const safeSeq = Math.max(1, Number(seq) || 1);
  return `INV-${year}-${formatSequenceNumber(safeSeq, 4)}`;
};

/**
 * Helper to compute publicTotal and dbTotal from line items
 */
const computeInvoiceTotals = (lineItems: any[] = []) => {
  let calcPub = 0;
  let calcDb = 0;
  lineItems.forEach((it: any) => {
    const q = Number(it.qty) || 1;
    const billedP = Number(it.unitPrice) || 0;
    const mrpP = Number(it.mrp) || billedP;
    const gst = Number(it.gstRate) || 0;
    calcPub += (q * billedP) * (1 + gst / 100);
    calcDb += (q * mrpP) * (1 + gst / 100);
  });
  return {
    publicTotal: calcPub.toFixed(2),
    dbTotal: calcDb.toFixed(2),
  };
};

/**
 * GET Next Clinic Invoice Sequence Number
 */
export const getNextClinicInvoiceSequence = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let seq = await PretheekshaSequence.findOne({ key: "clinic_invoice_seq" });
    if (!seq) {
      seq = await PretheekshaSequence.create({
        key: "clinic_invoice_seq",
        count: 0,
        padding: 4,
        lastInvoiceNo: "0000",
      });
    }

    const currentYear = new Date().getFullYear();
    const nextCount = seq.count + 1;
    const nextFormatted = formatClinicInvoiceNo(nextCount, currentYear);
    const recentFormatted = seq.count > 0 ? formatClinicInvoiceNo(seq.count, currentYear) : "None";

    res.status(200).json({
      status: "success",
      data: {
        count: seq.count,
        nextInvoiceNo: nextFormatted,
        recentInvoiceNo: recentFormatted,
        padding: seq.padding,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST Atomically increment Clinic Invoice Sequence counter
 */
export const incrementClinicInvoiceSequence = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const seq = await PretheekshaSequence.findOneAndUpdate(
      { key: "clinic_invoice_seq" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    const currentYear = new Date().getFullYear();
    const currentFormatted = formatClinicInvoiceNo(seq.count, currentYear);
    const recentFormatted =
      seq.count > 1 ? formatClinicInvoiceNo(seq.count - 1, currentYear) : "None";

    seq.lastInvoiceNo = currentFormatted;
    await seq.save();

    res.status(200).json({
      status: "success",
      data: {
        count: seq.count,
        nextInvoiceNo: currentFormatted,
        recentInvoiceNo: recentFormatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST Reset / Set Clinic Invoice Sequence count
 */
export const resetClinicInvoiceSequence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { count = 0 } = req.body;
    const num = Math.max(0, parseInt(count, 10) || 0);

    const seq = await PretheekshaSequence.findOneAndUpdate(
      { key: "clinic_invoice_seq" },
      { count: num, lastInvoiceNo: formatClinicInvoiceNo(num) },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: "success",
      message: `Clinic invoice sequence reset to ${num}.`,
      data: {
        count: seq.count,
        nextInvoiceNo: formatClinicInvoiceNo(seq.count + 1),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET Clinic Invoices from MongoDB with search and filters
 */
export const getClinicInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    // Patient filter
    if (req.query.patientId && typeof req.query.patientId === "string") {
      filter["patient.patientId"] = req.query.patientId;
    }
    if (req.query.patientName && typeof req.query.patientName === "string") {
      filter["patient.name"] = new RegExp(req.query.patientName.trim(), "i");
    }

    // Status filter
    if (req.query.status && typeof req.query.status === "string" && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Global Search across Invoice #, Patient Name, Mobile, Code
    if (req.query.search && typeof req.query.search === "string") {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { invoiceNo: regex },
        { "patient.name": regex },
        { "patient.mobile": regex },
        { "patient.code": regex },
        { "customer.name": regex },
        { "customer.mobile": regex },
        { "customer.code": regex },
        { "lineItems.description": regex },
      ];
    }

    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const invoices = await PretheekshaInvoice.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      status: "success",
      count: invoices.length,
      data: {
        invoices: invoices.map((inv) => {
          const fs = inv.financialSummary || {};
          let pub = Number(fs.publicTotal || fs.grossAmount || fs.total || 0);
          let db = Number(fs.dbTotal || 0);
          if (db <= 0) {
            const totals = computeInvoiceTotals(inv.lineItems || []);
            db = Number(totals.dbTotal) || pub;
          }

          const patientData = inv.patient || { name: "" };
          const customerData = inv.customer?.name ? inv.customer : patientData;

          return {
            id: inv._id.toString(),
            _id: inv._id.toString(),
            invoiceNo: inv.invoiceNo,
            invoiceDate: inv.invoiceDate,
            invoiceTime: inv.invoiceTime || "",
            patient: patientData,
            customer: customerData,
            lineItems: inv.lineItems || [],
            paymentDetails: inv.paymentDetails || {},
            financialSummary: {
              ...fs,
              publicTotal: String(pub.toFixed(2)),
              dbTotal: String(db.toFixed(2)),
            },
            status: inv.status,
            notes: inv.notes || "",
            createdAt: inv.createdAt,
            updatedAt: inv.updatedAt,
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET Clinic Invoice by ID
 */
export const getClinicInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await PretheekshaInvoice.findById(id);

    if (!invoice) {
      res.status(404).json({
        status: "fail",
        message: "Clinic invoice not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        invoice: {
          ...invoice.toObject(),
          id: invoice._id.toString(),
          customer: invoice.customer || invoice.patient,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST Create Clinic Invoice in dedicated invoices-preth collection
 */
export const createClinicInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      invoiceNo: requestedInvoiceNo,
      invoiceDate = new Date().toISOString().split("T")[0],
      invoiceTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      customer,
      patient,
      lineItems = [],
      paymentDetails = {},
      financialSummary = {},
      notes = "",
      status = "paid",
    } = req.body;

    const patientInfo = patient || customer;
    if (!patientInfo || !patientInfo.name || !patientInfo.name.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Patient name is required to generate a clinic invoice.",
      });
      return;
    }

    // Determine invoice number
    let finalInvoiceNo = requestedInvoiceNo ? String(requestedInvoiceNo).trim() : "";
    let seq = await PretheekshaSequence.findOne({ key: "clinic_invoice_seq" });
    if (!seq) {
      seq = await PretheekshaSequence.create({
        key: "clinic_invoice_seq",
        count: 0,
        padding: 4,
        lastInvoiceNo: "0000",
      });
    }

    const currentYear = new Date().getFullYear();
    if (!finalInvoiceNo) {
      finalInvoiceNo = formatClinicInvoiceNo(seq.count + 1, currentYear);
    }

    // Check if an invoice with this number already exists
    const existing = await PretheekshaInvoice.findOne({ invoiceNo: finalInvoiceNo });
    if (existing) {
      seq.count += 1;
      finalInvoiceNo = formatClinicInvoiceNo(seq.count + 1, currentYear);
    }

    // Compute Public and DB Totals
    const totals = computeInvoiceTotals(Array.isArray(lineItems) ? lineItems : []);
    const finSummary = {
      ...financialSummary,
      publicTotal: financialSummary.publicTotal || totals.publicTotal,
      dbTotal: financialSummary.dbTotal || totals.dbTotal,
    };

    const newInvoice = await PretheekshaInvoice.create({
      invoiceNo: finalInvoiceNo,
      invoiceDate,
      invoiceTime,
      patient: {
        patientId: patientInfo.patientId || patientInfo.clientId || null,
        code: patientInfo.code ? String(patientInfo.code).trim() : "",
        name: patientInfo.name.trim(),
        mobile: patientInfo.mobile ? String(patientInfo.mobile).trim() : "",
        email: patientInfo.email ? String(patientInfo.email).trim() : "",
        address: patientInfo.address ? String(patientInfo.address).trim() : "",
      },
      customer: {
        code: patientInfo.code ? String(patientInfo.code).trim() : "",
        name: patientInfo.name.trim(),
        mobile: patientInfo.mobile ? String(patientInfo.mobile).trim() : "",
        email: patientInfo.email ? String(patientInfo.email).trim() : "",
        address: patientInfo.address ? String(patientInfo.address).trim() : "",
      },
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      paymentDetails,
      financialSummary: finSummary,
      notes: String(notes || ""),
      status: status || "paid",
    });

    // Advance sequence counter atomically in sequence-preth
    const seqNumMatch = finalInvoiceNo.match(/\d+$/);
    const numericPart = seqNumMatch ? parseInt(seqNumMatch[0], 10) : 0;
    const nextCount = Math.max(seq.count + 1, numericPart);
    seq.count = nextCount;
    seq.lastInvoiceNo = finalInvoiceNo;
    await seq.save();

    res.status(201).json({
      status: "success",
      message: `Clinic Invoice #${finalInvoiceNo} created successfully in MongoDB.`,
      data: {
        invoice: newInvoice,
        nextInvoiceNo: formatClinicInvoiceNo(seq.count + 1, currentYear),
        recentInvoiceNo: finalInvoiceNo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT Update existing clinic invoice
 */
export const updateClinicInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      invoiceNo,
      invoiceDate,
      invoiceTime,
      customer,
      patient,
      lineItems = [],
      paymentDetails = {},
      financialSummary = {},
      notes = "",
      status = "paid",
    } = req.body;

    const invoice = await PretheekshaInvoice.findById(id);
    if (!invoice) {
      res.status(404).json({
        status: "fail",
        message: "Clinic invoice not found.",
      });
      return;
    }

    const patientInfo = patient || customer;
    if (patientInfo) {
      invoice.patient = {
        ...invoice.patient,
        name: patientInfo.name || invoice.patient.name,
        mobile: patientInfo.mobile !== undefined ? String(patientInfo.mobile).trim() : invoice.patient.mobile,
        email: patientInfo.email !== undefined ? String(patientInfo.email).trim() : invoice.patient.email,
        address: patientInfo.address !== undefined ? String(patientInfo.address).trim() : invoice.patient.address,
        code: patientInfo.code !== undefined ? String(patientInfo.code).trim() : invoice.patient.code,
      };
      invoice.customer = {
        name: invoice.patient.name,
        mobile: invoice.patient.mobile,
        email: invoice.patient.email,
        address: invoice.patient.address,
        code: invoice.patient.code,
      };
    }

    if (invoiceNo) invoice.invoiceNo = invoiceNo;
    if (invoiceDate) invoice.invoiceDate = invoiceDate;
    if (invoiceTime) invoice.invoiceTime = invoiceTime;
    if (notes !== undefined) invoice.notes = notes;
    if (status) invoice.status = status;

    if (Array.isArray(lineItems)) {
      invoice.lineItems = lineItems as any;
    }

    // Recompute totals
    const totals = computeInvoiceTotals(invoice.lineItems || []);
    invoice.financialSummary = {
      ...invoice.financialSummary,
      ...financialSummary,
      publicTotal: financialSummary.publicTotal || totals.publicTotal,
      dbTotal: financialSummary.dbTotal || totals.dbTotal,
    };

    if (paymentDetails) {
      invoice.paymentDetails = {
        ...invoice.paymentDetails,
        ...paymentDetails,
      };
    }

    await invoice.save();

    res.status(200).json({
      status: "success",
      message: `Clinic Invoice #${invoice.invoiceNo} updated successfully in MongoDB.`,
      data: {
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE Clinic invoice by ID
 */
export const deleteClinicInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await PretheekshaInvoice.findByIdAndDelete(id);

    if (!invoice) {
      res.status(404).json({
        status: "fail",
        message: "Clinic invoice record not found.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Clinic invoice deleted successfully from MongoDB.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST One-time migration: isolate clinic invoices from accounting-invoices into invoices-preth
 */
export const migrateClinicInvoicesFromAccounting = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Clinic invoices have INV- pattern or fertility/clinic related identifiers
    const query = {
      $or: [
        { invoiceNo: { $regex: /^INV-/i } },
        { "lineItems.hsnCode": { $exists: true, $ne: "" } },
        { "financialSummary.publicTotal": { $exists: true, $ne: "" } },
        { "financialSummary.dbTotal": { $exists: true, $ne: "" } },
      ],
    };

    const contaminatedInvoices = await AccountingInvoice.find(query);
    let migratedCount = 0;
    let maxSequence = 0;

    for (const oldInv of contaminatedInvoices) {
      // Upsert into PretheekshaInvoice
      const patientData = {
        name: oldInv.customer?.name || "Patient",
        mobile: oldInv.customer?.mobile || "",
        code: oldInv.customer?.code || "",
        email: oldInv.customer?.email || "",
        address: oldInv.customer?.address || "",
        patientId: oldInv.customer?.clientId || undefined,
      };

      const lineItemsMapped = (oldInv.lineItems || []).map((li: any) => ({
        slNo: li.slNo,
        description: li.description,
        hsnCode: li.hsnCode || li.packageCode || "",
        qty: li.qty || 1,
        unitPrice: li.unitPrice || 0,
        mrp: li.mrp || li.unitPrice || 0,
        costPrice: li.costPrice || 0,
        gstRate: li.gstRate || 0,
        gstAmount: ((li.qty || 1) * (li.unitPrice || 0) * (li.gstRate || 0)) / 100,
        totalAmount: li.totalAmount || (li.qty || 1) * (li.unitPrice || 0),
      }));

      const totals = computeInvoiceTotals(lineItemsMapped);

      await PretheekshaInvoice.findOneAndUpdate(
        { invoiceNo: oldInv.invoiceNo },
        {
          invoiceNo: oldInv.invoiceNo,
          invoiceDate: oldInv.invoiceDate,
          invoiceTime: oldInv.invoiceTime || "",
          patient: patientData,
          customer: {
            name: patientData.name,
            mobile: patientData.mobile,
            code: patientData.code,
            email: patientData.email,
            address: patientData.address,
          },
          lineItems: lineItemsMapped,
          financialSummary: {
            subtotal: oldInv.financialSummary?.totalBeforeVat || oldInv.financialSummary?.grossAmount || "0",
            vat: oldInv.financialSummary?.vat || "0",
            grossAmount: oldInv.financialSummary?.grossAmount || "0",
            total: oldInv.financialSummary?.total || "0",
            paid: oldInv.financialSummary?.paid || "0",
            balance: oldInv.financialSummary?.balance || "0",
            publicTotal: oldInv.financialSummary?.publicTotal || totals.publicTotal,
            dbTotal: oldInv.financialSummary?.dbTotal || totals.dbTotal,
          },
          paymentDetails: {
            payMethod: oldInv.paymentDetails?.payMethod || "Cash",
            payDescription: oldInv.paymentDetails?.payDescription || "",
          },
          notes: oldInv.notes || "",
          status: oldInv.status === "draft" ? "unpaid" : oldInv.status,
          createdAt: oldInv.createdAt,
          updatedAt: oldInv.updatedAt,
        },
        { upsert: true, new: true }
      );

      // Track max sequence
      const match = oldInv.invoiceNo.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxSequence) maxSequence = num;
      }

      // Remove from AccountingInvoice so accounting-invoices is 100% clean
      await AccountingInvoice.findByIdAndDelete(oldInv._id);
      migratedCount++;
    }

    // Ensure PretheekshaSequence is updated to at least maxSequence
    if (maxSequence > 0) {
      await PretheekshaSequence.findOneAndUpdate(
        { key: "clinic_invoice_seq" },
        {
          $max: { count: maxSequence },
          lastInvoiceNo: formatClinicInvoiceNo(maxSequence),
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      status: "success",
      message: `Successfully migrated ${migratedCount} clinic invoices to invoices-preth and purged them from accounting-invoices.`,
      migratedCount,
      clinicSequenceCount: maxSequence,
    });
  } catch (error) {
    next(error);
  }
};

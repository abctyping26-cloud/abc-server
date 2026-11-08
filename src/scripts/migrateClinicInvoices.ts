import dotenv from "dotenv";
dotenv.config();

import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { AccountingInvoice } from "../models/invoice.model.js";
import { PretheekshaInvoice } from "../models/pretheekshaInvoice.model.js";
import { PretheekshaSequence } from "../models/pretheekshaSequence.model.js";

const runMigration = async () => {
  console.log("🚀 Starting Clinic Invoices Isolation Migration...");
  await connectDatabase();

  try {
    const query = {
      $or: [
        { invoiceNo: { $regex: /^INV-/i } },
        { "lineItems.hsnCode": { $exists: true, $ne: "" } },
        { "financialSummary.publicTotal": { $exists: true, $ne: "" } },
        { "financialSummary.dbTotal": { $exists: true, $ne: "" } },
      ],
    };

    const contaminatedInvoices = await AccountingInvoice.find(query);
    console.log(`Found ${contaminatedInvoices.length} clinic invoices in 'accounting-invoices'.`);

    let migrated = 0;
    let maxSeq = 0;

    for (const oldInv of contaminatedInvoices) {
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

      await PretheekshaInvoice.findOneAndUpdate(
        { invoiceNo: oldInv.invoiceNo },
        {
          invoiceNo: oldInv.invoiceNo,
          invoiceDate: oldInv.invoiceDate,
          invoiceTime: oldInv.invoiceTime || "",
          patient: patientData,
          customer: patientData,
          lineItems: lineItemsMapped,
          financialSummary: oldInv.financialSummary,
          paymentDetails: oldInv.paymentDetails,
          notes: oldInv.notes || "",
          status: oldInv.status === "draft" ? "unpaid" : oldInv.status,
          createdAt: oldInv.createdAt,
          updatedAt: oldInv.updatedAt,
        },
        { upsert: true, new: true }
      );

      const match = oldInv.invoiceNo.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxSeq) maxSeq = num;
      }

      // Delete from accounting-invoices
      await AccountingInvoice.findByIdAndDelete(oldInv._id);
      migrated++;
    }

    if (maxSeq > 0) {
      await PretheekshaSequence.findOneAndUpdate(
        { key: "clinic_invoice_seq" },
        {
          $max: { count: maxSeq },
          lastInvoiceNo: `INV-${new Date().getFullYear()}-${String(maxSeq).padStart(4, "0")}`,
        },
        { upsert: true }
      );
    }

    console.log(`✅ Successfully migrated ${migrated} invoices to 'invoices-preth' and purged them from 'accounting-invoices'.`);
    console.log(`Sequence counter in 'sequence-preth' set to at least ${maxSeq}.`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

runMigration();

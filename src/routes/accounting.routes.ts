import { Router } from "express";
import {
  getInvoiceSequence,
  incrementInvoiceSequence,
  resetInvoiceSequence,
  getPersonnel,
  createPersonnel,
  deletePersonnel,
  getBanks,
  createBank,
  deleteBank,
  createInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
  getIncomes,
  createIncome,
  deleteIncome,
  getExpenses,
  createExpense,
  deleteExpense,
} from "../controllers/accounting.controller.js";

const router = Router();

// Invoice Management
router.get("/invoices", getInvoices);
router.post("/invoices", createInvoice);
router.get("/invoices/:id", getInvoiceById);
router.delete("/invoices/:id", deleteInvoice);

// Invoice Sequence Counter
router.get("/invoice-sequence", getInvoiceSequence);
router.post("/invoice-sequence/increment", incrementInvoiceSequence);
router.post("/invoice-sequence/reset", resetInvoiceSequence);

// Personnel Management (Salesmen, Referrers, Divisions, Suppliers)
router.get("/personnel", getPersonnel);
router.post("/personnel", createPersonnel);
router.delete("/personnel/:id", deletePersonnel);

// Bank Accounts Management
router.get("/banks", getBanks);
router.post("/banks", createBank);
router.delete("/banks/:id", deleteBank);

// Income Management (MongoDB: accounting-incomes)
router.get("/incomes", getIncomes);
router.post("/incomes", createIncome);
router.delete("/incomes/:id", deleteIncome);

// Expense Management (MongoDB: accounting-expenses)
router.get("/expenses", getExpenses);
router.post("/expenses", createExpense);
router.delete("/expenses/:id", deleteExpense);

export default router;

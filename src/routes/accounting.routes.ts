import { Router } from "express";
import {
  getInvoiceSequence,
  incrementInvoiceSequence,
  resetInvoiceSequence,
  getPersonnel,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  getBanks,
  createBank,
  deleteBank,
  getBankTransactions,
  createBankTransaction,
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
  getCashAccounts,
  createCashAccount,
  deleteCashAccount,
  getCashTransactions,
  createCashTransaction,
} from "../controllers/accounting.controller.js";
import {
  authenticateAdmin,
  requireDeletePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Invoice Management
router.get("/invoices", getInvoices);
router.post("/invoices", createInvoice);
router.get("/invoices/:id", getInvoiceById);
router.delete("/invoices/:id", authenticateAdmin, requireDeletePermission, deleteInvoice);

// Invoice Sequence Counter
router.get("/invoice-sequence", getInvoiceSequence);
router.post("/invoice-sequence/increment", incrementInvoiceSequence);
router.post("/invoice-sequence/reset", resetInvoiceSequence);

// Personnel Management (Salesmen, Referrers, Divisions, Suppliers)
router.get("/personnel", getPersonnel);
router.post("/personnel", createPersonnel);
router.patch("/personnel/:id", updatePersonnel);
router.put("/personnel/:id", updatePersonnel);
router.delete("/personnel/:id", authenticateAdmin, requireDeletePermission, deletePersonnel);

// Bank Accounts Management
router.get("/banks", getBanks);
router.post("/banks", createBank);
router.delete("/banks/:id", authenticateAdmin, requireDeletePermission, deleteBank);
router.get("/bank-transactions", getBankTransactions);
router.post("/bank-transactions", createBankTransaction);

// Cash Accounts & Cash Transactions Management
router.get("/cash-accounts", getCashAccounts);
router.post("/cash-accounts", createCashAccount);
router.delete("/cash-accounts/:id", authenticateAdmin, requireDeletePermission, deleteCashAccount);
router.get("/cash-transactions", getCashTransactions);
router.post("/cash-transactions", createCashTransaction);

// Income Management (MongoDB: accounting-incomes)
router.get("/incomes", getIncomes);
router.post("/incomes", createIncome);
router.delete("/incomes/:id", authenticateAdmin, requireDeletePermission, deleteIncome);

// Expense Management (MongoDB: accounting-expenses)
router.get("/expenses", getExpenses);
router.post("/expenses", createExpense);
router.delete("/expenses/:id", authenticateAdmin, requireDeletePermission, deleteExpense);

export default router;

import { Router } from "express";
import {
  getClinicInvoices,
  getClinicInvoiceById,
  createClinicInvoice,
  updateClinicInvoice,
  deleteClinicInvoice,
  getNextClinicInvoiceSequence,
  incrementClinicInvoiceSequence,
  resetClinicInvoiceSequence,
  migrateClinicInvoicesFromAccounting,
} from "../controllers/pretheekshaInvoice.controller.js";

const router = Router();

router.get("/next-number", getNextClinicInvoiceSequence);
router.post("/next-number/increment", incrementClinicInvoiceSequence);
router.post("/next-number/reset", resetClinicInvoiceSequence);
router.post("/migrate-from-accounting", migrateClinicInvoicesFromAccounting);

router.get("/", getClinicInvoices);
router.post("/", createClinicInvoice);
router.get("/:id", getClinicInvoiceById);
router.put("/:id", updateClinicInvoice);
router.delete("/:id", deleteClinicInvoice);

export default router;

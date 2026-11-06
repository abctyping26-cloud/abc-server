import { Router } from "express";
import {
  getHsnCodes,
  upsertHsnCode,
  getCachedInventory,
  saveOrPromoteClinicItem,
  recordItemUsage,
  deleteClinicItem,
} from "../controllers/clinicInventory.controller.js";

const router = Router();

// HSN Master Codes
router.get("/hsn-codes", getHsnCodes);
router.post("/hsn-codes", upsertHsnCode);

// Tier 1 Clinic Inventory Cache
router.get("/cached", getCachedInventory);
router.post("/promote", saveOrPromoteClinicItem);
router.patch("/items/:id/usage", recordItemUsage);
router.delete("/items/:id", deleteClinicItem);

export default router;

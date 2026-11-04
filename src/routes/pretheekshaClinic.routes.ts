import { Router } from "express";
import {
  registerPatientOrCouple,
  getPatients,
  getPatientById,
} from "../controllers/pretheekshaUser.controller.js";

const router = Router();

// Registration endpoint (supports Idempotency-Key)
router.post("/register", registerPatientOrCouple);

// Patient listing & search
router.get("/", getPatients);

// Patient details by ID or code
router.get("/:id", getPatientById);

export default router;

import { Router } from "express";
import {
  registerPatientOrCouple,
  getPatients,
  getPatientById,
  updatePatientClinicalInfo,
  linkPatientsAsCouple,
  deletePatient,
} from "../controllers/pretheekshaUser.controller.js";

const router = Router();

// Registration endpoint (supports Idempotency-Key and linkToPatientId)
router.post("/register", registerPatientOrCouple);

// Link two existing patients into an active couple
router.post("/link-partner", linkPatientsAsCouple);

// Patient listing & search
router.get("/", getPatients);

// Patient details by ID or code
router.get("/:id", getPatientById);

// Update patient clinical profile (blood group, protocol, allergies, medical history)
router.patch("/:id", updatePatientClinicalInfo);

// Delete patient record
router.delete("/:id", deletePatient);

export default router;

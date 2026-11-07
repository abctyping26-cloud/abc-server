import { Router } from "express";
import {
  getSignatures,
  createSignature,
  setDefaultSignature,
  deleteSignature,
} from "../controllers/clinicSignature.controller.js";

const router = Router();

router.get("/", getSignatures);
router.post("/", createSignature);
router.patch("/:id/default", setDefaultSignature);
router.delete("/:id", deleteSignature);

export default router;

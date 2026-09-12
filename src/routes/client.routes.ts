import { Router } from "express";
import { getClientStatus } from "../controllers/client.controller.js";
import { loginCommercial } from "../controllers/auth.controller.js";
import { createEnquiry } from "../controllers/enquiry.controller.js";

const router = Router();

router.get("/ping", getClientStatus);
router.post("/auth/login", loginCommercial);

// Public client enquiry routes
router.post("/enquiry", createEnquiry);
router.post("/enquiries", createEnquiry);

export default router;


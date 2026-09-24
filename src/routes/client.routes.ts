import { Router } from "express";
import { getClientStatus } from "../controllers/client.controller.js";
import { loginCommercial } from "../controllers/auth.controller.js";
import { createEnquiry } from "../controllers/enquiry.controller.js";
import {
  getServices,
  getServiceBySlug,
} from "../controllers/service.controller.js";

const router = Router();

router.get("/ping", getClientStatus);
router.post("/auth/login", loginCommercial);

// Public client enquiry routes
router.post("/enquiry", createEnquiry);
router.post("/enquiries", createEnquiry);

// Public services routes
router.get("/services", getServices);
router.get("/services/:slug", getServiceBySlug);

export default router;



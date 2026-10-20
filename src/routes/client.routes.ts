import { Router } from "express";
import {
  getClientStatus,
  getClientDashboard,
} from "../controllers/client.controller.js";
import {
  loginCommercial,
  checkClientPhone,
} from "../controllers/auth.controller.js";
import { createEnquiry } from "../controllers/enquiry.controller.js";
import {
  getServices,
  getServiceBySlug,
} from "../controllers/service.controller.js";
import { getTopMarqueeConfig } from "../controllers/websiteContent.controller.js";
import { authenticateClient } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/ping", getClientStatus);
router.post("/auth/login", loginCommercial);
router.post("/auth/check-phone", checkClientPhone);

// Protected client dashboard & tracking
router.get("/dashboard", authenticateClient, getClientDashboard);

// Public client enquiry routes
router.post("/enquiry", createEnquiry);
router.post("/enquiries", createEnquiry);

// Public services routes
router.get("/services", getServices);
router.get("/services/:slug", getServiceBySlug);

// Public website content routes
router.get("/website-content/top-marquee", getTopMarqueeConfig);

export default router;

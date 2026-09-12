import { Router } from "express";
import { getAdminStatus } from "../controllers/admin.controller.js";
import { loginAdmin } from "../controllers/auth.controller.js";
import {
  getEnquiries,
  markEnquiryResponded,
  deleteEnquiry,
} from "../controllers/enquiry.controller.js";

const router = Router();

router.get("/ping", getAdminStatus);
router.post("/auth/login", loginAdmin);

// Admin enquiry management routes
router.get("/enquiries", getEnquiries);
router.patch("/enquiries/:id/respond", markEnquiryResponded);
router.delete("/enquiries/:id", deleteEnquiry);

export default router;


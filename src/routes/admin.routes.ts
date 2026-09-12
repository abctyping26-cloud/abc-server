import { Router } from "express";
import {
  getAdminStatus,
  getWorkerAdmins,
  createWorkerAdmin,
  updateWorkerAdminProfile,
  deleteWorkerAdmin,
} from "../controllers/admin.controller.js";
import { loginAdmin } from "../controllers/auth.controller.js";
import {
  getEnquiries,
  markEnquiryResponded,
  deleteEnquiry,
  replyToEnquiry,
} from "../controllers/enquiry.controller.js";

const router = Router();

router.get("/ping", getAdminStatus);
router.post("/auth/login", loginAdmin);

// Worker admin management routes (Direct MongoDB 'user-admin' collection)
router.get("/workers", getWorkerAdmins);
router.post("/workers", createWorkerAdmin);
router.patch("/workers/:id/profile", updateWorkerAdminProfile);
router.delete("/workers/:id", deleteWorkerAdmin);

// Admin enquiry management routes
router.get("/enquiries", getEnquiries);
router.patch("/enquiries/:id/respond", markEnquiryResponded);
router.post("/enquiries/:id/reply", replyToEnquiry);
router.delete("/enquiries/:id", deleteEnquiry);

export default router;


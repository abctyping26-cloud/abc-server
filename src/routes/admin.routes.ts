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
  claimEnquiry,
  unclaimEnquiry,
} from "../controllers/enquiry.controller.js";
import { getCloudUsageAnalytics } from "../controllers/analytics.controller.js";
import {
  getServices,
  getServiceBySlug,
  updateService,
  resetService,
} from "../controllers/service.controller.js";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/ping", getAdminStatus);
router.post("/auth/login", loginAdmin);

// Cloud infrastructure and plan analytics (Cloudinary, MongoDB, Render)
router.get("/analytics/cloud-usage", authenticateAdmin, getCloudUsageAnalytics);

// Services and Required Documentation management routes
router.get("/services", authenticateAdmin, getServices);
router.get("/services/:slug", authenticateAdmin, getServiceBySlug);
router.put("/services/:slug", authenticateAdmin, updateService);
router.post("/services/:slug/reset", authenticateAdmin, resetService);

// Worker admin management routes (Direct MongoDB 'user-admin' collection)
router.get("/workers", getWorkerAdmins);
router.post("/workers", createWorkerAdmin);
router.patch("/workers/:id/profile", updateWorkerAdminProfile);
router.delete("/workers/:id", deleteWorkerAdmin);

// Admin enquiry management routes
router.get("/enquiries", getEnquiries);
router.patch("/enquiries/:id/claim", claimEnquiry);
router.patch("/enquiries/:id/unclaim", unclaimEnquiry);
router.patch("/enquiries/:id/respond", markEnquiryResponded);
router.post("/enquiries/:id/reply", replyToEnquiry);
router.delete("/enquiries/:id", deleteEnquiry);

export default router;



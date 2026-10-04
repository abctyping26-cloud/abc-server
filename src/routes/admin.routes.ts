import { Router } from "express";
import {
  getAdminStatus,
  getWorkerAdmins,
  createWorkerAdmin,
  updateWorkerAdminProfile,
  updateWorkerAdminPermissions,
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
import {
  getCloudUsageAnalytics,
  getWebTrafficAnalytics,
} from "../controllers/analytics.controller.js";
import {
  getServices,
  getServiceBySlug,
  createService,
  updateService,
  resetService,
} from "../controllers/service.controller.js";
import {
  getTopMarqueeConfig,
  updateTopMarqueeConfig,
  resetTopMarqueeConfig,
} from "../controllers/websiteContent.controller.js";
import {
  authenticateAdmin,
  requireDeletePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/ping", getAdminStatus);
router.post("/auth/login", loginAdmin);

// Cloud infrastructure and plan analytics (Cloudinary, MongoDB, Render)
router.get("/analytics/cloud-usage", authenticateAdmin, getCloudUsageAnalytics);

// Website visitor & traffic analytics (Google Analytics 4 API)
router.get("/analytics/web-traffic", authenticateAdmin, getWebTrafficAnalytics);

// Services and Required Documentation management routes
router.get("/services", authenticateAdmin, getServices);
router.post("/services", authenticateAdmin, createService);
router.get("/services/:slug", authenticateAdmin, getServiceBySlug);
router.put("/services/:slug", authenticateAdmin, updateService);
router.post("/services/:slug/reset", authenticateAdmin, resetService);

// Website Content / Top Marquee management routes
router.get("/website-content/top-marquee", authenticateAdmin, getTopMarqueeConfig);
router.put("/website-content/top-marquee", authenticateAdmin, updateTopMarqueeConfig);
router.post("/website-content/top-marquee/reset", authenticateAdmin, resetTopMarqueeConfig);

// Worker admin management routes (Direct MongoDB 'user-admin' collection)
router.get("/workers", getWorkerAdmins);
router.post("/workers", createWorkerAdmin);
router.patch("/workers/:id/profile", updateWorkerAdminProfile);
router.patch("/workers/:id/permissions", authenticateAdmin, updateWorkerAdminPermissions);
router.delete("/workers/:id", authenticateAdmin, deleteWorkerAdmin);

// Admin enquiry management routes
router.get("/enquiries", getEnquiries);
router.patch("/enquiries/:id/claim", claimEnquiry);
router.patch("/enquiries/:id/unclaim", unclaimEnquiry);
router.patch("/enquiries/:id/respond", markEnquiryResponded);
router.post("/enquiries/:id/reply", replyToEnquiry);
router.delete("/enquiries/:id", authenticateAdmin, requireDeletePermission, deleteEnquiry);

export default router;



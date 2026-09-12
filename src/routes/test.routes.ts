import { Router } from "express";
import {
  sendEnquiryTest,
  sendReplyTest,
} from "../controllers/test.controller.js";

const router = Router();

// Endpoint for commercial test page to simulate customer enquiry
router.post("/send-enquiry", sendEnquiryTest);

// Endpoint for admin test page to simulate worker/admin reply
router.post("/send-reply", sendReplyTest);

export default router;

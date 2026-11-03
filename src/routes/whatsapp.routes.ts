import { Router } from "express";
import {
  verifyWebhook,
  handleIncomingWebhook,
  getConversations,
  getMessagesByCustomer,
  sendReply,
  handleSubscribeWaba,
  deleteConversation,
  getQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  sendTestWhatsAppEmail,
} from "../controllers/whatsapp.controller.js";

import {
  authenticateAdmin,
  requireDeletePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Meta Webhook verification handshake (GET)
router.get("/webhook", verifyWebhook);

// Meta Webhook event receiver for real-time messages & statuses (POST)
router.post("/webhook", handleIncomingWebhook);

// Web Dashboard Endpoints for /test-whatsapp & Admin Dashboard
router.get("/conversations", getConversations);
router.delete("/conversations/:customerPhone", authenticateAdmin, requireDeletePermission, deleteConversation);
router.get("/messages/:customerPhone", getMessagesByCustomer);
router.post("/reply", sendReply);
router.post("/subscribe-waba", handleSubscribeWaba);

// Quick Replies Endpoints
router.get("/quick-replies", getQuickReplies);
router.post("/quick-replies", createQuickReply);
router.put("/quick-replies/:id", updateQuickReply);
router.delete("/quick-replies/:id", authenticateAdmin, requireDeletePermission, deleteQuickReply);

// WhatsApp Notification Settings Endpoints
router.get("/config", getWhatsAppConfig);
router.put("/config", updateWhatsAppConfig);
router.post("/config/test-email", sendTestWhatsAppEmail);

export default router;

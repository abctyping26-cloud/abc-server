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
} from "../controllers/whatsapp.controller.js";

const router = Router();

// Meta Webhook verification handshake (GET)
router.get("/webhook", verifyWebhook);

// Meta Webhook event receiver for real-time messages & statuses (POST)
router.post("/webhook", handleIncomingWebhook);

// Web Dashboard Endpoints for /test-whatsapp & Admin Dashboard
router.get("/conversations", getConversations);
router.delete("/conversations/:customerPhone", deleteConversation);
router.get("/messages/:customerPhone", getMessagesByCustomer);
router.post("/reply", sendReply);
router.post("/subscribe-waba", handleSubscribeWaba);

// Quick Replies Endpoints
router.get("/quick-replies", getQuickReplies);
router.post("/quick-replies", createQuickReply);
router.put("/quick-replies/:id", updateQuickReply);
router.delete("/quick-replies/:id", deleteQuickReply);

export default router;

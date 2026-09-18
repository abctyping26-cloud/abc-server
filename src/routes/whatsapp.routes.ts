import { Router } from "express";
import {
  verifyWebhook,
  handleIncomingWebhook,
  getConversations,
  getMessagesByCustomer,
  sendReply,
  handleSubscribeWaba,
} from "../controllers/whatsapp.controller.js";

const router = Router();

// Meta Webhook verification handshake (GET)
router.get("/webhook", verifyWebhook);

// Meta Webhook event receiver for real-time messages & statuses (POST)
router.post("/webhook", handleIncomingWebhook);

// Web Dashboard Endpoints for /test-whatsapp
router.get("/conversations", getConversations);
router.get("/messages/:customerPhone", getMessagesByCustomer);
router.post("/reply", sendReply);
router.post("/subscribe-waba", handleSubscribeWaba);

export default router;

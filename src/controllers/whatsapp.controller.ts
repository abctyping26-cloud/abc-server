import type { Request, Response } from "express";
import { config } from "../config/index.js";
import {
  WhatsAppMessage,
  type IWhatsAppMessage,
} from "../models/whatsappMessage.model.js";
import {
  processIncomingWebhook,
  sendWhatsAppReply,
} from "../services/whatsapp.service.js";

/**
 * Handle Meta Webhook Verification Challenge (GET)
 */
export const verifyWebhook = (req: Request, res: Response): void => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsappVerifyToken) {
    console.log("✅ Meta WhatsApp Webhook verified successfully!");
    res.status(200).send(challenge);
    return;
  }

  console.warn("⚠️ Webhook verification failed. Token mismatch or invalid mode.");
  res.status(403).json({ error: "Verification token mismatch" });
};

/**
 * Handle Meta Incoming Webhook Events (POST)
 */
export const handleIncomingWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Respond to Meta immediately to prevent retry spam
  res.status(200).json({ status: "EVENT_RECEIVED" });

  try {
    await processIncomingWebhook(req.body);
  } catch (error) {
    console.error("❌ Error processing incoming WhatsApp webhook:", error);
  }
};

/**
 * Get all active customer conversations grouped by phone number
 */
export const getConversations = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    // Group messages by customerPhone to get latest activity
    const conversations = await WhatsAppMessage.aggregate([
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$customerPhone",
          customerPhone: { $first: "$customerPhone" },
          customerName: { $first: "$customerName" },
          lastMessage: { $first: "$text" },
          lastMessageType: { $first: "$type" },
          lastDirection: { $first: "$direction" },
          lastTimestamp: { $first: "$timestamp" },
          totalMessages: { $sum: 1 },
          lastStatus: { $first: "$status" },
        },
      },
      {
        $sort: { lastTimestamp: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error("❌ Error fetching WhatsApp conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve WhatsApp conversations",
      error: error?.message,
    });
  }
};

/**
 * Get full message history for a specific customer phone
 */
export const getMessagesByCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customerPhoneParam = req.params.customerPhone;
    const customerPhone = Array.isArray(customerPhoneParam)
      ? customerPhoneParam[0]
      : customerPhoneParam || "";
    const cleanPhone = customerPhone.replace(/\D/g, "");

    const messages = await WhatsAppMessage.find({
      customerPhone: { $in: [customerPhone, cleanPhone] },
    })
      .sort({ timestamp: 1 })
      .lean();

    // Check if 24-hour window is currently active (based on last incoming message)
    const lastIncoming = messages
      .filter((m) => m.direction === "incoming")
      .slice(-1)[0];

    const isWindowOpen = lastIncoming
      ? Date.now() - new Date(lastIncoming.timestamp).getTime() <
        24 * 60 * 60 * 1000
      : false;

    res.status(200).json({
      success: true,
      data: {
        customerPhone: cleanPhone,
        customerName: messages.find((m) => m.customerName)?.customerName || "",
        isWindowOpen,
        lastIncomingTime: lastIncoming ? lastIncoming.timestamp : null,
        messages,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching WhatsApp messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation messages",
      error: error?.message,
    });
  }
};

/**
 * Send an outbound reply from website to customer's WhatsApp
 */
export const sendReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { customerPhone, text } = req.body;

    if (!customerPhone || !text || !text.trim()) {
      res.status(400).json({
        success: false,
        message: "Both customerPhone and non-empty text message are required.",
      });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");

    // Send via Meta Cloud API
    const result = await sendWhatsAppReply(cleanPhone, text.trim());

    // Persist outgoing message in MongoDB
    const newMessage = await WhatsAppMessage.create({
      messageId: result.messageId,
      customerPhone: cleanPhone,
      businessPhoneNumberId: config.whatsappPhoneNumberId,
      direction: "outgoing",
      type: "text",
      text: text.trim(),
      status: "sent",
      rawPayload: result.rawResponse as Record<string, unknown>,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error: any) {
    console.error("❌ Error sending WhatsApp reply:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to send WhatsApp message",
    });
  }
};

/**
 * Force subscribe WABA to app's webhooks via Meta Graph API
 */
export const handleSubscribeWaba = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const { subscribeWabaToApp } = await import("../services/whatsapp.service.js");
    const result = await subscribeWabaToApp();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: any) {
    console.error("❌ Error subscribing WABA to app:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to subscribe WABA to app",
    });
  }
};


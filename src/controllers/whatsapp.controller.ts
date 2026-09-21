import type { Request, Response } from "express";
import { config } from "../config/index.js";
import {
  WhatsAppMessage,
  type IWhatsAppMessage,
} from "../models/whatsappMessage.model.js";
import {
  WhatsAppQuickReply,
  type IWhatsAppQuickReply,
} from "../models/whatsappQuickReply.model.js";
import { CommercialUser } from "../models/commercialUser.model.js";
import { Enquiry } from "../models/enquiry.model.js";
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
 * Get all active customer conversations grouped by phone number with counts and filtering
 */
export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, q } = req.query;

    // Group messages by customerPhone to get latest activity
    const rawConversations = await WhatsAppMessage.aggregate([
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
          firstMessage: { $last: "$text" },
          firstTimestamp: { $last: "$timestamp" },
        },
      },
      {
        $sort: { lastTimestamp: -1 },
      },
    ]);

    // Enhance conversations with pending flag and status
    const allConversations = rawConversations.map((conv) => {
      const isPending = conv.lastDirection === "incoming";
      return {
        ...conv,
        isPending,
        status: isPending ? "pending" : "responded",
      };
    });

    const totalCount = allConversations.length;
    const pendingCount = allConversations.filter((c) => c.isPending).length;
    const respondedCount = allConversations.filter((c) => !c.isPending).length;

    let filtered = allConversations;

    // Filter by status if requested
    if (status && status !== "all") {
      if (status === "pending") {
        filtered = filtered.filter((c) => c.isPending);
      } else if (status === "responded") {
        filtered = filtered.filter((c) => !c.isPending);
      }
    }

    // Filter by search query if requested
    if (q && typeof q === "string" && q.trim()) {
      const query = q.trim().toLowerCase();
      filtered = filtered.filter((c) => {
        const phone = (c.customerPhone || "").toLowerCase();
        const name = (c.customerName || "").toLowerCase();
        const lastMsg = (c.lastMessage || "").toLowerCase();
        const firstMsg = (c.firstMessage || "").toLowerCase();
        return (
          phone.includes(query) ||
          name.includes(query) ||
          lastMsg.includes(query) ||
          firstMsg.includes(query)
        );
      });
    }

    res.status(200).json({
      success: true,
      data: filtered,
      counts: {
        total: totalCount,
        pending: pendingCount,
        responded: respondedCount,
      },
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
 * Delete all messages for a specific customer phone (clear conversation)
 * DELETE /api/v1/whatsapp/conversations/:customerPhone
 */
export const deleteConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customerPhoneParam = req.params.customerPhone;
    const customerPhone = Array.isArray(customerPhoneParam)
      ? customerPhoneParam[0]
      : customerPhoneParam || "";
    const cleanPhone = customerPhone.replace(/\D/g, "");

    const result = await WhatsAppMessage.deleteMany({
      customerPhone: { $in: [customerPhone, cleanPhone] },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} messages for customer ${cleanPhone}`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("❌ Error deleting WhatsApp conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete WhatsApp conversation",
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

    const firstMessage = messages.length > 0 ? messages[0] : null;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    // Check if 24-hour window is currently active (based on last incoming message)
    const lastIncoming = messages
      .filter((m) => m.direction === "incoming")
      .slice(-1)[0];

    const isWindowOpen = lastIncoming
      ? Date.now() - new Date(lastIncoming.timestamp).getTime() <
        24 * 60 * 60 * 1000
      : false;

    // Lookup linked client in MongoDB (CommercialUser & Enquiry collections)
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    const [linkedClient, linkedEnquiry] = await Promise.all([
      last10
        ? CommercialUser.findOne({
            $or: [
              { phone: { $regex: last10 } },
              { identifier: cleanPhone },
              { identifier: { $regex: last10 } },
            ],
          })
            .select("name email phone address pin completed source createdAt")
            .lean()
        : null,
      last10
        ? Enquiry.findOne({
            phone: { $regex: last10 },
          })
            .sort({ submittedAt: -1 })
            .select("name email phone service status submittedAt notes")
            .lean()
        : null,
    ]);

    const resolvedName =
      messages.find((m) => m.customerName)?.customerName ||
      linkedClient?.name ||
      linkedEnquiry?.name ||
      "";

    res.status(200).json({
      success: true,
      data: {
        customerPhone: cleanPhone,
        customerName: resolvedName,
        isWindowOpen,
        lastIncomingTime: lastIncoming ? lastIncoming.timestamp : null,
        totalMessages: messages.length,
        firstMessageTime: firstMessage ? firstMessage.timestamp : null,
        lastMessageTime: lastMessage ? lastMessage.timestamp : null,
        linkedClient: linkedClient
          ? {
              _id: linkedClient._id,
              name: linkedClient.name,
              email: linkedClient.email,
              phone: linkedClient.phone,
              address: linkedClient.address,
              pin: linkedClient.pin,
              completed: linkedClient.completed,
              source: linkedClient.source,
              createdAt: linkedClient.createdAt,
            }
          : null,
        linkedEnquiry: linkedEnquiry
          ? {
              _id: linkedEnquiry._id,
              name: linkedEnquiry.name,
              email: linkedEnquiry.email,
              service: linkedEnquiry.service,
              status: linkedEnquiry.status,
              submittedAt: linkedEnquiry.submittedAt,
            }
          : null,
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

/**
 * Get all quick replies (seeds defaults if empty)
 */
export const getQuickReplies = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    let replies = await WhatsAppQuickReply.find().sort({ order: 1, createdAt: 1 });

    // Seed defaults if empty
    if (replies.length === 0) {
      const defaultReplies = [
        {
          title: "Greeting",
          text: "Hello {{customerName}}! Thank you for reaching out to ABC Typing Services. How can we help you today?",
          category: "general",
          order: 1,
        },
        {
          title: "Document Request",
          text: "Could you please share your documents (passport copy, Emirates ID) so our team can review them?",
          category: "documents",
          order: 2,
        },
        {
          title: "Processing Update",
          text: "Your application is currently being processed by our clearance team. We will notify you as soon as it is approved.",
          category: "updates",
          order: 3,
        },
        {
          title: "Office Location",
          text: "Our office is located in Abu Dhabi. You are welcome to visit us in person or complete everything online through WhatsApp!",
          category: "general",
          order: 4,
        },
        {
          title: "Government Clearance",
          text: "Please let us know if you need any further assistance with your UAE government clearance, visa, or labour services.",
          category: "services",
          order: 5,
        },
      ];
      replies = await WhatsAppQuickReply.insertMany(defaultReplies);
    }

    res.status(200).json({
      success: true,
      data: replies,
    });
  } catch (error: any) {
    console.error("❌ Error fetching quick replies:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch quick replies",
    });
  }
};

/**
 * Create a new custom quick reply
 */
export const createQuickReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, text, category, order } = req.body;

    if (!title?.trim() || !text?.trim()) {
      res.status(400).json({
        success: false,
        message: "Title and message text are required",
      });
      return;
    }

    const count = await WhatsAppQuickReply.countDocuments();
    const newReply = await WhatsAppQuickReply.create({
      title: title.trim(),
      text: text.trim(),
      category: category?.trim() || "general",
      order: typeof order === "number" ? order : count + 1,
    });

    res.status(201).json({
      success: true,
      data: newReply,
    });
  } catch (error: any) {
    console.error("❌ Error creating quick reply:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create quick reply",
    });
  }
};

/**
 * Update an existing quick reply
 */
export const updateQuickReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, text, category, order } = req.body;

    const reply = await WhatsAppQuickReply.findById(id);
    if (!reply) {
      res.status(404).json({
        success: false,
        message: "Quick reply not found",
      });
      return;
    }

    if (title !== undefined) reply.title = title.trim();
    if (text !== undefined) reply.text = text.trim();
    if (category !== undefined) reply.category = category.trim();
    if (typeof order === "number") reply.order = order;

    await reply.save();

    res.status(200).json({
      success: true,
      data: reply,
    });
  } catch (error: any) {
    console.error("❌ Error updating quick reply:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update quick reply",
    });
  }
};

/**
 * Delete a quick reply
 */
export const deleteQuickReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await WhatsAppQuickReply.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Quick reply not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Quick reply deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting quick reply:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete quick reply",
    });
  }
};



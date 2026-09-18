import { config } from "../config/index.js";
import { uploadStreamToCloudinary } from "../config/cloudinary.js";
import {
  WhatsAppMessage,
  type WhatsAppMessageType,
} from "../models/whatsappMessage.model.js";

interface MetaMediaInfo {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
}

/**
 * Downloads media from Meta Graph API using the mediaId and persists it
 * to Cloudinary (or falls back to direct URL).
 */
export const downloadAndPersistMedia = async (
  mediaId: string,
  suggestedFileName?: string
): Promise<{
  mediaUrl: string;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
}> => {
  if (!config.whatsappToken) {
    console.warn("⚠️ WHATSAPP_TOKEN not configured; cannot fetch media binary.");
    return { mediaUrl: "" };
  }

  try {
    // 1. Get temporary media URL from Meta Graph API
    const metaRes = await fetch(
      `https://graph.facebook.com/v22.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${config.whatsappToken}`,
        },
      }
    );

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      console.error(`❌ Failed to retrieve Meta media info (${mediaId}):`, errText);
      return { mediaUrl: "" };
    }

    const mediaInfo = (await metaRes.json()) as MetaMediaInfo;

    // 2. Download binary stream using Meta token
    const binaryRes = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${config.whatsappToken}`,
      },
    });

    if (!binaryRes.ok) {
      console.error(
        `❌ Failed to download Meta media binary from ${mediaInfo.url}`
      );
      return { mediaUrl: mediaInfo.url, mimeType: mediaInfo.mime_type };
    }

    const arrayBuffer = await binaryRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload to Cloudinary if configured
    if (
      config.cloudinaryCloudName &&
      config.cloudinaryApiKey &&
      config.cloudinaryApiSecret
    ) {
      const isImage = mediaInfo.mime_type?.startsWith("image/");
      const isVideo = mediaInfo.mime_type?.startsWith("video/");
      const resourceType = isImage ? "image" : isVideo ? "video" : "raw";

      const uploadResult = await uploadStreamToCloudinary(buffer, {
        folder: "whatsapp_media",
        resource_type: resourceType,
        public_id: `wa_${mediaId}_${Date.now()}`,
      });

      return {
        mediaUrl: uploadResult.secure_url,
        mimeType: mediaInfo.mime_type,
        fileSize: mediaInfo.file_size,
        fileName: suggestedFileName || `file_${mediaId}`,
      };
    }

    // Fallback: If Cloudinary is not configured yet, construct a safe Data URL for smaller items
    if (buffer.length <= 5 * 1024 * 1024) {
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mediaInfo.mime_type};base64,${base64}`;
      return {
        mediaUrl: dataUrl,
        mimeType: mediaInfo.mime_type,
        fileSize: mediaInfo.file_size,
        fileName: suggestedFileName,
      };
    }

    return {
      mediaUrl: mediaInfo.url,
      mimeType: mediaInfo.mime_type,
      fileSize: mediaInfo.file_size,
      fileName: suggestedFileName,
    };
  } catch (error) {
    console.error("❌ Error in downloadAndPersistMedia:", error);
    return { mediaUrl: "" };
  }
};

/**
 * Send an outbound text reply to a customer via Meta WhatsApp Cloud API
 */
export const sendWhatsAppReply = async (
  recipientPhone: string,
  messageText: string
): Promise<{ messageId: string; rawResponse: unknown }> => {
  if (!config.whatsappToken || !config.whatsappPhoneNumberId) {
    throw new Error(
      "WhatsApp credentials (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are missing."
    );
  }

  // Clean phone number (remove +, spaces, hyphens)
  const cleanPhone = recipientPhone.replace(/\D/g, "");

  const url = `https://graph.facebook.com/v22.0/${config.whatsappPhoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: {
      preview_url: false,
      body: messageText,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as {
    messages?: Array<{ id: string }>;
    error?: unknown;
  };

  if (!response.ok || !data.messages || data.messages.length === 0) {
    console.error("❌ Meta WhatsApp Cloud API error:", data);
    throw new Error(
      `Meta API Error: ${
        (data.error as any)?.message || response.statusText || "Failed to send message"
      }`
    );
  }

  const messageId = data.messages[0].id;
  return { messageId, rawResponse: data };
};

/**
 * Process incoming Meta webhook event payload
 */
export const processIncomingWebhook = async (body: any): Promise<void> => {
  if (body.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) {
    return;
  }

  for (const entry of body.entry) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;

      const value = change.value;
      if (!value) continue;

      const businessPhoneNumberId =
        value.metadata?.phone_number_id || config.whatsappPhoneNumberId;

      // Handle delivery & read status updates
      if (Array.isArray(value.statuses)) {
        for (const statusObj of value.statuses) {
          const { id: statusMsgId, status } = statusObj;
          if (statusMsgId && status) {
            await WhatsAppMessage.findOneAndUpdate(
              { messageId: statusMsgId },
              { status: status as any }
            ).exec();
          }
        }
      }

      // Handle incoming customer messages
      if (Array.isArray(value.messages)) {
        const contactMap = new Map<string, string>();
        if (Array.isArray(value.contacts)) {
          for (const c of value.contacts) {
            if (c.wa_id && c.profile?.name) {
              contactMap.set(c.wa_id, c.profile.name);
            }
          }
        }

        for (const msg of value.messages) {
          const messageId = msg.id;
          const senderPhone = msg.from;
          const senderName = contactMap.get(senderPhone) || "";
          const msgType = (msg.type || "text") as WhatsAppMessageType;
          const timestamp = msg.timestamp
            ? new Date(parseInt(msg.timestamp, 10) * 1000)
            : new Date();

          // Prevent duplicate processing
          const existing = await WhatsAppMessage.findOne({ messageId });
          if (existing) continue;

          let text = "";
          let mediaId: string | undefined;
          let mediaUrl: string | undefined;
          let mediaMimeType: string | undefined;
          let mediaFileName: string | undefined;
          let mediaFileSize: number | undefined;

          if (msgType === "text") {
            text = msg.text?.body || "";
          } else if (msgType === "image" && msg.image?.id) {
            mediaId = msg.image.id;
            text = msg.image.caption || "";
            mediaMimeType = msg.image.mime_type;
            const downloaded = await downloadAndPersistMedia(msg.image.id);
            mediaUrl = downloaded.mediaUrl;
          } else if (msgType === "document" && msg.document?.id) {
            mediaId = msg.document.id;
            text = msg.document.caption || "";
            mediaFileName = msg.document.filename;
            mediaMimeType = msg.document.mime_type;
            const downloaded = await downloadAndPersistMedia(
              msg.document.id,
              mediaFileName
            );
            mediaUrl = downloaded.mediaUrl;
            mediaFileSize = downloaded.fileSize;
          } else if (msgType === "audio" && msg.audio?.id) {
            mediaId = msg.audio.id;
            mediaMimeType = msg.audio.mime_type;
            const downloaded = await downloadAndPersistMedia(msg.audio.id);
            mediaUrl = downloaded.mediaUrl;
          } else if (msgType === "video" && msg.video?.id) {
            mediaId = msg.video.id;
            text = msg.video.caption || "";
            mediaMimeType = msg.video.mime_type;
            const downloaded = await downloadAndPersistMedia(msg.video.id);
            mediaUrl = downloaded.mediaUrl;
          } else if (msgType === "sticker" && msg.sticker?.id) {
            mediaId = msg.sticker.id;
            mediaMimeType = msg.sticker.mime_type;
            const downloaded = await downloadAndPersistMedia(msg.sticker.id);
            mediaUrl = downloaded.mediaUrl;
          } else {
            text = `[${msgType.toUpperCase()} message received]`;
          }

          await WhatsAppMessage.create({
            messageId,
            customerPhone: senderPhone,
            customerName: senderName,
            businessPhoneNumberId,
            direction: "incoming",
            type: msgType,
            text,
            mediaId,
            mediaUrl,
            mediaMimeType,
            mediaFileName,
            mediaFileSize,
            status: "received",
            rawPayload: msg,
            timestamp,
          });
        }
      }
    }
  }
};

import { config } from "../config/index.js";
import { CommercialUser, type IClientFile } from "../models/commercialUser.model.js";
import { WhatsAppMessage } from "../models/whatsappMessage.model.js";
import { WhatsAppSession } from "../models/whatsappSession.model.js";
import { sendWhatsAppReply } from "./whatsapp.service.js";

const escapeRegex = (str: string): string => {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * Sends a WhatsApp reply and persists an outgoing record in WhatsAppMessage
 * so it appears in the admin live-sync chat.
 */
export const sendBotReply = async (
  recipientPhone: string,
  messageText: string
): Promise<void> => {
  try {
    const cleanRecipient = recipientPhone.replace(/\D/g, "");
    const result = await sendWhatsAppReply(cleanRecipient, messageText);

    await WhatsAppMessage.create({
      messageId: result.messageId,
      customerPhone: cleanRecipient,
      businessPhoneNumberId: config.whatsappPhoneNumberId,
      direction: "outgoing",
      type: "text",
      text: messageText,
      status: "sent",
      rawPayload: result.rawResponse as Record<string, unknown>,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error(`❌ Failed to send automated WhatsApp reply to ${recipientPhone}:`, err);
  }
};

export interface WhatsAppAutomationInput {
  senderPhone: string;
  msgType: string;
  text: string;
  media?: {
    mediaUrl?: string;
    mediaMimeType?: string;
    mediaFileName?: string;
    mediaFileSize?: number;
  };
}

/**
 * Handles the session automation workflow:
 * - "." starts or ends a client creation session.
 * - Out-of-order phone numbers, names (N: Name), and media files are buffered
 *   and linked to the CommercialUser record.
 */
export const handleWhatsAppAutomation = async ({
  senderPhone,
  msgType,
  text,
  media,
}: WhatsAppAutomationInput): Promise<void> => {
  const cleanPhone = senderPhone.replace(/\D/g, "");
  const trimmedText = (text || "").trim();
  const isDot = trimmedText === ".";

  // 1. Handle Dot (.) - Session Toggle
  if (isDot) {
    let session = await WhatsAppSession.findOne({ senderPhone: cleanPhone });
    if (!session) {
      session = new WhatsAppSession({ senderPhone: cleanPhone, isActive: false });
    }

    if (!session.isActive) {
      // START NEW SESSION
      session.isActive = true;
      session.clientId = null;
      session.tempName = "";
      session.pendingFiles = [];
      await session.save();

      await sendBotReply(
        cleanPhone,
        "🟢 *Client Session Started*\n\nYou can now send in any order:\n• 10-digit Phone Number (creates or finds client)\n• Client Name with prefix *N: Name*\n• Documents, PDFs, or photos\n\nSend `.` again when finished to close this session."
      );
      return;
    } else {
      // CLOSE / RESET ACTIVE SESSION
      let summaryText = "";
      if (session.clientId) {
        const client = await CommercialUser.findById(session.clientId);
        const name = client?.name || "Unnamed";
        const phone = client?.phone || client?.identifier || "N/A";
        const fileCount = client?.files?.length || 0;
        summaryText = `🔴 *Session Closed*\n• Client: *${name}* (${phone})\n• Total Files: *${fileCount}*\n\nAll details and documents are saved in your dashboard.\nSend \`.\` to start a new client.`;
      } else {
        if (session.pendingFiles && session.pendingFiles.length > 0) {
          summaryText = `🔴 *Session Closed*\n⚠️ ${session.pendingFiles.length} file(s) were received but no phone number was linked.\nSend \`.\` to start a new session.`;
        } else {
          summaryText = "🔴 *Session Closed*\nNo client was linked. Send `.` to start a new session.";
        }
      }

      session.isActive = false;
      session.clientId = null;
      session.tempName = "";
      session.pendingFiles = [];
      await session.save();

      await sendBotReply(cleanPhone, summaryText);
      return;
    }
  }

  // 2. Check if there is an active session
  const session = await WhatsAppSession.findOne({
    senderPhone: cleanPhone,
    isActive: true,
  });

  if (!session) {
    // No active automation session; normal message handling takes place
    return;
  }

  // 3. Process Media Attachments (Photos, PDFs, Documents)
  if (media && media.mediaUrl) {
    const defaultName =
      msgType === "image"
        ? `photo_${Date.now()}.jpg`
        : msgType === "video"
        ? `video_${Date.now()}.mp4`
        : `document_${Date.now()}`;

    const clientFile: IClientFile = {
      public_id: `wa_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      url: media.mediaUrl,
      fileName: media.mediaFileName || defaultName,
      fileType: media.mediaMimeType || "application/octet-stream",
      fileSize: media.mediaFileSize || 0,
      uploadedAt: new Date(),
    };

    if (session.clientId) {
      const client = await CommercialUser.findById(session.clientId);
      if (client) {
        client.files.push(clientFile);
        await client.save();
        await sendBotReply(
          cleanPhone,
          `📎 File *${clientFile.fileName}* attached to *${client.name || client.phone}*.\nTotal files: ${client.files.length}`
        );
      }
    } else {
      session.pendingFiles.push(clientFile);
      await session.save();
      await sendBotReply(
        cleanPhone,
        `📎 File *${clientFile.fileName}* saved in session buffer.\n(It will be attached automatically once you send the client's phone number or name).`
      );
    }
  }

  // 4. Process Name Indicator ("N: Name" or "n: Name")
  const nameMatch = trimmedText.match(/^n:\s*(.+)$/i);
  if (nameMatch) {
    const newName = nameMatch[1].trim();

    if (session.clientId) {
      const client = await CommercialUser.findById(session.clientId);
      if (client) {
        client.name = newName;
        await client.save();
        await sendBotReply(cleanPhone, `✅ Client name updated to *${newName}*.`);
      }
      return;
    } else {
      // Check if an existing client has this name
      const existingClient = await CommercialUser.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(newName)}$`, "i") },
      });

      if (existingClient) {
        session.clientId = existingClient._id;
        let attachedMsg = "";
        if (session.pendingFiles && session.pendingFiles.length > 0) {
          existingClient.files.push(...session.pendingFiles);
          attachedMsg = `\n📎 Attached ${session.pendingFiles.length} buffered file(s).`;
          session.pendingFiles = [];
        }
        await existingClient.save();
        await session.save();

        const fileCount = existingClient.files?.length || 0;
        await sendBotReply(
          cleanPhone,
          `👤 *Existing Client Selected (by Name)*:\n• Name: *${existingClient.name}*\n• Phone: ${existingClient.phone || "N/A"}\n• Identifier: ${existingClient.identifier}\n• Status: ${existingClient.completed ? "Completed ✅" : "In Progress ⏳"}\n• Total Files: ${fileCount}\n• Created: ${new Date(existingClient.createdAt).toLocaleDateString()}${attachedMsg}`
        );
        return;
      } else {
        session.tempName = newName;
        await session.save();
        await sendBotReply(
          cleanPhone,
          `📝 Name recorded: *${newName}*.\nPlease send the client's 10-digit phone number or upload files.`
        );
        return;
      }
    }
  }

  // 5. Process Phone Number (10 digits, or with leading 91 / 0)
  const digits = trimmedText.replace(/\D/g, "");
  let phoneCandidate = "";
  if (digits.length === 10) {
    phoneCandidate = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    phoneCandidate = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    phoneCandidate = digits.slice(1);
  }

  const isPurePhone =
    phoneCandidate.length === 10 &&
    trimmedText.replace(/[\s\+\-\(\)]/g, "") === digits;

  if (isPurePhone) {
    // Search for existing client by phone or identifier
    let client = await CommercialUser.findOne({
      $or: [
        { phone: phoneCandidate },
        { phone: `+91${phoneCandidate}` },
        { phone: `91${phoneCandidate}` },
        { identifier: phoneCandidate },
        { identifier: `client_${phoneCandidate}` },
      ],
    });

    if (client) {
      // Existing client found
      session.clientId = client._id;
      if (session.tempName) {
        client.name = session.tempName;
        session.tempName = "";
      }

      let attachedMsg = "";
      if (session.pendingFiles && session.pendingFiles.length > 0) {
        client.files.push(...session.pendingFiles);
        attachedMsg = `\n📎 Attached ${session.pendingFiles.length} buffered file(s).`;
        session.pendingFiles = [];
      }

      await client.save();
      await session.save();

      const fileCount = client.files?.length || 0;
      await sendBotReply(
        cleanPhone,
        `👤 *Existing Client Found*:\n• Name: *${client.name || "Not set"}*\n• Phone: ${client.phone || phoneCandidate}\n• Identifier: ${client.identifier}\n• Status: ${client.completed ? "Completed ✅" : "In Progress ⏳"}\n• Total Files: ${fileCount}\n• Created: ${new Date(client.createdAt).toLocaleDateString()}${attachedMsg}`
      );
      return;
    } else {
      // Create new client
      const clientName = session.tempName || "";
      const initialFiles = session.pendingFiles ? [...session.pendingFiles] : [];

      const newClient = await CommercialUser.create({
        identifier: phoneCandidate,
        phone: phoneCandidate,
        name: clientName,
        source: "manual",
        completed: false,
        files: initialFiles,
      });

      const attachedCount = initialFiles.length;
      session.clientId = newClient._id;
      session.pendingFiles = [];
      session.tempName = "";
      await session.save();

      await sendBotReply(
        cleanPhone,
        `✅ *New Client Created*:\n• Phone: *${phoneCandidate}*\n• Name: *${clientName || "Not set yet (send N: Name)"}*\n• Identifier: ${phoneCandidate}${attachedCount > 0 ? `\n• Files Attached: ${attachedCount}` : ""}\n\nYou can now send *N: Name* or upload photos/documents to attach.`
      );
      return;
    }
  }

  // 6. If none of the above matched and no media was sent
  if (!media?.mediaUrl && trimmedText) {
    await sendBotReply(
      cleanPhone,
      "ℹ️ *Session in Progress*\nSend:\n• 10-digit number to select/create a client\n• `N: Name` to set client name\n• Upload photos/documents to attach\n• Send `.` to close this session"
    );
  }
};

import { config } from "../config/index.js";

/**
 * Escapes HTML characters to prevent breaking Telegram's HTML parse_mode
 */
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/**
 * Clean phone number to digits only for wa.me links
 */
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

/**
 * Sends a Telegram message to a single chat ID
 */
export const sendTelegramMessage = async (
  chatId: string,
  htmlText: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  if (!config.telegramBotToken) {
    console.warn("⚠️ Telegram bot token is not configured.");
    return { success: false, error: "Bot token not configured" };
  }

  try {
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error(`❌ Telegram send error for chat ${chatId}:`, data);
      return { success: false, error: data.description || "Telegram API error" };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error(`❌ Failed to send Telegram message to ${chatId}:`, err?.message || err);
    return { success: false, error: err?.message || "Network error" };
  }
};

/**
 * Broadcasts an alert message to all configured admin chat IDs
 */
export const broadcastTelegramAlert = async (htmlText: string): Promise<void> => {
  const chatIds = config.telegramChatIds;
  if (!chatIds || chatIds.length === 0) {
    console.warn("⚠️ No Telegram chat IDs configured for alerts.");
    return;
  }

  await Promise.allSettled(
    chatIds.map((chatId) => sendTelegramMessage(chatId, htmlText))
  );
};

export interface WhatsAppNotificationPayload {
  senderName?: string;
  senderPhone: string;
  text: string;
  msgType?: string;
}

/**
 * Formats and broadcasts a notification for an incoming WhatsApp customer message
 */
export const notifyWhatsAppIncoming = async (
  payload: WhatsAppNotificationPayload
): Promise<void> => {
  const { senderName, senderPhone, text, msgType = "text" } = payload;
  const digits = cleanPhoneNumber(senderPhone);
  const waLink = digits ? `https://wa.me/${digits}` : "";
  const nameSafe = escapeHtml(senderName?.trim() || "Unknown Customer");
  const phoneSafe = escapeHtml(senderPhone);
  const textSafe = escapeHtml(text?.trim() || `[${msgType.toUpperCase()} file received]`);
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const messageHtml = [
    `🚨 <b>New WhatsApp Customer Message</b>`,
    ``,
    `👤 <b>Customer:</b> ${nameSafe}`,
    `📱 <b>Phone:</b> ${phoneSafe}${waLink ? ` (👉 <a href="${waLink}">Open WhatsApp</a>)` : ""}`,
    `💬 <b>Message:</b>`,
    `<i>"${textSafe}"</i>`,
    ``,
    `⏰ <i>Received at ${now}</i>`,
  ].join("\n");

  await broadcastTelegramAlert(messageHtml);
};

export interface WebsiteEnquiryPayload {
  name: string;
  phone: string;
  email: string;
  service: string;
  notes?: string;
}

/**
 * Formats and broadcasts a notification for a website lead/enquiry form submission
 */
export const notifyWebsiteEnquiry = async (
  payload: WebsiteEnquiryPayload
): Promise<void> => {
  const { name, phone, email, service, notes } = payload;
  const digits = cleanPhoneNumber(phone);
  const waLink = digits ? `https://wa.me/${digits}` : "";
  const nameSafe = escapeHtml(name?.trim() || "Unknown");
  const phoneSafe = escapeHtml(phone);
  const emailSafe = escapeHtml(email?.trim() || "Not provided");
  const serviceSafe = escapeHtml(service);
  const notesSafe = notes?.trim() ? escapeHtml(notes.trim()) : "None provided";
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const messageHtml = [
    `📬 <b>New Website Enquiry Submitted</b>`,
    ``,
    `👤 <b>Name:</b> ${nameSafe}`,
    `📱 <b>Phone:</b> ${phoneSafe}${waLink ? ` (👉 <a href="${waLink}">Open WhatsApp</a>)` : ""}`,
    `✉️ <b>Email:</b> ${emailSafe}`,
    `💼 <b>Service:</b> ${serviceSafe}`,
    `📝 <b>Details:</b> <i>"${notesSafe}"</i>`,
    ``,
    `⏰ <i>Submitted at ${now}</i>`,
  ].join("\n");

  await broadcastTelegramAlert(messageHtml);
};

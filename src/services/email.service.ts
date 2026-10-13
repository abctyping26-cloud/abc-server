import { Resend } from "resend";
import config from "../config/index.js";

const getResendClient = () => {
  if (!config.resendApiKey) {
    return null;
  }
  return new Resend(config.resendApiKey);
};

export interface SendEnquiryNotificationParams {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  message?: string;
  workerEmail: string;
  adminEmail?: string;
}

export interface SendReplyToCustomerParams {
  customerEmail: string;
  customerName?: string;
  senderName?: string;
  subject?: string;
  message: string;
}

/**
 * Send an automated enquiry alert to worker admin(s) with Reply-To set to the commercial user.
 */
export const sendEnquiryNotification = async (params: SendEnquiryNotificationParams) => {
  const resend = getResendClient();

  if (!resend) {
    throw new Error(
      "RESEND_API_KEY is not configured. Please add your Resend API key to server/.env"
    );
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    service,
    message,
    workerEmail,
    adminEmail,
  } = params;

  const recipients = [workerEmail.trim()];
  const ccRecipients = adminEmail && adminEmail.trim() ? [adminEmail.trim()] : undefined;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">New Customer Enquiry</span>
        <h2 style="margin: 12px 0 0 0; color: #0f172a; font-size: 22px;">${service}</h2>
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Customer Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 100px;"><strong>Name:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td>
            <td style="padding: 6px 0; color: #2563eb;"><a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a></td>
          </tr>
          ${
            customerPhone
              ? `<tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${customerPhone}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Service:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${service}</td>
          </tr>
        </table>
      </div>

      ${
        message
          ? `<div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Enquiry Notes / Message</h3>
        <div style="background-color: #ffffff; border-left: 4px solid #3b82f6; padding: 12px 16px; color: #334155; font-size: 14px; line-height: 1.6; background-color: #f1f5f9; border-radius: 0 8px 8px 0;">
          ${message.replace(/\n/g, "<br/>")}
        </div>
      </div>`
          : ""
      }

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin-top: 24px;">
        <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
          💡 <strong>Direct Reply Enabled:</strong> Simply hit <strong>"Reply"</strong> in your Gmail / email app to respond directly to <strong>${customerName}</strong> (${customerEmail}).
        </p>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Sent via ABC Typing Automated System
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from: config.emailFrom,
    to: recipients,
    cc: ccRecipients,
    replyTo: customerEmail.trim(),
    subject: `[New Enquiry] ${customerName} - ${service}`,
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send enquiry email via Resend");
  }

  return result.data;
};

/**
 * Send a direct response email to the customer from the admin/worker.
 */
export const sendReplyToCustomer = async (params: SendReplyToCustomerParams) => {
  const resend = getResendClient();

  if (!resend) {
    throw new Error(
      "RESEND_API_KEY is not configured. Please add your Resend API key to server/.env"
    );
  }

  const { customerEmail, customerName, senderName, subject, message } = params;

  const resolvedSubject = subject?.trim() || "Update on your ABC Typing enquiry";
  const resolvedSender = senderName?.trim() || "ABC Typing Support";

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 20px;">ABC Typing Services</h2>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.5;">
        Dear ${customerName?.trim() || "Customer"},
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 8px 8px 0; color: #1e293b; font-size: 15px; line-height: 1.6; margin: 20px 0;">
        ${message.replace(/\n/g, "<br/>")}
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-top: 24px;">
        Best regards,<br/>
        <strong>${resolvedSender}</strong><br/>
        <span style="color: #64748b; font-size: 13px;">ABC Typing Team</span>
      </p>

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        If you have any questions, feel free to reply to this email.
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from: config.emailFrom,
    to: [customerEmail.trim()],
    subject: resolvedSubject,
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send reply email via Resend");
  }

  return result.data;
};

export interface SendExpenseReminderParams {
  title: string;
  category: string;
  amount: number;
  currency?: string;
  expiryDate: Date;
  targetEmail: string;
  daysRemaining: number;
  recurrence?: string;
  notes?: string;
  isTest?: boolean;
  testType?: "real_time" | "planned_8am";
}

/**
 * Send an automated expense expiration / renewal reminder via Resend
 */
export const sendExpenseReminderEmail = async (params: SendExpenseReminderParams) => {
  const resend = getResendClient();

  if (!resend) {
    throw new Error(
      "RESEND_API_KEY is not configured. Please add your Resend API key to server/.env"
    );
  }

  const {
    title,
    category,
    amount,
    currency = "AED",
    expiryDate,
    targetEmail,
    daysRemaining,
    recurrence = "monthly",
    notes,
    isTest = false,
    testType = "real_time",
  } = params;

  const formattedDate = new Date(expiryDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let urgencyTitle = `Expires in ${daysRemaining} day(s)`;
  let badgeColor = "#2563eb"; // blue
  let badgeBg = "#dbeafe";
  let headerBorder = "#3b82f6";

  if (daysRemaining <= 0) {
    urgencyTitle = "⚠️ Due / Expiring Today!";
    badgeColor = "#b91c1c";
    badgeBg = "#fee2e2";
    headerBorder = "#ef4444";
  } else if (daysRemaining <= 2) {
    urgencyTitle = `🚨 Urgent: ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"} Remaining`;
    badgeColor = "#b91c1c";
    badgeBg = "#fee2e2";
    headerBorder = "#ef4444";
  } else if (daysRemaining <= 3) {
    urgencyTitle = `⏳ Attention: 3 Days Remaining`;
    badgeColor = "#b45309";
    badgeBg = "#fef3c7";
    headerBorder = "#f59e0b";
  } else {
    urgencyTitle = `🗓️ Upcoming Renewal: 1 Week Notice`;
    badgeColor = "#1e40af";
    badgeBg = "#dbeafe";
    headerBorder = "#3b82f6";
  }

  let subject = `[Expense Reminder] ${urgencyTitle} - ${title}`;
  if (isTest) {
    if (testType === "planned_8am") {
      subject = `[8:00 AM PLANNED TEST] This is a test email from ABC Admin - ${title}`;
    } else {
      subject = `[TEST EMAIL] This is a test email from ABC Admin - ${title}`;
    }
  }

  const testBannerHtml = isTest
    ? `
      <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #065f46; font-size: 15px; font-weight: 700;">
          ✓ This is a test email from ABC Admin
        </h3>
        <p style="margin: 6px 0 0 0; color: #047857; font-size: 13px; line-height: 1.5;">
          ${
            testType === "planned_8am"
              ? "This is a scheduled 8:00 AM GST daily cycle test dispatched to your registered test recipients from the ABC Admin Dashboard."
              : "This is a real-time test email dispatched to verify your test recipient inbox from the ABC Admin Dashboard."
          }
        </p>
      </div>
    `
    : "";

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      ${testBannerHtml}
      <div style="border-bottom: 2px solid ${headerBorder}; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">${urgencyTitle}</span>
        <h2 style="margin: 12px 0 0 0; color: #0f172a; font-size: 22px;">${title}</h2>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
        ${
          isTest
            ? "Below is a preview of how automated expense expiration reminders look when dispatched to administrators:"
            : "This is an automated reminder regarding an upcoming expense or subscription renewal approaching its expiration date."
        }
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Expense Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Item / Service:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Category:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${category}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Amount:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 16px;">${currency} ${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Expiry Date:</strong></td>
            <td style="padding: 6px 0; color: ${badgeColor}; font-weight: 700;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Recurrence:</strong></td>
            <td style="padding: 6px 0; color: #475569; text-transform: capitalize;">${recurrence.replace("_", " ")}</td>
          </tr>
        </table>

        ${
          notes
            ? `<div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #475569;">
                <strong>Notes:</strong> ${notes}
               </div>`
            : ""
        }
      </div>

      <div style="text-align: center; margin: 28px 0 20px 0;">
        <a href="${config.adminUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Open Admin Dashboard
        </a>
      </div>

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        ABC Automated Expense Reminder System • abcauh.ae
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from: config.emailFrom,
    to: [targetEmail.trim()],
    subject,
    html: htmlContent,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send expense reminder email via Resend");
  }

  return result.data;
};


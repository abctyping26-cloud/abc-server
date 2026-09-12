import type { Request, Response, NextFunction } from "express";
import {
  sendEnquiryNotification,
  sendReplyToCustomer,
} from "../services/email.service.js";

/**
 * Controller to test sending an enquiry notification to worker admin(s).
 */
export const sendEnquiryTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      service,
      message,
      workerEmail,
      adminEmail,
    } = req.body;

    if (!customerEmail || !customerEmail.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Customer email is required for the enquiry.",
      });
      return;
    }

    if (!workerEmail || !workerEmail.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Worker recipient email is required to receive the enquiry.",
      });
      return;
    }

    const data = await sendEnquiryNotification({
      customerName: customerName?.trim() || "Test Customer",
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone?.trim(),
      service: service?.trim() || "General Enquiry (Test)",
      message: message?.trim() || "This is a test enquiry to verify the worker email flow.",
      workerEmail: workerEmail.trim(),
      adminEmail: adminEmail?.trim() || undefined,
    });

    res.status(200).json({
      status: "success",
      message: `Enquiry email successfully dispatched to ${workerEmail}`,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to dispatch enquiry email",
    });
  }
};

/**
 * Controller to test sending a direct reply from admin/worker to the customer.
 */
export const sendReplyTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerEmail, customerName, senderName, subject, message } = req.body;

    if (!customerEmail || !customerEmail.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Recipient customer email is required.",
      });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json({
        status: "fail",
        message: "Reply message content is required.",
      });
      return;
    }

    const data = await sendReplyToCustomer({
      customerEmail: customerEmail.trim(),
      customerName: customerName?.trim(),
      senderName: senderName?.trim(),
      subject: subject?.trim(),
      message: message.trim(),
    });

    res.status(200).json({
      status: "success",
      message: `Reply email successfully sent to ${customerEmail}`,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to send reply email",
    });
  }
};

import type { Request, Response } from "express";
import { Types } from "mongoose";
import { ExpenseReminder, type IExpenseReminder } from "../models/expenseReminder.model.js";
import { ExpenseReminderLog } from "../models/expenseReminderLog.model.js";
import { ExpenseReminderRecipient } from "../models/expenseReminderRecipient.model.js";
import { sendExpenseReminderEmail } from "../services/email.service.js";
import { config } from "../config/index.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * Helper to compute days remaining until an expiry date
 */
const getDaysRemaining = (expiryDate: Date): number => {
  const now = new Date();
  const diffTime = new Date(expiryDate).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Advance a date based on recurrence interval
 */
const advanceDateByRecurrence = (
  currentDate: Date,
  recurrence: "one_time" | "monthly" | "quarterly" | "yearly"
): Date => {
  const nextDate = new Date(currentDate);
  if (recurrence === "monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (recurrence === "quarterly") {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (recurrence === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  return nextDate;
};

/**
 * GET /api/v1/admin/expense-reminders
 * List all expense reminders with computed urgency and stats
 */
export const getExpenseReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, search } = req.query;

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (category && category !== "all") {
      query.category = category;
    }
    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { targetEmail: regex }, { notes: regex }];
    }

    const items = await ExpenseReminder.find(query).sort({ expiryDate: 1 }).lean();

    // Enrich with dynamic countdowns
    const enriched = items.map((item) => {
      const daysLeft = getDaysRemaining(item.expiryDate);
      let urgency: "critical" | "urgent" | "upcoming" | "normal" = "normal";
      if (daysLeft <= 0) {
        urgency = "critical";
      } else if (daysLeft <= 2) {
        urgency = "critical";
      } else if (daysLeft <= 3) {
        urgency = "urgent";
      } else if (daysLeft <= 7) {
        urgency = "upcoming";
      }

      return {
        ...item,
        daysRemaining: daysLeft,
        urgency,
      };
    });

    const activeItems = enriched.filter((i) => i.status === "active");
    const stats = {
      totalActive: activeItems.length,
      dueTodayOrOverdue: activeItems.filter((i) => i.daysRemaining <= 0).length,
      urgentTwoDays: activeItems.filter((i) => i.daysRemaining > 0 && i.daysRemaining <= 2).length,
      warningWeek: activeItems.filter((i) => i.daysRemaining > 2 && i.daysRemaining <= 7).length,
      totalActiveExpenditure: activeItems.reduce((sum, i) => sum + (i.amount || 0), 0),
    };

    res.status(200).json({
      status: "success",
      data: {
        reminders: enriched,
        stats,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense reminders:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch expense reminders",
    });
  }
};

/**
 * POST /api/v1/admin/expense-reminders
 * Create a new expense reminder
 */
export const createExpenseReminder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      category,
      amount,
      currency = "AED",
      expiryDate,
      targetEmail,
      targetPhone,
      notes,
      recurrence = "monthly",
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ status: "fail", message: "Title is required" });
      return;
    }
    if (!expiryDate) {
      res.status(400).json({ status: "fail", message: "Expiry date is required" });
      return;
    }
    if (!targetEmail || !targetEmail.trim()) {
      res.status(400).json({ status: "fail", message: "Target recipient email is required" });
      return;
    }

    const reminder = await ExpenseReminder.create({
      title: title.trim(),
      category: category?.trim() || "General",
      amount: Number(amount) || 0,
      currency: currency.trim() || "AED",
      expiryDate: new Date(expiryDate),
      targetEmail: targetEmail.trim().toLowerCase(),
      targetPhone: targetPhone?.trim() || "",
      notes: notes?.trim() || "",
      recurrence,
      status: "active",
      remindersSent: {
        weekBefore: false,
        threeDaysBefore: false,
        twoDaysBefore: false,
        dayOf: false,
      },
      createdBy: req.admin?.id ? req.admin.id : null,
    });

    res.status(201).json({
      status: "success",
      data: { reminder },
    });
  } catch (error: any) {
    console.error("Error creating expense reminder:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create expense reminder",
    });
  }
};

/**
 * PUT /api/v1/admin/expense-reminders/:id
 * Update an existing expense reminder
 */
export const updateExpenseReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      amount,
      currency,
      expiryDate,
      targetEmail,
      targetPhone,
      notes,
      recurrence,
      status,
      resetReminders,
    } = req.body;

    const reminder = await ExpenseReminder.findById(id);
    if (!reminder) {
      res.status(404).json({ status: "fail", message: "Expense reminder not found" });
      return;
    }

    if (title !== undefined) reminder.title = title.trim();
    if (category !== undefined) reminder.category = category.trim();
    if (amount !== undefined) reminder.amount = Number(amount);
    if (currency !== undefined) reminder.currency = currency.trim();
    if (targetEmail !== undefined) reminder.targetEmail = targetEmail.trim().toLowerCase();
    if (targetPhone !== undefined) reminder.targetPhone = targetPhone.trim();
    if (notes !== undefined) reminder.notes = notes.trim();
    if (recurrence !== undefined) reminder.recurrence = recurrence;
    if (status !== undefined) reminder.status = status;

    if (expiryDate) {
      const newExpiry = new Date(expiryDate);
      // If date changed significantly, reset sent flags if requested or by default
      if (reminder.expiryDate.getTime() !== newExpiry.getTime() || resetReminders) {
        reminder.expiryDate = newExpiry;
        reminder.remindersSent = {
          weekBefore: false,
          threeDaysBefore: false,
          twoDaysBefore: false,
          dayOf: false,
        };
      }
    }

    await reminder.save();

    res.status(200).json({
      status: "success",
      data: { reminder },
    });
  } catch (error: any) {
    console.error("Error updating expense reminder:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update expense reminder",
    });
  }
};

/**
 * PATCH /api/v1/admin/expense-reminders/:id/renew
 * Mark an expense as renewed and roll forward its expiry date
 */
export const markAsRenewed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reminder = await ExpenseReminder.findById(id);
    if (!reminder) {
      res.status(404).json({ status: "fail", message: "Expense reminder not found" });
      return;
    }

    if (reminder.recurrence === "one_time") {
      reminder.status = "renewed";
    } else {
      // Advance expiry date to next cycle
      reminder.expiryDate = advanceDateByRecurrence(reminder.expiryDate, reminder.recurrence);
      reminder.status = "active";
      // Reset reminder triggers for the new cycle
      reminder.remindersSent = {
        weekBefore: false,
        threeDaysBefore: false,
        twoDaysBefore: false,
        dayOf: false,
      };
    }

    await reminder.save();

    res.status(200).json({
      status: "success",
      data: { reminder },
    });
  } catch (error: any) {
    console.error("Error marking reminder as renewed:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to mark reminder as renewed",
    });
  }
};

/**
 * DELETE /api/v1/admin/expense-reminders/:id
 * Delete an expense reminder
 */
export const deleteExpenseReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await ExpenseReminder.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ status: "fail", message: "Expense reminder not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Expense reminder deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting expense reminder:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to delete expense reminder",
    });
  }
};

/**
 * GET /api/v1/admin/expense-reminders/recipients
 * List all configured test recipients
 */
export const getExpenseReminderRecipients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recipients = await ExpenseReminderRecipient.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: { recipients } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || "Failed to fetch recipients" });
  }
};

/**
 * POST /api/v1/admin/expense-reminders/recipients
 * Add a new test recipient email
 */
export const addExpenseReminderRecipient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, name } = req.body;
    if (!email || !email.trim()) {
      res.status(400).json({ status: "fail", message: "Email is required" });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ status: "fail", message: "Please enter a valid email address" });
      return;
    }

    const existing = await ExpenseReminderRecipient.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({ status: "fail", message: "This email is already in the test recipients list" });
      return;
    }

    const recipient = await ExpenseReminderRecipient.create({
      email: cleanEmail,
      name: name ? name.trim() : "",
      isActive: true,
      createdBy: req.admin?.id ? new Types.ObjectId(req.admin.id) : null,
    });

    res.status(201).json({ status: "success", data: { recipient } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || "Failed to add recipient" });
  }
};

/**
 * DELETE /api/v1/admin/expense-reminders/recipients/:id
 * Remove a test recipient email
 */
export const deleteExpenseReminderRecipient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const recipient = await ExpenseReminderRecipient.findByIdAndDelete(id);
    if (!recipient) {
      res.status(404).json({ status: "fail", message: "Recipient not found" });
      return;
    }
    res.status(200).json({ status: "success", message: "Recipient removed successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || "Failed to delete recipient" });
  }
};

/**
 * POST /api/v1/admin/expense-reminders/:id/plan-test
 * Toggle scheduled test execution for the upcoming 8:00 AM daily cron cycle
 */
export const togglePlanTestReminder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const reminder = await ExpenseReminder.findById(id);
    if (!reminder) {
      res.status(404).json({ status: "fail", message: "Expense reminder not found" });
      return;
    }

    reminder.plannedTestNextCycle = !reminder.plannedTestNextCycle;
    await reminder.save();

    res.status(200).json({
      status: "success",
      message: reminder.plannedTestNextCycle
        ? "Test email scheduled to send in the upcoming 8:00 AM cycle!"
        : "Planned 8:00 AM test cycle cancelled.",
      data: { reminder },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || "Failed to update planned test" });
  }
};

/**
 * POST /api/v1/admin/expense-reminders/:id/test-email
 * Send an immediate test reminder email to all active test recipients and the item's target email
 */
export const sendTestReminderEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reminder = await ExpenseReminder.findById(id);
    if (!reminder) {
      res.status(404).json({ status: "fail", message: "Expense reminder not found" });
      return;
    }

    const daysLeft = getDaysRemaining(reminder.expiryDate);

    // Collect all recipient emails: reminder's targetEmail PLUS all active test recipients
    const activeRecipients = await ExpenseReminderRecipient.find({ isActive: true });
    const recipientSet = new Set<string>();

    if (reminder.targetEmail) {
      recipientSet.add(reminder.targetEmail.trim().toLowerCase());
    }
    for (const r of activeRecipients) {
      if (r.email) {
        recipientSet.add(r.email.trim().toLowerCase());
      }
    }

    const targetEmails = Array.from(recipientSet);
    if (targetEmails.length === 0) {
      res.status(400).json({
        status: "fail",
        message: "No recipient emails found. Add test recipients or configure a target email.",
      });
      return;
    }

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const email of targetEmails) {
      try {
        const emailResult = await sendExpenseReminderEmail({
          title: `[Test] ${reminder.title}`,
          category: reminder.category,
          amount: reminder.amount,
          currency: reminder.currency,
          expiryDate: reminder.expiryDate,
          targetEmail: email,
          daysRemaining: daysLeft,
          recurrence: reminder.recurrence,
          notes: reminder.notes,
        });

        await ExpenseReminderLog.create({
          reminderId: reminder._id,
          title: reminder.title,
          recipientEmail: email,
          category: reminder.category,
          amount: reminder.amount,
          triggerStage: "test_email",
          daysRemaining: daysLeft,
          status: "sent",
          resendEmailId: (emailResult as any)?.id || "",
          sentAt: new Date(),
          triggeredBy: "admin",
        });

        results.push({ email, success: true });
      } catch (err: any) {
        await ExpenseReminderLog.create({
          reminderId: reminder._id,
          title: reminder.title,
          recipientEmail: email,
          category: reminder.category,
          amount: reminder.amount,
          triggerStage: "test_email",
          daysRemaining: daysLeft,
          status: "failed",
          errorMessage: err.message || "Failed to send test email",
          sentAt: new Date(),
          triggeredBy: "admin",
        });

        results.push({ email, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    res.status(200).json({
      status: "success",
      message: `Test email dispatched to ${successCount} of ${targetEmails.length} recipient(s).`,
      data: { results },
    });
  } catch (error: any) {
    console.error("Error sending test reminder email:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to send test email",
    });
  }
};

/**
 * POST /api/v1/admin/expense-reminders/cron-check
 * Daily automated cron endpoint.
 * Protected by CRON_SECRET or authenticated Admin session.
 */
export const cronCheckExpenseReminders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // 1. Authenticate: Verify CRON_SECRET header OR Admin session
    const authHeader = req.headers.authorization;
    const isCronAuthorized =
      authHeader &&
      (authHeader === `Bearer ${config.cronSecret}` ||
        authHeader.replace("Bearer ", "").trim() === config.cronSecret.trim());

    const isAdminAuthorized = Boolean(req.admin);

    if (!isCronAuthorized && !isAdminAuthorized) {
      res.status(401).json({
        status: "fail",
        message: "Unauthorized: Invalid cron secret or missing admin session",
      });
      return;
    }

    // 2. Fetch all active expense reminders
    const reminders = await ExpenseReminder.find({ status: "active" });
    const notificationsDispatched: Array<{
      id: string;
      title: string;
      targetEmail: string;
      triggerStage: string;
      daysRemaining: number;
    }> = [];

    const errors: Array<{ id: string; title: string; error: string }> = [];

    for (const item of reminders) {
      const daysLeft = getDaysRemaining(item.expiryDate);
      let triggerStage: "day_of" | "2_days" | "3_days" | "week_before" | null = null;

      // Evaluation in cascade (highest urgency first):
      if (daysLeft <= 0 && !item.remindersSent.dayOf) {
        triggerStage = "day_of";
      } else if (daysLeft <= 2 && !item.remindersSent.twoDaysBefore) {
        triggerStage = "2_days";
      } else if (daysLeft <= 3 && !item.remindersSent.threeDaysBefore) {
        triggerStage = "3_days";
      } else if (daysLeft <= 7 && !item.remindersSent.weekBefore) {
        triggerStage = "week_before";
      }

      if (triggerStage) {
        try {
          const emailResult = await sendExpenseReminderEmail({
            title: item.title,
            category: item.category,
            amount: item.amount,
            currency: item.currency,
            expiryDate: item.expiryDate,
            targetEmail: item.targetEmail,
            daysRemaining: daysLeft,
            recurrence: item.recurrence,
            notes: item.notes,
          });

          // Mark corresponding flags so earlier stages are also treated as satisfied
          if (triggerStage === "day_of") {
            item.remindersSent.dayOf = true;
            item.remindersSent.twoDaysBefore = true;
            item.remindersSent.threeDaysBefore = true;
            item.remindersSent.weekBefore = true;
          } else if (triggerStage === "2_days") {
            item.remindersSent.twoDaysBefore = true;
            item.remindersSent.threeDaysBefore = true;
            item.remindersSent.weekBefore = true;
          } else if (triggerStage === "3_days") {
            item.remindersSent.threeDaysBefore = true;
            item.remindersSent.weekBefore = true;
          } else if (triggerStage === "week_before") {
            item.remindersSent.weekBefore = true;
          }

          item.lastNotifiedAt = new Date();
          await item.save();

          // Persist delivery log in MongoDB
          await ExpenseReminderLog.create({
            reminderId: item._id,
            title: item.title,
            recipientEmail: item.targetEmail,
            category: item.category,
            amount: item.amount,
            triggerStage,
            daysRemaining: daysLeft,
            status: "sent",
            resendEmailId: (emailResult as any)?.id || "",
            sentAt: new Date(),
            triggeredBy: isAdminAuthorized ? "admin" : "cron",
          });

          notificationsDispatched.push({
            id: item._id.toString(),
            title: item.title,
            targetEmail: item.targetEmail,
            triggerStage,
            daysRemaining: daysLeft,
          });
        } catch (err: any) {
          console.error(`Failed to send reminder for item "${item.title}":`, err);

          await ExpenseReminderLog.create({
            reminderId: item._id,
            title: item.title,
            recipientEmail: item.targetEmail,
            category: item.category,
            amount: item.amount,
            triggerStage: triggerStage || "manual",
            daysRemaining: daysLeft,
            status: "failed",
            errorMessage: err.message || "Failed to send email",
            sentAt: new Date(),
            triggeredBy: isAdminAuthorized ? "admin" : "cron",
          });

          errors.push({
            id: item._id.toString(),
            title: item.title,
            error: err.message || "Failed to send email",
          });
        }
      }
    }

    // 3. Process any planned test reminders scheduled for this 8:00 AM cycle
    const plannedTestReminders = await ExpenseReminder.find({
      status: "active",
      plannedTestNextCycle: true,
    });

    if (plannedTestReminders.length > 0) {
      const activeTestRecipients = await ExpenseReminderRecipient.find({ isActive: true });

      for (const item of plannedTestReminders) {
        const daysLeft = getDaysRemaining(item.expiryDate);
        const recipientSet = new Set<string>();
        if (item.targetEmail) recipientSet.add(item.targetEmail.trim().toLowerCase());
        for (const r of activeTestRecipients) {
          if (r.email) recipientSet.add(r.email.trim().toLowerCase());
        }

        for (const email of recipientSet) {
          try {
            const emailResult = await sendExpenseReminderEmail({
              title: `[8:00 AM Planned Test] ${item.title}`,
              category: item.category,
              amount: item.amount,
              currency: item.currency,
              expiryDate: item.expiryDate,
              targetEmail: email,
              daysRemaining: daysLeft,
              recurrence: item.recurrence,
              notes: item.notes ? `[Planned 8:00 AM Test Run] ${item.notes}` : "[Planned 8:00 AM Test Run]",
            });

            await ExpenseReminderLog.create({
              reminderId: item._id,
              title: item.title,
              recipientEmail: email,
              category: item.category,
              amount: item.amount,
              triggerStage: "planned_test",
              daysRemaining: daysLeft,
              status: "sent",
              resendEmailId: (emailResult as any)?.id || "",
              sentAt: new Date(),
              triggeredBy: "cron",
            });

            notificationsDispatched.push({
              id: item._id.toString(),
              title: item.title,
              targetEmail: email,
              triggerStage: "planned_test",
              daysRemaining: daysLeft,
            });
          } catch (err: any) {
            await ExpenseReminderLog.create({
              reminderId: item._id,
              title: item.title,
              recipientEmail: email,
              category: item.category,
              amount: item.amount,
              triggerStage: "planned_test",
              daysRemaining: daysLeft,
              status: "failed",
              errorMessage: err.message || "Failed to send planned test email",
              sentAt: new Date(),
              triggeredBy: "cron",
            });

            errors.push({ id: item._id.toString(), title: item.title, error: err.message || "Failed to send planned test" });
          }
        }

        // Reset the queue flag so it only runs once
        item.plannedTestNextCycle = false;
        await item.save();
      }
    }

    res.status(200).json({
      status: "success",
      message: `Cron check completed. ${notificationsDispatched.length} reminder email(s) sent.`,
      data: {
        totalEvaluated: reminders.length,
        dispatchedCount: notificationsDispatched.length,
        dispatched: notificationsDispatched,
        errors,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error executing cron check for expense reminders:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Cron execution failed",
    });
  }
};

/**
 * GET /api/v1/admin/expense-reminders/logs
 * Retrieve the latest 100 email dispatch logs
 */
export const getExpenseReminderLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await ExpenseReminderLog.find().sort({ sentAt: -1 }).limit(100).lean();
    const totalSent = await ExpenseReminderLog.countDocuments({ status: "sent" });
    const totalFailed = await ExpenseReminderLog.countDocuments({ status: "failed" });

    res.status(200).json({
      status: "success",
      data: {
        logs,
        summary: {
          totalLogs: logs.length,
          totalSent,
          totalFailed,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense reminder logs:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch logs",
    });
  }
};


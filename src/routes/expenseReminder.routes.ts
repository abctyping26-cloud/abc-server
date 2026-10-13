import { Router } from "express";
import {
  getExpenseReminders,
  createExpenseReminder,
  updateExpenseReminder,
  markAsRenewed,
  deleteExpenseReminder,
  sendTestReminderEmail,
  cronCheckExpenseReminders,
  getExpenseReminderLogs,
} from "../controllers/expenseReminder.controller.js";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import { config } from "../config/index.js";

const router = Router();

// Automated or Manual Cron Check:
// Supports Authorization: Bearer <CRON_SECRET> from GitHub Actions / cron-job.org
// OR can be called by an authenticated Admin from the admin UI
router.post("/cron-check", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]?.trim()
    : authHeader?.trim();

  // If request contains the valid CRON_SECRET, allow immediately without requiring Admin JWT
  if (token && config.cronSecret && token === config.cronSecret.trim()) {
    return cronCheckExpenseReminders(req as any, res);
  }

  // Otherwise, authenticate as an Admin user (e.g. manual scan from Admin Dashboard)
  return authenticateAdmin(req as any, res, () => {
    cronCheckExpenseReminders(req as any, res);
  });
});

// Admin-managed CRUD endpoints
router.use(authenticateAdmin);

router.get("/logs", getExpenseReminderLogs);
router.get("/", getExpenseReminders);
router.post("/", createExpenseReminder);
router.put("/:id", updateExpenseReminder);
router.patch("/:id/renew", markAsRenewed);
router.delete("/:id", deleteExpenseReminder);
router.post("/:id/test-email", sendTestReminderEmail);

export default router;

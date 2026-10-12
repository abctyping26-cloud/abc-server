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

const router = Router();

// Automated or Manual Cron Check:
// Supports Authorization: Bearer <CRON_SECRET> from GitHub Actions / cron-job.org
// OR can be called by an authenticated Admin from the admin UI
router.post("/cron-check", (req, res, next) => {
  const authHeader = req.headers.authorization;
  // If request has bearer token that might be admin JWT or cron secret:
  authenticateAdmin(req as any, res, () => {
    // If authenticateAdmin succeeds or fails, pass to controller which handles CRON_SECRET fallback
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

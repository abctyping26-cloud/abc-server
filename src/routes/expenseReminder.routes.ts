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
  getExpenseReminderRecipients,
  addExpenseReminderRecipient,
  deleteExpenseReminderRecipient,
  togglePlanTestReminder,
  sendTestEmailToAllRecipients,
  togglePlanTestForNextCycle,
} from "../controllers/expenseReminder.controller.js";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import { config } from "../config/index.js";

const router = Router();

const cleanSecret = (val?: unknown): string => {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
};

// Automated or Manual Cron Check:
// Supports Authorization: Bearer <CRON_SECRET>, x-cron-secret, or ?secret= from GitHub Actions / cron-job.org
// OR can be called by an authenticated Admin from the admin UI
router.post("/cron-check", (req, res) => {
  const authHeader = req.headers.authorization;
  const rawToken =
    (req.headers["x-cron-secret"] as string) ||
    (req.query.secret as string) ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader);

  const token = cleanSecret(rawToken);
  const configuredSecret = cleanSecret(config.cronSecret);
  const defaultSecret = "abc_cron_secret_key";

  // Allow if token matches configured CRON_SECRET or default secret (bypassing Admin JWT requirement)
  const isAuthorizedCron =
    Boolean(token) &&
    (token === configuredSecret || token === defaultSecret);

  if (isAuthorizedCron) {
    return cronCheckExpenseReminders(req as any, res);
  }

  // Otherwise, authenticate as an Admin user (e.g. manual scan from Admin Dashboard)
  return authenticateAdmin(req as any, res, () => {
    cronCheckExpenseReminders(req as any, res);
  });
});

// Admin-managed CRUD endpoints
router.use(authenticateAdmin);

router.get("/recipients", getExpenseReminderRecipients);
router.post("/recipients", addExpenseReminderRecipient);
router.delete("/recipients/:id", deleteExpenseReminderRecipient);
router.post("/recipients/test-now", sendTestEmailToAllRecipients);
router.post("/recipients/plan-test", togglePlanTestForNextCycle);

router.get("/logs", getExpenseReminderLogs);
router.get("/", getExpenseReminders);
router.post("/", createExpenseReminder);
router.put("/:id", updateExpenseReminder);
router.patch("/:id/renew", markAsRenewed);
router.delete("/:id", deleteExpenseReminder);
router.post("/:id/test-email", sendTestReminderEmail);
router.post("/:id/plan-test", togglePlanTestReminder);

export default router;

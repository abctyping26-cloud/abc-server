import { Router } from "express";
import {
  getWorkLogs,
  createOrAppendWorkLog,
  updateWorkTask,
  deleteWorkTask,
  assignWork,
  getAssignedWork,
  getPendingAssignedCount,
  completeAssignedWork,
  deleteAssignedWork,
} from "../controllers/workLog.controller.js";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// All work-log endpoints require authenticated admin
router.use(authenticateAdmin);

// Day work logs CRUD (Strictly anti-manipulation protected)
router.get("/", getWorkLogs);
router.post("/", createOrAppendWorkLog);
router.patch("/:id/task/:taskId", updateWorkTask);
router.delete("/:id/task/:taskId", deleteWorkTask);

// Assigned work endpoints
router.get("/pending-count", getPendingAssignedCount);
router.get("/assigned", getAssignedWork);
router.post("/assign", assignWork);
router.patch("/assigned/:id/complete", completeAssignedWork);
router.delete("/assigned/:id", deleteAssignedWork);

export default router;

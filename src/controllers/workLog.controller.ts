import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { WorkLog, AssignedWork, type IWorkSubTask } from "../models/workLog.model.js";
import { AdminUser } from "../models/adminUser.model.js";

/**
 * Helper to determine if current authenticated admin is Master Admin
 */
const isMasterAdmin = (admin?: AuthenticatedRequest["admin"]): boolean => {
  if (!admin) return false;
  return (
    admin.role === "master_admin" ||
    admin.role === "superadmin" ||
    admin.identifier?.toLowerCase() === "masteradmin@abc.com"
  );
};

/**
 * Format today's date as YYYY-MM-DD
 */
const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * GET /api/v1/admin/work-logs
 * Fetch work logs.
 * - Worker Admin: Gets ONLY their own work logs.
 * - Master Admin: Can view all work logs (Read-Only) or filter by ?adminId=...
 */
export const getWorkLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const isMaster = isMasterAdmin(admin);
    const { adminId, date, project, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (!isMaster) {
      // Worker admin can only see their own logs
      filter.adminId = admin.id;
    } else if (adminId && typeof adminId === "string" && adminId !== "all") {
      filter.adminId = adminId;
    }

    if (date && typeof date === "string" && date.trim()) {
      filter.date = date.trim();
    }

    if (project && typeof project === "string" && project !== "all") {
      filter["tasks.projectName"] = new RegExp(project.trim(), "i");
    }

    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { "tasks.workDone": regex },
        { "tasks.projectName": regex },
        { adminName: regex },
        { adminIdentifier: regex },
      ];
    }

    const logs = await WorkLog.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        logs,
        isMaster,
        currentAdminId: admin.id,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch work logs:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch work logs",
    });
  }
};

/**
 * POST /api/v1/admin/work-logs
 * Create a new day work log or append tasks to an existing day log.
 * Strictly binds to the authenticated admin's own ID.
 */
export const createOrAppendWorkLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { date, tasks } = req.body;
    const targetDate = (date && typeof date === "string" && date.trim()) ? date.trim() : getTodayString();

    if (!tasks || (!Array.isArray(tasks) && typeof tasks !== "object")) {
      res.status(400).json({
        success: false,
        message: "Tasks are required (must provide at least one task with projectName and workDone).",
      });
      return;
    }

    const normalizedTasks: IWorkSubTask[] = [];
    const rawList = Array.isArray(tasks) ? tasks : [tasks];

    for (const item of rawList) {
      const projectName = (item.projectName && typeof item.projectName === "string" ? item.projectName.trim() : "General") || "General";
      const workDone = item.workDone && typeof item.workDone === "string" ? item.workDone.trim() : "";
      if (workDone) {
        normalizedTasks.push({
          projectName,
          workDone,
          completedAt: new Date(),
        });
      }
    }

    if (normalizedTasks.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one valid work description is required.",
      });
      return;
    }

    // Resolve admin display name from database if possible
    let adminName = admin.identifier;
    try {
      const userDoc = await AdminUser.findById(admin.id).select("name identifier role");
      if (userDoc?.name) {
        adminName = userDoc.name;
      }
    } catch {
      // Use fallback identifier
    }

    // Check if a work log already exists for this admin on this date
    let workLog = await WorkLog.findOne({
      adminId: admin.id,
      date: targetDate,
    });

    if (workLog) {
      // Append tasks
      workLog.tasks.push(...normalizedTasks);
      workLog.adminName = adminName;
      await workLog.save();
    } else {
      // Create new day log
      workLog = await WorkLog.create({
        adminId: admin.id,
        adminIdentifier: admin.identifier,
        adminName,
        adminRole: admin.role || "worker_admin",
        date: targetDate,
        tasks: normalizedTasks,
      });
    }

    res.status(201).json({
      success: true,
      message: "Work log saved successfully",
      data: { workLog },
    });
  } catch (error: any) {
    console.error("❌ Failed to create work log:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create work log",
    });
  }
};

/**
 * PATCH /api/v1/admin/work-logs/:id/task/:taskId
 * Update a specific task inside a day's work log.
 * STRICT SECURITY: Master Admin CANNOT modify workers' records. Only the owner can edit.
 */
export const updateWorkTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id, taskId } = req.params;
    const { projectName, workDone } = req.body;

    const workLog = await WorkLog.findById(id);
    if (!workLog) {
      res.status(404).json({ success: false, message: "Work log not found" });
      return;
    }

    // STRICT ANTI-MANIPULATION RULE:
    // Even Master Admin cannot modify a worker's logged work!
    if (workLog.adminId.toString() !== admin.id) {
      res.status(403).json({
        success: false,
        message: "Security Protection: You cannot edit another admin's work records.",
      });
      return;
    }

    const task = workLog.tasks.find((t) => t._id?.toString() === taskId);
    if (!task) {
      res.status(404).json({ success: false, message: "Task not found in this day's log" });
      return;
    }

    if (projectName && typeof projectName === "string") {
      task.projectName = projectName.trim();
    }
    if (workDone && typeof workDone === "string") {
      task.workDone = workDone.trim();
    }

    await workLog.save();

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: { workLog },
    });
  } catch (error: any) {
    console.error("❌ Failed to update work task:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update work task",
    });
  }
};

/**
 * DELETE /api/v1/admin/work-logs/:id/task/:taskId
 * Delete a specific task inside a day's work log.
 * STRICT SECURITY: Master Admin CANNOT delete workers' records.
 */
export const deleteWorkTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id, taskId } = req.params;
    const workLog = await WorkLog.findById(id);
    if (!workLog) {
      res.status(404).json({ success: false, message: "Work log not found" });
      return;
    }

    // STRICT ANTI-MANIPULATION RULE:
    // Master Admin is explicitly forbidden from deleting workers' work logs.
    if (workLog.adminId.toString() !== admin.id) {
      res.status(403).json({
        success: false,
        message: "Security Protection: Master Admin or other users cannot delete worker records.",
      });
      return;
    }

    workLog.tasks = workLog.tasks.filter((t) => t._id?.toString() !== taskId);

    if (workLog.tasks.length === 0) {
      // If no tasks remain in this day, clean up the day document
      await WorkLog.findByIdAndDelete(id);
      res.status(200).json({
        success: true,
        message: "Day log deleted as all tasks were removed.",
        data: { deletedDay: true },
      });
      return;
    }

    await workLog.save();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: { workLog },
    });
  } catch (error: any) {
    console.error("❌ Failed to delete work task:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete work task",
    });
  }
};

/**
 * POST /api/v1/admin/work-logs/assign
 * Master Admin assigns work to a worker admin.
 */
export const assignWork = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!isMasterAdmin(admin)) {
      res.status(403).json({
        success: false,
        message: "Only Master Administrators can assign work to workers.",
      });
      return;
    }

    const { workerId, projectName, taskDescription } = req.body;

    if (!workerId || typeof workerId !== "string") {
      res.status(400).json({ success: false, message: "Please select a worker admin to assign work to." });
      return;
    }

    if (!taskDescription || typeof taskDescription !== "string" || !taskDescription.trim()) {
      res.status(400).json({ success: false, message: "Task description is required." });
      return;
    }

    const workerUser = await AdminUser.findById(workerId);
    if (!workerUser) {
      res.status(404).json({ success: false, message: "Selected worker not found." });
      return;
    }

    let masterName = admin.identifier;
    try {
      const masterUser = await AdminUser.findById(admin.id);
      if (masterUser?.name) masterName = masterUser.name;
    } catch {}

    const assigned = await AssignedWork.create({
      workerId: workerUser._id,
      workerIdentifier: workerUser.identifier,
      workerName: workerUser.name || workerUser.identifier,
      masterId: admin.id,
      masterName,
      projectName: (projectName && typeof projectName === "string" ? projectName.trim() : "General") || "General",
      taskDescription: taskDescription.trim(),
      status: "pending",
      assignedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Work successfully assigned to ${workerUser.name || workerUser.identifier}`,
      data: { assignedWork: assigned },
    });
  } catch (error: any) {
    console.error("❌ Failed to assign work:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign work",
    });
  }
};

/**
 * GET /api/v1/admin/work-logs/assigned
 * Fetch assigned work:
 * - Worker Admin: Gets work assigned to them.
 * - Master Admin: Gets work assigned to all workers.
 */
export const getAssignedWork = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const isMaster = isMasterAdmin(admin);
    const { status, workerId } = req.query;

    const filter: Record<string, unknown> = {};

    if (!isMaster) {
      filter.workerId = admin.id;
    } else if (workerId && typeof workerId === "string" && workerId !== "all") {
      filter.workerId = workerId;
    }

    if (status && typeof status === "string" && status !== "all") {
      filter.status = status;
    }

    const tasks = await AssignedWork.find(filter)
      .sort({ status: 1, assignedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch assigned work:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch assigned work",
    });
  }
};

/**
 * GET /api/v1/admin/work-logs/pending-count
 * Returns pending assigned tasks count (powers the orange dot in the sidebar).
 */
export const getPendingAssignedCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(200).json({ success: true, count: 0 });
      return;
    }

    const isMaster = isMasterAdmin(admin);

    if (isMaster) {
      // Master Admin sees company-wide pending assigned tasks count
      const count = await AssignedWork.countDocuments({ status: "pending" });
      res.status(200).json({ success: true, count, isMaster: true });
      return;
    }

    // Worker Admin sees their own pending assigned tasks count
    const count = await AssignedWork.countDocuments({
      workerId: admin.id,
      status: "pending",
    });

    res.status(200).json({ success: true, count, isMaster: false });
  } catch (error: any) {
    console.error("❌ Failed to fetch pending count:", error);
    res.status(200).json({ success: true, count: 0 });
  }
};

/**
 * PATCH /api/v1/admin/work-logs/assigned/:id/complete
 * Worker marks assigned task as completed.
 * Automatically appends the task into the worker's "Work Done" list for today!
 */
export const completeAssignedWork = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const assignedTask = await AssignedWork.findById(id);

    if (!assignedTask) {
      res.status(404).json({ success: false, message: "Assigned task not found" });
      return;
    }

    // Only the target worker (or Master Admin) can mark as completed
    const isMaster = isMasterAdmin(admin);
    if (!isMaster && assignedTask.workerId.toString() !== admin.id) {
      res.status(403).json({ success: false, message: "Not authorized to complete this task" });
      return;
    }

    assignedTask.status = "completed";
    assignedTask.completedAt = new Date();
    await assignedTask.save();

    // Automatically append to today's Work Done for this worker!
    const today = getTodayString();
    let workerName = assignedTask.workerName;
    try {
      const userDoc = await AdminUser.findById(assignedTask.workerId).select("name identifier role");
      if (userDoc?.name) workerName = userDoc.name;
    } catch {}

    let workLog = await WorkLog.findOne({
      adminId: assignedTask.workerId,
      date: today,
    });

    const newTaskItem: IWorkSubTask = {
      projectName: assignedTask.projectName || "General",
      workDone: assignedTask.taskDescription,
      completedAt: new Date(),
    };

    if (workLog) {
      workLog.tasks.push(newTaskItem);
      await workLog.save();
    } else {
      workLog = await WorkLog.create({
        adminId: assignedTask.workerId,
        adminIdentifier: assignedTask.workerIdentifier,
        adminName: workerName,
        adminRole: "worker_admin",
        date: today,
        tasks: [newTaskItem],
      });
    }

    res.status(200).json({
      success: true,
      message: "Task completed and added to today's Work Done!",
      data: {
        assignedTask,
        workLog,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to complete assigned task:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete task",
    });
  }
};

/**
 * DELETE /api/v1/admin/work-logs/assigned/:id
 * Master Admin deletes an assigned task (e.g. cancelled/withdrawn assignment).
 */
export const deleteAssignedWork = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;
    if (!admin || !isMasterAdmin(admin)) {
      res.status(403).json({ success: false, message: "Only Master Admin can delete assigned tasks." });
      return;
    }

    const { id } = req.params;
    await AssignedWork.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Assigned task deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Failed to delete assigned work:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete assigned work",
    });
  }
};

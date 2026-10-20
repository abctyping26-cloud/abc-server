import { Router } from "express";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  toggleClientCompleted,
  uploadClientFiles,
  deleteClientFile,
  uploadClientPhoto,
  deleteClient,
  addClientService,
  updateClientService,
  deleteClientService,
  uploadClientServiceFiles,
  deleteClientServiceFile,
} from "../controllers/clientAdmin.controller.js";
import {
  authenticateAdmin,
  requireDeletePermission,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// All client management routes require an authenticated admin
router.use(authenticateAdmin);

router.get("/", getClients);
router.post("/", createClient);
router.get("/:id", getClientById);
router.patch("/:id", updateClient);
router.patch("/:id/status", toggleClientCompleted);
router.delete("/:id", requireDeletePermission, deleteClient);

// Cloudinary file attachment and photo endpoints
router.post("/:id/files", upload.array("files", 10), uploadClientFiles);
router.delete("/:id/files/:fileId", requireDeletePermission, deleteClientFile);
router.post("/:id/photo", upload.single("photo"), uploadClientPhoto);

// Client Individual Services endpoints
router.post("/:id/services", addClientService);
router.patch("/:id/services/:serviceId", updateClientService);
router.delete("/:id/services/:serviceId", deleteClientService);
router.post("/:id/services/:serviceId/files", upload.array("files", 10), uploadClientServiceFiles);
router.delete("/:id/services/:serviceId/files/:fileId", deleteClientServiceFile);

export default router;

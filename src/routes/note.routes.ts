import { Router } from "express";
import {
  getNotes,
  createNote,
  updateNote,
  updateNotePosition,
  deleteNote,
  uploadNoteFiles,
  addNoteConnection,
  removeNoteConnection,
  searchConnectables,
} from "../controllers/note.controller.js";
import { authenticateAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// All note endpoints require an authenticated admin
router.use(authenticateAdmin);

// Notes collection CRUD
router.get("/", getNotes);
router.post("/", createNote);
router.get("/connectables", searchConnectables);

// Specific note operations
router.patch("/:id", updateNote);
router.patch("/:id/position", updateNotePosition);
router.delete("/:id", deleteNote);

// File uploads attached to note
router.post("/:id/files", upload.array("files", 10), uploadNoteFiles);

// Connections attached to note
router.post("/:id/connections", addNoteConnection);
router.delete("/:id/connections/:connId", removeNoteConnection);

export default router;

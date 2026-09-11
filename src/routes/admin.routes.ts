import { Router } from "express";
import { getAdminStatus } from "../controllers/admin.controller.js";
import { loginAdmin } from "../controllers/auth.controller.js";

const router = Router();

router.get("/ping", getAdminStatus);
router.post("/auth/login", loginAdmin);

export default router;

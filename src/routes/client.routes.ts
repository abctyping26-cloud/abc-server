import { Router } from "express";
import { getClientStatus } from "../controllers/client.controller.js";
import { loginCommercial } from "../controllers/auth.controller.js";

const router = Router();

router.get("/ping", getClientStatus);
router.post("/auth/login", loginCommercial);

export default router;

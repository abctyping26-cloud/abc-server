import { Router } from "express";
import healthRoutes from "./health.routes.js";
import clientRoutes from "./client.routes.js";
import adminRoutes from "./admin.routes.js";
import clientAdminRoutes from "./clientAdmin.routes.js";
import testRoutes from "./test.routes.js";
import whatsappRoutes from "./whatsapp.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/client", clientRoutes);
apiRouter.use("/admin/clients", clientAdminRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/test", testRoutes);
apiRouter.use("/whatsapp", whatsappRoutes);

export default apiRouter;

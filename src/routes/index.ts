import { Router } from "express";
import healthRoutes from "./health.routes.js";
import clientRoutes from "./client.routes.js";
import adminRoutes from "./admin.routes.js";
import testRoutes from "./test.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/client", clientRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/test", testRoutes);

export default apiRouter;

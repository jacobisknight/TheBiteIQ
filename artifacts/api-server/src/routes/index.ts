import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import healthIntegrationsRouter from "./health-integrations";
import accountRouter from "./account";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(healthIntegrationsRouter);
router.use(accountRouter);
router.use(billingRouter);

export default router;

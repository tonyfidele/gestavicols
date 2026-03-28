import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import farmsRouter from "./farms";
import batchesRouter from "./batches";
import salesRouter from "./sales";
import stockRouter from "./stock";
import expensesRouter from "./expenses";
import dashboardRouter from "./dashboard";
import auditRouter from "./audit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(farmsRouter);
router.use(batchesRouter);
router.use(salesRouter);
router.use(stockRouter);
router.use(expensesRouter);
router.use(dashboardRouter);
router.use(auditRouter);

export default router;

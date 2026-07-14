import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chamasRouter from "./chamas";
import membersRouter from "./members";
import contributionsRouter from "./contributions";
import loansRouter from "./loans";
import mpesaRouter from "./mpesa";
import invitationsRouter from "./invitations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chamasRouter);
router.use(membersRouter);
router.use(contributionsRouter);
router.use(loansRouter);
router.use(mpesaRouter);
router.use(invitationsRouter);

export default router;

import { Router } from "express";

import { AppDataSource } from "../../../shared/src/config/database";
import { createStudentAuthMiddleware } from "../../../shared/src/middleware/auth";
import { NotificationRepo } from "../repositories/NotificationRepo";
import { NotificationContextController } from "../controllers/NotificationContextController";
import { NotificationListController } from "../controllers/NotificationListController";

export const notificationsSystemFlowRouter = Router();

const notificationRepo = new NotificationRepo(AppDataSource);
const contextController = new NotificationContextController(notificationRepo);
const listController = new NotificationListController(notificationRepo);

const authMiddleware = createStudentAuthMiddleware((req) => req.studentContext ?? null);

notificationsSystemFlowRouter.get(
  "/notifications/:notificationId/context",
  authMiddleware,
  (req, res) => contextController.getContext(req, res)
);

notificationsSystemFlowRouter.get(
  "/notifications",
  authMiddleware,
  (req, res) => listController.list(req, res)
);

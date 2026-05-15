import { Router } from "express";
import type { DataSource } from "typeorm";

import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { BlockRepo } from "../../../safety-moderation/src/repositories/BlockRepo";
import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { NotificationRepo } from "../repositories/NotificationRepo";
import { NotificationContextController } from "../controllers/NotificationContextController";
import { NotificationListController } from "../controllers/NotificationListController";
import { BlockSuppressionService } from "../services/BlockSuppressionService";

export interface CreateNotificationsSystemFlowRoutesArgs {
  dataSource: DataSource;
  resolveStudentContext: StudentContextResolver;
}

export function createNotificationsSystemFlowRoutes(
  args: CreateNotificationsSystemFlowRoutesArgs
): Router {
  const router = Router();
  const notificationRepo = new NotificationRepo(args.dataSource);
  const activityRepo = args.dataSource.getRepository(Activity);
  const blockRepo = new BlockRepo(args.dataSource);
  const blockSuppressionService = new BlockSuppressionService(blockRepo);
  const contextController = new NotificationContextController(
    notificationRepo,
    activityRepo,
    blockSuppressionService
  );
  const listController = new NotificationListController(notificationRepo);
  const authMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);

  router.get(
    "/notifications/:notificationId/context",
    authMiddleware,
    async (req, res, next) => {
      try {
        await contextController.getContext(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/notifications", authMiddleware, async (req, res, next) => {
    try {
      await listController.list(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

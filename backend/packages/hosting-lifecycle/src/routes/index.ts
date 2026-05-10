import { Router } from "express";
import { DataSource } from "typeorm";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";
import { ActivityController } from "../controllers/ActivityController";

export function createHostingLifecycleRoutes(dataSource: DataSource): Router {
  const router = Router();

  const activityRepo = new ActivityRepo(dataSource);
  const activityLifecycleService = new ActivityLifecycleService(dataSource, activityRepo);
  const activityController = new ActivityController(activityLifecycleService);

  // POST /activities - Create a new activity
  router.post("/activities", activityController.createActivity);

  return router;
}
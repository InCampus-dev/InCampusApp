import { Router } from "express";
import { DataSource } from "typeorm";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";
import { ActivityController } from "../controllers/ActivityController";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";
import { JoinRequestController } from "../controllers/JoinRequestController";

export const hostingLifecycleRouter = Router();

export function createHostingLifecycleRoutes(dataSource: DataSource): Router {
  const activityRepo = new ActivityRepo(dataSource);
  const activityLifecycleService = new ActivityLifecycleService(dataSource, activityRepo);
  const activityController = new ActivityController(activityLifecycleService);
  
  const joinRequestService = new JoinRequestManagementService(dataSource);
  const joinRequestController = new JoinRequestController(joinRequestService);

  // POST /activities - Create a new activity
  hostingLifecycleRouter.post("/activities", activityController.createActivity);

  // Join Request Management
  hostingLifecycleRouter.get("/activities/:id/requests", joinRequestController.getRequests);
  hostingLifecycleRouter.patch("/activities/:id/requests/:requestId", joinRequestController.reviewRequest);

  return hostingLifecycleRouter;
}
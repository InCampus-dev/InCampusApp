import { Router } from "express";
import { DataSource } from "typeorm";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";
import { ActivityController } from "../controllers/ActivityController";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";
import { JoinRequestController } from "../controllers/JoinRequestController";

export interface CreateHostingLifecycleRoutesArgs {
  dataSource: DataSource;
  campusStructuredOptionLookup: CampusStructuredOptionLookup;
}

export function createHostingLifecycleRoutes(
  args: CreateHostingLifecycleRoutesArgs
): Router {
  const router = Router();
  const activityRepo = new ActivityRepo(args.dataSource);
  const activityLifecycleService = new ActivityLifecycleService(
    activityRepo,
    args.campusStructuredOptionLookup
  );
  const activityController = new ActivityController(activityLifecycleService);
  
  const joinRequestService = new JoinRequestManagementService(args.dataSource);
  const joinRequestController = new JoinRequestController(joinRequestService);

  router.post("/activities", activityController.createActivity);

  // Join Request Management
  router.get("/activities/:id/requests", joinRequestController.getRequests);
  router.patch("/activities/:id/requests/:requestId", joinRequestController.reviewRequest);

  return router;
}

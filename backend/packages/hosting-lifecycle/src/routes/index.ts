import { Router } from "express";
import { DataSource } from "typeorm";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { ActivityLifecycleService, ActivityEventDispatcherPort } from "../services/ActivityLifecycleService";
import { ActivityController } from "../controllers/ActivityController";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";
import { JoinRequestController } from "../controllers/JoinRequestController";

export interface CreateHostingLifecycleRoutesArgs {
  dataSource: DataSource;
  campusStructuredOptionLookup: CampusStructuredOptionLookup;
}

class StubActivityEventDispatcher implements ActivityEventDispatcherPort {
  async dispatch(eventName: string, payload: any): Promise<void> {
    console.log(`[EventBus Stub H&L] Emitted '${eventName}' with payload:`, payload);
  }
}

export function createHostingLifecycleRoutes(
  args: CreateHostingLifecycleRoutesArgs
): Router {
  const router = Router();
  const activityRepo = new ActivityRepo(args.dataSource);
  const eventDispatcher = new StubActivityEventDispatcher();
  
  const activityLifecycleService = new ActivityLifecycleService(
    activityRepo,
    args.campusStructuredOptionLookup,
    eventDispatcher
  );
  const activityController = new ActivityController(activityLifecycleService);
  
  const joinRequestService = new JoinRequestManagementService(args.dataSource);
  const joinRequestController = new JoinRequestController(joinRequestService);

  router.post("/activities", activityController.createActivity);
  router.patch("/activities/:id/status", activityController.updateStatus);
  router.delete("/activities/:id", activityController.deleteActivity);

  // Join Request Management
  router.get("/activities/:id/requests", joinRequestController.getRequests);
  router.patch("/activities/:id/requests/:requestId", joinRequestController.reviewRequest);

  return router;
}

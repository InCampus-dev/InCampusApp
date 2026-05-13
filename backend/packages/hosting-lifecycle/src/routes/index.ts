import { Router } from "express";
import { DataSource } from "typeorm";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { ActivityLifecycleService, ActivityEventDispatcherPort } from "../services/ActivityLifecycleService";
import { ActivityController } from "../controllers/ActivityController";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";
import { JoinRequestController } from "../controllers/JoinRequestController";

export interface CreateHostingLifecycleRoutesArgs {
  dataSource: DataSource;
  campusStructuredOptionLookup: CampusStructuredOptionLookup;
  resolveStudentContext: StudentContextResolver;
}

// Temporary placeholder until the shared event bus integration is wired.
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
  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);
  
  const activityLifecycleService = new ActivityLifecycleService(
    activityRepo,
    args.campusStructuredOptionLookup,
    eventDispatcher
  );
  const activityController = new ActivityController(activityLifecycleService);
  
  const joinRequestService = new JoinRequestManagementService(args.dataSource);
  const joinRequestController = new JoinRequestController(joinRequestService);

  router.post("/activities", studentAuthMiddleware, activityController.createActivity);
  router.patch("/activities/:id/status", studentAuthMiddleware, activityController.updateStatus);
  router.delete("/activities/:id", studentAuthMiddleware, activityController.deleteActivity);

  // Join Request Management
  router.get("/activities/:id/requests", studentAuthMiddleware, joinRequestController.getRequests);
  router.patch(
    "/activities/:id/requests/:requestId",
    studentAuthMiddleware,
    joinRequestController.reviewRequest
  );

  return router;
}

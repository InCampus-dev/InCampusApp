import { Router } from "express";
import { DataSource } from "typeorm";
import { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { InternalEventDispatcher } from "../../../shared/src/events/InternalEventDispatcher";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";
import { ActivityController } from "../controllers/ActivityController";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";
import { JoinRequestController } from "../controllers/JoinRequestController";
import { APApplicantProfileLookupAdapter } from "../services/APApplicantProfileLookupAdapter";

export interface CreateHostingLifecycleRoutesArgs {
  dataSource: DataSource;
  campusStructuredOptionLookup: CampusStructuredOptionLookup;
  resolveStudentContext: StudentContextResolver;
  eventDispatcher: InternalEventDispatcher;
}

export function createHostingLifecycleRoutes(
  args: CreateHostingLifecycleRoutesArgs
): Router {
  const router = Router();
  const activityRepo = new ActivityRepo(args.dataSource);
  const studentProfileRepo = new StudentProfileRepo(args.dataSource);
  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);
  
  const activityLifecycleService = new ActivityLifecycleService(
    activityRepo,
    args.campusStructuredOptionLookup,
    args.eventDispatcher
  );
  const activityController = new ActivityController(activityLifecycleService);
  
  const applicantProfileLookup = new APApplicantProfileLookupAdapter(
    studentProfileRepo
  );
  const joinRequestService = new JoinRequestManagementService(
    args.dataSource,
    args.eventDispatcher,
    applicantProfileLookup
  );
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

import { Router } from "express";
import { DataSource } from "typeorm";
import { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import { BlockRepo } from "../../../safety-moderation/src/repositories/BlockRepo";
import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { InternalEventDispatcher } from "../../../shared/src/events/InternalEventDispatcher";
import { FeedService } from "../services/FeedService";
import { ActivityDetailService } from "../services/ActivityDetailService";
import { JoinService } from "../services/JoinService";
import { WithdrawLeaveService } from "../services/WithdrawLeaveService";
import { PersonalListService } from "../services/PersonalListService";
import { DiscoveryController } from "../controllers/DiscoveryController";
import { ParticipationController } from "../controllers/ParticipationController";
import { APHostProfileLookupAdapter } from "../services/APHostProfileLookupAdapter";
import { SMBlockLookupAdapter } from "../services/SMBlockLookupAdapter";

export const discoveryParticipationRouter = Router();

export interface CreateDiscoveryParticipationRoutesArgs {
  dataSource: DataSource;
  resolveStudentContext: StudentContextResolver;
  eventDispatcher: InternalEventDispatcher;
}

export function createDiscoveryParticipationRoutes(
  args: CreateDiscoveryParticipationRoutesArgs
): Router {
  const router = Router();
  const blockLookup = new SMBlockLookupAdapter(new BlockRepo(args.dataSource));
  const hostProfileLookup = new APHostProfileLookupAdapter(
    new StudentProfileRepo(args.dataSource)
  );
  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);

  const feedService = new FeedService(args.dataSource, blockLookup);
  const activityDetailService = new ActivityDetailService(
    args.dataSource,
    blockLookup,
    hostProfileLookup
  );
  const joinService = new JoinService(args.dataSource, blockLookup, args.eventDispatcher);
  const withdrawLeaveService = new WithdrawLeaveService(args.dataSource, args.eventDispatcher);
  const personalListService = new PersonalListService(args.dataSource);

  const discoveryController = new DiscoveryController(feedService, activityDetailService);
  const participationController = new ParticipationController(
    joinService,
    withdrawLeaveService,
    personalListService
  );

  router.get("/activities", studentAuthMiddleware, discoveryController.getFeed);
  router.get("/activities/:id", studentAuthMiddleware, discoveryController.getActivityDetails);
  router.get(
    "/activities/:id/profiles/:studentAccountId",
    studentAuthMiddleware,
    discoveryController.getActivityContextPublicProfile
  );
  router.post("/activities/:id/join", studentAuthMiddleware, participationController.joinActivity);
  router.delete(
    "/activities/:id/requests/me",
    studentAuthMiddleware,
    participationController.withdrawRequest
  );
  router.delete(
    "/activities/:id/participants/me",
    studentAuthMiddleware,
    participationController.leaveActivity
  );
  router.get(
    "/profiles/me/activities",
    studentAuthMiddleware,
    participationController.getPersonalActivities
  );

  return router;
}

import { Router } from "express";
import { DataSource } from "typeorm";
import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { FeedService, BlockLookupPort } from "../services/FeedService";
import { ActivityDetailService, HostProfileLookupPort } from "../services/ActivityDetailService";
import { JoinService, EventDispatcherPort } from "../services/JoinService";
import { WithdrawLeaveService } from "../services/WithdrawLeaveService";
import { PersonalListService } from "../services/PersonalListService";
import { DiscoveryController } from "../controllers/DiscoveryController";
import { ParticipationController } from "../controllers/ParticipationController";
import { StudentProfileDto } from "../../../shared/src/domain/dtos";
import { StudentProfileGender } from "../../../shared/src/domain/enums";

/**
 * @deprecated Not intended for app composition. Use createDiscoveryParticipationRoutes(...) instead.
 */
export const discoveryParticipationRouter = Router();

export interface CreateDiscoveryParticipationRoutesArgs {
  dataSource: DataSource;
  resolveStudentContext: StudentContextResolver;
}

// Temporary placeholder until the SM-owned block lookup is integrated.
class StubBlockLookup implements BlockLookupPort {
  async getBlockedAndBlockerIds(_studentAccountId: string): Promise<string[]> {
    return [];
  }
}

// Temporary placeholder until the AP-owned host profile lookup is integrated.
class StubHostProfileLookup implements HostProfileLookupPort {
  async getProfile(studentAccountId: string): Promise<StudentProfileDto | null> {
    return {
      profileId: "stub-profile-id",
      studentAccountId,
      displayName: "Host Student",
      major: "Undeclared",
      dateOfBirth: null,
      gender: StudentProfileGender.PreferNotToSay,
      interests: [],
      languages: [],
      shortBio: null,
      createdAt: new Date(0).toISOString(),
      updatedAt: null
    };
  }
}

// Temporary placeholder until the shared event bus integration is wired.
class StubEventDispatcher implements EventDispatcherPort {
  async dispatch(eventName: string, payload: any): Promise<void> {
    console.log(`[EventBus Stub] Emitted '${eventName}' with payload:`, payload);
  }
}

export function createDiscoveryParticipationRoutes(
  args: CreateDiscoveryParticipationRoutesArgs
): Router {
  const router = Router();
  const blockLookup = new StubBlockLookup();
  const hostProfileLookup = new StubHostProfileLookup();
  const eventDispatcher = new StubEventDispatcher();
  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);

  const feedService = new FeedService(args.dataSource, blockLookup);
  const activityDetailService = new ActivityDetailService(
    args.dataSource,
    blockLookup,
    hostProfileLookup
  );
  const joinService = new JoinService(args.dataSource, blockLookup, eventDispatcher);
  const withdrawLeaveService = new WithdrawLeaveService(args.dataSource, eventDispatcher);
  const personalListService = new PersonalListService(args.dataSource);

  const discoveryController = new DiscoveryController(feedService, activityDetailService);
  const participationController = new ParticipationController(
    joinService,
    withdrawLeaveService,
    personalListService
  );

  router.get("/activities", studentAuthMiddleware, discoveryController.getFeed);
  router.get("/activities/:id", studentAuthMiddleware, discoveryController.getActivityDetails);
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

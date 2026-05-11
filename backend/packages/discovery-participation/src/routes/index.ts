import { Router } from "express";
import { DataSource } from "typeorm";
import { FeedService, BlockLookupPort } from "../services/FeedService";
import { ActivityDetailService, HostProfileLookupPort } from "../services/ActivityDetailService";
import { JoinService, EventDispatcherPort } from "../services/JoinService";
import { WithdrawLeaveService } from "../services/WithdrawLeaveService";
import { PersonalListService } from "../services/PersonalListService";
import { DiscoveryController } from "../controllers/DiscoveryController";
import { ParticipationController } from "../controllers/ParticipationController";
import { StudentProfileDto } from "../../../shared/src/domain/dtos";

export const discoveryParticipationRouter = Router();

// Temporary stub for BlockLookupPort until SM module is ready
class StubBlockLookup implements BlockLookupPort {
  async getBlockedAndBlockerIds(_studentAccountId: string): Promise<string[]> {
    return []; // Return empty list: no users are blocked in alpha testing yet
  }
}

// Temporary stub for HostProfileLookupPort until AP module is ready
class StubHostProfileLookup implements HostProfileLookupPort {
  async getProfile(studentAccountId: string): Promise<StudentProfileDto | null> {
    return {
      profileId: "stub-profile-id",
      studentAccountId,
      displayName: "Host Student",
    };
  }
}

// Temporary stub for EventDispatcherPort until shared EventBus is integrated
class StubEventDispatcher implements EventDispatcherPort {
  async dispatch(eventName: string, payload: any): Promise<void> {
    console.log(`[EventBus Stub] Emitted '${eventName}' with payload:`, payload);
  }
}

export function createDiscoveryParticipationRoutes(dataSource: DataSource): Router {
  const blockLookup = new StubBlockLookup();
  const hostProfileLookup = new StubHostProfileLookup();
  const eventDispatcher = new StubEventDispatcher();
  
  const feedService = new FeedService(dataSource, blockLookup);
  const activityDetailService = new ActivityDetailService(dataSource, blockLookup, hostProfileLookup);
  const joinService = new JoinService(dataSource, blockLookup, eventDispatcher);
  const withdrawLeaveService = new WithdrawLeaveService(dataSource, eventDispatcher);
  const personalListService = new PersonalListService(dataSource);
  
  const discoveryController = new DiscoveryController(feedService, activityDetailService);
  const participationController = new ParticipationController(joinService, withdrawLeaveService, personalListService);

  discoveryParticipationRouter.get("/activities", discoveryController.getFeed);
  discoveryParticipationRouter.get("/activities/:id", discoveryController.getActivityDetails);
  discoveryParticipationRouter.post("/activities/:id/join", participationController.joinActivity);
  discoveryParticipationRouter.delete("/activities/:id/join", participationController.withdrawOrLeaveActivity);
  discoveryParticipationRouter.get("/profiles/me/activities", participationController.getPersonalActivities);

  return discoveryParticipationRouter;
}
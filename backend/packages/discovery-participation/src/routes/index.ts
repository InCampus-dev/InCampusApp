import { Router } from "express";
import { DataSource } from "typeorm";
import { FeedService, BlockLookupPort } from "../services/FeedService";
import { ActivityDetailService, HostProfileLookupPort } from "../services/ActivityDetailService";
import { DiscoveryController } from "../controllers/DiscoveryController";
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

export function createDiscoveryParticipationRoutes(dataSource: DataSource): Router {
  const blockLookup = new StubBlockLookup();
  const hostProfileLookup = new StubHostProfileLookup();
  
  const feedService = new FeedService(dataSource, blockLookup);
  const activityDetailService = new ActivityDetailService(dataSource, blockLookup, hostProfileLookup);
  
  const discoveryController = new DiscoveryController(feedService, activityDetailService);

  discoveryParticipationRouter.get("/activities", discoveryController.getFeed);
  discoveryParticipationRouter.get("/activities/:id", discoveryController.getActivityDetails);

  return discoveryParticipationRouter;
}
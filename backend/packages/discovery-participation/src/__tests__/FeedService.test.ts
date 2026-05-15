import { vi, describe, beforeEach, it, expect } from "vitest";

import type { BlockRelationship } from "../../../safety-moderation/src/entities/BlockRelationship";
import { ActivityStatus } from "../../../shared/src/domain/enums";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { FeedService, BlockLookupPort } from "../services/FeedService";
import { SMBlockLookupAdapter } from "../services/SMBlockLookupAdapter";

describe("FeedService (DP07)", () => {
  let feedService: FeedService;
  let mockBlockLookup: BlockLookupPort;
  let mockDataSource: any;
  let mockQueryBuilder: any;
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([])
    };

    mockRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder)
    };

    mockDataSource = {
      getRepository: vi.fn().mockReturnValue(mockRepository)
    };

    mockBlockLookup = {
      getBlockedAndBlockerIds: vi.fn().mockResolvedValue([])
    };

    feedService = new FeedService(mockDataSource, mockBlockLookup);
  });

  it("should fetch activities for a given campus that are Open and in the future", async () => {
    const mockActivities = [{ activityId: "act-1" }, { activityId: "act-2" }];
    mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

    const result = await feedService.getActivities("student-1", "campus-abc");

    expect(result).toEqual(mockActivities);
    expect(mockDataSource.getRepository).toHaveBeenCalledWith(Activity);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("activity");
    expect(mockQueryBuilder.where).toHaveBeenCalledWith("activity.campusId = :campusId", {
      campusId: "campus-abc"
    });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("activity.status = :status", {
      status: ActivityStatus.Open
    });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      "activity.scheduledDateTime > :now",
      expect.any(Object)
    );
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("activity.scheduledDateTime", "ASC");
  });

  it("should apply category filter if provided", async () => {
    await feedService.getActivities("student-1", "campus-abc", { categoryId: "cat-1" });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      "activity.categoryId = :categoryId",
      { categoryId: "cat-1" }
    );
  });

  it("should apply block suppression by excluding activities hosted by blocked users", async () => {
    mockBlockLookup.getBlockedAndBlockerIds = vi.fn().mockResolvedValue(["blocked-user-1"]);
    await feedService.getActivities("student-1", "campus-abc");

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      "activity.hostAccountId NOT IN (:...blockedIds)",
      { blockedIds: ["blocked-user-1"] }
    );
  });

  it("uses real SM block data from both directions and deduplicates counterpart ids", async () => {
    const blockLookup = new SMBlockLookupAdapter({
      find: vi.fn().mockResolvedValue([
        createBlockRelationship({
          initiatorAccountId: "student-1",
          blockedAccountId: "host-1"
        }),
        createBlockRelationship({
          blockId: "block-002",
          initiatorAccountId: "host-1",
          blockedAccountId: "student-1"
        })
      ])
    } as any);
    const service = new FeedService(mockDataSource, blockLookup);

    await service.getActivities("student-1", "campus-abc");

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      "activity.hostAccountId NOT IN (:...blockedIds)",
      { blockedIds: ["host-1"] }
    );
  });
});

function createBlockRelationship(
  overrides: Partial<BlockRelationship> = {}
): BlockRelationship {
  return {
    blockId: "block-001",
    initiatorAccountId: "student-1",
    blockedAccountId: "host-1",
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  } as BlockRelationship;
}

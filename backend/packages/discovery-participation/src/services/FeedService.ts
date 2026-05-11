import { DataSource } from "typeorm";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { ActivityStatus } from "../../../shared/src/domain/enums";

// Interface to interact with Safety & Moderation (SM) without tight coupling
export interface BlockLookupPort {
  getBlockedAndBlockerIds(studentAccountId: string): Promise<string[]>;
}

export class FeedService {
  constructor(
    private dataSource: DataSource,
    private blockLookup: BlockLookupPort
  ) {}

  async getActivities(
    studentAccountId: string,
    campusId: string,
    filters?: { categoryId?: string }
  ): Promise<Activity[]> {
    // 1. Fetch blocked users to hide their activities from the feed (Rule 9.4)
    const blockedIds = await this.blockLookup.getBlockedAndBlockerIds(studentAccountId);

    const activityRepo = this.dataSource.getRepository(Activity);
    
    // 2. Base query: same campus, only "Open" status, scheduled in the future
    const query = activityRepo.createQueryBuilder("activity")
      .where("activity.campusId = :campusId", { campusId })
      .andWhere("activity.status = :status", { status: ActivityStatus.Open })
      .andWhere("activity.scheduledDateTime > :now", { now: new Date() });

    // 3. Optional filtering (e.g. by Category)
    if (filters?.categoryId) {
      query.andWhere("activity.categoryId = :categoryId", { categoryId: filters.categoryId });
    }

    // 4. Block suppression: exclude activities hosted by blocked/blocker users
    if (blockedIds.length > 0) {
      query.andWhere("activity.hostAccountId NOT IN (:...blockedIds)", { blockedIds });
    }

    return await query.orderBy("activity.scheduledDateTime", "ASC").getMany();
  }
}
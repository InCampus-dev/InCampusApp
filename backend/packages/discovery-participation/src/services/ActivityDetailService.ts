import { DataSource } from "typeorm";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { BlockLookupPort } from "./FeedService";
import { StudentProfileDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";

// Interface to fetch the host's minimal profile from the Access & Profile (AP) module
export interface HostProfileLookupPort {
  getProfile(studentAccountId: string): Promise<StudentProfileDto | null>;
}

export class ActivityDetailService {
  constructor(
    private dataSource: DataSource,
    private blockLookup: BlockLookupPort,
    private hostProfileLookup: HostProfileLookupPort
  ) {}

  async getActivityDetails(studentAccountId: string, campusId: string, activityId: string) {
    const activityRepo = this.dataSource.getRepository(Activity);
    
    const activity = await activityRepo.findOne({ where: { activityId } });
    if (!activity) {
      throw AppError.notFound("Activity", activityId);
    }

    if (activity.campusId !== campusId) {
      throw AppError.notFound("Activity", activityId); // Cross-campus isolation
    }

    // Rule 9.4: Blocked users cannot open each other's activity details
    const blockedIds = await this.blockLookup.getBlockedAndBlockerIds(studentAccountId);
    if (blockedIds.includes(activity.hostAccountId)) {
      throw AppError.notFound("Activity", activityId); // Return 404 to avoid exposing block state
    }

    const hostProfile = await this.hostProfileLookup.getProfile(activity.hostAccountId);

    return { ...activity, hostProfile: hostProfile || undefined };
  }
}
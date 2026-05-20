import { DataSource } from "typeorm";
import { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import { BlockLookupPort } from "./FeedService";
import { PublicStudentProfileDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import {
  ParticipationMode,
  ParticipationRecordType,
  ParticipationStatus
} from "../../../shared/src/domain/enums";
import { mapStudentProfileToPublicDto } from "./APHostProfileLookupAdapter";

// Interface to fetch the host's minimal profile from the Access & Profile (AP) module
export interface HostProfileLookupPort {
  getProfile(studentAccountId: string): Promise<PublicStudentProfileDto | null>;
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
    const relationship = await this.getRelationshipMetadata(activity, studentAccountId);

    return {
      ...activity,
      hostProfile: hostProfile || undefined,
      canManageRequests:
        activity.hostAccountId === studentAccountId &&
        activity.participationMode === ParticipationMode.ApprovalBased,
      ...relationship
    };
  }

  public async getActivityContextPublicProfile(
    studentAccountId: string,
    campusId: string,
    activityId: string,
    targetStudentAccountId: string
  ): Promise<PublicStudentProfileDto> {
    const activityRepo = this.dataSource.getRepository(Activity);
    const activity = await activityRepo.findOne({ where: { activityId } });

    if (!activity || activity.campusId !== campusId) {
      throw AppError.notFound("Activity", activityId);
    }

    if (activity.hostAccountId !== targetStudentAccountId) {
      throw AppError.notFound("StudentProfile", targetStudentAccountId);
    }

    const blockedIds = await this.blockLookup.getBlockedAndBlockerIds(studentAccountId);
    if (blockedIds.includes(targetStudentAccountId)) {
      throw AppError.notFound("StudentProfile", targetStudentAccountId);
    }

    const studentProfileRepo = this.dataSource.getRepository(StudentProfile);
    const targetProfile = await studentProfileRepo.findOne({
      where: { studentAccountId: targetStudentAccountId }
    });

    if (!targetProfile) {
      throw AppError.notFound("StudentProfile", targetStudentAccountId);
    }

    return mapStudentProfileToPublicDto(targetProfile);
  }

  private async getRelationshipMetadata(activity: Activity, studentAccountId: string) {
    if (activity.hostAccountId === studentAccountId) {
      return {
        personalActivityStatus: "host" as const
      };
    }

    const participationRepo = this.dataSource.getRepository(Participation);
    const participation = await participationRepo.findOne({
      where: [
        {
          activityId: activity.activityId,
          studentAccountId,
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending
        },
        {
          activityId: activity.activityId,
          studentAccountId,
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Confirmed
        }
      ]
    });

    if (!participation) {
      return {};
    }

    return {
      personalActivityStatus:
        participation.recordType === ParticipationRecordType.Request
          ? ("pending_request" as const)
          : ("confirmed_participant" as const),
      participationId: participation.participationId,
      participationRecordType: participation.recordType,
      participationStatus: participation.status
    };
  }
}

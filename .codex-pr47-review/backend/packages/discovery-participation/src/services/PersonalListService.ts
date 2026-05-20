import { DataSource } from "typeorm";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import type { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import {
  ParticipationRecordType,
  ParticipationStatus
} from "../../../shared/src/domain/enums";

export type PersonalActivityRelationship =
  | "host"
  | "pending_request"
  | "confirmed_participant";

export type PersonalActivityListItem = Activity & {
  personalActivityStatus: PersonalActivityRelationship;
  participationId?: string;
  participationRecordType?: ParticipationRecordType;
  participationStatus?: ParticipationStatus;
};

export class PersonalListService {
  constructor(private dataSource: DataSource) {}

  async getPersonalActivities(
    studentAccountId: string,
    campusId: string
  ): Promise<PersonalActivityListItem[]> {
    const activityRepo = this.dataSource.getRepository(Activity);

    const activities = await activityRepo.createQueryBuilder("activity")
      .leftJoinAndSelect(
        "activity.participations",
        "participation",
        "participation.studentAccountId = :studentAccountId AND participation.status IN (:...statuses)",
        {
          studentAccountId,
          statuses: [ParticipationStatus.Pending, ParticipationStatus.Confirmed]
        }
      )
      .where("activity.campusId = :campusId", { campusId })
      .andWhere(
        "(activity.hostAccountId = :studentAccountId OR participation.participationId IS NOT NULL)",
        { studentAccountId }
      )
      .orderBy("activity.scheduledDateTime", "ASC")
      .getMany();

    return activities.map((activity) =>
      toPersonalActivityListItem(activity, studentAccountId)
    );
  }
}

function toPersonalActivityListItem(
  activity: Activity,
  studentAccountId: string
): PersonalActivityListItem {
  const participation = activity.participations?.find(
    (candidate: Participation) =>
      candidate.studentAccountId === studentAccountId &&
      (candidate.status === ParticipationStatus.Pending ||
        candidate.status === ParticipationStatus.Confirmed)
  );

  if (activity.hostAccountId === studentAccountId) {
    return {
      ...activity,
      personalActivityStatus: "host"
    };
  }

  return {
    ...activity,
    personalActivityStatus:
      participation?.status === ParticipationStatus.Pending
        ? "pending_request"
        : "confirmed_participant",
    ...(participation
      ? {
          participationId: participation.participationId,
          participationRecordType: participation.recordType,
          participationStatus: participation.status
        }
      : {})
  };
}

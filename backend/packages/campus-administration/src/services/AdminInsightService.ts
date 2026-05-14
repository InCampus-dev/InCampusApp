import { In } from "typeorm";

import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import type { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import type { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import type { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import type { ParticipationRepo } from "../../../hosting-lifecycle/src/repositories/ParticipationRepo";
import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import type {
  CampusId,
  ConsentBasedStudentHostedActivityDto,
  ConsentBasedStudentInsightDto,
  ConsentBasedStudentInsightProfileDto,
  ConsentBasedStudentInsightStudentDto,
  ConsentBasedStudentParticipationDto
} from "../../../shared/src/domain/dtos";
import type { CampusAuthorizationService } from "./CampusAuthorizationService";

export class AdminInsightService {
  constructor(
    private readonly studentAccountRepo: StudentAccountRepo,
    private readonly studentProfileRepo: StudentProfileRepo,
    private readonly activityRepo: ActivityRepo,
    private readonly participationRepo: ParticipationRepo,
    private readonly campusAuthorizationService: CampusAuthorizationService
  ) {}

  public async listCampusStudentInsights(
    adminContext: AuthenticatedAdminContext,
    campusId: CampusId,
    _query?: Record<string, unknown>
  ): Promise<ConsentBasedStudentInsightDto> {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);

    const eligibleAccounts = await this.studentAccountRepo.find({
      where: {
        selectedCampusId: campusId,
        campusInsightSharingConsent: true
      },
      order: {
        createdAt: "ASC"
      }
    });

    if (eligibleAccounts.length === 0) {
      return {
        campusId,
        students: []
      };
    }

    const studentAccountIds = eligibleAccounts.map((account) => account.studentAccountId);

    const [profiles, hostedActivities, participations] = await Promise.all([
      this.studentProfileRepo.find({
        where: {
          studentAccountId: In(studentAccountIds)
        }
      }),
      this.activityRepo.find({
        where: {
          campusId,
          hostAccountId: In(studentAccountIds)
        },
        order: {
          scheduledDateTime: "ASC"
        }
      }),
      this.participationRepo
        .createQueryBuilder("participation")
        .leftJoinAndSelect("participation.activity", "activity")
        .where("participation.studentAccountId IN (:...studentAccountIds)", {
          studentAccountIds
        })
        .andWhere("activity.campusId = :campusId", { campusId })
        .orderBy("participation.createdAt", "DESC")
        .getMany()
    ]);

    const profilesByStudentAccountId = new Map<string, StudentProfile>();
    for (const profile of profiles) {
      profilesByStudentAccountId.set(profile.studentAccountId, profile);
    }

    const hostedActivitiesByStudentAccountId = groupActivitiesByHost(hostedActivities);
    const participationsByStudentAccountId = groupParticipationsByStudent(
      participations,
      campusId
    );

    const students: ConsentBasedStudentInsightStudentDto[] = eligibleAccounts.map((account) => ({
      studentAccountId: account.studentAccountId,
      profile: toInsightProfileDto(profilesByStudentAccountId.get(account.studentAccountId) ?? null),
      hostedActivities: (hostedActivitiesByStudentAccountId.get(account.studentAccountId) ?? []).map(
        toHostedActivityDto
      ),
      participations: (
        participationsByStudentAccountId.get(account.studentAccountId) ?? []
      ).map(toParticipationDto)
    }));

    return {
      campusId,
      students
    };
  }
}

function groupActivitiesByHost(activities: Activity[]): Map<string, Activity[]> {
  const activitiesByHost = new Map<string, Activity[]>();

  for (const activity of activities) {
    const hostedActivities = activitiesByHost.get(activity.hostAccountId) ?? [];
    hostedActivities.push(activity);
    activitiesByHost.set(activity.hostAccountId, hostedActivities);
  }

  return activitiesByHost;
}

function groupParticipationsByStudent(
  participations: Participation[],
  campusId: CampusId
): Map<string, Participation[]> {
  const participationsByStudent = new Map<string, Participation[]>();

  for (const participation of participations) {
    if (!participation.activity || participation.activity.campusId !== campusId) {
      continue;
    }

    const studentParticipations = participationsByStudent.get(participation.studentAccountId) ?? [];
    studentParticipations.push(participation);
    participationsByStudent.set(participation.studentAccountId, studentParticipations);
  }

  return participationsByStudent;
}

function toInsightProfileDto(
  profile: StudentProfile | null
): ConsentBasedStudentInsightProfileDto | null {
  if (!profile) {
    return null;
  }

  return {
    displayName: profile.displayName,
    major: profile.major,
    interests: profile.interests
  };
}

function toHostedActivityDto(activity: Activity): ConsentBasedStudentHostedActivityDto {
  return {
    activityId: activity.activityId,
    title: activity.title,
    categoryLabel: activity.categoryLabel,
    scheduledDateTime: activity.scheduledDateTime.toISOString(),
    status: activity.status
  };
}

function toParticipationDto(participation: Participation): ConsentBasedStudentParticipationDto {
  return {
    participationId: participation.participationId,
    activityId: participation.activityId,
    activityTitle: participation.activity.title,
    recordType: participation.recordType,
    status: participation.status,
    createdAt: participation.createdAt.toISOString()
  };
}

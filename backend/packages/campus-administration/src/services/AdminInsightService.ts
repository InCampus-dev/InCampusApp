import { In } from "typeorm";

import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import type { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import type { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import type { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import type { ParticipationRepo } from "../../../hosting-lifecycle/src/repositories/ParticipationRepo";
import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import {
  normalizeCampusInsightConsentSettings
} from "../../../shared/src/domain/campusInsightConsent";
import type {
  AdminVisibleConsentSettingsDto,
  CampusId,
  CampusInsightConsentSettingsDto,
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

    const [insightEligibleAccounts, studentsWithoutInsightsEnabledCount] = await Promise.all([
      this.studentAccountRepo.find({
        where: {
          selectedCampusId: campusId,
          campusInsightSharingConsent: true
        },
        order: {
          createdAt: "ASC"
        }
      }),
      this.studentAccountRepo.count({
        where: {
          selectedCampusId: campusId,
          campusInsightSharingConsent: false
        }
      })
    ]);

    if (insightEligibleAccounts.length === 0) {
      return {
        campusId,
        studentsWithoutInsightsEnabledCount,
        students: []
      };
    }

    const consentSettingsByStudentAccountId = new Map<string, CampusInsightConsentSettingsDto>();
    const profileEligibleStudentAccountIds: string[] = [];
    const activityEligibleStudentAccountIds: string[] = [];

    for (const account of insightEligibleAccounts) {
      const settings = normalizeCampusInsightConsentSettings(
        account.campusInsightConsentSettings,
        account.campusInsightSharingConsent
      );
      consentSettingsByStudentAccountId.set(account.studentAccountId, settings);
      if (settings.basicInsightsEnabled) profileEligibleStudentAccountIds.push(account.studentAccountId);
      if (settings.activityInsightsEnabled) activityEligibleStudentAccountIds.push(account.studentAccountId);
    }

    const [profiles, hostedActivities, participations] = await Promise.all([
      profileEligibleStudentAccountIds.length > 0
        ? this.studentProfileRepo.find({
            where: {
              studentAccountId: In(profileEligibleStudentAccountIds)
            }
          })
        : [],
      activityEligibleStudentAccountIds.length > 0
        ? this.activityRepo.find({
            where: {
              campusId,
              hostAccountId: In(activityEligibleStudentAccountIds)
            },
            order: {
              scheduledDateTime: "ASC"
            }
          })
        : [],
      activityEligibleStudentAccountIds.length > 0
        ? this.participationRepo
            .createQueryBuilder("participation")
            .leftJoinAndSelect("participation.activity", "activity")
            .where("participation.studentAccountId IN (:...studentAccountIds)", {
              studentAccountIds: activityEligibleStudentAccountIds
            })
            .andWhere("activity.campusId = :campusId", { campusId })
            .orderBy("participation.createdAt", "DESC")
            .getMany()
        : []
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

    const students: ConsentBasedStudentInsightStudentDto[] = insightEligibleAccounts.map(
      (account) => {
        const settings = consentSettingsByStudentAccountId.get(account.studentAccountId)!;

        return {
          studentAccountId: account.studentAccountId,
          consentSettings: toAdminVisibleConsentSettings(settings),
          profile: settings.basicInsightsEnabled
            ? toInsightProfileDto(
                profilesByStudentAccountId.get(account.studentAccountId) ?? null
              )
            : null,
          hostedActivities: settings.activityInsightsEnabled
            ? (hostedActivitiesByStudentAccountId.get(account.studentAccountId) ?? [])
                .filter((activity) => isActivityAllowedByConsent(activity, settings))
                .map(toHostedActivityDto)
            : [],
          participations: settings.activityInsightsEnabled
            ? (participationsByStudentAccountId.get(account.studentAccountId) ?? [])
                .filter((participation) =>
                  isActivityAllowedByConsent(participation.activity, settings)
                )
                .map(toParticipationDto)
            : []
        };
      }
    );

    return {
      campusId,
      studentsWithoutInsightsEnabledCount,
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

function toAdminVisibleConsentSettings(
  settings: CampusInsightConsentSettingsDto
): AdminVisibleConsentSettingsDto {
  return {
    basicInsightsEnabled: settings.basicInsightsEnabled,
    activityInsightsEnabled: settings.activityInsightsEnabled,
    hasHiddenActivityCategories: settings.hiddenActivityCategoryIds.length > 0,
    excludeCoParticipants: settings.excludeCoParticipants
  };
}

function isActivityAllowedByConsent(
  activity: Activity | undefined,
  settings: CampusInsightConsentSettingsDto
): boolean {
  if (!activity) {
    return false;
  }

  return !settings.hiddenActivityCategoryIds.includes(activity.categoryId);
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

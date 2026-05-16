import type { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";

import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import {
  ActivityStatus,
  GenderPreference,
  ParticipationMode,
  ParticipationRecordType,
  ParticipationStatus
} from "../../../shared/src/domain/enums";
import { PersonalListService } from "../services/PersonalListService";

describe("PersonalListService", () => {
  it("returns activities created by the user as host", async () => {
    const { service } = createService([
      createActivity({
        activityId: "activity-hosted",
        hostAccountId: "student-001"
      })
    ]);

    const result = await service.getPersonalActivities("student-001", "campus-001");

    expect(result).toEqual([
      expect.objectContaining({
        activityId: "activity-hosted",
        personalActivityStatus: "host"
      })
    ]);
  });

  it("returns activities where the user has a pending request", async () => {
    const { service } = createService([
      createActivity({
        activityId: "activity-pending",
        hostAccountId: "host-001",
        participations: [
          createParticipation({
            participationId: "request-001",
            activityId: "activity-pending",
            studentAccountId: "student-001",
            recordType: ParticipationRecordType.Request,
            status: ParticipationStatus.Pending
          })
        ]
      })
    ]);

    const result = await service.getPersonalActivities("student-001", "campus-001");

    expect(result).toEqual([
      expect.objectContaining({
        activityId: "activity-pending",
        personalActivityStatus: "pending_request",
        participationId: "request-001",
        participationRecordType: ParticipationRecordType.Request,
        participationStatus: ParticipationStatus.Pending
      })
    ]);
  });

  it("returns activities where the user is a confirmed participant", async () => {
    const { service } = createService([
      createActivity({
        activityId: "activity-confirmed",
        hostAccountId: "host-001",
        participations: [
          createParticipation({
            participationId: "participation-001",
            activityId: "activity-confirmed",
            studentAccountId: "student-001",
            recordType: ParticipationRecordType.Participation,
            status: ParticipationStatus.Confirmed
          })
        ]
      })
    ]);

    const result = await service.getPersonalActivities("student-001", "campus-001");

    expect(result).toEqual([
      expect.objectContaining({
        activityId: "activity-confirmed",
        personalActivityStatus: "confirmed_participant",
        participationId: "participation-001",
        participationRecordType: ParticipationRecordType.Participation,
        participationStatus: ParticipationStatus.Confirmed
      })
    ]);
  });

  it("excludes activities from another campus", async () => {
    const { service } = createService([
      createActivity({
        activityId: "activity-same-campus",
        campusId: "campus-001",
        hostAccountId: "student-001"
      }),
      createActivity({
        activityId: "activity-other-campus",
        campusId: "campus-002",
        hostAccountId: "student-001"
      })
    ]);

    const result = await service.getPersonalActivities("student-001", "campus-001");

    expect(result.map((activity) => activity.activityId)).toEqual(["activity-same-campus"]);
  });

  it("orders personal activities by scheduledDateTime ascending", async () => {
    const { service } = createService([
      createActivity({
        activityId: "activity-late",
        hostAccountId: "student-001",
        scheduledDateTime: new Date("2026-05-22T10:00:00.000Z")
      }),
      createActivity({
        activityId: "activity-early",
        hostAccountId: "student-001",
        scheduledDateTime: new Date("2026-05-20T10:00:00.000Z")
      })
    ]);

    const result = await service.getPersonalActivities("student-001", "campus-001");

    expect(result.map((activity) => activity.activityId)).toEqual([
      "activity-early",
      "activity-late"
    ]);
  });
});

function createService(activityStore: Activity[]): { service: PersonalListService } {
  const activityRepository = createActivityRepository(activityStore);

  return {
    service: new PersonalListService({
      getRepository: vi.fn((entity) => {
        if (entity !== Activity) {
          throw new Error("Unexpected repository requested");
        }

        return activityRepository;
      })
    } as unknown as DataSource)
  };
}

function createActivityRepository(activities: Activity[]) {
  return {
    createQueryBuilder: vi.fn(() => {
      const queryState: {
        campusId?: string;
        studentAccountId?: string;
        statuses?: ParticipationStatus[];
      } = {};

      const queryBuilder = {
        leftJoinAndSelect: vi.fn(
          (
            _relation: string,
            _alias: string,
            _condition: string,
            params: { studentAccountId: string; statuses: ParticipationStatus[] }
          ) => {
            queryState.studentAccountId = params.studentAccountId;
            queryState.statuses = params.statuses;

            return queryBuilder;
          }
        ),
        where: vi.fn((_condition: string, params: { campusId: string }) => {
          queryState.campusId = params.campusId;

          return queryBuilder;
        }),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn(async () => {
          const studentAccountId = queryState.studentAccountId;
          const statuses = queryState.statuses ?? [];

          return activities
            .filter((activity) =>
              queryState.campusId === undefined ? true : activity.campusId === queryState.campusId
            )
            .map((activity) => {
              const participations = (activity.participations ?? []).filter(
                (participation) =>
                  participation.studentAccountId === studentAccountId &&
                  statuses.includes(participation.status)
              );

              return {
                ...activity,
                participations
              } as Activity;
            })
            .filter(
              (activity) =>
                activity.hostAccountId === studentAccountId ||
                (activity.participations?.length ?? 0) > 0
            )
            .sort(
              (left, right) =>
                left.scheduledDateTime.getTime() - right.scheduledDateTime.getTime()
            );
        })
      };

      return queryBuilder;
    })
  };
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    activityId: "activity-default",
    campusId: "campus-001",
    hostAccountId: "host-default",
    title: "Default Activity",
    categoryId: "category-001",
    categoryLabel: "General",
    description: null,
    scheduledDateTime: new Date("2026-05-20T10:00:00.000Z"),
    scheduledEndDateTime: null,
    meetingPointId: "meeting-point-001",
    meetingPointLabel: "Main Gate",
    participationMode: ParticipationMode.Open,
    maxParticipants: 10,
    maxRequests: null,
    currentParticipantCount: 0,
    currentRequestCount: 0,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    participations: [],
    ...overrides
  } as Activity;
}

function createParticipation(overrides: Partial<Participation> = {}): Participation {
  return {
    participationId: "participation-default",
    activityId: "activity-default",
    studentAccountId: "student-001",
    recordType: ParticipationRecordType.Request,
    status: ParticipationStatus.Pending,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  } as Participation;
}

import { describe, expect, it } from "vitest";
import type { DataSource } from "typeorm";

import {
  ActivityStatus,
  GenderPreference,
  ModerationAction,
  ParticipationMode,
  ReviewOutcome
} from "../../../shared/src/domain/enums";
import { Activity } from "../entities/Activity";
import { ActivityModerationCommandHandler } from "../services/ActivityModerationCommandHandler";

describe("ActivityModerationCommandHandler", () => {
  it("hard-deletes the activity for remove_activity moderation commands", async () => {
    const activityStore = [createActivity({ activityId: "activity-001", campusId: "campus-001" })];
    const handler = new ActivityModerationCommandHandler(
      createActivityModerationDataSource(activityStore) as unknown as DataSource
    );

    await handler.handle({
      commandId: "command-001",
      reportId: "report-001",
      activityId: "activity-001",
      actionType: ModerationAction.RemoveActivity,
      campusId: "campus-001",
      reviewOutcomeId: ReviewOutcome.ActionTaken,
      requestedByAdminId: "admin-001",
      requestedAt: "2026-05-14T00:00:00.000Z"
    });

    expect(activityStore).toHaveLength(0);
  });

  it("treats missing activities as a safe no-op", async () => {
    const activityStore: Activity[] = [];
    const handler = new ActivityModerationCommandHandler(
      createActivityModerationDataSource(activityStore) as unknown as DataSource
    );

    await expect(
      handler.handle({
        commandId: "command-002",
        reportId: "report-002",
        activityId: "missing-activity",
        actionType: ModerationAction.RemoveActivity,
        campusId: "campus-001",
        reviewOutcomeId: ReviewOutcome.ActionTaken,
        requestedByAdminId: "admin-001",
        requestedAt: "2026-05-14T00:00:00.000Z"
      })
    ).resolves.toBeUndefined();
    expect(activityStore).toHaveLength(0);
  });

  it("throws on campus mismatch during moderation removal", async () => {
    const activityStore = [createActivity({ activityId: "activity-001", campusId: "campus-002" })];
    const handler = new ActivityModerationCommandHandler(
      createActivityModerationDataSource(activityStore) as unknown as DataSource
    );

    await expect(
      handler.handle({
        commandId: "command-003",
        reportId: "report-003",
        activityId: "activity-001",
        actionType: ModerationAction.RemoveActivity,
        campusId: "campus-001",
        reviewOutcomeId: ReviewOutcome.ActionTaken,
        requestedByAdminId: "admin-001",
        requestedAt: "2026-05-14T00:00:00.000Z"
      })
    ).rejects.toThrow("Campus mismatch during moderation removal");
  });
});

function createActivityModerationDataSource(activityStore: Activity[]) {
  return {
    async transaction<T>(
      work: (manager: {
        findOne(
          entityClass: typeof Activity,
          options: { where: { activityId: string }; lock?: { mode: string } }
        ): Promise<Activity | null>;
        remove(entityClass: typeof Activity, activity: Activity): Promise<Activity>;
      }) => Promise<T>
    ): Promise<T> {
      return await work({
        async findOne(
          entityClass: typeof Activity,
          options: { where: { activityId: string } }
        ) {
          if (entityClass !== Activity) {
            return null;
          }

          return (
            activityStore.find((activity) => activity.activityId === options.where.activityId) ??
            null
          );
        },
        async remove(entityClass: typeof Activity, activity: Activity) {
          if (entityClass === Activity) {
            const activityIndex = activityStore.findIndex(
              (existingActivity) => existingActivity.activityId === activity.activityId
            );

            if (activityIndex >= 0) {
              activityStore.splice(activityIndex, 1);
            }
          }

          return activity;
        }
      });
    }
  };
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    activityId: "activity-001",
    campusId: "campus-001",
    hostAccountId: "host-account-001",
    title: "Study Group",
    categoryId: "category-001",
    categoryLabel: "Study",
    description: "Bring notes",
    scheduledDateTime: new Date("2026-05-15T10:00:00.000Z"),
    scheduledEndDateTime: null,
    meetingPointId: "meeting-point-001",
    meetingPointLabel: "Library",
    participationMode: ParticipationMode.ApprovalBased,
    maxParticipants: 10,
    maxRequests: null,
    currentParticipantCount: 0,
    currentRequestCount: 0,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    participations: [],
    ...overrides
  };
}

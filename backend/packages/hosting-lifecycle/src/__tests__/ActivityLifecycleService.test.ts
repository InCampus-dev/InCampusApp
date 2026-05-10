import { describe, expect, it } from "vitest";

import { CampusStructuredOptionType, GenderPreference, ParticipationMode } from "../../../shared/src/domain/enums";
import { Activity } from "../entities/Activity";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";

describe("ActivityLifecycleService", () => {
  it("accepts active campus options and preserves snapshot labels", async () => {
    const activityStore: Activity[] = [];
    const service = new ActivityLifecycleService(
      createActivityRepo(activityStore),
      createStructuredOptionLookup([
        {
          optionId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
          campusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
          optionType: CampusStructuredOptionType.ActivityCategory,
          name: "Lunch"
        },
        {
          optionId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
          campusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
          optionType: CampusStructuredOptionType.CampusLocation,
          name: "Jiading Library"
        }
      ])
    );

    const activity = await service.createActivity(
      "host-001",
      "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
      {
        title: "Lunch near the library",
        categoryId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
        description: "Bring your own lunch",
        scheduledDateTime: new Date("2026-05-11T12:00:00Z"),
        meetingPointId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      }
    );

    expect(activity.categoryLabel).toBe("Lunch");
    expect(activity.meetingPointLabel).toBe("Jiading Library");
    expect(activityStore).toHaveLength(1);
  });

  it("rejects inactive category options", async () => {
    const service = new ActivityLifecycleService(createActivityRepo([]), createStructuredOptionLookup([]));

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        title: "Lunch near the library",
        categoryId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
        scheduledDateTime: new Date("2026-05-11T12:00:00Z"),
        meetingPointId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects wrong-type meeting point options", async () => {
    const service = new ActivityLifecycleService(
      createActivityRepo([]),
      createStructuredOptionLookup([
        {
          optionId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
          campusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
          optionType: CampusStructuredOptionType.ActivityCategory,
          name: "Lunch"
        }
      ])
    );

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        title: "Lunch near the library",
        categoryId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
        scheduledDateTime: new Date("2026-05-11T12:00:00Z"),
        meetingPointId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });
});

function createActivityRepo(activityStore: Activity[]) {
  return {
    create(payload: Partial<Activity>) {
      return {
        activityId: "3a86631d-8d4c-4e54-8a2a-efc8dcd2bce7",
        currentParticipantCount: 0,
        currentRequestCount: 0,
        maxRequests: null,
        scheduledEndDateTime: null,
        createdAt: new Date("2026-05-10T00:00:00Z"),
        participations: [],
        ...payload
      } as Activity;
    },
    async save(activity: Activity) {
      activityStore.push(activity);
      return activity;
    }
  };
}

function createStructuredOptionLookup(
  selectableOptions: Array<{
    optionId: string;
    campusId: string;
    optionType: CampusStructuredOptionType;
    name: string;
  }>
) {
  return {
    async findSelectableOption(
      campusId: string,
      optionId: string,
      optionType: CampusStructuredOptionType
    ) {
      const option = selectableOptions.find(
        (candidateOption) =>
          candidateOption.campusId === campusId &&
          candidateOption.optionId === optionId &&
          candidateOption.optionType === optionType
      );

      return option
        ? {
            ...option,
            description: null,
            isActive: true,
            createdAt: "2026-05-10T00:00:00.000Z",
            updatedAt: "2026-05-10T00:00:00.000Z"
          }
        : null;
    }
  };
}

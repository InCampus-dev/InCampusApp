import { describe, expect, it, vi, beforeEach } from "vitest";

import { ActivityStatus, CampusStructuredOptionType, GenderPreference, ParticipationMode } from "../../../shared/src/domain/enums";
import { Activity } from "../entities/Activity";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";

describe("ActivityLifecycleService", () => {
  const mockEventDispatcher = {
    dispatch: vi.fn()
  };

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
      ]),
      mockEventDispatcher
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
    const service = new ActivityLifecycleService(
      createActivityRepo([]), 
      createStructuredOptionLookup([]),
      mockEventDispatcher
    );

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
      ]),
      mockEventDispatcher
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

  describe("updateActivityStatus", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("successfully updates status to completed", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      const updated = await service.updateActivityStatus("host-1", "camp-1", "act-1", ActivityStatus.Completed);
      expect(updated.status).toBe(ActivityStatus.Completed);
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it("successfully updates status to cancelled and emits event", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      const updated = await service.updateActivityStatus("host-1", "camp-1", "act-1", ActivityStatus.Cancelled);
      expect(updated.status).toBe(ActivityStatus.Cancelled);
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith("ActivityCancelled", expect.objectContaining({
        activityId: "act-1",
        outcome: "cancelled"
      }));
    });

    it("fails if user is not the host", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      await expect(service.updateActivityStatus("host-2", "camp-1", "act-1", ActivityStatus.Completed))
        .rejects.toThrow("Only the host can update the activity status");
    });

    it("fails if trying to update to an invalid status", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      await expect(service.updateActivityStatus("host-1", "camp-1", "act-1", ActivityStatus.Full))
        .rejects.toThrow("Invalid status update");
    });
  });

  describe("deleteActivity", () => {
    it("successfully hard-deletes an activity before it starts", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", scheduledDateTime: new Date(Date.now() + 86400000) } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      await service.deleteActivity("host-1", "camp-1", "act-1");
      expect(activityStore).toHaveLength(0);
    });

    it("fails to delete if the activity has already started", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", scheduledDateTime: new Date(Date.now() - 86400000) } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      await expect(service.deleteActivity("host-1", "camp-1", "act-1"))
        .rejects.toThrow("Cannot delete an activity that has already started");
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
    },
    async findOne(options: any) {
      if (options?.where?.activityId) {
        return activityStore.find(a => a.activityId === options.where.activityId) || null;
      }
      return null;
    },
    async remove(activity: Activity) {
      const index = activityStore.findIndex(a => a.activityId === activity.activityId);
      if (index > -1) activityStore.splice(index, 1);
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

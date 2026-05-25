import { describe, expect, it, vi, beforeEach } from "vitest";

import { ActivityStatus, CampusStructuredOptionType, GenderPreference, ParticipationMode } from "../../../shared/src/domain/enums";
import { Activity } from "../entities/Activity";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";

const mockEventDispatcher = {
  dispatch: vi.fn()
};

describe("ActivityLifecycleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
        scheduledDateTime: futureDate(24),
        meetingPointId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      }
    );

    expect(activity.categoryLabel).toBe("Lunch");
    expect(activity.meetingPointLabel).toBe("Jiading Library");
    expect(activity.currentParticipantCount).toBe(0);
    expect(activity.status).toBe(ActivityStatus.Open);
    expect(activityStore).toHaveLength(1);
  });

  it("creates maxParticipants=1 activities as host-only full activities", async () => {
    const activityStore: Activity[] = [];
    const service = createServiceWithSelectableOptions(activityStore);

    const activity = await service.createActivity(
      "host-001",
      "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
      {
        ...createValidActivityPayload(),
        maxParticipants: 1
      }
    );

    expect(activity.currentParticipantCount).toBe(0);
    expect(activity.status).toBe(ActivityStatus.Full);
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
        scheduledDateTime: futureDate(24),
        meetingPointId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects creation when categoryId is missing", async () => {
    const service = new ActivityLifecycleService(
      createActivityRepo([]),
      createStructuredOptionLookup([]),
      mockEventDispatcher
    );

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        title: "Lunch near the library",
        scheduledDateTime: futureDate(24),
        meetingPointId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [expect.objectContaining({ field: "categoryId", code: "required" })]
      }
    });
  });

  it("rejects creation when meetingPointId is missing", async () => {
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
        scheduledDateTime: futureDate(24),
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [expect.objectContaining({ field: "meetingPointId", code: "required" })]
      }
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
        scheduledDateTime: futureDate(24),
        meetingPointId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
        participationMode: ParticipationMode.Open,
        maxParticipants: 4,
        genderPreference: GenderPreference.All
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects creation when title is missing", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        title: " "
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [expect.objectContaining({ field: "title", code: "required" })]
      }
    });
  });

  it("rejects creation when scheduledDateTime is invalid", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        scheduledDateTime: new Date("not-a-date")
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [expect.objectContaining({ field: "scheduledDateTime", code: "invalid_date" })]
      }
    });
  });

  it("rejects creation when scheduledDateTime is not in the future", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        scheduledDateTime: new Date(Date.now() - 60 * 1000)
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [expect.objectContaining({ field: "scheduledDateTime", code: "must_be_future" })]
      }
    });
  });

  it("rejects creation when scheduledEndDateTime is invalid", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        scheduledEndDateTime: new Date("not-a-date")
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [expect.objectContaining({ field: "scheduledEndDateTime", code: "invalid_date" })]
      }
    });
  });

  it("rejects creation when scheduledEndDateTime is not after scheduledDateTime", async () => {
    const service = createServiceWithSelectableOptions([]);
    const scheduledDateTime = futureDate(24);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        scheduledDateTime,
        scheduledEndDateTime: new Date(scheduledDateTime.getTime())
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [
          expect.objectContaining({ field: "scheduledEndDateTime", code: "must_be_after_start" })
        ]
      }
    });
  });

  it("rejects creation when maxParticipants is not a positive integer", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        maxParticipants: 0
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [
          expect.objectContaining({ field: "maxParticipants", code: "positive_integer_required" })
        ]
      }
    });
  });

  it("rejects creation when maxRequests is present but invalid", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        maxRequests: 1.5
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [
          expect.objectContaining({ field: "maxRequests", code: "positive_integer_required" })
        ]
      }
    });
  });

  it("rejects creation when maxRequests exceeds guest capacity", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        participationMode: ParticipationMode.ApprovalBased,
        maxParticipants: 2,
        maxRequests: 2
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [
          expect.objectContaining({ field: "maxRequests", code: "exceeds_guest_capacity" })
        ]
      }
    });
  });

  it("rejects creation when participationMode is invalid", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        participationMode: "invite_only" as ParticipationMode
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [
          expect.objectContaining({ field: "participationMode", code: "invalid_participation_mode" })
        ]
      }
    });
  });

  it("rejects creation when genderPreference is invalid", async () => {
    const service = createServiceWithSelectableOptions([]);

    await expect(
      service.createActivity("host-001", "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81", {
        ...createValidActivityPayload(),
        genderPreference: "mixed" as GenderPreference
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        validation: [
          expect.objectContaining({ field: "genderPreference", code: "invalid_gender_preference" })
        ]
      }
    });
  });

  describe("updateActivityStatus", () => {
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

    it("successfully updates full activity status to completed", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Full } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);

      const updated = await service.updateActivityStatus("host-1", "camp-1", "act-1", ActivityStatus.Completed);

      expect(updated.status).toBe(ActivityStatus.Completed);
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it("successfully updates full activity status to cancelled and emits event", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Full } as Activity
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

    it("fails opaquely if activity belongs to another campus", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-2", hostAccountId: "host-1", status: ActivityStatus.Open } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);

      await expect(service.updateActivityStatus("host-1", "camp-1", "act-1", ActivityStatus.Completed))
        .rejects.toMatchObject({
          code: "NOT_FOUND",
          details: {
            resourceType: "Activity",
            resourceId: "act-1"
          }
        });
    });

    it("fails if activity is missing", async () => {
      const service = new ActivityLifecycleService(createActivityRepo([]), createStructuredOptionLookup([]), mockEventDispatcher);

      await expect(service.updateActivityStatus("host-1", "camp-1", "missing-act", ActivityStatus.Completed))
        .rejects.toMatchObject({
          code: "NOT_FOUND",
          details: {
            resourceType: "Activity",
            resourceId: "missing-act"
          }
        });
    });

    it("fails if trying to update to an invalid status", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);
      
      await expect(service.updateActivityStatus("host-1", "camp-1", "act-1", ActivityStatus.Full))
        .rejects.toThrow("Invalid status update");
    });

    it.each([
      [ActivityStatus.Completed, ActivityStatus.Cancelled],
      [ActivityStatus.Completed, ActivityStatus.Completed],
      [ActivityStatus.Cancelled, ActivityStatus.Completed],
      [ActivityStatus.Cancelled, ActivityStatus.Cancelled]
    ])("fails when updating final status from %s to %s", async (currentStatus, nextStatus) => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: currentStatus } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);

      await expect(service.updateActivityStatus("host-1", "camp-1", "act-1", nextStatus))
        .rejects.toMatchObject({
          code: "CONFLICT",
          details: {
            conflictResource: "Activity"
          }
        });
      expect(activityStore[0].status).toBe(currentStatus);
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
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

    it("fails if a non-host tries to delete the activity", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", scheduledDateTime: new Date(Date.now() + 86400000) } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);

      await expect(service.deleteActivity("host-2", "camp-1", "act-1"))
        .rejects.toMatchObject({
          code: "AUTH_FORBIDDEN",
          details: {
            authReason: "not_activity_host"
          }
        });
    });

    it("fails opaquely if delete targets another campus", async () => {
      const activityStore: Activity[] = [
        { activityId: "act-1", campusId: "camp-2", hostAccountId: "host-1", scheduledDateTime: new Date(Date.now() + 86400000) } as Activity
      ];
      const service = new ActivityLifecycleService(createActivityRepo(activityStore), createStructuredOptionLookup([]), mockEventDispatcher);

      await expect(service.deleteActivity("host-1", "camp-1", "act-1"))
        .rejects.toMatchObject({
          code: "NOT_FOUND",
          details: {
            resourceType: "Activity",
            resourceId: "act-1"
          }
        });
    });

    it("fails if delete targets a missing activity", async () => {
      const service = new ActivityLifecycleService(createActivityRepo([]), createStructuredOptionLookup([]), mockEventDispatcher);

      await expect(service.deleteActivity("host-1", "camp-1", "missing-act"))
        .rejects.toMatchObject({
          code: "NOT_FOUND",
          details: {
            resourceType: "Activity",
            resourceId: "missing-act"
          }
        });
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
      const existingIndex = activityStore.findIndex(
        (candidate) => candidate.activityId === activity.activityId
      );

      if (existingIndex >= 0) {
        activityStore[existingIndex] = activity;
      } else {
        activityStore.push(activity);
      }

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

function createServiceWithSelectableOptions(activityStore: Activity[]) {
  return new ActivityLifecycleService(
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
}

function createValidActivityPayload(): Partial<Activity> {
  return {
    title: "Lunch near the library",
    categoryId: "7eb3c60c-f4c2-43b4-97d3-48ee28d97a1c",
    scheduledDateTime: futureDate(24),
    meetingPointId: "22383836-9f17-4cf7-8e57-07d6b10b96ec",
    participationMode: ParticipationMode.Open,
    maxParticipants: 4,
    genderPreference: GenderPreference.All
  };
}

function futureDate(hoursFromNow: number): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
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

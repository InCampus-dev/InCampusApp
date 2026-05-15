import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationRecord } from "../entities/NotificationRecord";
import { ApplicationOutcomeHandler } from "../handlers/ApplicationOutcomeHandler";
import { CancellationHandler } from "../handlers/CancellationHandler";
import { JoinEventHandler } from "../handlers/JoinEventHandler";
import { LeaveEventHandler } from "../handlers/LeaveEventHandler";
import { ReminderHandler } from "../handlers/ReminderHandler";
import { registerNSFHandlers } from "../handlers/registerNSFHandlers";
import { NotificationContextController } from "../controllers/NotificationContextController";
import { NotificationListController } from "../controllers/NotificationListController";
import { NotificationRepo } from "../repositories/NotificationRepo";
import { NotificationComposer } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";
import { RecipientResolution } from "../services/RecipientResolutionService";
import {
  ActivityStatus,
  NotificationType,
  ParticipationRecordType,
  ParticipationStatus,
  PlatformAccessStatus,
  TargetContextType,
  VerificationStatus
} from "../../../shared/src/domain/enums";

describe("Notification event handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("creates a join-request notification with JoinRequestReview target context", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const handler = new JoinEventHandler(
      {
        resolveHostRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "host-001"
          })
        )
      } as any,
      { shouldSuppress: vi.fn().mockResolvedValue(false) } as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-001",
      eventType: "JoinRequestSubmitted",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "student-001",
      participationId: "participation-001"
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.targetContextType).toBe(TargetContextType.JoinRequestReview);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it("creates a direct-join notification with ActivityDetails target context", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const handler = new JoinEventHandler(
      {
        resolveHostRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "host-001"
          })
        )
      } as any,
      { shouldSuppress: vi.fn().mockResolvedValue(false) } as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-002",
      eventType: "DirectJoinCompleted",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "student-001",
      participationId: "participation-001"
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.targetContextType).toBe(TargetContextType.ActivityDetails);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it("suppresses join notifications when the resolved recipient is inactive", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const blockService = { shouldSuppress: vi.fn() };
    const handler = new JoinEventHandler(
      {
        resolveHostRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "host-001",
            suppressed: true,
            suppressionReason: "HostAccountNotActive"
          })
        )
      } as any,
      blockService as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-003",
      eventType: "JoinRequestSubmitted",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "student-001",
      participationId: "participation-001"
    });

    expect(notifications).toHaveLength(0);
    expect(blockService.shouldSuppress).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("suppresses join notifications when a block relationship exists", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const handler = new JoinEventHandler(
      {
        resolveHostRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "host-001"
          })
        )
      } as any,
      { shouldSuppress: vi.fn().mockResolvedValue(true) } as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-004",
      eventType: "DirectJoinCompleted",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "student-001",
      participationId: "participation-001"
    });

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("creates an approved-outcome notification with ActivityDetails target context", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const handler = new ApplicationOutcomeHandler(
      {
        resolveApplicantRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "student-001"
          })
        )
      } as any,
      { shouldSuppress: vi.fn().mockResolvedValue(false) } as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-005",
      eventType: "JoinRequestApproved",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      participationId: "participation-001",
      outcome: "approved"
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.targetContextType).toBe(TargetContextType.ActivityDetails);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it("creates a declined-outcome notification with PersonalActivityContext target context", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const handler = new ApplicationOutcomeHandler(
      {
        resolveApplicantRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "student-001"
          })
        )
      } as any,
      { shouldSuppress: vi.fn().mockResolvedValue(false) } as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-006",
      eventType: "JoinRequestDeclined",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      participationId: "participation-001",
      outcome: "declined"
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.targetContextType).toBe(
      TargetContextType.PersonalActivityContext
    );
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it("suppresses application-outcome notifications when the recipient is inactive", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const blockService = { shouldSuppress: vi.fn() };
    const handler = new ApplicationOutcomeHandler(
      {
        resolveApplicantRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "student-001",
            suppressed: true,
            suppressionReason: "ApplicantAccountNotActive"
          })
        )
      } as any,
      blockService as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-007",
      eventType: "JoinRequestApproved",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      participationId: "participation-001",
      outcome: "approved"
    });

    expect(notifications).toHaveLength(0);
    expect(blockService.shouldSuppress).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("suppresses application-outcome notifications when a block relationship exists", async () => {
    const { notifications, composer, dispatcher } = createNotificationHarness();
    const handler = new ApplicationOutcomeHandler(
      {
        resolveApplicantRecipient: vi.fn().mockResolvedValue(
          createRecipientResolution({
            recipientAccountId: "student-001"
          })
        )
      } as any,
      { shouldSuppress: vi.fn().mockResolvedValue(true) } as any,
      composer,
      dispatcher
    );

    await handler.handle({
      eventId: "event-008",
      eventType: "JoinRequestDeclined",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      participationId: "participation-001",
      outcome: "declined"
    });

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("creates one cancellation notification per confirmed participant", async () => {
    const { notifications, dispatcher, handler } = createCancellationHandlerHarness({
      participations: [
        createParticipation({ participationId: "participation-001", studentAccountId: "student-001" }),
        createParticipation({ participationId: "participation-002", studentAccountId: "student-002" })
      ],
      accounts: {
        "student-001": createActiveAccount("student-001"),
        "student-002": createActiveAccount("student-002")
      }
    });

    await handler.handle({
      eventId: "event-009",
      eventType: "ActivityCancelled",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      outcome: "cancelled"
    });

    expect(notifications).toHaveLength(2);
    expect(notifications.map((notification) => notification.recipientAccountId)).toEqual([
      "student-001",
      "student-002"
    ]);
    expect(notifications.every(
      (notification) =>
        notification.targetContextType === TargetContextType.CancelledActivityContext
    )).toBe(true);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(2);
  });

  it("skips inactive participant accounts during cancellation fan-out", async () => {
    const { notifications, dispatcher, blockService, handler } = createCancellationHandlerHarness({
      participations: [
        createParticipation({ participationId: "participation-001", studentAccountId: "student-001" })
      ],
      accounts: {
        "student-001": createInactiveAccount("student-001")
      }
    });

    await handler.handle({
      eventId: "event-010",
      eventType: "ActivityCancelled",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      outcome: "cancelled"
    });

    expect(notifications).toHaveLength(0);
    expect(blockService.shouldSuppress).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("suppresses cancellation notifications for blocked participant-host pairs", async () => {
    const { notifications, dispatcher, handler } = createCancellationHandlerHarness({
      participations: [
        createParticipation({ participationId: "participation-001", studentAccountId: "student-001" })
      ],
      accounts: {
        "student-001": createActiveAccount("student-001")
      },
      blocked: true
    });

    await handler.handle({
      eventId: "event-011",
      eventType: "ActivityCancelled",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "host-001",
      outcome: "cancelled"
    });

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("creates a leave-event notification for the host", async () => {
    const { notifications, dispatcher, handler } = createLeaveHandlerHarness();

    await handler.handle({
      eventId: "event-012",
      eventType: "JoinedParticipantLeft",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "student-001",
      participationId: "participation-001"
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.recipientAccountId).toBe("host-001");
    expect(notifications[0]?.targetContextType).toBe(TargetContextType.ActivityDetails);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it("suppresses leave-event notifications when a block relationship exists", async () => {
    const { notifications, dispatcher, handler } = createLeaveHandlerHarness({
      blocked: true
    });

    await handler.handle({
      eventId: "event-013",
      eventType: "JoinedParticipantLeft",
      occurredAt: "2026-05-13T09:00:00.000Z",
      activityId: "activity-001",
      triggeringAccountId: "student-001",
      participationId: "participation-001"
    });

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("registers ActivityCancelled and JoinedParticipantLeft handlers", () => {
    const eventBus = {
      subscribe: vi.fn(),
      publish: vi.fn()
    };
    const joinHandler = {
      getHandledEvents: () => ["DirectJoinCompleted", "JoinRequestSubmitted"] as const,
      handle: vi.fn()
    };
    const outcomeHandler = {
      getHandledEvents: () => ["JoinRequestApproved", "JoinRequestDeclined"] as const,
      handle: vi.fn()
    };
    const cancellationHandler = {
      getHandledEvents: () => ["ActivityCancelled"] as const,
      handle: vi.fn()
    };
    const leaveEventHandler = {
      getHandledEvents: () => ["JoinedParticipantLeft"] as const,
      handle: vi.fn()
    };
    const reminderHandler = {
      getHandledEvents: () => ["ActivityReminderDue"] as const,
      handle: vi.fn()
    };

    registerNSFHandlers(
      eventBus as any,
      joinHandler as any,
      outcomeHandler as any,
      cancellationHandler as any,
      leaveEventHandler as any,
      reminderHandler as any
    );

    expect(eventBus.subscribe).toHaveBeenCalledWith("ActivityCancelled", expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith("JoinedParticipantLeft", expect.any(Function));
  });

  it("returns recipient-scoped notifications for the authenticated student", async () => {
    const notificationRepo = {
      findByRecipientPaginated: vi.fn().mockResolvedValue({
        records: [
          createNotificationRecord({
            notificationId: "notification-001",
            recipientAccountId: "student-001"
          })
        ],
        total: 1
      })
    } as unknown as NotificationRepo;
    const controller = new NotificationListController(notificationRepo);
    const response = createMockResponse();

    await controller.list(
      createMockRequest({
        studentAccountId: "student-001"
      }),
      response as any
    );

    expect(notificationRepo.findByRecipientPaginated).toHaveBeenCalledWith("student-001", {
      limit: 20,
      offset: 0
    });
    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toMatchObject({
      notifications: [
        {
          notificationId: "notification-001",
          notificationType: NotificationType.JoinEvent
        }
      ],
      total: 1
    });
  });

  it("supports page and limit for notification listing", async () => {
    const notificationRepo = {
      findByRecipientPaginated: vi.fn().mockResolvedValue({
        records: [],
        total: 0
      })
    } as unknown as NotificationRepo;
    const controller = new NotificationListController(notificationRepo);
    const response = createMockResponse();

    await controller.list(
      createMockRequest({
        studentAccountId: "student-001",
        query: { page: "2", limit: "10" }
      }),
      response as any
    );

    expect(notificationRepo.findByRecipientPaginated).toHaveBeenCalledWith("student-001", {
      limit: 10,
      offset: 10
    });
    expect(response.jsonPayload).toMatchObject({
      page: 2,
      limit: 10,
      total: 0
    });
  });

  it("caps notification list limit safely", async () => {
    const notificationRepo = {
      findByRecipientPaginated: vi.fn().mockResolvedValue({
        records: [],
        total: 0
      })
    } as unknown as NotificationRepo;
    const controller = new NotificationListController(notificationRepo);

    await controller.list(
      createMockRequest({
        studentAccountId: "student-001",
        query: { limit: "999" }
      }),
      createMockResponse() as any
    );

    expect(notificationRepo.findByRecipientPaginated).toHaveBeenCalledWith("student-001", {
      limit: 50,
      offset: 0
    });
  });

  it("returns not found when notification context is missing", async () => {
    const controller = createNotificationContextController({
      notification: null
    });

    await expect(
      controller.getContext(
        createMockRequest({
          studentAccountId: "student-001",
          params: { notificationId: "missing-notification" }
        }),
        createMockResponse() as any
      )
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("returns forbidden when notification belongs to another student", async () => {
    const controller = createNotificationContextController({
      notification: createNotificationRecord({
        notificationId: "notification-001",
        recipientAccountId: "student-002"
      })
    });

    await expect(
      controller.getContext(
        createMockRequest({
          studentAccountId: "student-001",
          params: { notificationId: "notification-001" }
        }),
        createMockResponse() as any
      )
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN"
    });
  });

  it("returns fallback when the related activity no longer exists", async () => {
    const controller = createNotificationContextController({
      notification: createNotificationRecord({
        notificationId: "notification-001",
        relatedActivityId: "activity-001",
        targetContextType: TargetContextType.ActivityDetails,
        targetContextId: "activity-001",
        triggeringAccountId: "host-001"
      }),
      activity: null
    });
    const response = createMockResponse();

    await controller.getContext(
      createMockRequest({
        studentAccountId: "student-001",
        params: { notificationId: "notification-001" }
      }),
      response as any
    );

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({
      notificationId: "notification-001",
      contextType: TargetContextType.NotificationFallbackView,
      contextId: null,
      accessible: false,
      fallbackReason: "TargetActivityUnavailable"
    });
  });

  it("returns fallback when a reciprocal block exists for notification context", async () => {
    const controller = createNotificationContextController({
      notification: createNotificationRecord({
        notificationId: "notification-001",
        relatedActivityId: "activity-001",
        targetContextType: TargetContextType.ActivityDetails,
        targetContextId: "activity-001",
        triggeringAccountId: "host-001"
      }),
      blocked: true
    });
    const response = createMockResponse();

    await controller.getContext(
      createMockRequest({
        studentAccountId: "student-001",
        params: { notificationId: "notification-001" }
      }),
      response as any
    );

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({
      notificationId: "notification-001",
      contextType: TargetContextType.NotificationFallbackView,
      contextId: null,
      accessible: false,
      fallbackReason: "BlockRelationshipExists"
    });
  });

  it("returns accessible context when notification belongs to the student and no block exists", async () => {
    const controller = createNotificationContextController({
      notification: createNotificationRecord({
        notificationId: "notification-001",
        relatedActivityId: "activity-001",
        targetContextType: TargetContextType.ActivityDetails,
        targetContextId: "activity-001",
        triggeringAccountId: "host-001"
      })
    });
    const response = createMockResponse();

    await controller.getContext(
      createMockRequest({
        studentAccountId: "student-001",
        params: { notificationId: "notification-001" }
      }),
      response as any
    );

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({
      notificationId: "notification-001",
      contextType: TargetContextType.ActivityDetails,
      contextId: "activity-001",
      accessible: true
    });
  });

  it("creates reminder notifications only for confirmed joined participations", async () => {
    const { notifications, dispatcher, handler, participationRepo } = createReminderHandlerHarness({
      activityStatus: ActivityStatus.Open,
      participations: [
        createReminderParticipation({
          participationId: "participation-001",
          studentAccountId: "student-001",
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Confirmed
        }),
        createReminderParticipation({
          participationId: "participation-002",
          studentAccountId: "student-002",
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending
        })
      ]
    });

    await handler.handle(createReminderEvent());

    expect(participationRepo.find).toHaveBeenCalledWith({
      where: {
        activityId: "activity-001",
        recordType: ParticipationRecordType.Participation,
        status: ParticipationStatus.Confirmed
      }
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      notificationType: NotificationType.ActivityReminder,
      recipientAccountId: "student-001",
      targetContextType: TargetContextType.ActivityDetails,
      notificationTitle: "Activity starting soon"
    });
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it("does not notify pending requests for reminders", async () => {
    const { notifications, dispatcher, handler } = createReminderHandlerHarness({
      participations: [
        createReminderParticipation({
          participationId: "participation-001",
          studentAccountId: "student-001",
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending
        })
      ]
    });

    await handler.handle(createReminderEvent());

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("does not notify declined participations for reminders", async () => {
    const { notifications, dispatcher, handler } = createReminderHandlerHarness({
      participations: [
        createReminderParticipation({
          participationId: "participation-001",
          studentAccountId: "student-001",
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Declined
        })
      ]
    });

    await handler.handle(createReminderEvent());

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("does not notify inactive accounts for reminders", async () => {
    const { notifications, dispatcher, handler } = createReminderHandlerHarness({
      participations: [
        createReminderParticipation({
          participationId: "participation-001",
          studentAccountId: "student-001",
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Confirmed
        })
      ],
      accounts: {
        "student-001": createInactiveAccount("student-001")
      }
    });

    await handler.handle(createReminderEvent());

    expect(notifications).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it("does not notify when the activity is completed or cancelled", async () => {
    const completedHarness = createReminderHandlerHarness({
      activityStatus: ActivityStatus.Completed
    });
    const cancelledHarness = createReminderHandlerHarness({
      activityStatus: ActivityStatus.Cancelled
    });

    await completedHarness.handler.handle(createReminderEvent());
    await cancelledHarness.handler.handle(createReminderEvent());

    expect(completedHarness.participationRepo.find).not.toHaveBeenCalled();
    expect(cancelledHarness.participationRepo.find).not.toHaveBeenCalled();
    expect(completedHarness.notifications).toHaveLength(0);
    expect(cancelledHarness.notifications).toHaveLength(0);
  });
});

function createNotificationHarness(): {
  notifications: NotificationRecord[];
  composer: NotificationComposer;
  dispatcher: NotificationDispatcher & { dispatch: ReturnType<typeof vi.fn> };
} {
  const notifications: NotificationRecord[] = [];
  const notificationRepo = createNotificationRepo(notifications);
  const composer = new NotificationComposer(notificationRepo);
  const dispatcher = {
    dispatch: vi.fn().mockResolvedValue(undefined)
  } as unknown as NotificationDispatcher & { dispatch: ReturnType<typeof vi.fn> };

  return { notifications, composer, dispatcher };
}

function createNotificationRepo(notifications: NotificationRecord[]): NotificationRepo {
  return {
    create(payload: Partial<NotificationRecord>) {
      return {
        notificationId: `notification-${notifications.length + 1}`,
        createdAt: new Date("2026-05-13T09:00:00.000Z"),
        ...payload
      } as NotificationRecord;
    },
    async save(notification: NotificationRecord): Promise<NotificationRecord> {
      notifications.push(notification);
      return notification;
    }
  } as unknown as NotificationRepo;
}

function createRecipientResolution(
  overrides: Partial<RecipientResolution>
): RecipientResolution {
  return {
    recipientAccountId: overrides.recipientAccountId ?? "host-001",
    activityContext: overrides.activityContext ?? {
      activityId: "activity-001",
      hostAccountId: "host-001",
      title: "Lunch near the library",
      scheduledDateTime: new Date("2026-05-15T12:00:00.000Z"),
      participationMode: "approval_based"
    },
    suppressed: overrides.suppressed ?? false,
    suppressionReason: overrides.suppressionReason
  };
}

function createActivity() {
  return {
    activityId: "activity-001",
    hostAccountId: "host-001",
    title: "Lunch near the library",
    scheduledDateTime: new Date("2026-05-15T12:00:00.000Z"),
    participationMode: "approval_based",
    status: ActivityStatus.Open
  };
}

function createParticipation(overrides: {
  participationId: string;
  studentAccountId: string;
}) {
  return {
    participationId: overrides.participationId,
    activityId: "activity-001",
    studentAccountId: overrides.studentAccountId,
    status: ParticipationStatus.Confirmed
  };
}

function createActiveAccount(studentAccountId: string) {
  return {
    studentAccountId,
    platformAccessStatus: PlatformAccessStatus.Active
  };
}

function createInactiveAccount(studentAccountId: string) {
  return {
    studentAccountId,
    platformAccessStatus: PlatformAccessStatus.Suspended
  };
}

function createCancellationHandlerHarness(input: {
  participations: Array<ReturnType<typeof createParticipation>>;
  accounts: Record<string, ReturnType<typeof createActiveAccount> | ReturnType<typeof createInactiveAccount> | null>;
  blocked?: boolean;
}) {
  const { notifications, composer, dispatcher } = createNotificationHarness();
  const blockService = { shouldSuppress: vi.fn().mockResolvedValue(input.blocked ?? false) };
  const handler = new CancellationHandler(
    { findOne: vi.fn().mockResolvedValue(createActivity()) } as any,
    { find: vi.fn().mockResolvedValue(input.participations) } as any,
    {
      findOne: vi.fn(async (query: any) => input.accounts[query.where.studentAccountId] ?? null)
    } as any,
    blockService as any,
    composer,
    dispatcher
  );

  return { notifications, dispatcher, blockService, handler };
}

function createLeaveHandlerHarness(input: { blocked?: boolean } = {}) {
  const { notifications, composer, dispatcher } = createNotificationHarness();
  const handler = new LeaveEventHandler(
    { findOne: vi.fn().mockResolvedValue(createActivity()) } as any,
    { findOne: vi.fn().mockResolvedValue(createActiveAccount("host-001")) } as any,
    { shouldSuppress: vi.fn().mockResolvedValue(input.blocked ?? false) } as any,
    composer,
    dispatcher
  );

  return { notifications, dispatcher, handler };
}

function createNotificationRecord(
  overrides: Partial<NotificationRecord> = {}
): NotificationRecord {
  return {
    notificationId: overrides.notificationId ?? "notification-001",
    recipientAccountId: overrides.recipientAccountId ?? "student-001",
    notificationType: overrides.notificationType ?? NotificationType.JoinEvent,
    notificationChannels: overrides.notificationChannels ?? "PushAndInApp",
    notificationTitle: overrides.notificationTitle ?? "Notification title",
    notificationMessage: overrides.notificationMessage ?? "Notification message",
    relatedActivityId: overrides.relatedActivityId ?? null,
    relatedParticipationId: overrides.relatedParticipationId ?? null,
    targetContextType: overrides.targetContextType ?? TargetContextType.ActivityDetails,
    targetContextId: overrides.targetContextId ?? "activity-001",
    triggeringAccountId: overrides.triggeringAccountId ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-05-13T09:00:00.000Z")
  };
}

function createMockRequest(input: {
  studentAccountId: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
}) {
  return {
    params: input.params ?? {},
    query: input.query ?? {},
    studentContext: {
      studentAccountId: input.studentAccountId,
      universityEmail: "student@tongji.edu.cn",
      selectedCampusId: "campus-001",
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    }
  } as any;
}

function createMockResponse() {
  return {
    statusCode: 200,
    jsonPayload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonPayload = payload;
      return this;
    }
  };
}

function createNotificationContextController(input: {
  notification: NotificationRecord | null;
  activity?: ReturnType<typeof createActivity> | null;
  blocked?: boolean;
}) {
  return new NotificationContextController(
    {
      findById: vi.fn().mockResolvedValue(input.notification)
    } as unknown as NotificationRepo,
    {
      findOne: vi.fn().mockResolvedValue(
        input.activity === undefined ? createActivity() : input.activity
      )
    } as any,
    {
      shouldSuppress: vi.fn().mockResolvedValue(input.blocked ?? false)
    } as any
  );
}

function createReminderEvent() {
  return {
    eventId: "event-014",
    eventType: "ActivityReminderDue" as const,
    occurredAt: "2026-05-14T08:00:00.000Z",
    activityId: "activity-001",
    scheduledStartAt: "2026-05-14T08:30:00.000Z",
    reminderThresholdMinutes: 30
  };
}

function createReminderParticipation(input: {
  participationId: string;
  studentAccountId: string;
  recordType: ParticipationRecordType;
  status: ParticipationStatus;
}) {
  return {
    participationId: input.participationId,
    activityId: "activity-001",
    studentAccountId: input.studentAccountId,
    recordType: input.recordType,
    status: input.status
  };
}

function createReminderHandlerHarness(input: {
  activityStatus?: ActivityStatus;
  participations?: Array<ReturnType<typeof createReminderParticipation>>;
  accounts?: Record<string, ReturnType<typeof createActiveAccount> | ReturnType<typeof createInactiveAccount> | null>;
} = {}) {
  const { notifications, composer, dispatcher } = createNotificationHarness();
  const activity = {
    ...createActivity(),
    status: input.activityStatus ?? ActivityStatus.Open
  };
  const participations = input.participations ?? [];
  const accounts = input.accounts ?? Object.fromEntries(
    participations.map((participation) => [
      participation.studentAccountId,
      createActiveAccount(participation.studentAccountId)
    ])
  );
  const participationRepo = {
    find: vi.fn().mockImplementation(async (options: { where: Record<string, unknown> }) => {
      return participations.filter(
        (participation) =>
          participation.activityId === options.where.activityId &&
          participation.recordType === options.where.recordType &&
          participation.status === options.where.status
      );
    })
  };
  const handler = new ReminderHandler(
    {
      findOne: vi.fn().mockResolvedValue(activity)
    } as any,
    participationRepo as any,
    {
      findOne: vi.fn(async (query: any) => accounts[query.where.studentAccountId] ?? null)
    } as any,
    composer,
    dispatcher
  );

  return { notifications, dispatcher, handler, participationRepo };
}

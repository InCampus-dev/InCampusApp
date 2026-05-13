import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationRecord } from "../entities/NotificationRecord";
import { ApplicationOutcomeHandler } from "../handlers/ApplicationOutcomeHandler";
import { JoinEventHandler } from "../handlers/JoinEventHandler";
import { NotificationRepo } from "../repositories/NotificationRepo";
import { NotificationComposer } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";
import { RecipientResolution } from "../services/RecipientResolutionService";
import { TargetContextType } from "../../../shared/src/domain/enums";

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

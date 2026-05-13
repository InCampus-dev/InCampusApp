// Task: NSF02 | Path: backend/packages/notifications-system-flow/src/handlers/JoinEventHandler.ts

import { NotificationType, TargetContextType } from "../../../shared/src/domain/enums";
import { BlockSuppressionService } from "../services/BlockSuppressionService";
import { NotificationComposer } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";
import { RecipientResolutionService } from "../services/RecipientResolutionService";

/**
 * NSF02: Consumes DirectJoinCompleted and JoinRequestSubmitted events.
 * Source: DUC-NSF-01, Notification Event Handling Sequence Diagram v1.1.
 *
 * Flow:
 *   1. Resolve host as recipient (read DS-HL-001, DS-HL-002, DS-AP-001)
 *   2. Check block suppression between trigger and host (read DS-SM-001)
 *   3. Compose and persist notification in DS-NS-001
 *   4. Dispatch notification
 *
 * NSF never modifies upstream stores.
 */
export interface JoinEventPayload {
  eventId: string;
  eventType: "DirectJoinCompleted" | "JoinRequestSubmitted";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  participationId: string;
}

export class JoinEventHandler {
  constructor(
    private readonly recipientService: RecipientResolutionService,
    private readonly blockService: BlockSuppressionService,
    private readonly composer: NotificationComposer,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  public getHandledEvents(): Array<JoinEventPayload["eventType"]> {
    return ["DirectJoinCompleted", "JoinRequestSubmitted"];
  }

  public async handle(event: JoinEventPayload): Promise<void> {
    // Step 1: Resolve host as recipient
    const resolution = await this.recipientService.resolveHostRecipient(
      event.activityId,
      event.participationId
    );

    if (resolution.suppressed) {
      console.log(
        `[NSF02] Notification suppressed: event=${event.eventType}, ` +
          `reason=${resolution.suppressionReason}, activity=${event.activityId}`
      );
      return;
    }

    // Step 2: Block suppression check
    const blocked = await this.blockService.shouldSuppress(
      event.triggeringAccountId,
      resolution.recipientAccountId
    );
    if (blocked) {
      console.log(
        `[NSF02] Notification suppressed by block: ` +
          `trigger=${event.triggeringAccountId}, recipient=${resolution.recipientAccountId}`
      );
      return;
    }

    // Step 3: JoinRequestSubmitted → JoinRequestReview; DirectJoinCompleted → ActivityDetails
    const targetContextType =
      event.eventType === "JoinRequestSubmitted"
        ? TargetContextType.JoinRequestReview
        : TargetContextType.ActivityDetails;

    // Step 4: Compose and persist notification
    const notification = await this.composer.compose({
      recipientAccountId: resolution.recipientAccountId,
      notificationType: NotificationType.JoinEvent,
      activityContext: resolution.activityContext,
      participationId: event.participationId,
      triggeringAccountId: event.triggeringAccountId,
      targetContextType,
      eventType: event.eventType,
    });

    // Step 5: Dispatch
    await this.dispatcher.dispatch({
      notificationId: notification.notificationId,
      recipientAccountId: notification.recipientAccountId,
      notificationTitle: notification.notificationTitle,
      notificationMessage: notification.notificationMessage,
      notificationChannels: notification.notificationChannels,
    });

    console.log(
      `[NSF02] Notification created: id=${notification.notificationId}, ` +
        `type=${event.eventType}, activity=${event.activityId}`
    );
  }
}

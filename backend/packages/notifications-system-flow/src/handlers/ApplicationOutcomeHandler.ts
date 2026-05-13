// Task: NSF03 | Path: backend/packages/notifications-system-flow/src/handlers/ApplicationOutcomeHandler.ts

import { NotificationType, TargetContextType } from "../../../shared/src/domain/enums";
import { BlockSuppressionService } from "../services/BlockSuppressionService";
import { NotificationComposer } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";
import { RecipientResolutionService } from "../services/RecipientResolutionService";

/**
 * NSF03: Consumes JoinRequestApproved and JoinRequestDeclined events.
 * Source: DUC-NSF-02 (Notify Participant of Application Outcome).
 *
 * Flow:
 *   1. Resolve applicant as recipient (read DS-HL-002, DS-HL-001, DS-AP-001)
 *   2. Check block suppression between host and applicant (read DS-SM-001)
 *   3. Compose and persist notification in DS-NS-001 (FR-0703: title/message/result; FR-0704: stored for list)
 *   4. Dispatch notification
 *
 * NSF never modifies upstream stores.
 */
export interface ApplicationOutcomePayload {
  eventId: string;
  eventType: "JoinRequestApproved" | "JoinRequestDeclined";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string; // host who approved/declined
  participationId: string;
  outcome: "approved" | "declined";
}

export class ApplicationOutcomeHandler {
  constructor(
    private readonly recipientService: RecipientResolutionService,
    private readonly blockService: BlockSuppressionService,
    private readonly composer: NotificationComposer,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  public getHandledEvents(): Array<ApplicationOutcomePayload["eventType"]> {
    return ["JoinRequestApproved", "JoinRequestDeclined"];
  }

  public async handle(event: ApplicationOutcomePayload): Promise<void> {
    // Step 1: Resolve applicant as recipient
    const resolution = await this.recipientService.resolveApplicantRecipient(
      event.activityId,
      event.participationId,
      event.triggeringAccountId
    );

    if (resolution.suppressed) {
      console.log(
        `[NSF03] Notification suppressed: event=${event.eventType}, ` +
          `reason=${resolution.suppressionReason}, activity=${event.activityId}`
      );
      return;
    }

    // Step 2: Block suppression check between host and applicant
    const blocked = await this.blockService.shouldSuppress(
      event.triggeringAccountId,
      resolution.recipientAccountId
    );
    if (blocked) {
      console.log(
        `[NSF03] Notification suppressed by block: ` +
          `host=${event.triggeringAccountId}, applicant=${resolution.recipientAccountId}`
      );
      return;
    }

    // Step 3: approved → ActivityDetails; declined → PersonalActivityContext (per DUC-NSF-02)
    const targetContextType =
      event.outcome === "approved"
        ? TargetContextType.ActivityDetails
        : TargetContextType.PersonalActivityContext;

    // Step 4: Compose and persist notification
    const notification = await this.composer.compose({
      recipientAccountId: resolution.recipientAccountId,
      notificationType: NotificationType.ApplicationOutcome,
      activityContext: resolution.activityContext,
      participationId: event.participationId,
      triggeringAccountId: event.triggeringAccountId,
      targetContextType,
      eventType: event.eventType,
      outcome: event.outcome,
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
      `[NSF03] Notification created: id=${notification.notificationId}, ` +
        `type=${event.eventType}, outcome=${event.outcome}, ` +
        `activity=${event.activityId}, recipient=${resolution.recipientAccountId}`
    );
  }
}

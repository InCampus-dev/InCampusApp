// Task: NSF02 | Path: backend/packages/notifications-system-flow/src/services/NotificationComposer.ts

import { NotificationType, TargetContextType } from "../../../shared/src/domain/enums";
import { NotificationRecord } from "../entities/NotificationRecord";
import { NotificationRepo } from "../repositories/NotificationRepo";
import { ActivityContext } from "./RecipientResolutionService";

/**
 * Composes and persists notification records in DS-NS-001.
 * NSF is the sole writer of DS-NS-001.
 * Records store references only; they must not duplicate business state.
 */
export interface ComposeInput {
  recipientAccountId: string;
  notificationType: NotificationType;
  activityContext: ActivityContext;
  participationId: string | null;
  triggeringAccountId: string | null;
  targetContextType: TargetContextType;
  eventType: string;
  outcome?: string | null;
}

export class NotificationComposer {
  constructor(private readonly notificationRepo: NotificationRepo) {}

  public async compose(input: ComposeInput): Promise<NotificationRecord> {
    const title = this.buildTitle(input);
    const message = this.buildMessage(input);

    const record = this.notificationRepo.create({
      recipientAccountId: input.recipientAccountId,
      notificationType: input.notificationType,
      notificationChannels: "PushAndInApp",
      notificationTitle: title,
      notificationMessage: message,
      relatedActivityId: input.activityContext.activityId ?? null,
      relatedParticipationId: input.participationId ?? null,
      targetContextType: input.targetContextType,
      targetContextId: input.activityContext.activityId ?? null,
      triggeringAccountId: input.triggeringAccountId ?? null,
    });

    return this.notificationRepo.save(record);
  }

  private buildTitle(input: ComposeInput): string {
    switch (input.notificationType) {
      case NotificationType.JoinEvent:
        return input.eventType === "DirectJoinCompleted"
          ? "New participant joined"
          : "New join request";
      case NotificationType.ApplicationOutcome:
        return input.outcome === "approved" ? "Join request approved" : "Join request declined";
      case NotificationType.ActivityCancellation:
        return "Activity cancelled";
      case NotificationType.LeaveEvent:
        return "Participant left activity";
      case NotificationType.ActivityReminder:
        return "Activity starting soon";
      default:
        return "Notification";
    }
  }

  private buildMessage(input: ComposeInput): string {
    const actTitle = input.activityContext.title || "an activity";
    switch (input.notificationType) {
      case NotificationType.JoinEvent:
        return input.eventType === "DirectJoinCompleted"
          ? `A student has joined "${actTitle}".`
          : `A student has requested to join "${actTitle}".`;
      case NotificationType.ApplicationOutcome:
        return input.outcome === "approved"
          ? `Your request to join "${actTitle}" has been approved.`
          : `Your request to join "${actTitle}" has been declined.`;
      case NotificationType.ActivityCancellation:
        return `The activity "${actTitle}" has been cancelled.`;
      case NotificationType.LeaveEvent:
        return `A participant has left "${actTitle}".`;
      case NotificationType.ActivityReminder:
        return `Your activity "${actTitle}" is coming up soon.`;
      default:
        return `Notification about "${actTitle}".`;
    }
  }
}

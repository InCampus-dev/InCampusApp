import { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import { ParticipationRepo } from "../../../hosting-lifecycle/src/repositories/ParticipationRepo";
import {
  NotificationType,
  ParticipationStatus,
  PlatformAccessStatus,
  TargetContextType
} from "../../../shared/src/domain/enums";
import type { ActivityCancelledEvent } from "../../../shared/src/events/EventBus";
import { BlockSuppressionService } from "../services/BlockSuppressionService";
import { NotificationComposer } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";

/**
 * NSF04: Consumes ActivityCancelled and notifies confirmed participants.
 * Source: DUC-NSF-03 (Notify Participant of Activity Cancellation).
 */
export class CancellationHandler {
  constructor(
    private readonly activityRepo: ActivityRepo,
    private readonly participationRepo: ParticipationRepo,
    private readonly studentAccountRepo: StudentAccountRepo,
    private readonly blockService: BlockSuppressionService,
    private readonly composer: NotificationComposer,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  public getHandledEvents(): Array<ActivityCancelledEvent["eventType"]> {
    return ["ActivityCancelled"];
  }

  public async handle(event: ActivityCancelledEvent): Promise<void> {
    const activity = await this.activityRepo.findOne({
      where: { activityId: event.activityId }
    });
    if (!activity) {
      console.log(
        `[NSF04] Notification suppressed: event=${event.eventType}, ` +
          `reason=ActivityNotFound, activity=${event.activityId}`
      );
      return;
    }

    const confirmedParticipations = await this.participationRepo.find({
      where: {
        activityId: event.activityId,
        status: ParticipationStatus.Confirmed
      }
    });
    if (confirmedParticipations.length === 0) {
      console.log(
        `[NSF04] No confirmed participants to notify: activity=${event.activityId}`
      );
      return;
    }

    const activityContext = {
      activityId: activity.activityId,
      hostAccountId: activity.hostAccountId,
      title: activity.title,
      scheduledDateTime: activity.scheduledDateTime,
      participationMode: activity.participationMode
    };

    let createdNotifications = 0;

    for (const participation of confirmedParticipations) {
      const participantAccount = await this.studentAccountRepo.findOne({
        where: { studentAccountId: participation.studentAccountId }
      });
      if (!participantAccount || participantAccount.platformAccessStatus !== PlatformAccessStatus.Active) {
        console.log(
          `[NSF04] Notification suppressed: event=${event.eventType}, ` +
            `reason=ParticipantAccountNotActive, recipient=${participation.studentAccountId}`
        );
        continue;
      }

      const blocked = await this.blockService.shouldSuppress(
        event.triggeringAccountId,
        participation.studentAccountId
      );
      if (blocked) {
        console.log(
          `[NSF04] Notification suppressed by block: ` +
            `host=${event.triggeringAccountId}, participant=${participation.studentAccountId}`
        );
        continue;
      }

      const notification = await this.composer.compose({
        recipientAccountId: participation.studentAccountId,
        notificationType: NotificationType.ActivityCancellation,
        activityContext,
        participationId: participation.participationId,
        triggeringAccountId: event.triggeringAccountId,
        targetContextType: TargetContextType.CancelledActivityContext,
        eventType: event.eventType,
        outcome: event.outcome
      });

      await this.dispatcher.dispatch({
        notificationId: notification.notificationId,
        recipientAccountId: notification.recipientAccountId,
        notificationTitle: notification.notificationTitle,
        notificationMessage: notification.notificationMessage,
        notificationChannels: notification.notificationChannels
      });

      createdNotifications += 1;
    }

    console.log(
      `[NSF04] Notifications created: count=${createdNotifications}, activity=${event.activityId}`
    );
  }
}

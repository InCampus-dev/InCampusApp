import { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import {
  NotificationType,
  PlatformAccessStatus,
  TargetContextType
} from "../../../shared/src/domain/enums";
import type { JoinedParticipantLeftEvent } from "../../../shared/src/events/EventBus";
import { BlockSuppressionService } from "../services/BlockSuppressionService";
import { NotificationComposer } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";

/**
 * NSF05: Consumes JoinedParticipantLeft and notifies the activity host.
 * Source: DUC-NSF-05 (Notify Host of Leave Event).
 */
export class LeaveEventHandler {
  constructor(
    private readonly activityRepo: ActivityRepo,
    private readonly studentAccountRepo: StudentAccountRepo,
    private readonly blockService: BlockSuppressionService,
    private readonly composer: NotificationComposer,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  public getHandledEvents(): Array<JoinedParticipantLeftEvent["eventType"]> {
    return ["JoinedParticipantLeft"];
  }

  public async handle(event: JoinedParticipantLeftEvent): Promise<void> {
    const activity = await this.activityRepo.findOne({
      where: { activityId: event.activityId }
    });
    if (!activity) {
      console.log(
        `[NSF05] Notification suppressed: event=${event.eventType}, ` +
          `reason=ActivityNotFound, activity=${event.activityId}`
      );
      return;
    }

    const hostAccount = await this.studentAccountRepo.findOne({
      where: { studentAccountId: activity.hostAccountId }
    });
    if (!hostAccount || hostAccount.platformAccessStatus !== PlatformAccessStatus.Active) {
      console.log(
        `[NSF05] Notification suppressed: event=${event.eventType}, ` +
          `reason=HostAccountNotActive, activity=${event.activityId}`
      );
      return;
    }

    const blocked = await this.blockService.shouldSuppress(
      event.triggeringAccountId,
      activity.hostAccountId
    );
    if (blocked) {
      console.log(
        `[NSF05] Notification suppressed by block: ` +
          `trigger=${event.triggeringAccountId}, recipient=${activity.hostAccountId}`
      );
      return;
    }

    const notification = await this.composer.compose({
      recipientAccountId: activity.hostAccountId,
      notificationType: NotificationType.LeaveEvent,
      activityContext: {
        activityId: activity.activityId,
        hostAccountId: activity.hostAccountId,
        title: activity.title,
        scheduledDateTime: activity.scheduledDateTime,
        participationMode: activity.participationMode
      },
      participationId: event.participationId,
      triggeringAccountId: event.triggeringAccountId,
      targetContextType: TargetContextType.ActivityDetails,
      eventType: event.eventType
    });

    await this.dispatcher.dispatch({
      notificationId: notification.notificationId,
      recipientAccountId: notification.recipientAccountId,
      notificationTitle: notification.notificationTitle,
      notificationMessage: notification.notificationMessage,
      notificationChannels: notification.notificationChannels
    });

    console.log(
      `[NSF05] Notification created: id=${notification.notificationId}, ` +
        `activity=${event.activityId}, recipient=${activity.hostAccountId}`
    );
  }
}

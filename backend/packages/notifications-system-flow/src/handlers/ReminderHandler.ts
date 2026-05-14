// Task: NSF06 | Path: backend/packages/notifications-system-flow/src/handlers/ReminderHandler.ts

import { Repository } from "typeorm";

import {
  type ActivityReminderDueEvent
} from "../../../shared/src/events/EventBus";
import {
  ActivityStatus,
  NotificationType,
  ParticipationRecordType,
  ParticipationStatus,
  PlatformAccessStatus,
  TargetContextType
} from "../../../shared/src/domain/enums";
import { NotificationComposer, type ComposeInput } from "../services/NotificationComposer";
import { NotificationDispatcher } from "../services/NotificationDispatcher";
import type { ActivityContext } from "../services/RecipientResolutionService";

export class ReminderHandler {
  constructor(
    private readonly activityRepo: Repository<any>,
    private readonly participationRepo: Repository<any>,
    private readonly studentAccountRepo: Repository<any>,
    private readonly composer: NotificationComposer,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  public getHandledEvents(): Array<"ActivityReminderDue"> {
    return ["ActivityReminderDue"];
  }

  public async handle(event: ActivityReminderDueEvent): Promise<void> {
    const activity = await this.activityRepo.findOne({
      where: { activityId: event.activityId }
    });
    if (!activity) {
      return;
    }

    if (activity.status !== ActivityStatus.Open && activity.status !== ActivityStatus.Full) {
      return;
    }

    const joinedParticipants = await this.participationRepo.find({
      where: {
        activityId: event.activityId,
        recordType: ParticipationRecordType.Participation,
        status: ParticipationStatus.Confirmed
      }
    });
    if (joinedParticipants.length === 0) {
      return;
    }

    const activityContext: ActivityContext = {
      activityId: activity.activityId,
      hostAccountId: activity.hostAccountId,
      title: activity.title,
      scheduledDateTime: activity.scheduledDateTime,
      participationMode: activity.participationMode
    };

    for (const participant of joinedParticipants) {
      const account = await this.studentAccountRepo.findOne({
        where: { studentAccountId: participant.studentAccountId }
      });
      if (!account || account.platformAccessStatus !== PlatformAccessStatus.Active) {
        continue;
      }

      const composeInput: ComposeInput = {
        recipientAccountId: participant.studentAccountId,
        notificationType: NotificationType.ActivityReminder,
        activityContext,
        participationId: participant.participationId ?? null,
        triggeringAccountId: null,
        targetContextType: TargetContextType.ActivityDetails,
        eventType: "ActivityReminderDue"
      };

      const saved = await this.composer.compose(composeInput);
      await this.dispatcher.dispatch(saved);
    }
  }
}

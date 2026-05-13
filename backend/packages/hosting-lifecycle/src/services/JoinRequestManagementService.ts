import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Activity } from "../entities/Activity";
import { Participation } from "../entities/Participation";
import { ActivityStatus, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import {
  type JoinRequestApprovedEvent,
  type JoinRequestDeclinedEvent
} from "../../../shared/src/events/EventBus";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";

export interface JoinRequestEventDispatcherPort {
  dispatch(eventName: string, payload: any): Promise<void>;
}

export class JoinRequestManagementService {
  constructor(
    private dataSource: DataSource,
    private eventDispatcher: JoinRequestEventDispatcherPort
  ) {}

  async getPendingRequests(hostAccountId: string, activityId: string): Promise<Participation[]> {
    const participationRepo = this.dataSource.getRepository(Participation);
    const activityRepo = this.dataSource.getRepository(Activity);

    const activity = await activityRepo.findOne({ where: { activityId } });
    if (!activity) throw new Error("Activity not found");
    if (activity.hostAccountId !== hostAccountId) {
      throw new Error("Unauthorized: Only the host can view requests");
    }

    return participationRepo.find({
      where: {
        activityId,
        status: ParticipationStatus.Pending
      }
    });
  }

  async reviewJoinRequest(
    hostAccountId: string,
    activityId: string,
    participationId: string,
    decision: "approve" | "decline"
  ): Promise<Participation> {
    const { savedParticipation, eventName, eventPayload } = await executeTransaction(
      this.dataSource,
      async (manager) => {
        // 1. Lock the activity to prevent concurrent capacity updates (Task S07)
        const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId });

        if (!activity) throw new Error("Activity not found");
        if (activity.hostAccountId !== hostAccountId) {
          throw new Error("Unauthorized: Only the host can review requests");
        }

        // 2. Fetch the participation request
        const participation = await manager.findOne(Participation, {
          where: { participationId, activityId }
        });
        if (!participation) throw new Error("Join request not found");
        if (participation.status !== ParticipationStatus.Pending) {
          throw new Error("This request is not pending");
        }
        let eventName: "JoinRequestApproved" | "JoinRequestDeclined";

        // 3. Process decision
        if (decision === "approve") {
          if (activity.currentParticipantCount >= activity.maxParticipants) {
            throw new Error("Cannot approve request: Activity is already full");
          }
          participation.status = ParticipationStatus.Confirmed;
          participation.recordType = ParticipationRecordType.Participation;
          activity.currentParticipantCount += 1;
          activity.currentRequestCount = Math.max(0, activity.currentRequestCount - 1);
          if (activity.currentParticipantCount === activity.maxParticipants) {
            activity.status = ActivityStatus.Full;
          }
          eventName = "JoinRequestApproved";
        } else {
          participation.status = ParticipationStatus.Declined;
          activity.currentRequestCount = Math.max(0, activity.currentRequestCount - 1);
          eventName = "JoinRequestDeclined";
        }

        // 4. Save changes atomically
        await manager.save(Activity, activity);
        const savedParticipation = await manager.save(Participation, participation);
        const occurredAt = new Date().toISOString();
        const eventPayload =
          eventName === "JoinRequestApproved"
            ? ({
                eventId: randomUUID(),
                eventType: "JoinRequestApproved",
                occurredAt,
                activityId: activity.activityId,
                triggeringAccountId: hostAccountId,
                participationId: savedParticipation.participationId,
                outcome: "approved"
              } satisfies JoinRequestApprovedEvent)
            : ({
                eventId: randomUUID(),
                eventType: "JoinRequestDeclined",
                occurredAt,
                activityId: activity.activityId,
                triggeringAccountId: hostAccountId,
                participationId: savedParticipation.participationId,
                outcome: "declined"
              } satisfies JoinRequestDeclinedEvent);

        return {
          savedParticipation,
          eventName,
          eventPayload
        };
      }
    );

    await this.eventDispatcher.dispatch(eventName, eventPayload);
    return savedParticipation;
  }
}

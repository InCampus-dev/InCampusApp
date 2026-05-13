import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import { BlockLookupPort } from "./FeedService";
import { ActivityStatus, ParticipationMode, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import {
  type DirectJoinCompletedEvent,
  type JoinRequestSubmittedEvent
} from "../../../shared/src/events/EventBus";
import { AppError } from "../../../shared/src/errors/AppError";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";

// Interface to emit events to the shared EventBus without hard coupling
export interface EventDispatcherPort {
  dispatch(eventName: string, payload: any): Promise<void>;
}

export class JoinService {
  constructor(
    private dataSource: DataSource,
    private blockLookup: BlockLookupPort,
    private eventDispatcher: EventDispatcherPort
  ) {}

  async joinActivity(studentAccountId: string, campusId: string, activityId: string): Promise<Participation> {
    const { savedParticipation, eventName, eventPayload } = await executeTransaction(
      this.dataSource,
      async (manager) => {
        // 1. Lock the activity to prevent concurrent capacity updates (Task S07)
        const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId });

        if (!activity) {
          throw AppError.notFound("Activity", activityId);
        }
        if (activity.campusId !== campusId) {
          throw AppError.notFound("Activity", activityId); // Cross-campus isolation
        }

        // 2. Block suppression: Blocked users cannot initiate join interactions
        const blockedIds = await this.blockLookup.getBlockedAndBlockerIds(studentAccountId);
        if (blockedIds.includes(activity.hostAccountId)) {
          throw AppError.notFound("Activity", activityId); // Opaque error
        }

        // 3. Status and rule checks
        if (activity.status !== ActivityStatus.Open) {
          throw AppError.conflict("Activity is not open for joining", "Activity");
        }
        if (activity.hostAccountId === studentAccountId) {
          throw AppError.conflict("Host cannot join their own activity", "Activity");
        }

        // 4. Check for existing active participation/request
        const existing = await manager.findOne(Participation, {
          where: [
            { activityId, studentAccountId, status: ParticipationStatus.Pending },
            { activityId, studentAccountId, status: ParticipationStatus.Confirmed }
          ]
        });
        if (existing) {
          throw AppError.conflict(
            "You have already joined or requested to join this activity",
            "Participation"
          );
        }

        const participation = manager.create(Participation, { activityId, studentAccountId });
        let eventName: "DirectJoinCompleted" | "JoinRequestSubmitted";

        // 5. Process based on participation mode
        if (activity.participationMode === ParticipationMode.Open) {
          if (activity.currentParticipantCount >= activity.maxParticipants) {
            throw AppError.conflict("Activity is already full", "Activity");
          }
          participation.recordType = ParticipationRecordType.Participation;
          participation.status = ParticipationStatus.Confirmed;
          activity.currentParticipantCount += 1;

          if (activity.currentParticipantCount === activity.maxParticipants) {
            activity.status = ActivityStatus.Full;
          }
          eventName = "DirectJoinCompleted";
        } else {
          if (activity.maxRequests !== null && activity.currentRequestCount >= activity.maxRequests) {
            throw AppError.conflict(
              "Activity has reached the maximum number of pending requests",
              "Activity"
            );
          }
          participation.recordType = ParticipationRecordType.Request;
          participation.status = ParticipationStatus.Pending;
          activity.currentRequestCount += 1;
          eventName = "JoinRequestSubmitted";
        }

        // 6. Save changes atomically
        await manager.save(Activity, activity);
        const savedParticipation = await manager.save(Participation, participation);
        const occurredAt = new Date().toISOString();
        const eventPayload: DirectJoinCompletedEvent | JoinRequestSubmittedEvent = {
          eventId: randomUUID(),
          eventType: eventName,
          occurredAt,
          activityId: activity.activityId,
          triggeringAccountId: studentAccountId,
          participationId: savedParticipation.participationId
        };

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

import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Activity } from "../entities/Activity";
import { Participation } from "../entities/Participation";
import { ActivityStatus, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import {
  type JoinRequestApprovedEvent,
  type JoinRequestDeclinedEvent
} from "../../../shared/src/events/EventBus";
import { AppError } from "../../../shared/src/errors/AppError";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";
import { findOtherActiveByActivityAndStudent } from "../repositories/ParticipationRepo";

export interface JoinRequestEventDispatcherPort {
  dispatch(eventName: string, payload: any): Promise<void>;
}

export interface JoinRequestApplicantSummary {
  studentAccountId: string;
  studentDisplayName?: string;
}

export interface JoinRequestApplicantLookupPort {
  getApplicantSummary(studentAccountId: string): Promise<JoinRequestApplicantSummary | null>;
}

export type PendingJoinRequestListItem = Participation & {
  applicant: JoinRequestApplicantSummary;
  studentDisplayName?: string;
};

export class JoinRequestManagementService {
  constructor(
    private dataSource: DataSource,
    private eventDispatcher: JoinRequestEventDispatcherPort,
    private applicantLookup?: JoinRequestApplicantLookupPort
  ) {}

  async getPendingRequests(
    hostAccountId: string,
    activityId: string
  ): Promise<PendingJoinRequestListItem[]> {
    const participationRepo = this.dataSource.getRepository(Participation);
    const activityRepo = this.dataSource.getRepository(Activity);

    const activity = await activityRepo.findOne({ where: { activityId } });
    if (!activity) throw AppError.notFound("Activity", activityId);
    if (activity.hostAccountId !== hostAccountId) {
      throw new AppError("AUTH_FORBIDDEN", "Unauthorized: Only the host can view requests", 403, {
        authReason: "not_activity_host"
      });
    }

    const pendingRequests = await participationRepo.find({
      where: {
        activityId,
        recordType: ParticipationRecordType.Request,
        status: ParticipationStatus.Pending
      }
    });

    return await Promise.all(
      pendingRequests.map((request) => this.attachApplicantSummary(request))
    );
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
        if (
          participation.recordType !== ParticipationRecordType.Request ||
          participation.status !== ParticipationStatus.Pending
        ) {
          throw new Error("This request is not pending");
        }
        let eventName: "JoinRequestApproved" | "JoinRequestDeclined";

        // 3. Process decision
        if (decision === "approve") {
          const duplicateActiveParticipation = await findOtherActiveByActivityAndStudent(
            {
              findOne: (options) => manager.findOne(Participation, options)
            },
            activityId,
            participation.studentAccountId,
            participation.participationId
          );

          if (duplicateActiveParticipation) {
            throw new Error("Cannot approve request: Student already has an active participation record");
          }

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

  private async attachApplicantSummary(
    request: Participation
  ): Promise<PendingJoinRequestListItem> {
    const applicantSummary =
      (await this.applicantLookup?.getApplicantSummary(request.studentAccountId)) ?? {
        studentAccountId: request.studentAccountId
      };

    const enrichedRequest = request as PendingJoinRequestListItem;
    enrichedRequest.applicant = applicantSummary;

    if (applicantSummary.studentDisplayName) {
      enrichedRequest.studentDisplayName = applicantSummary.studentDisplayName;
    }

    return enrichedRequest;
  }
}

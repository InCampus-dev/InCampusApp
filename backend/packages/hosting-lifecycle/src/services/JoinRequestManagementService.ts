import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Activity } from "../entities/Activity";
import { Participation } from "../entities/Participation";
import type {
  JoinRequestApplicantProfileDto,
  JoinRequestListItemDto
} from "../../../shared/src/domain/dtos";
import {
  ActivityStatus,
  ParticipationRecordType,
  ParticipationStatus
} from "../../../shared/src/domain/enums";
import {
  type JoinRequestApprovedEvent,
  type JoinRequestDeclinedEvent
} from "../../../shared/src/events/EventBus";
import { AppError } from "../../../shared/src/errors/AppError";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";
import { findOtherActiveByActivityAndStudent } from "../repositories/ParticipationRepo";
import { isGuestCapacityFull } from "./activityCapacity";

export interface JoinRequestEventDispatcherPort {
  dispatch(eventName: string, payload: any): Promise<void>;
}

export interface JoinRequestApplicantProfileLookupPort {
  getApplicantProfile(applicantId: string): Promise<JoinRequestApplicantProfileDto | null>;
}

export class JoinRequestManagementService {
  constructor(
    private dataSource: DataSource,
    private eventDispatcher: JoinRequestEventDispatcherPort,
    private applicantProfileLookup: JoinRequestApplicantProfileLookupPort
  ) {}

  async getPendingRequests(
    hostAccountId: string,
    campusId: string,
    activityId: string
  ): Promise<JoinRequestListItemDto[]> {
    const participationRepo = this.dataSource.getRepository(Participation);
    const activityRepo = this.dataSource.getRepository(Activity);

    const activity = await activityRepo.findOne({ where: { activityId } });
    if (!activity) throw AppError.notFound("Activity", activityId);
    if (activity.campusId !== campusId) throw AppError.notFound("Activity", activityId);
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

    return Promise.all(
      pendingRequests.map((request) => this.toJoinRequestListItem(request))
    );
  }

  async reviewJoinRequest(
    hostAccountId: string,
    campusId: string,
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
        if (activity.campusId !== campusId) throw new Error("Activity not found");
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

          if (isGuestCapacityFull(activity)) {
            throw new Error("Cannot approve request: Activity is already full");
          }
          participation.status = ParticipationStatus.Confirmed;
          participation.recordType = ParticipationRecordType.Participation;
          activity.currentParticipantCount += 1;
          activity.currentRequestCount = Math.max(0, activity.currentRequestCount - 1);
          if (isGuestCapacityFull(activity)) {
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

  private async toJoinRequestListItem(
    request: Participation
  ): Promise<JoinRequestListItemDto> {
    const applicantProfile = await this.applicantProfileLookup.getApplicantProfile(
      request.studentAccountId
    );

    if (!applicantProfile) {
      throw new Error("Applicant profile not found");
    }

    return {
      requestId: request.participationId,
      activityId: request.activityId,
      applicantId: request.studentAccountId,
      status: request.status,
      createdAt:
        request.createdAt instanceof Date
          ? request.createdAt.toISOString()
          : request.createdAt,
      applicant: applicantProfile
    };
  }
}

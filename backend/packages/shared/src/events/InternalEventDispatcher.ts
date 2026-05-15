import { randomUUID } from "crypto";

import type {
  ActivityCancelledEvent,
  ActivityReminderDueEvent,
  DirectJoinCompletedEvent,
  EventBus,
  InCampusEvent,
  JoinRequestApprovedEvent,
  JoinRequestDeclinedEvent,
  JoinedParticipantLeftEvent,
  JoinRequestSubmittedEvent
} from "./EventBus";

interface DispatchPayload {
  eventId?: string;
  eventType?: string;
  occurredAt?: string;
  activityId?: string;
  participationId?: string;
  triggeringAccountId?: string;
  studentAccountId?: string;
  hostAccountId?: string;
  outcome?: string;
  scheduledStartAt?: string;
  reminderThresholdMinutes?: number;
}

export class InternalEventDispatcher {
  constructor(private readonly eventBus: EventBus) {}

  public async dispatch(eventName: string, payload: DispatchPayload): Promise<void> {
    await this.eventBus.publish(this.buildEvent(eventName, payload));
  }

  private buildEvent(eventName: string, payload: DispatchPayload): InCampusEvent {
    const eventId = payload.eventId ?? randomUUID();
    const occurredAt = payload.occurredAt ?? new Date().toISOString();
    const activityId = requireString(payload.activityId, "activityId", eventName);

    switch (eventName) {
      case "DirectJoinCompleted":
        return {
          eventId,
          eventType: "DirectJoinCompleted",
          occurredAt,
          activityId,
          triggeringAccountId: resolveTriggeringAccountId(payload, eventName),
          participationId: requireString(payload.participationId, "participationId", eventName)
        } satisfies DirectJoinCompletedEvent;
      case "JoinRequestSubmitted":
        return {
          eventId,
          eventType: "JoinRequestSubmitted",
          occurredAt,
          activityId,
          triggeringAccountId: resolveTriggeringAccountId(payload, eventName),
          participationId: requireString(payload.participationId, "participationId", eventName)
        } satisfies JoinRequestSubmittedEvent;
      case "JoinRequestApproved":
        return {
          eventId,
          eventType: "JoinRequestApproved",
          occurredAt,
          activityId,
          triggeringAccountId: resolveTriggeringAccountId(payload, eventName),
          participationId: requireString(payload.participationId, "participationId", eventName),
          outcome: "approved"
        } satisfies JoinRequestApprovedEvent;
      case "JoinRequestDeclined":
        return {
          eventId,
          eventType: "JoinRequestDeclined",
          occurredAt,
          activityId,
          triggeringAccountId: resolveTriggeringAccountId(payload, eventName),
          participationId: requireString(payload.participationId, "participationId", eventName),
          outcome: "declined"
        } satisfies JoinRequestDeclinedEvent;
      case "ActivityCancelled":
        return {
          eventId,
          eventType: "ActivityCancelled",
          occurredAt,
          activityId,
          triggeringAccountId: resolveTriggeringAccountId(payload, eventName),
          outcome: "cancelled"
        } satisfies ActivityCancelledEvent;
      case "JoinedParticipantLeft":
        return {
          eventId,
          eventType: "JoinedParticipantLeft",
          occurredAt,
          activityId,
          triggeringAccountId: resolveTriggeringAccountId(payload, eventName),
          participationId: requireString(payload.participationId, "participationId", eventName)
        } satisfies JoinedParticipantLeftEvent;
      case "ActivityReminderDue":
        return {
          eventId,
          eventType: "ActivityReminderDue",
          occurredAt,
          activityId,
          scheduledStartAt: requireString(
            payload.scheduledStartAt,
            "scheduledStartAt",
            eventName
          ),
          reminderThresholdMinutes: requireNumber(
            payload.reminderThresholdMinutes,
            "reminderThresholdMinutes",
            eventName
          )
        } satisfies ActivityReminderDueEvent;
      default:
        throw new Error(`Unsupported internal event type: ${eventName}`);
    }
  }
}

function resolveTriggeringAccountId(payload: DispatchPayload, eventName: string): string {
  return requireString(
    payload.triggeringAccountId ?? payload.studentAccountId ?? payload.hostAccountId,
    "triggeringAccountId",
    eventName
  );
}

function requireString(value: string | undefined, fieldName: string, eventName: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required ${fieldName} for internal event '${eventName}'`);
  }

  return value;
}

function requireNumber(value: number | undefined, fieldName: string, eventName: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Missing required ${fieldName} for internal event '${eventName}'`);
  }

  return value;
}

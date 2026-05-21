import { ActivityId, ParticipationId, StudentAccountId } from "../domain/dtos";

interface BaseEvent<EventType extends string> {
  eventId: string;
  eventType: EventType;
  occurredAt: string;
  activityId: ActivityId;
}

export interface DirectJoinCompletedEvent extends BaseEvent<"DirectJoinCompleted"> {
  triggeringAccountId: StudentAccountId;
  participationId: ParticipationId;
}

export interface JoinRequestSubmittedEvent extends BaseEvent<"JoinRequestSubmitted"> {
  triggeringAccountId: StudentAccountId;
  participationId: ParticipationId;
}

export interface JoinRequestApprovedEvent extends BaseEvent<"JoinRequestApproved"> {
  triggeringAccountId: StudentAccountId;
  participationId: ParticipationId;
  outcome: "approved";
}

export interface JoinRequestDeclinedEvent extends BaseEvent<"JoinRequestDeclined"> {
  triggeringAccountId: StudentAccountId;
  participationId: ParticipationId;
  outcome: "declined";
}

export interface ActivityCancelledEvent extends BaseEvent<"ActivityCancelled"> {
  triggeringAccountId: StudentAccountId;
  outcome: "cancelled";
}

export interface JoinedParticipantLeftEvent extends BaseEvent<"JoinedParticipantLeft"> {
  triggeringAccountId: StudentAccountId;
  participationId: ParticipationId;
}

export interface ActivityReminderDueEvent extends BaseEvent<"ActivityReminderDue"> {
  scheduledStartAt: string;
  reminderThresholdMinutes: number;
}

export type InCampusEvent =
  | DirectJoinCompletedEvent
  | JoinRequestSubmittedEvent
  | JoinRequestApprovedEvent
  | JoinRequestDeclinedEvent
  | ActivityCancelledEvent
  | JoinedParticipantLeftEvent
  | ActivityReminderDueEvent;

export type InCampusEventType = InCampusEvent["eventType"];
export type EventHandler<TEvent extends InCampusEvent> = (event: TEvent) => void | Promise<void>;

export interface EventBus {
  publish<TEvent extends InCampusEvent>(event: TEvent): Promise<void>;
  subscribe<TType extends InCampusEventType>(
    eventType: TType,
    handler: EventHandler<Extract<InCampusEvent, { eventType: TType }>>
  ): () => void;
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<InCampusEventType, Set<EventHandler<any>>>();

  public subscribe<TType extends InCampusEventType>(
    eventType: TType,
    handler: EventHandler<Extract<InCampusEvent, { eventType: TType }>>
  ): () => void {
    const handlersForType = this.handlers.get(eventType) ?? new Set<EventHandler<any>>();
    handlersForType.add(handler as EventHandler<any>);
    this.handlers.set(eventType, handlersForType);

    return () => {
      handlersForType.delete(handler as EventHandler<any>);
    };
  }

  public async publish<TEvent extends InCampusEvent>(event: TEvent): Promise<void> {
    const handlersForType = this.handlers.get(event.eventType);

    if (!handlersForType) {
      return;
    }

    const results = await Promise.allSettled(
      [...handlersForType].map((handler) => Promise.resolve().then(() => handler(event)))
    );

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(`[EventBus] Handler failed for ${event.eventType}`, result.reason);
      }
    });
  }
}

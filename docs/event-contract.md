# Event Contract

Internal events are in-process contracts inside the modular monolith. They are not public API payloads.

## Common Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `eventId` | string | yes | Unique event identifier. |
| `eventType` | string literal | yes | Must match one of the event names below. |
| `occurredAt` | ISO datetime string | yes | Time the business event completed. |
| `activityId` | string | yes | Referenced activity. |

## Events

```ts
interface DirectJoinCompleted {
  eventId: string;
  eventType: "DirectJoinCompleted";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  participationId: string;
}

interface JoinRequestSubmitted {
  eventId: string;
  eventType: "JoinRequestSubmitted";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  participationId: string;
}

interface JoinRequestApproved {
  eventId: string;
  eventType: "JoinRequestApproved";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  participationId: string;
  outcome: "approved";
}

interface JoinRequestDeclined {
  eventId: string;
  eventType: "JoinRequestDeclined";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  participationId: string;
  outcome: "declined";
}

interface ActivityCancelled {
  eventId: string;
  eventType: "ActivityCancelled";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  outcome: "cancelled";
}

interface JoinedParticipantLeft {
  eventId: string;
  eventType: "JoinedParticipantLeft";
  occurredAt: string;
  activityId: string;
  triggeringAccountId: string;
  participationId: string;
}

interface ActivityReminderDue {
  eventId: string;
  eventType: "ActivityReminderDue";
  occurredAt: string;
  activityId: string;
  scheduledStartAt: string;
  reminderThresholdMinutes: number;
}
```

## Producer and Consumer Map

| Event | Producer | Consumer | Notification record? |
| --- | --- | --- | --- |
| `DirectJoinCompleted` | D&P | NSF | yes, host join event |
| `JoinRequestSubmitted` | D&P | NSF | yes, host join request event |
| `JoinRequestApproved` | H&L | NSF | yes, application outcome |
| `JoinRequestDeclined` | H&L | NSF | yes, application outcome |
| `ActivityCancelled` | H&L | NSF | yes, participant fan-out |
| `JoinedParticipantLeft` | D&P | NSF | yes, host leave event |
| `ActivityReminderDue` | system time trigger | NSF | yes, participant reminder fan-out |

`PendingRequestWithdrawn` is intentionally absent. Pending request withdrawal creates no NSF handler and no notification record.

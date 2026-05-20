# Internal Command Contract

Internal commands are synchronous or in-process module integration contracts. They are not public API routes and must preserve module ownership.

## RequestAccountModerationAction

Sent from SM to AP after report review records an account consequence.

```ts
interface RequestAccountModerationAction {
  commandId: string;
  reportId: string;
  targetAccountId: string;
  actionType: "suspend_user" | "ban_user";
  campusId: string;
  reviewOutcomeId: string;
  requestedByAdminId: string;
  requestedAt: string;
}
```

AP is the only module allowed to update `DS-AP-001.PlatformAccessStatus`.

## RequestActivityModerationAction

Sent from SM to H&L after report review records an activity removal consequence.

```ts
interface RequestActivityModerationAction {
  commandId: string;
  reportId: string;
  activityId: string;
  actionType: "remove_activity";
  campusId: string;
  reviewOutcomeId: string;
  requestedByAdminId: string;
  requestedAt: string;
}
```

H&L performs the native hard-delete or removal workflow under H&L ownership.

## RequestPendingParticipationBlockConsequence

Sent from SM to H&L only if current block rules require pending request consequences.

```ts
interface RequestPendingParticipationBlockConsequence {
  commandId: string;
  initiatorAccountId: string;
  targetAccountId: string;
  blockId: string;
  campusId: string;
  affectedPendingRequestContext?: {
    activityId?: string;
    participationId?: string;
  };
  requestedAt: string;
}
```

This command is provisional. SM must not mutate `DS-HL-002` directly.

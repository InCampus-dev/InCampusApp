# ActivityParticipation SCD v1.1

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| v1.1 | 2026-05-08 | ActivityParticipation State Chart | Renamed corrected package from Activity SCD to ActivityParticipation SCD, aligned Participation with `RecordType + Status`, removed persisted `cancelled`/`deleted` participation states, and marked withdraw/leave/deletion outcomes as non-persisted terminals. | Required before using the state chart package as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

![ActivityParticipation SCD v1.1](assets/activityparticipation-scd-v1.1.svg)

## Purpose

This state chart diagram models the lifecycle of a student's `ActivityParticipation` record relative to a specific activity. It covers join-request creation, direct participation, host decisions, and workflow endpoints caused by withdrawal, leave, parent activity cancellation, or parent activity hard deletion.

The original package was named `Activity SCD.zip`, but its source title and content model `ActivityParticipation`, not the `Activity` lifecycle. The corrected output is therefore named `ActivityParticipation SCD v1.1`.

## State Owner

* Hosting and Lifecycle (H&L)

## Related Use Cases

* Join Activity
* Manage Join Requests
* Withdraw Join Request
* Leave Joined Activity
* Update Activity Status (Cancellation branch)
* Delete Activity (Cascade deletion branch)

## Related Requirements

FR: FR-0501, FR-0502, FR-2001, FR-2002, FR-2701, FR-2702, FR-2703, FR-2704, FR-2802

NFR: NFR-13, NFR-34, NFR-43

## Source Documents Used

* State Chart Diagram WorkDoc v1.1.
* Entities & Attributes catalog plus final team decisions for canonical Participation vocabulary.
* CRUD Matrix v1.5 and final transaction/concurrency decision.
* H&L DFD WorkDoc.
* D&P DFD WorkDoc.
* NSF decisions for pending withdrawal and leave/cancellation notification boundaries.

## Object Being Modeled

| Object | Store / Entity | Owner | Reason for State Chart |
|---|---|---|---|
| ActivityParticipation | DS-HL-002 Activity Participations | Hosting and Lifecycle (H&L) | The record has a meaningful lifecycle across pending join requests, confirmed participations, host decisions, and removal/endpoints. |

## Persisted Model

Canonical persisted values:

```text
Participation.RecordType = request | participation
Participation.Status = pending | confirmed | declined
```

`joined`, `left`, `withdrawn`, `cancelled`, and `deleted` are not canonical persisted Participation statuses.

## States and Diagram Endpoints

| State / Endpoint | Persisted? | Meaning | Source / Justification |
|---|---:|---|---|
| RequestPending | Yes | `RecordType = request`, `Status = pending`; request submitted for an approval-based activity and awaiting host decision. | Final Participation model; Join Activity; Manage Join Requests. |
| ParticipationConfirmed | Yes | `RecordType = participation`, `Status = confirmed`; participation slot created by direct join or host approval. | Final Participation model; Join Activity; Manage Join Requests. |
| RequestDeclined | Yes | `RecordType = request`, `Status = declined`; host declined the pending request. It is not active for capacity. | Final Participation model; Manage Join Requests. |
| RequestWithdrawnTerminal | No | Pending request was withdrawn and removed or made no longer active. No host notification and no `DS-NS-001` record are created. | Final withdrawal decision. |
| ParticipantLeftTerminal | No | Confirmed participant left; leave is a workflow outcome, not a stored Participation status. | Final Participation model; Leave Joined Activity. |
| ActivityCancelledTerminal | No | Parent `Activity.Status = cancelled`; this diagram endpoint does not create `Participation.Status = cancelled`. | Final Activity/Participation model. |
| RecordDeletedTerminal | No | Related participation/request record is removed because the parent activity was hard-deleted or the workflow removes the record. | Final deletion decision; deletion is a hard-delete outcome. |

## Transition Table

| From State | To State / Endpoint | Trigger / Event | Guard / Condition | Effect |
|---|---|---|---|---|
| [Initial] | RequestPending | JoinRequestSubmitted | Activity requires host approval; request/capacity constraints pass. | Create `DS-HL-002` record with `RecordType=request`, `Status=pending`. |
| [Initial] | ParticipationConfirmed | DirectJoinCompleted | Activity allows direct join; capacity is available. | Create `DS-HL-002` record with `RecordType=participation`, `Status=confirmed`. |
| RequestPending | ParticipationConfirmed | HostApprovesRequest | Host owns ordinary decision; capacity and duplicate active records are re-checked inside the write transaction. | Convert/represent the request as `RecordType=participation`, `Status=confirmed`. |
| RequestPending | RequestDeclined | HostDeclinesRequest | Host owns ordinary decision. | Store declined request as `RecordType=request`, `Status=declined`. |
| RequestPending | RequestWithdrawnTerminal | StudentWithdrawsRequest | Student withdraws before host decision. | Remove or deactivate the pending request; no NSF handler, no host notification, no `DS-NS-001` record. |
| ParticipationConfirmed | ParticipantLeftTerminal | StudentLeavesActivity | Student leaves confirmed participation before the activity is no longer leaveable. | Remove/deactivate participation according to CRUD interpretation; confirmed-participation leave notification may remain where documented. |
| RequestPending | ActivityCancelledTerminal | ParentActivityCancelled | Parent activity is cancelled. | Pending request becomes moot; no Participation `cancelled` status is stored. |
| ParticipationConfirmed | ActivityCancelledTerminal | ParentActivityCancelled | Parent activity is cancelled. | Activity-level cancellation notification behavior may remain; no Participation `cancelled` status is stored. |
| RequestPending | RecordDeletedTerminal | ParentActivityDeleted | Parent activity is hard-deleted through native H&L workflow. | Related request record is removed; endpoint is not persisted. |
| ParticipationConfirmed | RecordDeletedTerminal | ParentActivityDeleted | Parent activity is hard-deleted through native H&L workflow. | Related participation record is removed; endpoint is not persisted. |
| RequestDeclined | RecordDeletedTerminal | ParentActivityDeleted | Parent activity is hard-deleted through native H&L workflow. | Related declined request record is removed if retained. |

## Concurrency Note

Join, request, approve, withdraw, leave, cancellation, and deletion operations that affect capacity, participation records, or counters must be atomic. Capacity and existing participation/request state must be re-checked inside the write transaction. A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`. If concurrent operations conflict, only one succeeds and the other receives a safe rejection. Counters must be derived or updated transactionally and must not rely on stale client-side values.

## PlantUML Code

```
@startuml
title ActivityParticipation - State Chart Diagram v1.1

skinparam shadowing false
skinparam dpi 180
skinparam defaultFontName Helvetica
skinparam backgroundColor #FFFFFF
skinparam state {
  BackgroundColor #F8FAFC
  BorderColor #334155
  FontColor #0F172A
  ArrowColor #334155
}

hide empty description

state "RequestPending\nRecordType=request\nStatus=pending" as RequestPending
state "ParticipationConfirmed\nRecordType=participation\nStatus=confirmed" as ParticipationConfirmed
state "RequestDeclined\nRecordType=request\nStatus=declined" as RequestDeclined
state "RequestWithdrawnTerminal\nnon-persisted endpoint\nno NSF handler\nno DS-NS-001 record" as RequestWithdrawnTerminal
state "ParticipantLeftTerminal\nnon-persisted endpoint\nleave workflow outcome" as ParticipantLeftTerminal
state "ActivityCancelledTerminal\nnon-persisted endpoint\nparent Activity.Status=cancelled" as ActivityCancelledTerminal
state "RecordDeletedTerminal\nnon-persisted endpoint\nhard-delete outcome" as RecordDeletedTerminal

[*] --> RequestPending : JoinRequestSubmitted\n[approval-based,\nconstraints pass]
[*] --> ParticipationConfirmed : DirectJoinCompleted\n[direct join,\ncapacity available]

RequestPending --> ParticipationConfirmed : HostApprovesRequest\n[capacity rechecked\ninside transaction]
RequestPending --> RequestDeclined : HostDeclinesRequest

RequestPending --> RequestWithdrawnTerminal : StudentWithdrawsRequest\n[remove request,\nno notification]
ParticipationConfirmed --> ParticipantLeftTerminal : StudentLeavesActivity\n[confirmed participation]

RequestPending --> ActivityCancelledTerminal : ParentActivityCancelled
ParticipationConfirmed --> ActivityCancelledTerminal : ParentActivityCancelled

RequestPending --> RecordDeletedTerminal : ParentActivityDeleted
ParticipationConfirmed --> RecordDeletedTerminal : ParentActivityDeleted
RequestDeclined --> RecordDeletedTerminal : ParentActivityDeleted

RequestDeclined --> [*]
RequestWithdrawnTerminal --> [*]
ParticipantLeftTerminal --> [*]
ActivityCancelledTerminal --> [*]
RecordDeletedTerminal --> [*]

note right of RequestWithdrawnTerminal
  Pending request withdrawal is non-notifying.
  NSF has no handler and creates no
  DS-NS-001 NotificationRecord.
end note

note bottom of ParticipationConfirmed
  This is the only confirmed participation
  persisted state for a joined/approved student.
  "joined" is not a stored Status value.
end note

@enduml
```

## Notes for Review

* **Corrected package identity:** The original `Activity SCD.zip` source actually modeled `ActivityParticipation`; this output intentionally corrects the package/title to `ActivityParticipation SCD v1.1`.
* **Persisted vocabulary:** The only canonical persisted Participation model is `RecordType=request|participation` plus `Status=pending|confirmed|declined`.
* **Withdrawal boundary:** Pending request withdrawal creates no host notification, no NSF handler, and no `DS-NS-001 NotificationRecord`.
* **Terminal endpoints:** Withdrawal, leave, cancellation, and deletion endpoints are diagram-only or hard-delete outcomes, not persisted Participation statuses.
* **Ownership:** H&L owns `DS-HL-002`; D&P may initiate allowed join/withdraw/leave workflows, and NSF only handles documented notification consequences.

## Open Points

* A true `Activity` lifecycle SCD source was not found in `/Users/francesconativitati/Downloads/state chart diagrams`; the file named `Activity SCD.zip` contained this ActivityParticipation chart instead. No duplicate Activity SCD was created in this pass.

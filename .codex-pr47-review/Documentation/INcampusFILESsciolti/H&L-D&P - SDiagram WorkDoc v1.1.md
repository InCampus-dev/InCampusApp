# H\&L-D\&P - SDiagram WorkDoc v1.1

# Version Log

| Version | Date       | Diagram                               | Change                          | Reason                                              | Source                                    |
| ------- | ---------- | ------------------------------------- | ------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| 1.0     | 2026-05-05 | Join Activity Sequence Diagram        | Initial sequence diagram draft. | First design translation from use case realization. | UCR - D\&P v1.1 (DUC-DP-03) + CRUD Matrix |
| 1.0     | 2026-05-05 | Manage Join Requests Sequence Diagram | Initial sequence diagram draft. | First design translation from use case realization. | UCR - H\&L v1.3 (DUC-HL-02) + CRUD Matrix |
| 1.1   | 2026-05-08 | Join Activity Sequence Diagram        | Aligned Activity/Participation state vocabulary, event payloads, and atomic join/request handling. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |
| 1.1   | 2026-05-08 | Manage Join Requests Sequence Diagram | Aligned host-owned request decisions, `RecordType + Status`, event payloads, and transaction checks. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Assigned Subsystems

* Hosting and Lifecycle (H\&L)
* Discovery and Participation (D\&P)

## Diagrams Produced

| Diagram                               | Related Use Case                 | Status | Notes                                                                    |
| ------------------------------------- | -------------------------------- | ------ | ------------------------------------------------------------------------ |
| Join Activity Sequence Diagram        | Join Activity (DUC-DP-03)        | v1.1  | Covers direct joins as `RecordType=participation, Status=confirmed` and approval requests as `RecordType=request, Status=pending`. |
| Manage Join Requests Sequence Diagram | Manage Join Requests (DUC-HL-02) | v1.1  | Covers host-owned pending-request review; approval yields `RecordType=participation, Status=confirmed`, decline keeps request with `Status=declined`. |

## Cross-Subsystem Notes

* Join Activity emits `DirectJoinCompleted` or `JoinRequestSubmitted` which are consumed downstream by Notifications and System Flow (NSF).
* Manage Join Requests emits `JoinRequestApproved` or `JoinRequestDeclined` which are also consumed downstream by NSF.
* D\&P strictly reads from H\&L (activities, participations) and SM (blocks) stores and only mutates `DS-HL-001` and `DS-HL-002` for allowed join/leave/withdraw actions.
* Activity lifecycle status is `open | full | completed | cancelled`; `deleted` is not a persisted activity state.
* Pending request withdrawal is a non-notifying outcome for the first skeleton: no NSF handler and no `DS-NS-001` record.

## Open Points

* Transaction rule for the first skeleton: join, request, approve, withdraw, leave, cancellation, and deletion operations that affect capacity, participation records, or counters must be atomic; capacity and existing participation/request state are re-checked inside the write transaction; a uniqueness constraint prevents duplicate active records for the same `ActivityID` and `StudentAccountID`; conflicting concurrent operations receive safe rejection; counters are derived or updated transactionally.
* Assumption for modeling only: Batch approval behavior in `Manage Join Requests` is not explicitly specified; the model assumes atomic, individual request updates for simplicity.

# H\&L-D\&P - Collaboration Diagram WordDoc v1.1

# Version Log

| Version | Date       | Diagram                                    | Change                               | Reason                                  | Source                                                              |
| ------- | ---------- | ------------------------------------------ | ------------------------------------ | --------------------------------------- | ------------------------------------------------------------------- |
| 1.0     | 2026-05-05 | Join Activity Collaboration Diagram        | Initial collaboration diagram draft. | Derived from existing sequence diagram. | Join Activity Sequence Diagram + UCR - D\&P v1.1 (DUC-DP-03)        |
| 1.0     | 2026-05-05 | Manage Join Requests Collaboration Diagram | Initial collaboration diagram draft. | Derived from existing sequence diagram. | Manage Join Requests Sequence Diagram + UCR - H\&L v1.3 (DUC-HL-02) |
| 1.1   | 2026-05-08 | Join Activity Collaboration Diagram        | Aligned participation record creation, event payloads, and atomic capacity/counter handling with final pre-skeleton decisions. | Required before using D\&P/H\&L collaboration diagrams as first code skeleton input. | Final documentation review + team decisions 2026-05-08 |
| 1.1   | 2026-05-08 | Manage Join Requests Collaboration Diagram | Aligned host-owned approval/decline flow with `RecordType + Status`, event payloads, and transaction-based concurrency notes. | Required before using D\&P/H\&L collaboration diagrams as first code skeleton input. | Final documentation review + team decisions 2026-05-08 |

## Assigned Subsystems

* Hosting and Lifecycle (H\&L)
* Discovery and Participation (D\&P)

## Source Sequence Diagrams

| Sequence Diagram                      | Related Collaboration Diagram              | Status | Notes                                                                            |
| ------------------------------------- | ------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| Join Activity Sequence Diagram        | Join Activity Collaboration Diagram v1.1        | Corrected  | Maps the logic for direct join vs. approval request into numbered messages using canonical participation records.    |
| Manage Join Requests Sequence Diagram | Manage Join Requests Collaboration Diagram v1.1 | Corrected  | Maps the host-owned retrieval flow and decision flow into a single collaboration graph. |

## Cross-Subsystem Notes

* **Events**: Both *Join Activity* and *Manage Join Requests* emit accepted first-skeleton internal events (`DirectJoinCompleted`, `JoinRequestSubmitted`, `JoinRequestApproved`, `JoinRequestDeclined`) consumed by the Notifications and System Flow (NSF) module.
* **Event payloads**: ordinary activity/participation events carry `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, and `participationId` / `outcome` when applicable.
* **Participation model**: H\&L-owned participation records use `RecordType = request | participation` and `Status = pending | confirmed | declined`.
* **Store access constraints**:
  * D\&P reads `DS-SM-001` (Block Relationships) but does not modify it.
  * D\&P reads and updates `DS-HL-001` and `DS-HL-002` strictly for participation operations.
  * H\&L reads `DS-AP-002 Student Profile` to render minimal public profile data during request evaluation but does not modify profiles.
* **Notification boundary**: pending request withdrawal is not part of these collaboration diagrams. If modeled elsewhere, it creates no user-facing notification, no NSF handler, and no `DS-NS-001` record.

## Open Points

* **Resolved for first skeleton**: Join, request, approve, withdraw, leave, cancellation, and deletion operations that affect capacity, participation records, or counters must be atomic. Capacity and existing participation/request state are re-checked inside the write transaction, duplicate active records for the same `ActivityID + StudentAccountID` are prevented, and conflicts receive safe rejection.
* **Assumption for modeling only**: Batch approval behavior in `Manage Join Requests` is not explicitly specified; the model assumes atomic, individual request updates for simplicity.

***

*Note: These collaboration diagrams preserve exactly the same participants and logic flows documented in the related sequence diagrams.*

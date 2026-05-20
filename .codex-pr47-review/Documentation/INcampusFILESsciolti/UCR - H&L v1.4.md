# UCR - H\&L v1.4

## Version Log

| **Version** | **Date**   | **Section modified**                                     | **Description of change**                                                                                                                                                    | **Reason for change**                                                                                                                             | **Source document used as reference**                                                                |
| ----------- | ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1.1         | 2026-05-04 | DUC-HL-01 API and main flow                              | Added required activity creation fields and clarified persistence of title, gender preference, optional request/end-time fields, and category/meeting-point snapshot labels. | The UCR API input must match the current Activity entity attributes and discovery/filter requirements before API catalogue generation.            | UCR Critical Integration Review; Entity Attributes Catalog; Project Summary; Functional Requirements |
| 1.2         | 2026-05-04 | DUC-HL-02; DUC-HL-03; DUC-HL-04                          | Restricted routine H\&L client flows to the activity host and moved campus-admin consequences to SM-triggered native H\&L commands.                                          | Campus Admin is not a routine host-equivalent actor for join-request decisions or ordinary lifecycle actions in the current H\&L source priority. | H\&L DFD workdoc v2.1; SM DFD workdoc v2.1; CRUD Matrix v1.5                                         |
| 1.2         | 2026-05-04 | DUC-HL-03; DUC-HL-04; events/internal interfaces         | Replaced generic moderation consumption with the activity-specific RequestActivityModerationAction internal command.                                                         | The internal interface catalogue needs an explicit H\&L activity-action receiver and payload.                                                     | UCR Critical Integration Review; SM DFD workdoc; H\&L DFD workdoc; CRUD Matrix v1.5                  |
| 1.3         | 2026-05-04 | Internal interfaces / block-related pending request note | Added a conditional receiver note for RequestPendingParticipationBlockConsequence from SM.                                                                                   | Block-related pending-request consequences must be routed through H\&L ownership instead of SM mutating DS-HL-002 directly.                       | UCR Critical Integration Review; SM DFD workdoc; H\&L DFD workdoc; CRUD Matrix v1.5                  |
| 1.4       | 2026-05-08 | Host authority; activity/participation states; moderation routing; concurrency | Removed routine Campus Admin ownership from H&L client flows, aligned `Activity.Status` and participation `RecordType + Status`, clarified cancellation versus deletion, added first-skeleton event payload guidance and transaction notes, and kept moderation/report-review consequences routed through H&L-native workflows. | Required before using the UCR as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

Candidate API paths, controller names, service names, internal command names, sequence filenames, and event names in this UCR are first-skeleton scaffolding unless explicitly accepted elsewhere as final contracts.

# 1. Subsystem Responsibility

The Hosting and Lifecycle subsystem is the operational core of the platform. It manages the creation, maintenance, lifecycle status evolution, and deletion of campus activities. It also manages host-controlled participation decisions (approving or declining pending requests). Student Host owns ordinary H&L activity and participation management. Campus Admin may trigger H&L-native consequences only through moderation/report-review workflows recorded by Safety and Moderation. H&L acts as the single source of truth for activity and participation records. It does not handle discovering/browsing activities, nor does it create notification records directly; instead, it exposes state changes and emits internal events that the Notifications and System Flow (NSF) subsystem consumes.

## 2. Owned Data Stores

Owned stores:

* DS-HL-001 — Activities
* DS-HL-002 — Activity Participations

## 3. External Data Dependencies

External dependencies:

* DS-CA-002 — Campus Structured Options (Read-only, to validate allowed categories and locations during activity creation).
* DS-AP-001 — Student Account (Read-only, to validate host eligibility).
* DS-AP-002 — Student Profile (Read-only, to display applicant minimal public profile data to the host during request review).

***

# DUC-HL-01 — Create Activity

## Source Use Case

Create Activity (includes Set Activity Date and Time)

## Related Requirements

* **FR:** FR-0301, FR-0302, FR-0303, FR-0304, FR-0305, FR-2501, FR-2502
* **NFR:** NFR-10, NFR-11, NFR-13, NFR-41

## Implementation Goal

Allow a student to create a new activity by providing its details, schedule, location, capacity, and participation mode, validating all inputs against campus-specific structural options and storing the final activity record.

## Boundary Objects

* CreateActivityScreen

## Control Objects / Services

* ActivityLifecycleController
* CampusValidationService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* CampusOptions / DS-CA-002
* StudentAccount / DS-AP-001

## Candidate Client-Facing API

| **Method + Path**  | **Purpose**                           | **Input**                                                                                                                                                                                                                                                       | **Output**                       | **Reads**            | **Writes** | **Events / Notes**                                                                                                                                 |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /activities` | Creates a new campus-scoped activity. | Authenticated host context, `title`, `categoryId`, `meetingPointId`, `scheduledDateTime`, optional `scheduledEndDateTime`, `maxParticipants`, optional `maxRequests`, `participationMode`, `genderPreference` defaulting to `all`, optional description/details | `activityId` or validation error | DS-CA-002, DS-AP-001 | DS-HL-001  | No events emitted. Validates host eligibility, campus scope, category, meeting point, schedule, limits, participation mode, and gender preference. |

## Main Design Flow

1. The student submits the activity details via the CreateActivityScreen.
2. ActivityLifecycleController handles the request and delegates input validation to CampusValidationService.
3. The module reads DS-AP-001 to verify the host's account validity and campus context.
4. The module reads DS-CA-002 to validate that the selected category and meeting point belong to the approved structured options for the student's campus.
5. The module creates a new activity record in DS-HL-001, persisting activity title, optional description/details, host reference, campus reference, selected category reference and snapshot label, selected meeting-point reference and snapshot label, scheduled start time, optional scheduled end time, participant/request limits, participation mode, gender preference, initial status, and initial participant/request counters.
6. The system returns the generated `activityId` to the client.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Selected category and location must exist in DS-CA-002 for the host's campus.
* Scheduled start date and time must be in the future.
* Participant limits must be within allowed platform boundaries.
* title is required and must be persisted because it is displayed in feed cards, activity details, and notification contexts.
* genderPreference must be collected or defaulted to `all` because Discovery and Participation supports gender-based filtering.
* Category and meeting-point snapshot labels should be stored at creation time so existing activities remain understandable if CA later renames, disables, or removes structured options.

## Postconditions in Design Terms

* DS-HL-001 contains a new campus-scoped activity record with `Activity.Status = open`, with host, campus, category, meeting point, schedule, limits, participation mode, gender preference, and display fields persisted.
* The activity is immediately discoverable to users in the same campus context via the D\&P subsystem.

## Related Diagrams Suggested

* Sequence diagram: `create_activity_sequence.puml`

## Open Points / Assumptions

* None.

***

# DUC-HL-02 — Manage Join Requests

## Source Use Case

Manage Join Requests

## Related Requirements

* **FR:** FR-0501, FR-0502, FR-2002, FR-1403
* **NFR:** NFR-12, NFR-13

## Implementation Goal

Allow the host of an approval-based activity to review pending join requests alongside applicant profile snapshots, and record approval or decline decisions while maintaining correct activity headcount limits.

## Boundary Objects

* JoinRequestManagementScreen
* ApplicantProfileSnippet

## Control Objects / Services

* HostParticipationController
* ActivityCapacityService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002
* StudentProfile / DS-AP-002

## Candidate Client-Facing API

| **Method + Path**                                     | **Purpose**                                      | **Input**                                               | **Output**                                         | **Reads**                       | **Writes**           | **Events / Notes**                                    |
| ----------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------- | ------------------------------- | -------------------- | ----------------------------------------------------- |
| `GET /activities/{activityId}/requests`               | Fetches pending requests and applicant profiles. | `authenticatedHostId`, `activityId`                     | List of pending requests with minimal public profile data | DS-HL-001, DS-HL-002, DS-AP-002 | None                 | Renders the review view.                              |
| `PATCH /activities/{activityId}/requests/{requestId}` | Approves or declines a pending request.          | `authenticatedHostId`, `decision` (`approve`/`decline`) | `status_updated`                                   | DS-HL-001, DS-HL-002            | DS-HL-001, DS-HL-002 | Emits `JoinRequestApproved` or `JoinRequestDeclined`. |

## Main Design Flow

1. The host retrieves pending requests; HostParticipationController reads DS-HL-002 records where `RecordType = request`, `Status = pending`, DS-HL-001 (activity context), and DS-AP-002 (applicant profiles).
2. The host submits an approve or decline decision via JoinRequestManagementScreen.
3. HostParticipationController reads DS-HL-001 to verify the host identity and confirm that participant capacity has not been exceeded.
4. If approved, the module represents the accepted request as `RecordType = participation`, `Status = confirmed` in DS-HL-002.
5. If declined, the module keeps the request as `RecordType = request`, `Status = declined` in DS-HL-002.
6. If approved, the module updates the current participant headcount and availability constraints in DS-HL-001.
7. The module emits either `JoinRequestApproved` or `JoinRequestDeclined`.
8. NSF consumes the event and generates a notification for the applicant, if rules allow.

## Events Emitted

* `JoinRequestApproved` — emitted after a host accepts a pending request.
* `JoinRequestDeclined` — emitted after a host rejects a pending request.

## Events Consumed

* None as catalogue-level domain events.
* `RequestPendingParticipationBlockConsequence` — conditional internal command from SM when a new block may affect existing pending join requests. H\&L owns any resulting mutation to DS-HL-002, but the exact handling remains unresolved unless later rules define it.

## Constraints and Exceptions

* Host cannot approve a request if it exceeds the activity's max participant limit.
* Only the Student Host owns ordinary join request approval/decline decisions.
* Campus Admin does not routinely approve or decline H&L join requests. Any admin-triggered participation consequence must come through a moderation/report-review workflow and be executed by H&L under H&L ownership.
* Approve/decline operations that affect capacity, participation records, or counters must be atomic.
* Capacity and existing request state must be re-checked inside the write transaction.
* A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`.

## Postconditions in Design Terms

* DS-HL-002 is updated according to the canonical participation model.
* DS-HL-001 headcount is updated.
* An application outcome event is emitted for NSF.

## Related Diagrams Suggested

* Sequence diagram: `manage_join_requests_sequence.puml`

## Open Points / Assumptions

* Unresolved: Batch approval behavior is not specified, so the design assumes atomic single-request updates.

***

# DUC-HL-03 — Update Activity Status

## Source Use Case

Update Activity Status

## Related Requirements

* **FR:** FR-0503, FR-2801, FR-2802, FR-2803, FR-2804
* **NFR:** NFR-12, NFR-44

## Implementation Goal

Allow the host to change the lifecycle state of an activity to `completed` or `cancelled`. In the case of cancellation, emit an event so NSF can notify currently confirmed participants. Campus Admin does not use this as a routine host-equivalent flow; admin-triggered H&L consequences are routed through moderation/report-review workflows.

## Boundary Objects

* ActivityManagementScreen

## Control Objects / Services

* ActivityLifecycleController

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002

## Candidate Client-Facing API

| **Method + Path**                       | **Purpose**                                 | **Input**                                                    | **Output**       | **Reads**            | **Writes** | **Events / Notes**                                |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ | ---------------- | -------------------- | ---------- | ------------------------------------------------- |
| `PATCH /activities/{activityId}/status` | Updates the status of an existing activity. | `authenticatedHostId`, `newStatus` (`completed`/`cancelled`) | `status_updated` | DS-HL-001, DS-HL-002 | DS-HL-001  | Emits `ActivityCancelled` if status is cancelled. |

## Main Design Flow

1. The host submits a status change to completed or cancelled.
2. ActivityLifecycleController reads DS-HL-001 to verify authorization and ensure the transition is valid.
3. The module updates the activity status in DS-HL-001.
4. If the new status is `cancelled`, the module emits an `ActivityCancelled` event containing the first-skeleton event payload and activity reference.
5. NSF consumes the event, reads DS-HL-002 as needed, and performs participant fan-out for notification creation in DS-NS-001.

## Events Emitted

* `ActivityCancelled` — emitted when an activity's status is changed to cancelled while participants are joined.

## Events Consumed

* None as catalogue-level domain events.
* `RequestActivityModerationAction` — internal command/interface received from Safety and Moderation after a reviewed report outcome requires activity removal. H\&L performs the native activity removal/status workflow under H\&L ownership; this is not a client-facing admin route and not a notification event.

## Constraints and Exceptions

* Persisted `Activity.Status` values are `open`, `full`, `completed`, and `cancelled`.
* `deleted` is not a persisted `Activity.Status`; deletion is a hard-delete behavior.
* Status cannot be changed if the transition is invalid (e.g., marking a cancelled activity as completed).
* Only the Student Host executes ordinary activity status updates.
* Campus Admin may trigger H&L-native status/removal consequences only through moderation/report-review workflows recorded by SM.
* Cancellation operations that affect activity status, participation context, or counters must be atomic.

## Postconditions in Design Terms

* DS-HL-001 is updated with the new lifecycle state.
* `ActivityCancelled` event is emitted (if applicable) for NSF to process.
* Cancelled activities preserve the activity record and may remain visible in relevant history contexts according to documented history rules.

## Related Diagrams Suggested

* Sequence diagram: `update_activity_status_sequence.puml`

## Open Points / Assumptions

* Assumption for modeling only: If pending requests exist during a cancellation, they become moot and do not trigger separate notifications.

***

# DUC-HL-04 — Delete Activity

## Source Use Case

Delete Activity

## Related Requirements

* **FR:** FR-2601, FR-2602, FR-2603
* **NFR:** NFR-12, NFR-42

## Implementation Goal

Allow a host to hard-delete an activity they created from history or an allowed host/management context, completely removing it from discovery feeds, history contexts, and safely cascade-deleting all related participation data. Deletion is separate from cancellation and does not create a notification branch in the first skeleton.

## Boundary Objects

* ActivityManagementScreen

## Control Objects / Services

* ActivityLifecycleController
* ActivityCleanupService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002

## Candidate Client-Facing API

| **Method + Path**                 | **Purpose**                                                        | **Input**                           | **Output**             | **Reads**            | **Writes**           | **Events / Notes**                              |
| --------------------------------- | ------------------------------------------------------------------ | ----------------------------------- | ---------------------- | -------------------- | -------------------- | ----------------------------------------------- |
| `DELETE /activities/{activityId}` | Hard-deletes an activity and all its linked participation records. | `authenticatedHostId`, `activityId` | `deleted_successfully` | DS-HL-001, DS-HL-002 | DS-HL-001, DS-HL-002 | No notifications emitted per CRUD Matrix rules. |

## Main Design Flow

1. The host confirms the intent to delete an activity.
2. ActivityLifecycleController reads DS-HL-001 to verify that the requester is the Student Host and that deletion is allowed from the current host/management context.
3. The module permanently deletes the activity record from DS-HL-001.
4. ActivityCleanupService identifies and hard-deletes all linked participation and request records from DS-HL-002 (System Invariant Rule 1).

## Events Emitted

* None. (The CRUD matrix explicitly excludes a deletion notification branch).

## Events Consumed

* None as catalogue-level domain events.
* `RequestActivityModerationAction` — internal command/interface received from Safety and Moderation after a reviewed report outcome requires activity removal. H\&L performs the native activity removal/status workflow under H\&L ownership; this is not a client-facing admin route and not a notification event.

## Constraints and Exceptions

* Cannot delete an activity after its scheduled start time has passed.
* Deletion is a hard-delete for both DS-HL-001 and DS-HL-002.
* `deleted` is not stored as an Activity status.
* Campus Admin may trigger activity removal only through SM moderation/report-review routing; H&L still performs the native deletion/removal workflow.
* Deletion operations that affect activity records, participation records, or counters must be atomic.

## Postconditions in Design Terms

* DS-HL-001 record is destroyed.
* Associated DS-HL-002 records are destroyed.
* The activity immediately disappears from all D\&P discovery feeds.
* The activity disappears from history contexts because the activity record no longer exists.

## Related Diagrams Suggested

* Sequence diagram: `delete_activity_sequence.puml`

## Open Points / Assumptions

* None. The behavior for participants upon hard deletion is documented as leaving no available context, with no notification fired.

***

## 5. Events and Internal Commands Summary

Active first-skeleton internal events emitted by H&L:

| Event | Originating use case | Minimum payload fields |
| --- | --- | --- |
| `JoinRequestApproved` | DUC-HL-02 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId`, `outcome` |
| `JoinRequestDeclined` | DUC-HL-02 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId`, `outcome` |
| `ActivityCancelled` | DUC-HL-03 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `outcome` |

Internal commands/interfaces consumed by H&L:

* `RequestActivityModerationAction` from SM after a reviewed report outcome requires `remove_activity`. SM records the moderation decision; H&L performs the native activity deletion/status consequence where required.
* `RequestPendingParticipationBlockConsequence` from SM is provisional and only for block-related pending-request consequences if later rules require a participation-state consequence. SM does not mutate DS-HL-002 directly.

## 6. Transaction and Concurrency Note

Approve, cancellation, deletion, and any H&L operation that affects capacity, participation records, or counters must be atomic. Capacity and existing participation/request state must be re-checked inside the write transaction. A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`. If concurrent operations conflict, only one succeeds and the other receives a safe rejection. Counters must be derived or updated transactionally and must not rely on stale client-side values.

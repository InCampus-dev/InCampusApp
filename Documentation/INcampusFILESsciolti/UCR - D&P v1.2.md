# UCR - D\&P v1.2

## Version Log

| **Version** | **Date**   | **Section modified**           | **Description of change**                                                                               | **Reason for change**                                                                                                                   | **Source document used as reference**                                              |
| ----------- | ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1.1         | 2026-05-04 | DUC-DP-02; DUC-DP-03; API rows | Added selected-campus context checks for direct activity detail and join/request flows.                 | Campus scope is the tenant boundary and must be enforced before activity details, host profile exposure, or participation writes.       | Project summary; Architecture Data Flow; Architecture Data Model; CRUD Matrix v1.5 |
| 1.1         | 2026-05-04 | DUC-DP-04; event summary       | Removed PendingRequestWithdrawn as an operational cross-subsystem event for pending request withdrawal. | Pending request withdrawal has no confirmed host-notification consequence and should not create a misleading NSF event/sequence branch. | UCR Critical Integration Review; CRUD Matrix v1.5; NSF UCR                         |
| 1.2       | 2026-05-08 | Participation model; withdrawal notification boundary; concurrency; cancellation/deletion history | Aligned D&P flows with canonical participation `RecordType + Status`, repaired broken API rows, removed persisted deleted-status wording, confirmed pending-request withdrawal creates no notification, added first-skeleton event payload and transaction guidance, and clarified cancellation versus deletion in personal history. | Required before using the UCR as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

Candidate API paths, controller names, service names, sequence filenames, and event names in this UCR are first-skeleton scaffolding unless explicitly accepted elsewhere as final contracts. The active first-skeleton events named here use the internal payload contract summarized in the Events section.

## 1. Subsystem Responsibility

The Discovery and Participation (D\&P) subsystem allows students to browse visible campus activities, view activity details, join or request to join activities, withdraw pending requests, leave joined activities, and view their personal activity list. It handles the student-facing interaction with already existing activities. It does not create activities, approve requests, own block relationships, or directly create notification records. Instead, it consumes data from other subsystems and emits internal events when user actions (like joining or leaving) require downstream consequences.

## 2. Owned Data Stores

Owned stores:

* None. This subsystem reuses stores owned by other modules according to the CRUD Matrix.

## 3. External Data Dependencies

External dependencies:

* DS-HL-001 — Activities (Read for feed construction, details, and limit checks. Partially updated for availability/count changes during join, withdraw, and leave).
* DS-HL-002 — Activity Participations (Read for existing state and personal lists. Created/deleted during join, withdraw, and leave).
* DS-AP-002 — Student Profile (Read only to expose the host's minimal public profile data in the activity details view).
* DS-SM-001 — Block Relationships (Read to filter feeds, prevent activity-detail access, and block join/request interactions).

***

# DUC-DP-01 — Browse and Filter Activities

## Source Use Case

Browse and Filter Activities

## Related Requirements

* **FR:** FR-0401, FR-0402, FR-0403, FR-0404, FR-0405, FR-0406
* **NFR:** NFR-11, NFR-16, NFR-17

## Implementation Goal

Present a campus-scoped, filtered list of available activities to the student guest, strictly filtering out activities that are full, completed, cancelled, or hosted by a reciprocally blocked user. Hard-deleted activities are not filtered as a persisted status; they are absent because the activity record no longer exists.

## Boundary Objects

* ActivityFeedScreen

## Control Objects / Services

* ActivityDiscoveryController
* FeedFilteringService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* BlockRelationship / DS-SM-001

## Candidate Client-Facing API

| **Method + Path** | **Purpose**                                   | **Input**                                                                 | **Output**                          | **Reads**            | **Writes** | **Events / Notes**                               |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- | -------------------- | ---------- | ------------------------------------------------ |
| `GET /activities` | Fetches a filtered list of campus activities. | `authenticatedStudentId`, optional filter params (category, time, gender) | List of filtered activity summaries | DS-HL-001, DS-SM-001 | None       | Blocked users' activities are actively filtered. |

## Main Design Flow

1. The student navigates to the ActivityFeedScreen and optionally applies filters.
2. ActivityDiscoveryController passes the request parameters to FeedFilteringService.
3. The module reads DS-SM-001 to retrieve the list of block relationships for the authenticated student.
4. The module reads DS-HL-001 to fetch activities matching the campus scope and applied filters, explicitly omitting activities that are full, cancelled, completed, or hosted by users identified in the block list. Hard-deleted activities are not returned because they no longer exist.
5. The filtered and ordered list of activity summaries is returned to the student.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Activities belonging to a host blocked by the user, or a host who blocked the user, must not be returned (Symmetric block visibility).
* Full, cancelled, and completed activities are excluded from discovery. Hard-deleted activities are absent because the record no longer exists.
* Approval-based activities that are not yet full remain visible as open.

## Postconditions in Design Terms

* A filtered activity list is displayed.
* No system state is mutated.

## Related Diagrams Suggested

* Sequence diagram: `browse_activities_sequence.puml`

## Open Points / Assumptions

* None.

***

# DUC-DP-02 — View Activity Details

## Source Use Case

View Activity Details

## Related Requirements

* **FR:** FR-0302, FR-0402
* **NFR:** NFR-35

## Implementation Goal

Allow a student to view the full details of a specific activity and the host's minimal public profile data, provided no block relationship exists between the student and the host.

## Boundary Objects

* ActivityDetailsScreen

## Control Objects / Services

* ActivityDiscoveryController
* BlockEnforcementService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* StudentProfile / DS-AP-002
* BlockRelationship / DS-SM-001

## Candidate Client-Facing API

| **Method + Path** | **Purpose** | **Input** | **Output** | **Reads** | **Writes** | **Events / Notes** |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /activities/{activityId}` | Retrieves full activity details and host profile info. | `authenticatedStudentId`, `activityId`, authenticated student context including `selectedCampusId` | Activity details object with host profile info | DS-HL-001, DS-AP-002, DS-SM-001 | None | Inaccessible if block exists. |

## Main Design Flow

1. The student selects an activity and the ActivityDetailsScreen requests data.
2. ActivityDiscoveryController reads DS-HL-001 to resolve the activity details and the host's ID.
3. BlockEnforcementService reads DS-SM-001 to check for a reciprocal block relationship. If a block exists, access is rejected.
4. The module reads DS-AP-002 to retrieve the host's minimal public profile data.
5. The module compiles the activity details and host profile and returns them to the client.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Access is strictly denied if a reciprocal block exists.
* If the activity has reached the participant limit but is accessed directly via link/notification, it should display a "full" state rather than hiding entirely.

## Postconditions in Design Terms

* Full details are provided to the client for display.
* No system state is mutated.

## Related Diagrams Suggested

* Sequence diagram: `view_activity_details_sequence.puml`

## Open Points / Assumptions

* The exact UI presentation of a blocked/inaccessible detail screen is left to frontend implementation.

***

# DUC-DP-03 — Join Activity

## Source Use Case

Join Activity

## Related Requirements

* **FR:** FR-0305, FR-2001, FR-2002, FR-0502
* **NFR:** NFR-13, NFR-34

## Implementation Goal

Allow a student to join an open activity directly or submit a pending request for an approval-based activity, while strictly enforcing availability, duplicate-participation rules, concurrency limits, and block constraints.

## Boundary Objects

* ActivityDetailsScreen

## Control Objects / Services

* JoinActivityController
* ParticipationService
* BlockEnforcementService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002
* BlockRelationship / DS-SM-001

## Candidate Client-Facing API

| **Method + Path** | **Purpose** | **Input** | **Output** | **Reads** | **Writes** | **Events / Notes** |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /activities/{activityId}/join` | Directly joins or requests to join an activity. | `authenticatedStudentId`, `activityId`, authenticated student context including `selectedCampusId` | `joined`, `request_submitted`, or error | DS-HL-001, DS-HL-002, DS-SM-001 | DS-HL-001, DS-HL-002 | Emits `DirectJoinCompleted` or `JoinRequestSubmitted`. |

## Main Design Flow

1. The student triggers the join action from the ActivityDetailsScreen.
2. JoinActivityController delegates to BlockEnforcementService, which reads DS-SM-001 to ensure no block exists between the student and host.
3. The module reads DS-HL-001 to verify the activity status is `open` and has not reached its participant/request limits. `full`, `completed`, and `cancelled` activities cannot accept new joins or requests; hard-deleted activities cannot be joined because no activity record exists.
4. The module reads DS-HL-002 to verify the student does not already have an active request/participation record for the activity.
5. Based on the participation mode, the module creates either `RecordType = participation`, `Status = confirmed` for direct join or `RecordType = request`, `Status = pending` for approval-based join request.
6. The module updates the `CurrentParticipantCount` or `CurrentRequestCount` in DS-HL-001.
7. The module emits either DirectJoinCompleted or JoinRequestSubmitted.
8. NSF consumes the event to create a notification record for the host.

## Events Emitted

* `DirectJoinCompleted` — emitted after successfully joining an open activity.
* `JoinRequestSubmitted` — emitted after successfully creating a pending request.

## Events Consumed

* None.

## Constraints and Exceptions

* Block relationships prevent interaction.
* Concurrent requests must strictly respect MaxParticipants / MaxRequests limits (NFR-13).
* Join/request operations that affect capacity, participation records, or counters must be atomic.
* Capacity and existing participation/request state must be re-checked inside the write transaction.
* A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`.
* If concurrent operations conflict, only one succeeds and the other receives a safe rejection.
* Counters must be derived or updated transactionally and must not rely on stale client-side values.

## Postconditions in Design Terms

* DS-HL-002 contains a new participation/request record.
* DS-HL-001 contains updated count/availability metrics.
* A join or request event is emitted for NSF.

## Related Diagrams Suggested

* Sequence diagram: `join_activity_sequence.puml`

## Open Points / Assumptions

* Concurrency strategy (NFR-13): Capacity, duplicate active record checks, and counter updates are performed atomically inside the write transaction. The exact locking technology is not fixed.

***

# DUC-DP-04 — Withdraw Join Request

## Source Use Case

Withdraw Join Request

## Related Requirements

* **FR:** FR-2701, FR-2703, FR-2704
* **NFR:** NFR-43

## Implementation Goal

Allow a student to back out of a pending join request before the host makes a decision, cleanly removing the request and freeing up activity capacity.

## Boundary Objects

* ActivityDetailsScreen
* PersonalActivityListScreen

## Control Objects / Services

* ParticipationService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002

## Candidate Client-Facing API

| **Method + Path**                             | **Purpose**                           | **Input**                              | **Output**               | **Reads** | **Writes**           | **Events / Notes**                                                     |
| --------------------------------------------- | ------------------------------------- | -------------------------------------- | ------------------------ | --------- | -------------------- | ---------------------------------------------------------------------- |
| `DELETE /activities/{activityId}/requests/me` | Withdraws an unapproved join request. | `authenticatedStudentId`, `activityId` | `withdrawn_successfully` | DS-HL-002 | DS-HL-001, DS-HL-002 | No event emitted. Pending request withdrawal does not notify the host. |

## Main Design Flow

1. The student initiates the withdraw action for a specific activity request.
2. ParticipationService reads DS-HL-002 to verify that the request belongs to the student and is still `RecordType = request`, `Status = pending`.
3. The module hard-deletes the pending request record from DS-HL-002.
4. The module updates DS-HL-001, decrementing the `CurrentRequestCount` and updating availability constraints.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* If the host has already approved or declined the request, the withdrawal action is rejected.
* Withdraw operations that affect participation records or counters must be atomic.
* Existing request state must be re-checked inside the write transaction.
* Pending request withdrawal creates no user-facing notification, no NSF handler, and no `DS-NS-001 Notification Record`.

## Postconditions in Design Terms

* DS-HL-002 no longer contains the pending request.
* DS-HL-001 request count is decremented.
* No event is emitted.
* No notification record is created.

## Related Diagrams Suggested

* Sequence diagram: `withdraw_join_request_sequence.puml`

## Open Points / Assumptions

* None.

***

# DUC-DP-05 — Leave Joined Activity

## Source Use Case

Leave Joined Activity

## Related Requirements

* **FR:** FR-2702, FR-2703, FR-2704
* **NFR:** NFR-13, NFR-22, NFR-43

## Implementation Goal

Allow a confirmed participant to leave an activity before it begins, freeing up a participant slot and triggering a notification event so the host is informed.

## Boundary Objects

* ActivityDetailsScreen
* PersonalActivityListScreen

## Control Objects / Services

* ParticipationService

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002

## Candidate Client-Facing API

| **Method + Path**                                 | **Purpose**                        | **Input**                              | **Output**          | **Reads**            | **Writes**           | **Events / Notes**             |
| ------------------------------------------------- | ---------------------------------- | -------------------------------------- | ------------------- | -------------------- | -------------------- | ------------------------------ |
| `DELETE /activities/{activityId}/participants/me` | Leaves an already joined activity. | `authenticatedStudentId`, `activityId` | `left_successfully` | DS-HL-001, DS-HL-002 | DS-HL-001, DS-HL-002 | Emits `JoinedParticipantLeft`. |

## Main Design Flow

1. The student triggers the leave action.
2. ParticipationService reads DS-HL-002 to confirm the student has `RecordType = participation`, `Status = confirmed`.
3. The module reads DS-HL-001 to ensure the activity has not yet started.
4. The module hard-deletes the participation record from DS-HL-002.
5. The module updates DS-HL-001, decrementing the `CurrentParticipantCount` and restoring the activity to an available state if it was previously full.
6. The module emits the `JoinedParticipantLeft` event.
7. NSF consumes the event and manages host notification creation in DS-NS-001.

## Events Emitted

* `JoinedParticipantLeft` — emitted when a user successfully leaves a joined activity.

## Events Consumed

* None.

## Constraints and Exceptions

* The student cannot leave if the activity's scheduled start time has already passed.
* Leave operations that affect participation records or counters must be atomic.
* Existing participation state must be re-checked inside the write transaction.

## Postconditions in Design Terms

* DS-HL-002 participation record is deleted.
* DS-HL-001 participant count is decremented.
* Event emitted for NSF to notify the host.

## Related Diagrams Suggested

* Sequence diagram: `leave_activity_sequence.puml`

## Open Points / Assumptions

* None.

***

# DUC-DP-06 — View Personal Activity List

## Source Use Case

View Personal Activity List

## Related Requirements

* **FR:** FR-0901, FR-0902
* **NFR:** NFR-22

## Implementation Goal

Compile and return a read-only list separating the student's upcoming participations from their past activity history.

## Boundary Objects

* PersonalActivityListScreen

## Control Objects / Services

* ActivityDiscoveryController

## Entity Objects / Data Stores

* Activity / DS-HL-001
* ActivityParticipation / DS-HL-002

## Candidate Client-Facing API

| **Method + Path**             | **Purpose**                                                     | **Input**                | **Output**                                                     | **Reads**            | **Writes** | **Events / Notes**     |
| ----------------------------- | --------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------- | -------------------- | ---------- | ---------------------- |
| `GET /profiles/me/activities` | Fetches the user's personal activity lists (upcoming and past). | `authenticatedStudentId` | Object containing `upcoming` and `past` activity summary lists | DS-HL-001, DS-HL-002 | None       | Read-only composition. |

## Main Design Flow

1. The student navigates to their personal activity area.
2. ActivityDiscoveryController reads DS-HL-002 to retrieve all participation and request records associated with the authenticated student.
3. The module reads DS-HL-001 to fetch the corresponding activity summaries and current lifecycle states (e.g., scheduled time, status).
4. The module processes the retrieved data, separating activities into relevant upcoming/history groupings using the activity timestamp and `Activity.Status`.
5. Cancelled activities may remain visible in relevant history contexts because cancellation preserves the activity record.
6. Deleted activities do not appear in discovery or history because deletion is a hard-delete behavior and the activity record no longer exists.
7. The segregated lists are returned to the client to render the UI.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Should cleanly handle cases where one or both lists are empty.
* The exact UI split between upcoming, past, and cancelled depends on the timestamp and status retrieved from DS-HL-001.
* `deleted` is not a persisted `Activity.Status`.

## Postconditions in Design Terms

* Data payload is returned.
* No system state is mutated.

## Related Diagrams Suggested

* Sequence diagram: `view_personal_list_sequence.puml`

## Open Points / Assumptions

* Unresolved: The exact UI logic of where to place cancelled activities in the personal list is an implementation detail. The backend provides the status flag and timestamp. Deleted activities are not returned because the activity record no longer exists.

***

## 5. Events Summary

Active first-skeleton internal events emitted by D&P:

| Event | Originating use case | Minimum payload fields |
| --- | --- | --- |
| `DirectJoinCompleted` | DUC-DP-03 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId` |
| `JoinRequestSubmitted` | DUC-DP-03 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId` |
| `JoinedParticipantLeft` | DUC-DP-05 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId` |

`PendingRequestWithdrawn` is not an active notification-producing event. If an implementation later emits it for internal bookkeeping, it must be optional, non-notifying, have no NSF handler, and create no `DS-NS-001` record.

## 6. Transaction and Concurrency Note

Join, request, withdraw, and leave operations that affect capacity, participation records, or counters must be atomic. Capacity and existing participation/request state must be re-checked inside the write transaction. A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`. If concurrent operations conflict, only one succeeds and the other receives a safe rejection. Counters must be derived or updated transactionally and must not rely on stale client-side values.

## 7. Source File Note

The source file copied from Downloads ended mid-word in the DUC-DP-06 open point. This corrected copy completes the sentence without adding unrelated D&P behavior.

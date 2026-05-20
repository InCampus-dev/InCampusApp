# UCR - S\&M v1.3

## Version Log

| **Version** | **Date**   | **Section modified**                                     | **Description of change**                                                                                                                                                                      | **Reason for change**                                                                                 | **Source document used as reference**                                                               |
| ----------- | ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1.1         | 2026-05-04 | DUC-SM-03; internal interfaces and events summary        | Replaced the generic moderation event with targeted internal commands for AP account moderation and H\&L activity moderation.                                                                  | The generic moderation request was ambiguous for interface catalogue and sequence diagram generation. | UCR Critical Integration Review; SM DFD workdoc; AP DFD workdoc; H\&L DFD workdoc; CRUD Matrix v1.5 |
| 1.2         | 2026-05-04 | DUC-SM-02; DUC-SM-04; event summary; internal interfaces | Removed unconsumed ReportSubmitted and UserBlocked events and introduced a conditional RequestPendingParticipationBlockConsequence internal command for block-related pending-request effects. | Event catalogue entries require confirmed consumers or explicit internal-interface purpose.           | UCR Critical Integration Review; SM DFD workdoc; CRUD Matrix v1.5; Architecture Data Flow           |
| 1.3       | 2026-05-08 | Report submit/review boundary; Student Profile naming; admin context; moderation actions | Aligned Submit Report so it stores target reference/campus scope without a submit-time `DS-HL-001` read, kept Review Report able to read activity context with unavailable-target fallback, renamed canonical `DS-AP-002` references to Student Profile, modeled admin authorization with runtime `AuthenticatedAdminContext`, and finalized `ModerationAction` vocabulary with `remove_activity`. | Required before using the UCR as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

Candidate API paths, controller names, service names, internal command names, and sequence filenames in this UCR are first-skeleton scaffolding unless explicitly accepted elsewhere as final contracts.

# Subsystem: Safety and Moderation

## 1. Subsystem Responsibility

The Safety and Moderation subsystem implements the MVP trust-and-safety behavior for community rules access, report submission, campus-admin report review, and student blocking. It owns report and block truth, exposes block state to other modules for enforcement, and records moderation decisions before delegating account or activity consequences to the modules that own those domains.

Safety and Moderation does not own student accounts, student profiles, activities, activity participations, or notification records.

Campus Admin authorization for report review is represented by runtime `AuthenticatedAdminContext`, not by a canonical Campus Admin store. No `DS-CA-003`, Admin Account Store, or Campus Admin database is introduced.

## 2. Owned Data Stores

Owned stores:

* `DS-SM-001 Block Relationships` - directed student-to-student block records, enforced symmetrically for supported visibility, interaction, profile, and notification-suppression effects.
* `DS-SM-002 Report Records` - submitted reports, report reason/details, campus scope, review state, review outcome, and moderation action trace.

## 3. External Data Dependencies

External dependencies:

* `DS-AP-001 Student Account` - read for reporter/target account validation, campus context, account validity, and AP-native suspension or ban routing after report review.
* `DS-AP-002 Student Profile` - read for controlled identification of reported users, target users, reporters, and block-confirmation context using minimal public profile data.
* `DS-HL-001 Activities` - read during report review when a report targets an activity; activity removal after moderation review is routed to H\&L.
* `DS-HL-002 Activity Participations` - not owned by SM; pending-request effects after block creation are delegated to H\&L if the current rules require a participation-state consequence.
* `DS-NS-001 Notification Records` - not read or written by SM; NSF writes notification records and reads `DS-SM-001` for cross-user notification suppression.

Community rules are static MVP app content. No `DS-SM-003` community-rules store is confirmed.

## 4. Use Case Realizations

# DUC-SM-01 — View Community Rules

## Source Use Case

View Community Rules

## Related Requirements

FR: `FR-1901`NFR: `NFR-33`

## Implementation Goal

Provide students with easy access to static community rules before participation features and during app use, without changing participation, activity, profile, report, or block state.

## Boundary Objects

* `CommunityRulesScreen`
* `ParticipationRulesEntryPoint`

## Control Objects / Services

* `CommunityRulesController`
* `CommunityRulesContentProvider`

## Entity Objects / Data Stores

* Static community rules content / no confirmed persistent store

## Candidate Client-Facing API

| **Method + Path**      | **Purpose**                                                                | **Input**                                      | **Output**                              | **Reads**    | **Writes** | **Events / Notes**                                                    |
| ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- | ------------ | ---------- | --------------------------------------------------------------------- |
| `GET /community-rules` | Returns the current static community rules content for display in the app. | Authenticated student context, optional locale | Rules content and presentation metadata | None modeled | None       | No event. This does not create a rule-view record or acknowledgement. |

## Main Design Flow

1. `CommunityRulesScreen` or `ParticipationRulesEntryPoint` receives the student's request to view rules.
2. `CommunityRulesController` coordinates the request inside the Safety and Moderation module.
3. `CommunityRulesContentProvider` returns the static MVP rules content.
4. No persistent data store is read or written.
5. The boundary object renders the rules in a readable format and returns the student to the previous app context when they leave the screen.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Community rules must be accessible before students use participation features and while students use the app.
* The rules must be easy to locate, read, and understand.
* No participation, activity, profile, report, block, or notification state changes in this use case.
* Rule acknowledgement, rule versioning, violation linkage, and admin rule management are not confirmed.
* No managed community-rules data store is introduced for MVP.

## Postconditions in Design Terms

* The student has been given access to the current static community rules content.
* No persistent store is changed.
* No internal event is emitted.

## Related Diagrams Suggested

* Sequence diagram: `view_community_rules_sequence`

## Open Points / Assumptions

* Future extension: editable rules, explicit acknowledgement, rule versioning, and direct violation linkage would require later requirements and possibly a managed store.

# DUC-SM-02 — Report User or Activity

## Source Use Case

Report User or Activity

## Related Requirements

FR: `FR-1701`, `FR-0201`, `FR-0202`, `FR-0203`NFR: `NFR-31`, `NFR-06`, `NFR-08`

## Implementation Goal

Allow a student to submit a campus-scoped report about exactly one user or one activity, preserving the target reference, campus scope, reason, and supported details for later campus-admin review. Submit Report does not perform a full `DS-HL-001` activity read; activity reports are accepted only when launched from an already allowed activity context.

## Boundary Objects

* `ReportSubmissionScreen`
* `ActivityDetailsScreen`
* `StudentProfileScreen`

## Control Objects / Services

* `ReportSubmissionController`
* `ReportValidationService`
* `ReportRecordService`
* `CampusScopeService`

## Entity Objects / Data Stores

* `ReportRecord` / `DS-SM-002 Report Records`
* `StudentAccount` / `DS-AP-001 Student Account`
* `StudentProfile` / `DS-AP-002 Student Profile`
* `Activity` target reference / `DS-HL-001 Activities` reference only; direct activity-target validation is not modeled as a Submit Report store read.

## Candidate Client-Facing API

| **Method + Path** | **Purpose**                                          | **Input**                                                                                                                               | **Output**                                                              | **Reads**                | **Writes**  | **Events / Notes**                                                         |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------ | ----------- | -------------------------------------------------------------------------- |
| `POST /reports`   | Creates a submitted report about a user or activity. | Authenticated student context, `campusId` from authenticated/launch context, `targetType`, `targetId`, `reasonCode`, optional `details` | Created `reportId`, `reviewStatus = submitted`, submission confirmation | `DS-AP-001`, `DS-AP-002` | `DS-SM-002` | No catalogue-level event emitted. No notification record is created by SM. |

## Main Design Flow

1. `ReportSubmissionScreen` receives the student's report submission from an allowed user or activity context.
2. `ReportSubmissionController` coordinates the request inside the Safety and Moderation module.
3. `ReportValidationService` reads `DS-AP-001` to validate the reporter account, campus context, and user target when the target is a user.
4. `ReportValidationService` reads `DS-AP-002` only where minimal public profile data context is needed to identify a user target in the reporting flow.
5. The controller validates that the submitted target is exactly one target type: user or activity. For activity reports, the target reference is accepted from an already allowed activity launch context rather than re-reading `DS-HL-001`.
6. `ReportRecordService` creates a new `DS-SM-002 Report Records` entry with reporter, target type/reference, campus scope, reason, supported details, submitted timestamp, and initial review state.
7. The boundary object displays a submission confirmation to the student.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Campus scope must be preserved through `CampusID` on the report record.
* A report must target either a user or an activity, not both.
* Required reason information must be present before a report is created.
* Submit Report stores target reference and campus scope in `DS-SM-002`.
* Submit Report must not become an H&L-dependent workflow.
* If the reporting flow is cancelled or required reason/details are missing, no `DS-SM-002` record is created.
* SM does not mutate student account, profile, activity, participation, or notification stores during report submission.
* Exact report fields, evidence support, reason-code domain, and launch contexts remain unresolved.

## Postconditions in Design Terms

* `DS-SM-002 Report Records` contains a new submitted report.
* Campus Admin review later reads the submitted report.
* No AP, H\&L, or NSF store is mutated by SM.

## Related Diagrams Suggested

* Sequence diagram: `report_user_or_activity_sequence`

## Open Points / Assumptions

* Unresolved: exact report payload schema, supported evidence fields, predefined reason codes, and all valid report launch contexts.

# DUC-SM-03 — Review Report

## Source Use Case

Review Report

## Related Requirements

FR: `FR-0201`, `FR-0202`, `FR-0203`NFR: `NFR-06`, `NFR-07`, `NFR-08`, `NFR-09`

## Implementation Goal

Allow an authorized campus admin to inspect campus-scoped submitted reports, record review outcomes and moderation action trace, and route any required account or activity consequences to AP or H\&L native workflows.

## Boundary Objects

* `AdminReportQueueScreen`
* `AdminReportReviewScreen`

## Control Objects / Services

* `ReportReviewController`
* `ReportReviewService`
* `ReportContextAssembler`
* `CampusAdminAuthorizationService`
* `ModerationActionDispatcher`

## Entity Objects / Data Stores

* `ReportRecord` / `DS-SM-002 Report Records`
* `StudentAccount` / `DS-AP-001 Student Account`
* `StudentProfile` / `DS-AP-002 Student Profile`
* `Activity` / `DS-HL-001 Activities`
* `AuthenticatedAdminContext` / runtime context only, not a persistent store

## Candidate Client-Facing API

| **Method + Path**                                            | **Purpose**                                                                     | **Input**                                                                                         | **Output**                                                            | **Reads**                                          | **Writes**  | **Events / Notes**                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /admin/campuses/{campusId}/reports`                     | Returns reports visible to the authorized campus admin for the selected campus. | `AuthenticatedAdminContext`, `campusId`, optional status filter                            | Report list with review status and submitted metadata                 | `DS-SM-002`                                        | None        | Campus admin authorization is required before returning data.                                                                                 |
| `GET /admin/campuses/{campusId}/reports/{reportId}`          | Returns one report and the relevant reported user or activity context.          | `AuthenticatedAdminContext`, `campusId`, `reportId`                                        | Report details, reason/details, review state, relevant target context | `DS-SM-002`, `DS-AP-001`, `DS-AP-002`, `DS-HL-001` | None        | Review may read AP or H&L context only as needed for the report target; unavailable/deleted activity targets return fallback context.          |
| `PATCH /admin/campuses/{campusId}/reports/{reportId}/review` | Records review outcome and optional moderation action trace.                    | `AuthenticatedAdminContext`, `campusId`, `reportId`, review outcome, optional action trace | Updated report review state                                           | `DS-SM-002`, optional `DS-AP-001`, `DS-AP-002`, `DS-HL-001` | `DS-SM-002` | No catalogue-level event emitted. Delegates consequences through targeted internal module commands when AP or H&L native action is required. |

## Main Design Flow

1. `AdminReportQueueScreen` receives the campus admin's request to review reports for a selected campus.
2. `ReportReviewController` validates `AuthenticatedAdminContext` for that `CampusID` through `CampusAdminAuthorizationService`.
3. The Safety and Moderation module reads `DS-SM-002` for submitted or in-review reports scoped to that campus.
4. When the admin selects a report, `ReportContextAssembler` reads `DS-SM-002` for full report details and reads relevant AP or H&L context depending on whether the report targets a user or an activity.
5. If an activity target no longer exists in `DS-HL-001`, `ReportContextAssembler` returns an unavailable/deleted target fallback while preserving the report record.
6. `AdminReportReviewScreen` displays the report reason, supported details, current review state, and target context or fallback.
7. The campus admin records the review outcome and optional moderation action trace.
8. `ReportReviewService` updates only `DS-SM-002` with review status, outcome, moderation action trace, reviewer identifier from `AuthenticatedAdminContext`, and review timestamp.
9. If the recorded outcome requires account suspension or ban, `ModerationActionDispatcher` sends `RequestAccountModerationAction` to AP.
10. If the recorded outcome requires activity removal, `ModerationActionDispatcher` sends `RequestActivityModerationAction` to H&L.
11. AP or H&L consumes the internal command and performs the native account or activity workflow under its own ownership rules.

## Events Emitted

* None as catalogue-level events. Moderation consequences are delegated through internal module commands.

## Internal Commands / Interfaces Delegated

```
RequestAccountModerationAction {
  reportId,
  targetAccountId,
  actionType: suspend_user | ban_user,
  campusId,
  reviewOutcomeId
}
```

```
RequestActivityModerationAction {
  reportId,
  activityId,
  actionType: remove_activity,
  campusId,
  reviewOutcomeId
}
```

## Events Consumed

* None.

## Constraints and Exceptions

* Campus admin access must be limited to the admin's authorized campus scope.
* Admin identity is `AuthenticatedAdminContext`, a runtime context object, not a persistent store.
* Report data must be protected from unauthorized access.
* Reports must be filtered and validated by `CampusID`.
* `Review Report` updates only `DS-SM-002` directly.
* User suspension or ban after report review must be routed through AP, not directly performed by SM.
* Activity removal after report review must be routed through H\&L, not directly performed by SM.
* `ModerationAction = none | warn_user | suspend_user | ban_user | remove_activity`.
* `remove_activity` is recorded by SM as the selected moderation action, while execution is routed through H&L-native workflow.
* Reporter feedback, reported-party notification, and evidence fields remain unresolved.

## Postconditions in Design Terms

* `DS-SM-002 Report Records` contains the updated review status, outcome, reviewer trace, review timestamp, and moderation action trace.
* `RequestAccountModerationAction` or `RequestActivityModerationAction` is sent if the recorded moderation outcome requires native AP or H\&L action.
* No student account, profile, activity, participation, or notification store is directly mutated by SM.

## Related Diagrams Suggested

* Sequence diagram: `review_report_sequence`
* Sequence diagram: `moderation_action_request_sequence`

## Open Points / Assumptions

* Provisional: exact admin authentication implementation behind `AuthenticatedAdminContext`.
* Unresolved: reporter feedback, reported-party notification, review-outcome domain, and report evidence fields.

# DUC-SM-04 — Block User

## Source Use Case

Block User

## Related Requirements

FR: `FR-1801`, `FR-1802`NFR: `NFR-32`

## Implementation Goal

Allow a student to block another student by recording a directed block relationship, while enforcing documented reciprocal effects through downstream block-state reads and delegating any pending participation consequence to H\&L.

## Boundary Objects

* `BlockConfirmationDialog`
* `StudentProfileScreen`
* `ActivityDetailsScreen`
* `JoinRequestReviewScreen`

## Control Objects / Services

* `BlockManagementController`
* `BlockManagementService`
* `BlockEnforcementService`
* `CampusScopeService`
* `PendingParticipationConsequenceDispatcher`

## Entity Objects / Data Stores

* `BlockRelationship` / `DS-SM-001 Block Relationships`
* `StudentAccount` / `DS-AP-001 Student Account`
* `StudentProfile` / `DS-AP-002 Student Profile`
* `ActivityParticipation` / `DS-HL-002 Activity Participations`, only through H\&L-native pending-request handling when applicable

## Candidate Client-Facing API

| **Method + Path** | **Purpose**                                                                        | **Input**                                                        | **Output**                                       | **Reads**                             | **Writes**  | **Events / Notes**                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /blocks`    | Creates a block relationship from the authenticated student to the target student. | Authenticated student context, `targetAccountId`, launch context | Block confirmation or duplicate/self-block error | `DS-AP-001`, `DS-AP-002`, `DS-SM-001` | `DS-SM-001` | No catalogue-level event emitted. Conditional pending-request handling is delegated to H\&L through `RequestPendingParticipationBlockConsequence` if needed. |

## Main Design Flow

1. `BlockConfirmationDialog` receives the student's confirmed block action from an allowed target-user context.
2. `BlockManagementController` coordinates the request inside the Safety and Moderation module.
3. `BlockManagementService` reads `DS-AP-001` to validate the authenticated student and target account.
4. `BlockManagementService` reads `DS-AP-002` when minimal target identity is needed for confirmation or result display.
5. `BlockManagementService` reads `DS-SM-001` to detect an existing block relationship and prevent duplicates.
6. The service rejects self-block attempts before writing any record.
7. If validation succeeds, SM creates a directed `DS-SM-001 Block Relationships` record.
8. The system treats the stored directed record as reciprocally restrictive for documented visibility, profile, join/request, and notification-suppression effects.
9. If the block affects a pending join request under the current rules, `PendingParticipationConsequenceDispatcher` sends `RequestPendingParticipationBlockConsequence` to the H\&L-native participation workflow. SM does not update `DS-HL-002`.
10. D\&P, AP, and NSF enforce the block later by reading `DS-SM-001` or the SM block-state interface in their own flows.

## Events Emitted

* None as a catalogue-level event.

## Internal Commands / Interfaces Delegated

* `RequestPendingParticipationBlockConsequence` — conditional internal command sent from SM to H\&L only if a newly created block affects pending join requests under the current rules.

```
RequestPendingParticipationBlockConsequence {
  initiatorAccountId,
  targetAccountId,
  blockId,
  campusId,
  affectedPendingRequestContext: to verify
}
```

## Events Consumed

* None.

## Constraints and Exceptions

* Self-block must be prevented.
* Duplicate block relationships must not be created.
* The target user must exist.
* The stored block record is directed, but enforcement is symmetric where documented.
* Blocked users cannot see each other's activities in discovery, open each other's activity details, view each other's minimal public profile data, or start new join/request interactions.
* Cross-user notification suppression belongs to NSF, which reads `DS-SM-001`.
* Existing shared participation is not automatically removed by block creation.
* Pending-request consequences after block creation must be handled by H\&L, not directly by SM.
* Unblock behavior is not confirmed in the MVP.

## Postconditions in Design Terms

* `DS-SM-001 Block Relationships` contains a new directed block relationship.
* Downstream modules enforce reciprocal block effects by reading `DS-SM-001`.
* If pending-request handling is required, SM sends `RequestPendingParticipationBlockConsequence` to H\&L; the exact H\&L mutation remains unresolved.

## Related Diagrams Suggested

* Sequence diagram: `block_user_sequence`
* Sequence diagram: `block_pending_request_consequence_sequence`

## Open Points / Assumptions

* Unresolved: exact H\&L representation for pending requests affected by a new block.
* Out of MVP: unblock behavior unless a later requirement confirms it.

## 5. Candidate API Summary

| **Method + Path**                                            | **Purpose**                                          | **Input**                                                                                             | **Output**                             | **Reads**                                          | **Writes**  | **Events / Notes**                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET /community-rules`                                       | Returns static MVP community rules content.          | Authenticated student context, optional locale                                                        | Rules content                          | None modeled                                       | None        | No event; no acknowledgement state.                                                                                |
| `POST /reports`                                              | Creates a submitted report about a user or activity. | Authenticated student context, `campusId`, `targetType`, `targetId`, `reasonCode`, optional `details` | Created report confirmation            | `DS-AP-001`, `DS-AP-002`                           | `DS-SM-002` | No catalogue-level event emitted.                                                                                  |
| `GET /admin/campuses/{campusId}/reports`                     | Lists reports for an authorized campus admin.        | `AuthenticatedAdminContext`, `campusId`, optional status filter                                       | Campus-scoped report list              | `DS-SM-002`                                        | None        | Requires campus authorization.                                                                                     |
| `GET /admin/campuses/{campusId}/reports/{reportId}`          | Returns report detail and relevant target context.   | `AuthenticatedAdminContext`, `campusId`, `reportId`                                                   | Report detail view model or unavailable-target fallback | `DS-SM-002`, `DS-AP-001`, `DS-AP-002`, `DS-HL-001` | None        | Reads target context only as needed during review.                                                                 |
| `PATCH /admin/campuses/{campusId}/reports/{reportId}/review` | Records review outcome and moderation action trace.  | `AuthenticatedAdminContext`, review outcome, optional action trace                                    | Updated report review state            | `DS-SM-002`, optional `DS-AP-001`, `DS-AP-002`, `DS-HL-001` | `DS-SM-002` | Delegates AP/H&L consequences through targeted internal commands if needed.                                       |
| `POST /blocks`                                               | Creates a student-to-student block relationship.     | Authenticated student context, `targetAccountId`, launch context                                      | Block confirmation or validation error | `DS-AP-001`, `DS-AP-002`, `DS-SM-001`              | `DS-SM-001` | No catalogue-level event emitted; H\&L handles pending-request consequences through an internal command if needed. |

## 6. Internal Interfaces and Events Summary

Internal module interfaces:

* SM -> AP: read account/profile context for report submission, report review, and block validation.
* SM -> AP: `RequestAccountModerationAction` after a recorded report-review outcome requires account suspension or ban.
* SM -> H\&L: read reported activity context during report review.
* SM -> H\&L: `RequestActivityModerationAction` after a recorded report-review outcome requires activity deletion/removal.
* SM -> H\&L: `RequestPendingParticipationBlockConsequence` after block creation, only if supported by current rules.
* D\&P -> SM: read block state for feed filtering, activity-detail access, and join/request prevention.
* AP -> SM: read block state before exposing another student's minimal public profile data.
* NSF -> SM: read block state for cross-user notification suppression and notification-open access checks.

Events:

* None as catalogue-level events emitted by SM in these use cases.

## 7. Suggested Sequence Diagram List

* `view_community_rules_sequence`
* `report_user_or_activity_sequence`
* `review_report_sequence`
* `moderation_action_request_sequence`
* `block_user_sequence`
* `block_pending_request_consequence_sequence`

## 8. Open Points and Modeling Assumptions

* Future extension: community rule editing, acknowledgement, versioning, and violation linkage are not part of MVP.
* Unresolved: exact report payload schema, evidence support, reason-code domain, review-outcome domain, and reporter feedback.
* Unresolved: final campus admin identity and authorization model.
* Unresolved: whether any reported-party notification exists.
* Unresolved: exact H\&L-native handling of pending requests after a block.
* Out of MVP: unblock behavior unless later requirements add it.
* Assumption for modeling only: activity-target reports can carry an activity reference from an allowed launch context even though Submit Report does not currently read `DS-HL-001` in the CRUD Matrix.
* First-skeleton moderation action vocabulary is fixed as `none`, `warn_user`, `suspend_user`, `ban_user`, and `remove_activity`.

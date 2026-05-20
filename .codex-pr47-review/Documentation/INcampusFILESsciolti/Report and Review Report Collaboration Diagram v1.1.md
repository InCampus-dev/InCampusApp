# Report and Review Report Collaboration Diagram v1.1

# Report and Review Report - Collaboration Diagram v1.1

![](<assets/Report and Review Report Collaboration Diagram v1.1.svg>)

![](<assets/Report and Review Report Collaboration Diagram v1.1_001.svg>)

![](<assets/Report and Review Report Collaboration Diagram v1.1_002.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Report and Review Report | Added runtime `AuthenticatedAdminContext`, final `ModerationAction` vocabulary, unavailable/deleted activity target fallback, and explicit AP/H&L native consequence delegation. | Required before using collaboration diagrams as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

# Purpose

This collaboration diagram package is derived from `Report and Review Report Sequence Diagram`. For readability, the use case realization is split into compact object-communication views for `Report Submission`, report-review access/context loading, and report-review outcome/delegation. Together they preserve student report submission, campus-admin review through runtime `AuthenticatedAdminContext`, SM-owned report persistence, and optional AP/H\&L native consequence delegation.

## Source Sequence Diagram

* `System Design/Sequence Diagrams/SM + CA/Report and Review Report Sequence Diagram.md`
* `System Design/Sequence Diagrams/SM + CA/ReportReview.plum`

## Related Use Case Realization

* DUC-SM-02 — Report User or Activity
* DUC-SM-03 — Review Report

## Related Requirements

FR: \[FR-1701, FR-0201, FR-0202, FR-0203]
NFR: \[NFR-31, NFR-06, NFR-07, NFR-08, NFR-09]

## Participants / Objects

| Object                          | Type             | Responsibility                                                                                                                                       |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student                         | Actor            | Submits a report from an allowed user or activity context.                                                                                           |
| Campus Admin                    | Actor            | Reviews campus-scoped submitted reports through `AuthenticatedAdminContext` and records outcomes.                                                     |
| ReportSubmissionScreen          | Boundary         | Captures the student's report target, reason, and details.                                                                                           |
| ReportSubmissionController      | Control          | Coordinates report submission inside Safety and Moderation.                                                                                          |
| ReportValidationService         | Service          | Validates reporter, campus scope, target type, and target context at a high level.                                                                   |
| ReportRecordService             | Service          | Creates the submitted report record.                                                                                                                 |
| AdminReportQueueScreen          | Boundary         | Starts campus-admin access to the report queue.                                                                                                      |
| AdminReportReviewScreen         | Boundary         | Displays report context and captures the review outcome.                                                                                             |
| ReportReviewController          | Control          | Coordinates authorization, report loading, context assembly, and review flow.                                                                        |
| CampusAdminAuthorizationService | Service          | Verifies runtime `AuthenticatedAdminContext` authorization for the selected CampusID.                                                                 |
| ReportContextAssembler          | Service          | Assembles reported user or reported activity context for review.                                                                                     |
| ReportReviewService             | Service          | Records the review outcome and action trace in DS-SM-002.                                                                                            |
| ModerationActionDispatcher      | Service          | Delegates native account or activity consequences when required by `ModerationAction`.                                                               |
| DS-SM-002 Report Records        | Data Store       | Stores submitted reports and report-review outcomes.                                                                                                 |
| Submission Context Stores       | Data Store Group | Groups AP account/Student Profile context required to validate the submitted report; activity reports carry their allowed launch-context activity reference. |
| Target Context Stores           | Data Store Group | Groups AP account/Student Profile context and H\&L activity context for compact review display.                                                      |
| Access and Profile Module       | Module           | Owns native account moderation consequences.                                                                                                         |
| Hosting and Lifecycle Module    | Module           | Owns native activity moderation consequences.                                                                                                        |

## Message Sequence

### Phase 1 — Report Submission

| No. | Source                     | Destination                | Message        |
| --- | -------------------------- | -------------------------- | -------------- |
| 1   | Student                    | ReportSubmissionScreen     | submit         |
| 2   | ReportSubmissionScreen     | ReportSubmissionController | request report |
| 3   | ReportSubmissionController | ReportValidationService    | validate       |
| 4   | ReportValidationService    | Submission Context Stores  | read context   |
| 5   | ReportSubmissionController | ReportRecordService        | create record  |
| 6   | ReportRecordService        | DS-SM-002 Report Records   | write report   |
| 7   | ReportSubmissionScreen     | Student                    | result         |

### Phase 2A — Report Review Access and Context

| No. | Source                 | Destination                     | Message             |
| --- | ---------------------- | ------------------------------- | ------------------- |
| 8   | Campus Admin           | AdminReportQueueScreen          | open queue          |
| 9   | AdminReportQueueScreen | ReportReviewController          | load workspace      |
| 10  | ReportReviewController | CampusAdminAuthorizationService | authorize(`AuthenticatedAdminContext`, campusId) |
| 11  | ReportReviewController | DS-SM-002 Report Records        | read reports        |
| 12  | ReportReviewController | ReportContextAssembler          | assemble context    |
| 13  | ReportContextAssembler | Target Context Stores           | read target context; show unavailable/deleted fallback if referenced activity no longer exists |
| 14  | ReportReviewController | AdminReportReviewScreen         | show report/context |

### Phase 2B — Report Review Outcome and Delegation

| No. | Source                     | Destination                  | Message         |
| --- | -------------------------- | ---------------------------- | --------------- |
| 15  | Campus Admin               | AdminReportReviewScreen      | submit outcome  |
| 16  | ReportReviewService        | DS-SM-002 Report Records     | update outcome and `ModerationAction` (`none`, `warn_user`, `suspend_user`, `ban_user`, `remove_activity`) |
| 17a | ModerationActionDispatcher | Access and Profile Module    | native AP account action for `warn_user`, `suspend_user`, or `ban_user` |
| 17b | ModerationActionDispatcher | Hosting and Lifecycle Module | native H\&L activity removal for `remove_activity` |
| 18  | AdminReportReviewScreen    | Campus Admin                 | result          |

## Rendered SVG Outputs

* `Report and Review Report Collaboration Diagram v1.1.svg` — report submission view.
* `Report and Review Report Collaboration Diagram v1.1_001.svg` — report-review access and context view.
* `Report and Review Report Collaboration Diagram v1.1_002.svg` — report-review outcome and delegation view.

## PlantUML Code

```
@startuml
title Report Submission - Collaboration Diagram

left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam dpi 180
skinparam nodesep 80
skinparam ranksep 80
skinparam defaultFontName Helvetica
skinparam ArrowFontSize 11
skinparam ObjectFontSize 12

object "Student" as Student <<Actor>>

package "Safety and Moderation" {
  object "ReportSubmissionScreen" as ReportUI <<Boundary>>
  object "ReportSubmissionController" as ReportController <<Control>>
  object "ReportValidationService" as ReportValidation <<Service>>
  object "ReportRecordService" as ReportRecordService <<Service>>
  object "DS-SM-002\nReport Records" as Reports <<Data Store>>
}

package "Context Stores" {
  object "Submission Context Stores\nDS-AP-001 / DS-AP-002" as SubmissionContext <<Data Store>>
}

Student --> ReportUI : 1: submit
ReportUI --> ReportController : 2: request report
ReportController --> ReportValidation : 3: validate
ReportValidation --> SubmissionContext : 4: read context
ReportController --> ReportRecordService : 5: create record
ReportRecordService --> Reports : 6: write report
ReportUI --> Student : 7: result

note bottom of ReportValidation
Validation failures stop before message 5.
Activity reports keep an allowed launch-context activity reference.
No submit-time DS-HL-001 read is modeled.
end note

note bottom of Reports
SM creates DS-SM-002 only.
No DS-NS-001 notification record is created.
end note

@enduml


@startuml
title Report Review Access and Context - Collaboration Diagram

left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam dpi 180
skinparam nodesep 80
skinparam ranksep 80
skinparam defaultFontName Helvetica
skinparam ArrowFontSize 11
skinparam ObjectFontSize 12

object "Campus Admin\n(AuthenticatedAdminContext)" as Admin <<Actor>>

package "Safety and Moderation" {
  object "AdminReportQueueScreen" as QueueUI <<Boundary>>
  object "AdminReportReviewScreen" as ReviewUI <<Boundary>>
  object "ReportReviewController" as ReviewController <<Control>>
  object "CampusAdminAuthorizationService" as AdminAuth <<Service>>
  object "ReportContextAssembler" as ContextAssembler <<Service>>
  object "DS-SM-002\nReport Records" as Reports <<Data Store>>
}

package "Context Stores" {
  object "Target Context Stores\nDS-AP-001 / DS-AP-002\nDS-HL-001" as TargetContext <<Data Store>>
}

Admin --> QueueUI : 8: open queue\nwith runtime admin context
QueueUI --> ReviewController : 9: load workspace
ReviewController --> AdminAuth : 10: authorize(AuthenticatedAdminContext,\ncampusId)
ReviewController --> Reports : 11: read reports
ReviewController --> ContextAssembler : 12: assemble\ncontext
ContextAssembler --> TargetContext : 13: read target context;\nif activity missing, return\nunavailable/deleted fallback
ReviewController --> ReviewUI : 14: show report/context

note bottom of Reports
SM reads DS-SM-002 for report list and selected report details.
Authorization failure stops before report details are shown.
AuthenticatedAdminContext is runtime/admin-auth context,
not a data store.
end note

@enduml



@startuml
title Report Review Outcome and Delegation - Collaboration Diagram

left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam dpi 180
skinparam nodesep 80
skinparam ranksep 80
skinparam defaultFontName Helvetica
skinparam ArrowFontSize 11
skinparam ObjectFontSize 12

object "Campus Admin\n(AuthenticatedAdminContext)" as Admin <<Actor>>

package "Safety and Moderation" {
  object "AdminReportReviewScreen" as ReviewUI <<Boundary>>
  object "ReportReviewService" as ReviewService <<Service>>
  object "ModerationActionDispatcher" as Dispatcher <<Service>>
  object "DS-SM-002\nReport Records" as Reports <<Data Store>>
}

package "Native Consequence Owners" {
  object "Access and Profile Module" as AP <<Module>>
  object "Hosting and Lifecycle Module" as HL <<Module>>
}

Admin --> ReviewUI : 15: submit outcome
ReviewService --> Reports : 16: update outcome + action trace\nModerationAction = none | warn_user |\nsuspend_user | ban_user | remove_activity
Dispatcher --> AP : 17a: native AP account action\n(warn_user/suspend_user/ban_user)
Dispatcher --> HL : 17b: native H&L activity removal\n(remove_activity)
ReviewUI --> Admin : 18: result

note bottom of ReviewService
The controller/service handoff is collapsed into message 16.
SM updates DS-SM-002 only.
No AP, H&L, or NSF store is directly mutated by SM.
remove_activity is recorded by SM but executed by H&L.
end note

note bottom of Dispatcher
Messages 17a and 17b are conditional alternatives.
SM delegates account consequences to AP and activity consequences to H&L.
No Campus Admin store is introduced.
end note

@enduml
```

## Notes for Review

* The original combined view was split into compact submission, review-access/context, and review-outcome/delegation views because the combined object graph remained too crowded for a professional collaboration diagram.
* The diagrams intentionally omit low-level return messages such as `reportId`, `authorized`, `updated report`, and `command accepted`.
* Validation and target-context reads are collapsed into high-level collaboration messages to keep the object network readable.
* Report submission creates only `DS-SM-002`; validation failures stop before report creation.
* Submit-time activity-target reports do not read `DS-HL-001`; they retain the allowed launch-context activity reference, matching the latest collaboration WorkDoc note.
* Activity reports are accepted only from already allowed activity context. If the referenced activity no longer exists during review, the admin sees an unavailable/deleted target fallback.
* Report review updates `DS-SM-002` before any AP/H\&L native consequence is delegated.
* No AP, H\&L, or NSF store is directly mutated by SM, and no `DS-NS-001` notification record is created by this flow.
* Campus Admin identity is represented by runtime `AuthenticatedAdminContext` (`adminId`, `email`, `role`, `authorizedCampusIds`, `selectedCampusId`), not by a canonical data store.
* The first-skeleton moderation action set is `none | warn_user | suspend_user | ban_user | remove_activity`.
* Open points inherited from the source material: exact evidence schema, reporter feedback, reported-party notification, and admin authentication implementation details.

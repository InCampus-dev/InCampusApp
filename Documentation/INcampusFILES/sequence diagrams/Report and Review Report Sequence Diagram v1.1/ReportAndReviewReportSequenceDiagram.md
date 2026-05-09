# Report and Review Report Sequence Diagram v1.1

# Report and Review Report — Sequence Diagram v1.1

![](assets/report-and-review-report-v1.1.svg)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Report and Review Report | Removed submit-time `DS-HL-001` read, moved activity context to review, adopted `AuthenticatedAdminContext`, `Student Profile`, and `remove_activity` moderation routing. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Purpose

This sequence diagram shows how Safety and Moderation records a student report about one user or one activity, then supports campus-admin review while delegating any account or activity consequence to the owning AP or H\&L module. Submit Report stores the target reference and campus scope without a full `DS-HL-001` read; Review Report may later read activity context for admin review.

## Related Use Case Realization

* DUC-SM-02 — Report User or Activity
* DUC-SM-03 — Review Report

## Related Requirements

FR: \[FR-1701, FR-0201, FR-0202, FR-0203]
NFR: \[NFR-31, NFR-06, NFR-07, NFR-08, NFR-09]

## Participants

| Participant                       | Type        | Responsibility                                                                 |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| Student                           | Actor       | Submits a report from an allowed user or activity context.                     |
| Campus Admin                      | Actor       | Reviews campus-scoped submitted reports through `AuthenticatedAdminContext`.   |
| ReportSubmissionScreen            | Boundary    | Captures the student's report target, reason, and supported details.           |
| ReportSubmissionController        | Control     | Coordinates report submission inside Safety and Moderation.                    |
| ReportValidationService           | Service     | Validates reporter, campus scope, target type, and target context.             |
| ReportRecordService               | Service     | Creates the submitted report record in the SM-owned report store.              |
| AdminReportQueueScreen            | Boundary    | Lists campus-scoped reports available to the authorized admin.                 |
| AdminReportReviewScreen           | Boundary    | Displays report details and captures the review outcome.                       |
| ReportReviewController            | Control     | Coordinates report queue access, detail viewing, and review submission.        |
| CampusAdminAuthorizationService   | Service     | Verifies runtime `AuthenticatedAdminContext` for the selected CampusID.        |
| ReportContextAssembler            | Service     | Reads target context from AP or H\&L according to report target type.          |
| ReportReviewService               | Service     | Updates only DS-SM-002 with review status, outcome, and action trace.          |
| ModerationActionDispatcher        | Service     | Sends targeted internal commands to AP or H\&L when a consequence is required. |
| DS-AP-001 Student Account         | Data Store  | Provides reporter/target account validity and campus context.                  |
| DS-AP-002 Student Profile         | Data Store  | Provides minimal public user identity only when a user target needs display context. |
| DS-HL-001 Activities              | Data Store  | Provides activity context during review when an activity target needs context. |
| DS-SM-002 Report Records          | Data Store  | Stores submitted reports and report-review outcomes.                           |
| Access and Profile Module         | Participant | Accepts account moderation commands for AP-native handling.                    |
| Hosting and Lifecycle Module      | Participant | Accepts activity moderation commands for H\&L-native handling.                 |

## Main Sequence Logic

1. The student submits a report from `ReportSubmissionScreen` with exactly one target type: user or activity.
2. `ReportSubmissionController` asks `ReportValidationService` to validate the reporter/account/profile context and target reference. Activity reports are accepted only when launched from an already allowed activity context, so submission does not perform a full `DS-HL-001` activity read.
3. `ReportRecordService` creates `DS-SM-002 Report Records` with `reviewStatus = submitted`, the target reference, and campus scope; SM emits no catalogue-level event and creates no notification record.
4. The campus admin opens the report queue for a selected `CampusID` through `AuthenticatedAdminContext`.
5. `ReportReviewController` verifies campus-admin authorization before reading campus-scoped report list/details from `DS-SM-002`.
6. `ReportContextAssembler` reads AP context for user targets or H\&L context for activity targets during review. If a referenced activity no longer exists, the admin sees an unavailable/deleted target fallback.
7. The campus admin records a review outcome and optional moderation action trace.
8. `ReportReviewService` updates only `DS-SM-002`.
9. If a native consequence is required, `ModerationActionDispatcher` sends `RequestAccountModerationAction` to AP for `warn_user`, `suspend_user`, or `ban_user`, or `RequestActivityModerationAction` to H\&L for `remove_activity`; SM does not directly update AP, H\&L, or NSF stores.

## PlantUML Code

```plantuml
@startuml
title Report and Review Report - Sequence Diagram v1.1

hide footbox
autonumber

actor "Student" as Student
actor "Campus Admin" as Admin
boundary "ReportSubmissionScreen" as ReportUI
control "ReportSubmissionController" as ReportController
control "ReportValidationService" as ReportValidation
control "ReportRecordService" as ReportRecordService
boundary "AdminReportQueueScreen" as QueueUI
boundary "AdminReportReviewScreen" as ReviewUI
control "ReportReviewController" as ReviewController
control "CampusAdminAuthorizationService" as AdminAuth
control "ReportContextAssembler" as ContextAssembler
control "ReportReviewService" as ReviewService
control "ModerationActionDispatcher" as Dispatcher
database "DS-AP-001 Student Account" as Accounts
database "DS-AP-002 Student Profile" as Profiles
database "DS-HL-001 Activities" as Activities
database "DS-SM-002 Report Records" as Reports
participant "Access and Profile Module" as AP
participant "Hosting and Lifecycle Module" as HL

== Part A - Student submits a report ==

Student -> ReportUI: submit report(targetType, targetId, reason, details)
ReportUI -> ReportController: createReport(campusId, reporterId, targetType, targetId, reason, details)
ReportController -> ReportValidation: validateReporterAndTarget(...)
ReportValidation -> Accounts: read reporter account and campus context
Accounts --> ReportValidation: reporter valid with CampusID
ReportValidation -> ReportValidation: ensure exactly one target type

alt target type = user
    ReportValidation -> Accounts: read target account validity and campus context
    Accounts --> ReportValidation: target account context
    opt minimal target identity needed
        ReportValidation -> Profiles: read target minimal public profile data
        Profiles --> ReportValidation: minimal identity
    end
else target type = activity
    ReportValidation -> ReportValidation: accept target reference from\nalready allowed activity context
end

ReportValidation --> ReportController: validation result

alt validation fails
    ReportController --> ReportUI: reject report without creating record
    ReportUI --> Student: show validation error
else validation succeeds
    ReportController -> ReportRecordService: create submitted report(...)
    ReportRecordService -> Reports: create report(status=submitted,\nTargetReference, CampusID)
    Reports --> ReportRecordService: reportId
    ReportRecordService --> ReportController: created report
    ReportController --> ReportUI: submission confirmation
    ReportUI --> Student: show confirmation
end

note over ReportController, Reports
No catalogue-level event is emitted.
SM creates no DS-NS-001 notification record.
Submit Report performs no full DS-HL-001 read.
end note

== Part B - Campus Admin reviews the report ==

Admin -> QueueUI: open report queue(CampusID)
QueueUI -> ReviewController: listReports(CampusID, AuthenticatedAdminContext)
ReviewController -> AdminAuth: authorize(AuthenticatedAdminContext, CampusID)

alt authorization fails
    AdminAuth --> ReviewController: not authorized
    ReviewController --> QueueUI: deny access
    QueueUI --> Admin: show access denied
else authorization succeeds
    AdminAuth --> ReviewController: authorized
    ReviewController -> Reports: read campus-scoped report list
    Reports --> ReviewController: report list
    ReviewController --> QueueUI: report list
    QueueUI --> Admin: show report queue

    Admin -> QueueUI: select report(reportId)
    QueueUI -> ReviewUI: open selected report(reportId, CampusID)
    ReviewUI -> ReviewController: getReportDetails(reportId, CampusID)
    ReviewController -> Reports: read report details scoped to CampusID
    Reports --> ReviewController: report details
    ReviewController -> ContextAssembler: assemble target context(report target)

    alt target type = user
        ContextAssembler -> Accounts: read reported account context
        Accounts --> ContextAssembler: account context
        ContextAssembler -> Profiles: read reported minimal public profile data
        Profiles --> ContextAssembler: profile context
    else target type = activity
        ContextAssembler -> Activities: read reported activity context
        alt activity exists
            Activities --> ContextAssembler: activity context
        else activity deleted/unavailable
            Activities --> ContextAssembler: unavailable/deleted target
            ContextAssembler -> ContextAssembler: prepare fallback context
        end
    end

    ContextAssembler --> ReviewController: report context
    ReviewController --> ReviewUI: report details and target context
    ReviewUI --> Admin: display report for review

    Admin -> ReviewUI: record outcome and ModerationAction
    ReviewUI -> ReviewController: submitReview(reportId, outcome, ModerationAction)
    ReviewController -> ReviewService: record review outcome(...)
    ReviewService -> Reports: update review status, outcome,\nreviewer trace, ModerationAction
    Reports --> ReviewService: updated report
    ReviewService --> ReviewController: review recorded

    alt review outcome requires no moderation action
        ReviewController --> ReviewUI: review saved
    else ModerationAction in warn_user/suspend_user/ban_user
        ReviewController -> Dispatcher: dispatch account consequence(reportId, targetAccountId, campusId, reviewOutcomeId)
        Dispatcher -> AP: RequestAccountModerationAction\n(warn_user/suspend_user/ban_user)
        AP --> Dispatcher: accepted for native handling
        Dispatcher --> ReviewController: command accepted
        ReviewController --> ReviewUI: review saved and AP command accepted
    else ModerationAction == remove_activity
        ReviewController -> Dispatcher: dispatch activity consequence(reportId, activityId, campusId, reviewOutcomeId)
        Dispatcher -> HL: RequestActivityModerationAction\n(remove_activity)
        HL --> Dispatcher: accepted for native handling
        Dispatcher --> ReviewController: command accepted
        ReviewController --> ReviewUI: review saved and H&L command accepted
    end

    ReviewUI --> Admin: show review result
end

note over ReviewService, Dispatcher
SM updates only DS-SM-002 directly.
SM does not directly update DS-AP-001, DS-HL-001, DS-HL-002, or DS-NS-001.
AuthenticatedAdminContext is runtime context, not a data store.
end note

@enduml
```

## Notes for Review

* Report submission creates only `DS-SM-002`; no catalogue-level event or notification record is produced by SM.
* Activity reports are accepted only from already allowed activity context. Submit Report stores target reference and campus scope but does not perform a full `DS-HL-001` read.
* Review Report may read `DS-HL-001` for current activity context and displays an unavailable/deleted target fallback when the activity record no longer exists.
* Report review records decisions in `DS-SM-002` before dispatching targeted native commands to AP or H\&L.
* `ModerationAction = none | warn_user | suspend_user | ban_user | remove_activity`; `remove_activity` is recorded by SM and executed through H\&L-native workflow.
* Unresolved: evidence schema, reporter feedback, reported-party notification, and exact admin authentication implementation remain provisional.

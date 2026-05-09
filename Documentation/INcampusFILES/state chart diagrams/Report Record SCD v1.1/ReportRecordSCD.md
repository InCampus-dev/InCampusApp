# Report Record SCD v1.1

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | ReportRecord State Chart | Aligned `ModerationAction` vocabulary, clarified `AuthenticatedAdminContext` as runtime admin context, preserved SM ownership boundaries, and kept diagram-only abstractions distinct from persisted `ReviewStatus`. | Required before using the state chart package as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

![Report Record SCD v1.1](assets/report-record-scd-v1.1.svg)

# ReportRecord — State Chart Diagram v1.1

## Purpose

This diagram represents the lifecycle of a submitted moderation report from creation to campus-admin review, outcome recording, possible moderation-action handoff, and closure.

## State Owner

* Safety and Moderation (SM)

## Related Use Cases

* Report User or Activity
* Review Report

## Related Requirements

FR:

* FR-1701
* FR-0201
* FR-0202
* FR-0203

NFR:

* NFR-31
* NFR-06
* NFR-07
* NFR-08
* NFR-09

## Source Documents Used

* State Chart Diagram WorkDoc v1.1: confirmed one-object state chart scope, source priority, required structure, and recommended ReportRecord lifecycle.
* SM DFD WorkDoc: confirmed `Submit Report`, `Review Report`, `DS-SM-002` ownership, and AP/H&L native workflow boundaries.
* CRUD Matrix: confirmed `Submit Report` creates `DS-SM-002`; `Review Report` reads context and updates only `DS-SM-002`.
* Entities & Attributes catalog plus final decisions: confirmed `ReportRecord`, `ReviewStatus`, `ReviewOutcome`, `ModerationAction`, `ReviewedByAdminID`, and `ReviewedAt`.
* Databases / Data Stores document: confirmed `DS-SM-002 Report Records` stores report reason, review status, outcome, and moderation action trace.
* Use case documentation for Report User or Activity: confirmed student report submission, target/reference requirements, and later review availability.
* Use case documentation for Review Report: confirmed campus-admin review through an authorized runtime context, outcome recording, no-action branch, and possible moderation action.
* Functional Requirements: confirmed FR-1701, FR-0201, FR-0202, and FR-0203.
* Non-Functional Requirements: confirmed NFR-31, NFR-06, NFR-07, NFR-08, and NFR-09.
* Safety and Moderation UCR plus existing sequence/collaboration diagrams: used only as supporting evidence for event order and ownership boundaries.

## Object Being Modeled

| Object | Store / Entity | Owner | Reason for State Chart |
|---|---|---|---|
| ReportRecord | DS-SM-002 Report Records | Safety and Moderation (SM) | It has a meaningful lifecycle: submitted, reviewed by an authorized campus admin, outcome recorded, possible moderation action selected, and closed. |

## States

The entity catalog defines the persisted `ReviewStatus` values as `submitted`, `under_review`, and `resolved`. `ActionRequired` and `Closed` are diagram-level abstractions, not additional stored `ReviewStatus` values.

The first-skeleton `ModerationAction` values are:

```text
ModerationAction = none | warn_user | suspend_user | ban_user | remove_activity
```

The PlantUML diagram uses a small UML choice node after `UnderReview` to keep the review outcome branch readable. That choice node is not a `ReportRecord` state.

| State | Meaning | Source / Justification |
|---|---|---|
| Submitted | Report exists in `DS-SM-002` with `ReviewStatus = submitted`. | Entity catalog default status; SM DFD `F-SM-06`; CRUD `Submit Report = C on SM-002`. |
| UnderReview | Authorized campus admin has started review using a runtime `AuthenticatedAdminContext`; record has `ReviewStatus = under_review`. | Entity catalog status; Review Report precondition; SM DFD `EV-SM-03` and `EV-SM-04`. |
| Reviewed | Outcome has been recorded and no moderation action is required; persisted status is `resolved`. | FR-0202; Review Report no-action alternate; entity catalog `ReviewOutcome` and `resolved`. |
| ActionRequired | Outcome/action branch for `ModerationAction != none`; this is not a stored status. | Entity catalog separates `ModerationAction` from `ReviewStatus`; SM DFD and CRUD require AP/H&L consequences to stay native. |
| Closed | Terminal endpoint for this diagram after the outcome/action trace is complete; persisted status remains `resolved`. | WorkDoc recommended lifecycle endpoint; entity catalog has no separate `closed` status. |

## Transition Table

| From State | To State | Trigger / Event | Guard / Condition | Effect | Source / Justification |
|---|---|---|---|---|---|
| Initial | Submitted | ReportSubmitted | Valid reporter; valid single target reference; reason present; campus scope identified. | Create `ReportRecord` in `DS-SM-002` with `ReviewStatus = submitted`. | FR-1701; Report User or Activity postconditions; SM DFD `F-SM-06`; CRUD `Submit Report = C on SM-002`. |
| Submitted | UnderReview | AdminStartsReview | `AuthenticatedAdminContext` is present and authorized for the report's `CampusScopeID`. | Set `ReviewStatus = under_review`. | NFR-06; Review Report preconditions; SM DFD `EV-SM-03`/`EV-SM-04`; final admin-context decision. |
| UnderReview | Reviewed | AdminRecordsNoActionOutcome | Admin completes review with `ModerationAction = none`. | Record `ReviewOutcome`, `ReviewedByAdminID` from runtime context, and `ReviewedAt`; set `ReviewStatus = resolved`. | FR-0202; Review Report A1; NFR-08; entity catalog. |
| UnderReview | ActionRequired | AdminRecordsModerationAction | Admin records `ModerationAction` as one of `warn_user`, `suspend_user`, `ban_user`, or `remove_activity`. | Record `ReviewOutcome` and `ModerationAction` trace in `DS-SM-002`. | FR-0203; SM DFD `F-SM-12`/`F-SM-13`; CRUD `Review Report = RU on SM-002`; final moderation action decision. |
| ActionRequired | Closed | ActionFinalized | `ModerationAction = warn_user` has been recorded, or AP/H&L native trigger has been recorded for `suspend_user`, `ban_user`, or `remove_activity`. | Save decision trace in `DS-SM-002`; set or keep `ReviewStatus = resolved`. | Final `ModerationAction` vocabulary; SM DFD `F-SM-14`; CRUD moderation consequences. |
| Reviewed | Closed | ReviewFinalized | Outcome has been saved and no moderation action is required. | Complete the ReportRecord lifecycle for this diagram; stored status remains `resolved`. | FR-0202; NFR-08; WorkDoc closure guidance; entity catalog `resolved`. |
| Closed | Final | LifecycleComplete | Outcome/action trace is complete. | End state chart instance. | State Chart Diagram WorkDoc final-state convention. |

## PlantUML Code

```
@startuml
title ReportRecord - State Chart Diagram v1.1

skinparam shadowing false
skinparam linetype ortho
skinparam dpi 180
skinparam defaultFontName Helvetica
skinparam backgroundColor #FFFFFF
skinparam ArrowFontSize 11
skinparam StateFontSize 12
skinparam nodesep 110
skinparam ranksep 95
skinparam state {
  BackgroundColor #F8FAFC
  BorderColor #334155
  FontColor #0F172A
  ArrowColor #334155
}

hide empty description

state "Submitted\nstatus=submitted\nDS-SM-002 created" as Submitted
state "UnderReview\nstatus=under_review\nAuthenticatedAdminContext authorized" as UnderReview
state "Reviewed\nstatus=resolved\naction=none" as Reviewed
state "ActionRequired\nnot a status\naction trace recorded" as ActionRequired
state "Closed\nterminal\nstatus=resolved" as Closed
state ReviewDecision <<choice>>

[*] --> Submitted : ReportSubmitted\n[valid report reference]

Submitted --> UnderReview : AdminStartsReview\n[admin context authorized]

UnderReview --> ReviewDecision : AdminRecordsOutcome

ReviewDecision -left-> Reviewed : [ModerationAction = none]

ReviewDecision -right-> ActionRequired : [ModerationAction != none]

Reviewed --> Closed : ReviewFinalized

ActionRequired --> Closed : ActionFinalized\n[warn_user or native trigger]

Closed --> [*] : LifecycleComplete

note right of UnderReview
  AuthenticatedAdminContext is a runtime context:
  adminId, email, role, authorizedCampusIds,
  selectedCampusId.
  It is not a data store.
end note

note right of ActionRequired
  SM records the moderation decision and action trace.
  AP executes suspend_user/ban_user natively.
  H&L executes remove_activity natively.
end note

@enduml
```

## Notes for Review

* The diagram models only `ReportRecord`, not the full Safety and Moderation workflow.
* `ActionRequired` is a review-outcome/action branch over `ReviewOutcome` and `ModerationAction`; it is not a canonical `ReviewStatus`.
* `Closed` is a terminal diagram endpoint; it is not a canonical `ReviewStatus`.
* Campus Admin identity is represented by runtime `AuthenticatedAdminContext`, not by `DS-CA-003`, an Admin Account Store, or a Campus Admin database.
* AP/H&L are referenced only as native workflow trigger destinations. SM does not directly suspend or ban accounts and does not directly delete activities.
* `warn_user` is modeled as a recorded moderation action trace with no AP/H&L trigger because no native AP/H&L workflow for warnings is documented.
* If an activity target no longer exists by review time, the admin sees an unavailable/deleted target fallback as review context; this does not add a new `ReviewStatus`.
* Canonical FR IDs use zero-padded `FR-0201`, `FR-0202`, and `FR-0203`; older user-story rows may still show non-zero-padded variants.

## Open Points

* Unresolved: final domain values for `ReviewOutcome` are marked `To verify`.
* Unresolved: exact report payload schema, evidence fields, review notes, and action trace details are not finalized.
* Unresolved: whether `warn_user` has any reporter/reported-party notification or other visible consequence; no such workflow is currently documented.

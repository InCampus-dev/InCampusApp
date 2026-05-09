# State Chart Diagram WorkDoc v1.1

## Version Log

| Version | Date | Scope | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | State chart guidance | Aligned Activity and Participation persisted-state vocabulary, clarified hard-delete terminal endpoints, corrected ActivityParticipation naming guidance, and added first-skeleton moderation/admin-context decisions. | Required before using the state chart package as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## 1. Purpose

This folder is only for **state chart diagrams derived from stateful objects in the InCampus design**.

A state chart diagram shows the lifecycle of one object: the states that the object can assume, the events that move it from one state to another, and the rules that make a transition valid or invalid.

The goal is simple: each teammate must model the lifecycle of the most important stateful objects used by the current MVP flows.

This work does **not** include:

* new use case narratives;
* new requirements;
* new actors;
* new entities;
* new data stores;
* new business states not already documented;
* activity diagrams or sequence diagrams;
* implementation details such as APIs, database triggers, queues, or code.

State chart diagrams must not describe the full workflow of a use case.They must describe the lifecycle of a specific object.

If the diagram is about a process, it is probably an activity diagram.If the diagram is about one object changing state over time, it is a state chart diagram.

***

## 2. Working Methodology

Use this procedure for every state chart diagram.

### Step 1 — Select one stateful object

Choose one object/entity that has a real lifecycle in the project documentation.

Recommended MVP objects:

```
Activity
Profile
ReportRecord
```

Do not create a state chart for objects that do not have meaningful states.

For example, `Campus Location` and `Activity Category` are mostly configuration/options. They may have active/inactive status, but they are less useful for the current report unless the team needs extra diagrams.

### Step 2 — Identify confirmed states

Extract states only from existing project documents.

Use values already documented in:

* the Entities & Attributes catalog;
* the CRUD Matrix;
* the relevant DFD WorkDoc;
* the use case narratives;
* the sequence diagrams, only as supporting material.

Do not invent states because they “sound useful”.

Example:

```
Activity states:
open
full
completed
cancelled
```

Important rule:

```
Pending Approval is NOT an Activity state.
A pending join request is represented by ActivityParticipation with
RecordType=request and Status=pending.
Deletion is a hard-delete outcome, not a persisted Activity.Status value.
```

### Step 3 — Identify transition events

For each state change, identify the event that causes it.

Examples:

```
ActivityCreated
ParticipantLimitReached
HostCancelsActivity
HostMarksCompleted
HostDeletesActivity
JoinRequestSubmitted
HostApprovesRequest
HostDeclinesRequest
StudentLeavesActivity
ReportSubmitted
AdminStartsReview
AdminRecordsOutcome
```

The event name should be short and readable.

### Step 4 — Define transition rules

For each transition, write the rule or condition that makes it valid.

Example:

```
open --> full: ParticipantLimitReached [confirmed participation count reaches MaxParticipants]
open --> cancelled: HostCancelsActivity [host is authorized]
open --> HardDeletedTerminal: HostDeletesActivity [hard-delete outcome, not persisted status]
```

Use guards when needed:

```
open --> full : participantLimitReached [confirmedCount >= maxParticipants]
```

### Step 5 — Keep ownership boundaries correct

A state chart may mention external triggers, but it must not transfer ownership of data.

Examples:

* H\&L owns `Activity` and `ActivityParticipation` lifecycle truth.
* SM owns `ReportRecord` review state.
* AP owns `StudentAccount` verification/access state.
* NSF owns `NotificationRecord` state.
* D\&P may trigger join/leave/withdraw effects allowed by the CRUD Matrix, but H\&L remains the source of truth for activity and participation state.

### Step 6 — Document open points explicitly

If a state or transition is unclear, do not silently decide it.

Use one of these labels:

```
Unresolved
Assumption for modeling only
Future extension
Out of MVP
```

***

## 3. Source Material

Each teammate must use only the following documents.

### Mandatory sources

1. Assigned Use Case Realization cards.
2. Original use case narratives.
3. Current sequence diagrams and collaboration diagrams, only as support.
4. CRUD Matrix.
5. Entities & Attributes catalog.
6. Databases / Data Stores document.
7. Relevant DFD WorkDoc.
8. Project summary / integrated architecture notes.

### Relevant DFD WorkDocs by diagram

| State Chart Diagram                         | Main object             | Primary source documents                                                    |
| ------------------------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| Activity Lifecycle State Chart              | `Activity`              | H\&L WorkDoc, D\&P WorkDoc, CRUD Matrix, Entities & Attributes, Databases   |
| ActivityParticipation Lifecycle State Chart | `ActivityParticipation` | H\&L WorkDoc, D\&P WorkDoc, NSF WorkDoc, CRUD Matrix, Entities & Attributes |
| ReportRecord Lifecycle State Chart          | `ReportRecord`          | SM WorkDoc, CRUD Matrix, Entities & Attributes, Databases                   |
| StudentAccount Lifecycle State Chart        | `StudentAccount`        | AP WorkDoc, CA WorkDoc, CRUD Matrix, Entities & Attributes                  |
| NotificationRecord Lifecycle State Chart    | `NotificationRecord`    | NSF WorkDoc, CRUD Matrix, Entities & Attributes, Databases                  |

### Documents to avoid as primary sources

Do not use informal brainstorming notes as the main source if they conflict with the current requirements, CRUD Matrix, or entity catalog.

Do not use PostMVP material unless the diagram explicitly marks the related behavior as:

```
Out of MVP
Future extension
```

***

## 5. Required Diagrams

The minimum recommended package is:

| Priority | Diagram                            | Object         | Why it is needed                                                                                            |
| -------- | ---------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| 1        | Activity Lifecycle State Chart     | `Activity`     | Central object of the app. It has clear persisted lifecycle states: `open`, `full`, `completed`, `cancelled`. Deletion is a hard-delete endpoint, not a stored status. |
| 2        | Profile Lifecycle State Chart      | `Profile`      |                                                                                                             |
| 3        | ReportRecord Lifecycle State Chart | `ReportRecord` | Represents report submission, review, outcome recording, and possible moderation consequences.              |

Optional diagrams, only if time allows:

| Diagram                                  | Object               | When useful                                                                                      |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| StudentAccount Lifecycle State Chart     | `StudentAccount`     | Useful if the team wants to show sign-up, verification, activation, suspension, or ban behavior. |
| NotificationRecord Lifecycle State Chart | `NotificationRecord` | Useful if notification creation, delivery, opening, and fallback behavior need to be documented. |
| Campus Configuration State Chart         | `Campus`             | Useful only if campus activation/inactivation is explicitly discussed.                           |

Do not create too many state chart diagrams.Three strong diagrams are better than many weak diagrams.

***

## 6. How to Model the Required Diagrams

## 6.1 Activity Lifecycle State Chart

### Object

```
Activity
```

### Owner

```
Hosting and Lifecycle (H&L)
```

### Main sources

* H\&L WorkDoc.
* D\&P WorkDoc.
* CRUD Matrix.
* Entities & Attributes catalog.
* Use cases: Create Activity, Update Activity Status, Delete Activity, Join Activity, Leave Joined Activity.

### Confirmed states

```
open
full
completed
cancelled
```

### Important modeling rules

* `Pending Approval` must not appear as an Activity state.
* Approval-based activities with pending requests remain `open` unless capacity is otherwise full.
* `full` means the confirmed participant limit has been reached.
* `cancelled` is different from deletion: cancellation preserves the activity record and may remain visible in relevant history contexts.
* Deletion is a hard-delete behavior that removes the activity record from discovery and history. It must be shown only as a non-persisted terminal endpoint if it appears in a diagram.
* `completed` remains available for history/profile contexts, not discovery.

### Typical transitions

| From      | To        | Event                                         | Rule / Condition                                                |
| --------- | --------- | --------------------------------------------- | --------------------------------------------------------------- |
| Initial   | open      | ActivityCreated                               | Host successfully creates the activity.                         |
| open      | full      | ParticipantLimitReached                       | Confirmed participation count reaches max participants.         |
| full      | open      | SlotAvailable                                 | A confirmed participant leaves and capacity is available again. |
| open      | cancelled | HostCancelsActivity                           | Host manually cancels activity.                                 |
| full      | cancelled | HostCancelsActivity                           | Host manually cancels a full activity.                          |
| open      | completed | HostMarksCompleted / TimePassed               | Activity is marked as completed.                                |
| full      | completed | HostMarksCompleted / TimePassed               | Full activity is completed.                                     |
| open      | HardDeletedTerminal | HostDeletesActivity / ModerationRemoveActivity | Native H\&L hard-delete workflow is triggered; endpoint is not an Activity status. |
| cancelled | HardDeletedTerminal | HostDeletesActivity / ModerationRemoveActivity | Cancelled activity is later hard-deleted if modeled; endpoint is not an Activity status. |

***

## 6.2 ActivityParticipation Lifecycle State Chart

### Object

```
ActivityParticipation
```

### Owner

```
Hosting and Lifecycle (H&L)
```

### Related initiators

```
Student Guest
Student Host
Discovery and Participation (D&P)
```

### Main sources

* H\&L WorkDoc.
* D\&P WorkDoc.
* NSF WorkDoc for notification consequences.
* CRUD Matrix.
* Entities & Attributes catalog.
* Use cases: Join Activity, Manage Join Requests, Withdraw Join Request, Leave Joined Activity, Update Activity Status.

### Confirmed persisted model

```
Participation.RecordType = request | participation
Participation.Status = pending | confirmed | declined
```

### Important modeling rules

* Direct join creates `RecordType = participation`, `Status = confirmed`.
* Approval-based join creates `RecordType = request`, `Status = pending`.
* Host approval converts/represents the request as `RecordType = participation`, `Status = confirmed`.
* Host decline keeps `RecordType = request` and sets `Status = declined`.
* Student withdrawal applies only to `RecordType = request`, `Status = pending`.
* Pending request withdrawal is a non-notifying workflow outcome: no host notification and no `DS-NS-001 NotificationRecord`.
* Student leave applies only to `RecordType = participation`, `Status = confirmed`; leave may keep its confirmed-participation notification behavior where documented.
* Parent activity cancellation is represented by the parent `Activity.Status = cancelled`; it is not a persisted Participation status.
* `joined`, `left`, `withdrawn`, `cancelled`, and `deleted` must not be modeled as canonical persisted Participation statuses.

### Typical transitions

| From | To | Event | Rule / Condition |
| --- | --- | --- | --- |
| Initial | RequestPending | JoinRequestSubmitted | Activity requires host approval; record is `RecordType=request`, `Status=pending`. |
| Initial | ParticipationConfirmed | DirectJoinCompleted | Activity allows direct join and has capacity; record is `RecordType=participation`, `Status=confirmed`. |
| RequestPending | ParticipationConfirmed | HostApprovesRequest | Host approves the applicant; capacity and duplicate-active-record constraints are checked inside the write transaction. |
| RequestPending | RequestDeclined | HostDeclinesRequest | Host declines the applicant; record remains `RecordType=request`, `Status=declined`. |
| RequestPending | RequestWithdrawnTerminal | StudentWithdrawsRequest | Pending request is withdrawn; record is removed or made inactive. This terminal endpoint is non-persisted and non-notifying. |
| ParticipationConfirmed | ParticipantLeftTerminal | StudentLeavesActivity | Student leaves before activity starts; leave is a workflow outcome, not a persisted Participation status. |
| RequestPending / ParticipationConfirmed | ActivityCancelledTerminal | ParentActivityCancelled | Parent activity is cancelled; terminal endpoint is diagram-only and does not create `Participation.Status=cancelled`. |
| RequestPending / ParticipationConfirmed / RequestDeclined | RecordDeletedTerminal | ParentActivityDeleted | Parent activity hard-delete cascades or removes related records; endpoint is diagram-only. |

If the diagram uses withdrawal, leave, cancellation, or deletion endpoints, label them as non-persisted diagram terminals or hard-delete outcomes.

***

## 6.3 ReportRecord Lifecycle State Chart

### Object

```
ReportRecord
```

### Owner

```
Safety and Moderation (SM)
```

### Main sources

* SM WorkDoc.
* CRUD Matrix.
* Entities & Attributes catalog.
* Use cases: Report User or Activity, Review Report.

### Suggested states

Use only the states supported by the current report attributes and review behavior.

Recommended simple model:

```
Submitted
UnderReview
Reviewed
ActionRequired
Closed
```

If the entity catalog uses more precise values for `ReviewStatus` or `ReviewOutcome`, use those values instead.

### Important modeling rules

* Student creates the report.
* Campus Admin reviews the report using a runtime `AuthenticatedAdminContext`; no Campus Admin store is introduced.
* SM updates the report record with the review outcome.
* If moderation action is needed, SM records the outcome and triggers native AP/H\&L workflows.
* SM must not directly ban accounts or delete activities unless the diagram explicitly shows this as a trigger to the appropriate native workflow.
* First-skeleton `ModerationAction` values are `none | warn_user | suspend_user | ban_user | remove_activity`.

### Typical transitions

| From           | To             | Event                              | Rule / Condition                                                  |
| -------------- | -------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Initial        | Submitted      | ReportSubmitted                    | Student submits report with valid target and reason.              |
| Submitted      | UnderReview    | AdminOpensReport                   | Campus Admin starts review.                                       |
| UnderReview    | Reviewed       | AdminRecordsNoActionOutcome        | Report is reviewed and no extra action is needed.                 |
| UnderReview    | ActionRequired | AdminRecordsModerationAction       | Admin decides that a moderation consequence is required.          |
| ActionRequired | Closed         | NativeWorkflowTriggeredAndRecorded | AP/H\&L native workflow is triggered and decision trace is saved. |
| Reviewed       | Closed         | ReviewFinalized                    | Report review is closed.                                          |

***

## 7. State Chart Diagram Page Template

Each state chart page must use this format.

```markdown
# [Object Name] — State Chart Diagram

## Purpose

[One short paragraph explaining why this object needs a state chart and which lifecycle it represents.]

## State Owner

- [Subsystem responsible for the object state]

## Related Use Cases

- [Use case 1]
- [Use case 2]
- [Use case 3]

## Related Requirements

FR: [...]
NFR: [...]

## Source Documents Used

- [Use Case Realization card]
- [Use case narrative]
- [CRUD Matrix]
- [Relevant DFD WorkDoc]
- [Entities & Attributes catalog]
- [Databases / Data Stores document]
- [Sequence diagram, if used as support]

## Object Being Modeled

| Object | Store / Entity | Owner | Reason for State Chart |
|---|---|---|---|
| [ObjectName] | [Store ID / Entity] | [Subsystem] | [Why the object has a meaningful lifecycle] |

## States

| State | Meaning | Source / Justification |
|---|---|---|
| [State] | [Meaning] | [Document or requirement] |

## Transition Table

| From State | To State | Trigger / Event | Guard / Condition | Effect |
|---|---|---|---|---|
| [From] | [To] | [Event] | [Condition] | [State update / consequence] |

## PlantUML Code

[code]

## Notes for Review

- [Important modeling decision.]
- [Open point, if any.]
```

***

## 8. PlantUML Style Template

Use this visual style unless the team already has a shared PlantUML style file.

```
@startuml
title [Object Name] - State Chart Diagram

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

[*] --> open : ActivityCreated

open --> full : ParticipantLimitReached\n[confirmedCount >= maxParticipants]
full --> open : SlotAvailable\n[confirmedCount < maxParticipants]

open --> cancelled : HostCancelsActivity
full --> cancelled : HostCancelsActivity

open --> completed : ActivityCompleted
full --> completed : ActivityCompleted

state "HardDeletedTerminal\n(non-persisted endpoint)" as HardDeletedTerminal
open --> HardDeletedTerminal : HostDeletesActivity
cancelled --> HardDeletedTerminal : HostDeletesActivity

completed --> [*]
cancelled --> [*]
HardDeletedTerminal --> [*]

@enduml
```

***

## 9. WorkDoc Template for Each Teammate Folder

Each teammate must create one page called:

```
State Chart Diagram WorkDoc
```

Use this format.

```markdown
# State Chart Diagram WorkDoc — [Name / Assigned Subsystems]

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.0 | YYYY-MM-DD | [Diagram name] | Initial state chart draft. | First lifecycle model derived from documented object states and use case behavior. | CRUD Matrix + Entities & Attributes + Relevant DFD WorkDoc |

## Assigned Subsystems

- [Subsystem 1]
- [Subsystem 2]

## Diagrams Produced

| Diagram | Object Modeled | Related Use Cases | Status | Notes |
|---|---|---|---|---|
| [Diagram name] | [Object] | [Use cases] | Draft / Reviewed / Final | [short note] |

## Source Documents Used

| Document | How it was used |
|---|---|
| Use Case Realization | Confirmed use case events and actor intentions. |
| Use Case Narrative | Confirmed main and alternative flows. |
| CRUD Matrix | Checked which object state is created, updated, read, or deleted. |
| Entities & Attributes | Confirmed state attributes and allowed values. |
| Databases / Data Stores | Confirmed store ownership and naming. |
| Relevant DFD WorkDoc | Confirmed subsystem boundaries and cross-subsystem effects. |
| Sequence Diagram | Used only to confirm event order and object responsibilities. |

## State Decisions

| Object | State | Decision | Reason |
|---|---|---|---|
| [Object] | [State] | Included / Excluded / Renamed | [Reason] |

## Cross-Subsystem Notes

Write any dependency with other subsystems here.

Example:
- Activity cancellation is owned by H&L but triggers NSF notification consequences.
- Report review is owned by SM but may trigger AP/H&L native workflows.
- Join and leave actions may be initiated by D&P, but participation truth remains in H&L.
- Block relationships are owned by SM and may prevent join/profile/notification interactions.

## Open Points

- None.

or:

- Unresolved: ...
- Assumption for modeling only: ...
- Future extension: ...
- Out of MVP: ...
```

***

## 10. Review Rules

Before submitting, each teammate must check:

1. The diagram models one object, not a whole process.
2. Every state is documented in the project material or explicitly marked as an assumption.
3. Every transition has a clear triggering event.
4. Guards/conditions are used when a transition is not always valid.
5. The object owner is correct.
6. No new actor, entity, data store, or requirement is invented.
7. The state chart does not duplicate a sequence diagram or an activity diagram.
8. The CRUD Matrix supports the modeled create/update/delete behavior.
9. Entity and store names match the current Entities & Attributes and Databases documents.
10. Cross-subsystem consequences are represented as triggers, not ownership transfers.
11. PostMVP behavior is excluded unless explicitly marked as `Out of MVP` or `Future extension`.
12. Open points are documented instead of silently resolved.

***

## 11. Final Submission Expected from Each Teammate

Each teammate submits:

```
1 State Chart Diagram WorkDoc
Assigned state chart diagram page(s)
PlantUML code for each diagram
Rendered diagram image, if available
```

Minimum final package:

```
- Activity Lifecycle State Chart
- Profile Lifecycle State Chart
- Report Record Lifecycle State Chart
```

Optional extra package, only if time allows:

```
- Student Account Lifecycle State Chart
- Notification Record Lifecycle State Chart
- Campus Configuration State Chart
```

The output must be compact, traceable, and directly aligned with the existing use case realizations, sequence diagrams, CRUD Matrix, and entity documentation.

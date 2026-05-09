# Manage Join Requests — Collaboration Diagram v1.1

![](<assets/Manage Join Requests — Collaboration Diagram v1.1.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Manage Join Requests | Removed legacy status shorthand, aligned approval/decline with `RecordType + Status`, clarified host-owned routine authority, and added transaction/event payload notes. | Required before using collaboration diagrams as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |



# Purpose

This collaboration diagram is derived from the "Manage Join Requests Sequence Diagram". It displays the Hosting and Lifecycle (H\&L) object interactions for both viewing pending request records with minimal public profile data and processing the Student Host's ordinary decision to approve or decline.

## Source Sequence Diagram

* Manage Join Requests Sequence Diagram

## Related Use Case Realization

* DUC-HL-02 — Manage Join Requests

## Related Requirements

FR: FR-0501, FR-0502, FR-2002, FR-1403

NFR: NFR-12, NFR-13

## Participants / Objects

| Object                            | Type       | Responsibility                                                   |
| --------------------------------- | ---------- | ---------------------------------------------------------------- |
| Student Host                      | Actor      | Initiates the use case and takes decisions                       |
| JoinRequestManagementScreen       | Boundary   | Collects input and displays output                               |
| HostParticipationController       | Control    | Coordinates the interaction                                      |
| ActivityCapacityService           | Service    | Verifies headcount constraints                                   |
| DS-HL-001 Activities              | Data Store | Persistent source for activity constraints and current headcount |
| DS-HL-002 Activity Participations | Data Store | Persistent source for pending request and confirmed participation records |
| DS-AP-002 Student Profile         | Data Store | Persistent source for applicant minimal public profile data      |
| Internal Event Dispatcher         | Event      | Bus routing `JoinRequestApproved` or `JoinRequestDeclined` with accepted payload fields |

## Message Sequence

| No. | Source                      | Destination                       | Message                                         |
| --- | --------------------------- | --------------------------------- | ----------------------------------------------- |
| 1   | Student Host                | JoinRequestManagementScreen       | open pending requests(activityId)               |
| 2   | JoinRequestManagementScreen | HostParticipationController       | getPendingRequests(activityId, hostId)          |
| 3   | HostParticipationController | DS-HL-001 Activities              | read activity status and verify hostId           |
| 4   | HostParticipationController | DS-HL-002 Activity Participations | read `RecordType=request, Status=pending` records for activityId |
| 5   | HostParticipationController | DS-AP-002 Student Profile         | read minimal public profile data for applicant IDs |
| 6   | HostParticipationController | JoinRequestManagementScreen       | render list with profiles                       |
| 7   | Student Host                | JoinRequestManagementScreen       | decide(requestId, "approve"\|"decline")         |
| 8   | JoinRequestManagementScreen | HostParticipationController       | processDecision(requestId, decision, hostId)    |
| 9   | HostParticipationController | ActivityCapacityService           | transactionally verify capacity and host ownership(activityId, hostId) |
| 10  | ActivityCapacityService     | DS-HL-001 Activities              | re-check capacity limits and headcount inside write transaction |
| 11  | HostParticipationController | DS-HL-002 Activity Participations | approve: convert/represent as `RecordType=participation, Status=confirmed`; decline: `RecordType=request, Status=declined` |
| 12  | HostParticipationController | DS-HL-001 Activities              | \[if approve] derive/update CurrentParticipantCount transactionally |
| 13  | HostParticipationController | Internal Event Dispatcher         | emit `JoinRequestApproved` or `JoinRequestDeclined` with accepted event payload |
| 14  | HostParticipationController | JoinRequestManagementScreen       | return decision recorded                        |
| 15  | JoinRequestManagementScreen | Student Host                      | show updated list                               |

## PlantUML Code

```
@startuml
title Manage Join Requests - Collaboration Diagram

object "Student Host" as Host
object "JoinRequestManagementScreen" as UI
object "HostParticipationController" as Controller
object "ActivityCapacityService" as CapacitySvc
object "DS-HL-001\nActivities" as Activities <<Data Store>>
object "DS-HL-002\nActivity Participations" as Participations <<Data Store>>
object "DS-AP-002\nStudent Profile" as Profiles <<Data Store>>
object "Internal Event Dispatcher" as Events

Host --> UI : 1: open pending requests(activityId)
UI --> Controller : 2: getPendingRequests(activityId, hostId)
Controller --> Activities : 3: read activity status\nand verify hostId
Controller --> Participations : 4: read RecordType=request,\nStatus=pending records\nfor activityId
Controller --> Profiles : 5: read minimal public profile data\nfor applicant IDs
Controller --> UI : 6: render list with profiles
Host --> UI : 7: decide(requestId, "approve"|"decline")
UI --> Controller : 8: processDecision(requestId, decision, hostId)
Controller --> CapacitySvc : 9: transactionally verify\ncapacity and host ownership\n(activityId, hostId)
CapacitySvc --> Activities : 10: re-check capacity limits\nand headcount inside write transaction
Controller --> Participations : 11: approve -> RecordType=participation,\nStatus=confirmed;\ndecline -> RecordType=request,\nStatus=declined
Controller --> Activities : 12: [if approve] derive/update\nCurrentParticipantCount transactionally
Controller --> Events : 13: emit JoinRequestApproved or\nJoinRequestDeclined\n{eventId,eventType,occurredAt,\nactivityId,triggeringAccountId,\nparticipationId,outcome}
Controller --> UI : 14: return decision recorded
UI --> Host : 15: show updated list

@enduml
```

## Notes for Review

* This diagram cleanly merges the two main distinct operational flows (1. viewing the request list and resolving profiles, 2. making the approval/decline decision) into a single sequentially numbered view.
* Student Host owns ordinary join request decisions. Campus Admin is not modeled as a routine H\&L decision actor; moderation-triggered H\&L consequences are separate SM/H\&L native workflows.
* Pending request records are `RecordType=request, Status=pending`. Approval produces or represents `RecordType=participation, Status=confirmed`; decline keeps `RecordType=request, Status=declined`.
* Approval/counter updates are atomic for the first skeleton: capacity and request state are re-checked inside the write transaction, and conflicts receive safe rejection.
* Event payloads are first-skeleton internal contracts, not public API contracts.
* **Assumption for modeling only**: Batch approval behavior is not explicitly specified, assuming single-record interactions for requests as noted in the WorkDoc.

# Join Activity — Collaboration Diagram v1.1

![](<assets/Join Activity — Collaboration Diagram v1.1.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Join Activity | Aligned participation record creation with `RecordType + Status`, event payload fields, activity status vocabulary, and transaction-based capacity/counter handling. | Required before using collaboration diagrams as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Purpose

This collaboration diagram is derived from the "Join Activity Sequence Diagram". It illustrates the network of interactions among Discovery and Participation objects when a student guest attempts to join an activity. It highlights the numbered message flow for block verification, atomic capacity and duplicate-record checks, canonical participation/request creation, and accepted internal event emission.

## Source Sequence Diagram

* Join Activity Sequence Diagram

## Related Use Case Realization

* DUC-DP-03 — Join Activity

## Related Requirements

FR: FR-0305, FR-2001, FR-2002, FR-0502

NFR: NFR-13, NFR-34

## Participants / Objects

| Object                            | Type       | Responsibility                                                     |
| --------------------------------- | ---------- | ------------------------------------------------------------------ |
| Student Guest                     | Actor      | Initiates the join request                                         |
| ActivityDetailsScreen             | Boundary   | Collects input and displays output                                 |
| JoinActivityController            | Control    | Coordinates the interaction                                        |
| BlockEnforcementService           | Service    | Verifies no reciprocal block exists between student and host       |
| ParticipationService              | Service    | Applies domain logic to validate constraints and create the canonical request/participation record |
| DS-SM-001 Block Relationships     | Data Store | Persistent source for block relationships (Read)                   |
| DS-HL-001 Activities              | Data Store | Persistent source for activity truth and capacity (Read/Update transactionally) |
| DS-HL-002 Activity Participations | Data Store | Persistent source for participation records (Read/Create transactionally) |
| Internal Event Dispatcher         | Event      | Bus routing `DirectJoinCompleted` or `JoinRequestSubmitted` to NSF with accepted payload fields |

## Message Sequence

| No. | Source                  | Destination                       | Message                                               |
| --- | ----------------------- | --------------------------------- | ----------------------------------------------------- |
| 1   | Student Guest           | ActivityDetailsScreen             | click join(activityId)                                |
| 2   | ActivityDetailsScreen   | JoinActivityController            | requestJoin(activityId, studentId)                    |
| 3   | JoinActivityController  | BlockEnforcementService           | checkReciprocalBlock(studentId, hostId)               |
| 4   | BlockEnforcementService | DS-SM-001 Block Relationships     | read block relationships                              |
| 5   | JoinActivityController  | ParticipationService              | executeJoinFlow(activityId, studentId)                |
| 6   | ParticipationService    | DS-HL-001 Activities              | transactionally read/re-check activity context(Status=open/full, limits, mode, hostId) |
| 7   | ParticipationService    | DS-HL-002 Activity Participations | transactionally check no duplicate active record(ActivityID, StudentAccountID) |
| 8   | ParticipationService    | DS-HL-002 Activity Participations | create `RecordType=participation, Status=confirmed` or `RecordType=request, Status=pending` |
| 9   | ParticipationService    | DS-HL-001 Activities              | derive/update CurrentParticipantCount or CurrentRequestCount transactionally |
| 10  | ParticipationService    | Internal Event Dispatcher         | emit `DirectJoinCompleted` or `JoinRequestSubmitted` with accepted event payload |
| 11  | JoinActivityController  | ActivityDetailsScreen             | return success outcome                                |
| 12  | ActivityDetailsScreen   | Student Guest                     | show success feedback                                 |

## PlantUML Code

```
@startuml
title Join Activity - Collaboration Diagram

object "Student Guest" as Student
object "ActivityDetailsScreen" as UI
object "JoinActivityController" as Controller
object "BlockEnforcementService" as BlockSvc
object "ParticipationService" as PartSvc
object "DS-SM-001\nBlock Relationships" as Blocks <<Data Store>>
object "DS-HL-001\nActivities" as Activities <<Data Store>>
object "DS-HL-002\nActivity Participations" as Participations <<Data Store>>
object "Internal Event Dispatcher" as Events

Student --> UI : 1: click join(activityId)
UI --> Controller : 2: requestJoin(activityId, studentId)
Controller --> BlockSvc : 3: checkReciprocalBlock(studentId, hostId)
BlockSvc --> Blocks : 4: read block relationships
Controller --> PartSvc : 5: executeJoinFlow(activityId, studentId)
PartSvc --> Activities : 6: transactionally read/re-check\nactivity context(Status=open/full,\nlimits, mode, hostId)
PartSvc --> Participations : 7: check no duplicate active record\n(ActivityID, StudentAccountID)
PartSvc --> Participations : 8: create RecordType=participation,\nStatus=confirmed OR\nRecordType=request, Status=pending
PartSvc --> Activities : 9: derive/update CurrentParticipantCount\nor CurrentRequestCount transactionally
PartSvc --> Events : 10: emit DirectJoinCompleted or\nJoinRequestSubmitted\n{eventId,eventType,occurredAt,\nactivityId,triggeringAccountId,\nparticipationId}
Controller --> UI : 11: return success outcome
UI --> Student : 12: show success feedback

@enduml
```

## Notes for Review

* The conditionals for checking `ParticipationMode` (direct join vs. approval-based request) are abstracted into combined messages (8, 9, 10) to keep the diagram readable and focused on structural collaboration rather than deep branching.
* Participation records use `RecordType = request | participation` and `Status = pending | confirmed | declined`. Direct join creates `RecordType=participation, Status=confirmed`; approval-based join creates `RecordType=request, Status=pending`.
* Concurrency is resolved for the first skeleton: capacity and existing request/participation state are re-checked inside the write transaction; a uniqueness constraint prevents duplicate active records for the same `ActivityID + StudentAccountID`; conflicting concurrent operations receive safe rejection.
* Event payloads are first-skeleton internal contracts, not public API contracts.

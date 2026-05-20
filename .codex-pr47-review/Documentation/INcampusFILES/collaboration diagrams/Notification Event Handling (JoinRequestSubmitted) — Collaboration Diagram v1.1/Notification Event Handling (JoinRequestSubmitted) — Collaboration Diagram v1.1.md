# Notification Event Handling (JoinRequestSubmitted) — Collaboration Diagram v1.1

![](<assets/Notification Event Handling (JoinRequestSubmitted) — Collaboration Diagram v1.1.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Notification Event Handling (JoinRequestSubmitted) | Aligned event payload fields with first-skeleton internal event contracts and excluded pending-request withdrawal from notification-producing NSF handling. | Required before using collaboration diagrams as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

# Purpose

This collaboration diagram is derived from the Notification Event Handling (JoinRequestSubmitted) Sequence Diagram. It represents how the Notifications and System Flow module processes the accepted first-skeleton `JoinRequestSubmitted` internal event — from event consumption through recipient resolution, block-based suppression, notification record creation, and delivery gateway dispatch — as a set of object-to-object links with numbered messages. The same structural pattern applies only to accepted notification-producing events; pending-request withdrawal is explicitly excluded for the first skeleton.

## Source Sequence Diagram

* Notification Event Handling (JoinRequestSubmitted) — Sequence Diagram (DUC-NSF-01)

## Related Use Case Realization

* DUC-NSF-01 — Notify Host of Join Event

## Related Requirements

FR: FR-0601, FR-0602, FR-0603

NFR: NFR-14, NFR-15

## Participants / Objects

| Object                            | Type       | Responsibility                                                      |
| --------------------------------- | ---------- | ------------------------------------------------------------------- |
| DiscoveryAndParticipationModule   | Module     | Upstream emitter of the JoinRequestSubmitted event                  |
| InternalEventDispatcher           | Event      | Routes domain events between modules                                |
| JoinEventNotificationHandler      | Control    | Consumes the event and coordinates the NSF notification flow        |
| RecipientResolutionService        | Service    | Resolves host as recipient, validates account status                |
| BlockSuppressionService           | Service    | Checks block state between triggering student and recipient         |
| NotificationCompositionService    | Service    | Composes and persists the notification record                       |
| NotificationDispatchService       | Service    | Dispatches the notification to the delivery gateway                 |
| NotificationDeliveryGateway       | Gateway    | External push/in-app delivery mechanism                             |
| DS-HL-001 Activities              | Data Store | Activity details: title, schedule, host, mode (read, owned by H\&L) |
| DS-HL-002 Activity Participations | Data Store | Participation/request context (read, owned by H\&L)                 |
| DS-AP-001 Student Account         | Data Store | Host account validity check (read, owned by AP)                     |
| DS-SM-001 Block Relationships     | Data Store | Block suppression check (read, owned by SM)                         |
| DS-NS-001 Notification Records    | Data Store | Notification record (create, owned by NSF)                          |

## Message Sequence

| No. | Source                          | Destination                       | Message                                                                                                                 |
| --- | ------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | DiscoveryAndParticipationModule | InternalEventDispatcher           | emit JoinRequestSubmitted {eventId, eventType, occurredAt, activityId, triggeringAccountId, participationId}             |
| 2   | InternalEventDispatcher         | JoinEventNotificationHandler      | route JoinRequestSubmitted                                                                                              |
| 3   | JoinEventNotificationHandler    | RecipientResolutionService        | resolveRecipient(event)                                                                                                 |
| 4   | RecipientResolutionService      | DS-HL-001 Activities              | read activity (HostAccountID, Title, Schedule, Mode)                                                                    |
| 5   | RecipientResolutionService      | DS-HL-002 Activity Participations | read participation record                                                                                               |
| 6   | RecipientResolutionService      | DS-AP-001 Student Account         | read host account (PlatformAccessStatus)                                                                                |
| 6a  | RecipientResolutionService      | JoinEventNotificationHandler      | \[host inactive] suppress, end                                                                                          |
| 7   | JoinEventNotificationHandler    | BlockSuppressionService           | checkBlock(triggeringAccountId, hostId)                                                                                 |
| 8   | BlockSuppressionService         | DS-SM-001 Block Relationships     | read block relationship                                                                                                 |
| 8a  | BlockSuppressionService         | JoinEventNotificationHandler      | \[block exists] suppress, end                                                                                           |
| 9   | JoinEventNotificationHandler    | NotificationCompositionService    | composeNotification(recipient=HostAccountID, type=JoinEvent, targetContext=JoinRequestReview, trigger=triggeringAccountId) |
| 10  | NotificationCompositionService  | DS-NS-001 Notification Records    | create NotificationRecord                                                                                               |
| 11  | JoinEventNotificationHandler    | NotificationDispatchService       | dispatch(notificationPayload)                                                                                           |
| 12  | NotificationDispatchService     | NotificationDeliveryGateway       | deliver notification (push + in-app)                                                                                    |

## PlantUML Code

```
@startuml
title Notification Event Handling (JoinRequestSubmitted) - Collaboration Diagram

skinparam defaultFontName Arial
skinparam defaultFontSize 11
skinparam roundcorner 8

skinparam rectangle {
  BackgroundColor #F0F4FF
  BorderColor #2E5FA3
  FontColor #1F3864
}

skinparam database {
  BackgroundColor #F5F5F5
  BorderColor #BFBFBF
  FontColor #1F3864
}

' ─── Upstream emitter ─────────────────────────────────────
rectangle "DiscoveryAndParticipation\nModule" as DP <<Module>> #FFF3E0

' ─── Event routing ────────────────────────────────────────
rectangle "InternalEventDispatcher" as Events <<Event>> #FFFDE7

' ─── NSF Module: central handler ─────────────────────────
rectangle "JoinEventNotification\nHandler" as Handler <<Control>>

' ─── NSF Module: services ────────────────────────────────
rectangle "RecipientResolution\nService" as Recipient <<Service>>
rectangle "BlockSuppression\nService" as BlockSvc <<Service>>
rectangle "NotificationComposition\nService" as Composer <<Service>>
rectangle "NotificationDispatch\nService" as Dispatch <<Service>>

' ─── External gateway ────────────────────────────────────
rectangle "NotificationDelivery\nGateway" as Gateway <<Gateway>> #FFE0B2

' ─── Read-only data stores (external to NSF) ─────────────
database "DS-HL-001\nActivities" as Activities
database "DS-HL-002\nActivity Participations" as Participations
database "DS-AP-001\nStudent Account" as Account
database "DS-SM-001\nBlock Relationships" as Blocks

' ─── NSF-owned data store ─────────────────────────────────
database "DS-NS-001\nNotification Records" as Notifications #E3F2FD

' ─── Event emission and routing ───────────────────────────
DP --> Events       : 1: emit JoinRequestSubmitted\n{eventId, eventType, occurredAt,\nactivityId, triggeringAccountId,\nparticipationId}
Events --> Handler  : 2: route JoinRequestSubmitted

' ─── Recipient resolution ─────────────────────────────────
Handler --> Recipient        : 3: resolveRecipient(event)
Recipient --> Activities     : 4: read activity\n(HostAccountID, Title, Schedule, Mode)
Recipient --> Participations : 5: read participation record
Recipient --> Account        : 6: read host account\n(PlatformAccessStatus)
Recipient --> Handler        : 6a: [host inactive] suppress, end

' ─── Block suppression ────────────────────────────────────
Handler --> BlockSvc  : 7: checkBlock(triggeringAccountId, hostId)
BlockSvc --> Blocks   : 8: read block relationship
BlockSvc --> Handler  : 8a: [block exists] suppress, end\n(System Invariant Rule 2)

' ─── Notification composition and persistence ─────────────
Handler --> Composer       : 9: composeNotification(\nrecipient=HostAccountID,\ntype=JoinEvent,\ntargetContext=JoinRequestReview,\ntrigger=triggeringAccountId)
Composer --> Notifications : 10: create NotificationRecord

' ─── Dispatch ────────────────────────────────────────────
Handler --> Dispatch  : 11: dispatch(notificationPayload)
Dispatch --> Gateway  : 12: deliver notification\n(push + in-app)

note right of Notifications
  Only DS-NS-001 is written.
  DS-HL-001, DS-HL-002,
  DS-AP-001, DS-SM-001
  are read-only in this flow.
  (System Invariant Rule 1)
  Opening a notification is read-only;
  no read/unread state is modeled
  for the first skeleton.
end note

note bottom of Handler
  Pending request withdrawal has
  no NSF handler, no user-facing
  notification branch, and no
  DS-NS-001 record.
end note

note bottom of Blocks
  DS-SM-001 owned by SM.
  NSF reads only (msg 8).
  Block records not modified.
end note

@enduml
```

## Notes for Review

* All 13 objects are preserved from the source sequence diagram. No new objects introduced.
* Two suppression decision points are shown as guarded messages (6a and 8a) on their respective return links. If either guard triggers, flow ends and no notification record is created in DS-NS-001.
* DS-NS-001 is the only store written in this flow (message 10). All other stores (DS-HL-001, DS-HL-002, DS-AP-001, DS-SM-001) are read-only. This is consistent with System Invariant Rule 1 (NSF is the only notification record writer) and the CRUD Matrix.
* DS-SM-001 is owned by Safety and Moderation. NSF reads it for block suppression (message 8) but does not modify it. Cross-subsystem ownership is preserved.
* DS-HL-001 and DS-HL-002 are owned by Hosting and Lifecycle. NSF reads them for context resolution (messages 4 and 5) but does not modify them.
* The DiscoveryAndParticipationModule is shown as the upstream emitter. Its internal logic (join validation, participation creation, block check on D\&P side) is not shown here; it is covered in Matteo's collaboration diagram.
* Return messages are not numbered. Only forward directional messages carry a number.
* Unresolved: Exact delivery channel (push, in-app, or both) is not fixed. Preserved from sequence diagram.
* Accepted first-skeleton ordinary activity/participation events carry `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, and `participationId` / `outcome` when applicable. `ActivityReminderDue` uses `eventId`, `eventType`, `occurredAt`, `activityId`, `scheduledStartAt`, and `reminderThresholdMinutes`.
* `PendingRequestWithdrawn`, if ever emitted internally, is optional and non-notifying for the first skeleton: no NSF handler and no `DS-NS-001` record.
* Opening notification context is read-only and must not mark a notification as read in the first skeleton.

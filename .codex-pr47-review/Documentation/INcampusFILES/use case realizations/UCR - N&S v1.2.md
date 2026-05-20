# UCR - N\&S v1.2

## Version Log

| Version | Date       | Section modified                                 | Description of change                                                                                                                         | Reason for change                                                                                                      | Source document used as reference                           |
| ------- | ---------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1.1     | 2026-05-04 | Withdraw-event suppressed section; event summary | Reclassified the suppressed withdraw-notification branch as a source-conflict note and removed it from operational event/sequence generation. | Pending request withdrawal has no confirmed host-notification consequence and must not create a misleading NSF branch. | UCR Critical Integration Review; CRUD Matrix v1.5; D\&P UCR |
| 1.2   | 2026-05-08 | Event catalog; reminder MVP; notification-open semantics; withdraw branch removal | Aligned NSF with the first-skeleton internal event payload contracts, confirmed Activity Reminder as MVP, kept opening notifications read-only with no read/unread state, removed pending-request withdrawal from operational NSF catalogue generation, and preserved NSF as sole writer of `DS-NS-001`. | Required before using the UCR as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

Candidate handler names, service names, sequence filenames, and client-facing paths in this UCR are first-skeleton scaffolding unless explicitly accepted elsewhere as final contracts. The internal event payload fields listed in this UCR are first-skeleton internal contracts, not public API contracts.

# Subsystem: Notifications and System Flow

***

## 1. Subsystem Responsibility

The Notifications and System Flow subsystem reacts to upstream business events emitted by other modules (Discovery and Participation, Hosting and Lifecycle, Safety and Moderation) and to time-based system triggers. For each notification-relevant event, it resolves the recipient, retrieves the necessary business context references, checks block-based suppression rules, composes a notification record, persists it in the notification store, and dispatches it through the notification delivery mechanism. It also handles the read-only opening of notifications when a student taps a previously delivered notification, re-checking current access and business context before routing to the appropriate app view. NSF does not create, update, or delete activity, participation, account, profile, block, or report records. It is strictly a downstream event sink and notification consequence writer.

***

## 2. Owned Data Stores

```
Owned stores:
- DS-NS-001 (NotificationStore) — Stores system and cross-user notification records. Contains notification
  type, recipient, delivery channel, title, message, business context references, target context for
  navigation, triggering account, and creation timestamp. Must not duplicate business state from HL, AP,
  or SM stores. No read/unread state, isRead flag, or readAt timestamp is modeled for the first skeleton.
```

***

## 3. External Data Dependencies

```
External dependencies:
- DS-AP-001 (UserAccountStore) — Read to resolve recipient account identity, verification state, and
  platform access status for notification targeting and suppression.
- DS-HL-001 (ActivityStore) — Read to retrieve activity details (title, schedule, status, host,
  campus scope, participation mode) for notification composition and context validation.
- DS-HL-002 (ParticipationStore) — Read to resolve participation/request records, identify joined
  participants for fan-out, and verify still-joined status for reminders.
- DS-SM-001 (BlockListStore) — Read to enforce block-based notification suppression. All cross-user
  notifications must be aborted if a block relationship exists between the triggering user and the
  recipient.
```

***

## 4. Use Case Realizations

***

# DUC-NSF-01 — Notify Host of Join Event

## Source Use Case

```
Notify Host of Join Event
```

## Related Requirements

```
FR: FR-0601, FR-0602, FR-0603
NFR: NFR-14, NFR-15
```

## Implementation Goal

React to a direct join or join request event emitted by D\&P, resolve the activity host as the notification recipient, check block suppression, compose a notification record containing the activity identity and event type (new participant vs. new join request), persist it in DS-NS-001, and dispatch it through the notification delivery mechanism so the host can stay updated and navigate to the relevant activity view.

## Boundary Objects

```
- NotificationDeliveryGateway
```

## Control Objects / Services

```
- JoinEventNotificationHandler
- NotificationCompositionService
- RecipientResolutionService
- BlockSuppressionService
- NotificationDispatchService
```

## Entity Objects / Data Stores

```
- NotificationRecord / DS-NS-001
- Activity / DS-HL-001 (read-only)
- ActivityParticipation / DS-HL-002 (read-only)
- StudentAccount / DS-AP-001 (read-only)
- BlockRelationship / DS-SM-001 (read-only)
```

## Candidate Client-Facing API

```
Client-facing API:
- None. This use case is triggered internally by a domain event.
```

## Main Design Flow

```
1. D&P emits a DirectJoinCompleted or JoinRequestSubmitted event after a successful join or request
   submission.
2. JoinEventNotificationHandler in the NSF module consumes the event.
3. RecipientResolutionService reads DS-HL-001 to identify the activity host (HostAccountID) and
   retrieve activity details (Title, ScheduledDateTime, ParticipationMode).
4. RecipientResolutionService reads DS-AP-001 to verify the host account is active
   (PlatformAccessStatus = Active).
5. BlockSuppressionService reads DS-SM-001 to check whether a block relationship exists between the
   joining student (TriggeringAccountID from the event) and the host.
6. If a block relationship exists, the notification is suppressed. No record is created. The flow ends.
7. NotificationCompositionService composes the notification record:
   - RecipientAccountID = HostAccountID
   - NotificationType = JoinEvent
   - NotificationTitle and NotificationMessage include the activity identity and event type
     (new join request vs. new participant) (FR-0602)
   - RelatedActivityID = ActivityID from the event
   - RelatedParticipationID = ParticipationID from the event
   - TargetContextType = JoinRequestReview (if join request) or ActivityDetails (if direct join)
   - TargetContextID = ActivityID
   - TriggeringAccountID = joining student's AccountID
8. NotificationCompositionService creates the notification record in DS-NS-001.
9. NotificationDispatchService dispatches the notification through NotificationDeliveryGateway
   within a short time (NFR-14).
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- DirectJoinCompleted { eventId, eventType, occurredAt, activityId, triggeringAccountId, participationId }
- JoinRequestSubmitted { eventId, eventType, occurredAt, activityId, triggeringAccountId, participationId }
```

## Constraints and Exceptions

```
- Block suppression is mandatory. If a block exists between the joining student and the host, the
  notification must not be created (System Invariant Rule 2).
- The notification must not duplicate activity or participation truth. It stores references only.
- The notification must be delivered within a short time after the join event (NFR-14).
- The notification must clearly indicate the relevant activity and event type (FR-0602).
- NSF does not modify DS-HL-001, DS-HL-002, DS-AP-001, or DS-SM-001.
```

## Postconditions in Design Terms

```
- DS-NS-001 contains a new notification record for the host (unless suppressed by block).
- No other store is modified by NSF.
- The notification is dispatched through NotificationDeliveryGateway.
```

## Related Diagrams Suggested

```
- notify_join_event_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: Exact notification delivery channel (push, in-app, or both) is not fixed in current FRs.
  NFR-14 implies push behavior. The entity catalog defaults to PushAndInApp.
- Unresolved: Notification retry/failure handling is not specified.
- Assumption for modeling only: The event payload contains the first-skeleton ordinary event fields
  (`eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, and `participationId`
  when applicable) for NSF to resolve all needed references without additional upstream calls.
```

***

# DUC-NSF-02 — Notify Participant of Application Outcome

## Source Use Case

```
Notify Participant of Application Outcome
```

## Related Requirements

```
FR: FR-0701, FR-0702, FR-0703, FR-0704
NFR: NFR-18, NFR-19
```

## Implementation Goal

React to a join request approval or decline event emitted by H\&L after the host's decision in Manage Join Requests. Resolve the applicant as the notification recipient, check block suppression, compose a notification record containing the activity name, application result, and event time, persist it in DS-NS-001, and dispatch it so the participant can view the outcome and access it later in the notification list.

## Boundary Objects

```
- NotificationDeliveryGateway
```

## Control Objects / Services

```
- ApplicationOutcomeNotificationHandler
- NotificationCompositionService
- RecipientResolutionService
- BlockSuppressionService
- NotificationDispatchService
```

## Entity Objects / Data Stores

```
- NotificationRecord / DS-NS-001
- Activity / DS-HL-001 (read-only)
- ActivityParticipation / DS-HL-002 (read-only)
- StudentAccount / DS-AP-001 (read-only)
- BlockRelationship / DS-SM-001 (read-only)
```

## Candidate Client-Facing API

```
Client-facing API:
- None. This use case is triggered internally by a domain event.
```

## Main Design Flow

```
1. H&L emits a JoinRequestApproved or JoinRequestDeclined event after the host approves or declines
   a pending join request in Manage Join Requests.
2. ApplicationOutcomeNotificationHandler in the NSF module consumes the event.
3. RecipientResolutionService reads DS-HL-002 to identify the applicant (StudentAccountID from the
   participation/request record).
4. RecipientResolutionService reads DS-HL-001 to retrieve activity details (Title, ScheduledDateTime).
5. RecipientResolutionService reads DS-AP-001 to verify the applicant account is active.
6. BlockSuppressionService reads DS-SM-001 to check whether a block relationship exists between the
   host (TriggeringAccountID) and the applicant.
7. If a block relationship exists, the notification is suppressed. No record is created. The flow ends.
8. NotificationCompositionService composes the notification record:
   - RecipientAccountID = applicant's StudentAccountID
   - NotificationType = ApplicationOutcome
   - NotificationTitle and NotificationMessage include the activity name, application result
     (approved/declined), and event time (FR-0703)
   - RelatedActivityID = ActivityID
   - RelatedParticipationID = ParticipationID
   - TargetContextType = ActivityDetails (for approved) or PersonalActivityContext (for declined)
   - TriggeringAccountID = host's AccountID
9. NotificationCompositionService creates the notification record in DS-NS-001.
10. NotificationDispatchService dispatches the notification through NotificationDeliveryGateway
    within a short time (NFR-18).
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- JoinRequestApproved { eventId, eventType, occurredAt, activityId, triggeringAccountId, participationId, outcome }
- JoinRequestDeclined { eventId, eventType, occurredAt, activityId, triggeringAccountId, participationId, outcome }
```

## Constraints and Exceptions

```
- Block suppression is mandatory between host and applicant.
- The notification must include at least: activity name, application result, event time (FR-0703).
- The notification must be stored so the participant can view it later in the notification list (FR-0704).
- The notification must be delivered within a short time after the status change (NFR-18).
- NSF does not modify participation state. The approval/decline update is performed by H&L before
  emitting the event.
```

## Postconditions in Design Terms

```
- DS-NS-001 contains a new notification record for the applicant (unless suppressed by block).
- No other store is modified by NSF.
- The notification is dispatched and available for later historical access in the notification list.
```

## Related Diagrams Suggested

```
- notify_application_outcome_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: The exact behavior when the participant taps this notification is not specified in
  current FRs (noted in the use case narrative). TargetContextType is modeled as ActivityDetails
  for approved and PersonalActivityContext for declined, but this mapping is an assumption.
- Unresolved: Whether a declined notification should still navigate to the activity or to a
  personal context is not explicitly defined.
```

***

# DUC-NSF-03 — Notify Participant of Activity Cancellation

## Source Use Case

```
Notify Participant of Activity Cancellation
```

## Related Requirements

```
FR: FR-0503, FR-2801, FR-2802, FR-2803, FR-2804
NFR: NFR-44, NFR-19
```

## Implementation Goal

React to an activity cancellation event emitted by H\&L. Identify all students currently joined in the cancelled activity, check block suppression for each, compose individual notification records containing the activity name, scheduled time, and cancellation information, persist them in DS-NS-001, and dispatch them so each joined participant is informed promptly.

## Boundary Objects

```
- NotificationDeliveryGateway
```

## Control Objects / Services

```
- CancellationNotificationHandler
- NotificationCompositionService
- RecipientResolutionService
- BlockSuppressionService
- NotificationDispatchService
- ParticipantFanOutService
```

## Entity Objects / Data Stores

```
- NotificationRecord / DS-NS-001
- Activity / DS-HL-001 (read-only)
- ActivityParticipation / DS-HL-002 (read-only)
- StudentAccount / DS-AP-001 (read-only)
- BlockRelationship / DS-SM-001 (read-only)
```

## Candidate Client-Facing API

```
Client-facing API:
- None. This use case is triggered internally by a domain event.
```

## Main Design Flow

```
1. H&L emits an ActivityCancelled event after the host updates the activity status to cancelled
   in Update Activity Status.
2. CancellationNotificationHandler in the NSF module consumes the event.
3. RecipientResolutionService reads DS-HL-001 to retrieve activity details (Title, ScheduledDateTime,
   HostAccountID) and confirm the status is cancelled.
4. ParticipantFanOutService reads DS-HL-002 to identify all students currently joined in the activity
   (RecordType = participation, Status = confirmed).
5. If no joined participants exist, the flow ends. No notifications are created.
6. For each joined participant:
   a. RecipientResolutionService reads DS-AP-001 to verify the participant account is active.
   b. BlockSuppressionService reads DS-SM-001 to check whether a block relationship exists between
      the host and the participant.
   c. If a block relationship exists, the notification for this participant is suppressed. Continue
      to the next participant.
   d. NotificationCompositionService composes the notification record:
      - RecipientAccountID = participant's StudentAccountID
      - NotificationType = ActivityCancellation
      - NotificationTitle and NotificationMessage include the activity name, scheduled time, and
        cancellation information (FR-2803)
      - RelatedActivityID = ActivityID
      - TargetContextType = CancelledActivityContext
      - TargetContextID = ActivityID
      - TriggeringAccountID = host's AccountID
   e. NotificationCompositionService creates the notification record in DS-NS-001.
   f. NotificationDispatchService dispatches the notification through NotificationDeliveryGateway.
7. All valid notifications are dispatched within a short time after the cancellation event (NFR-44).
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- ActivityCancelled { eventId, eventType, occurredAt, activityId, triggeringAccountId, outcome }
```

## Constraints and Exceptions

```
- Fan-out: one notification per joined participant. This is the only NSF use case with fan-out.
- Block suppression is per-recipient: checked individually for each participant against the host.
- The notification must include at least: activity name, scheduled time, cancellation info (FR-2803).
- Tapping the notification must open the activity with its cancelled status (FR-2804).
- The notification must be delivered within a short time after cancellation (NFR-44).
- NSF does not modify activity status or participation records.
```

## Postconditions in Design Terms

```
- DS-NS-001 contains one notification record per valid joined participant (minus block-suppressed ones).
- No other store is modified by NSF.
- All dispatched notifications reference the cancelled activity for navigation.
```

## Related Diagrams Suggested

```
- notify_cancellation_fanout_sequence.puml
```

## Open Points / Assumptions

```
- Assumption for modeling only: The fan-out iterates over joined participants sequentially. Whether
  batch creation or parallel dispatch is used is an implementation optimization, not a logical design
  decision.
- Unresolved: Whether participants who left before cancellation but whose leave was not yet fully
  processed should receive a cancellation notification is not specified.
```

***

# DUC-NSF-04 — Notify Host of Leave Event

## Source Use Case

```
Notify Host of Leave Event
```

## Related Requirements

```
FR: FR-2702, FR-2703, FR-2704
NFR: NFR-43
```

## Implementation Goal

React to a joined participant leave event emitted by D\&P. Resolve the activity host as the notification recipient, check block suppression, compose a notification record indicating that a participant has left the activity before its start, persist it in DS-NS-001, and dispatch it so the host is informed that a slot has been freed.

## Boundary Objects

```
- NotificationDeliveryGateway
```

## Control Objects / Services

```
- LeaveEventNotificationHandler
- NotificationCompositionService
- RecipientResolutionService
- BlockSuppressionService
- NotificationDispatchService
```

## Entity Objects / Data Stores

```
- NotificationRecord / DS-NS-001
- Activity / DS-HL-001 (read-only)
- ActivityParticipation / DS-HL-002 (read-only)
- StudentAccount / DS-AP-001 (read-only)
- BlockRelationship / DS-SM-001 (read-only)
```

## Candidate Client-Facing API

```
Client-facing API:
- None. This use case is triggered internally by a domain event.
```

## Main Design Flow

```
1. D&P emits a JoinedParticipantLeft event after a joined participant successfully leaves the activity
   before its start.
2. LeaveEventNotificationHandler in the NSF module consumes the event.
3. RecipientResolutionService reads DS-HL-001 to identify the activity host (HostAccountID) and
   retrieve activity details (Title, ScheduledDateTime).
4. RecipientResolutionService reads DS-AP-001 to verify the host account is active.
5. BlockSuppressionService reads DS-SM-001 to check whether a block relationship exists between the
   leaving student and the host.
6. If a block relationship exists, the notification is suppressed. No record is created. The flow ends.
7. NotificationCompositionService composes the notification record:
   - RecipientAccountID = HostAccountID
   - NotificationType = LeaveEvent
   - NotificationTitle and NotificationMessage indicate that a participant has left the activity
   - RelatedActivityID = ActivityID
   - TargetContextType = ActivityDetails
   - TargetContextID = ActivityID
   - TriggeringAccountID = leaving student's AccountID
8. NotificationCompositionService creates the notification record in DS-NS-001.
9. NotificationDispatchService dispatches the notification through NotificationDeliveryGateway.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- JoinedParticipantLeft { eventId, eventType, occurredAt, activityId, triggeringAccountId, participationId }
```

## Constraints and Exceptions

```
- This notification is confirmed by System Invariant Rule 4: "If a user leaves an activity after being
  approved (and before the activity starts), the system must generate a notification for the host."
- Block suppression is mandatory between the leaving student and the host.
- NSF does not modify participation or activity records. D&P handles the leave and count update before
  emitting the event.
- The leave event applies only to joined participants (RecordType = participation, Status = confirmed),
  not to pending requesters.
```

## Postconditions in Design Terms

```
- DS-NS-001 contains a new notification record for the host (unless suppressed by block).
- No other store is modified by NSF.
- The notification is dispatched through NotificationDeliveryGateway.
```

## Related Diagrams Suggested

```
- notify_leave_event_sequence.puml
```

## Open Points / Assumptions

```
- Unresolved: Exact notification message content for leave events is not specified in current FRs.
  The Leave Joined Activity narrative (FR-2702/2703/2704) does not define notification content rules.
  Modeled conservatively as "a participant has left [activity name]".
- Assumption for modeling only: The event payload follows the first-skeleton ordinary event contract
  and lets NSF resolve host and activity references through the documented reads.
```

***

# DUC-NSF-05 — Notify Activity Reminder

## Source Use Case

```
Receive Activity Reminder
```

## Related Requirements

```
FR: FR-1101
NFR: NFR-24
```

## Implementation Goal

React to a time-based system trigger when the configured reminder time is reached for a scheduled activity. Verify that the activity status is still reminder-eligible (`open` or `full`, not `completed` or `cancelled`) and that the participant is still joined, compose individual reminder notification records, persist them in DS-NS-001, and dispatch them so each still-joined participant is reminded shortly before the activity starts. This is a system-triggered MVP flow with no upstream event from another module.

**MVP scope note:** Activity Reminder is confirmed for the first skeleton. Older PostMVP classification does not apply to this correction pass.

## Boundary Objects

```
- NotificationDeliveryGateway
```

## Control Objects / Services

```
- ActivityReminderScheduler
- ReminderNotificationHandler
- NotificationCompositionService
- ParticipantFanOutService
- NotificationDispatchService
```

## Entity Objects / Data Stores

```
- NotificationRecord / DS-NS-001
- Activity / DS-HL-001 (read-only)
- ActivityParticipation / DS-HL-002 (read-only)
- StudentAccount / DS-AP-001 (read-only)
```

## Candidate Client-Facing API

```
Client-facing API:
- None. This use case is triggered internally by a time-based system trigger.
```

## Main Design Flow

```
1. ActivityReminderScheduler monitors upcoming scheduled activities and detects that the configured
   reminder time has been reached (FR-1101: 5 minutes before start).
2. ReminderNotificationHandler reads DS-HL-001 to retrieve the activity details (Title,
   ScheduledDateTime, Status).
3. If the activity status is completed or cancelled, the reminder is suppressed. For cancellation,
   the cancellation notification flow supersedes. The flow ends.
4. ParticipantFanOutService reads DS-HL-002 to identify all students currently joined in the
   activity (RecordType = participation, Status = confirmed).
5. If no joined participants exist, the flow ends.
6. For each still-joined participant:
   a. ReminderNotificationHandler reads DS-AP-001 to verify the participant account is active.
   b. NotificationCompositionService composes the notification record:
      - RecipientAccountID = participant's StudentAccountID
      - NotificationType = ActivityReminder
      - NotificationTitle and NotificationMessage identify the upcoming activity
      - RelatedActivityID = ActivityID
      - TargetContextType = ActivityDetails
      - TargetContextID = ActivityID
      - TriggeringAccountID = null (system-triggered, no triggering student)
   c. NotificationCompositionService creates the notification record in DS-NS-001.
   d. NotificationDispatchService dispatches the notification through NotificationDeliveryGateway.
7. All valid reminder notifications are dispatched at the configured reminder time.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- ActivityReminderDue { eventId, eventType, occurredAt, activityId, scheduledStartAt, reminderThresholdMinutes } (internal time-based trigger, not an upstream module event)
```

## Constraints and Exceptions

```
- The reminder must trigger reliably at the configured time (NFR-24).
- Block suppression does NOT apply to reminders. Reminders are system-triggered, not cross-user.
  There is no TriggeringAccountID to check against. The CRUD Matrix confirms: Notify: Activity
  Reminder does not read DS-SM-001.
- If the activity is completed or cancelled before the reminder time, the reminder is suppressed. For
  cancellation, the cancellation flow applies instead.
- If a participant has left before the reminder time, they are no longer in the joined set and will
  not receive the reminder.
- NSF does not modify activity or participation records.
```

## Postconditions in Design Terms

```
- DS-NS-001 contains one reminder notification record per still-joined participant.
- No other store is modified by NSF.
- All dispatched reminders reference the upcoming activity for navigation.
```

## Related Diagrams Suggested

```
- notify_activity_reminder_sequence.puml
```

## Open Points / Assumptions

```
- MVP confirmed: Activity Reminder is part of the first skeleton.
- Unresolved: Exact reminder timing beyond the sourced 5-minute rule (FR-1101) is not further
  specified. Whether the timing is configurable per campus or per activity is not defined.
- Unresolved: The ActivityReminderScheduler implementation mechanism (polling, scheduled job, timer
  queue) is an implementation concern not fixed at the logical design level.
- Assumption for modeling only: The reminder is modeled as a fan-out similar to cancellation,
  iterating over joined participants. Whether batch creation is used is an implementation choice.
```

***

# DUC-NSF-06 — Open Notification Context

## Source Use Case

```
Open Notification (CRUD Matrix row)
```

## Related Requirements

```
FR: FR-0603, FR-0704, FR-2804
NFR: NFR-15, NFR-19
```

## Implementation Goal

Allow a student to tap a previously delivered notification and navigate to the relevant app context. The system reads the notification record from DS-NS-001, retrieves the current business context from upstream stores, re-checks block and access constraints, and routes to the appropriate view. If the referenced target no longer exists or is inaccessible, the system routes to a fallback view. This operation is strictly read-only and must not update notification, activity, or participation state.

## Boundary Objects

```
- NotificationListScreen
- ActivityDetailsScreen (navigation target)
- JoinRequestReviewScreen (navigation target)
- CancelledActivityContextScreen (navigation target)
- NotificationFallbackView (navigation target)
```

## Control Objects / Services

```
- OpenNotificationController
- NotificationContextResolutionService
- BlockEnforcementService
- AccessValidationService
```

## Entity Objects / Data Stores

```
- NotificationRecord / DS-NS-001 (read-only)
- Activity / DS-HL-001 (read-only)
- ActivityParticipation / DS-HL-002 (read-only)
- BlockRelationship / DS-SM-001 (read-only)
```

## Candidate Client-Facing API

| Method + Path                                 | Purpose                                                                | Input                                                  | Output                                                                        | Reads                                      | Writes | Events / Notes                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| `GET /notifications/{notificationId}/context` | Retrieve current context and routing target for a tapped notification. | `notificationId` (path), authenticated student context | Routing target (contextType, contextId, accessible flag) or fallback response | DS-NS-001, DS-HL-001, DS-HL-002, DS-SM-001 | —      | Read-only. Does not update notification state. Returns fallback if target no longer exists. |

Possible error outputs:

```
NotificationNotFound
NotificationNotOwnedByStudent
TargetActivityUnavailable
TargetActivityInaccessible
BlockRelationshipExists
```

## Main Design Flow

```
1. The student taps a notification from NotificationListScreen or a push notification entry point.
2. OpenNotificationController reads DS-NS-001 to retrieve the notification record by NotificationID.
3. The controller verifies that the RecipientAccountID matches the authenticated student.
4. NotificationContextResolutionService reads the TargetContextType and TargetContextID from the
   notification record.
5. NotificationContextResolutionService reads DS-HL-001 to retrieve the current state of the
   referenced activity (if applicable).
6. If the referenced activity has been deleted or no longer exists, the system routes to
   NotificationFallbackView with an unavailable message. The flow ends.
7. If the activity exists, NotificationContextResolutionService reads DS-HL-002 to retrieve the
   current participation state for the student and the referenced activity.
8. BlockEnforcementService reads DS-SM-001 to check whether a block relationship exists between
   the student and the activity host (or the triggering account referenced in the notification).
9. If a block relationship exists, the system routes to NotificationFallbackView. The flow ends.
10. AccessValidationService determines the appropriate navigation target based on TargetContextType:
    - JoinRequestReview → route to JoinRequestReviewScreen (host only)
    - ActivityDetails → route to ActivityDetailsScreen
    - CancelledActivityContext → route to the activity with cancelled status displayed
    - PersonalActivityContext → route to the personal activity area
11. The system returns the routing target to the client for navigation.
```

## Events Emitted

```
Events emitted:
- None.
```

## Events Consumed

```
Events consumed:
- None.
```

## Constraints and Exceptions

```
- Opening a notification is strictly read-only (System Invariant: Notification Open Semantics).
  It must not update notification state, activity state, or participation state.
- The system must re-check current business context and block/access state before routing.
  A notification delivered before a block was created must respect the current block state on open.
- If the referenced activity has been deleted, the system must route to a fallback view instead of
  reconstructing missing business state.
- The student can only open notifications where RecipientAccountID matches their own account.
```

## Postconditions in Design Terms

```
- No store is modified. The operation is entirely read-only.
- The student is routed to the appropriate view or a fallback view based on current context validity.
```

## Related Diagrams Suggested

```
- open_notification_context_sequence.puml
```

## Open Points / Assumptions

```
- Final first-skeleton decision: Opening a notification does not mark it as read/seen and must not
  update DS-NS-001. No read/unread state is modeled on NotificationRecord for the first skeleton.
- Unresolved: Exact fallback view content when the target activity no longer exists is not defined.
- Assumption for modeling only: The GET endpoint returns routing metadata (contextType, contextId,
  accessible flag) rather than the full target content. The client performs the actual navigation
  to the target screen.
```

***

# Pending Request Withdrawal Notification Source-Conflict Note

This is not an NSF use case and must not be included in the client-facing API catalogue, internal event catalogue, event handler list, or sequence diagram backlog.

Pending request withdrawal creates no user-facing notification, no NSF handler, and no `DS-NS-001 Notification Record`. The joined-then-leave case remains covered by DUC-NSF-04, which consumes `JoinedParticipantLeft`.

If an implementation later mentions `PendingRequestWithdrawn`, it must be marked as an optional internal non-notifying event with no NSF handler and no `DS-NS-001` record.

***

## 5. Candidate Client-Facing APIs / Interfaces Summary

### Client-Facing APIs

| Method + Path                                 | DUC        | Purpose                                                                           |
| --------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `GET /notifications/{notificationId}/context` | DUC-NSF-06 | Retrieve current context and routing target for a tapped notification. Read-only. |

Operational NSF notification-creation use cases (DUC-NSF-01 through DUC-NSF-05) are triggered internally by domain events or time-based system triggers and have no client-facing API. DUC-NSF-06 is the read-only notification-open context flow. Pending request withdrawal is retained only as a source-conflict note and is not for catalogue generation.

### Internal Event Handlers

```
- JoinEventNotificationHandler — consumes DirectJoinCompleted, JoinRequestSubmitted (DUC-NSF-01)
- ApplicationOutcomeNotificationHandler — consumes JoinRequestApproved, JoinRequestDeclined (DUC-NSF-02)
- CancellationNotificationHandler — consumes ActivityCancelled (DUC-NSF-03)
- LeaveEventNotificationHandler — consumes JoinedParticipantLeft (DUC-NSF-04)
- ReminderNotificationHandler — consumes ActivityReminderDue (DUC-NSF-05)
```

### External Gateways

```
- NotificationDeliveryGateway — dispatches notifications to the student's device via push and/or
  in-app delivery. Delivery mechanism details are implementation-level and not fixed.
```

### Shared Internal Services

```
- NotificationCompositionService — composes notification records from event context and upstream data.
- RecipientResolutionService — resolves the notification recipient from upstream store reads.
- BlockSuppressionService — reads DS-SM-001 to enforce block-based notification suppression.
- NotificationDispatchService — dispatches composed notifications through NotificationDeliveryGateway.
- ParticipantFanOutService — used by DUC-NSF-03 and DUC-NSF-05 to iterate over joined participants.
- NotificationContextResolutionService — used by DUC-NSF-06 to resolve navigation targets.
```

***

## 6. Events Summary

Events emitted by Notifications and System Flow:

* None.

Events consumed by Notifications and System Flow:

| Event | NSF handler/use case | Minimum payload fields |
| --- | --- | --- |
| `DirectJoinCompleted` | DUC-NSF-01 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId` |
| `JoinRequestSubmitted` | DUC-NSF-01 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId` |
| `JoinRequestApproved` | DUC-NSF-02 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId`, `outcome` |
| `JoinRequestDeclined` | DUC-NSF-02 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId`, `outcome` |
| `ActivityCancelled` | DUC-NSF-03 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `outcome` |
| `JoinedParticipantLeft` | DUC-NSF-04 | `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, `participationId` |
| `ActivityReminderDue` | DUC-NSF-05 | `eventId`, `eventType`, `occurredAt`, `activityId`, `scheduledStartAt`, `reminderThresholdMinutes` |

`PendingRequestWithdrawn` is not consumed by NSF and is not notification-producing.

NSF is a pure event consumer and notification consequence writer. It does not emit events to other subsystems. All upstream business truth remains in the emitting modules (D\&P, H\&L). NSF reads upstream stores to compose notifications but never modifies them.

***

## 7. Suggested Sequence Diagrams

```
1. notify_join_event_sequence.puml — DirectJoinCompleted / JoinRequestSubmitted consumption, host
   resolution, block suppression check, notification composition and dispatch.
2. notify_application_outcome_sequence.puml — JoinRequestApproved / JoinRequestDeclined consumption,
   applicant resolution, block check, notification composition and dispatch.
3. notify_cancellation_fanout_sequence.puml — ActivityCancelled consumption, joined participant
   fan-out, per-recipient block check, notification composition and dispatch for each.
4. notify_leave_event_sequence.puml — JoinedParticipantLeft consumption, host resolution, block
   check, notification composition and dispatch.
5. notify_activity_reminder_sequence.puml — Time-triggered reminder, activity/participation
   validity check, participant fan-out, notification composition and dispatch.
6. open_notification_context_sequence.puml — Student taps notification, notification record read,
   business context re-check, block/access validation, routing to target or fallback view.
```

***

## 8. Open Points / Assumptions

### Open Points

| #  | Topic                                          | Status         | Details                                                                                                                                                                         |
| -- | ---------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Notification delivery channel                  | Unresolved     | Exact mechanism (push, in-app, or both) is not fixed. Entity catalog defaults to PushAndInApp. NFR-14 and NFR-44 imply push.                                                    |
| 2  | Notification retry/failure handling            | Unresolved     | No FR or NFR specifies retry behavior when notification delivery fails.                                                                                                         |
| 3  | Notification list UX                           | Unresolved     | FR-0704 mentions a "personal message center or notification list" for historical access. Exact UX for this list is not defined.                                                 |
| 4  | Notification read/unread state                 | Finalized for first skeleton | No read/unread state is modeled on `NotificationRecord`; opening a notification is read-only and must not update `DS-NS-001`.                                                    |
| 5  | Reminder timing configuration                  | Unresolved     | FR-1101 specifies 5 minutes before start. Whether this is configurable per campus or activity is not defined.                                                                   |
| 6  | Reminder scope                                 | MVP confirmed  | Activity Reminder is part of the first skeleton.                                                                                                                               |
| 7  | Pending request withdrawal notification         | Finalized for first skeleton | Pending request withdrawal creates no notification, no NSF handler, and no `DS-NS-001` record.                                                                                 |
| 8  | Notification tap behavior for declined outcome | Unresolved     | Where the app navigates when a participant taps a "declined" application outcome notification is not defined.                                                                   |
| 9  | Fallback view content                          | Unresolved     | Exact content shown when a notification references a deleted or inaccessible activity is not defined.                                                                           |
| 10 | Event payload contract                         | Finalized for first skeleton | Internal event payload fields are listed in the Events Summary. They are internal contracts, not public API contracts.                                                         |

### Assumptions for Modeling Only

| # | Assumption                                                                                                                                                              |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Each ordinary event payload contains `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, and `participationId` / `outcome` when applicable; `ActivityReminderDue` uses the reminder-specific payload fields listed above. |
| 2 | Block suppression checks are synchronous reads within the notification handler, not asynchronous service calls.                                                         |
| 3 | Fan-out for cancellation and reminder notifications iterates sequentially over joined participants. Batch or parallel processing is an implementation optimization.     |
| 4 | The ActivityReminderDue trigger is modeled as an internal time-based event. The scheduling mechanism (polling, timer queue) is not fixed.                               |
| 5 | The GET /notifications/{notificationId}/context endpoint returns routing metadata, not full target content. The client performs the actual screen navigation.           |
| 6 | The suppressed withdraw branch is retained only as a source-conflict note and is not included in catalogue or sequence generation.                                      |

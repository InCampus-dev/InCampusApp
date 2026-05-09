# 01 Design Scope and Architectural Choice v1.1

## Version Log

| Version | Date | Change | Notes | Source |
| --- | --- | --- | --- | --- |
| 1.1 | 2026-05-08 | Final pre-skeleton alignment | Aligned architecture choice, ten-store ownership, consent-based Admin Insights, admin authorization context, event contracts, atomic write guidance, notification boundaries, and lifecycle vocabulary with final accepted decisions. | Final documentation review + team decisions 2026-05-08 |

## 1. Architectural Choice

For the first code architecture skeleton, the InCampus MVP adopts a **Multi-Tenant Modular Monolith with Event-Driven Internal Flows**.

This is an accepted first-skeleton architecture decision. It should not be described as a requirement that was already confirmed by the older wiki baseline. The older wiki remains useful for structure, while the final pre-skeleton decisions in this document define the architecture to be used for the initial skeleton.

This means that InCampus is designed as one central platform serving multiple campuses. Each campus is treated as a separate tenant inside the same application: campus-specific configuration, structured options, students, activities, reports, and administrative operations are scoped through the campus identity. New campuses can be added progressively through configuration rather than by deploying a separate version of the app for each campus.

In this model, `CampusID` acts as the main tenant boundary. Student accounts, activities, structured options, reports, and administrative operations must always be filtered or validated against the relevant campus scope.

Campus Admin identity is represented in the first skeleton as a runtime/admin-auth context, not as a canonical database store:

```text
AuthenticatedAdminContext
- adminId
- email
- role
- authorizedCampusIds
- selectedCampusId
```

This context may come from the admin-only portal/auth layer. The exact admin authentication implementation remains provisional. Each Campus Admin is authorized to operate only on one or more assigned campuses, and every administrative action must be checked against that authorization scope.

The system is deployed as a single backend application to reduce development, testing, and operational complexity during the MVP stage. Internally, however, the backend is divided into cohesive modules aligned with the existing analysis subgroups:

* Access and Profile
* Campus Administration
* Hosting and Lifecycle
* Discovery and Participation
* Safety and Moderation
* Notifications and System Flow

This architecture avoids the excessive complexity of full microservices while still preventing the system from becoming an unstructured monolith. Each module has a specific responsibility, uses explicit interfaces, and respects data ownership boundaries.

The shared persistence layer does not erase logical store ownership. The first skeleton must keep the ten canonical stores and their owning process areas:

* `DS-CA-001` Campus Configuration
* `DS-CA-002` Campus Structured Options
* `DS-AP-001` Student Account
* `DS-AP-002` Student Profile
* `DS-AP-003` University Identity Rules
* `DS-HL-001` Activities
* `DS-HL-002` Activity Participations
* `DS-SM-001` Block Relationships
* `DS-SM-002` Report Records
* `DS-NS-001` Notification Records

No canonical Campus Admin store is added. Do not introduce `DS-CA-003`, an Admin Account Store, or a separate Campus Admin database for the first skeleton.

Event-driven internal flows are used only where the system must react to business events that have already happened, especially notification-related behavior such as join events, application outcomes, participant leave events, activity cancellation, and activity reminders. The Internal Event Dispatcher is an implementation abstraction inside the modular monolith.

```
Central InCampus Platform
│
├── Student Mobile App
├── Campus Admin Interface
│
├── Backend Application
│   ├── Access and Profile Module
│   ├── Campus Administration Module
│   ├── Hosting and Lifecycle Module
│   ├── Discovery and Participation Module
│   ├── Safety and Moderation Module
│   └── Notifications and System Flow Module
│
├── Shared Database Layer
│   ├── Campus-scoped records
│   ├── Student accounts
│   ├── Activities
│   ├── Participations
│   ├── Reports
│   └── Notifications
│
└── Notification Delivery Mechanism
```

## 2. MVP Capability Placement

Admin Insights are part of the first MVP skeleton. The feature is realized through the Campus Administration/admin portal process with read-only, consent-gated access to existing stores. It does not create a new database.

The required consent is stored on `DS-AP-001 Student Account` as `CampusInsightSharingConsent`. Consent may be collected during registration/onboarding and later changed through account/profile settings. Refusing or revoking consent does not block normal app usage.

When a Campus Admin requests insight data, the process must:

* verify `AuthenticatedAdminContext` and selected campus scope;
* check `CampusInsightSharingConsent` in `DS-AP-001`;
* conditionally read allowed insight data from `DS-AP-002 Student Profile`, `DS-HL-001 Activities`, and `DS-HL-002 Activity Participations`;
* deny identifiable insight access when consent is false or revoked;
* avoid unrestricted profile, interest, activity, or participation-history exposure.

Moderation/report-review access remains separate from insight access.

## 3. Lifecycle and Notification Boundaries

The persisted activity status model is:

```text
Activity.Status = open | full | completed | cancelled
```

`deleted` is not a persisted `Activity.Status`. Deletion is a hard-delete behavior/workflow outcome. Cancellation and deletion are different: cancellation sets `Activity.Status = cancelled` and preserves the activity record for relevant history contexts, while deletion physically removes the activity from discovery and history because the record no longer exists.

The persisted participation model is:

```text
Participation.RecordType = request | participation
Participation.Status = pending | confirmed | declined
```

Withdrawal and leave are workflow actions, not canonical persisted participation statuses. A pending request withdrawal creates no user-facing notification and no `DS-NS-001 Notification Record`. A confirmed participant leaving an activity may still produce the host notification defined by the Notifications and System Flow documentation.

`DS-NS-001` is owned and written only by Notifications and System Flow. Opening a notification is read-only for the first skeleton. No read/unread state, `isRead`, or `readAt` field is modeled on `NotificationRecord`.

## 4. First-Skeleton Internal Event Catalog

The following are internal first-skeleton event contracts, not public API contracts:

| Event | Origin | Notes |
| --- | --- | --- |
| `DirectJoinCompleted` | Discovery and Participation | Emitted after a successful direct join. |
| `JoinRequestSubmitted` | Discovery and Participation | Emitted after a pending join request is created. |
| `JoinRequestApproved` | Hosting and Lifecycle | Emitted after a host approves a join request. |
| `JoinRequestDeclined` | Hosting and Lifecycle | Emitted after a host declines a join request. |
| `JoinedParticipantLeft` | Discovery and Participation | Emitted after a confirmed participant leaves. |
| `ActivityCancelled` | Hosting and Lifecycle | Emitted after an activity is set to `cancelled`. |
| `ActivityReminderDue` | System/time trigger, consumed by Notifications and System Flow | Emitted when an MVP activity reminder is due. |

Minimum payload fields for ordinary activity/participation events:

```text
eventId
eventType
occurredAt
activityId
triggeringAccountId
participationId, when applicable
outcome, when applicable
```

Minimum payload fields for `ActivityReminderDue`:

```text
eventId
eventType
occurredAt
activityId
scheduledStartAt
reminderThresholdMinutes
```

`PendingRequestWithdrawn` is not an active notification-producing event. If mentioned in implementation notes, it must be marked as an optional internal non-notifying event with no NSF handler and no `DS-NS-001` record.

Candidate APIs, services, commands, and additional events remain scaffolding unless explicitly accepted as first-skeleton contracts.

## 5. Transaction and Concurrency Note

Join, request, approve, withdraw, leave, cancellation, and deletion operations that affect capacity, participation records, or counters must be atomic. Capacity and existing participation/request state must be re-checked inside the write transaction.

A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`. If concurrent operations conflict, only one succeeds and the other receives a safe rejection. Counters must be derived or updated transactionally and must not rely on stale client-side values.

This note supports NFR-13 without committing the first skeleton to a specific locking technology or database implementation.

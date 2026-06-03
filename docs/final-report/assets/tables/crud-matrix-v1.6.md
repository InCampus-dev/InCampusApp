# CRUD matrix v1.6

# Architectural Specification & CRUD Matrix: InCampus

Version Log

| Version      | Date       | Author  | Changes                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `1.0`        | 2026-04-20 | Team    | Initial draft of the CRUD matrix based on process and data store analysis.                                                                                                                                                                                                                                                                                                                                         |
| `1.1`        | 2026-04-22 | Gemini  | **Architectural Alignment & Admin Override:** Corrected the `Review Report` process to respect data ownership. Explicitly modeled Admin override actions (ban/delete) as triggers to AP and HL native processes, removing direct `U*`/`D*` on AP/HL stores.                                                                                                                                                        |
| `1.2`        | 2026-04-22 | ChatGPT | **closure for notification context opening**: finalized the last previously ambiguous row by confirming that `Open Notification Context` is a read-only process over the referenced business context. Fixed the row to `R` on `DS-HL-001`, `DS-HL-002`, `DS-SM-001`, and `DS-NS-001`; removed branch ambiguity (`R*`) and documented that opening a notification does not implicitly update notification state. \| |
| `1.3`&#xA;   | 2026-04-22 | Gemini  | Removed direct `U*` on `HL-002` from `Block User` process (SM triggers HL instead). Updated `Withdraw Join Request` logic and Rule 4 to reflect team decision on host notifications, adding corresponding `Notify` row.                                                                                                                                                                                            |
| `1.4`        | 2026-04-24 | Fra     | **MVP Activity Reminder Alignment:** Added `Notify: Activity Reminder` as an active Notifications row. The reminder reads upstream activity schedule/lifecycle state and still-joined participation state, creates only the notification consequence in `DS-NS-001`, and is suppressed if the participant is no longer joined or if the activity has been cancelled and superseded by cancellation flow.           |
| `1.5`        | 2026-05-01 | Fra     | Consent-based admin insight access: Added `Update Campus Insight Consent` and a conditional read-only `View Consent-Based Student Insights` process.  The current admin model only supports configuration and moderation access; student insight access requires explicit consent checks and conditional reads over AP/H\&L stores.                                                                                |
| `1.6`        | 2026-05-08 | Fra     | **Final pre-skeleton alignment:** Removed pending-withdraw notification creation, aligned Activity/Participation state vocabulary, clarified admin insight/auth context boundaries, added atomic concurrency and cancellation/deletion notes, and routed moderation/block consequences through native owner workflows.                                                                  |

***

## 1. System Context & Data Store Definitions

*To assist code generation and architectural understanding, the opaque Data Store IDs (**`DS-**-***`**) are mapped to their logical domain entities below.*

### Campus Administration (CA)

* **`DS-CA-001`****&#x20;(CampusStore):** Stores core campus configurations and basic details.
* **`DS-CA-002`****&#x20;(CampusOptionsStore):** Stores structured options for a campus (e.g., categories, locations).

### Access and Profile (AP)

* **`DS-AP-001`****&#x20;(UserAccountStore):** Stores user authentication, account verification state, and platform access status (suspended/banned).
* **`DS-AP-002`****&#x20;(StudentProfileStore):** Stores the student's `Student Profile`; only minimal public profile data is exposed in allowed contexts.
* **`DS-AP-003`****&#x20;(DomainRulesStore):** Stores university-domain verification rules.

### Hosting and Lifecycle (HL)

* **`DS-HL-001`****&#x20;(ActivityStore):** Stores the core activity details, status, and lifecycle constraints.
* **`DS-HL-002`****&#x20;(ParticipationStore):** Stores join requests, participant statuses, and headcount tracking.

### Safety and Moderation (SM)

* **`DS-SM-001`****&#x20;(BlockListStore):** Stores user-to-user block relationships.
* **`DS-SM-002`****&#x20;(ReportStore):** Stores user-submitted moderation reports and admin review outcomes.

### Notifications and System Flow (NS)

* **`DS-NS-001`****&#x20;(NotificationStore):** Stores system and cross-user notification records. *Constraint: NSF is the only writer; the store does not duplicate business state from HL or AP and has no read/unread state in the first skeleton.*

***

## 2. Operation Legend

* **`C`** = Create (Creates a new persistent record)
* **`R`** = Read (Reads state/data for logic, presentation, or validation)
* **`U`** = Update (Modifies an existing persistent record)
* **`D`** = Delete (Physical hard-delete/removal of a record)
* **`*`** = Conditional/Branch-specific operation based on business rules.

***

## 3. CRUD Matrix

| Process                                 | Domain Subgroup       | Process Description & Logic                                                                                                                                                                                           | `CA-001` | `CA-002` | `AP-001` | `AP-002`            | `AP-003` | `HL-001`            | `HL-002`            | `SM-001` | `SM-002` | `NS-001` |
| --------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | -------- | ------------------- | -------- | ------------------- | ------------------- | -------- | -------- | -------- |
| **Configure New Campus**                | Campus Admin          | Creates the campus and its initial structured options.                                                                                                                                                                | C        | C        |          |                     |          |                     |                     |          |          |          |
| **Manage Campus Options**               | Campus Admin          | Reads authorized campus context; mutates categories/locations.                                                                                                                                                        | R        | CRUD     |          |                     |          |                     |                     |          |          |          |
| **Sign Up / Verify**                    | Access & Profile      | Reads domain rules, creates account, updates verification state.                                                                                                                                                      |          |          | CRU      |                     | R        |                     |                     |          |          |          |
| **Sign In**                             | Access & Profile      | Logical read of verified account state (session handling excluded here).                                                                                                                                              |          |          | R        |                     |          |                     |                     |          |          |          |
| **Select Campus**                       | Access & Profile      | Reads derived university campuses; updates selected campus on the student account.                                                                                                                                     | R        |          | RU       |                     |          |                     |                     |          |          |          |
| **Set Up Student Profile**              | Access & Profile      | Creates the student's `Student Profile` record.                                                                                                                                                                       |          |          |          | C                   |          |                     |                     |          |          |          |
| **Edit Student Profile**                | Access & Profile      | Reads and updates the `Student Profile` record.                                                                                                                                                                       |          |          |          | RU                  |          |                     |                     |          |          |          |
| **View Student Profile**                | Access & Profile      | Read-only exposure of minimal public profile data. *Depends on Block check.*                                                                                                                                          |          |          |          | R                   |          |                     |                     | R        |          |          |
| **Create Activity**                     | Hosting & Lifecycle   | Validates options/host eligibility; creates activity.                                                                                                                                                                 |          | R        | R        |                     |          | C                   |                     |          |          |          |
| **Manage Join Requests**                | Hosting & Lifecycle   | Host-owned routine flow. Reads profiles and pending request records; converts approval to `RecordType = participation`, `Status = confirmed`, or declines as `RecordType = request`, `Status = declined`; updates counts transactionally. |          |          |          | R                   |          | RU                  | RU                  |          |          |          |
| **Update Activity Status**              | Hosting & Lifecycle   | Host-owned routine flow. Updates lifecycle state (`open`, `full`, `completed`, `cancelled`); cancellation branch reads participations.                                                                                |          |          |          |                     |          | RU                  | R                   |          |          |          |
| **Delete Activity**                     | Hosting & Lifecycle   | Hard-deletes activity and ALL linked participation records.                                                                                                                                                           |          |          |          |                     |          | RD                  | RD                  |          |          |          |
| **Browse/Filter Activities**            | Discovery & Partic.   | Feeds construction over discoverable activities, excluding hard-deleted records because they no longer exist and excluding non-discoverable lifecycle states such as `cancelled`/`completed`. *Blocked users' activities are filtered.* |          |          |          |                     |          | R                   |                     | R        |          |          |
| **View Activity Details**               | Discovery & Partic.   | Reads activity/host profile. *Inaccessible if block exists.*                                                                                                                                                          |          |          |          | R                   |          | R                   |                     | R        |          |          |
| **Join Activity**                       | Discovery & Partic.   | Reads constraints/state inside the write transaction; block check; creates either `RecordType = request`, `Status = pending` or `RecordType = participation`, `Status = confirmed`; updates/derives counts transactionally. |          |          |          |                     |          | RU                  | CR                  | R        |          |          |
| **Withdraw Join Request**               | Discovery & Partic.   | Deletes or deactivates a pending request (`RecordType = request`, `Status = pending`) and updates availability transactionally. *No host notification and no `DS-NS-001` record.*                                      |          |          |          |                     |          | U                   | RD                  |          |          |          |
| **Leave Joined Activity**               | Discovery & Partic.   | Deletes confirmed participation (`RecordType = participation`, `Status = confirmed`) and updates availability transactionally. *Host may be notified.*                                                                |          |          |          |                     |          | RU                  | RD                  |          |          |          |
| **View Personal List**                  | Discovery & Partic.   | Read-only composition of upcoming/past user participations.                                                                                                                                                           |          |          |          |                     |          | R                   | R                   |          |          |          |
| **Submit Report**                       | Safety & Moderation   | Validates reporter/account/profile context; activity reports are accepted only from an already allowed app context; creates `DS-SM-002` with target reference and campus scope without a full `DS-HL-001` read.        |          |          | R        | R                   |          |                     |                     |          | C        |          |
| **Review Report**                       | Safety & Moderation   | Uses `AuthenticatedAdminContext`; updates report outcome and may read current activity context. If the activity no longer exists, shows an unavailable/deleted target fallback. Native bans/removals are routed to AP/H&L. |          |          | R        | R                   |          | R                   |                     |          | RU       |          |
| **Block User**                          | Safety & Moderation   | Validates target; creates/reads block. Pending-request consequences, if modeled, are requested through H&L-native workflow and are not direct SM mutation of `DS-HL-002`.                                             |          |          | R        | R                   |          |                     |                     | CR       |          |          |
| **Notify: Join Event**                  | Notifications         | Suppressed if block exists.                                                                                                                                                                                           |          |          | R        |                     |          | R                   | R                   | R        |          | C        |
| **Notify: Leave Event**                 | Notifications         | For joined users leaving before start. Suppressed if block exists.                                                                                                                                                    |          |          | R        |                     |          | R                   | R                   | R        |          | C        |
| **Notify: App. Outcome**                | Notifications         | Suppressed if block exists.                                                                                                                                                                                           |          |          | R        |                     |          | R                   | R                   | R        |          | C        |
| **Notify: Cancellation**                | Notifications         | Suppressed if block exists.                                                                                                                                                                                           |          |          | R        |                     |          | R                   | R                   | R        |          | C        |
| **Open Notification**                   | Notifications         | Reads notification, re-evaluates access permissions before routing, and does not update read/unread state because no such state exists in the first skeleton.                                                         |          |          |          |                     |          | R                   | R                   | R        |          | R        |
| **Notify: Activity Reminder**           | Notifications         | MVP reminder flow. NSF consumes `ActivityReminderDue`, verifies current activity and confirmed participation context, and creates only the notification consequence in `DS-NS-001`.                                  |          |          | R        |                     |          | R                   | R                   |          |          | C        |
| **Update Campus Insight Consent**       | Access and profile    | Allows the student to grant, refuse, or revoke consent for identifiable campus insight access. The choice is stored on `DS-AP-001` and does not affect normal app access.                                             |          |          | RU       |                     |          |                     |                     |          |          |          |
| **View Consent-Based Student Insights** | Campus Administration | Uses runtime `AuthenticatedAdminContext`; checks admin campus scope and `CampusInsightSharingConsent`, then performs conditional read-only access over existing AP/H&L stores. No new admin store is introduced.       | R        |          | R        | R (if consent=TRUE) |          | R (if consent=TRUE) | R (if consent=TRUE) |          |          |          |

***

## 4. System Invariants & Business Rules

### Data Deletion Constraints

1. **Activity Deletion (****`DS-HL-001`****,&#x20;****`DS-HL-002`****)**: Activity deletion is strictly a **hard-delete**. Deleting an activity must cascade to physically delete all linked participation and request records. `deleted` is not a persisted `Activity.Status`.
2. **Cancellation vs Deletion**: Cancellation sets `Activity.Status = cancelled` and preserves the activity record for relevant history contexts. Deleted activities disappear from discovery and history because the activity record no longer exists. Deletion does not create a notification branch in the first skeleton.

### Lifecycle and Participation Vocabulary

1. **Activity Status**: Persisted `Activity.Status` values are only `open`, `full`, `completed`, and `cancelled`.
2. **Participation Model**: Persisted participation records use `Participation.RecordType = request | participation` and `Participation.Status = pending | confirmed | declined`. Withdraw and leave are workflow outcomes, not persisted participation statuses.
3. **Atomic Capacity Operations**: Join, request, approve, withdraw, leave, cancellation, and deletion operations that affect capacity, participation records, or counters must be atomic. Capacity and existing participation/request state must be re-checked inside the write transaction. A uniqueness constraint must prevent duplicate active records for the same `ActivityID` and `StudentAccountID`. Conflicting concurrent operations receive a safe rejection, and counters must be derived or updated transactionally.

### Safety & Visibility (Blocking System)

1. **Reciprocal Visibility (****`DS-SM-001`****)**: If User A blocks User B, the effect is mutually restrictive.
   * Neither can see the other's activities in feeds.
   * Neither can access the other's Activity Details pages.
   * Neither can view the other's Profile Details.
2. **Notification Suppression (****`DS-NS-001`****)**: ALL cross-user notifications (joins, leaves, application outcomes, cancellations) must be strictly suppressed/aborted if a block relationship exists between the trigger user and the receiving user.

### Notification Triggers

1. **Pending Request Withdrawal**: If a user withdraws a *pending* join request, the system **must not** generate a notification for the host, must not create a `DS-NS-001 Notification Record`, and must not include a user-facing `Notify: Withdraw Event` branch in the first skeleton. A notification may be created only if the user has already joined the activity and then leaves.
2. **Approved Participation Leave**: If a user leaves an activity *after* being approved (and before the activity starts), the system **must** generate a notification for the host.

### Moderation Consequences

1. **ModerationAction Vocabulary**: First-skeleton `ModerationAction` values are `none`, `warn_user`, `suspend_user`, `ban_user`, and `remove_activity`.
2. **Admin User Actions**: Moderation outcomes applied to users (`suspend_user`, `ban_user`) are recorded by SM and executed through native AP workflow against `DS-AP-001`.
3. **Admin Activity Actions**: `remove_activity` is recorded by SM as the moderation decision, then routed as a trigger to execute the native hard-delete workflow within the Hosting & Lifecycle module (`DS-HL-001` and `DS-HL-002`). SM does not directly mutate AP/H&L stores.

### Architectural Boundaries

1. **Notification Single Source of Truth**: The Notification module (`DS-NS-001`) must act purely as an event sink and the only writer of `DS-NS-001`. It must read upstream truth from HL/AP modules and never maintain parallel state regarding activities or user participations.
2. **Notification Open Semantics**: Opening a notification is a read-only navigation and access-check operation. It shall read the notification record and the referenced current business context, without implicitly updating notification state or creating parallel activity/participation state.
3. **Admin Identity**: Campus Admin identity is represented as runtime `AuthenticatedAdminContext` (`adminId`, `email`, `role`, `authorizedCampusIds`, `selectedCampusId`), not a canonical database table or data store.

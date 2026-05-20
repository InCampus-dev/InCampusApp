# project-summary

# INCAMPUS - Current Project Knowledge Summary

> Operational reference for continuing INCAMPUS work with AI.
> This document summarizes the current project knowledge base.
> If a future source conflicts with this summary, prefer the newer confirmed source and update this document.
> Do not invent actors, use cases, entities, stores, requirements, or rules beyond the documented scope.

***

## 1. What Is INCAMPUS?

INCAMPUS is a mobile app concept for reducing isolation in university campus life.
It helps students find low-pressure opportunities to share ordinary campus moments with nearby students, such as lunch, coffee breaks, study sessions, sports, and small activities.

The first rollout focus is Tongji University, Jiading Campus.

The product is not a dating app. Its intended character is local, simple, believable, safe, and easy to use. The core experience should make social participation feel lightweight rather than high-pressure.

***

## 2. Project Objective

The project objective is to design and specify a campus-scoped social participation app where verified university students can:

* access the app only through university-affiliated identity;
* select or confirm the campus they belong to;
* create a minimal profile sufficient for trust and recognition;
* create small, ordinary campus activities;
* browse and filter activities available in their campus;
* join directly or request to join depending on the host's participation mode;
* manage activity lifecycle and participation state;
* receive relevant notifications;
* use basic safety mechanisms such as community rules, reports, moderation, and blocking.

The current phase is architecture analysis. Requirements and use cases exist, but the most recent work focuses on logical DFD decomposition, data stores, entity modeling, relationships, CRUD consistency, and source-scope reconciliation.

***

## 3. Main Actors

| Actor                           | Role in the system                                                                                                 | Notes                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Student                         | Default authenticated user. Signs up, selects campus, creates profile, browses, joins, hosts, reports, and blocks. | Must be university-verified and campus-scoped.                                                    |
| Student Host                    | Student who created a specific activity.                                                                           | Can manage join requests, update status, and delete own activity before start.                    |
| Student Guest                   | Student browsing or interacting with activities created by others.                                                 | Can view details, join directly, or request to join.                                              |
| Student Participant             | Student with an active or historical participation relationship to an activity.                                    | Can view personal activity lists, leave joined activities, and receive participant notifications. |
| Campus Admin                    | Authorized campus-side role for campus configuration, structured options, and report review.                       | Exact admin account/entity model is to verify.                                                    |
| System                          | Automated process actor for notification, reminder, and some state-driven consequences.                            | Does not own business truth except where modeled as notification consequence.                     |
| Notification Delivery Mechanism | External delivery channel for push or in-app notification output.                                                  | Delivery implementation details are to verify.                                                    |

***

## 4. MVP Use Cases

Use case names are currently the practical identifiers. Formal numeric UC IDs are not yet stable.

### 4.1 Access and Profile

| Use case                      | Main actor | Current meaning                                                                                  |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Sign Up with University Email | Student    | Create an account through university email verification and password creation.                   |
| Sign In                       | Student    | Access a verified account using university email and password.                                   |
| Select Campus                 | Student    | Select or confirm the campus associated with the verified university context.                    |
| Set Up Profile                | Student    | Create a minimal profile after registration.                                                     |
| Edit Profile                  | Student    | Update the existing minimal profile.                                                             |
| View Student Minimal Profile  | Student    | View another student's minimal profile only in allowed activity contexts and after block checks. |

### 4.2 Hosting and Lifecycle

| Use case                   | Main actor   | Current meaning                                                                                                                |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Create Activity            | Student Host | Create a campus-scoped activity with category, details, meeting point, date/time, participant limit, and participation mode.   |
| Set Activity Date and Time | Student Host | Sourced as a use case, but current architecture treats it as internal to Create Activity. Final formal treatment is to verify. |
| Manage Join Requests       | Student Host | Review pending join requests, inspect minimal profiles, approve or decline applicants.                                         |
| Update Activity Status     | Student Host | Update lifecycle status such as completed or cancelled.                                                                        |
| Delete Activity            | Student Host | Delete an own activity before it starts. Current architecture models this as hard deletion, not cancellation.                  |

### 4.3 Discovery and Participation

| Use case                     | Main actor                   | Current meaning                                                                                         |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Browse and Filter Activities | Student Guest                | Browse campus feed and filter by activity properties such as category, time, and other sourced filters. |
| View Activity Details        | Student Guest or Participant | Inspect essential activity details before joining or from a valid context.                              |
| Join Activity                | Student Guest                | Join directly when allowed or submit a request when host approval is required.                          |
| Withdraw Join Request        | Student                      | Withdraw a pending request before host decision. Notification behavior is to verify.                    |
| Leave Joined Activity        | Student Participant          | Leave an already joined activity before it starts.                                                      |
| View Personal Activity List  | Student                      | See upcoming participation and past associated activities separately.                                   |

### 4.4 Notifications, Safety, and Moderation

| Use case                                    | Main actor                                       | Current meaning                                                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notify Host of Join Event                   | System                                           | Notify host when a student directly joins or requests to join.                                                                                                   |
| Notify Participant of Application Outcome   | Activity Host triggers System                    | Notify applicant when a request is approved or declined.                                                                                                         |
| Notify Participant of Activity Cancellation | Student Participant receives System notification | Notify joined participants when a joined activity is cancelled.                                                                                                  |
| Receive Activity Reminder                   | System                                           | Current architecture models this as an active MVP notification branch, although the baseline requirements mark it as PostMVP. Scope reconciliation is to verify. |
| View Community Rules                        | Student                                          | Let students access expected conduct rules before and during participation.                                                                                      |
| Report User or Activity                     | Student                                          | Submit a report about inappropriate user or activity behavior.                                                                                                   |
| Review Report                               | Campus Admin                                     | Review submitted reports, record outcomes, and trigger native moderation consequences.                                                                           |
| Block User                                  | Student                                          | Block another user to prevent supported visibility and interaction.                                                                                              |

### 4.5 Campus Administration

| Use case                         | Main actor   | Current meaning                                                                                                 |
| -------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| Configure New Campus             | Campus Admin | Configure a new campus through a guided setup flow.                                                             |
| Manage Campus Structured Options | Campus Admin | Create, update, and remove campus-specific structured options such as activity categories and campus locations. |

***

## 5. PostMVP or Currently Outside Scope

Keep baseline PostMVP scope and current architecture scope separate.

| Use case                           | Baseline scope   | Current architecture interpretation                                                                                                  |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| View Friends and Social Indicators | PostMVP          | Deferred. Friend indicators may extend activity details/feed behavior later.                                                         |
| Track Participation Points         | PostMVP          | Deferred. Attendance verification and point rules are not defined enough for MVP implementation.                                     |
| Upload Activity Photo              | PostMVP          | Deferred. Photo rules, moderation, retention, and visibility are not specified.                                                      |
| Send Message                       | Baseline MVP     | Deferred/postponed by the current architecture model. Treat as outside the current D\&P MVP model until requirements are reconciled. |
| Receive Activity Reminder          | Baseline PostMVP | Active MVP branch in the current notification architecture. This is a scope conflict to verify, not a simple PostMVP item anymore.   |

***

## 6. Main Entities and Their Roles

The current data model is logical, not a physical database schema. It does not define SQL implementation, migrations, indexes, API contracts, provider integrations, or final weak-reference mechanics.

| Entity                   | Role                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campus                   | Core configured campus and university association. Scopes accounts, activities, options, and admin review context.                                         |
| Campus Location          | Campus-specific meeting point option used during activity creation.                                                                                        |
| Activity Category        | Campus-specific activity category used for creation and filtering.                                                                                         |
| Student Account          | University access identity, verification state, password credential state, selected campus association, platform access, and campus insight consent.       |
| Student Profile          | Minimal public profile shown only in allowed contexts after block checks.                                                                                  |
| University Identity Rule | Email-domain and optional student-ID validation rule used during sign-up.                                                                                  |
| Activity                 | Campus-scoped activity hosted by a student, with schedule, location, category, participation mode, limits, counters, and lifecycle state.                  |
| Participation            | Relationship between a student account and an activity. Carries request or participation state.                                                            |
| Block Relationship       | Directed stored block record whose effects are enforced reciprocally for supported visibility, interaction, profile, and notification behaviors.           |
| Report Record            | Moderation report with target type, target reference, reason/details, campus scope, review status, outcome, and action trace.                              |
| Notification Record      | Notification consequence and navigation reference. It references upstream context but does not duplicate activity, participation, account, or block truth. |
| Campus Admin             | Proposed or implied administrative identity for configuration and report review. Exact entity/store treatment is to verify.                                |

### 6.1 Key Attribute Notes

* Student Account includes `PasswordHash`.
* Student Account includes `CampusInsightSharingConsent`, defaulting to false.
* Student Account currently owns selected campus association in the process-level CRUD interpretation.
* Activity stores structured references and snapshot labels for category and meeting point.
* Activity status currently uses `open`, `full`, `completed`, and `cancelled`.
* `deleted` is hard-delete behavior, not a persisted Activity status in the current ERD.
* Participation distinguishes request/participation records and uses states such as pending, confirmed, and declined in the current entity catalog.
* Report Record must target either a user or an activity, not both at the same time.
* Notification Record may reference related activity, participation, context, and triggering account, but opening a notification must re-check current access and context.

***

## 7. Canonical Data Stores / Databases

There are 10 canonical logical data stores. Do not add duplicates unless a later confirmed source changes the model.

| Store ID  | Store name                | Owning subsystem              | Role                                                                                                              |
| --------- | ------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| DS-CA-001 | Campus Configuration      | Campus Administration         | Core campus configuration, university association, activation status.                                             |
| DS-CA-002 | Campus Structured Options | Campus Administration         | Campus-specific categories, valid meeting locations, and similar options.                                         |
| DS-AP-001 | Student Account           | Access and Profile            | Account identity, university email, verification state, password hash, platform access, selected campus, consent. |
| DS-AP-002 | Student Minimal Profile   | Access and Profile            | Minimal profile data for setup, edit, profile viewing, and request review contexts.                               |
| DS-AP-003 | University Identity Rules | Access and Profile            | Supported domain and validation rules for university-affiliated sign-up.                                          |
| DS-HL-001 | Activities                | Hosting and Lifecycle         | Activity truth: details, host, campus, category, meeting point, schedule, limits, mode, status.                   |
| DS-HL-002 | Activity Participations   | Hosting and Lifecycle         | Join requests, participation state, approval/decline outcomes, counters and availability effects.                 |
| DS-SM-001 | Block Relationships       | Safety and Moderation         | User-to-user block state for visibility, interaction, profile, and notification constraints.                      |
| DS-SM-002 | Report Records            | Safety and Moderation         | Reports, reasons/details, review status, review outcome, moderation action trace.                                 |
| DS-NS-001 | Notification Records      | Notifications and System Flow | Notification consequences and references to upstream business context.                                            |

Important store rules:

* Campus Location and Activity Category are entity-level structures under campus structured options, not separate confirmed stores.
* Campus Admin has no confirmed dedicated store yet.
* Community rules are static MVP content for now, not a confirmed managed store.
* Activity reminders use activity and participation truth plus notification records; no separate reminder store is confirmed.
* Campus insight access currently adds a consent attribute and conditional read rule, not a new insight store.

***

## 8. Architectural Subsystems and Responsibilities

| Abbrev. | Subsystem                     | Responsibility                                                                                                                                                       |
| ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA      | Campus Administration         | Configure campuses and manage campus-specific structured options. Owns campus configuration and options.                                                             |
| AP      | Access and Profile            | Manage sign-up, sign-in, selected campus, minimal profile, university rules, password credential state, and campus insight consent.                                  |
| H\&L    | Hosting and Lifecycle         | Own activity creation, host-side request management, lifecycle state, cancellation, deletion, and participation truth.                                               |
| D\&P    | Discovery and Participation   | Browse/filter activities, view details, join/request, withdraw, leave, and compose personal activity lists. Reads and sometimes updates H\&L stores where justified. |
| SM      | Safety and Moderation         | Own community rules access, reports, report review records, block relationships, and block-state exposure.                                                           |
| NSF     | Notifications and System Flow | React to upstream events, resolve recipients/context/suppression, create notification records, deliver notifications, and open notification contexts read-only.      |

Ownership rule: a subsystem owns a store only when the architecture assigns it ownership. Another subsystem may read or update that store for a justified flow, but ownership does not move.

***

## 9. Main Business Rules and Invariants

### 9.1 Identity and Campus Scope

* Registration requires a university email address.
* Unsupported or non-university domains must be rejected.
* The account activates only after email verification.
* Sign-up includes password creation; sign-in uses verified university email and password.
* The selected campus scopes campus-specific content.
* The system should support future expansion to multiple universities and campuses through configuration.

### 9.2 Activity Creation and Lifecycle

* Activity creation includes category, details, meeting point, scheduled date/time, participant limit, and participation mode.
* Date/time selection is part of Create Activity in architecture modeling.
* Participation mode determines whether students join directly or request host approval.
* Maximum participant/request limits must not be exceeded, including under concurrent requests.
* Current activity statuses: `open`, `full`, `completed`, `cancelled`.
* `Pending Approval` is not an activity status; it is participation/request state.
* Deletion is hard deletion of the activity and linked participation/request records.
* Cancellation is a lifecycle status that preserves cancelled context and triggers participant cancellation notifications.
* Deletion does not have a confirmed notification branch.

### 9.3 Participation

* A student can join directly when the activity allows open joining.
* A student can submit a pending join request when host approval is required.
* The host can approve or decline pending requests.
* A pending requester can withdraw before host decision.
* A joined participant can leave before the activity starts.
* Withdraw/leave actions update participation state and activity availability/count effects.

### 9.4 Blocking

* Blocking is stored as directed records but enforced reciprocally for supported effects.
* Blocked users cannot see each other's activities in discovery.
* Blocked users cannot open each other's activity details.
* Blocked users cannot view each other's minimal profiles in supported contexts.
* Blocked users cannot initiate new join/request interactions with each other.
* Cross-user notifications must be suppressed when a block relationship exists between trigger user and recipient.
* Existing shared participation is not automatically removed by block creation. Pending-request consequences are to verify.

### 9.5 Notifications

* NSF alone writes notification records.
* H\&L and D\&P emit or expose notification-relevant event context, but do not persist notification records.
* Notification records must not duplicate activity, participation, account, or block truth.
* Opening a notification is read-only.
* Opening a notification must re-check current activity/participation context and block/access state.
* If a referenced target no longer exists, route to an unavailable fallback instead of reconstructing missing business state.
* Activity reminder is modeled as a time/system-triggered branch for valid still-joined participants when the activity is not cancelled.
* Pending request withdrawal host notification is to verify: CRUD says no host notification, but some DFD work still models a withdrawal trigger.

### 9.6 Reports and Moderation

* Students can submit reports about users or activities.
* Campus admins can review reports, record outcomes, and take moderation actions.
* Report records and review outcomes must be preserved consistently and traceably.
* Review Report directly updates report records.
* If moderation bans or suspends a user, SM should trigger the AP-native account workflow.
* If moderation removes an activity, SM should trigger the H\&L-native deletion workflow.
* Exact report payload fields, evidence handling, feedback, and moderation action set are to verify.

### 9.7 Consent-Based Campus Insight Access

* Identifiable student interests and activity-participation insight data may be exposed to authorized campus staff only with explicit student consent.
* Consent is stored on Student Account.
* Future insight views must enforce campus scope, consent checks, and least-privilege access before reading identifiable profile, activity, or participation data.
* Refusing consent does not block normal app use.
* No complete admin insight product feature is confirmed yet.

***

## 10. Critical System Flows

### 10.1 Onboarding and Access

1. Student enters university email.
2. System validates domain against university identity rules.
3. System sends verification email.
4. Account activates only after verification.
5. Student creates password credential state.
6. Student selects or confirms campus.
7. Student sets up a minimal profile.

To verify: exact verification mechanism, campus-change behavior, profile mandatory status, and exact profile fields.

### 10.2 Activity Creation

1. Host starts activity creation.
2. System reads campus structured options for categories and locations.
3. Host enters details, schedule, participant limit, and participation mode.
4. System validates date/time and required inputs.
5. System creates the activity as campus-scoped H\&L truth.
6. Activity becomes available in the campus feed within a short time.

To verify: map-based location support and final end-time treatment.

### 10.3 Browse, Filter, and View Details

1. Student enters campus activity feed.
2. D\&P reads activity truth and block state.
3. System filters out inaccessible, blocked, full, cancelled, deleted, and otherwise unavailable activities according to current rules.
4. Student applies filters.
5. Student opens details only if block and visibility checks pass.
6. Minimal host profile may be exposed only in allowed context.

To verify: exact direct-link behavior for full/unavailable activities and exact blocked-state user messaging.

### 10.4 Join or Request to Join

1. Student opens an accessible activity.
2. D\&P checks activity availability, participation mode, counters, and block state.
3. If open joining is allowed, system creates participation state and updates counts.
4. If approval is required, system creates pending request state and updates request counts.
5. D\&P exposes a join/request trigger to NSF.
6. NSF resolves host, context, block suppression, and writes a notification if allowed.

To verify: exact concurrency strategy for counters.

### 10.5 Host Request Management

1. Host views pending join requests.
2. H\&L reads activity, participation, and applicant minimal profile context.
3. Host approves or declines each request.
4. System updates participation and activity availability/count state.
5. H\&L exposes approval/decline event context to NSF.
6. NSF notifies the applicant when allowed.

To verify: request ordering, batch handling, and complete state-transition diagram.

### 10.6 Withdrawal and Leave

1. Pending requester withdraws before host decision, or joined participant leaves before start.
2. D\&P reads/deletes or updates relevant participation state and updates activity availability/count state.
3. Leave by a joined participant triggers host notification through NSF when not suppressed.
4. Pending-request withdrawal notification behavior remains unresolved.

To verify: whether pending request withdrawal must notify host.

### 10.7 Status Update, Cancellation, and Deletion

1. Host updates lifecycle status or deletes the activity.
2. Cancellation updates activity status and exposes joined participant context to NSF.
3. NSF creates cancellation notifications for valid recipients when allowed.
4. Deletion hard-deletes the activity and linked participation/request records.
5. Deletion removes the activity from feed and normal activity views.
6. No deletion notification is confirmed.

To verify: whether future requirements add deletion notification or recovery/archive behavior.

### 10.8 Report and Review

1. Student submits a report about a user or activity.
2. SM validates relevant AP/profile context and stores the report.
3. Campus Admin reviews report details.
4. Admin records review status, outcome, and moderation action trace.
5. Consequences route to AP or H\&L native workflows as needed.

To verify: evidence fields, reason-code domain, reporter feedback, reported-party notice, and admin authorization model.

### 10.9 Block User

1. Student blocks another user.
2. SM creates or reads block relationship state.
3. D\&P uses block state to filter feed, deny details, and prevent new join/request interactions.
4. AP uses block state before exposing minimal profiles.
5. NSF uses block state to suppress cross-user notifications and check notification-open access.

To verify: unblock behavior and exact effects on existing shared/pending participation.

### 10.10 Reminder Notification

1. System/time trigger checks upcoming scheduled activities.
2. NSF reads activity lifecycle and still-joined participation truth.
3. Reminder is suppressed if the activity is cancelled or the student is no longer joined.
4. NSF creates notification records for valid recipients.
5. Opening the reminder routes to current activity context if it still exists.

To verify: delivery channel, reminder timing configuration beyond the sourced five-minute rule, and notification-list UX.

***

## 11. Functional Requirements Synthesized by Area

| Area                        | Functional requirements summary                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access and Identity         | Enter university email, reject unsupported domains, send verification email, activate only after verification, associate account with campus, sign in with verified email and password.                  |
| Campus Scope and Onboarding | Determine university from verified email domain, present associated campuses, store selected campus, use campus to scope visible content.                                                                |
| Profile                     | Create and edit minimal profile, expose minimal profile only in relevant activity contexts and under visibility constraints.                                                                             |
| Activity Creation           | Select campus-specific category, enter details, set meeting point, set scheduled date/time, set participant limit, set participation mode.                                                               |
| Browse and Discovery        | Show available activities, display essential details, filter by sourced filters, support multiple filters, update filtered results promptly, hide unavailable activities.                                |
| Join and Request Management | Allow direct join or request-to-join, show pending requests to host, let host approve/decline, block new requests when participant/request limits are reached.                                           |
| Activity Lifecycle          | Allow host/admin-authorized status update, cancellation detection, deletion by authorized host before start, feed removal after deletion.                                                                |
| Participation Changes       | Allow pending request withdrawal, allow joined participant leave before start, update participation and activity availability/count state.                                                               |
| Notifications               | Notify host on join/request, notify participant on approval/decline, notify joined participants on cancellation, provide reminder branch in current architecture, open notification context where valid. |
| Personal Activity Area      | Provide upcoming participation list and separate past activity list.                                                                                                                                     |
| Safety and Moderation       | Provide community rules, allow reports about users/activities, allow admin review and recorded outcomes, support moderation actions, allow user blocking.                                                |
| Campus Administration       | Configure new campus through guided workflow, manage campus-specific structured options such as categories and locations.                                                                                |
| Deferred Social Features    | Messaging, shared activity links, friends/social indicators, participation points, and activity photo upload exist in requirements but are not all in current MVP architecture scope.                    |

***

## 12. Main Non-Functional Requirements

| Category             | Main expectations                                                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security and privacy | Protect registration, verification, authentication, report data, and profile exposure. Enforce host/admin authorization. Protect direct messages if messaging is later implemented. Restrict identifiable insight access by consent, campus scope, and least privilege. |
| Usability            | Keep registration, campus selection, profile setup, activity creation, join, reporting, and admin workflows simple and understandable. Present activities, filters, details, profiles, personal lists, and notifications clearly.                                       |
| Performance          | Send verification email shortly after registration. Make new activities visible within a few seconds. Update filtered results quickly. Deliver join/outcome/cancellation notifications shortly after triggering events.                                                 |
| Reliability          | Avoid duplicate or partially activated accounts. Preserve report records and review outcomes. Handle concurrent join requests without exceeding limits. Apply block, deletion, withdrawal, leave, reminder, and campus-option changes consistently.                     |
| Scalability          | Support multiple universities and campuses through email-domain rules and campus configuration, without requiring a new system version for each campus.                                                                                                                 |
| Traceability         | Moderation decisions, report outcomes, point changes if implemented, and critical participation changes should remain consistent and traceable to the relevant business event.                                                                                          |

***

## 13. Visibility, Campus Scope, Blocks, Reports, and Notifications

### 13.1 Visibility and Campus Scope

* Students should see campus-specific content for their selected campus.
* Activities are campus-scoped.
* Campus structured options such as categories and locations are campus-specific.
* Minimal profile visibility is contextual, not global.
* Activity details and profiles must respect block checks.
* Future campus insight views must also respect campus authorization and consent.

### 13.2 Activity Visibility

* Full, cancelled, deleted, and completed activities should not appear as joinable discovery items.
* Deleted activities disappear from feed and normal views.
* Completed activities may remain in history/profile contexts where appropriate.
* Cancelled activities preserve cancelled context and support cancellation notification behavior.

### 13.3 Block Rules

* Blocks prevent supported reciprocal discovery visibility, activity-detail access, minimal-profile viewing, and new join/request interactions.
* Blocks suppress cross-user notifications.
* Block creation does not automatically remove all existing shared participation unless a later confirmed rule says so.

### 13.4 Report and Moderation Rules

* Reports can target a user or an activity.
* Report review records must preserve status, outcome, and moderation action trace.
* Admin review does not directly own account or activity truth. It triggers native AP or H\&L consequences where needed.
* Admin account/entity model is to verify.

### 13.5 Notification Rules

* Notification persistence belongs to NSF.
* Notification records are consequences, not sources of business truth.
* Opening a notification must re-check access and current context.
* Join/request, application outcome, cancellation, joined-participant leave, and activity reminder are active notification branches in current architecture.
* Pending-request withdrawal notification behavior is unresolved.
* Exact delivery channel, retry behavior, notification history, and notification-list UX are to verify.

***

## 14. Current Documentation Status

| Topic                    | Current state                                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements baseline    | 28 user stories, 65 functional requirements, 44 non-functional requirements.                                                                                                                                     |
| Use case baseline        | 31 draft narrative files exist. Use case names are practical identifiers until formal UC IDs are assigned.                                                                                                       |
| Current phase            | Architecture analysis.                                                                                                                                                                                           |
| Current DFD model        | Six Level-1 process areas with clear ownership boundaries.                                                                                                                                                       |
| Current data-store model | Ten canonical logical stores.                                                                                                                                                                                    |
| Current data model       | Logical ERD/entity/relationship model is available and should be treated as draft sourced architecture, not physical schema.                                                                                     |
| Current CRUD model       | CRUD Matrix v1.5 is the current baseline for stable CRUD and invariants.                                                                                                                                         |
| Relationship diagram     | Latest use-case relationship diagram is a working source, not a final implementation contract.                                                                                                                   |
| Major scope overlay      | Send Message is deferred in current architecture; Receive Activity Reminder is active in current notification architecture; Set Activity Date and Time is internal to Create Activity for architecture modeling. |
| Major open conflict      | Pending request withdrawal host notification behavior is unresolved.                                                                                                                                             |

### 14.1 Main Points To Verify

* Final formal use case ID scheme.
* Whether the current use-case relationship diagram is final or still working material.
* Whether Set Activity Date and Time remains a separate formal use case.
* Whether notification use cases remain formal use cases while NSF owns notification consequences.
* Whether pending request withdrawal should notify the host.
* Exact activity state-transition diagram.
* Exact authentication and university verification mechanism.
* Exact minimal profile fields and whether profile photo is included.
* Whether profile setup is mandatory before app use.
* Whether students can change campus after onboarding.
* Exact map-based location support and activity end-time treatment.
* Exact notification channel, payload, retry/failure behavior, and notification-list UX.
* Exact unblock behavior and existing/pending participation effects after block.
* Report fields, evidence handling, reporter feedback, reported-party notification, and moderation action set.
* Campus Admin account/entity/store model and authorization model.
* Campus insight feature scope, consent UI placement, and least-privilege admin read rules.
* Requirements-table cleanup for Send Message, Receive Activity Reminder, and Set Activity Date and Time.
* Requirement ID normalization where leading zeroes differ.
* Technical implementation stack.

***

## 15. How To Use This Summary For Future AI/Codex Work

Use this summary as a compact knowledge-transfer brief before asking AI/Codex to continue project work.

Operational guidance:

* Treat MVP and PostMVP scope separately.
* Preserve the current architecture overlays: Send Message deferred, Receive Activity Reminder active in notification architecture, Set Activity Date and Time internal to Create Activity for DFD/CRUD.
* Use use case names as temporary identifiers until formal IDs are confirmed.
* Do not add new actors, entities, stores, requirements, or business rules without a confirmed source or explicit team decision.
* Keep the six subsystem boundaries stable unless new confirmed architecture work changes them.
* Keep the ten canonical stores stable and avoid duplicate stores for notification, reminder, activity lifecycle, participation, community rules, or insight access.
* When a point is ambiguous, mark it as "to verify" rather than resolving it by assumption.
* For implementation planning, start from critical flows and invariants before designing screens or APIs.
* For data modeling, remember that the ERD is logical. Do not infer physical schema details that are not documented.
* For notification work, keep NSF as the only notification-record writer.
* For safety work, enforce block checks across feed, details, profile exposure, join/request interactions, and cross-user notifications.
* For future wiki updates, update the durable summary only after the underlying project understanding changes.

Best prompt pattern for AI/Codex:

1. State the target area, such as onboarding, join flow, notification flow, data model, or moderation.
2. Paste or reference the relevant section of this summary.
3. Ask the AI to preserve all documented invariants.
4. Ask the AI to list assumptions separately.
5. Ask the AI to mark every unresolved or source-conflicting point as "to verify".

***

## 16. Compact Current Truth

* INCAMPUS is a campus-scoped university social participation app.
* The MVP is centered on verified access, campus selection, minimal profiles, activity creation, discovery, join/request participation, lifecycle management, notifications, and basic safety.
* The project is currently in architecture analysis.
* The stable architecture shape is six subsystems and ten logical data stores.
* The current data model adds password hash, selected campus account state, campus insight consent, explicit entities, relationship constraints, and notification-reference behavior.
* Deletion is hard deletion; cancellation is preserved lifecycle state.
* Blocking is reciprocal for supported visibility and interaction effects.
* Notification records are owned only by NSF.
* Pending request withdrawal notification behavior is the most important current same-batch conflict to resolve.
* Campus Admin identity/store modeling and campus insight feature scope remain open.

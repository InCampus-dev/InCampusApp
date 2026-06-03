# Entities & Attributes v1.2

# Version log

\| 1.2 | 2026-05-08 | Final pre-skeleton alignment | Aligned canonical Student Profile naming, removed Campus Admin as a persisted canonical store/entity, finalized Activity and Participation state vocabularies, notification types, moderation actions, admin context, report boundary, and concurrency/deletion notes. | Required before using the entity catalog as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

\| 1.1 | 2026-05-01 | Student Account attributes | Added `CampusInsightSharingConsent` to control whether identifiable profile-interest and activity-participation insight data may be accessed by authorized campus staff. | Required to support future campus-level student-life insight access without treating admin access as unrestricted by default. | Campus insight access discussion; privacy and consent alignment | 

# Entity Attributes Catalog

## Overview

This document refactors the updated entity and attribute documentation into a structured Markdown catalog for technical review. It preserves the entities, attributes, grouped attributes, constraints, defaults, and relationship hints from the updated source page while marking unresolved or cross-document inconsistencies as `To verify`.

Sources consulted:

* Repository wiki: `inCampusLLMwiki/wiki/architecture/data-stores.md`, `inCampusLLMwiki/wiki/architecture/data-flow.md`, `inCampusLLMwiki/wiki/architecture/crud-matrix.md`, and the 2026-04-25 subgroup workdocs for CA, AP, H\&L, D\&P, SM, and NSF.
* Implementation schemas/models/migrations/API DTOs were not found in the repository. The available source code is the wiki viewer application, not the inCampus domain model, so attribute-level schema validation is documentation-derived.

Catalog conventions:

* Entity names follow the final accepted project decisions for the first skeleton. `Student Profile` is the canonical name for `DS-AP-002`; “minimal public profile data” is descriptive exposure wording only.
* Campus Admin identity is represented by runtime `AuthenticatedAdminContext`, not by a canonical persisted entity or data store.
* Attribute counts in the summary count leaf attributes only. Explicit grouped or compound headings are preserved in the entity tables but are not counted as leaf attributes.
* `Required` uses `Yes`, `No`, or `To verify`. Conditional fields are marked `No` and their conditional requirement is described in `Constraints / Notes`.
* `To verify` is used only where the available documentation leaves a field, type, default, inclusion, or naming decision unresolved.

## Persistent Entity Summary

| Entity                   | Description                                                                                              | Attribute Count | Notes                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Campus                   | Core structural environment where students onboard and activities take place.                            | 4               | Aligned with `DS-CA-001 Campus Configuration`. Exact extra campus setup fields remain `To verify`.                                         |
| Campus Location          | Campus-specific selectable location or meeting point used during activity creation.                      | 7               | Aligned with `DS-CA-002 Campus Structured Options`; modeled separately from activity categories.                                           |
| Activity Category        | Campus-specific selectable activity category used during activity creation and filtering.                | 7               | Aligned with `DS-CA-002 Campus Structured Options`; activities now store category reference plus snapshot label.                           |
| Student Account          | Internal student access identity for registration, verification, campus onboarding, and platform access. | 9               | Aligned with `DS-AP-001 Student Account`; selected campus storage follows current CRUD behavior.                                           |
| Student Profile          | Public-facing Student Profile shown in allowed campus/activity contexts with minimal public data exposure. | 11            | Canonical label for `DS-AP-002 Student Profile`; exact optional field set remains `To verify`.                                             |
| University Identity Rule | Rule used to validate whether an email domain belongs to a supported university.                         | 7               | Aligned with `DS-AP-003 University Identity Rules`; verification mechanism remains abstract.                                               |
| Notification Record      | Stored notification consequence for push/in-app delivery and later app-context navigation.               | 12              | Aligned with `DS-NS-001 Notification Records`; no read/unread state is modeled for the first skeleton.                                      |
| Activity                 | Campus-scoped activity created by a host student.                                                        | 19              | Aligned with `DS-HL-001 Activities`; capacity upper bound remains `To verify`.                                                             |
| Participation            | Record linking a student to an activity, covering confirmed participations and pending join requests.    | 6               | Aligned with `DS-HL-002 Activity Participations`; resolves the student-activity N:M relationship.                                          |
| Block Relationship       | Directed student-to-student block record with reciprocal enforcement effects.                            | 4               | Aligned with `DS-SM-001 Block Relationships`; duplicate-pair constraint should be confirmed.                                               |
| Report Record            | Moderation report about a user or activity, including review state and outcome trace.                    | 14              | Aligned with `DS-SM-002 Report Records`; reviewer identity is an opaque value from runtime `AuthenticatedAdminContext`.                     |

## Persistent Entities

### Campus

**Description:** Core structural environment where students onboard and activities take place.

**Module / Area:** Campus Administration / `DS-CA-001 Campus Configuration`.

**Relationships:** Registers `Student Account`, scopes `Activity` and `Report Record`, and contains `Campus Location` and `Activity Category`.

#### Attributes

| Attribute        | Type          | Required | Default        | Description                                                            | Constraints / Notes                                                            |
| ---------------- | ------------- | -------- | -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| CampusID         | String / UUID | Yes      | Auto-generated | Unique identifier for the campus record.                               | Likely primary key. System-generated and immutable after creation.             |
| UniversityName   | String        | Yes      | None           | University associated with the campus.                                 | Must match a valid university name. Used by onboarding/campus selection flows. |
| CampusName       | String        | Yes      | None           | Specific display name of the campus.                                   | Text value.                                                                    |
| ActivationStatus | Boolean       | Yes      | False          | Indicates whether the campus setup is complete and usable by students. | `True` means active and ready to use; `False` means configured but not ready.  |

#### Validation Notes

* `Campus` is the source of truth for configured campuses and is exported to Access and Profile for campus selection.
* The CA workdoc says exact configuration fields beyond university name, campus name, and activation status are not fully specified.

#### Open Questions

* Which additional campus setup fields are required beyond the attributes listed here is `To verify`.
* Campus Admin authorization uses runtime `AuthenticatedAdminContext`; the exact authentication implementation remains provisional.

### Campus Location

**Description:** Selectable campus-specific location or meeting point used during activity creation.

**Module / Area:** Campus Administration / `DS-CA-002 Campus Structured Options`.

**Relationships:** Belongs to `Campus` and is selected as the meeting point for `Activity`.

#### Attributes

| Attribute           | Type                    | Required | Default                            | Description                                                         | Constraints / Notes                                           |
| ------------------- | ----------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| LocationID          | String / UUID           | Yes      | Auto-generated                     | Unique identifier for one selectable campus location.               | Likely primary key.                                           |
| CampusID            | String / UUID reference | Yes      | None                               | Identifies the campus this location belongs to.                     | References existing `Campus.CampusID`.                        |
| LocationName        | String                  | Yes      | None                               | Location name displayed to users during activity creation.          | Must be a valid campus location name.                         |
| LocationDescription | Text                    | No       | Empty                              | Optional explanation or clarification of the campus location.       | Optional descriptive text.                                    |
| IsActive            | Boolean                 | Yes      | True                               | Indicates whether this location can currently be selected by hosts. | `True` means selectable; `False` means disabled but retained. |
| CreatedAt           | DateTime                | Yes      | Auto-generated                     | Timestamp for when the location option was created.                 | System timestamp.                                             |
| UpdatedAt           | DateTime                | Yes      | Auto-generated / updated on change | Timestamp for when the location option was last modified.           | System timestamp updated on change.                           |

#### Validation Notes

* `Campus Location` is one typed use of `DS-CA-002 Campus Structured Options`, not a separate store.
* Interactive map/geographic coordinate handling is explicitly outside MVP scope in the CA workdoc.

#### Open Questions

* Whether `LocationID` is globally unique or unique only within a campus is `To verify`.
* Exact maximum length and naming rules for `LocationName` are `To verify`.

### Activity Category

**Description:** Selectable campus-specific activity category used during activity creation and filtering.

**Module / Area:** Campus Administration / `DS-CA-002 Campus Structured Options`.

**Relationships:** Belongs to `Campus` and classifies `Activity`.

#### Attributes

| Attribute           | Type                    | Required | Default                            | Description                                                         | Constraints / Notes                                                                                     |
| ------------------- | ----------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| CategoryID          | String / UUID           | Yes      | Auto-generated                     | Unique identifier for one selectable activity category.             | Likely primary key.                                                                                     |
| CampusID            | String / UUID reference | Yes      | None                               | Identifies the campus this category belongs to.                     | References existing `Campus.CampusID`.                                                                  |
| CategoryName        | String                  | Yes      | None                               | Category name displayed during activity creation and filtering.     | Examples include lunch, coffee, study, sport, and language exchange. Exact list is campus-configurable. |
| CategoryDescription | Text                    | No       | Empty                              | Optional explanation of what the activity category represents.      | Optional descriptive text.                                                                              |
| IsActive            | Boolean                 | Yes      | True                               | Indicates whether this category can currently be selected by hosts. | `True` means selectable; `False` means disabled but retained.                                           |
| CreatedAt           | DateTime                | Yes      | Auto-generated                     | Timestamp for when the category option was created.                 | System timestamp.                                                                                       |
| UpdatedAt           | DateTime                | Yes      | Auto-generated / updated on change | Timestamp for when the category option was last modified.           | System timestamp updated on change.                                                                     |

#### Validation Notes

* `Activity Category` is one typed use of `DS-CA-002 Campus Structured Options`, not a separate store.
* The updated relationship table includes `Activity Category` classifying `Activity`.
* The updated source resolves activity category storage as `Activity.Category.CategoryID` plus a `CategoryLabel` snapshot.

#### Open Questions

* Category uniqueness scope, for example unique `CategoryName` per campus, is `To verify`.

## Runtime Authorization Context

### AuthenticatedAdminContext

**Description:** Runtime/admin-auth context supplied by the admin-only portal or auth layer for Campus Admin actions.

**Persistence:** Not persisted in the canonical InCampus data-store model. No Campus Admin database/store is introduced for the first skeleton.

**Used by:** Configure New Campus, Manage Campus Structured Options, Review Report, and View Consent-Based Student Insights.

#### Attributes

| Attribute           | Type                    | Required | Default | Description                                                        | Constraints / Notes                                                                 |
| ------------------- | ----------------------- | -------- | ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| adminId             | String / UUID / Opaque  | Yes      | None    | Runtime identifier for the authenticated admin principal.          | Comes from the admin auth layer; not a foreign key to a canonical InCampus store.   |
| email               | Text                    | Yes      | None    | Email associated with the authenticated admin principal.           | Exact admin authentication implementation remains provisional.                       |
| role                | Text / Role value       | Yes      | None    | Admin role available to the portal/session.                        | Must authorize the requested admin capability.                                       |
| authorizedCampusIds | List of CampusID values | Yes      | Empty   | Campuses the admin is allowed to operate within.                   | All Campus Admin actions must be campus-scoped.                                      |
| selectedCampusId    | CampusID value          | Yes      | None    | Campus currently selected for the admin action.                    | Must be included in `authorizedCampusIds` before any campus-scoped action proceeds.  |

#### Validation Notes

* This context resolves admin authorization for the first skeleton without adding any new canonical admin database or data store.
* Campus Admin access to AP/H&L data is capability-specific. Admin Insights are read-only and consent-gated; moderation/report-review access remains separate.
* Exact administrative authentication flow, such as standard login or enterprise SSO, remains provisional.

## Access and Profile Entities

### Student Account

**Description:** Internal student access identity used to control registration, verification, campus onboarding, and platform access.

**Module / Area:** Access and Profile / `DS-AP-001 Student Account`.

**Relationships:** Is registered to `Campus`, owns `Student Profile`, creates/hosts `Activity`, joins or requests activities through `Participation`, initiates and may be targeted by `Block Relationship`, submits and may be targeted by `Report Record`, and receives/triggers `Notification Record`.

#### Attributes

| Attribute                   | Type                    | Required | Default                      | Description                                                                                                                                                                                       | Constraints / Notes                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ----------------------- | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| StudentAccountID            | String / UUID           | Yes      | Auto-generated               | Unique identifier for the student account record.                                                                                                                                                 | Likely primary key. System-generated.                                                                                                                                                                                                                                                                                                              |
| PasswordHash                | String                  | Yes      | None                         | Hashed password used for university email/password sign-in.                                                                                                                                       | Plain passwords must never be stored.                                                                                                                                                                                                                                                                                                              |
| UniversityStudentID         | Text                    | Yes      | None                         | Student identifier officially assigned by the university.                                                                                                                                         | Required during registration/onboarding. Should not be system primary key. Uniqueness should be checked within the same university/campus context.                                                                                                                                                                                                 |
| UniversityEmail             | Text                    | Yes      | None                         | University email used for registration and verification.                                                                                                                                          | Must be a valid university email format. Domain must match a supported `University Identity Rule`.                                                                                                                                                                                                                                                 |
| VerificationStatus          | Value set               | Yes      | Pending                      | Verification state for the university email.                                                                                                                                                      | Allowed values: `Pending`, `Verified`, `Rejected`, `Expired`.                                                                                                                                                                                                                                                                                      |
| PlatformAccessStatus        | Value set               | Yes      | PendingVerification          | Platform access state, including moderation consequences.                                                                                                                                         | Allowed values: `PendingVerification`, `Active`, `Suspended`, `Banned`.                                                                                                                                                                                                                                                                            |
| SelectedCampusID            | String / UUID reference | No       | Null until campus selection  | Selected campus reference after campus onboarding.                                                                                                                                                | References existing `Campus.CampusID`. Nullable until the campus selection step is completed.                                                                                                                                                                                                                                                      |
| CreatedAt                   | DateTime                | Yes      | System timestamp at creation | Timestamp for when the student account was created.                                                                                                                                               | Valid timestamp.                                                                                                                                                                                                                                                                                                                                   |
| CampusInsightSharingConsent | Boolean                 | Yes      | False                        | Indicates whether the student explicitly agrees to let authorized campus staff access identifiable profile-interest and activity-participation insight data for campus-life improvement purposes. | Must be collected during onboarding or profile/account settings. If `False`, campus admins must not access identifiable student-interest or participation-history views outside moderation/report-review contexts. This consent does not block normal app usage and does not affect safety/moderation access already required by report workflows. |

#### Validation Notes

* Current CRUD behavior stores selected campus association in `DS-AP-001 Student Account`.
* The repository wiki preserves a wording mismatch where one older store definition places campus selection under `DS-AP-002`; the AP workdoc follows `DS-AP-001`.
* `UniversityEmail` validation is based on a domain-match rule, not necessarily a direct foreign key.

#### Open Questions

* Exact university verification mechanism is `To verify`.
* Exact uniqueness scope for `UniversityStudentID` is `To verify`.
* Whether `SelectedCampusID` becomes mandatory after onboarding completion is `To verify`.

### Student Profile

**Description:** Public-facing Student Profile shown in allowed campus/activity contexts with minimal public profile data exposure.

**Module / Area:** Access and Profile / `DS-AP-002 Student Profile`.

**Relationships:** Owned by `Student Account`; read in controlled contexts such as join-request review and activity detail/profile exposure, subject to `Block Relationship` checks.

#### Attributes

| Attribute        | Type                    | Required  | Default                      | Description                                                                                    | Constraints / Notes                                                                     |
| ---------------- | ----------------------- | --------- | ---------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| ProfileID        | String / UUID           | Yes       | Auto-generated               | Unique identifier for the public/minimal profile record.                                       | Likely primary key.                                                                     |
| StudentAccountID | String / UUID reference | Yes       | None                         | Identifies the student account that owns this profile.                                         | References existing `StudentAccountID`. Formal cardinality is modeled in relationships. |
| DisplayName      | Text                    | Yes       | None                         | Name shown to other students in allowed profile/activity contexts.                             | Short public display name.                                                              |
| Major            | Text                    | To verify | To verify                    | Student academic major or field of study.                                                      | Source says required or null depending on final UI decision.                            |
| DateOfBirth      | Date                    | No        | Empty                        | Birth date used to derive age dynamically when needed.                                         | Optional valid date.                                                                    |
| Gender           | Enum                    | No        | Empty                        | Student gender for profile information and gender-based activity filtering.                    | Allowed values: `male`, `female`, `other`, `prefer_not_to_say`.                         |
| Interests        | List of Text / Tags     | No        | Empty list                   | Lightweight interests for ordinary campus activities and social discovery.                     | Examples: sports, study, coffee, language exchange, food, games.                        |
| Languages        | List of Text / Tags     | No        | Empty list                   | Spoken or studied languages supporting language exchange and international-campus interaction. | Suggested field in source; final inclusion is `To verify`.                              |
| ShortBio         | Text / Memo             | No        | Null                         | Short, low-pressure self-description while keeping the profile minimal.                        | Suggested field in source. Length limit is `To verify`.                                 |
| CreatedAt        | DateTime                | Yes       | System timestamp at creation | Timestamp for when the profile was created.                                                    | Valid timestamp.                                                                        |
| UpdatedAt        | DateTime                | No        | Null until first edit        | Timestamp for the last profile edit.                                                           | Valid timestamp when set.                                                               |

#### Validation Notes

* `Student Profile` is the canonical entity/store name. “Minimal public profile data” describes the limited exposure level, not a separate entity.
* AP wiki pages explicitly state that exact profile fields remain unresolved. The updated source provides a concrete candidate list, so fields are preserved but uncertainty is marked.
* Block checks are mandatory before profile exposure to another student.

#### Open Questions

* Final inclusion of `Languages` and `ShortBio` is `To verify` because the source marks them as suggested fields.
* Required/optional status for `Major` is `To verify`.
* Exact allowed profile-viewing contexts are `To verify`.

### University Identity Rule

**Description:** Rule used to validate whether an email domain belongs to a supported university.

**Module / Area:** Access and Profile / `DS-AP-003 University Identity Rules`.

**Relationships:** Validates `Student Account` during sign-up/verification through university email domain matching.

#### Attributes

| Attribute           | Type                | Required | Default                               | Description                                                              | Constraints / Notes                                                           |
| ------------------- | ------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| DomainRuleID        | String / UUID       | Yes      | Auto-generated                        | Unique identifier for the university-domain validation rule.             | Likely primary key.                                                           |
| EmailDomain         | Text                | Yes      | None                                  | Accepted university email domain used during registration.               | Must be a supported university email domain.                                  |
| UniversityName      | Text                | Yes      | None                                  | University associated with the accepted email domain.                    | Must be a supported university name.                                          |
| StudentIDFormatRule | Text / Pattern Rule | No       | Null if no format rule is defined yet | Expected student ID format for the university associated with this rule. | Used to check whether `UniversityStudentID` is plausible for that university. |
| RuleStatus          | Value set           | Yes      | Active                                | Indicates whether the domain rule is usable for registration.            | Allowed values: `Active`, `Inactive`.                                         |
| CreatedAt           | DateTime            | Yes      | System timestamp at creation          | Timestamp for when the domain rule was created.                          | Valid timestamp.                                                              |
| UpdatedAt           | DateTime            | No       | Null until first edit                 | Timestamp for when the domain rule was last modified.                    | Valid timestamp when set.                                                     |

#### Validation Notes

* Validation is documented as domain matching against `StudentAccount.UniversityEmail`; it is not necessarily a direct foreign key.
* The AP workdoc confirms the store but leaves the technical verification mechanism abstract.

#### Open Questions

* Exact technical or organizational verification mechanism is `To verify`.
* Formal syntax for `StudentIDFormatRule` is `To verify`.

### Notification Record

**Description:** Stored notification consequence used for push/in-app notification and later navigation to the relevant app context.

**Module / Area:** Notifications and System Flow / `DS-NS-001 Notification Records`.

**Relationships:** Received by `Student Account`, may reference `Activity` and `Participation`, and may record a triggering `Student Account`.

#### Attributes

| Attribute                 | Type                    | Required  | Default                      | Description                                                                                         | Constraints / Notes                                                                                                                                  |
| ------------------------- | ----------------------- | --------- | ---------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| NotificationID            | String / UUID           | Yes       | Auto-generated               | Unique identifier for the notification record.                                                      | Likely primary key.                                                                                                                                  |
| RecipientAccountID        | String / UUID reference | Yes       | None                         | Student account that receives the notification.                                                     | References existing `StudentAccountID`. Authoritative attribute for notification visibility.                                                         |
| NotificationType          | Enum                    | Yes       | None                         | Business reason for the notification.                                                               | First-skeleton values: `JoinEvent`, `LeaveEvent`, `ApplicationOutcome`, `ActivityCancellation`, `ActivityReminder`. Pending-request withdrawal creates no notification record. |
| NotificationChannels      | Value set / Set         | Yes       | PushAndInApp                 | Delivery channels for the notification.                                                             | Allowed values: `Push`, `InApp`, `PushAndInApp`. Current decision is both push and in-app.                                                           |
| NotificationTitle         | Text                    | Yes       | None                         | Short title displayed in push/in-app notification preview.                                          | Short notification title.                                                                                                                            |
| NotificationMessage       | Text / Memo             | Yes       | None                         | Minimal readable message shown to the recipient.                                                    | Must not duplicate full activity, profile, or participation data.                                                                                    |
| BusinessContextReferences | Grouped attribute       | To verify | None                         | Logical group for business context references.                                                      | Source grouping only. Verify whether implementation stores this as a nested object or flattened fields. Not counted as a leaf attribute.             |
| RelatedActivityID         | String / UUID reference | No        | Empty                        | Activity involved in the notification, when applicable.                                             | References existing `ActivityID`. Nullable when the notification is not activity-specific.                                                           |
| RelatedParticipationID    | String / UUID reference | No        | Empty                        | Participation or request record involved in the notification, when applicable and still meaningful. | References existing `ParticipationID`. Nullable if deleted, withdrawn, or unnecessary for reopening.                                                 |
| TargetContext             | Grouped attribute       | To verify | None                         | Logical group used to open the relevant app page when the notification is tapped.                   | Source grouping only. Verify whether implementation stores this as a nested object or flattened fields. Not counted as a leaf attribute.             |
| TargetContextType         | Value set               | Yes       | None                         | Kind of app context the notification should open.                                                   | Allowed values: `ActivityDetails`, `JoinRequestReview`, `PersonalActivityContext`, `CancelledActivityContext`, `NotificationFallbackView`.           |
| TargetContextID           | String / UUID reference | No        | Empty / Nullable             | Identifier of the referenced object/context to open.                                                | Usually `ActivityID` or `ParticipationID` depending on notification type. Nullable when fallback navigation is needed. Exact mapping is `To verify`. |
| TriggeringAccountID       | String / UUID reference | No        | Null                         | Optional student account whose action caused the notification.                                      | References existing `StudentAccountID` or null for system/time-triggered reminders.                                                                  |
| CreatedAt                 | DateTime                | Yes       | System timestamp at creation | Timestamp for when the notification record was created.                                             | Valid timestamp.                                                                                                                                     |

#### Validation Notes

* `DS-NS-001` stores notification consequences and references only. It must not duplicate activity, participation, account, or block truth.
* Cross-user notifications require block suppression checks; activity reminders use participation/lifecycle validity instead.
* Opening a notification is read-only in the current architecture and must not update notification, activity, or participation state.
* No read/unread state (`read`, `unread`, `isRead`, `readAt`, or similar) is modeled on `DS-NS-001` for the first skeleton.

#### Open Questions

* Exact notification payload schema is `To verify`.
* Exact delivery mechanism, retry behavior, and notification-list UX are `To verify`.
* Whether `BusinessContextReferences` and `TargetContext` are persisted as nested objects or flattened fields is `To verify`.

### Activity

**Description:** Campus-scoped activity created by a host student, defining category, time, location, participation mode, and slot limits.

**Module / Area:** Hosting and Lifecycle / `DS-HL-001 Activities`.

**Relationships:** Scoped by `Campus`, hosted by `Student Account`, classified by `Activity Category`, uses `Campus Location` as meeting point, receives `Participation`, may be reported through `Report Record`, and may be referenced by `Notification Record`.

#### Attributes

| Attribute               | Type                          | Required | Default                                       | Description                                                                 | Constraints / Notes                                                                                                                             |
| ----------------------- | ----------------------------- | -------- | --------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ActivityID              | UUID                          | Yes      | System-generated at creation                  | Unique identifier for an activity record across the system.                 | Valid UUID. Non-null and immutable after creation.                                                                                              |
| CampusID                | Reference (Campus)            | Yes      | None                                          | Campus scope for the activity.                                              | References valid `CampusID`. Non-null. Enables campus-filtered feeds.                                                                           |
| HostAccountID           | Reference (Student Account)   | Yes      | None                                          | Student account that created/hosts the activity.                            | References valid `StudentAccountID`. Non-null and immutable after creation.                                                                     |
| Title                   | String                        | Yes      | None                                          | Human-readable label displayed in feed cards and activity detail.           | Non-empty. Maximum 100 characters.                                                                                                              |
| Category                | Grouped attribute             | Yes      | None                                          | Logical category group for the selected activity category.                  | Source grouping only. Stored as `CategoryID` plus `CategoryLabel`. Not counted as a leaf attribute.                                             |
| CategoryID              | Reference (Activity Category) | Yes      | None                                          | Campus-specific activity category selected by the host.                     | References existing `ActivityCategory.CategoryID`. Non-null.                                                                                    |
| CategoryLabel           | String                        | Yes      | System-populated from Activity Category       | Snapshot of the category display name at activity creation.                 | Non-empty fallback display value if the category is later renamed or disabled.                                                                  |
| Description             | Text                          | No       | Null                                          | Optional free-text context beyond category.                                 | Nullable. Maximum 300 characters.                                                                                                               |
| ScheduledDateTime       | DateTime                      | Yes      | None                                          | Planned start date and time.                                                | Must be future at creation. ISO 8601 format.                                                                                                    |
| ScheduledEndDateTime    | DateTime                      | No       | Null                                          | Optional planned end date and time.                                         | If set, must be after `ScheduledDateTime`. ISO 8601 format.                                                                                     |
| MeetingPoint            | Compound attribute            | Yes      | None                                          | Structured meeting point representation.                                    | Stored as reference ID plus snapshot label. Not counted as a leaf attribute.                                                                    |
| MeetingPointID          | Reference (Campus Location)   | Yes      | None                                          | Structured reference to the campus location in `DS-CA-002`.                 | References existing `LocationID`. Non-null.                                                                                                     |
| MeetingPointLabel       | String                        | Yes      | System-populated from `DS-CA-002` at creation | Snapshot of the location display name at activity creation.                 | Non-empty. Immutable after creation. Fallback if the structured option is renamed, deleted, or unavailable.                                     |
| ParticipationMode       | Enum                          | Yes      | None                                          | Determines whether joining is direct or subject to host approval.           | Allowed values: `open`, `approval_based`.                                                                                                       |
| MaxParticipants         | Integer                       | Yes      | None                                          | Upper cap on confirmed participants.                                        | Integer >= 1. Upper bound is `To verify`.                                                                                                       |
| MaxRequests             | Integer                       | No       | Null if not set                               | Upper cap on simultaneously pending join requests.                          | Integer >= 1 when set. Nullable if host does not impose a request cap.                                                                          |
| CurrentParticipantCount | Integer                       | Yes      | 0                                             | Live count of confirmed participants.                                       | Integer 0..`MaxParticipants`. Never negative. Updated by join/leave flows.                                                                      |
| CurrentRequestCount     | Integer                       | Yes      | 0                                             | Live count of pending join requests.                                        | Integer >= 0. Constrained by `MaxRequests` when set. Updated by request/withdraw/decision flows.                                                |
| GenderPreference        | Enum                          | Yes      | all                                           | Host-defined intended participant gender for the activity.                  | Allowed values: `all`, `male_only`, `female_only`. Supports gender-based feed filtering.                                                        |
| Status                  | Enum                          | Yes      | open                                          | Lifecycle state controlling visibility, actions, and notification triggers. | Persisted values: `open`, `full`, `completed`, `cancelled`. `deleted` is a hard-delete consequence, not a stored status. |
| CreatedAt               | DateTime                      | Yes      | System-generated                              | Timestamp for when the activity was created.                                | ISO 8601. Non-null and immutable after creation.                                                                                                |

#### Validation Notes

* `Pending Approval` is not an `Activity.Status`; a pending join request is `Participation.RecordType = request` and `Participation.Status = pending`.
* Cancellation and deletion are different. Cancellation stores `Activity.Status = cancelled` and preserves the activity record for relevant history contexts. Deletion is hard-delete behavior and removes the activity record; `deleted` is not persisted.
* `CategoryID` must be constrained to an `Activity Category` option from `DS-CA-002`.
* `MeetingPointID` must be constrained to a `Campus Location` option from `DS-CA-002`.
* Capacity/count-affecting operations must be atomic; capacity and existing participation/request state are re-checked inside the write transaction, and counters are derived or updated transactionally.

#### Open Questions

* Upper bound for `MaxParticipants` is `To verify`.

### Participation

**Description:** Record linking a student to an activity, covering both confirmed participation slots and pending join requests.

**Module / Area:** Hosting and Lifecycle / `DS-HL-002 Activity Participations`.

**Relationships:** Resolves the N:M relationship between `Student Account` and `Activity`; may be referenced by `Notification Record`.

#### Attributes

| Attribute        | Type                        | Required | Default                                              | Description                                                      | Constraints / Notes                                                                                                                                          |
| ---------------- | --------------------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ParticipationID  | UUID                        | Yes      | System-generated at creation                         | Unique identifier for a participation or request record.         | Valid UUID. Non-null and immutable after creation.                                                                                                           |
| ActivityID       | Reference (Activity)        | Yes      | None                                                 | Target activity for this participation/request record.           | References valid `ActivityID`. Non-null. Cascade-deleted when the activity is hard-deleted.                                                                  |
| StudentAccountID | Reference (Student Account) | Yes      | None                                                 | Student who joined or submitted the request.                     | References valid `StudentAccountID`. Non-null. Used to enforce no-duplicate join/request checks.                                                             |
| RecordType       | Enum                        | Yes      | None                                                 | Distinguishes actual participation from a join request.          | Allowed values: `request`, `participation`.                                                                                                                  |
| Status           | Enum                        | Yes      | `pending` for requests; `confirmed` for direct joins | Lifecycle state of the participation/request record.             | Allowed values: `pending`, `confirmed`, `declined`. `approved` maps to `confirmed`; `joined` maps to `RecordType = participation` plus `Status = confirmed`. |
| CreatedAt        | DateTime                    | Yes      | System-generated at creation                         | Timestamp for when the participation/request record was created. | ISO 8601. Non-null and immutable after creation.                                                                                                             |

#### Validation Notes

* Declined records are retained for traceability according to the updated source.
* Withdraw and leave flows hard-delete or make inactive the corresponding participation/request records in the current D\&P/H\&L model; they are workflow outcomes, not persisted `Participation.Status` values.
* A uniqueness constraint must prevent duplicate active request/participation records for the same `ActivityID` and `StudentAccountID`. Retained declined records must not accidentally block a later valid active record unless a future rule explicitly says so.
* Direct join creates `RecordType = participation`, `Status = confirmed`; approval request creates `RecordType = request`, `Status = pending`; approval converts or represents it as `RecordType = participation`, `Status = confirmed`; decline remains `RecordType = request`, `Status = declined`.

#### Open Questions

* Exact H\&L representation of pending-request consequences after a block is `To verify`.

### Block Relationship

**Description:** Directed record of one student blocking another student, with reciprocal enforcement across visibility, detail access, profile access, joining, and notifications.

**Module / Area:** Safety and Moderation / `DS-SM-001 Block Relationships`.

**Relationships:** Initiated by `Student Account` and targets another `Student Account`.

#### Attributes

| Attribute          | Type                        | Required | Default                      | Description                                        | Constraints / Notes                                                                   |
| ------------------ | --------------------------- | -------- | ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| BlockID            | UUID                        | Yes      | System-generated at creation | Unique identifier for a block relationship record. | Valid UUID. Non-null and immutable after creation.                                    |
| InitiatorAccountID | Reference (Student Account) | Yes      | None                         | Student account that initiated the block.          | References valid `StudentAccountID`. Non-null.                                        |
| BlockedAccountID   | Reference (Student Account) | Yes      | None                         | Student account that was blocked.                  | References valid `StudentAccountID`. Non-null. Must differ from `InitiatorAccountID`. |
| CreatedAt          | DateTime                    | Yes      | System-generated at creation | Timestamp for when the block was established.      | ISO 8601. Non-null and immutable after creation.                                      |

#### Validation Notes

* The record is directed, but current business enforcement is reciprocal for supported visibility and interaction effects.
* Blocking prevents activity feed visibility, activity detail access, profile detail exposure, new join/request interactions, and cross-user notification delivery.
* Existing shared participation is not automatically removed by a block.

#### Open Questions

* Duplicate block-pair prevention, including whether `(InitiatorAccountID, BlockedAccountID)` is unique, is `To verify`.
* Exact H\&L handling of pending requests after a new block is `To verify`.

### Report Record

**Description:** Submitted moderation report about a user or activity, including reporter, target, reason, details, campus scope, review state, admin outcome, and moderation action trace.

**Module / Area:** Safety and Moderation / `DS-SM-002 Report Records`.

**Relationships:** Scoped by `Campus`, submitted by `Student Account`, conditionally targets `Student Account` or `Activity`, and records review metadata for a campus admin identifier.

#### Attributes

| Attribute          | Type          | Required | Default        | Description                                                 | Constraints / Notes                                                                                                                                         |
| ------------------ | ------------- | -------- | -------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ReportID           | String / UUID | Yes      | Auto-generated | Unique identifier for the report record.                    | Likely primary key.                                                                                                                                         |
| ReporterAccountID  | String / UUID | Yes      | None           | Student account that submitted the report.                  | Existing Student Account ID. Relationship table treats this as required and non-null.                                                                       |
| TargetType         | Enum          | Yes      | None           | Indicates whether the report targets a user or an activity. | Allowed values: `user`, `activity`.                                                                                                                         |
| ReportedAccountID  | String / UUID | No       | Empty          | Reported user when `TargetType = user`.                     | Existing Student Account ID. Required only when `TargetType = user`; must be empty when `TargetType = activity`.                                            |
| ReportedActivityID | String / UUID | No       | Empty          | Reported activity when `TargetType = activity`.             | Existing `ActivityID`. Required only when `TargetType = activity`; must be empty when `TargetType = user`.                                                  |
| ReasonCode         | Enum          | Yes      | None           | Main reason for the report using predefined categories.     | Predefined report reason categories are `To verify`.                                                                                                        |
| Details            | Text          | No       | Empty          | Optional additional explanation from the reporter.          | Optional free text.                                                                                                                                         |
| CampusScopeID      | String / UUID | Yes      | None           | Campus scope in which the report must be reviewed.          | Existing `CampusID`. Relationship table treats this as required and non-null.                                                                               |
| SubmittedAt        | DateTime      | Yes      | Auto-generated | Timestamp for when the report was submitted.                | System timestamp.                                                                                                                                           |
| ReviewStatus       | Enum          | Yes      | submitted      | Current review state of the report.                         | Allowed values: `submitted`, `under_review`, `resolved`.                                                                                                    |
| ReviewOutcome      | Text / Enum   | No       | Empty          | Final decision or conclusion made by the campus admin.      | Null until reviewed. Final domain is `To verify`.                                                                                                           |
| ModerationAction   | Enum          | No       | Empty          | Moderation consequence decided after review, if any.        | First-skeleton values: `none`, `warn_user`, `suspend_user`, `ban_user`, `remove_activity`. Actual AP/H\&L consequences are executed by native workflows. |
| ReviewedByAdminID  | String / UUID / Opaque | No | Empty          | Admin identifier from runtime `AuthenticatedAdminContext` that reviewed the report. | Null until reviewed. This is not a foreign key to a canonical Campus Admin store. |
| ReviewedAt         | DateTime      | No       | Empty          | Timestamp for when the report review was completed.         | System timestamp; null until reviewed.                                                                                                                      |

#### Validation Notes

* Exactly one of `ReportedAccountID` and `ReportedActivityID` must be non-empty.
* If `TargetType = user`, `ReportedAccountID` is required and `ReportedActivityID` must be empty.
* If `TargetType = activity`, `ReportedActivityID` is required and `ReportedAccountID` must be empty.
* `Review Report` updates only `DS-SM-002`; bans, suspensions, and activity removals are routed to AP/H\&L native workflows.
* `Submit Report` stores target reference and campus scope in `DS-SM-002`. It does not perform a full `DS-HL-001` read; activity reports are accepted from already allowed activity context.
* `Review Report` may read `DS-HL-001` for current activity context. If the referenced activity no longer exists, the admin sees an unavailable/deleted target fallback.

#### Open Questions

* Exact report payload schema, including evidence fields, review notes, and action trace details, is `To verify`.
* Predefined domain for `ReasonCode` is `To verify`.
* Final domain for `ReviewOutcome` is `To verify`.

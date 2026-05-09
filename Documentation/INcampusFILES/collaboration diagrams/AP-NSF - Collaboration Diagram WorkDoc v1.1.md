# Collaboration Diagram WorkDoc v1.1 — Jacopo / Access and Profile + Notifications and System Flow

# Version Log

| Version | Date       | Diagram                                            | Change                               | Reason                                  | Source                                                   |
| ------- | ---------- | -------------------------------------------------- | ------------------------------------ | --------------------------------------- | -------------------------------------------------------- |
| 1.0     | 2026-05-07 | Sign Up and Select Campus                          | Initial collaboration diagram draft. | Derived from existing sequence diagram. | Sequence Diagram AP + DUC-AP-01/03/04 + CRUD Matrix v1.5 |
| 1.0     | 2026-05-07 | Notification Event Handling (JoinRequestSubmitted) | Initial collaboration diagram draft. | Derived from existing sequence diagram. | Sequence Diagram NSF + DUC-NSF-01 + CRUD Matrix v1.5     |
| 1.1   | 2026-05-08 | Sign Up and Select Campus                          | Added MVP campus insight consent update and `CampusInsightSharingConsent` write to `DS-AP-001`; clarified refusal/revocation does not block normal app usage. | Align onboarding collaboration with accepted Admin Insights/consent decisions before first code skeleton. | Final documentation review + team decisions 2026-05-08 |
| 1.1   | 2026-05-08 | Notification Event Handling (JoinRequestSubmitted) | Aligned event payload fields with first-skeleton internal event catalog; clarified pending request withdrawal has no NSF handler and no `DS-NS-001` record. | Prevent notification-producing withdrawal behavior and keep NSF ownership boundaries clear. | Final documentation review + team decisions 2026-05-08 |

## Assigned Subsystems

* Access and Profile (AP)
* Notifications and System Flow (NSF)

## Source Sequence Diagrams

| Sequence Diagram                                                      | Related Collaboration Diagram                                              | Status | Notes                                                                                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sign Up and Select Campus — Sequence Diagram                          | Sign Up and Select Campus — Collaboration Diagram v1.1                          | Corrected  | Covers onboarding chain plus MVP consent capture/update; exact UI placement remains flexible.                                 |
| Notification Event Handling (JoinRequestSubmitted) — Sequence Diagram | Notification Event Handling (JoinRequestSubmitted) — Collaboration Diagram v1.1 | Corrected  | Shows NSF event handling for an accepted notification-producing event; pending request withdrawal is explicitly excluded. |

## Cross-Subsystem Notes

* Sign Up and Select Campus reads DS-CA-001 (owned by Campus Administration). AP does not create or modify campus records. This cross-subsystem read is preserved as-is from the sequence diagram.
* Sign Up and Select Campus writes selected campus and `CampusInsightSharingConsent` to `DS-AP-001 Student Account`. Consent may be collected during onboarding/registration or later in account/profile settings; refusal or revocation does not block normal app usage.
* Notification Event Handling reads DS-HL-001 and DS-HL-002 (owned by Hosting and Lifecycle). NSF does not modify these stores.
* Notification Event Handling reads DS-SM-001 (owned by Safety and Moderation). NSF does not modify block records.
* Notification Event Handling writes only to DS-NS-001, owned by NSF. No other store is modified.
* The JoinRequestSubmitted event is emitted by Discovery and Participation (Matteo's subsystem). The collaboration diagram shows NSF consuming it, not D\&P emitting it.
* Accepted first-skeleton NSF events are `DirectJoinCompleted`, `JoinRequestSubmitted`, `JoinRequestApproved`, `JoinRequestDeclined`, `JoinedParticipantLeft`, `ActivityCancelled`, and `ActivityReminderDue`.
* `PendingRequestWithdrawn`, if ever emitted internally, is non-notifying for the first skeleton: no NSF handler and no `DS-NS-001` record.
* Opening a notification is read-only in the first skeleton; no read/unread state is modeled on `DS-NS-001`.

## Open Points

* Assumption for modeling only: Return messages are not numbered as separate messages in the collaboration diagrams. Only directional forward messages carry a message number, consistent with UML 1.x collaboration diagram notation.
* Assumption for modeling only: Conditional branches (domain unsupported, host inactive, block exists) are shown as guarded messages on the relevant link, not as separate alt boxes.
* Assumption for modeling only: DS-AP-001 appears on two distinct links in the Sign Up diagram (from AccountActivationService and from CampusAssociationService). It is modeled as a single node with multiple numbered messages on each incoming link.
* Unresolved: Exact verification mechanism (email link, code, SSO) is modeled abstractly. Preserved from sequence diagram.
* Unresolved: Exact notification delivery channel is not fixed. Preserved from sequence diagram.
* Unresolved: Exact consent UI placement remains flexible. The MVP capability and AP ownership of `CampusInsightSharingConsent` are no longer unresolved.

***

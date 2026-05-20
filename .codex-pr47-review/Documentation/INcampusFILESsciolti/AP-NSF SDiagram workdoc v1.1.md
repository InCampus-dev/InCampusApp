# AP-NSF SDiagram workdoc v1.1

# Version Log

| Version | Date       | Diagram                                            | Change                          | Reason                                              | Source                                             |
| ------- | ---------- | -------------------------------------------------- | ------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| 1.0     | 2026-05-04 | Sign Up and Select Campus                          | Initial sequence diagram draft. | First design translation from use case realization. | DUC-AP-01, DUC-AP-03, DUC-AP-04 + CRUD Matrix v1.5 |
| 1.0     | 2026-05-04 | Notification Event Handling (JoinRequestSubmitted) | Initial sequence diagram draft. | First design translation from use case realization. | DUC-NSF-01 + CRUD Matrix v1.5                      |
| 1.1   | 2026-05-08 | Sign Up and Select Campus                          | Added DUC-AP-07 consent handling and stored `CampusInsightSharingConsent` on `DS-AP-001`. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |
| 1.1   | 2026-05-08 | Notification Event Handling (JoinRequestSubmitted) | Aligned internal event payloads, notification ownership, pending-withdraw suppression, and read-only opening rule. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Assigned Subsystems

* Access and Profile (AP)
* Notifications and System Flow (NSF)

## Diagrams Produced

| Diagram                                            | Related Use Case                | Status | Notes                                                                                                                                                            |
| -------------------------------------------------- | ------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign Up and Select Campus                          | DUC-AP-01, DUC-AP-03, DUC-AP-04, DUC-AP-07 | v1.1  | Covers onboarding, campus selection, Student Profile setup, and optional/updateable campus insight consent. |
| Notification Event Handling (JoinRequestSubmitted) | DUC-NSF-01                      | v1.1  | Models the `JoinRequestSubmitted` event path with first-skeleton event payload fields and NSF-only notification creation. |

## Cross-Subsystem Notes

* Sign Up and Select Campus reads DS-CA-001 (owned by Campus Administration) to retrieve the campus list during onboarding. AP does not create or modify campus records.
* `CampusInsightSharingConsent` is owned by AP and stored on `DS-AP-001 Student Account`; refusal or later revocation does not block normal app usage.
* Notification Event Handling reads DS-HL-001 and DS-HL-002 (owned by Hosting and Lifecycle) for activity and participation context. NSF does not modify these stores.
* Notification Event Handling reads DS-SM-001 (owned by Safety and Moderation) for block suppression. NSF does not modify block records.
* The JoinRequestSubmitted event is emitted by Discovery and Participation (Matteo's subsystem). This diagram shows NSF consuming it, not D\&P emitting it. The D\&P emission side is covered in Matteo's Join Activity Sequence Diagram.
* Pending request withdrawal is non-notifying for the first skeleton: no NSF handler and no `DS-NS-001 Notification Record`.
* Opening a notification remains read-only in the first skeleton. No read/unread state is modeled on `DS-NS-001`.

## Open Points

* Unresolved: Exact verification mechanism (email link, code entry, SSO redirect) is modeled abstractly as a verification token exchange.
* Unresolved: Exact onboarding/settings UI placement for consent is not fixed. Consent collection/update is MVP and may appear during onboarding/registration or account/profile settings.
* Unresolved: Exact notification delivery channel (push, in-app, or both) is not fixed. Entity catalog defaults to PushAndInApp.
* First-skeleton event payloads are now specified as internal contracts: ordinary activity/participation events carry `eventId`, `eventType`, `occurredAt`, `activityId`, `triggeringAccountId`, plus `participationId` and `outcome` when applicable. `ActivityReminderDue` carries `eventId`, `eventType`, `occurredAt`, `activityId`, `scheduledStartAt`, and `reminderThresholdMinutes`.
* Assumption for modeling only: Single-campus auto-confirm scenario (alternate A1 in Select Campus narrative) is not shown in the main sequence flow.

***

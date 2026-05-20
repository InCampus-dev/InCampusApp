# SM-CA SDiagram workdoc v1.1

# Sequence Diagram WorkDoc v1.1 — Francesco / Safety and Moderation + Campus Administration

## Version Log

| Version | Date       | Diagram                                   | Change                          | Reason                                              | Source                        |
| ------- | ---------- | ----------------------------------------- | ------------------------------- | --------------------------------------------------- | ----------------------------- |
| 1.0     | 2026-05-04 | Report and Review Report Sequence Diagram | Initial sequence diagram draft. | First design translation from use case realization. | UCR - S\&M v1.2 + CRUD Matrix |
| 1.0     | 2026-05-04 | Configure New Campus Sequence Diagram     | Initial sequence diagram draft. | First design translation from use case realization. | UCR - C\&A + CRUD Matrix      |
| 1.1   | 2026-05-08 | Report and Review Report Sequence Diagram | Aligned submit/review target-validation boundary, `AuthenticatedAdminContext`, Student Profile naming, and moderation routing. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |
| 1.1   | 2026-05-08 | Configure New Campus Sequence Diagram     | Reframed admin authorization as runtime `AuthenticatedAdminContext` with no admin store. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |
| 1.1   | 2026-05-08 | View Consent-Based Student Insights Sequence Diagram | Added MVP admin-only, campus-scoped, consent-gated read-only insight flow over existing stores. | Required before first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Assigned Subsystems

* Safety and Moderation
* Campus Administration

## Diagrams Produced

| Diagram                                   | Related Use Case                       | Status | Notes                                                                                             |
| ----------------------------------------- | -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Report and Review Report Sequence Diagram | Report User or Activity; Review Report | v1.1  | Combines report submission with admin review; submission stores target reference/campus scope without submit-time `DS-HL-001` reads. |
| Configure New Campus Sequence Diagram     | Configure New Campus                   | v1.1  | Shows campus setup with runtime admin authorization and no new admin store. |
| View Consent-Based Student Insights Sequence Diagram | View Consent-Based Student Insights | v1.1 | Shows MVP consent-gated, read-only insight access over `DS-AP-001`, `DS-AP-002`, `DS-HL-001`, and `DS-HL-002`. |

## Cross-Subsystem Notes

* Report Review may trigger AP/H\&L native workflows through targeted internal commands.
* SM must not directly ban accounts or delete activities.
* `ModerationAction = none | warn_user | suspend_user | ban_user | remove_activity`; `remove_activity` is recorded by SM but executed through H\&L-native workflow.
* SM owns report truth in DS-SM-002 and block truth in DS-SM-001.
* CA owns campus configuration and structured options.
* Campus Admin identity is represented as runtime `AuthenticatedAdminContext` (`adminId`, `email`, `role`, `authorizedCampusIds`, `selectedCampusId`), not as a canonical data store.
* CA must not create student accounts, activities, participations, reports, blocks, or notification records.
* CA does not own AP/H\&L data. Admin Insights use read-only, consent-gated, campus-scoped access to existing AP/H\&L stores.
* CampusID is the tenant boundary created by the campus configuration flow.

## Open Points

* Unresolved: exact campus admin authentication implementation remains provisional behind `AuthenticatedAdminContext`.
* Unresolved: exact evidence schema and admin insight aggregation/presentation remain provisional.
* Unresolved: exact campus setup fields and validation rules beyond the currently modeled inputs.

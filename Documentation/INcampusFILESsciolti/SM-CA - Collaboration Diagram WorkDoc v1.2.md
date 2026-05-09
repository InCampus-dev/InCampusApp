# Collaboration Diagram WorkDoc v1.2

# Collaboration Diagram WorkDoc v1.2 — Francesco / Safety and Moderation + Campus Administration

## Version Log

| Version | Date       | Diagram                                        | Change                                                                       | Reason                                                                              | Source                                                                             |
| ------- | ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1.0     | 2026-05-06 | Report and Review Report Collaboration Diagram | Initial collaboration diagram draft.                                         | Derived from existing SM sequence diagram without changing modeled logic.           | Report and Review Report Sequence Diagram + Sequence Diagram WorkDoc + CRUD Matrix |
| 1.0     | 2026-05-06 | Configure New Campus Collaboration Diagram     | Initial collaboration diagram draft.                                         | Derived from existing CA sequence diagram without changing modeled logic.           | Configure New Campus Sequence Diagram + Sequence Diagram WorkDoc + CRUD Matrix     |
| 1.1     | 2026-05-06 | Report and Review Report Collaboration Diagram | Split into compact submission, review-context, and review-outcome SVG views. | Improve readability while preserving the latest ownership and data-store decisions. | Report and Review Report Sequence Diagram + latest collaboration review notes      |
| 1.1     | 2026-05-06 | Configure New Campus Collaboration Diagram     | Split into compact validation and creation SVG views.                        | Simplify the object graph and merge low-level option-seeding detail.                | Configure New Campus Sequence Diagram + latest collaboration review notes          |
| 1.2   | 2026-05-08 | Report and Review Report Collaboration Diagram | Added `AuthenticatedAdminContext`, final moderation-action vocabulary, unavailable/deleted target fallback, and explicit AP/H\&L native consequence routing. | Align report submission/review boundary and moderation ownership before the first code skeleton. | Final documentation review + team decisions 2026-05-08 |
| 1.2   | 2026-05-08 | Configure New Campus Collaboration Diagram     | Clarified admin authorization as runtime `AuthenticatedAdminContext` and reaffirmed that CA writes only `DS-CA-001` and `DS-CA-002`. | Prevent accidental introduction of a Campus Admin data store. | Final documentation review + team decisions 2026-05-08 |
| 1.2   | 2026-05-08 | View Consent-Based Student Insights Collaboration Diagram | Added the missing MVP Admin Insights collaboration view using existing stores with read-only, consent-gated, campus-scoped access. | Admin Insights are MVP and must be represented before code skeleton generation. | Final documentation review + team decisions 2026-05-08 |

## Assigned Subsystems

* Safety and Moderation
* Campus Administration

## Source Sequence Diagrams

| Sequence Diagram                          | Related Collaboration Diagram                  | Status   | Notes                                                                                                                                |
| ----------------------------------------- | ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Report and Review Report Sequence Diagram | Report and Review Report Collaboration Diagram v1.1 | Corrected + rendered | Preserves student report submission, campus-admin review through `AuthenticatedAdminContext`, and optional AP/H\&L native consequence dispatch across compact SVG views. |
| Configure New Campus Sequence Diagram     | Configure New Campus Collaboration Diagram v1.1     | Corrected + rendered | Preserves campus setup, runtime admin authorization, CampusID creation, and initial campus option seeding across compact SVG views.                               |
| DUC-CA-03 accepted MVP flow               | View Consent-Based Student Insights Collaboration Diagram v1.1 | Added + rendered | Adds missing admin-only, campus-scoped, consent-gated read-only insight access over existing stores. |

## Package Contents

| File                                                     | Purpose                                                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Report and Review Report Collaboration Diagram v1.1.md` | Corrected traceable markdown page with participants, numbered messages, PlantUML code, and review notes. |
| `Report and Review Report Collaboration Diagram v1.1.svg` | Rendered report-submission collaboration view. |
| `Report and Review Report Collaboration Diagram v1.1_001.svg` | Rendered report-review access/context collaboration view. |
| `Report and Review Report Collaboration Diagram v1.1_002.svg` | Rendered report-review outcome/delegation collaboration view. |
| `Configure New Campus Collaboration Diagram v1.1.md` | Corrected traceable markdown page with participants, numbered messages, PlantUML code, and review notes. |
| `Configure New Campus Collaboration Diagram v1.1.svg` | Rendered setup authorization/validation collaboration view. |
| `Configure New Campus Collaboration Diagram v1.1_001.svg` | Rendered campus/options creation collaboration view. |
| `View Consent-Based Student Insights — Collaboration Diagram v1.1.md` | Traceable markdown page for accepted MVP Admin Insights collaboration. |
| `View Consent-Based Student Insights — Collaboration Diagram v1.1.svg` | Rendered admin insight collaboration view. |

## Render Status

* PlantUML source files are included for both collaboration diagram packages.
* Rendered SVG images are saved in this folder beside the `.puml` and `.md` pages.
* The diagrams use object-only PlantUML syntax for compatibility with object/collaboration previews.
* Report and Review Report renders as three compact SVG views because the single combined graph was unreadable.
* Configure New Campus renders as two compact SVG views because the validation and creation responsibilities are clearer when separated.
* View Consent-Based Student Insights renders as one compact SVG view.

## Cross-Subsystem Notes

* Campus-admin flows use `AuthenticatedAdminContext` as a runtime/admin-auth context, not as a data store.
* Report Review may trigger AP/H\&L native workflows through targeted internal commands.
* SM must not directly ban accounts or delete activities.
* SM owns report truth in `DS-SM-002 Report Records`.
* `ModerationAction = none | warn_user | suspend_user | ban_user | remove_activity`.
* `remove_activity` is recorded by SM as the selected action, while execution is delegated to H\&L native workflow.
* SM does not create a `DS-NS-001 Notification Records` entry in the source sequence diagram.
* CA owns campus configuration and structured options.
* CA must not create or mutate student accounts, student profiles, activities, participations, reports, blocks, or notification records.
* `CampusID` is the tenant boundary created by the campus configuration flow.
* Admin Insights are CA-facing but do not make CA owner of AP/H\&L data; insight reads are read-only, campus-scoped, and consent-gated.

## Data Store Consistency Notes

| Flow                 | Reads                                                                                  | Creates / Updates                                              | Explicit Non-Mutations                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Report submission    | `DS-AP-001`, conditional `DS-AP-002`                                                   | Creates `DS-SM-002` only when validation succeeds.             | Does not read or mutate H\&L/NSF stores; activity reports carry an activity target reference from the allowed launch context. |
| Report review        | `DS-SM-002`, conditional `DS-AP-001`, conditional `DS-AP-002`, conditional `DS-HL-001` | Updates `DS-SM-002` only.                                      | Account/activity consequences are routed to AP/H\&L native workflows; no direct AP/H\&L/NSF mutation.                         |
| Configure new campus | None modeled before authorization/validation services return.                          | Creates `DS-CA-001` and `DS-CA-002` after validation succeeds. | Does not mutate AP, H\&L, SM, or NSF stores.                                                                                  |
| View consent-based student insights | `DS-CA-001`, `DS-AP-001`, conditional `DS-AP-002`, conditional `DS-HL-001`, conditional `DS-HL-002` | None. | No new store; no AP/H\&L writes; identifiable insight denied when authorization or consent fails. |

## Open Points

* Resolved for first skeleton: campus admin identity is represented by runtime `AuthenticatedAdminContext`; exact authentication implementation remains provisional.
* Resolved for first skeleton: moderation action vocabulary is `none | warn_user | suspend_user | ban_user | remove_activity`; exact evidence schema remains unresolved.
* Unresolved: exact report reporter-feedback and reported-party notification behavior.
* Resolved for this collaboration package: submit-time activity-target reports do not read `DS-HL-001`, following CRUD Matrix v1.5 and the latest SM DFD notes rather than the older sequence-diagram branch.
* Unresolved: exact campus setup fields and validation rules beyond the currently modeled inputs.
* Unresolved: exact aggregate shape and display copy for consent-based Admin Insights.

## Review Checklist

* The collaboration diagrams are derived from the existing SM + CA sequence diagrams.
* Actors, boundary objects, services, modules, repositories, and data stores preserve the sequence diagrams.
* Message numbers follow the original sequence order, with branch suffixes for alternatives and optional paths.
* Data-store access is consistent with the CRUD Matrix baseline used by the source sequence diagrams.
* Cross-subsystem ownership is preserved: SM delegates AP/H\&L consequences, and CA does not mutate downstream stores.

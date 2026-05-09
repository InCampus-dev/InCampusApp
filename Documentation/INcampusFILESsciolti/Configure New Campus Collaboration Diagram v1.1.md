# Configure New Campus Collaboration Diagram v1.1

# Configure New Campus - Collaboration Diagram v1.1

![](<assets/Configure New Campus Collaboration Diagram v1.1.svg>)

![](<assets/Configure New Campus Collaboration Diagram v1.1_001.svg>)

## Version Log

| Version | Date | Diagram | Change | Reason | Source |
|---|---|---|---|---|---|
| 1.1 | 2026-05-08 | Configure New Campus | Clarified admin authorization as runtime `AuthenticatedAdminContext`, reaffirmed no Campus Admin store, and preserved CA-only writes to `DS-CA-001` and `DS-CA-002`. | Required before using collaboration diagrams as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

## Purpose

This collaboration diagram package is derived from `Configure New Campus Sequence Diagram`. For readability, the use case realization is split into two compact object-communication views: setup authorization/validation and campus/options creation. Together they preserve the same campus setup meaning, runtime admin authorization, CampusID tenant-boundary creation, and CA-owned option seeding without reproducing low-level sequence returns.

## Source Sequence Diagram

* `Sequence Diagrams/SM + CA/Configure New Campus Sequence Diagram.md`
* `Sequence Diagrams/SM + CA/configureNewCampus.plum`

## Related Use Case Realization

* DUC-CA-01 — Configure New Campus

## Related Requirements

FR: \[FR-2301, FR-2302]
NFR: \[NFR-37, NFR-38]

## Participants / Objects

| Object                              | Type       | Responsibility                                                              |
| ----------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Campus Admin                        | Actor      | Starts and confirms the guided campus setup workflow through `AuthenticatedAdminContext`. |
| CampusSetupWizardScreen             | Boundary   | Captures campus setup fields and initial structured options.                |
| CampusConfigurationController       | Control    | Coordinates authorization, validation, campus creation, and result return.  |
| CampusAuthorizationService          | Service    | Verifies runtime `AuthenticatedAdminContext` authorization for campus setup. |
| CampusConfigurationService          | Service    | Validates campus setup fields at a high level.                              |
| CampusOptionsService                | Service    | Validates initial categories, locations, or meeting points at a high level. |
| DS-CA-001 Campus Configuration      | Data Store | Stores the created campus record and generated CampusID.                    |
| DS-CA-002 Campus Structured Options | Data Store | Stores initial campus-scoped category and location option records.          |

## Message Sequence

### Phase 1 — Setup Authorization and Validation

| No. | Source                        | Destination                   | Message          |
| --- | ----------------------------- | ----------------------------- | ---------------- |
| 1   | Campus Admin                  | CampusSetupWizardScreen       | start setup      |
| 2   | CampusSetupWizardScreen       | CampusConfigurationController | submit config    |
| 3   | CampusConfigurationController | CampusAuthorizationService    | authorize(`AuthenticatedAdminContext`) |
| 4   | CampusConfigurationController | CampusConfigurationService    | validate campus  |
| 5   | CampusConfigurationController | CampusOptionsService          | validate options |

### Phase 2 — Campus and Option Creation

| No. | Source                        | Destination                         | Message        |
| --- | ----------------------------- | ----------------------------------- | -------------- |
| 6   | CampusConfigurationController | DS-CA-001 Campus Configuration      | create campus  |
| 7   | CampusConfigurationController | DS-CA-002 Campus Structured Options | create options |
| 8   | CampusConfigurationController | CampusSetupWizardScreen             | setup result   |
| 9   | CampusSetupWizardScreen       | Campus Admin                        | result         |

## Rendered SVG Outputs

* `Configure New Campus Collaboration Diagram v1.1.svg` — setup authorization and validation view.
* `Configure New Campus Collaboration Diagram v1.1_001.svg` — campus and structured-options creation view.

## PlantUML Code

```
@startuml
title Configure New Campus Validation - Collaboration Diagram

left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam dpi 180
skinparam nodesep 80
skinparam ranksep 80
skinparam defaultFontName Helvetica
skinparam ArrowFontSize 11
skinparam ObjectFontSize 12

object "Campus Admin\n(AuthenticatedAdminContext)" as Admin <<Actor>>

package "Campus Administration" {
  object "CampusSetupWizardScreen" as SetupUI <<Boundary>>
  object "CampusConfigurationController" as Controller <<Control>>
  object "CampusAuthorizationService" as Authorization <<Service>>
  object "CampusConfigurationService" as CampusService <<Service>>
  object "CampusOptionsService" as OptionsService <<Service>>
}

Admin --> SetupUI : 1: start setup\nwith runtime admin context
SetupUI --> Controller : 2: submit config
Controller --> Authorization : 3: authorize(AuthenticatedAdminContext)
Controller --> CampusService : 4: validate campus
Controller --> OptionsService : 5: validate options

note bottom of Controller
Authorization or validation failure stops before campus creation.
Low-level validation details are intentionally collapsed.
AuthenticatedAdminContext is runtime/admin-auth context,
not a canonical data store.
end note

@enduml


@startuml
title Configure New Campus Creation - Collaboration Diagram

left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam dpi 180
skinparam nodesep 80
skinparam ranksep 80
skinparam defaultFontName Helvetica
skinparam ArrowFontSize 11
skinparam ObjectFontSize 12

object "Campus Admin\n(AuthenticatedAdminContext)" as Admin <<Actor>>

package "Campus Administration" {
  object "CampusSetupWizardScreen" as SetupUI <<Boundary>>
  object "CampusConfigurationController" as Controller <<Control>>
  object "DS-CA-001\nCampus Configuration" as CampusStore <<Data Store>>
  object "DS-CA-002\nCampus Structured Options" as OptionsStore <<Data Store>>
}

Controller --> CampusStore : 6: create campus
Controller --> OptionsStore : 7: create options
Controller --> SetupUI : 8: setup result
SetupUI --> Admin : 9: result

note bottom of CampusStore
Created CampusID becomes the tenant boundary.
CA creates only DS-CA-001 and DS-CA-002 in this flow.
No AP, H&L, SM, or NSF store is mutated.
No DS-CA-003 or Campus Admin store is introduced.
end note

@enduml
```

## Notes for Review

* The original combined view was split into validation and creation views because the single object graph was visually stretched and harder to scan.
* The diagram intentionally omits low-level return messages such as `authorized`, `created CampusID`, and option identifiers.
* Initial category and location creation is collapsed into `create options`.
* Authorization and validation failures are represented as a note instead of full branches.
* `CampusID` remains the tenant boundary created by the campus configuration flow.
* CA creates only `DS-CA-001` and `DS-CA-002`; no AP, H\&L, SM, or NSF store is mutated.
* Campus Admin identity is represented by runtime `AuthenticatedAdminContext` (`adminId`, `email`, `role`, `authorizedCampusIds`, `selectedCampusId`), not by a canonical data store.
* Open points inherited from the source material: exact campus setup fields, setup validation rules, and admin authentication implementation details.

# UCR - C\&A v1.1

## Version Log

| Version | Date | Section modified | Description of change | Reason for change | Source document used as reference |
| --- | --- | --- | --- | --- | --- |
| 1.1 | 2026-05-08 | Admin Insights; admin authorization; store boundaries | Added MVP `DUC-CA-03 — View Consent-Based Student Insights`, modeled Campus Admin identity as runtime `AuthenticatedAdminContext`, preserved CA ownership of only `DS-CA-001` and `DS-CA-002`, and clarified consent-gated read-only AP/H&L access without a new admin store. | Required before using the UCR as input for the first code architecture skeleton. | Final documentation review + team decisions 2026-05-08 |

Candidate API paths, controller names, service names, and sequence filenames in this UCR are first-skeleton scaffolding unless explicitly accepted elsewhere as final contracts.

# Subsystem: Campus Administration

## 1. Subsystem Responsibility

The Campus Administration subsystem provides the structural configuration layer for INCAMPUS. It lets authorized campus admins configure a campus and maintain the campus-specific structured options used by downstream student flows, especially activity categories and campus locations or meeting points. It also provides the MVP admin-only, consent-gated, read-only entry point for campus-scoped student insights.

Campus Administration does not own student accounts, student profiles, activities, activity participations, reports, block relationships, or notification records. It exports campus configuration and option truth to other modules.

## 2. Owned Data Stores

Owned stores:

* `DS-CA-001 Campus Configuration` - core configured campus record, university association, campus name, and activation status.
* `DS-CA-002 Campus Structured Options` - campus-specific structured options, including activity categories and campus locations or meeting points.

## 3. External Data Dependencies

External dependencies for campus setup and option management:

* None. Campus Administration is an upstream configuration provider and does not read AP, H\&L, SM, or NSF stores during campus setup or option management.

External dependencies for MVP Admin Insights:

* `DS-AP-001 Student Account` - read to validate campus scope and `CampusInsightSharingConsent`.
* `DS-AP-002 Student Profile` - read-only, conditional on authorization and consent, limited to allowed minimal public profile/interest insight data.
* `DS-HL-001 Activities` - read-only, conditional on authorization and consent, limited to allowed activity insight context.
* `DS-HL-002 Activity Participations` - read-only, conditional on authorization and consent, limited to allowed participation insight context.

Downstream consumers:

* AP reads `DS-CA-001` during campus selection and stores the student's selected campus in AP-owned account state.
* H\&L reads `DS-CA-002` during activity creation to validate campus-specific categories and meeting points.
* D\&P depends on campus scope from the selected campus context when composing feeds and activity views.

Campus Admin identity is represented as `AuthenticatedAdminContext`, a runtime/admin-auth context with `adminId`, `email`, `role`, `authorizedCampusIds`, and `selectedCampusId`. It is not a database table or canonical store. Exact admin authentication implementation remains provisional, and no additional CA store is introduced.

## 4. Use Case Realizations

# DUC-CA-01 — Configure New Campus

## Source Use Case

Configure New Campus

## Related Requirements

FR: `FR-2301`, `FR-2302`NFR: `NFR-37`, `NFR-38`

## Implementation Goal

Allow an authorized campus admin to configure a new campus through guided setup, creating the campus configuration and its initial campus-specific structured options without requiring a new system version.

## Boundary Objects

* `CampusSetupWizardScreen`
* `CampusConfigurationScreen`
* `InitialCampusOptionsStep`

## Control Objects / Services

* `CampusConfigurationController`
* `CampusConfigurationService`
* `CampusOptionsService`
* `CampusAuthorizationService`

## Entity Objects / Data Stores

* `Campus` / `DS-CA-001 Campus Configuration`
* `CampusLocation` / `DS-CA-002 Campus Structured Options`
* `ActivityCategory` / `DS-CA-002 Campus Structured Options`

## Candidate Client-Facing API

| Method + Path          | Purpose                                                            | Input                                                                                                         | Output                                                            | Reads        | Writes                   | Events / Notes                                      |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------ | ------------------------ | --------------------------------------------------- |
| `POST /admin/campuses` | Creates a new campus configuration and initial structured options. | Authenticated campus admin context, campus setup fields, initial categories, initial locations/meeting points | Created `campusId`, activation status, created option identifiers | None modeled | `DS-CA-001`, `DS-CA-002` | No event. Campus setup is a direct admin operation. |

## Main Design Flow

1. `CampusSetupWizardScreen` receives the campus admin's request to configure a new campus.
2. `CampusConfigurationController` coordinates the use case inside the Campus Administration module.
3. `CampusAuthorizationService` verifies that the actor is allowed to perform new-campus setup. The exact admin identity mechanism is unresolved.
4. `CampusConfigurationService` validates the known setup inputs such as university association, campus name, and activation/completion state.
5. `CampusOptionsService` validates the initial campus-specific categories and locations or meeting points supplied during the guided workflow.
6. The CA module creates the campus record in `DS-CA-001 Campus Configuration`.
7. The CA module creates the initial structured option records in `DS-CA-002 Campus Structured Options`, scoped to the new `CampusID`.
8. The boundary object returns the configuration result to the admin.
9. Downstream modules read the new configuration later through their own flows; CA does not push notifications or mutate downstream stores.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Campus admin operations must be limited to the admin's authorized scope.
* Campus setup must be configuration-driven, not a new application version.
* `CampusID` is the tenant boundary for the campus and its options.
* Initial structured options must belong to the created campus.
* Campus locations and activity categories are typed uses of `DS-CA-002`, not separate stores.
* Interactive map upload or geographic map management is not required for MVP.
* Exact setup fields, step order, and validation rules remain unresolved.

## Postconditions in Design Terms

* `DS-CA-001 Campus Configuration` contains a new campus record.
* `DS-CA-002 Campus Structured Options` contains initial campus-scoped category and location/meeting-point records.
* The campus can be made available to AP and H\&L through existing read dependencies.
* No AP, H\&L, SM, or NSF store is mutated by CA.

## Related Diagrams Suggested

* Sequence diagram: `configure_new_campus_sequence`

## Open Points / Assumptions

* Unresolved: exact campus setup fields, setup step order, validation rules, and admin authorization model.
* Out of MVP: interactive campus map management.

# DUC-CA-02 — Manage Campus Structured Options

## Source Use Case

Manage Campus Structured Options

## Related Requirements

FR: `FR-0301`, `FR-0304`, `FR-2302`NFR: `NFR-39`, `NFR-40`

## Implementation Goal

Allow an authorized campus admin to view, create, update, and remove campus-specific structured options so students and hosts in that campus receive relevant activity categories and meeting-point choices.

## Boundary Objects

* `AuthorizedCampusSelector`
* `CampusOptionsManagementScreen`
* `CampusOptionEditorDialog`

## Control Objects / Services

* `CampusOptionsController`
* `CampusOptionsService`
* `CampusAuthorizationService`
* `CampusOptionValidationService`

## Entity Objects / Data Stores

* `Campus` / `DS-CA-001 Campus Configuration`
* `CampusLocation` / `DS-CA-002 Campus Structured Options`
* `ActivityCategory` / `DS-CA-002 Campus Structured Options`

## Candidate Client-Facing API

| Method + Path                                                     | Purpose                                                            | Input                                                                                                  | Output                              | Reads                    | Writes      | Events / Notes                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------ | ----------- | -------------------------------------------------------------------------------------------- |
| `GET /admin/campuses/{campusId}/structured-options`               | Returns the current structured options for an authorized campus.   | Authenticated campus admin context, `campusId`, optional `optionType`                                  | Current categories and/or locations | `DS-CA-001`, `DS-CA-002` | None        | No event. Campus authorization is required.                                                  |
| `POST /admin/campuses/{campusId}/structured-options`              | Creates a campus-specific category or location option.             | Authenticated campus admin context, `campusId`, `optionType`, label/name, optional description, status | Created option record               | `DS-CA-001`, `DS-CA-002` | `DS-CA-002` | No event. Option belongs only to the target campus.                                          |
| `PATCH /admin/campuses/{campusId}/structured-options/{optionId}`  | Updates an existing campus-specific category or location option.   | Authenticated campus admin context, `campusId`, `optionId`, changed fields                             | Updated option record               | `DS-CA-001`, `DS-CA-002` | `DS-CA-002` | No event. Existing activities keep their stored references/snapshot labels under H\&L rules. |
| `DELETE /admin/campuses/{campusId}/structured-options/{optionId}` | Removes a campus-specific structured option from future selection. | Authenticated campus admin context, `campusId`, `optionId`                                             | Removal confirmation                | `DS-CA-001`, `DS-CA-002` | `DS-CA-002` | No event. Final delete-versus-deactivate behavior for in-use options remains to verify.      |

## Main Design Flow

1. `AuthorizedCampusSelector` presents only campuses the current campus admin is allowed to manage.
2. `CampusOptionsManagementScreen` receives the admin's selected campus and option-management action.
3. `CampusOptionsController` coordinates the request inside the Campus Administration module.
4. `CampusAuthorizationService` validates that the admin is authorized for the selected `CampusID`.
5. The module reads `DS-CA-001 Campus Configuration` to verify the targeted campus context.
6. The module reads `DS-CA-002 Campus Structured Options` to display or validate current options for that campus.
7. `CampusOptionValidationService` validates the option type, campus ownership, required label/name fields, and any duplicate or status rule that is currently defined.
8. `CampusOptionsService` creates, updates, or removes records in `DS-CA-002`.
9. The boundary object displays the updated campus option state to the admin.
10. H\&L reads the updated `DS-CA-002` option set later during activity creation; CA does not mutate existing activities.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Campus admin operations must be limited to campuses the admin is authorized to manage.
* Structured options must belong to the selected `CampusID`.
* Changes must apply only to the targeted campus configuration.
* Activity categories and campus locations are typed option records in `DS-CA-002`, not separate stores.
* CA does not update existing activities, participations, reports, blocks, student accounts, profiles, or notifications.
* Activity creation uses `DS-CA-002` later to validate category and meeting-point selection.
* Exact validation rules, duplicate handling, and delete-versus-deactivate behavior are unresolved.

## Postconditions in Design Terms

* `DS-CA-002 Campus Structured Options` contains the created, updated, or removed option state for the targeted campus.
* Existing downstream student flows will read the updated option set when they next query CA-owned stores.
* No notification event is emitted and no `DS-NS-001` record is created.

## Related Diagrams Suggested

* Sequence diagram: `manage_campus_structured_options_sequence`

## Open Points / Assumptions

* Assumption for modeling only: this use case supports both initial setup reuse and ongoing campus-option maintenance.
* Unresolved: exact option validation rules, duplicate-name scope, and behavior for options already referenced by existing activities.

# DUC-CA-03 — View Consent-Based Student Insights

## Source Use Case

View Consent-Based Student Insights

## Related Requirements

FR: `FR-2902`, `FR-2903`  
NFR: `NFR-45`, `NFR-46`, `NFR-47`

## Implementation Goal

Allow an authorized Campus Admin to request limited, identifiable student insight data for the selected campus only when the student's `CampusInsightSharingConsent` is true. The flow is admin-only, campus-scoped, read-only over AP/H&L stores, and does not introduce a new Campus Admin database.

## Boundary Objects

* `AdminPortal`
* `ConsentBasedStudentInsightsScreen`

## Control Objects / Services

* `AdminInsightController`
* `CampusAuthorizationService`
* `ConsentGateService`
* `AdminInsightReadModelService`

## Entity Objects / Data Stores

* `AuthenticatedAdminContext` / runtime context only, not a persistent store
* `StudentAccount` / `DS-AP-001 Student Account`
* `StudentProfile` / `DS-AP-002 Student Profile`
* `Activity` / `DS-HL-001 Activities`
* `ActivityParticipation` / `DS-HL-002 Activity Participations`

## Candidate Client-Facing API

| Method + Path | Purpose | Input | Output | Reads | Writes | Events / Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /admin/campuses/{campusId}/student-insights` | Returns consent-based student insight data for an authorized campus. | `AuthenticatedAdminContext`, `campusId`, optional filters | Limited insight result or access denied | `DS-AP-001`, conditional `DS-AP-002`, `DS-HL-001`, `DS-HL-002` | None | Admin-only, campus-scoped, consent-gated, read-only. No new store and no notification event. |

## Main Design Flow

1. `AdminPortal` receives a Campus Admin request for student insight data for the selected campus.
2. `AdminInsightController` receives `AuthenticatedAdminContext` and the requested `CampusID`.
3. `CampusAuthorizationService` verifies that `selectedCampusId` is included in `authorizedCampusIds`.
4. `ConsentGateService` reads `DS-AP-001 Student Account` for the target student or eligible student set within the selected campus and checks `CampusInsightSharingConsent`.
5. If campus authorization fails, the request is denied.
6. If consent is false or revoked, identifiable insight access for that student is denied while normal student app usage remains unaffected.
7. If authorization and consent are valid, `AdminInsightReadModelService` performs limited read-only access to allowed data from `DS-AP-002 Student Profile`, `DS-HL-001 Activities`, and `DS-HL-002 Activity Participations`.
8. The boundary object returns the limited insight result to the Campus Admin.

## Events Emitted

* None.

## Events Consumed

* None.

## Constraints and Exceptions

* Admin Insights are MVP for the first skeleton.
* Access must be limited to the admin's authorized campus scope.
* Consent is owned by AP and stored in `DS-AP-001 Student Account`.
* CA does not own AP or H&L data and performs no writes to AP/H&L stores.
* This flow must not expose unrestricted profiles, interests, activities, or participation history.
* Moderation/report-review access remains separate from Admin Insights access.
* No `DS-CA-003`, Admin Account Store, or Campus Admin database is introduced.

## Postconditions in Design Terms

* No persistent store is modified.
* A limited insight result is returned only when admin authorization and student consent checks pass.
* Denied insight access does not alter student account, profile, activity, participation, report, block, or notification state.

## Related Diagrams Suggested

* Sequence diagram: `view_consent_based_student_insights_sequence`
* Collaboration diagram: `view_consent_based_student_insights_collaboration`

## Open Points / Assumptions

* Unresolved: exact insight fields, aggregation format, and UI filtering controls.
* Provisional: exact admin authentication implementation behind `AuthenticatedAdminContext`.

## 5. Candidate API Summary

| Method + Path                                                     | Purpose                                              | Input                                                                                                         | Output                                | Reads                    | Writes                   | Events / Notes                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------ | ------------------------ | ----------------------------------------------------- |
| `POST /admin/campuses`                                            | Creates a new campus and initial structured options. | Authenticated campus admin context, campus setup fields, initial categories, initial locations/meeting points | Created campus and option identifiers | None modeled             | `DS-CA-001`, `DS-CA-002` | No event.                                             |
| `GET /admin/campuses/{campusId}/structured-options`               | Lists structured options for an authorized campus.   | Authenticated campus admin context, `campusId`, optional `optionType`                                         | Current option list                   | `DS-CA-001`, `DS-CA-002` | None                     | No event.                                             |
| `POST /admin/campuses/{campusId}/structured-options`              | Creates a category or location option.               | Authenticated campus admin context, `optionType`, label/name, optional description, status                    | Created option                        | `DS-CA-001`, `DS-CA-002` | `DS-CA-002`              | No event.                                             |
| `PATCH /admin/campuses/{campusId}/structured-options/{optionId}`  | Updates a category or location option.               | Authenticated campus admin context, changed fields                                                            | Updated option                        | `DS-CA-001`, `DS-CA-002` | `DS-CA-002`              | No event.                                             |
| `DELETE /admin/campuses/{campusId}/structured-options/{optionId}` | Removes an option from future campus selection.      | Authenticated campus admin context, `campusId`, `optionId`                                                    | Removal confirmation                  | `DS-CA-001`, `DS-CA-002` | `DS-CA-002`              | No event; delete-versus-deactivate remains to verify. |
| `GET /admin/campuses/{campusId}/student-insights`                 | Returns consent-based student insight data.          | `AuthenticatedAdminContext`, `campusId`, optional filters                                                     | Limited insight result or denied      | `DS-AP-001`, conditional `DS-AP-002`, `DS-HL-001`, `DS-HL-002` | None | DUC-CA-03. Admin-only, campus-scoped, consent-gated, read-only. |

## 6. Internal Interfaces and Events Summary

Internal module interfaces:

* AP -> CA: read configured active campuses from `DS-CA-001` during campus selection.
* H\&L -> CA: read campus structured options from `DS-CA-002` during activity creation.
* D\&P -> CA/AP context: use selected campus scope for feed filtering and activity access.
* CA -> AP/H\&L: read-only, consent-gated Admin Insights access for DUC-CA-03; no AP/H\&L writes.
* CA -> AP/H\&L/D\&P/SM/NSF: no direct store mutations in MVP CA flows.
* `CampusAuthorizationService`: validates admin campus scope from runtime `AuthenticatedAdminContext`. The backing admin authentication mechanism remains provisional.

Events:

* None. CA core flows should not emit notification events or create notification records.

## 7. Suggested Sequence Diagram List

* `configure_new_campus_sequence`
* `manage_campus_structured_options_sequence`
* `read_campus_options_for_activity_creation_sequence`
* `read_configured_campuses_for_campus_selection_sequence`
* `view_consent_based_student_insights_sequence`

## 8. Open Points and Modeling Assumptions

* Provisional: exact campus admin authentication implementation. First skeleton uses runtime `AuthenticatedAdminContext`, not a canonical store.
* Unresolved: exact campus setup fields beyond known campus identity and activation fields.
* Unresolved: final validation rules for option names, duplicate handling, ordering, and delete-versus-deactivate behavior.
* Assumption for modeling only: campus admins may select only from an authorized subset of campuses, not from all campuses globally.
* Out of MVP: interactive campus map management and map upload.
* MVP confirmed: consent-based student insight access is not unrestricted CA access. The identifiable insight view must be read-only, campus-authorized, least-privilege, and conditional on `CampusInsightSharingConsent`.

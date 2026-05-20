# InCampus — Project Map

## How to use this map

Identify the relevant folder for the current task using the section headings, then open the file that matches the function you need: do not open files outside the relevant section without first checking that a more specific document does not exist in the correct section.
**Resolved abbreviations glossary:** AP = Access and Profile | CA = Campus Administration | D&P = Discovery and Participation | H&L = Hosting and Lifecycle | NSF / N&S = Notifications and System Flow | SM / S&M = Safety and Moderation | UCR = Use Case Realization | SCD = State Chart Diagram | CRUD = Create Read Update Delete.

---

## requirements-data-model-crud

Primary source of truth for requirements, data model, use cases, and CRUD matrix. This is the folder to consult before any other document when working on features, entities, or system invariants.

### `CRUD matrix v1.6.md`
Matrix mapping every actor and process to Create/Read/Update/Delete operations for each entity and logical store in the system; current baseline for CRUD consistency across subsystems.
Consult when verifying the correctness of operations on an entity, adding a new process, or analysing data ownership relative to a subsystem.

### `Databases v1.1.md`
Definitions of the 10 canonical logical stores in the system: list and function of each store, ownership, and subsystem boundaries.
Consult when working on the logical data model, analysing dependencies between stores, or verifying which subsystem owns a given piece of data.

### `Entities & Attributes v1.2.md`
Complete catalogue of logical domain entities with their key attributes, resolution tags, and cross-subgroup notes; reference document for the object model.
Consult when defining or verifying attributes of an entity, building or updating an ERD, or analysing any artefact that depends on the data model.

### `Functional Requirements v1.3.md`
Complete list of functional requirements grouped by area code (FR-01xx, FR-03xx, etc.); describes what the system must do for each subsystem within MVP scope.
Consult when verifying whether a feature is in MVP scope, tracing requirements to use cases, or analysing the completeness of a flow against requirements.

### `Non-Functional Requirements v1.2.md`
Non-functional requirements for the system: security, performance, scalability, reliability, traceability; includes NFR-xx codes for reference and tracking.
Consult when evaluating quality constraints, designing the security architecture, or defining system behaviour in error or load scenarios.

### `Relationship Table v1.1.md`
Table of relationships between domain entities: cardinality, relationship type, and constraints; complement to the ERD for navigating structural dependencies between objects.
Consult when modelling relationships between entities, verifying the cardinality of an association, or working on flows that span multiple stores or entities.

### `Use cases v1.2.md`
Summary table of MVP use cases with actors, priority, traceability to user stories and requirements, and MVP/PostMVP status; does not contain detailed narratives.
Consult to identify the complete list of use cases, verify MVP status, or trace a use case back to its functional requirement and user story.

### `use-case-diagram-v1.7.md`
Markdown source for the v1.7 use case diagram; contains the structured representation of all actors, MVP use cases, and include/extend relationships.
Consult when verifying the structure of the use case diagram, updating a relationship between use cases, or regenerating the corresponding SVG diagram.

### `User Story v1.3.md`
List of MVP and PostMVP user stories organised by functional area; links user needs to formal requirements and priority.
Consult when understanding the user motivation behind a feature, tracing user stories to use cases, or prioritising the development backlog.

---

## collaboration diagrams

Contains UML collaboration diagrams for the main system flows, organised by specific scenario and by subsystem pair. Workdocs document the iterative construction process and modelling decisions.

### `Collaboration Diagram workDoc v1.1.md`
General workdoc for collaboration diagrams: methodology adopted, templates, review rules, and cross-cutting modelling decisions.
Consult before starting any work on a collaboration diagram, or to understand the methodological context that guided modelling choices.

### `AP-NSF - Collaboration Diagram WorkDoc v1.1.md`
Workdoc for the collaboration diagrams between Access and Profile and Notifications and System Flow; covers sign-up/campus selection and notification event handling (JoinRequestSubmitted).
Consult when analysing the interaction between AP and NSF, or verifying notification behaviour in onboarding and join request scenarios.

### `H&L-D&P - Collaboration Diagram WordDoc v1.1.md`
Workdoc for the collaboration diagrams between Hosting and Lifecycle and Discovery and Participation; covers Join Activity and Manage Join Requests.
Consult when analysing the interaction between H&L and D&P, or verifying participation and host decision flows.

### `SM-CA - Collaboration Diagram WorkDoc v1.2.md`
Workdoc for the collaboration diagrams between Safety and Moderation and Campus Administration; covers report submission/review, configure campus, and admin insights.
Consult when analysing the interaction between SM and CA, or verifying reporting, moderation, and campus configuration flows.

### Scenario subfolders

#### `Configure New Campus Collaboration Diagram v1.1.md`
Collaboration diagram for Configure New Campus split into authorisation/validation and campus/options creation views; shows actor, controller, services, and the two CA stores.
Consult when analysing object interactions during new campus configuration, or verifying that CA only writes DS-CA-001 and DS-CA-002.

#### `Join Activity — Collaboration Diagram v1.1.md`
Collaboration diagram for Join Activity with numbered messages for block check, participation/request creation, and internal event emission.
Consult when analysing the join flow from D&P's perspective, or verifying the correctness of block and capacity checks.

#### `Manage Join Requests — Collaboration Diagram v1.1.md`
Collaboration diagram for Manage Join Requests showing the host approval/decline flow with profile reads and participation record updates.
Consult when analysing the host decision process on pending requests, or verifying the atomicity of capacity updates.

#### `Notification Event Handling (JoinRequestSubmitted) — Collaboration Diagram v1.1.md`
Collaboration diagram for NSF's handling of the JoinRequestSubmitted event: recipient resolution, block suppression, notification composition, and dispatch.
Consult when analysing how NSF consumes a join event and produces a notification, or verifying ownership invariants are respected.

#### `Report and Review Report Collaboration Diagram v1.1.md`
Package of three collaboration diagrams for report submission, review access/context, and outcome/delegation; includes admin runtime context.
Consult when analysing reporting and report review flows, or verifying the routing of moderation actions toward AP/H&L.

#### `Sign Up and Select Campus — Collaboration Diagram v1.1.md`
Collaboration diagram for student onboarding (registration, verification, campus selection, insight consent, and profile creation) with AP ownership.
Consult when analysing the onboarding sequence or verifying where consent is stored (DS-AP-001).

#### `View Consent-Based Student Insights — Collaboration Diagram v1.1.md`
Collaboration diagram for admin access to consent-based insights; shows runtime authorisation, consent check, and conditional reads on AP/H&L stores.
Consult when analysing the Admin Insights flow or verifying that no new administrative store is introduced.

---

## sequence diagrams

Contains UML sequence diagrams for the main system flows, organised by scenario and by subsystem pair. Workdocs document the iterative construction process.

### `AP-NSF SDiagram workdoc v1.1.md`
Workdoc for the sequence diagrams between Access and Profile and Notifications and System Flow; covers Sign Up and Select Campus and Notification Event Handling (JoinRequestSubmitted).
Consult when analysing the temporal message sequence between AP and NSF, or verifying behaviour in registration and notification scenarios.

### `H&L-D&P - SDiagram WorkDoc v1.1.md`
Workdoc for the sequence diagrams between Hosting and Lifecycle and Discovery and Participation; covers Join Activity and Manage Join Requests.
Consult when analysing the temporal sequence between H&L and D&P, or verifying behaviour in join or lifecycle scenarios.

### `SM-CA SDiagram workdoc v1.1.md`
Workdoc for the sequence diagrams between Safety and Moderation and Campus Administration; covers Report and Review Report, Configure New Campus, and View Consent-Based Student Insights.
Consult when analysing the temporal sequence between SM and CA, or verifying the moderation and configuration flow.

### `SequenceDiagramWorkdoc.md`
General workdoc for all sequence diagrams: rules, templates, source priority, and review checklist.
Consult before creating or modifying a sequence diagram, or to align notation and project conventions.

### Scenario subfolders

#### `ConfigureNewCampusSequenceDiagram.md`
Sequence diagram for Configure New Campus; shows runtime authorisation, validation, and creation of campus and structured options.
Consult when analysing the campus setup sequence, or verifying that CA does not mutate AP/H&L/SM/NSF stores.

#### `JoinActivitySequenceDiagram.md`
Sequence diagram for Join Activity with atomic checks for block, capacity, duplicates, and participation/request record creation.
Consult when analysing the join flow, or verifying concurrency handling and internal event emission.

#### `ManageJoinRequestsSequenceDiagram.md`
Sequence diagram for Manage Join Requests: host retrieves pending requests, reads profiles, and decides (approve/decline) with atomic updates.
Consult when analysing the host decision process, or verifying the atomicity of operations on capacity and records.

#### `NotificationEventHandlingSequenceDiagram.md`
Sequence diagram for NSF's handling of the JoinRequestSubmitted event: recipient resolution, block suppression, notification creation, and dispatch.
Consult when analysing the event-to-notification chain, or verifying that NSF is the only writer of DS-NS-001.

#### `ReportAndReviewReportSequenceDiagram.md`
Sequence diagram combining student report submission and admin review; the submission does not read DS-HL-001, the review can read activity context with a fallback.
Consult when analysing the reporting and review flow, or verifying that SM-AP-H&L ownership boundaries are respected.

#### `Sign Up and Select Campus — Sequence Diagram v1.1.md`
Sequence diagram for the complete onboarding flow (registration, verification, campus selection, profile creation, insight consent).
Consult when analysing the onboarding sequence or verifying where consent and the selected campus are stored.

#### `ViewConsentBasedStudentInsightsSequenceDiagrams.md`
Sequence diagram for View Consent-Based Student Insights: runtime authorisation, consent check, conditional reads on AP/H&L stores.
Consult when analysing the Admin Insights flow or verifying that no writes occur on non-administrative stores.

---

## state chart diagrams

Contains UML state chart diagrams for the main system entities. The workdoc documents the modelling decisions for states and transitions.

### `State Chart Diagram workdoc v1.1.md`
General workdoc for state chart diagrams: methodology, modelling rules, templates, and checklists for Activity, Participation, Profile, and ReportRecord.
Consult before creating or modifying a state chart diagram, or to understand the conventions for representing states and transitions.

### Scenario subfolders

#### `ActivityParticipation SCD.md`
State chart for ActivityParticipation; persistence-based states (RecordType + Status) and non-persisted terminal states for withdraw, leave, cancel, and delete.
Consult when analysing the lifecycle of a participation record, or verifying valid transitions for join request, approval, decline, and removal.

#### `ProfileSCD.md`
State chart for Student Profile: implicit states NotCreated, Active, and Suspended (derived); shows creation, editing, and suspension from moderation.
Consult when analysing the profile lifecycle, or verifying the effect of account suspension on profile visibility.

#### `ReportRecordSCD.md`
State chart for ReportRecord: Submitted, UnderReview, Reviewed, ActionRequired, Closed; uses AuthenticatedAdminContext and delegated moderation actions.
Consult when analysing the report review flow, or verifying transitions between review states and moderation actions.

---

## system architecture

Contains the architectural scope and choices document and the high-level system architecture diagram. This is the folder to consult for structural decisions about modules and system boundaries.

### `01 Design Scope and Architectural Choice v1.1.md`
Defines the architectural design scope and foundational choices: Multi-Tenant Modular Monolith pattern with event-driven internal flows, boundaries of the six modules, role of CampusID as tenant boundary, and rationale for high-level structural decisions.
Consult when introducing a new component or module, evaluating whether a design choice is consistent with the established architecture, or justifying a design decision to new team members.

### `SystemarchitectureDiagram.md`
System architecture diagram (PlantUML and SVG rendering) representing the multi-tenant modular monolith, the six modules, the internal event dispatcher, the ten canonical stores, and flows between client and backend.
Consult when visualising the high-level architecture, verifying the layout of modules and stores, or updating the graphical representation of the system.

---

## use case realizations

Contains use case realizations for each subsystem: documents that map use cases to concrete interactions between system objects and components, with independent versioning per subsystem.

### `UCR - A&P v1.2.md`
Use case realizations for the Access and Profile subsystem: Sign Up, Sign In, Select Campus, Set Up/Edit/View Profile, Update Campus Insight Consent; maps flows to messages between objects and to data consumed or produced.
Consult when analysing how Access and Profile realises its use cases at design level, or building a sequence or collaboration diagram for access and profile scenarios.

### `UCR - C&A v1.1.md`
Use case realizations for the Campus Administration subsystem: Configure New Campus, Manage Campus Structured Options, View Consent-Based Student Insights; maps administrative flows to interactions between objects and stores.
Consult when analysing how Campus Administration realises its use cases, or designing campus configuration, options management, and insight access flows.

### `UCR - D&P v1.2.md`
Use case realizations for the Discovery and Participation subsystem: Browse and Filter Activities, View Activity Details, Join Activity, Withdraw Join Request, Leave Joined Activity, View Personal Activity List.
Consult when analysing how Discovery and Participation realises its use cases, or building a diagram for browsing, filtering, and activity participation scenarios.

### `UCR - H&L v1.4.md`
Use case realizations for the Hosting and Lifecycle subsystem: Create Activity, Manage Join Requests, Update Activity Status, Delete Activity; the most up-to-date version among all UCRs.
Consult when analysing how Hosting and Lifecycle realises its use cases, or designing activity creation, lifecycle, and join request management flows.

### `UCR - N&S v1.2.md`
Use case realizations for the Notifications and System Flow subsystem: Notify Host of Join Event, Notify Participant of Application Outcome, Notify Participant of Activity Cancellation, Notify Host of Leave Event, Activity Reminder, Open Notification Context.
Consult when analysing how Notifications and System Flow realises its use cases, or verifying event-to-notification chains and block suppression mechanisms.

### `UCR - S&M v1.3.md`
Use case realizations for the Safety and Moderation subsystem: Block User, Report User or Activity, Review Report, View Community Rules; the most up-to-date version among the moderation-area UCRs.
Consult when analysing how Safety and Moderation realises its use cases, or designing block, report, report review, and moderation flows.

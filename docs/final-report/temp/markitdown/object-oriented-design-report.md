Object-Oriented Design Report
1.System Architecture Diagram
2. Refining the use case model to reflect the implementation environment
2.1 Use Case Diagram
2.2 Design Use Cases (DUC) Detailed Realizations
3. Modeling Object Interactions and Behavior Supporting the Use Case Scenarios
3.1 Design Class Diagram
3.2 System Sequence Diagrams (SSD)
3.3 Sequence Diagrams
3.4 Collaboration Diagrams
3.5 State Chart Diagrams
4. Updating the Object Model to Reflect the Implementation Environment
4.1 Activity Diagrams
4.2 Component Diagram
5. Testing Plan: Design Test Cases for the System
5.1 Purpose and Scope
5.2 Campus Administration (CA) Testing Strategy
5.3 Access and Profile (AP) Testing Strategy
5.4 Hosting and Lifecycle (H&L) Testing Strategy
5.5 Discovery and Participation (D&P) Testing Strategy
5.6 Safety and Moderation (SM) Testing Strategy
5.7 Notifications and System Flow (NSF) Testing Strategy
5.8 Cross-Module Integration and Architectural Invariant Test Cases
Conclusion


1.System Architecture Diagram
The system architecture of the InCampus platform is designed as a Multi-Tenant Modular Monolith with Event-Driven Internal Flows. This approach balances the deployment, testing, and operational simplicity of a single backend application with the strict separation of concerns and data encapsulation typically found in microservices. It ensures that critical data ownership boundaries and privacy constraints are rigorously respected during the MVP stage.
Module Segregation and Responsibilities To achieve high cohesion and low coupling, the backend is logically divided into six specific modules, each acting as the sole authority over its domain:
	•	Access and Profile (AP): Manages university-verified identities, domain rule validation, password credentials, onboarding, minimal public profiles, and explicit privacy consents.
	•	Campus Administration (CA): Handles core campus configurations and campus-specific structured options (like categories and meeting points). It also provides the read-only, consent-gated assembly logic for Admin Insights.
	•	Hosting and Lifecycle (H&L): The operational core that manages activity creation, status updates (open, full, completed, cancelled), hard-deletion, capacity tracking, and host-side approval of join requests.
	•	Discovery and Participation (D&P): Handles feed filtering, activity discovery, and guest-initiated actions (direct joins, join requests, withdraws, and leaves).
	•	Safety and Moderation (SM): Centralizes trust-and-safety mechanisms, maintaining reciprocal block relationships and submitted reports. It records moderation outcomes but delegates punitive consequences to native workflows.
	•	Notifications and System Flow (NSF): Acts as a pure downstream event sink. It reacts to business events, enforces cross-user block suppression rules, and is the exclusive writer of notification records.
Multi-Tenancy and Concurrency Management To achieve multi-tenancy without separate deployments, the architecture enforces CampusID as the explicit tenant boundary. All student accounts, activities, reports, and structured options are filtered or validated against this scope, preventing any cross-campus data leakage. Furthermore, because participation flows can be highly concurrent, operations affecting capacity, request counters, or participation states are executed via strict atomic write transactions. Capacity and duplicate-record checks are re-evaluated inside the transaction boundary to ensure absolute consistency and prevent race conditions (satisfying NFR-13).
Persistence, Data Ownership, and Event-Driven Communication The persistence layer relies on a shared relational database containing exactly ten canonical logical data stores. However, sharing the database does not bypass logical ownership: a module may perform read-only queries on another module's store to validate a context (e.g., D&P reading SM's block list to filter the activity feed), but it can never mutate data it does not own. When cross-module side effects are required, the system employs two distinct communication patterns:
	•	Event-Driven Flows: State changes that require user notifications (e.g., DirectJoinCompleted, ActivityCancelled) are emitted to an Internal Event Dispatcher and asynchronously consumed by the NSF module.
	•	Internal Command Delegation: Moderation decisions that require account suspension or activity removal trigger internal commands (e.g., RequestAccountModerationAction sent to AP). This ensures that SM does not directly alter account or activity tables, preserving absolute module autonomy.
Administration and Privacy-by-Design Administrative operations deliberately avoid introducing an isolated, unrestricted "Admin Database" (no DS-CA-003). Instead, they rely on a runtime AuthenticatedAdminContext which grants capability-specific scope. For example, the Consent-Based Student Insights feature enforces privacy-by-design: it performs a synchronous check against the CampusInsightSharingConsent stored in AP's DS-AP-001. If a student has revoked consent, the CA module is actively denied from reading identifiable profile or participation history for that user, perfectly balancing administrative analytics with strict student privacy.
	•	Affine - System Architecture Diagram

2. Refining the use case model to reflect the implementation environment
2.1 Use Case Diagram
The Use Case Diagram provides a comprehensive overview of the system's functional scope for the first MVP skeleton. It illustrates the interactions between the four primary actors (Student, Student Host, Student Guest, Campus Admin) and the six logical modules of the InCampus platform.
Affine - Use Case Diagram

2.2 Design Use Cases (DUC) Detailed Realizations
During the object-oriented design phase, the baseline use cases were heavily refined into Design Use Cases (DUC). This refinement maps abstract user intentions to concrete architectural components—specific Controllers, domain Services, Data Stores, and internal events—ensuring that every scenario strictly enforces the system's structural constraints, privacy rules, and data ownership boundaries.
Access and Profile (DUC-AP): Identity, Scope, and Privacy
	•	Onboarding Flow (DUC-AP-01 / 03 / 04 / 07): The onboarding process orchestrates identity verification and campus scoping. DomainValidationService strictly validates the input email against DS-AP-003 University Identity Rules. Upon activation via AccountActivationService, the CampusAssociationService queries DS-CA-001 Campus Configuration (owned by CA) to bind the account to a valid tenant (CampusID). The system securely captures the CampusInsightSharingConsent directly in DS-AP-001 Student Account without blocking app usage, before delegating the StudentProfile creation to DS-AP-002 via the ProfileCreationService.
	•	View Student Profile (DUC-AP-06): Enforces context-limited exposure of minimal public profile data. Before any profile is rendered, BlockEnforcementService performs a synchronous read on DS-SM-001 Block Relationships to ensure that reciprocal blocks hide profiles symmetrically.
Hosting and Lifecycle (DUC-HL): Atomic State Management
	•	Create Activity (DUC-HL-01): Managed by the ActivityLifecycleController. To guarantee data integrity, it reads structured options from DS-CA-002 (verifying the category and meeting point belong to the host's campus) and writes the core truth to DS-HL-001 Activities, capturing snapshot labels to prevent data corruption if a category is later renamed or deleted by an admin.
	•	Manage Join Requests (DUC-HL-02): Highlights the handling of high-concurrency scenarios. The HostParticipationController manages the host's decisions (approve/decline). ActivityCapacityService re-evaluates the headcount capacity (MaxParticipants) strictly inside the atomic write transaction before updating DS-HL-002 Activity Participations (converting RecordType=request, Status=pending to RecordType=participation, Status=confirmed). Upon completion, it dispatches the JoinRequestApproved internal event to the Event Dispatcher.
Discovery and Participation (DUC-DP): Discovery and Constraints
	•	Browse and Filter Activities (DUC-DP-01): The ActivityDiscoveryController works alongside the FeedFilteringService to build the campus-scoped activity feed. It reads DS-HL-001 while explicitly omitting activities that are full, cancelled, completed, or hosted by a user present in the requesting student's block list (DS-SM-001).
	•	Join Activity (DUC-DP-03): The ParticipationService processes the join intention. After passing the BlockEnforcementService check, it atomically validates capacity limits and ensures no duplicate active records exist for the ActivityID + StudentAccountID pair. It writes to DS-HL-002 and updates counters in DS-HL-001, concluding with the emission of the DirectJoinCompleted or JoinRequestSubmitted internal events.
Safety and Moderation (DUC-SM): Trust and Consequence Routing
	•	Report Submission (DUC-SM-02): The ReportValidationService verifies reporter and target validity. Crucially, activity reports capture their target reference directly from an allowed launch context rather than forcing an expensive, full DS-HL-001 read. The record is persisted in DS-SM-002 Report Records.
	•	Review Report (DUC-SM-03): Uses a robust delegation pattern. A Campus Admin accesses the queue via a runtime AuthenticatedAdminContext. ReportContextAssembler builds the view dynamically, providing fallbacks if an activity was hard-deleted. Once the admin records an outcome, the ModerationActionDispatcher routes consequences to native modules via internal commands (e.g., sending RequestAccountModerationAction(ban_user) to AP, or RequestActivityModerationAction(remove_activity) to H&L), preserving absolute data ownership.
	•	Block User (DUC-SM-04): BlockManagementService establishes a directed record in DS-SM-001. This single truth is then read symmetrically by D&P (hiding activities), AP (hiding profiles), and NSF (suppressing notifications).
Notifications and System Flow (DUC-NSF): Pure Event Sinking
	•	Event Handling and Notification Context Resolution (DUC-NSF-01 to DUC-NSF-06): Notifications and System Flow acts strictly as a downstream event sink and notification-context resolver. Notification handlers consume confirmed upstream events such as DirectJoinCompleted, JoinRequestSubmitted, JoinRequestApproved, JoinRequestDeclined, JoinedParticipantLeft, ActivityCancelled, and the time-based ActivityReminderDue trigger. RecipientResolutionService identifies the correct recipient or participant set, while BlockSuppressionService enforces block-based suppression for cross-user notifications by reading DS-SM-001. System-triggered reminders are not cross-user notifications and are instead validated against the current activity and participation state. NSF is the exclusive writer of DS-NS-001 Notification Records and does not duplicate business truth from AP, H&L, D&P, or SM. When a user opens a notification, NSF performs a read-only context-resolution flow, re-checking current access and routing to the proper app context or fallback view without updating read/unread state.
Campus Administration (DUC-CA): Structure and Privacy-by-Design
	•	Configure Campus (DUC-CA-01): The CampusConfigurationController establishes the CampusID tenant boundary and seeds initial options exclusively into DS-CA-001 and DS-CA-002, without mutating any student-facing stores.
	•	View Consent-Based Student Insights (DUC-CA-03): Implements privacy-by-design for administrative analytics. The ConsentEligibilityService actively checks the CampusInsightSharingConsent stored in AP's DS-AP-001. Only if the student has explicitly opted-in does the StudentInsightAssembler perform read-only queries to slice data from DS-AP-002, DS-HL-001, and DS-HL-002. Access is strictly campus-gated via the AuthenticatedAdminContext.
3. Modeling Object Interactions and Behavior Supporting the Use Case Scenarios
3.1 Design Class Diagram
The Design Class Diagram models the persistent domain entities, their explicit data types, and the structural relationships that support the Multi-Tenant Modular Monolith architecture. Rather than a purely abstract domain model, this diagram translates the 10 canonical logical data stores into concrete object-oriented blueprints, defining strict boundaries for data ownership, visibility, and multi-tenancy.
Data Types and Structural Integrity The model utilizes specific data types to enforce business invariants at the schema level. Globally unique identifiers (UUID) are strictly used for primary and foreign keys to prevent enumeration attacks and ensure safe cross-module referencing. Constrained vocabularies are mapped as Enum types to prevent invalid states (e.g., Activity.Status is strictly limited to open, full, completed, or cancelled; deleted is handled as a hard-delete structural cascade rather than a state). Chronological traceability is enforced via DateTime attributes (CreatedAt, UpdatedAt) across all critical entities.
Core Class Groupings & Module Ownership:
	•	Access and Profile (AP): The StudentAccount class acts as the central identity root, securely encapsulating the PasswordHash and the critical CampusInsightSharingConsent boolean. It has a strict 1:1 composition relationship with the StudentProfile class, physically isolating minimal public profile data from sensitive account credentials. The UniversityIdentityRule class models the structural validation constraints for supported email domains.
	•	Campus Administration (CA): The Campus class represents the explicit tenant boundary. All major entities in the system possess a direct or transitive structural dependency on CampusID. CampusLocation and ActivityCategory are modeled as campus-scoped configuration classes (DS-CA-002) that Activity instances must reference to ensure data consistency.
	•	Hosting and Lifecycle (H&L): The Activity class encapsulates both lifecycle metadata and atomic concurrency fields (e.g., MaxParticipants, CurrentParticipantCount). The Participation class resolves the N:M structural relationship between StudentAccount and Activity. To accurately model business states, Participation utilizes a composite state model combining RecordType (request vs. participation) and Status (pending, confirmed, declined), completely eliminating ambiguous states.
	•	Safety and Moderation (SM): The BlockRelationship class models a directed 1:N constraint initiated by a StudentAccount, which is then queried symmetrically by other modules. The ReportRecord class encapsulates the moderation workflow, separating the ReviewStatus from the ModerationAction trace, and uses polymorphic target references (TargetType distinguishing between users and activities).
	•	Notifications and System Flow (NSF): The NotificationRecord class is modeled as a downstream event sink. Structurally, it stores weak references (RelatedActivityID, TriggeringAccountID) to upstream classes rather than duplicating their data. This structural choice guarantees that opening a notification forces a read-only re-evaluation of the current upstream business truth.


3.2 System Sequence Diagrams (SSD)
System Sequence Diagrams (SSDs) model the high-level interactions between external actors (e.g., Student, Student Host, Campus Admin) and the InCampus system treated as a black box. They define the exact sequence of input events, boundary validations, and system responses for specific scenarios, effectively mapping out the primary API entry points required for the application before detailing internal module logic.
	•	System Sequence Diagram: Sign Up and Select Campus
Demonstrates the required system operations for the onboarding flow, moving from registration to email verification, campus selection, and final profile/consent setup.
  
	•	System Sequence Diagram — Join Activity 
Demonstrates the high-level interactions when a Student Guest attempts to join an activity, highlighting the branching responses between direct joins and approval-based requests.
 

3.3 Sequence Diagrams
Sequence Diagrams open the "black box" defined by the SSDs, showing the internal chronological interactions between system objects. They illustrate how boundary objects (Screens), control objects (Controllers), service objects, and data stores sequentially collaborate to fulfill the Design Use Cases.
	•	Affine - Sign Up and Select Campus — Sequence Diagram 
Illustrates the full onboarding flow (DUC-AP-01, 03, 04, 07). It shows how DomainValidationService validates the email against DS-AP-003, followed by AccountActivationService. It then demonstrates how the selected campus and the CampusInsightSharingConsent are both securely written to DS-AP-001 Student Account.

	•	Affine - Join Activity — Sequence Diagram Highlights the ParticipationService handling atomic checks. It shows the DS-SM-001 block verification, the creation of canonical RecordType + Status records in DS-HL-002, and the transactional headcount update in DS-HL-001, culminating with the dispatch of the DirectJoinCompleted or JoinRequestSubmitted event.







	•	Affine - Manage Join Requests — Sequence Diagram Shows the HostParticipationController fetching requests alongside DS-AP-002 profile snippets. It maps the host decision, showing how ActivityCapacityService re-checks constraints inside the write transaction before confirming the participation and emitting the application outcome event.







	•	Affine - Notification Event Handling (JoinRequestSubmitted) — Sequence Diagram 
Details the NSF module's architecture. JoinEventNotificationHandler consumes the event, resolves the recipient via DS-HL-001, actively suppresses the notification if BlockSuppressionService detects a block in DS-SM-001, and finally persists the DS-NS-001 Notification Record.






	•	Affine - Report and Review Report — Sequence Diagram 
Combines submission and review. The submission writes to DS-SM-002 without requiring full activity reads. The review phase shows the Campus Admin entering via AuthenticatedAdminContext, retrieving target context, and the ModerationActionDispatcher delegating native punitive consequences (ban_user, remove_activity) directly to the AP and H&L modules.









	•	Affine - Configure New Campus — Sequence Diagram
Shows how the CampusConfigurationController validates inputs and creates the CampusID tenant boundary, correctly writing only to DS-CA-001 and DS-CA-002 without mutating any downstream student stores.














	•	Affine - View Consent-Based Student Insights — Sequence Diagram
Illustrates the privacy-first administrative query. After CampusAdminAuthorizationService validates the scope, ConsentEligibilityService checks DS-AP-001. Only if consent is explicitly granted, the StudentInsightAssembler performs read-only assembly from AP and H&L stores.


3.4 Collaboration Diagrams
While Sequence Diagrams focus on chronological order, Collaboration Diagrams illustrate the structural communication network between actors, control objects, and entities. They highlight the structural dependencies and data-ownership boundaries crossed during execution.
	•	Affine - Sign Up and Select Campus — Collaboration Diagram 
Models the entire onboarding flow, demonstrating how interactions are handled entirely within the Access and Profile module without mutating data from other modules. It highlights the central role of DS-AP-001 in storing both the selected campus and privacy consent.

	•	Affine - Join Activity — Collaboration Diagram
Highlights the interaction topology for participation. It structurally maps the read-only calls to DS-SM-001 for block checks, the atomic write interactions on DS-HL-001 and DS-HL-002, and the final emission to the Internal Event Dispatcher.




	•	Affine - Manage Join Requests — Collaboration Diagram 
Shows the structural flow within the Hosting and Lifecycle module. It maps how the host accesses applicant profiles from DS-AP-002 and how approval decisions transactionally update both the request status and the headcount capacity.















	•	Affine - Notification Event Handling — Collaboration Diagram
Models the structural reaction of the Notifications and System Flow module. It shows the event routing, recipient resolution, suppression checks, and the creation of the final notification payload exclusively in DS-NS-001.











	•	Affine - Report and Review Report Collaboration Diagram
Divided into sub-views for clarity, this package demonstrates the "delegation" pattern. It shows how the Campus Admin, authenticated via AuthenticatedAdminContext, reviews the situation and how punitive moderation actions are structurally routed as commands to native AP or H&L workflows rather than being performed directly by SM. 




	•	Affine - Configure New Campus / View Student Insights Collaboration Diagram 
Covers the configuration architecture (DS-CA-001 and DS-CA-002) and the "consent-gated" structural access to student insights. This demonstrates how read-only insight views respect privacy consent without introducing any new administrative data stores.






3.5 State Chart Diagrams
State Chart Diagrams model the dynamic lifecycle and state transitions of the most complex fundamental business entities in the system. Rather than just listing statuses, these diagrams illustrate how entities respond to business events, the strict guard conditions required for transitions, and how states map to the underlying persistence layer (the Status attributes defined in the Entities catalog).
3.5.1 Activity Participation Lifecycle
This diagram models the complex lifecycle of the participation record (DS-HL-002 Activity Participations), which resolves the N:M relationship between a StudentAccount and an Activity. To eliminate ambiguous states, the system utilizes a composite state model combining RecordType (request vs. participation) and Status (pending, confirmed, declined).
	•	Key Transitions: The diagram illustrates the branching path based on the activity's ParticipationMode. Direct joins immediately enter the Confirmed Participation state, while approval-based requests enter the Pending Request state, awaiting the Student Host's decision.
	•	Terminal and Non-Persisted States: It elegantly handles workflow outcomes that are not explicitly persisted as participation statuses. For instance, Withdrawn, Left, Activity Cancelled, and Activity Deleted represent terminal states in the participation lifecycle, resulting in either a hard-delete of the record or a cascading cleanup, freeing up the atomic capacity counters in DS-HL-001.
	•	Affine - ActivityParticipation SCD


3.5.2 Student Profile Lifecycle
This diagram models the StudentProfile entity (DS-AP-002 Student Profile). Its lifecycle covers the journey from initial onboarding to active visibility, and potentially to a moderation-enforced restriction.
	•	State Abstraction: The diagram highlights a crucial architectural decision: the StudentProfile entity lacks a physical ProfileStatus attribute. NotCreated and Active are implicit states based on the existence of the record.
	•	Derived Visibility State: The Suspended state is modeled as a derived visibility condition. When Safety and Moderation bans or suspends a user, it updates the PlatformAccessStatus in DS-AP-001 Student Account. The profile record in DS-AP-002 remains physically untouched, but the profile effectively enters a Suspended state because the View Student Profile flow (DUC-AP-06) synchronously validates the parent account's status before exposing any data.
	•	Affine - ProfileSCD
3.5.3 Report Record Lifecycle
This diagram models the moderation workflow captured in the ReportRecord entity (DS-SM-002 Report Records). It maps the journey from submission by a student to the final resolution by a Campus Admin.
	•	Authorization Guards: Transitions from Submitted to UnderReview are strictly guarded by the presence of a valid AuthenticatedAdminContext, ensuring that only authorized staff can advance the state machine.
	•	Delegation Pattern: The diagram separates the canonical ReviewStatus (submitted, under_review, resolved) from the ModerationAction trace. It shows how the state machine terminates logically in the SM module (reaching the Closed endpoint with status resolved), but practically triggers a handoff: punitive states (warn_user, suspend_user, ban_user, remove_activity) dispatch internal commands to native AP and H&L workflows, ensuring that SM never directly mutates downstream stores.
	•	Affine - ReportRecordSCD



4. Updating the Object Model to Reflect the Implementation Environment
4.1 Activity Diagrams
The Activity Diagrams model the control flow and business logic of the main use cases, illustrating decisions, parallel paths, and exception handling within the modules.
	•	Affine - Onboarding & Access Activity Diagram
This diagram illustrates the "Sign Up and Select Campus" flow (DUC-AP-01, 03, 04, 07), showing alternative paths for unsupported domains, the hold state pending email verification, campus selection, and the branching for privacy consent acceptance (CampusInsightSharingConsent).


	•	Affine - Activity Participation Flow
This diagram maps the complex logic of "Join Activity" (DUC-DP-03) and "Manage Join Requests" (DUC-HL-02). It shows the bifurcation based on ParticipationMode (direct vs. approval-based), the concurrent checks on capacity (MaxParticipants), and the mandatory verification of reciprocal blocks.

	•	Affine - Safety & Moderation Flow
Represents the process of submitting a report and its subsequent review by the Campus Admin. It highlights the branching for moderation decisions (ModerationAction), showing how punitive consequences are first recorded in SM and then delegated through targeted internal commands/interfaces to the competent owner modules. User consequences such as suspend_user or ban_user are executed by AP against DS-AP-001, while remove_activity is routed to H&L so the native activity-removal workflow can operate on DS-HL-001 and DS-HL-002. This preserves data ownership by preventing SM from directly mutating stores it does not own.


4.2 Component Diagram
The Component Diagram reflects the architectural choice established during the design phase: a Multi-Tenant Modular Monolith with Event-Driven Internal Flows. The architecture logically divides the backend into six cohesive modules that communicate through explicit module interfaces, targeted internal commands where ownership-preserving delegation is required, and an Internal Event Dispatcher only for confirmed event-driven flows such as notification-related consequences. All modules share the same persistence layer, but data ownership remains strictly enforced at the logical store level.
	•	Affine - System Architecture & Component Diagram
The diagram illustrates the following primary components:
	•	Access and Profile (AP): Manages identity, onboarding, privacy consent, and minimal profiles.
	•	Campus Administration (CA): Handles structural configuration and consent-gated access to student insights.
	•	Hosting and Lifecycle (H&L): The core module for creating and managing the lifecycle of activities and participations.
	•	Discovery and Participation (D&P): Manages feed display, filtering, and guest interactions.
	•	Safety and Moderation (SM): Centralizes community rules, reports, admin reviews, and blocks.
	•	Notifications and System Flow (NSF): The only component authorized to write notification records, reacting to domain events.


5. Testing Plan: Design Test Cases for the System
5.1 Purpose and Scope
This section defines the testing plan for the InCampus object-oriented design. The goal is not to describe low-level implementation tests, but to validate whether the designed system preserves its most important architectural and data-model invariants once it is translated into the first implementation skeleton.
The testing plan focuses on validity, state logic, data consistency, tenant isolation, privacy enforcement, module ownership, and cross-module communication. Since the architecture is a Multi-Tenant Modular Monolith with Event-Driven Internal Flows, the tests must verify that each module mutates only the data stores it owns, that cross-module access remains read-only unless explicitly delegated to the owner module, and that notification-related consequences are handled through the Notifications and System Flow module.
The tests are organized around the six main modules of the system: Campus Administration, Access and Profile, Hosting and Lifecycle, Discovery and Participation, Safety and Moderation, and Notifications and System Flow. A final cross-module section validates the global architectural rules that must hold across the whole platform.
The following test cases translate the testing strategy into concrete validation scenarios. They focus on the highest-risk design invariants: tenant isolation, data ownership, atomic participation updates, notification suppression, consent-gated admin access, and cancellation/deletion semantics.
Test Case ID
Area
Scenario
Expected Result
TC-CA-01
Campus Scope
A Campus Admin tries to manage structured options for a campus outside authorizedCampusIds.
The operation is rejected; DS-CA-001 and DS-CA-002 are not modified.
TC-AP-01
Registration
A student signs up with an unsupported or inactive university email domain.
The registration is rejected and no DS-AP-001 account is created.
TC-AP-02
Consent
A student revokes CampusInsightSharingConsent.
Normal app usage remains available, but identifiable admin insight access is denied.
TC-HL-01
Activity Creation
A host creates an activity using a category or meeting point not belonging to the selected campus.
Creation is rejected; no DS-HL-001 activity is created.
TC-DP-01
Browse Feed
A student browses activities while reciprocal block relationships exist.
Activities hosted by blocked or blocking users are excluded from the feed.
TC-DP-02
Join Activity
Two students concurrently attempt to join the last available slot.
Only one transaction succeeds; counters and DS-HL-002 active records remain consistent.
TC-HL-02
Manage Join Requests
A host approves a pending request while capacity is already full.
Approval is rejected safely; the request is not converted to confirmed participation.
TC-SM-01
Report Review
A Campus Admin records remove_activity as moderation action.
SM updates DS-SM-002 and delegates the consequence to H&L; SM does not directly mutate DS-HL-001 or DS-HL-002.
TC-NSF-01
Notification Suppression
A join event occurs between two users where a block exists.
NSF creates no DS-NS-001 notification record.
TC-NSF-02
Open Notification
A user opens a notification whose referenced activity has been hard-deleted.
The flow remains read-only and routes to a fallback or unavailable context instead of failing.
TC-LC-01
Cancellation vs. Deletion
One activity is cancelled and another is hard-deleted.
The cancelled activity remains stored with Activity.Status = cancelled for relevant contexts; the deleted activity and linked participations are physically removed.

5.2 Campus Administration (CA) Testing Strategy
The Campus Administration module defines the structural configuration layer of the platform. Its tests must verify that campus setup, campus-specific options, and administrative insight access respect the CampusID tenant boundary and do not mutate student-facing stores owned by other modules.
Campus Configuration — DS-CA-001
Tests for DS-CA-001 must validate the correctness and stability of campus records.
Validity and State:
	•	Campus creation must require a valid CampusID, UniversityName, CampusName, and ActivationStatus.
	•	Incomplete or invalid campus records must be rejected.
	•	If ActivationStatus is set to inactive, the campus must not be selectable during student onboarding and must not be usable for new activity creation.
Tenant Boundary:
	•	Every campus configuration operation must be scoped by CampusID.
	•	A Campus Admin must not be able to configure, update, or view campus data outside the campuses included in their authorizedCampusIds.
Consistency:
	•	Updating campus configuration must not orphan or break existing student accounts, activities, reports, or structured options already linked to that campus.
Campus Structured Options — DS-CA-002
Tests for DS-CA-002 must verify that campus locations and activity categories remain correctly scoped, selectable, and stable over time.
Validity and Scope:
	•	Every structured option must belong to a valid CampusID.
	•	Activity categories and campus locations must not be selectable across campuses.
	•	A category or meeting point configured for one campus must be rejected if used during activity creation in another campus.
Active/Inactive Behavior:
	•	Disabled options must no longer be selectable by hosts for future activities.
	•	Disabling or renaming an option must not corrupt existing activities that already reference it.
Snapshot Logic:
	•	Activities already created in DS-HL-001 must preserve their CategoryLabel and MeetingPointLabel snapshots even if the original category or location is renamed, disabled, or removed from future selection.
Campus Admin Runtime Authorization
Campus Admin identity is represented by AuthenticatedAdminContext rather than by a canonical persistent Campus Admin store. Testing must therefore focus on runtime authorization rather than database-level admin records.
Context Validation:
	•	Invalid, empty, expired, or cross-campus AuthenticatedAdminContext values must be rejected.
	•	Admin actions must be allowed only when the selected campus is included in authorizedCampusIds.
Admin Insight Scope:
	•	Consent-based student insight access must be limited to the selected authorized campus.
	•	Requested insight data must belong only to that campus.
	•	Administrative insight access must remain read-only with respect to DS-AP-001, DS-AP-002, DS-HL-001, and DS-HL-002.
5.3 Access and Profile (AP) Testing Strategy
The Access and Profile module controls student identity, authentication, campus association, Student Profile lifecycle, and CampusInsightSharingConsent. Tests must verify that AP correctly regulates entry into the system and exposes profile information only in permitted contexts.
Student Account — DS-AP-001
Tests for DS-AP-001 must validate identity, verification, access state, selected campus association, and consent handling.
Registration Validity:
	•	Registration must require a university email, password, and university student identifier where required.
	•	Plain passwords must never be persisted.
	•	Only PasswordHash must be stored.
Domain Rule Enforcement:
	•	Registration must reject unsupported or inactive university email domains.
	•	The system must read DS-AP-003 University Identity Rules during domain validation.
	•	If the email domain is invalid, no DS-AP-001 account must be created.
Verification State:
	•	VerificationStatus must progress correctly, especially from Pending to Verified.
	•	The account must not become active before successful email verification.
Platform Access State:
	•	PlatformAccessStatus transitions must be validated, including PendingVerification, Active, Suspended, and Banned.
	•	Suspended or banned accounts must be denied normal app access.
Selected Campus:
	•	SelectedCampusID must be stored in DS-AP-001.
	•	The selected campus must define the student’s downstream campus context for activity feed, activity creation, reports, and admin insight scope.
CampusInsightSharingConsent:
	•	CampusInsightSharingConsent must be collectible and updateable without blocking normal student app usage.
	•	If consent is false or revoked, identifiable admin insight access must be denied.
Student Profile — DS-AP-002
Tests for DS-AP-002 must validate profile lifecycle and controlled exposure.
Profile Creation:
	•	A verified student must be able to create one Student Profile.
	•	Duplicate profile creation for the same StudentAccountID must be rejected.
Profile Update:
	•	Editable profile fields must be updateable without modifying authentication-related account data stored in DS-AP-001.
Minimal Exposure:
	•	Profile views must expose only the minimal public profile data required by the current context.
	•	No sensitive account data from DS-AP-001 must be exposed through Student Profile views.
Block Enforcement:
	•	Profile exposure must be denied when a reciprocal block relationship exists between the viewer and the profile owner.
	•	If access is denied, no profile data should leak.
University Identity Rules — DS-AP-003
Tests for DS-AP-003 must validate domain-based registration control.
Rule Enforcement:
	•	Active domain rules must allow registration for supported universities.
	•	Missing or inactive rules must prevent new sign-ups.
Expansion Support:
	•	Adding a new university identity rule must enable future registration for that university without changing the core registration flow.
5.4 Hosting and Lifecycle (H&L) Testing Strategy
The Hosting and Lifecycle module owns the activity and participation stores. It is responsible for activity creation, lifecycle management, host decisions on join requests, cancellation, and hard deletion. Its tests must focus on state correctness, capacity consistency, and atomic write behavior.
Activity — DS-HL-001
Tests for DS-HL-001 must validate activity creation, lifecycle states, capacity fields, and deletion behavior.
Activity Creation Validity:
	•	Activity creation must require a valid host, title, selected category, selected meeting point, schedule, participant limit, and participation mode.
	•	ScheduledDateTime must be in the future at creation time.
Host Eligibility:
	•	Only an active student account with a valid selected campus may create an activity.
Campus Option Validation:
	•	categoryId and meetingPointId must be validated through DS-CA-002.
	•	The selected category and meeting point must belong to the host’s selected campus.
	•	Invalid or cross-campus options must reject activity creation.
Initial State:
	•	Newly created activities must start with Activity.Status = open.
	•	Participant and request counters must be initialized consistently.
Lifecycle States:
	•	Valid persisted Activity.Status values are open, full, completed, and cancelled.
	•	The system must not persist deleted as an Activity.Status, because deletion is a hard-delete workflow outcome.
Cancellation:
	•	Cancelling an activity must update Activity.Status to cancelled.
	•	Cancelled activities must reject future joins or requests.
	•	The activity record must remain stored for relevant cancellation notification and history contexts.
Hard Deletion:
	•	Deleting an activity must physically remove the activity record from DS-HL-001.
	•	Linked participation/request records in DS-HL-002 must also be removed as part of the native H&L deletion behavior.
Capacity and Counters:
	•	CurrentParticipantCount and CurrentRequestCount must never become negative.
	•	Counters must never exceed their configured limits.
	•	Tests must include concurrent joins, concurrent approvals, withdrawal, leave, cancellation, and deletion scenarios.
Participation — DS-HL-002
The Participation store is a critical consistency point because it resolves the relationship between students and activities and directly affects capacity, availability, request handling, and notification-triggering events. Tests for DS-HL-002 must verify both the correctness of the persisted participation model and the atomic behavior of operations that modify participation state.
Participation State Model:
	•	A pending join request must be represented as RecordType = request and Status = pending.
	•	A confirmed participation must be represented as RecordType = participation and Status = confirmed.
	•	A declined request must be represented as RecordType = request and Status = declined.
	•	Non-canonical values such as withdrawn, left, cancelled, or deleted must not be persisted as Participation.Status values. They are workflow outcomes, not stable participation states.
Host Decision Validation:
	•	Approving a pending request must convert the record from request/pending to participation/confirmed.
	•	The participant count in DS-HL-001 must be updated in the same transactional operation.
	•	Approval must fail safely if the activity has reached its participant limit before the transaction is committed.
	•	Declining a request must preserve the record as RecordType = request and update Status to declined.
	•	Declining a request must not increase participant count and must not create a confirmed participation.
Active-Record Uniqueness:
	•	A student must not have more than one active participation-related record for the same ActivityID and StudentAccountID.
	•	The uniqueness rule must apply to active states, especially request/pending and participation/confirmed.
	•	Retained declined records must not accidentally block a later valid active request or participation unless a future business rule explicitly requires that behavior.
Withdraw and Leave Behavior:
	•	Withdrawing a pending request and leaving a confirmed participation must be treated as workflow outcomes, not as new persisted Participation.Status values.
	•	The active request or participation record must be removed or deactivated according to the implementation strategy.
	•	The parent activity availability must be updated consistently.
	•	A pending request withdrawal must not create a DS-NS-001 notification record.
	•	A confirmed participant leaving an activity may trigger the JoinedParticipantLeft event when the host-notification rule applies.
Atomic Transaction Boundary:
	•	Direct join, join request creation, host approval, host decline, request withdrawal, participant leave, activity cancellation, and activity deletion must be executed atomically when they affect participation state, activity counters, or available capacity.
	•	Capacity, duplicate active records, and current activity lifecycle state must be re-checked inside the transaction boundary.
	•	Concurrent operations must not produce over-capacity activities, negative counters, duplicate active records, or confirmed participations linked to deleted activities.
Expected Design Outcome:
	•	DS-HL-002 must contain only valid participation/request records.
	•	DS-HL-001 counters must remain consistent with active participation state.
	•	Participation-related workflow outcomes must preserve the ownership boundary of the H&L module.
5.5 Discovery and Participation (D&P) Testing Strategy
The Discovery and Participation module handles student-facing discovery, activity detail access, join/request actions, withdrawal, leave, and personal activity lists. Since D&P does not own a dedicated data store, tests must verify that it reads and mutates only the stores allowed by the design.
Feed Construction and Filtering
Campus Scope:
	•	The activity feed must return only activities belonging to the authenticated student’s selected CampusID.
Lifecycle Filtering:
	•	Full, cancelled, and completed activities must be excluded from the normal discovery feed.
	•	Hard-deleted activities must be absent because no DS-HL-001 record exists.
Block Filtering:
	•	Activities hosted by users involved in a reciprocal block relationship with the requesting student must not be returned.
Filter Parameters:
	•	Category, time, gender preference, and other supported filters must be applied without bypassing campus scope or block filtering.
Activity Details
Access Control:
	•	Activity details and host Student Profile data must be returned only when no reciprocal block exists between the requesting student and the host.
Read-Only Composition:
	•	Viewing activity details must read DS-HL-001, DS-AP-002, and DS-SM-001 without mutating any store.
Full Activity Direct Access:
	•	An activity accessed directly through a link or notification should display a full or unavailable state when appropriate, rather than appearing in the normal discovery feed.
Join Activity
Direct Join vs. Request:
	•	Direct/open activities must create RecordType = participation and Status = confirmed.
	•	Approval-based activities must create RecordType = request and Status = pending.
Block Prevention:
	•	A student must not be able to join or request to join an activity if a reciprocal block exists between the student and the host.
Duplicate Prevention:
	•	A student must not be able to create a second active request or participation for the same activity.
Atomic Constraints:
	•	Capacity checks, duplicate active-record checks, and counter updates must be re-checked inside the write transaction.
Event Emission:
	•	DirectJoinCompleted must be emitted after a confirmed direct join.
	•	JoinRequestSubmitted must be emitted after a pending request is created.
Withdraw and Leave
Pending Request Withdrawal:
	•	Withdrawing a pending request must remove or deactivate the active request record.
	•	Availability must be updated transactionally.
	•	No DS-NS-001 notification record must be created.
Confirmed Participation Leave:
	•	Leaving a confirmed participation must remove or deactivate the active participation record.
	•	Availability must be decremented transactionally.
	•	JoinedParticipantLeft must be emitted for NSF host notification handling where the business rules require host notification.
Personal Activity List
Read-Only History Composition:
	•	Personal activity lists must be composed from DS-HL-001 and DS-HL-002 without mutation.
Upcoming vs. Past:
	•	Upcoming joined activities and past associated activities must be separated correctly.
Cancellation vs. Deletion:
	•	Cancelled activities may remain visible in relevant personal-history contexts because the activity record is preserved.
	•	Hard-deleted activities must not appear because the activity record no longer exists.
5.6 Safety and Moderation (SM) Testing Strategy
The Safety and Moderation module owns block relationships and report records. Tests must verify that SM records trust-and-safety information correctly while respecting module ownership boundaries. SM must not directly mutate AP, H&L, D&P, CA, or NSF stores.
Block Relationships — DS-SM-001
Validity:
	•	Self-blocking must be rejected.
	•	InitiatorAccountID and BlockedAccountID must not be the same.
Duplicate Prevention:
	•	Duplicate block records for the same initiator and blocked account pair must be prevented or handled safely.
Symmetric Enforcement:
	•	Although the stored block record is directed, downstream effects must be enforced symmetrically.
	•	A block must suppress feed visibility, activity-detail access, profile exposure, new join/request interactions, and cross-user notifications in both directions.
Ownership Boundary:
	•	Creating a block must write only to DS-SM-001.
	•	SM must not directly mutate DS-HL-002, DS-HL-001, DS-AP-001, DS-AP-002, or DS-NS-001.
Conditional Native Delegation:
	•	If the first skeleton includes block-related pending-request consequences, SM must delegate the consequence through RequestPendingParticipationBlockConsequence.
	•	Any resulting participation/request mutation must be executed by H&L under H&L ownership.
	•	If that consequence remains unresolved, tests must still assert the ownership boundary: block creation writes only DS-SM-001, while D&P, AP, H&L, and NSF enforce block effects by reading DS-SM-001 or the SM block-state interface.
Report Records — DS-SM-002
Report Creation:
	•	A report must be created only with a valid reporter, valid campus scope, target type, target reference, reason, and required details.
Target XOR Logic:
	•	A report must target exactly one object: either a user or an activity.
	•	Reports containing both target types or neither target type must be rejected.
Activity Report Boundary:
	•	Activity reports must store the activity target reference from an allowed launch context.
	•	Report submission must not become a full H&L-dependent workflow.
Campus Scope:
	•	Report records must be scoped to the correct CampusID.
	•	Reports must be visible only to authorized Campus Admins for that campus.
Review Workflow:
	•	Campus Admins with a valid AuthenticatedAdminContext must be able to move a report through review states and record a review outcome.
Deleted Target Fallback:
	•	If a report targets an activity that has later been hard-deleted, the review screen must display an unavailable or deleted target fallback while preserving the report record.
Moderation Consequence Delegation:
	•	Punitive moderation actions must be recorded in DS-SM-002 before consequences are delegated.
	•	User actions such as suspend_user or ban_user must be executed by AP.
	•	Activity actions such as remove_activity must be executed by H&L.
	•	SM must never directly mutate DS-AP-001, DS-HL-001, or DS-HL-002.
5.7 Notifications and System Flow (NSF) Testing Strategy
The Notifications and System Flow module is the exclusive writer of DS-NS-001 Notification Records. It consumes confirmed upstream internal events and time-based triggers, resolves recipients, applies suppression rules, creates notification records, and handles read-only notification opening.
Notification Records — DS-NS-001
Exclusive Ownership:
	•	Only NSF may create DS-NS-001 notification records.
	•	AP, CA, H&L, D&P, and SM must not directly write notification records.
Join Event Notification:
	•	DirectJoinCompleted and JoinRequestSubmitted events must create host notifications when no block relationship exists.
Application Outcome Notification:
	•	JoinRequestApproved and JoinRequestDeclined events must create applicant notifications with the correct activity reference and outcome context when no block relationship exists.
Cancellation Notification:
	•	ActivityCancelled must create one notification per currently confirmed participant, unless suppressed by block rules or invalid recipient state.
Leave Notification:
	•	JoinedParticipantLeft must create a host notification when the business rule requires host notification and no block relationship suppresses it.
Activity Reminder:
	•	ActivityReminderDue must create a reminder only for students who are still confirmed participants in an upcoming activity.
	•	A reminder must not be generated if the participant has left, if the activity was cancelled, if the activity was completed, or if the referenced participation is no longer active.
Block Suppression:
	•	Cross-user notifications must be suppressed when a block relationship exists between the triggering user and the recipient.
	•	In such cases, NSF must abort notification creation and create no DS-NS-001 record.
No Business-State Duplication:
	•	Notification records must store only the references and payload required for navigation.
	•	They must not duplicate authoritative activity, participation, account, or report state.
Read-Only Opening:
	•	Opening a notification must read DS-NS-001 and the current upstream business context without updating read/unread state.
	•	No isRead or readAt field is modeled for the first skeleton.
Fallback Behavior:
	•	If a notification target has been hard-deleted or is no longer accessible, the system must route to a fallback or unavailable context instead of producing an unhandled error.
5.8 Cross-Module Integration and Architectural Invariant Test Cases
This final section validates system-wide design rules that cannot be fully tested inside a single module. These tests are essential because the InCampus architecture relies on strict modular ownership within a shared persistence layer.
Data Ownership Boundary:
	•	Each module must mutate only the stores it owns.
	•	Cross-module data access must remain read-only unless the action is delegated to the owning module through a documented internal command or native workflow.
Tenant Isolation:
	•	CampusID must be enforced across onboarding, activity creation, feed construction, report review, campus option management, and admin insight access.
	•	No student, activity, report, option, or insight data from another campus should be returned or mutated.
Event vs. Command Separation:
	•	Notification-related consequences must be handled through event-driven flows consumed by NSF.
	•	Moderation consequences must be routed through targeted internal commands/interfaces to AP or H&L.
	•	SM must not emit generic moderation events or directly mutate AP/H&L stores.
Atomic Participation Consistency:
	•	Join, request, approve, withdraw, leave, cancellation, and deletion operations that affect capacity, participation records, or counters must be executed atomically.
	•	Capacity and duplicate-active-record checks must be re-evaluated inside the transaction boundary.
Privacy and Consent Enforcement:
	•	CampusInsightSharingConsent must be checked before any identifiable admin insight access.
	•	If consent is false or revoked, the admin insight flow must deny access to identifiable profile, interest, and participation-history data.
	•	Normal student app usage must remain unaffected by refusal or revocation of consent.
Block Enforcement Consistency:
	•	DS-SM-001 block relationships must be enforced consistently across feed visibility, activity details, profile exposure, join/request actions, and cross-user notification creation.
Cancellation vs. Deletion Semantics:
	•	Cancellation and deletion must remain distinct.
	•	Cancellation preserves the activity record with Activity.Status = cancelled.
	•	Deletion physically removes the activity and its linked participation records.
Notification Read-Only Opening:
	•	Opening a notification must read DS-NS-001 and current upstream business context without updating notification read/unread state.
	•	Opening a notification must not create parallel business state.
Conclusion
The Object-Oriented Design of the InCampus platform translates the project’s core objective—reducing isolation in university life—into a coherent, modular, and safety-oriented software design. By adopting a Multi-Tenant Modular Monolith with Event-Driven Internal Flows, the system preserves the operational simplicity of a single deployable backend while maintaining clear responsibility boundaries between modules.
The division into six cohesive modules—Access and Profile, Campus Administration, Hosting and Lifecycle, Discovery and Participation, Safety and Moderation, and Notifications and System Flow—supports strict data ownership across the ten canonical logical stores. CampusID provides the tenant boundary for students, activities, reports, structured options, and administrative operations.
Privacy and safety are treated as architectural concerns rather than secondary features. Campus Admin insights are protected through CampusInsightSharingConsent, block relationships are enforced consistently across visibility and notification flows, and moderation consequences are delegated to AP or H&L through targeted internal commands instead of allowing SM to mutate stores it does not own.
The design diagrams collectively refine the original use cases into implementation-aware structures. The class diagram defines persistent entities and relationships, the sequence and collaboration diagrams clarify object-level responsibilities, the state charts define lifecycle semantics, and the activity and component diagrams connect business logic to the selected architecture. The testing plan complements these diagrams by validating the most critical design invariants, including tenant isolation, atomic participation updates, notification suppression, consent-based access, ownership boundaries, and the distinction between cancellation and hard deletion.
Overall, the design provides a consistent and implementation-ready basis for the first InCampus skeleton, while preserving the flexibility needed for future extensions without compromising the MVP’s privacy, safety, and data-consistency constraints.


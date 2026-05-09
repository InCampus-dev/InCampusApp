# InCampus Alpha Sprint Implementation Plan v1.2

**Status:** corrected implementation plan for the first alpha coding skeleton.  
**Purpose:** provide a coding-agent-ready technical blueprint for a 5-day sprint while preserving traceability to the project documentation.

---

## Assignment Deliverable Reminder

The weekly assignment (Group Assignment 5.2) requires a **daily report** submitted as a PDF before 23:00 each day containing:

1. A photo of the standing meeting
2. A working table: Name, contribution hours, completed tasks, problems, planning for tomorrow
3. A screenshot of today's uploaded code
4. A burn-out chart from the online collaboration tool
5. An overall summary of the day's progress

Submission constraints:

- File naming: `Group reports 5.2 DAY [N] - [project keyword]`
- Format: PDF only
- Deadline: upload to Baidu cloud disk project folder before 23:00 each day

This plan is the technical blueprint for the 5-day coding sprint. Daily reports are separate deliverables and must follow the assignment format above.

---

## Section 0 – Source Priority and Agent Execution Rules

### 0.1 Source Priority

When implementation documents disagree, coding agents must follow this order:

1. `CRUD matrix v1.6.md`
2. `Entities & Attributes v1.2.md`
3. `Databases v1.1.md`
4. `Functional Requirements v1.3.md`
5. `Non-Functional Requirements v1.2.md`
6. `Relationship Table v1.1.md`
7. Updated Sequence Diagrams v1.1
8. Updated UCR files:
   - `UCR - A&P v1.2.md`
   - `UCR - C&A v1.1.md`
   - `UCR - D&P v1.2.md`
   - `UCR - H&L v1.4.md`
   - `UCR - N&S v1.2.md`
   - `UCR - S&M v1.3.md`
9. This coding organization plan

This plan is an implementation coordination document, not the source of truth for business rules. If a coding task conflicts with final pre-skeleton documentation, the documentation wins.

### 0.2 Architecture Guardrails

The backend must be implemented as **one deployable Multi-Tenant Modular Monolith**. Packages represent logical module boundaries, not independently deployed microservices.

Coding agents must follow these rules:

- Cross-module access must use explicit exported interfaces, shared contracts, or owning-module services.
- A module must not directly mutate another module's owned store unless the CRUD Matrix explicitly allows that operation and the plan defines the integration path.
- `CampusID` is the tenant boundary and must be checked on campus-scoped student and admin flows.
- `AuthenticatedAdminContext` is a runtime/admin-auth context object, not a canonical database table.
- No `DS-CA-003`, Campus Admin Store, or Admin Account Store is introduced for the first skeleton.
- NSF is the only writer of `DS-NS-001 Notification Records`.
- Opening a notification is read-only and must not update notification state.
- No read/unread state, `isRead`, or `readAt` is modeled on `DS-NS-001` for this skeleton.
- Pending request withdrawal creates no notification and has no NSF handler.
- Deletion and cancellation are distinct: cancellation stores `Activity.Status = cancelled`; deletion is a hard-delete and is not stored as `Activity.Status = deleted`.

### 0.3 Phase 0 – Shared Contracts Freeze

Before feature agents implement business endpoints, the team must freeze shared implementation contracts. No feature agent may implement endpoints or event handlers before these files exist.

Required outputs:

| Output | Required content | Owner |
|---|---|---|
| `docs/api-contract.md` | All client-facing routes, request DTOs, response DTOs, error codes, auth requirements, owning module | Francesco + all |
| `docs/event-contract.md` | `DirectJoinCompleted`, `JoinRequestSubmitted`, `JoinRequestApproved`, `JoinRequestDeclined`, `ActivityCancelled`, `JoinedParticipantLeft`, `ActivityReminderDue` | Jacopo + Matteo |
| `docs/internal-command-contract.md` | `RequestAccountModerationAction`, `RequestActivityModerationAction`, `RequestPendingParticipationBlockConsequence` | Francesco + Jacopo + Matteo |
| `docs/error-contract.md` | Shared error envelope and stable error codes | Francesco |
| `docs/demo-scenarios.md` | End-to-end alpha demo scenarios and seed assumptions | Francesco + all |
| `packages/shared/src/domain/enums.ts` | Shared enums listed below | Jacopo |
| `packages/shared/src/domain/dtos.ts` | Shared DTO types used across packages | Jacopo |
| `packages/shared/src/auth/AuthenticatedStudentContext.ts` | Student runtime auth context | Jacopo |
| `packages/shared/src/auth/AuthenticatedAdminContext.ts` | Admin runtime auth context | Francesco |
| `packages/shared/src/errors/ErrorContract.ts` | Shared error response contract | Francesco |

Required shared enums:

- `ActivityStatus = open | full | completed | cancelled`
- `ParticipationRecordType = request | participation`
- `ParticipationStatus = pending | confirmed | declined`
- `PlatformAccessStatus = PendingVerification | Active | Suspended | Banned`
- `VerificationStatus = Pending | Verified`
- `NotificationType = JoinEvent | ApplicationOutcome | ActivityCancellation | LeaveEvent | ActivityReminder`
- `TargetContextType = JoinRequestReview | ActivityDetails | CancelledActivityContext | PersonalActivityContext`
- `ModerationAction = none | warn_user | suspend_user | ban_user | remove_activity`
- `GenderPreference = all | male | female`
- `ParticipationMode = open | approval_based`

### 0.4 Database Implementation Decision – DS-CA-002

For the first skeleton, implement `DS-CA-002 Campus Structured Options` as one physical table:

```text
campus_structured_options
```

Required fields:

- `optionId`
- `campusId`
- `optionType: activity_category | campus_location`
- `name`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

Implementation rules:

- H&L validates `categoryId` by checking `optionType = activity_category`.
- H&L validates `meetingPointId` by checking `optionType = campus_location`.
- Existing activities store snapshot labels, so later option rename/deactivation does not corrupt activity display.
- Do not create separate physical stores for `ActivityCategory` and `CampusLocation` unless the team explicitly decides to diverge from the first-skeleton model.

### 0.5 Transaction and Concurrency Rules

Any operation changing `Activity.CurrentParticipantCount`, `Activity.CurrentRequestCount`, `Activity.Status`, or `Participation` records must run inside a database transaction.

Checks performed before a transaction are only preliminary. The real capacity, duplicate, status, and authorization checks must be repeated inside the transaction.

Required invariants:

- Capacity is re-checked inside the write transaction.
- Existing request/participation state is re-checked inside the write transaction.
- A uniqueness constraint prevents duplicate active records for the same `ActivityID` and `StudentAccountID`.
- Conflicting concurrent operations receive safe rejection.
- Counters must be derived or updated transactionally and must not rely on stale client-side values.

### 0.6 D&P Ownership Rule

D&P owns no persistent store. For join, withdraw, and leave operations, D&P may orchestrate H&L-owned state changes only through approved H&L participation interfaces or transaction services. D&P must not create independent Activity/Participation persistence logic that diverges from H&L.

### 0.7 Notification List Decision

Keep `NSF09` and `M06` for the alpha skeleton.

`GET /notifications` is allowed only as an alpha support endpoint:

- recipient-scoped
- paginated
- read-only
- no `isRead`
- no `readAt`
- no `read/unread`
- no mutation when opened

Formal notification context opening remains:

```http
GET /notifications/{notificationId}/context
```

---

## Section 1 – GitLab Repository Setup

### Repository Structure

Two repositories are needed for the sprint:

- **`inCampus-backend`** – Multi-Tenant Modular Monolith, Node.js/TypeScript
- **`inCampus-mobile`** – React Native mobile client, Android/iOS

```text
inCampus-backend/
├── packages/
│   ├── shared/                    # EventBus, middleware, DB config, auth contexts, shared contracts
│   ├── access-profile/            # AP module
│   ├── campus-administration/      # CA module
│   ├── hosting-lifecycle/          # H&L module
│   ├── discovery-participation/    # D&P module
│   ├── safety-moderation/          # SM module
│   └── notifications-system-flow/  # NSF module
├── docs/                          # API, event, command, error, demo contracts
├── .gitlab-ci.yml
└── README.md
```

```text
inCampus-mobile/
├── src/
│   ├── screens/                   # One folder per use-case boundary
│   ├── services/                  # API client
│   ├── navigation/
│   └── components/
├── .gitlab-ci.yml
└── README.md
```

### Branching Strategy

- **`main`** – production-ready, protected
- **`develop`** – integration branch, protected
- **Feature branches** – `feature/<module>/<short-description>`, e.g. `feature/ap/signup-endpoint`

Workflow rules:

- No direct pushes to `main` or `develop`.
- All work happens on a feature branch.
- When a task is completed, open a Merge Request to `develop`.
- At least one other team member must review and approve before merging.
- If a merge conflict occurs, the branch owner resolves it with guidance from the reviewer.

### Module Ownership

| Developer | Primary Modules | Extras |
|---|---|---|
| Jacopo | AP, NSF | Shared auth contracts, AP mobile flows |
| Matteo | H&L, D&P | Activity mobile flows, transaction-sensitive participation flows |
| Francesco | CA, SM | Shared infrastructure, CI, DB, admin auth, NSF04, NSF05, integration review |

Each developer is the owner of the merge/review for their modules. Coding agents may generate implementation branches, but the human owner remains responsible for consistency with documentation.

---

## Section 2 – Full Task Inventory

Every task is derived from an existing document: UCR, Sequence Diagram, CRUD Matrix, Entity Catalog, Database document, or Architectural Choice document.

Complexity:

- **S** = ≤2 hours
- **M** = 2–4 hours
- **L** = 4–6 hours

| Task ID | Module | Task Description | Derived From | Complexity | Assigned To |
|---|---|---|---|---|---|
| **SHARED / CONTRACTS** | | | | | |
| S00 | Shared | Freeze shared contracts: API, events, internal commands, errors, auth contexts, domain enums | All updated UCRs; CRUD matrix v1.6; Sequence Diagrams v1.1 | L | Francesco + all |
| S01 | Shared | Initialize monorepo structure, package.json, tsconfig, linter | System Architecture Diagram | S | Francesco |
| S02 | Shared | Set up PostgreSQL connection and TypeORM configuration | Databases v1.1.md | M | Francesco |
| S03 | Shared | Create database migrations for all canonical stores, including unified `campus_structured_options` for DS-CA-002 | Entities & Attributes v1.2.md; Databases v1.1.md | L | Francesco |
| S04 | Shared | Implement JWT authentication middleware and `AuthenticatedStudentContext` | UCR - A&P v1.2.md | M | Jacopo |
| S05 | Shared | Implement simple in-memory EventBus with typed event payloads | 01 Design Scope and Architectural Choice v1.1.md; UCR - N&S v1.2.md | M | Jacopo |
| S06 | Shared | Set up GitLab CI pipeline: lint, test, build | Assignment requirements | S | Francesco |
| S07 | Shared / H&L / D&P | Implement transaction helper and active participation uniqueness strategy | CRUD matrix v1.6; UCR - D&P v1.2; UCR - H&L v1.4 | L | Matteo + Francesco |
| S08 | Shared / DB | Seed demo university, one active campus, categories, locations, accounts, profiles, and sample activities | Demo needs; AP/CA/H&L/D&P integration | M | Francesco |
| **AP** | | | | | |
| AP01 | AP | Module scaffold: controllers, services, routes | UCR - A&P v1.2.md | S | Jacopo |
| AP02 | AP | Implement `StudentAccount` repository, DS-AP-001 | Entities & Attributes v1.2.md; CRUD matrix v1.6.md | M | Jacopo |
| AP03 | AP | Implement `UniversityIdentityRule` repository, DS-AP-003 | Entities & Attributes v1.2.md | S | Jacopo |
| AP04 | AP | Sign-Up endpoint: `POST /auth/signup` with domain validation | Sign Up and Select Campus Sequence Diagram v1.1; DUC-AP-01 | L | Jacopo |
| AP05 | AP | Verify-Email endpoint and mock email gateway | DUC-AP-01 | M | Jacopo |
| AP06 | AP | Sign-In endpoint: `POST /auth/signin`, return JWT | DUC-AP-02 | M | Jacopo |
| AP07 | AP | Select Campus: `GET /campuses`, `PATCH /accounts/me/campus` | DUC-AP-03; Sign Up and Select Campus Sequence Diagram v1.1 | M | Jacopo |
| AP08 | AP | Set Up Profile: `POST /profiles` | DUC-AP-04 | M | Jacopo |
| AP09 | AP | Edit Profile and View Student Profile endpoints | DUC-AP-05; DUC-AP-06 | M | Jacopo |
| AP10 | AP | Update Campus Insight Consent: `PATCH /accounts/me/consent` | DUC-AP-07 | S | Jacopo |
| AP11 | AP | Unit tests for AP services | All AP UCRs | M | Jacopo |
| AP12 | AP | Implement `AccountModerationCommandHandler`: receive `RequestAccountModerationAction` from SM and update `DS-AP-001.PlatformAccessStatus` under AP ownership | UCR - A&P v1.2 Internal Interfaces; UCR - S&M v1.3 | S | Jacopo |
| **CA** | | | | | |
| CA01 | CA | Module scaffold and repositories for `Campus` and unified `CampusStructuredOption` | UCR - C&A v1.1.md; Entities & Attributes v1.2.md | M | Francesco |
| CA02 | CA | Configure New Campus: `POST /admin/campuses` with initial structured options | Configure New Campus Sequence Diagram v1.1; DUC-CA-01 | L | Francesco |
| CA03 | CA | Manage Campus Structured Options: CRUD endpoints over `campus_structured_options` | DUC-CA-02 | L | Francesco |
| CA04 | CA | View Consent-Based Student Insights: `GET /admin/campuses/{campusId}/student-insights` | View Consent-Based Student Insights Sequence Diagram v1.1; DUC-CA-03 | M | Francesco |
| CA05 | CA | Unit tests for CA services | All CA UCRs | M | Francesco |
| **H&L** | | | | | |
| HL01 | H&L | Module scaffold, `Activity` and `Participation` repositories | UCR - H&L v1.4.md; Entities & Attributes v1.2.md | M | Matteo |
| HL02 | H&L | Create Activity: `POST /activities`; validate host eligibility and campus options; persist category/meeting-point snapshot labels | DUC-HL-01; UCR - H&L v1.4.md | L | Matteo |
| HL03 | H&L | Manage Join Requests: `GET /activities/{id}/requests`, `PATCH /activities/{id}/requests/{requestId}` with atomic approve/decline | Manage Join Requests Sequence Diagram v1.1; DUC-HL-02 | L | Matteo |
| HL04 | H&L | Update Activity Status: `PATCH /activities/{id}/status`, cancel/complete; emit `ActivityCancelled` when applicable | DUC-HL-03 | M | Matteo |
| HL05 | H&L | Delete Activity: `DELETE /activities/{id}`, hard-delete cascade | DUC-HL-04 | M | Matteo |
| HL06 | H&L | Unit tests for H&L services | All H&L UCRs | M | Matteo |
| HL07 | H&L | Implement `ActivityModerationCommandHandler`: receive `RequestActivityModerationAction` from SM and execute H&L-native removal workflow | UCR - H&L v1.4.md; UCR - S&M v1.3 | S | Matteo |
| **D&P** | | | | | |
| DP01 | D&P | Module scaffold and service layer using H&L/AP/SM interfaces | UCR - D&P v1.2.md | S | Matteo |
| DP02 | D&P | Browse Activities: `GET /activities` with filtering and block enforcement | DUC-DP-01 | L | Matteo |
| DP03 | D&P | View Activity Details: `GET /activities/{id}` with host profile and block check | DUC-DP-02 | M | Matteo |
| DP04 | D&P | Join Activity: `POST /activities/{id}/join` with atomic capacity check and event emission; uses H&L participation interfaces, not HL03 business logic | Join Activity Sequence Diagram v1.1; DUC-DP-03 | L | Matteo |
| DP05 | D&P | Withdraw Join Request and Leave Joined Activity: delete endpoints, no notification for pending withdrawal, `JoinedParticipantLeft` for confirmed leave | DUC-DP-04; DUC-DP-05 | M | Matteo |
| DP06 | D&P | View Personal Activity List: `GET /profiles/me/activities` | DUC-DP-06 | M | Matteo |
| DP07 | D&P | Unit tests for D&P services | All D&P UCRs | M | Matteo |
| **NSF** | | | | | |
| NSF01 | NSF | Module scaffold and `NotificationRecord` repository, DS-NS-001 | UCR - N&S v1.2.md; Entities & Attributes v1.2.md | M | Jacopo |
| NSF02 | NSF | `JoinEventNotificationHandler`: consumes `DirectJoinCompleted`, `JoinRequestSubmitted` | Notification Event Handling Sequence Diagram v1.1; DUC-NSF-01 | M | Jacopo |
| NSF03 | NSF | `ApplicationOutcomeNotificationHandler`: consumes `JoinRequestApproved`, `JoinRequestDeclined` | DUC-NSF-02 | M | Jacopo |
| NSF04 | NSF | `CancellationNotificationHandler`: consumes `ActivityCancelled`, participant fan-out | DUC-NSF-03 | M | Francesco |
| NSF05 | NSF | `LeaveEventNotificationHandler`: consumes `JoinedParticipantLeft` | DUC-NSF-04 | M | Francesco |
| NSF06 | NSF | `ActivityReminderHandler`: time-triggered fan-out; reminder is MVP | DUC-NSF-05; CRUD matrix v1.6.md | M | Jacopo |
| NSF07 | NSF | Open Notification Context: `GET /notifications/{id}/context`, read-only | DUC-NSF-06 | M | Jacopo |
| NSF08 | NSF | Unit tests for NSF handlers | All NSF UCRs | M | Jacopo |
| NSF09 | NSF | Notification list endpoint: `GET /notifications`, paginated, recipient-scoped, read-only, no `isRead`/`readAt` | FR-0704; UCR - N&S v1.2 open point 3; alpha support decision | M | Jacopo |
| **SM** | | | | | |
| SM01 | SM | Module scaffold, `BlockRelationship` and `ReportRecord` repositories | UCR - S&M v1.3.md | M | Francesco |
| SM02 | SM | Block User: `POST /blocks` with symmetric enforcement through downstream reads | DUC-SM-04 | M | Francesco |
| SM03 | SM | Report User or Activity: `POST /reports`; no full `DS-HL-001` read at submit time | DUC-SM-02; Report and Review Report Sequence Diagram v1.1 | M | Francesco |
| SM04 | SM | Review Report: admin report list/detail/review endpoints with moderation action dispatch | DUC-SM-03; Report and Review Report Sequence Diagram v1.1 | L | Francesco |
| SM05 | SM | View Community Rules: `GET /community-rules`, static content | DUC-SM-01 | S | Francesco |
| SM06 | SM | Unit tests for SM services | All SM UCRs | M | Francesco |
| **MOBILE** | | | | | |
| M01 | Mobile | Initialize React Native project, navigation stack, theme, API client shell, mocked auth token storage | Architecture choice; assignment requirements | S | Francesco |
| M02 | Mobile | Sign-Up and Sign-In screens integrated with backend | Sign Up and Select Campus Sequence Diagram v1.1 | M | Jacopo |
| M03 | Mobile | Campus Selection, Profile Setup, and consent screens | DUC-AP-03; DUC-AP-04; DUC-AP-07 | M | Jacopo |
| M04 | Mobile | Activity Feed and Activity Details screens | DUC-DP-01; DUC-DP-02 | M | Matteo |
| M05 | Mobile | Create Activity and Manage Join Requests screens | DUC-HL-01; DUC-HL-02 | M | Matteo |
| M06 | Mobile | Basic notification list and notification-context opening; uses `GET /notifications` and `GET /notifications/{id}/context`; no read/unread UI state | DUC-NSF-06; NSF09 alpha support decision | S | Jacopo |

---

## Section 3 – 5-Day Sprint Schedule

### Day 1 – Contracts, Foundation, Mobile Shell

| Developer | Tasks | Dependencies |
|---|---|---|
| **Francesco** | S00 coordination, S01, S02, S03 start, S06, S08 start, CA01 scaffold, M01 mobile init | None |
| **Jacopo** | S00 shared enums/API/event draft, S04, S05, AP01, AP02, AP03, NSF01 scaffold | None |
| **Matteo** | S00 participation/event review, S07 design start, HL01 scaffold, DP01 scaffold, mocked Activity screens draft | None |

Day 1 completion criteria:

- Shared contracts exist in `docs/`.
- Backend starts locally.
- Mobile app shell starts locally.
- DB connection is configured.
- EventBus is typed enough for agents to consume/emit agreed events.

### Day 2 – Core Modules and Seed Data

| Developer | Tasks | Dependencies |
|---|---|---|
| **Francesco** | S03 complete migrations, S08 complete seed data, CA02 Configure New Campus, CA03 start Manage Options | S02, S03 |
| **Jacopo** | AP04 Sign-Up, AP05 Verify Email, AP06 Sign-In with JWT, AP07 start Campus Selection after CA seed/API is available | S04, S05, S08 |
| **Matteo** | HL02 Create Activity using seeded options and snapshot labels; DP02 Browse Activities with mock/seed data | S07 design, S08, CA seed/options |

Day 2 completion criteria:

- Seed campus and options are available even if CA UI/API is incomplete.
- Sign-up/sign-in can be tested.
- At least one activity can be created and browsed using seed data.

### Day 3 – Business Logic, Transactions, Events

| Developer | Tasks | Dependencies |
|---|---|---|
| **Francesco** | CA03 complete, CA04 Admin Insights, SM01, SM02 Block User, SM05 Community Rules | CA02, S08 |
| **Jacopo** | AP07 complete, AP08, AP09, AP10, AP12 AccountModerationCommandHandler, NSF02, NSF03 | AP core, S05 |
| **Matteo** | S07 transaction helper complete, HL03 Manage Join Requests, HL07 ActivityModerationCommandHandler, DP03 View Details, DP04 Join Activity | HL01, HL02, SM block interface or stub |

Corrected dependency note:

- `DP04` depends on shared Activity/Participation repositories or H&L participation interfaces, SM block access, and EventBus.
- `DP04` does **not** depend on `HL03` business logic.
- `DP04` and `HL03` must share the same Participation model and transaction helper.

Day 3 completion criteria:

- Join/request creates canonical participation records.
- Host approve/decline uses the same model.
- D&P emits `DirectJoinCompleted` / `JoinRequestSubmitted`.
- H&L emits `JoinRequestApproved` / `JoinRequestDeclined`.
- AP12 and HL07 are available before SM04 integration.

### Day 4 – Integration, Notifications, Moderation

| Developer | Tasks | Dependencies |
|---|---|---|
| **Francesco** | SM03 Report Submission, SM04 Review Report with moderation dispatch, NSF04 Cancellation fan-out, NSF05 Leave Event, integration tests | AP12, HL07, SM01, SM02, EventBus |
| **Jacopo** | NSF06 Reminder, NSF07 Open Notification Context, NSF09 Notification List, AP11 unit tests, M02 Sign-Up/Sign-In flow | NSF01-03, AP endpoints |
| **Matteo** | HL04 Update Status, HL05 Delete Activity, DP05 Withdraw/Leave, DP06 Personal List, DP07 tests, M04 activity feed | HL03, DP04, EventBus |

Mitigation:

- NSF04 and NSF05 handlers must be testable with synthetic events independently of H&L/D&P merge timing.
- If HL04 or DP05 is not merged before NSF integration, handlers are validated with synthetic `ActivityCancelled` and `JoinedParticipantLeft` events, then validated end-to-end on Day 5.
- If AP12 or HL07 is not complete, SM04 can record the moderation action but must return `commandDispatchPending` in tests instead of pretending native consequences were executed.

Day 4 completion criteria:

- Report submission does not perform full `DS-HL-001` read.
- Review Report can read activity context and show unavailable/deleted fallback.
- Moderation commands are dispatched to AP/H&L handlers.
- Notification handlers write only `DS-NS-001`.

### Day 5 – Final Integration, Mobile Polish, Demo

| Developer | Tasks | Dependencies |
|---|---|---|
| **Francesco** | SM06 tests, integration fixes, CI stability, final seed/demo data verification | All SM tasks |
| **Jacopo** | NSF08 tests, M03 campus/profile/consent screens, M06 notification list/context, AP/NSF integration tests | AP + NSF endpoints |
| **Matteo** | HL06 tests, DP07 final tests, M04/M05 polish, end-to-end activity demo | Backend stable |

Day 5 completion criteria:

- Full suite runs.
- Demo scenarios work with seed data.
- Mobile can demonstrate onboarding, activity flow, notification list/context, and at least one moderation/admin flow.
- Daily report evidence can be collected before the deadline.

---

## Section 4 – File Creation List

### Backend – Documentation and Contracts (`docs/`)

| File Path | Purpose | Developer |
|---|---|---|
| `docs/api-contract.md` | Single source for implemented alpha API endpoints | Francesco + all |
| `docs/event-contract.md` | Typed internal event payload contracts | Jacopo + Matteo |
| `docs/internal-command-contract.md` | Moderation and block-consequence command contracts | Francesco + all |
| `docs/error-contract.md` | Shared error envelope and stable error codes | Francesco |
| `docs/demo-scenarios.md` | Seed data and end-to-end alpha demo flows | Francesco + all |

### Backend – Shared (`packages/shared/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/config/database.ts` | TypeORM connection setup | Francesco |
| `src/db/transaction.ts` | Shared transaction helper for capacity/state-changing operations | Matteo + Francesco |
| `src/db/constraints.ts` | Shared DB constraint helpers and uniqueness notes | Matteo + Francesco |
| `src/domain/enums.ts` | Shared domain enums | Jacopo |
| `src/domain/dtos.ts` | Shared DTOs used across modules | Jacopo |
| `src/auth/AuthenticatedStudentContext.ts` | Runtime student auth context | Jacopo |
| `src/auth/AuthenticatedAdminContext.ts` | Runtime admin context; not a DB table | Francesco |
| `src/middleware/auth.ts` | JWT verification middleware | Jacopo |
| `src/middleware/adminAuth.ts` | Controlled alpha stub that injects `AuthenticatedAdminContext`; no admin store | Francesco |
| `src/events/EventBus.ts` | In-memory typed pub/sub implementation | Jacopo |
| `src/errors/AppError.ts` | Centralized error classes | Francesco |
| `src/errors/ErrorContract.ts` | Shared API error envelope | Francesco |
| `src/migrations/*.ts` | Canonical store table migrations | Francesco |
| `src/seed/demoSeed.ts` | Demo data for alpha testing | Francesco |

### Access & Profile (`packages/access-profile/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/entities/StudentAccount.ts` | DS-AP-001 entity | Jacopo |
| `src/entities/StudentProfile.ts` | DS-AP-002 entity | Jacopo |
| `src/entities/UniversityIdentityRule.ts` | DS-AP-003 entity | Jacopo |
| `src/repositories/StudentAccountRepo.ts` | CRUD for accounts | Jacopo |
| `src/repositories/StudentProfileRepo.ts` | CRUD for profiles | Jacopo |
| `src/repositories/IdentityRuleRepo.ts` | Read domain rules | Jacopo |
| `src/services/DomainValidationService.ts` | Email domain check | Jacopo |
| `src/services/AccountActivationService.ts` | Account creation and verification | Jacopo |
| `src/services/CampusAssociationService.ts` | Campus selection logic | Jacopo |
| `src/services/ProfileService.ts` | Profile CRUD | Jacopo |
| `src/services/ConsentService.ts` | Campus insight consent update | Jacopo |
| `src/services/AccountModerationCommandHandler.ts` | Receives `RequestAccountModerationAction`; updates only AP-owned account state | Jacopo |
| `src/controllers/AuthController.ts` | Sign-Up, Verify Email, Sign-In HTTP handlers | Jacopo |
| `src/controllers/CampusController.ts` | Campus selection routes | Jacopo |
| `src/controllers/ProfileController.ts` | Profile endpoints | Jacopo |
| `src/controllers/ConsentController.ts` | Consent endpoint | Jacopo |
| `src/routes/index.ts` | AP route definitions | Jacopo |
| `src/__tests__/` | Unit tests | Jacopo |

### Campus Administration (`packages/campus-administration/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/entities/Campus.ts` | DS-CA-001 entity | Francesco |
| `src/entities/CampusStructuredOption.ts` | Unified DS-CA-002 entity for categories and locations | Francesco |
| `src/repositories/CampusRepo.ts` | Campus CRUD | Francesco |
| `src/repositories/CampusOptionsRepo.ts` | Structured options CRUD | Francesco |
| `src/services/CampusConfigurationService.ts` | Configure campus logic | Francesco |
| `src/services/CampusOptionsService.ts` | Manage options logic | Francesco |
| `src/services/CampusAuthorizationService.ts` | Runtime admin campus-scope authorization | Francesco |
| `src/services/AdminInsightService.ts` | Consent-gated, read-only insight assembly | Francesco |
| `src/controllers/CampusConfigController.ts` | `POST /admin/campuses` | Francesco |
| `src/controllers/CampusOptionsController.ts` | Structured options endpoints | Francesco |
| `src/controllers/AdminInsightController.ts` | Student insights endpoint | Francesco |
| `src/routes/index.ts` | CA route definitions | Francesco |
| `src/__tests__/` | Unit tests | Francesco |

### Hosting & Lifecycle (`packages/hosting-lifecycle/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/entities/Activity.ts` | DS-HL-001 entity; `Status = open | full | completed | cancelled`; no `deleted` status | Matteo |
| `src/entities/Participation.ts` | DS-HL-002 entity; `RecordType = request | participation`; `Status = pending | confirmed | declined` | Matteo |
| `src/repositories/ActivityRepo.ts` | Activity CRUD | Matteo |
| `src/repositories/ParticipationRepo.ts` | Participation CRUD | Matteo |
| `src/services/ParticipationTransactionService.ts` | Shared transaction service for join/request/approve/withdraw/leave/cancel/delete invariants | Matteo |
| `src/services/ActivityLifecycleService.ts` | Create, update status, delete | Matteo |
| `src/services/JoinRequestManagementService.ts` | Host approve/decline with atomic checks | Matteo |
| `src/services/ActivityModerationCommandHandler.ts` | Receives `RequestActivityModerationAction`; performs H&L-native removal workflow | Matteo |
| `src/controllers/ActivityController.ts` | Activity endpoints | Matteo |
| `src/controllers/JoinRequestController.ts` | Host request management endpoints | Matteo |
| `src/routes/index.ts` | H&L route definitions | Matteo |
| `src/__tests__/` | Unit tests | Matteo |

### Discovery & Participation (`packages/discovery-participation/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/services/FeedService.ts` | Browse with filter and block enforcement | Matteo |
| `src/services/ActivityDetailService.ts` | Activity detail + host profile | Matteo |
| `src/services/JoinService.ts` | Atomic join/request orchestration through H&L participation interface; emits D&P events | Matteo |
| `src/services/WithdrawLeaveService.ts` | Withdraw/leave logic; no pending-withdraw notification | Matteo |
| `src/controllers/DiscoveryController.ts` | Feed and detail endpoints | Matteo |
| `src/controllers/ParticipationController.ts` | Join, withdraw, leave, personal list | Matteo |
| `src/routes/index.ts` | D&P route definitions | Matteo |
| `src/__tests__/` | Unit tests | Matteo |

### Notifications & System Flow (`packages/notifications-system-flow/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/entities/NotificationRecord.ts` | DS-NS-001 entity; no read/unread fields | Jacopo |
| `src/repositories/NotificationRepo.ts` | Notification CRUD | Jacopo |
| `src/handlers/JoinEventHandler.ts` | Consumes `DirectJoinCompleted`, `JoinRequestSubmitted` | Jacopo |
| `src/handlers/ApplicationOutcomeHandler.ts` | Consumes `JoinRequestApproved`, `JoinRequestDeclined` | Jacopo |
| `src/handlers/CancellationHandler.ts` | Consumes `ActivityCancelled`, fan-out | Francesco |
| `src/handlers/LeaveEventHandler.ts` | Consumes `JoinedParticipantLeft` | Francesco |
| `src/handlers/ReminderHandler.ts` | Consumes `ActivityReminderDue` | Jacopo |
| `src/services/RecipientResolutionService.ts` | Resolve recipient from event | Jacopo |
| `src/services/BlockSuppressionService.ts` | Check block existence for cross-user notifications | Jacopo |
| `src/services/NotificationComposer.ts` | Build notification record from event context | Jacopo |
| `src/services/NotificationDispatcher.ts` | Push/in-app dispatch stub | Jacopo |
| `src/controllers/NotificationContextController.ts` | `GET /notifications/{id}/context` | Jacopo |
| `src/controllers/NotificationListController.ts` | `GET /notifications`, recipient-scoped read-only list, no read/unread state | Jacopo |
| `src/routes/index.ts` | NSF route definitions | Jacopo |
| `src/__tests__/` | Unit tests | Jacopo |

### Safety & Moderation (`packages/safety-moderation/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/entities/BlockRelationship.ts` | DS-SM-001 entity | Francesco |
| `src/entities/ReportRecord.ts` | DS-SM-002 entity | Francesco |
| `src/repositories/BlockRepo.ts` | Block CRUD | Francesco |
| `src/repositories/ReportRepo.ts` | Report CRUD | Francesco |
| `src/services/BlockService.ts` | Block user logic | Francesco |
| `src/services/ReportSubmissionService.ts` | Report validation and creation; no full activity read for activity reports at submission | Francesco |
| `src/services/ReportReviewService.ts` | Review, outcome, moderation trace | Francesco |
| `src/services/ModerationActionDispatcher.ts` | Dispatches AP/H&L native moderation commands | Francesco |
| `src/services/PendingParticipationConsequenceDispatcher.ts` | Conditional dispatcher for block-related pending-request consequences; SM does not mutate DS-HL-002 | Francesco |
| `src/services/CommunityRulesService.ts` | Static rules retrieval | Francesco |
| `src/controllers/BlockController.ts` | Block endpoint | Francesco |
| `src/controllers/ReportController.ts` | Submit report endpoint | Francesco |
| `src/controllers/AdminReportController.ts` | Admin review endpoints | Francesco |
| `src/controllers/RulesController.ts` | Community rules endpoint | Francesco |
| `src/routes/index.ts` | SM route definitions | Francesco |
| `src/__tests__/` | Unit tests | Francesco |

### Mobile (`inCampus-mobile/`)

| File Path | Purpose | Developer |
|---|---|---|
| `src/screens/SignUpScreen.tsx` | Sign-up form | Jacopo |
| `src/screens/SignInScreen.tsx` | Sign-in form | Jacopo |
| `src/screens/CampusSelectionScreen.tsx` | Campus picker | Jacopo |
| `src/screens/ProfileSetupScreen.tsx` | Profile creation | Jacopo |
| `src/screens/ConsentSettingsScreen.tsx` | Campus insight sharing consent UI | Jacopo |
| `src/screens/ActivityFeedScreen.tsx` | Browse activities | Matteo |
| `src/screens/ActivityDetailsScreen.tsx` | Activity detail view | Matteo |
| `src/screens/CreateActivityScreen.tsx` | Activity creation form | Matteo |
| `src/screens/ManageRequestsScreen.tsx` | Host join request management | Matteo |
| `src/screens/NotificationListScreen.tsx` | Notification inbox, read-only list | Jacopo |
| `src/screens/NotificationFallbackScreen.tsx` | Deleted/inaccessible notification target fallback | Jacopo |
| `src/services/api.ts` | Axios instance with JWT interceptor | Francesco |
| `src/navigation/AppNavigator.tsx` | Navigation container | Francesco |
| `__tests__/` | Basic render tests | All |

---

## Section 5 – Integration Checklist

Before merging into `develop`, every feature branch must verify:

- It uses shared enums and DTOs from `packages/shared`.
- It follows the error contract from `docs/error-contract.md`.
- It does not introduce undocumented status values.
- It does not mutate another module's owned store outside the documented path.
- It uses `CampusID` checks for campus-scoped operations.
- It has at least one unit test or integration test for its main success path.
- It does not add read/unread notification behavior.
- It does not add a pending-request withdrawal notification branch.

---

## Section 6 – Alpha Demo Scenarios

The sprint should end with these demoable flows:

1. Student signs up, verifies email, selects campus, creates profile, sets/refuses insight consent.
2. Host creates an activity with category and meeting point validated from campus structured options.
3. Guest browses feed, opens activity details, joins directly or submits join request.
4. Host reviews pending request and approves/declines it.
5. NSF creates notification records for join/request and application outcome events.
6. Student opens notification context through read-only route.
7. Student withdraws pending request without notification.
8. Confirmed participant leaves joined activity and host receives leave notification.
9. Host cancels activity and participants receive cancellation notification.
10. Student submits report; Campus Admin reviews report and dispatches AP/H&L moderation command.
11. Campus Admin views consent-based insights only for authorized campus and consenting students.

---

## Final Note

All business logic tasks are traceable to the project documentation: UCRs, Sequence Diagrams, CRUD Matrix, Entity Catalog, Relationship Table, Database document, and Architectural Choice document.

Implementation technology choices — Node.js, TypeScript, TypeORM, PostgreSQL, and React Native — are team implementation decisions and should be confirmed by the team before Day 1.

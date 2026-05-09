# InCampus Alpha Sprint Implementation Plan

**Assignment Deliverable Reminder**  
The weekly assignment (Group Assignment 5.2) requires a **daily report** submitted as a PDF before 23:00 each day containing:
1. A photo of the standing meeting
2. A working table (Name, Contribution hours, Completed tasks, Problems, Planning for tomorrow)
3. A screenshot of today’s uploaded code
4. A burn‑out chart from your online collaboration tool
5. An overall summary of the day’s progress  

*This plan is the technical blueprint for the 5‑day coding sprint. The daily reports are to be produced separately following the above format.*

---

## Section 1 – GitLab Repository Setup

### Repository Structure
Two repositories are needed for the sprint:
- **`inCampus-backend`** – Multi‑Tenant Modular Monolith (Node.js/TypeScript)
- **`inCampus-mobile`** – React Native mobile client (Android/iOS)

```
inCampus-backend/
├── packages/
│   ├── shared/                    # EventBus, middleware, DB config, JWT
│   ├── access-profile/            # AP module
│   ├── campus-administration/      # CA module
│   ├── hosting-lifecycle/          # H&L module
│   ├── discovery-participation/    # D&P module
│   ├── safety-moderation/          # SM module
│   └── notifications-system-flow/  # NSF module
├── docs/                          # Architecture diagrams (imported)
├── .gitlab-ci.yml
└── README.md
```

```
inCampus-mobile/
├── src/
│   ├── screens/                   # One folder per use‑case boundary
│   ├── services/                  # API client
│   ├── navigation/
│   └── components/
├── .gitlab-ci.yml
└── README.md
```

### Branching Strategy
- **`main`** – production‑ready, protected
- **`develop`** – integration branch, protected
- **Feature branches** – `feature/<module>/<short-description>`, e.g. `feature/ap/signup-endpoint`

**Workflow rules:**
- No direct pushes to `main` or `develop`.
- All work happens on a feature branch.
- When a task is completed, open a **Merge Request** to `develop`.
- At least one other team member must review and approve before merging.
- If a merge conflict occurs, the branch owner resolves it with guidance from the reviewer.

### Module Ownership (Sprint Assignment)
| Developer   | Primary Modules                   | Extras (to balance load)       |
|-------------|-----------------------------------|--------------------------------|
| Jacopo      | AP, NSF                           | Mobile client stub for AP flows |
| Matteo      | H&L, D&P                          | Mobile client stub for activity flows |
| Francesco   | CA, SM                            | Shared infrastructure, CI, DB  |

---

## Section 2 – Full Task Inventory

Every task is derived from an existing document (UCR, Sequence Diagram, CRUD Matrix, or Entity Catalog). Complexity: **S** (≤2 hours), **M** (2‑4 hours), **L** (4‑6 hours).

| Task ID | Module | Task Description | Derived From | Complexity | Assigned To |
|---------|--------|------------------|--------------|------------|-------------|
| **SHARED** | | | | |
| S01 | Shared | Initialize monorepo structure, package.json, tsconfig, linter | System Architecture Diagram | S | Francesco |
| S02 | Shared | Set up PostgreSQL connection, TypeORM configuration | Databases v1.1.md | M | Francesco |
| S03 | Shared | Create database migrations for all 10 canonical stores | Entities & Attributes v1.2.md, Databases v1.1.md | L | Francesco |
| S04 | Shared | Implement JWT authentication middleware | UCR - A&P v1.2.md (Sign In) | M | Jacopo |
| S05 | Shared | Implement simple in‑memory EventBus (subscribe/publish) | 01 Design Scope and Architectural Choice v1.1.md | M | Jacopo |
| S06 | Shared | Set up GitLab CI pipeline (lint, test, build) | Assignment requirements | S | Francesco |
| **AP** | | | | |
| AP01 | AP | Module scaffold: controllers, services, routes | UCR - A&P v1.2.md | S | Jacopo |
| AP02 | AP | Implement `StudentAccount` repository (DS‑AP‑001) | Entities & Attributes v1.2.md, CRUD matrix v1.6.md | M | Jacopo |
| AP03 | AP | Implement `UniversityIdentityRule` repo (DS‑AP‑003) | Entities & Attributes v1.2.md | S | Jacopo |
| AP04 | AP | Sign‑Up endpoint: `POST /auth/signup` with domain validation | Sign Up and Select Campus Sequence Diagram v1.1.md, DUC‑AP‑01 | L | Jacopo |
| AP05 | AP | Verify‑Email endpoint and mock email gateway | DUC‑AP‑01 | M | Jacopo |
| AP06 | AP | Sign‑In endpoint: `POST /auth/signin`, return JWT | DUC‑AP‑02 | M | Jacopo |
| AP07 | AP | Select‑Campus endpoint: `GET /campuses`, `PATCH /accounts/me/campus` | DUC‑AP‑03, Collaboration Diagram | M | Jacopo |
| AP08 | AP | Set‑Up Profile endpoint: `POST /profiles` | DUC‑AP‑04 | M | Jacopo |
| AP09 | AP | Edit Profile & View Profile endpoints | DUC‑AP‑05, DUC‑AP‑06 | M | Jacopo |
| AP10 | AP | Update Campus Insight Consent: `PATCH /accounts/me/consent` | DUC‑AP‑07 | S | Jacopo |
| AP11 | AP | Unit tests for AP services | All AP UCRs | M | Jacopo |
| **CA** | | | | |
| CA01 | CA | Module scaffold and entity repos for `Campus`, `CampusLocation`, `ActivityCategory` | UCR - C&A v1.1.md, Entities & Attributes v1.2.md | M | Francesco |
| CA02 | CA | Configure New Campus: `POST /admin/campuses` with initial options | Configure New Campus Sequence Diagram v1.1.md, DUC‑CA‑01 | L | Francesco |
| CA03 | CA | Manage Campus Options: CRUD endpoints for locations/categories | DUC‑CA‑02 | L | Francesco |
| CA04 | CA | View Consent‑Based Insights: `GET /admin/campuses/{campusId}/student-insights` | View Consent‑Based Student Insights Sequence Diagram v1.1.md, DUC‑CA‑03 | M | Francesco |
| CA05 | CA | Unit tests for CA services | All CA UCRs | M | Francesco |
| **H&L** | | | | |
| HL01 | H&L | Module scaffold, `Activity` and `Participation` repositories | UCR - H&L v1.4.md, Entities & Attributes v1.2.md | M | Matteo |
| HL02 | H&L | Create Activity: `POST /activities` (validates campus options, host eligibility) | Create Activity use case, DUC‑HL‑01 | L | Matteo |
| HL03 | H&L | Manage Join Requests: `GET /activities/{id}/requests`, `PATCH …` with atomic approve/decline | Manage Join Requests Sequence Diagram v1.1.md, DUC‑HL‑02 | L | Matteo |
| HL04 | H&L | Update Activity Status: `PATCH /activities/{id}/status` (cancel, complete) | DUC‑HL‑03 | M | Matteo |
| HL05 | H&L | Delete Activity: `DELETE /activities/{id}` (hard delete cascade) | DUC‑HL‑04 | M | Matteo |
| HL06 | H&L | Unit tests for H&L services | All H&L UCRs | M | Matteo |
| **D&P** | | | | |
| DP01 | D&P | Module scaffold, service layer that calls H&L/AP/SM repos via interfaces | UCR - D&P v1.2.md | S | Matteo |
| DP02 | D&P | Browse Activities: `GET /activities` with filter and block enforcement | DUC‑DP‑01, DUC‑DP‑02 | L | Matteo |
| DP03 | D&P | View Activity Details: `GET /activities/{id}` (host profile, block check) | DUC‑DP‑02 | M | Matteo |
| DP04 | D&P | Join Activity: `POST /activities/{id}/join` with atomic capacity check, event emission | Join Activity Sequence Diagram v1.1.md, DUC‑DP‑03 | L | Matteo |
| DP05 | D&P | Withdraw Join Request & Leave Joined Activity: corresponding delete endpoints | DUC‑DP‑04, DUC‑DP‑05 | M | Matteo |
| DP06 | D&P | View Personal Activity List: `GET /profiles/me/activities` | DUC‑DP‑06 | M | Matteo |
| DP07 | D&P | Unit tests for D&P services | All D&P UCRs | M | Matteo |
| **NSF** | | | | |
| NSF01 | NSF | Module scaffold, `NotificationRecord` repository (DS‑NS‑001) | UCR - N&S v1.2.md, Entities & Attributes v1.2.md | M | Jacopo |
| NSF02 | NSF | Event handler: `JoinEventNotificationHandler` (consumes DirectJoinCompleted, JoinRequestSubmitted) | Notification Event Handling (JoinRequestSubmitted) Sequence Diagram v1.1.md, DUC‑NSF‑01 | M | Jacopo |
| NSF03 | NSF | Event handler: `ApplicationOutcomeNotificationHandler` (JoinRequestApproved/Declined) | DUC‑NSF‑02 | M | Jacopo |
| NSF04 | NSF | Event handler: `CancellationNotificationHandler` (ActivityCancelled, fan‑out) | DUC‑NSF‑03 | M | Jacopo |
| NSF05 | NSF | Event handler: `LeaveEventNotificationHandler` (JoinedParticipantLeft) | DUC‑NSF‑04 | M | Jacopo |
| NSF06 | NSF | Event handler: `ActivityReminderHandler` (time‑triggered, fan‑out) | DUC‑NSF‑05, CRUD matrix v1.6.md | M | Jacopo |
| NSF07 | NSF | Open Notification Context: `GET /notifications/{id}/context` (read‑only) | DUC‑NSF‑06 | M | Jacopo |
| NSF08 | NSF | Unit tests for NSF handlers | All NSF UCRs | M | Jacopo |
| **SM** | | | | |
| SM01 | SM | Module scaffold, `BlockRelationship` and `ReportRecord` repositories | UCR - S&M v1.3.md | M | Francesco |
| SM02 | SM | Block User: `POST /blocks` (with symmetric enforcement) | DUC‑SM‑04 | M | Francesco |
| SM03 | SM | Report User or Activity: `POST /reports` (target validated, no full DS‑HL‑001 read) | DUC‑SM‑02 | M | Francesco |
| SM04 | SM | Review Report: `GET/PATCH /admin/campuses/{campusId}/reports/…` with moderation action dispatch | DUC‑SM‑03, Report and Review Report Sequence Diagram v1.1.md | L | Francesco |
| SM05 | SM | View Community Rules: `GET /community-rules` (static) | DUC‑SM‑01 | S | Francesco |
| SM06 | SM | Unit tests for SM services | All SM UCRs | M | Francesco |
| **MOBILE** | | | | |
| M01 | Mobile | Initialize React Native project, navigation stack, theme | Use Case Diagram v1.7.md | S | Francesco |
| M02 | Mobile | Sign‑Up & Sign‑In screens integrated with backend | Sign Up and Select Campus Sequence Diagram | M | Jacopo |
| M03 | Mobile | Campus Selection & Profile Setup screens | DUC‑AP‑03, DUC‑AP‑04 | M | Jacopo |
| M04 | Mobile | Activity Feed & Activity Details screens | DUC‑DP‑01, DUC‑DP‑02 | M | Matteo |
| M05 | Mobile | Create Activity & Manage Join Requests screens | DUC‑HL‑01, DUC‑HL‑02 | M | Matteo |
| M06 | Mobile | Basic notification display (in‑app list) | DUC‑NSF‑06 | S | Jacopo |

---

## Section 3 – 5‑Day Sprint Schedule

### Day 1 – Foundation & CA/AP Kick‑off
| Developer | Tasks | Dependencies |
|-----------|-------|--------------|
| **Francesco** | S01, S02, S03 (start migrations), S06, CA01 (scaffold) | None |
| **Jacopo**   | S04, S05, AP01, AP02, AP03, NSF01 (scaffold) | None |
| **Matteo**   | HL01 (scaffold), DP01 (scaffold), study existing CA/AP interfaces for integration tomorrow | None |

### Day 2 – Core Modules Take Shape
| Developer | Tasks | Dependencies |
|-----------|-------|--------------|
| **Francesco** | S03 (complete migrations), CA02 (Configure New Campus – includes seeding initial options), CA03 (start Manage Options) | S02, S03 |
| **Jacopo**   | AP04 (Sign‑Up), AP05 (Verify Email), AP06 (Sign‑In with JWT) – requires S04 JWT middleware. Start AP07 (campus selection) after Francesco delivers CA02. | S04, S05; AP07 depends on CA02 |
| **Matteo**   | HL02 (Create Activity) – needs CA options to exist, so start after CA02 is pushed (CA options can be read via API). DP02 (Browse Activities) can be stubbed initially. | CA02 for HL02; DP02 depends on HL02 having at least one activity, but can be developed with mock data. |

### Day 3 – Full Business Logic & Events Start
| Developer | Tasks | Dependencies |
|-----------|-------|--------------|
| **Francesco** | CA03 (complete Manage Options), CA04 (Insights), SM01, SM02 (Block User), SM05 (Community Rules) | CA02 |
| **Jacopo**   | AP07 (campus selection), AP08, AP09, AP10. NSF02, NSF03 (event handlers) – EventBus (S05) must be ready; events will be emitted by D&P on Day 4, so handlers can be tested with synthetic events. | AP07 depends on CA02; NSF depends on S05 |
| **Matteo**   | HL03 (Manage Join Requests), DP04 (Join Activity) – needs H&L and SM block store. DP03 (View Details). DP04 will emit DirectJoinCompleted/JoinRequestSubmitted events. | HL03 depends on HL02; DP04 depends on HL03 for participation records and SM01 for block check. |

### Day 4 – Integration, Notifications & Moderation
| Developer | Tasks | Dependencies |
|-----------|-------|--------------|
| **Francesco** | SM03 (Report Submission), SM04 (Review Report + moderation dispatch to AP/H&L). Write integration tests. | SM03 depends on AP and H&L entities for target validation; SM04 uses AP/H&L internal commands. |
| **Jacopo**   | NSF04 (Cancellation fan‑out), NSF05 (LeaveEvent), NSF06 (Reminder), NSF07 (Open Notification). AP11 (unit tests). Mobile M02 (sign‑up flow). | NSF04 needs ActivityCancelled emitted from HL04 (done today by Matteo). NSF05 needs JoinedParticipantLeft from DP05. Plan to coordinate. |
| **Matteo**   | HL04 (Update Status – cancel), HL05 (Delete), DP05 (Withdraw/Leave), DP06 (Personal List). DP07 (tests). Mobile M04 (activity feed). | HL04 emits ActivityCancelled (needed by NSF04). DP05 emits JoinedParticipantLeft (needed by NSF05). |

### Day 5 – Polish, Mobile Client & Final Integration
| Developer | Tasks | Dependencies |
|-----------|-------|--------------|
| **Francesco** | SM06 (tests), M01 (mobile init), M05 (create activity screen), assist with integration fixes. | All SM tasks done. |
| **Jacopo**   | NSF08 (tests), M03 (campus/profile screens), M06 (notification list). Final integration tests for AP/NSF flows. | Mobile screens need working backend endpoints. |
| **Matteo**   | HL06, DP07 (final tests), M04/M05 (activity screens polish). Run full suite of end‑to‑end tests. | Backend must be stable. |

*Parallel work is maximised; all dependencies are flagged. Francesco’s workload on Day 1‑2 is slightly higher (DB setup), balanced by lighter load on Day 5 (mobile init). If overloaded, the CI pipeline (S06) can be moved to Day 2.*

---

## Section 4 – File Creation List

### Backend – Shared (`packages/shared/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `shared/src/config/database.ts` | TypeORM connection setup | Francesco |
| `shared/src/middleware/auth.ts` | JWT verification middleware | Jacopo |
| `shared/src/events/EventBus.ts` | In‑memory pub/sub implementation | Jacopo |
| `shared/src/errors/AppError.ts` | Centralised error classes | Francesco |
| `shared/src/migrations/*.ts` | All canonical store table migrations (10 files) | Francesco |

### Access & Profile (`packages/access-profile/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/entities/StudentAccount.ts` | DS‑AP‑001 entity | Jacopo |
| `src/entities/StudentProfile.ts` | DS‑AP‑002 entity | Jacopo |
| `src/entities/UniversityIdentityRule.ts` | DS‑AP‑003 entity | Jacopo |
| `src/repositories/StudentAccountRepo.ts` | CRUD for accounts | Jacopo |
| `src/repositories/StudentProfileRepo.ts` | CRUD for profiles | Jacopo |
| `src/repositories/IdentityRuleRepo.ts` | Read domain rules | Jacopo |
| `src/services/DomainValidationService.ts` | Email domain check | Jacopo |
| `src/services/AccountActivationService.ts` | Account creation, verification | Jacopo |
| `src/services/CampusAssociationService.ts` | Campus selection logic | Jacopo |
| `src/services/ProfileService.ts` | Profile CRUD | Jacopo |
| `src/services/ConsentService.ts` | Insight consent update | Jacopo |
| `src/controllers/AuthController.ts` | Sign‑Up, Sign‑In HTTP handlers | Jacopo |
| `src/controllers/CampusController.ts` | Campus selection routes | Jacopo |
| `src/controllers/ProfileController.ts` | Profile endpoints | Jacopo |
| `src/controllers/ConsentController.ts` | Consent endpoint | Jacopo |
| `src/routes/index.ts` | AP route definitions | Jacopo |
| `src/__tests__/` | All unit tests | Jacopo |

### Campus Administration (`packages/campus-administration/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/entities/Campus.ts` | DS‑CA‑001 entity | Francesco |
| `src/entities/CampusLocation.ts` | DS‑CA‑002 entity (location) | Francesco |
| `src/entities/ActivityCategory.ts` | DS‑CA‑002 entity (category) | Francesco |
| `src/repositories/CampusRepo.ts` | Campus CRUD | Francesco |
| `src/repositories/CampusOptionsRepo.ts` | Options CRUD | Francesco |
| `src/services/CampusConfigurationService.ts` | Configure campus logic | Francesco |
| `src/services/CampusOptionsService.ts` | Manage options logic | Francesco |
| `src/services/AdminInsightService.ts` | Consent‑gated insight read | Francesco |
| `src/controllers/CampusConfigController.ts` | `POST /admin/campuses` | Francesco |
| `src/controllers/CampusOptionsController.ts` | Structured options endpoints | Francesco |
| `src/controllers/AdminInsightController.ts` | Student insights endpoint | Francesco |
| `src/routes/index.ts` | CA route definitions | Francesco |
| `src/__tests__/` | All unit tests | Francesco |

### Hosting & Lifecycle (`packages/hosting-lifecycle/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/entities/Activity.ts` | DS‑HL‑001 entity | Matteo |
| `src/entities/Participation.ts` | DS‑HL‑002 entity | Matteo |
| `src/repositories/ActivityRepo.ts` | Activity CRUD | Matteo |
| `src/repositories/ParticipationRepo.ts` | Participation CRUD | Matteo |
| `src/services/ActivityLifecycleService.ts` | Create, update status, delete | Matteo |
| `src/services/JoinRequestManagementService.ts` | Host approve/decline with atomic checks | Matteo |
| `src/controllers/ActivityController.ts` | Activity endpoints | Matteo |
| `src/controllers/JoinRequestController.ts` | Host request management endpoints | Matteo |
| `src/routes/index.ts` | H&L route definitions | Matteo |
| `src/__tests__/` | All unit tests | Matteo |

### Discovery & Participation (`packages/discovery-participation/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/services/FeedService.ts` | Browse with filter/block | Matteo |
| `src/services/ActivityDetailService.ts` | Activity detail + host profile | Matteo |
| `src/services/JoinService.ts` | Atomic join/request, event emission | Matteo |
| `src/services/WithdrawLeaveService.ts` | Withdraw/leave logic | Matteo |
| `src/controllers/DiscoveryController.ts` | Feed and detail endpoints | Matteo |
| `src/controllers/ParticipationController.ts` | Join, withdraw, leave, personal list | Matteo |
| `src/routes/index.ts` | D&P route definitions | Matteo |
| `src/__tests__/` | All unit tests | Matteo |

### Notifications & System Flow (`packages/notifications-system-flow/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/entities/NotificationRecord.ts` | DS‑NS‑001 entity | Jacopo |
| `src/repositories/NotificationRepo.ts` | Notification CRUD | Jacopo |
| `src/handlers/JoinEventHandler.ts` | Consumes DirectJoinCompleted, JoinRequestSubmitted | Jacopo |
| `src/handlers/ApplicationOutcomeHandler.ts` | Consumes JoinRequestApproved/Declined | Jacopo |
| `src/handlers/CancellationHandler.ts` | Consumes ActivityCancelled (fan‑out) | Jacopo |
| `src/handlers/LeaveEventHandler.ts` | Consumes JoinedParticipantLeft | Jacopo |
| `src/handlers/ReminderHandler.ts` | Consumes ActivityReminderDue | Jacopo |
| `src/services/RecipientResolutionService.ts` | Resolve recipient from event | Jacopo |
| `src/services/BlockSuppressionService.ts` | Check block existence | Jacopo |
| `src/services/NotificationComposer.ts` | Build notification record | Jacopo |
| `src/services/NotificationDispatcher.ts` | Push/in‑app dispatch stub | Jacopo |
| `src/controllers/NotificationContextController.ts` | Open notification endpoint | Jacopo |
| `src/routes/index.ts` | NSF route definitions | Jacopo |
| `src/__tests__/` | All unit tests | Jacopo |

### Safety & Moderation (`packages/safety-moderation/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/entities/BlockRelationship.ts` | DS‑SM‑001 entity | Francesco |
| `src/entities/ReportRecord.ts` | DS‑SM‑002 entity | Francesco |
| `src/repositories/BlockRepo.ts` | Block CRUD | Francesco |
| `src/repositories/ReportRepo.ts` | Report CRUD | Francesco |
| `src/services/BlockService.ts` | Block user logic | Francesco |
| `src/services/ReportSubmissionService.ts` | Report validation and creation | Francesco |
| `src/services/ReportReviewService.ts` | Review, outcome, dispatch actions | Francesco |
| `src/services/CommunityRulesService.ts` | Static rules retrieval | Francesco |
| `src/controllers/BlockController.ts` | Block endpoint | Francesco |
| `src/controllers/ReportController.ts` | Submit report endpoint | Francesco |
| `src/controllers/AdminReportController.ts` | Admin review endpoints | Francesco |
| `src/controllers/RulesController.ts` | Community rules endpoint | Francesco |
| `src/routes/index.ts` | SM route definitions | Francesco |
| `src/__tests__/` | All unit tests | Francesco |

### Mobile (`inCampus-mobile/`)
| File Path | Purpose | Developer |
|-----------|---------|-----------|
| `src/screens/SignUpScreen.tsx` | Sign‑up form | Jacopo |
| `src/screens/SignInScreen.tsx` | Sign‑in form | Jacopo |
| `src/screens/CampusSelectionScreen.tsx` | Campus picker | Jacopo |
| `src/screens/ProfileSetupScreen.tsx` | Profile creation | Jacopo |
| `src/screens/ActivityFeedScreen.tsx` | Browse activities | Matteo |
| `src/screens/ActivityDetailsScreen.tsx` | Activity detail view | Matteo |
| `src/screens/CreateActivityScreen.tsx` | Activity creation form | Matteo |
| `src/screens/ManageRequestsScreen.tsx` | Host join request management | Matteo |
| `src/screens/NotificationListScreen.tsx` | Notification inbox | Jacopo |
| `src/services/api.ts` | Axios instance with JWT interceptor | Francesco |
| `src/navigation/AppNavigator.tsx` | Navigation container | Francesco |
| `__tests__/` | Basic render tests | All |

---

> **Note:** All tasks are fully traceable to the project documentation. No feature or requirement is invented. The plan respects the existing architecture boundaries, the 10‑store model, and the internal event contracts. This sprint is the first code skeleton and aims to produce a functional (though not polished) implementation of all MVP use cases, ready for the daily reports and subsequent iterations.

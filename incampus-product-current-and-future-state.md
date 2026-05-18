# InCampus - Current State and Future State Analysis

> [AI DRAFT]
> AI-generated English translation and completion for human review. This is not canonical project memory.
>
> Canonical project memory remains in `inCampusLLMwiki/wiki/`. This draft should become canonical only after human review, team approval, inclusion in a later AFFiNE export batch, and normal ingest from that export batch into the wiki.

## 1. Title and Metadata

| Field | Value |
| --- | --- |
| Product name | InCampus |
| Repository analyzed | `incampus-app` inside `/Users/francesconativitati/Documents/Projects/FacciamoCose` |
| Analysis date | 2026-05-16 |
| Analysis scope | Product, architectural, technical, and documentation analysis of the `incampus-app` monorepo, compared with the local canonical wiki in `inCampusLLMwiki/wiki` and the project documentation stored in the repository. |
| Output | `doc/review-drafts/2026-05-16-ai-draft-incampus-current-future-state.md` |
| Source draft translated and completed | `work/incampus-product-current-and-future-state.md` |

### Main sources reviewed

Main sources inside `incampus-app`:

- Root and workspace: `incampus-app/README.md`, `incampus-app/package.json`, `incampus-app/package-lock.json`.
- Active contracts: `incampus-app/docs/api-contract.md`, `docs/event-contract.md`, `docs/internal-command-contract.md`, `docs/error-contract.md`, `docs/demo-scenarios.md`, `docs/setup.md`.
- Backend: `incampus-app/backend/src/app.ts`, `backend/src/server.ts`, `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`.
- Backend modules: `backend/packages/access-profile`, `campus-administration`, `hosting-lifecycle`, `discovery-participation`, `safety-moderation`, `notifications-system-flow`, `shared`.
- Persistence: `backend/packages/shared/src/config/database.ts`, `backend/packages/shared/src/migrations/*`, TypeORM entities across domain packages.
- Mobile: `incampus-app/mobile/package.json`, `mobile/App.tsx`, `mobile/src/navigation/AppNavigator.tsx`, `mobile/src/services/api.ts`, `mobile/src/screens/*`.
- Imported project documentation: `incampus-app/Documentation/InCampus_Project_Map.md`, `Documentation/INcampusFILES/**`, `codingOrganization/workdivisionCODINGv1.2_corrected.md`.
- Linked local wiki: `inCampusLLMwiki/wiki/index.md`, `wiki/project/overview.md`, `wiki/architecture/overview.md`, `wiki/architecture/data-model.md`, `wiki/requirements/traceability.md`.

## 2. Completeness Review

### Verdict

The original Italian document was already broad and well grounded. It covered product intent, current implementation, architecture, backend and mobile status, data model, routes, test status, documentation drift, future state, roadmap, risks, and technical evidence.

It was not fully operational yet because one recommendation was still only stated as future work: an implementation status matrix mapping real use-case readiness across backend, mobile, tests, and demo readiness. This English version adds that matrix in Section 7 and updates the verification results with checks run again on 2026-05-16.

### What was added or improved in this English version

- Added an explicit completeness verdict.
- Added a practical implementation status matrix by functional area and use case.
- Updated quality verification with fresh command results from 2026-05-16:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - `npm run typecheck --workspace mobile`: passed.
  - `npm test`: passed with 27 files and 182 tests.
- Refined the current project phase to match the canonical wiki: the project is now in the implementation phase, not only architecture analysis.
- Kept unresolved points explicit instead of filling them with assumptions.

### Completeness boundary

The document is complete for a grounded current-state and future-state review of the repository as it exists today. It is not a final product specification, final architecture contract, or production readiness certification. The remaining unknowns are real project decisions or implementation gaps, and they are intentionally listed as such later in the document.

## 3. Executive Summary

InCampus is a campus-scoped mobile app designed to reduce isolation and social friction in university life by helping students find low-pressure opportunities to share ordinary moments such as lunch, coffee breaks, study sessions, sports, language exchange, and small campus activities. This product vision is stated both in `incampus-app/README.md` and in the canonical wiki page `inCampusLLMwiki/wiki/project/overview.md`. The first rollout target is Tongji University, Jiading Campus.

The current repository is no longer only a "Phase 0 foundation", even though several README and contract documents still say so. The backend already contains a modular monolith built with Express and TypeScript, with mounted business routes for onboarding, campus setup, profiles, activities, participation, reports, moderation, blocking, notifications, and admin insights. The clearest evidence is `backend/src/app.ts`, which composes all six domain packages, registers NSF handlers on the shared EventBus, and mounts the routers. By contrast, `docs/api-contract.md` still describes many business routes as future contracts, so it should be treated as partially outdated.

Estimated maturity:

- Backend: advanced alpha / MVP skeleton.
- Mobile: partial alpha.
- Documentation: rich and traceable, but partly misaligned with current code.
- Local engineering readiness: good for linting, build, type checking, and backend tests.
- Production readiness: not yet achieved.

The repository is not production-ready because admin authentication is provisional, email and push delivery are still mocked or stubbed, the mobile activity creation path is not wired to the backend, personal activity history is still a placeholder, the demo seed is incomplete for a reproducible end-to-end scenario, and there is no real reminder scheduler yet.

Capabilities already present:

- Modular backend with six domains: AP, CA, H&L, D&P, SM, and NSF (`backend/packages/*`, `backend/src/app.ts`).
- Canonical TypeORM stores and PostgreSQL migrations for campuses, structured options, accounts, profiles, identity rules, activities, participations, blocks, reports, and notifications (`backend/packages/shared/src/migrations/*`).
- In-memory EventBus and notification flows for joins, request outcomes, cancellations, leaves, and reminders (`shared/src/events/*`, `notifications-system-flow/src/handlers/*`).
- Expo/React Native mobile app with navigation and screens for onboarding, feed, activity detail, notifications, and request management (`mobile/src/navigation/AppNavigator.tsx`, `mobile/src/screens/*`).
- Meaningful backend QA: `npm test` passes with 27 files and 182 tests; `npm run lint`, `npm run build`, and `npm run typecheck --workspace mobile` also pass.

Main gaps:

- Runtime documentation is stale: README and some docs still say the business routes are contract-only, while the code already implements them (`incampus-app/README.md`, `backend/README.md`, `docs/api-contract.md` versus `backend/packages/*/src/routes/index.ts`).
- Mobile is not fully aligned with backend capability: `CreateActivityScreen.tsx` uses mock options and does not call `POST /activities`; `PersonalActivityListPlaceholderScreen.tsx` explicitly says the list is not wired.
- Security remains alpha-grade: admin auth is injected from headers, a development JWT secret fallback exists, email verification is logged to the console, and the push dispatcher is still a stub (`backend/src/app.ts`, `authSession.ts`, `EmailVerificationService.ts`, `NotificationDispatcher.ts`).
- DevOps coverage is incomplete: CI performs backend lint/build/test and mobile type checking, but it does not run migrations against a real database, mobile tests, or end-to-end tests (`.github/workflows/ci.yml`).

Recommended direction:

1. Align documentation and contracts with the code that already exists.
2. Complete the mobile core activity loop.
3. Replace critical stubs for email, notifications, and reminders.
4. Harden admin and authentication paths.
5. Add reproducible seeded demos and real end-to-end verification.

## 4. Analysis Method

### Paths explored

- `incampus-app/`
- `incampus-app/docs/`
- `incampus-app/Documentation/`
- `incampus-app/codingOrganization/`
- `incampus-app/backend/src/`
- `incampus-app/backend/packages/`
- `incampus-app/backend/packages/shared/src/migrations/`
- `incampus-app/mobile/`
- `incampus-app/mobile/src/`
- `inCampusLLMwiki/wiki/`

### File types considered

- Markdown: README files, contracts, requirements, UCRs, diagrams, project map, wiki pages.
- JSON and config: `package.json`, `tsconfig.json`, `app.json`, `.env.example`, GitHub Actions.
- Backend TypeScript: app bootstrap, routes, controllers, services, repositories, entities, middleware, EventBus, migrations, tests.
- Mobile TypeScript/TSX: API client, navigation, screens.
- Tests: Vitest backend tests, lightweight integration wiring tests, service tests, handler tests.

### Limits of the analysis

- No real PostgreSQL instance was started, so migrations were reviewed statically and only indirectly validated through build and tests.
- The mobile app was not launched in Expo or in a simulator; mobile verification is limited to static review and `tsc --noEmit`.
- No full end-to-end flow was executed with backend, database, and mobile app together.
- No external sources were used; the analysis is deliberately grounded in the repository and the local canonical wiki.

### Working assumptions

- The local wiki in `inCampusLLMwiki/wiki` is the canonical project context because the workspace README defines it as durable project memory.
- Newer sources from 2026-05-08 and 2026-05-09 supersede older Phase 0 notes when they conflict.
- Current code takes precedence over stale README text when assessing implemented runtime behavior.

## 5. Current Product State

### Current product vision

InCampus is positioned as a local, campus-scoped, non-dating social participation product. The canonical wiki explicitly frames it as local, simple, believable, safe, and easy to use. The product aims to support small ordinary activities with university onboarding, a minimal trust-oriented profile, participation, notifications, safety, and campus administration.

The first MVP baseline includes onboarding, profile, activity creation, feed discovery, direct join or request-to-join, host-side request management, notifications, community rules, reports, blocking, and campus management, as shown in `Documentation/INcampusFILES/requirements-data-model-crud/Use cases v1.2.md` and `wiki/requirements/traceability.md`.

### Overall architecture

The implemented architecture is a multi-tenant modular monolith built with Node.js, TypeScript, Express, PostgreSQL, and TypeORM. The architectural choice is documented in `Documentation/INcampusFILES/system architecture/01 Design Scope and Architectural Choice v1.1.md` and implemented in `backend/src/app.ts`.

Observed elements:

- npm monorepo with `backend` and `mobile` workspaces (`incampus-app/package.json`).
- Single deployable backend divided into logical domain packages (`backend/packages/*`).
- `CampusID` used as the tenant boundary for student and admin flows (`docs/setup.md`, domain services).
- Event-driven internal notification consequences (`shared/src/events/EventBus.ts`, `InternalEventDispatcher.ts`, `notifications-system-flow/src/handlers/registerNSFHandlers.ts`).
- Shared TypeORM database layer with domain-owned logical stores (`shared/src/config/database.ts`, `shared/src/db/constraints.ts`).

### Backend

The backend lives in `incampus-app/backend`, with an Express app factory in `backend/src/app.ts` and bootstrap logic in `backend/src/server.ts`. `backend/package.json` declares Express, TypeORM, PostgreSQL, JWT, bcrypt, dotenv, Vitest, ESLint, and TypeScript.

`backend/src/app.ts` is the main integration point. It creates repositories and services, registers NSF handlers, mounts AP/CA/H&L/D&P/SM/NSF routes, and installs the centralized error handler. `GET /health` returns `service: incampus-backend` and `architecture: multi-tenant modular monolith`.

### Mobile app

The mobile app is an actual Expo/React Native project, not only a folder shell. `mobile/package.json` includes Expo, React Native, React Navigation, and AsyncStorage. `mobile/App.tsx` mounts `SafeAreaProvider`, `StatusBar`, and `AppNavigator`.

Screens currently present:

- Auth and onboarding: `SignInScreen.tsx`, `SignUpScreen.tsx`, `CampusSelectionScreen.tsx`, `ProfileSetupScreen.tsx`, `ConsentSettingsScreen.tsx`.
- Activities: `ActivityFeedScreen.tsx`, `ActivityDetailsScreen.tsx`, `CreateActivityScreen.tsx`, `ManageRequestsScreen.tsx`.
- Notifications: `NotificationListScreen.tsx`, `NotificationFallbackScreen.tsx`.
- Placeholder: `PersonalActivityListPlaceholderScreen.tsx`.

The centralized mobile API client is `mobile/src/services/api.ts`. It uses `EXPO_PUBLIC_API_BASE_URL` with fallback `http://localhost:3000`, stores JWTs in AsyncStorage, and parses the shared error envelope.

### Shared package

The shared package contains:

- Domain enums and DTOs (`shared/src/domain/enums.ts`, `shared/src/domain/dtos.ts`).
- Auth contexts and middleware (`shared/src/auth/*`, `shared/src/middleware/auth.ts`, `adminAuth.ts`).
- Error contract and `AppError` (`shared/src/errors/*`).
- In-memory EventBus and internal dispatcher (`shared/src/events/*`).
- TypeORM database configuration and migrations (`shared/src/config/database.ts`, `shared/src/migrations/*`).
- Transaction helpers (`shared/src/db/transaction.ts`).
- Ownership notes and demo seed material (`shared/src/db/constraints.ts`, `shared/src/seed/demoSeed.ts`).

### Main functional domains

- Access and Profile: signup, email verification, signin, campus selection, profile, campus insight consent.
- Campus Administration: campus setup, structured option management, consent-based admin insights.
- Hosting and Lifecycle: activity creation, lifecycle state, deletion, host request management.
- Discovery and Participation: feed, detail, join/request, withdrawal, leave, personal list.
- Safety and Moderation: community rules, block, report, report review, moderation dispatch.
- Notifications and System Flow: notification records, event handlers, list, context fallback.

### Relevant data entities

The implemented model covers the ten canonical stores documented in `docs/setup.md`, `shared/src/db/constraints.ts`, and `wiki/architecture/data-model.md`:

- `Campus`
- `CampusStructuredOption`
- `StudentAccount`
- `StudentProfile`
- `UniversityIdentityRule`
- `Activity`
- `Participation`
- `BlockRelationship`
- `ReportRecord`
- `NotificationRecord`

Migrations `1710000000001` through `1710000000007` create the related stores. Some cross-store references are intentionally weak or do not use explicit foreign keys, for example activity host/campus/category references and notification references. This reduces coupling but requires disciplined application-level integrity rules.

### Backend routes observed

- AP:
  - `POST /auth/signup`
  - `POST /auth/verify-email`
  - `POST /auth/signin`
  - `GET /campuses`
  - `PATCH /accounts/me/campus`
  - `PATCH /accounts/me/consent`
  - `POST /profiles`
  - `GET /profiles/me`
  - `PATCH /profiles/me`
- CA:
  - `POST /admin/campuses`
  - `GET /admin/campuses/:campusId/structured-options`
  - `POST /admin/campuses/:campusId/structured-options`
  - `PATCH /admin/campuses/:campusId/structured-options/:optionId`
  - `DELETE /admin/campuses/:campusId/structured-options/:optionId`
  - `GET /admin/campuses/:campusId/student-insights`
- H&L:
  - `POST /activities`
  - `PATCH /activities/:id/status`
  - `DELETE /activities/:id`
  - `GET /activities/:id/requests`
  - `PATCH /activities/:id/requests/:requestId`
- D&P:
  - `GET /activities`
  - `GET /activities/:id`
  - `POST /activities/:id/join`
  - `DELETE /activities/:id/requests/me`
  - `DELETE /activities/:id/participants/me`
  - `GET /profiles/me/activities`
- SM:
  - `POST /blocks`
  - `GET /community-rules`
  - `POST /reports`
  - `GET /admin/campuses/:campusId/reports`
  - `GET /admin/campuses/:campusId/reports/:reportId`
  - `PATCH /admin/campuses/:campusId/reports/:reportId/review`
- NSF:
  - `GET /notifications`
  - `GET /notifications/:notificationId/context`

### Key application services

- AP: `AccountActivationService`, `DomainValidationService`, `CampusAssociationService`, `StudentProfileService`, `CampusInsightConsentService`, `AccountModerationCommandHandler`.
- CA: `CampusConfigurationService`, `CampusOptionsService`, `AdminInsightService`, `CampusAuthorizationService`.
- H&L: `ActivityLifecycleService`, `JoinRequestManagementService`, `ActivityModerationCommandHandler`.
- D&P: `FeedService`, `ActivityDetailService`, `JoinService`, `WithdrawLeaveService`, `PersonalListService`.
- SM: `BlockManagementService`, `ReportSubmissionService`, `ReportReviewService`, `ModerationActionDispatcher`, `CommunityRulesContentProvider`.
- NSF: `RecipientResolutionService`, `BlockSuppressionService`, `NotificationComposer`, `NotificationDispatcher`, event handlers.

### User flows already implemented or inferable

- University email signup, password creation, and mock verification token flow.
- JWT signin.
- Campus selection with refreshed token carrying selected campus.
- Profile creation and updates.
- Campus insight consent management.
- Activity feed and detail with block enforcement.
- Direct join or approval-based request with transactions and EventBus dispatch.
- Host-side request approval and decline.
- Request withdrawal and joined-participant leave behavior.
- Report submission and report review with moderation dispatch to AP/H&L.
- Notification list and context opening with unavailable fallback.

### Test status

Fresh verification run on 2026-05-16:

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run typecheck --workspace mobile` | Passed |
| `npm test` | Passed: 27 files, 182 tests |

The current run completed successfully in the active environment. This confirms that the repository is in a healthy alpha engineering state, while still leaving runtime/database/mobile integration gaps unresolved.

### Documentation status

The documentation set is unusually rich for an alpha project, but it is not perfectly synchronized with current implementation.

Strengths:

- `Documentation/InCampus_Project_Map.md` provides a strong map of source material.
- `Documentation/INcampusFILES/requirements-data-model-crud/*` contains requirements, use cases, entities, CRUD, database material, and diagrams.
- `inCampusLLMwiki/wiki/*` consolidates requirements, traceability, data model, and architecture.
- `docs/*` formalizes API, event, command, error, and demo contracts.

Weaknesses:

- `incampus-app/README.md`, `backend/README.md`, and `docs/api-contract.md` still state that business routes are contract-only or that only `/health` is implemented.
- `docs/setup.md` says the mobile app is shell-only and Expo is not initialized, while `mobile/package.json` and `mobile/src/*` prove otherwise.

### Configuration and scripts

Root `package.json`:

- Workspaces: `backend`, `mobile`.
- Root scripts: `dev:backend`, `lint`, `build`, `test`.
- Node engine: `>=20`.

Backend `package.json`:

- Scripts: `dev`, `start`, `seed:demo:identity-rules`, `lint`, `format:check`, `build`, `test`.
- Main dependencies: Express, TypeORM, PostgreSQL, JWT, bcrypt, dotenv.

Mobile `package.json`:

- Scripts: `start`, `android`, `ios`, `typecheck`.
- Main dependencies: Expo, React Native, React Navigation, AsyncStorage.

CI:

- `.github/workflows/ci.yml` runs install, lint, backend build, backend tests, and mobile type checking.

### Technical quality

Strengths:

- Clear modular boundaries aligned with the architecture documents.
- Good backend test coverage for an alpha skeleton.
- Typed internal event contracts.
- Transaction handling and pessimistic locking around capacity-sensitive participation flows.
- Shared error envelope.
- Existing CI.

Weaknesses:

- Alpha-grade security and delivery: admin header auth, email mock, log-only push, development JWT fallback.
- Partial mobile implementation and mock screens.
- Runtime documentation drift.
- No real database end-to-end verification.
- Some services still normalize generic `Error` values later instead of using `AppError` consistently, for example parts of `JoinRequestManagementService.ts`.

## 6. Functional Product Map

| Functional area | Relevant modules/files | Current functionality | Repository evidence | Estimated completeness | Notes |
| --- | --- | --- | --- | --- | --- |
| Vision and requirements | `inCampusLLMwiki/wiki/project/overview.md`, `wiki/requirements/traceability.md`, `Documentation/INcampusFILES/requirements-data-model-crud/*` | Vision, MVP scope, 30 user stories, 69 FRs, 47 NFRs, 33 use-case table entries | Wiki and `Use cases v1.2.md` | High as documentation | Formal UC IDs remain unresolved. |
| Monorepo/workspace | `incampus-app/package.json` | Backend/mobile workspaces with root scripts | `workspaces: ["backend", "mobile"]` | Medium-high | Domain packages live below `backend`, not as root workspaces. |
| Backend foundation | `backend/src/app.ts`, `backend/src/server.ts` | Express app, health, router composition, EventBus, error handler | `createApp()` mounts all modules | High alpha | Server requires a database at startup. |
| Access/Profile | `backend/packages/access-profile` | Signup, verify, signin, campus list/select, profile, consent, moderation command | Routes, services, entities, tests | Medium-high | Email verification is still mocked; JWT fallback remains. |
| Campus Administration | `backend/packages/campus-administration` | Campus creation, structured option CRUD/deactivation, consent-based student insights | Routes, services, tests | Medium-high | Admin auth is provisional; no admin UI observed. |
| Hosting/Lifecycle | `backend/packages/hosting-lifecycle` | Create activity, status update, cancel event, hard delete, pending request review | Routes, services, tests | Medium | Mobile create is not wired; activity validation is incomplete. |
| Discovery/Participation | `backend/packages/discovery-participation` | Feed, detail, join/request, withdraw, leave, personal list | Routes, services, tests | Medium-high backend | Personal list mobile screen is only a placeholder; feed filtering is limited. |
| Safety/Moderation | `backend/packages/safety-moderation` | Static rules, block, report, admin review, AP/H&L dispatch | Routes, services, tests | Medium-high backend | No mobile safety UI or admin UI observed. |
| Notifications | `backend/packages/notifications-system-flow` | Notification records, event handlers, list, context fallback, reminder handler | Handlers, controllers, tests | Medium | Push dispatcher is a stub; no real reminder scheduler. |
| Mobile onboarding | Signin, signup, campus, profile setup, consent screens | Main onboarding paths wired to backend | API calls and AsyncStorage usage | Medium | No global session management or refresh strategy observed. |
| Mobile activity loop | Feed, detail, create, manage requests screens | Feed/detail/join/request screens; create remains mock-backed | Mobile source files | Low-medium | `CreateActivityScreen.tsx` does not call backend; DTO mismatches remain. |
| Mobile notifications | Notification list and fallback screens | List, pagination, tap context, fallback | Mobile source files | Medium | No real push delivery. |
| QA | Backend tests, `backend/src/app.test.ts`, CI | 182 backend tests passing; lint/build/typecheck passing | Fresh command runs | Medium-high backend | No mobile tests and no DB-backed end-to-end flow. |

## 7. Implementation Status Matrix

Legend:

- `Done`: feature exists in current code path.
- `Partial`: feature exists but is incomplete, mocked, or not yet exposed in the needed client flow.
- `Missing`: no implementation observed in the current repository.
- `N/A`: not applicable to the current layer.

| Area / use case | Backend | Mobile | Automated tests | Demo-ready | Main evidence or gap |
| --- | --- | --- | --- | --- | --- |
| Sign Up with University Email | Done | Done | Done backend | Partial | Backend and screen exist; email delivery is mocked. |
| Sign In | Done | Done | Done backend | Partial | JWT flow exists; production hardening remains. |
| Select Campus | Done | Done | Done backend | Partial | Flow exists; admin/config dependencies still need stable demo seed. |
| Update Campus Insight Consent | Done | Done | Done backend | Partial | Screen and route exist; product governance remains sensitive. |
| Set Up Profile | Done | Done | Done backend | Partial | Basic flow exists. |
| Edit Profile | Done | Missing | Done backend | Partial | `/profiles/me` update route exists; no edit-profile screen observed. |
| View Student Minimal Profile | Partial | Missing | Partial backend | No | Internal profile adapters exist, but no public mobile flow observed. |
| Configure New Campus | Done | Missing | Done backend | Partial | Admin endpoint exists; no admin UI observed. |
| Manage Campus Structured Options | Done | Missing | Done backend | Partial | Admin CRUD exists; student-readable option path for mobile create is still unresolved. |
| View Consent-Based Student Insights | Done | Missing | Done backend | Partial | Endpoint exists behind provisional admin auth; no UI observed. |
| Create Activity | Done | Partial | Done backend | No | Backend route exists; mobile create screen still uses mocks. |
| Update Activity Status | Done | Missing | Done backend | Partial | Backend exists; no mobile host flow observed. |
| Delete Activity | Done | Missing | Done backend | Partial | Backend exists; no mobile host flow observed. |
| Browse and Filter Activities | Partial | Partial | Done backend | Partial | Feed exists; filtering is currently limited mainly to category. |
| View Activity Details | Done | Partial | Done backend | Partial | Screen exists, but DTO normalization still needs attention. |
| Join Activity | Done | Done | Done backend | Partial | Core flow exists; real end-to-end mobile+DB verification missing. |
| Manage Join Requests | Done | Partial | Done backend | Partial | Screen exists; request DTO mismatch risk remains. |
| Withdraw Join Request | Done | Missing | Done backend | Partial | Backend exists; mobile flow not observed. |
| Leave Joined Activity | Done | Missing | Done backend | Partial | Backend exists; mobile flow not observed. |
| View Personal Activity List | Done | Partial | Done backend | No | Endpoint exists; mobile still uses a placeholder screen. |
| Notify Host of Join Event | Done | N/A | Done backend | Partial | Notification record flow exists; delivery is not real push. |
| Notify Participant of Application Outcome | Done | N/A | Done backend | Partial | Event flow exists; delivery is not production-grade. |
| Notify Participant of Activity Cancellation | Done | N/A | Done backend | Partial | Handler exists; delivery remains stubbed. |
| Receive Activity Reminder | Partial | N/A | Done handler tests | No | Handler exists, but no real scheduler producer observed. |
| View Community Rules | Done | Missing | Done backend | Partial | Backend static content exists; no mobile UI observed. |
| Report User or Activity | Done | Missing | Done backend | Partial | Backend exists; no mobile reporting UI observed. |
| Review Report | Done | Missing | Done backend | Partial | Backend exists; no admin UI and admin auth is provisional. |
| Block User | Done | Missing | Done backend | Partial | Backend exists; no mobile blocking UI observed. |
| Send Message | Missing / intentionally deferred | Missing | N/A | No | PostMVP according to current sources. |
| View Friends and Social Indicators | Missing / intentionally deferred | Missing | N/A | No | PostMVP. |
| Track Participation Points | Missing / intentionally deferred | Missing | N/A | No | PostMVP. |
| Upload Activity Photo | Missing / intentionally deferred | Missing | N/A | No | PostMVP. |

### Matrix reading

The backend already supports a surprisingly large share of the MVP. The main readiness gap is no longer only "which backend routes exist"; it is "which user-visible flows are actually connected end to end". The largest blockers to a believable pilot are mobile creation, personal activity history, real delivery channels, admin security, seeded demo reproducibility, and DB-backed integration verification.

## 8. Current Technical Architecture

### Monorepo structure

```text
incampus-app/
|-- backend/
|   |-- src/
|   `-- packages/
|       |-- shared/
|       |-- access-profile/
|       |-- campus-administration/
|       |-- hosting-lifecycle/
|       |-- discovery-participation/
|       |-- safety-moderation/
|       `-- notifications-system-flow/
|-- mobile/
|   `-- src/
|-- docs/
|-- Documentation/
`-- codingOrganization/
```

### Technologies used

- Backend: Node.js, TypeScript, Express, TypeORM, PostgreSQL, JWT, bcryptjs, dotenv.
- Testing and quality: Vitest, Supertest, ESLint, TypeScript compiler.
- Mobile: Expo, React Native, React Navigation, AsyncStorage, TypeScript.
- CI: GitHub Actions.

### Relationships between backend, mobile, and packages

The mobile app consumes backend APIs through `mobile/src/services/api.ts`. The backend mounts domain routers and uses `shared` for contracts, errors, auth, EventBus, DTOs, and database setup. Domain packages own their logical stores and access other areas through repository or adapter boundaries where modeled, for example D&P using AP host-profile lookup and SM block lookup adapters.

### Main architectural patterns

- Modular monolith with bounded-context-style packages.
- Repository/service/controller layering in the backend.
- Event-driven internal flows for notification consequences.
- Tenant boundary through `selectedCampusId` and `campusId`.
- Shared error envelope with `AppError`.
- Shared DTOs and enums.
- Pessimistic locking for capacity-sensitive flows.

### Technical strengths

- Architecture is coherent with the first-skeleton documentation.
- Store ownership and domain responsibilities are clear.
- Backend test coverage is broad for the current phase.
- Internal events are typed and straightforward to test.
- Versioned migrations exist.
- Mobile screens are already organized by use case.

### Technical weaknesses

- Admin authentication is not production-grade.
- Real email, push, and reminder delivery are absent.
- Mobile activity creation and personal list remain incomplete.
- README and setup docs do not reflect current runtime reality.
- No database-backed end-to-end tests are present.
- No admin web or mobile UI is observed despite admin endpoints.

### Technical risks

- The default `JWT_SECRET` fallback in `authSession.ts` and `backend/src/app.ts` is acceptable only for local alpha use.
- Header-based admin context in `backend/src/app.ts` is high risk outside controlled development.
- The log-only `NotificationDispatcher.ts` can create a false impression that real push delivery exists.
- `CreateActivityScreen.tsx` uses mock IDs such as `cat-1` and `loc-1`, which are not compatible with real UUID-backed option data.
- Stale "Phase 0 only" documentation may lead the team to duplicate work or ignore already implemented routes.

## 9. Future Product State

### Natural product evolution

The repository and wiki point toward an end-to-end MVP for one pilot campus:

1. A student signs up with university email, verifies the account, selects a campus, creates a profile, and sets consent.
2. A campus admin configures the campus, categories, and meeting points.
3. A host creates a real mobile activity using structured options.
4. A guest browses a filterable feed, opens details, and joins directly or requests approval.
5. The host approves or declines; NSF creates notifications; the student opens the notification context.
6. Participants can withdraw or leave; hosts can cancel or complete activities.
7. Safety features provide rules, blocking, reporting, and admin review.

### Features still to complete

- Mobile activity creation using real structured options plus `POST /activities`.
- Mobile personal activity list on `GET /profiles/me/activities`.
- Mobile edit profile and student minimal profile viewing.
- Mobile UI for reports, blocks, and community rules.
- Admin UI or at least reliable admin tooling for campus config, structured options, reports, and insights.
- Real scheduler for `ActivityReminderDue`.
- Real email verification.
- Real push or in-app delivery.

### Features to consolidate

- Feed filters beyond `categoryId`, including time, gender preference, and multi-preference filters required by `Functional Requirements v1.3.md`.
- Activity validation: future date, end date handling, participant limits, request limits, title/description length, and state transitions.
- Consistent mobile error mapping against the backend envelope.
- API contract updated to match implemented behavior.
- Full reproducible demo seed with campus, options, accounts, profiles, and activities rather than only identity rules.

### Recommended future features after the core MVP

Only after the core activity loop is validated:

- Messaging and activity sharing.
- Friends/social indicators.
- Participation points.
- Activity photo upload and gallery.
- Additional aggregate privacy-preserving admin analytics beyond the current consent-based MVP insight path.

### Architectural evolution

- Keep the modular monolith until the MVP is validated.
- Introduce explicit adapters for cross-module reads that are still performed directly through repositories.
- Formalize the weak-reference strategy for notifications, reports, and activity references.
- Move from in-memory EventBus to an outbox or job queue only when reliable delivery becomes necessary.
- Add documented migration and seed runners.

### Mobile evolution

- Align mobile DTO shapes with backend DTOs.
- Remove mocks from `CreateActivityScreen.tsx`.
- Add a session provider, global loading/error states, and a token refresh strategy if confirmed.
- Add component and API-client tests for critical screens.

### Backend evolution

- Replace admin header auth with real admin auth.
- Require `JWT_SECRET` via environment in non-development environments.
- Add email and push providers.
- Add a reminder scheduler.
- Complete missing endpoints from the contract, or explicitly remove/redefine them if outside MVP.

### Documentation evolution

- Update root README, backend README, setup docs, and API contract to reflect real routes.
- Keep this implementation status matrix current.
- Label clearly which paths are alpha stubs and which are production-ready.

### Testing and QA evolution

- Add PostgreSQL-backed integration tests or containerized DB tests.
- Add migration tests.
- Add mobile unit/component tests.
- Add backend+DB happy-path end-to-end tests.
- Add mobile API compatibility smoke tests.

### DevOps and delivery evolution

- CI with PostgreSQL service and migration execution.
- Environment matrix for dev, demo, and staging.
- Secret validation.
- Demo backend deployment.
- Expo preview or EAS builds if needed.

## 10. Gap Analysis

| Gap | Impacted area | Evidence | Product impact | Technical impact | Priority | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| README/docs do not match code | Documentation, team onboarding | `README.md`, `backend/README.md`, `docs/api-contract.md` versus real routes | Team confusion | Duplicate work and regressions | High | Update README and contracts with implementation status. |
| Mobile create activity is mocked | Mobile, core loop | `CreateActivityScreen.tsx` TODO and mock options | Host cannot publish real activities from the app | Backend capability remains unused | High | Wire real options and `POST /activities`. |
| Personal activity list is a placeholder | Mobile, retention | `PersonalActivityListPlaceholderScreen.tsx` | Students cannot review their own participation history | Existing backend endpoint remains unused | High | Implement UI over `GET /profiles/me/activities`. |
| Admin auth is provisional | Security, admin | `resolveAdminContextFromHeaders`, `adminAuth.ts` | Admin capabilities are unsafe to release | Header spoofing risk | High | Add real admin auth or a protected gateway. |
| Email is mocked | Onboarding | `EmailVerificationService.ts` logs tokens | Account verification is not real | No provider/retry/template flow | High | Integrate email provider and templates. |
| Push dispatcher is a stub | Notifications | `NotificationDispatcher.ts` | Users do not receive real push delivery | No delivery/retry path | High | Integrate push or reliable in-app delivery. |
| Reminder has no scheduler | Notifications | Handler exists, no recurring producer observed | Reminder MVP is not automatic | Event is never generated reliably | High | Add scheduler/job producer for `ActivityReminderDue`. |
| Feed filtering is incomplete | Discovery | `FeedService.ts` filters mainly by `categoryId`; FRs require more | Discovery is less useful | API/query extension needed | Medium | Extend query parameters and mobile filters. |
| Mobile/backend DTO mismatch | Mobile detail/requests | `ActivityDetailsScreen.tsx` and `ManageRequestsScreen.tsx` expect shapes not fully aligned with backend output | Missing or generic UX data | DTO normalization needed | Medium | Normalize backend DTOs or add mobile mappers. |
| No mobile tests | QA | No mobile test suite observed | UI/API regressions go unnoticed | CI incomplete for mobile | Medium | Add tests for API client and critical screens. |
| No real DB end-to-end verification | QA, DevOps | CI lacks PostgreSQL migration run | Migration/query failures can survive CI | Runtime behavior not fully validated | Medium-high | Add PostgreSQL CI service, migrations, and smoke API flow. |
| Demo seed is partial | Demo, delivery | Only `seed:demo:identity-rules`; fuller seed data lacks runner | Manual demos remain fragile | Setup is not reproducible | Medium | Create idempotent full demo seed. |
| Public profile endpoint is unresolved | Product/API | Contract includes `GET /profiles/{studentAccountId}`, routes expose only own profile | Host/request UX may lack a direct public API | Internal adapter does not equal external API | Medium | Decide whether to implement or intentionally keep internal. |

## 11. Proposed Roadmap

### Short term: 0-4 weeks

Goals:

- Make the MVP demo credible end to end.
- Close the riskiest documentation mismatches.
- Connect mobile to backend where mocks and placeholders remain.

Deliverables:

- Updated README and API contract.
- Real mobile create activity flow.
- Real mobile personal activity list.
- Full idempotent demo seed.
- Minimal reminder scheduler.

Technical work:

- Update `CreateActivityScreen.tsx` to load real options and call `POST /activities`.
- Implement the screen for `GET /profiles/me/activities`.
- Add a seed runner for the fuller demo dataset.
- Add a scheduler that emits `ActivityReminderDue`.
- Update root docs and `docs/api-contract.md`.

Product work:

- Define a demo script for Tongji Jiading.
- Decide the minimum UX for feed filters and personal activity history.
- Confirm which admin flows are required in the demo.

Dependencies:

- Local or staging database.
- Confirmation of minimum activity/profile fields.
- Email and notification provider decision at least for demo use.

Risks:

- PostMVP work may distract from the core activity loop.
- Lack of admin UI may reduce demo credibility.

Success criteria:

- A student can sign up, select campus, create a profile, create an activity, browse the feed, join, receive a notification, and see a personal activity list.
- `npm run lint`, `npm run build`, `npm test`, and `npm run typecheck --workspace mobile` pass.
- Documentation no longer contains misleading Phase 0 claims.

### Medium term: 1-3 months

Goals:

- Move from alpha skeleton to a pilotable beta MVP.
- Strengthen security, QA, and delivery.

Deliverables:

- Real admin auth or protected admin gateway.
- Real email verification.
- Real push or in-app notification delivery.
- CI with PostgreSQL and migrations.
- Initial mobile tests.
- Minimal admin portal or reliable admin tooling.

Technical work:

- Remove fallback secrets in non-development environments.
- Integrate an email provider.
- Integrate push or reliable in-app delivery.
- Add DB-backed end-to-end tests.
- Extend feed filters.
- Stabilize mobile/backend DTOs.

Product work:

- Run a pilot with real or simulated users.
- Define activation, activity creation, join conversion, cancellation, and report metrics.
- Define safety and moderation response policy.

Dependencies:

- Staging environment.
- Notification/email providers.
- Admin identity decision.

Risks:

- Safety and privacy complexity grows quickly.
- Unreliable notification delivery can distort pilot results.

Success criteria:

- Beta pilot can run without critical manual intervention.
- Safety flows are active and auditable.
- DB-backed tests run in CI.

### Long term: 3-6+ months

Goals:

- Scale beyond the first campus while preserving safety, privacy, and quality.
- Evaluate PostMVP features only after the core activity loop is validated.

Deliverables:

- Multi-campus operational model.
- Privacy-preserving aggregate analytics.
- Validated PostMVP feature set, such as messaging, social indicators, points, or photo upload.
- Staging and production delivery pipeline.

Technical work:

- Security hardening review.
- Structured logging, moderation audit log, and metrics.
- Outbox or job queue if the in-memory EventBus no longer fits delivery reliability needs.
- Complete admin console.

Product work:

- Roadmap driven by pilot data.
- Campus/admin governance.
- Trust and safety policy.

Dependencies:

- Pilot results.
- Compliance and privacy review.
- Team capacity.

Risks:

- Social feature creep before fit is proven on the core activity loop.
- Personal insight data may be mishandled without strong governance.

Success criteria:

- At least one pilot campus operates with positive signals.
- No critical flow depends on a mock or stub.
- PostMVP feature decisions are made consciously from evidence.

## 12. Priority Recommendations

1. Align documentation with current code.
   - Why: the team may still think in "Phase 0" terms while the backend is already further ahead.
   - Action: update README, setup, API contract, and backend README.
   - Main files: `incampus-app/README.md`, `backend/README.md`, `docs/api-contract.md`, `docs/setup.md`.
   - Benefit: faster onboarding and fewer false assumptions.

2. Close the mobile core activity loop.
   - Why: product value depends on creating, discovering, and joining activities.
   - Action: wire create activity, personal list, base filters, and detail/request DTOs.
   - Main files: `CreateActivityScreen.tsx`, `ActivityDetailsScreen.tsx`, `ManageRequestsScreen.tsx`, `PersonalActivityListPlaceholderScreen.tsx`.
   - Benefit: a usable MVP instead of a backend-heavy demo.

3. Replace critical delivery stubs.
   - Why: email verification, notifications, and reminders are part of the actual user experience.
   - Action: add email provider, push or reliable in-app delivery, and reminder scheduler.
   - Main files: `EmailVerificationService.ts`, `NotificationDispatcher.ts`, `ReminderHandler.ts`, EventBus producer path.
   - Benefit: onboarding and engagement become real rather than nominal.

4. Harden auth and admin scope.
   - Why: moderation and insights are sensitive areas.
   - Action: remove header-only admin auth outside development, require environment secrets, and add audit support.
   - Main files: `backend/src/app.ts`, `shared/src/middleware/adminAuth.ts`, `authSession.ts`.
   - Benefit: safer basis for a pilot.

5. Bring CI onto a real database.
   - Why: TypeORM migrations and real queries are a major operational risk.
   - Action: add PostgreSQL service, migration run, and seeded smoke path.
   - Main files: `.github/workflows/ci.yml`, backend package scripts.
   - Benefit: greater deployment confidence.

6. Maintain the implementation status matrix.
   - Why: the project now has enough breadth that a single operational truth table is useful.
   - Action: keep Section 7 current whenever routes, mobile flows, tests, or demo readiness change.
   - Benefit: clearer prioritization across founder, PM, CTO, and developers.

## 13. Risks and Points to Verify

### Technical risks

- Provisional admin auth through headers.
- Development JWT secret fallback.
- Email, push, and reminders are not real delivery systems yet.
- Mobile DTO mismatches.
- Migrations are not validated in CI against a real database.
- Weak cross-store references require explicit integrity discipline.

### Product risks

- Perceived product value remains low if mobile create and personal list stay incomplete.
- Safety and moderation exist mostly backend-side without complete mobile/admin UX.
- Campus insights are sensitive and need clear consent UX plus governance.
- PostMVP features can distract from the core loop.

### Organizational risks

- Stale documentation can create team disagreement.
- Modular ownership is documented, but integration discipline still matters.
- Lack of admin UI may block demos and operations.

### Ambiguities still present in the repository

- README Phase 0 claims versus implemented business routes.
- `docs/api-contract.md` includes both missing and already-live routes.
- Formal UC IDs are unresolved in the wiki.
- Exact profile fields and exact insight fields remain open in the wiki.
- Admin authentication remains provisional.

### Open questions for the team

- Which document should become the single source for implementation status: `docs/`, `Documentation/`, or a dedicated status page linked from the wiki?
- Does the pilot require a minimum admin portal, or are scripts/manual APIs enough?
- Which email and push providers should be used for demo and pilot?
- Must the MVP feed support time/gender/multi-filter immediately, or is category-only acceptable for the first demo?
- Should the public profile API be implemented externally, or remain an internal adapter only?
- What audit level is required for report review, ban/suspend actions, and admin insights?

## 14. Technical Appendix

### Main files and directories reviewed

- `incampus-app/README.md`
- `incampus-app/package.json`
- `incampus-app/docs/*.md`
- `incampus-app/backend/src/app.ts`
- `incampus-app/backend/src/server.ts`
- `incampus-app/backend/package.json`
- `incampus-app/backend/.env.example`
- `incampus-app/backend/packages/shared/src/*`
- `incampus-app/backend/packages/*/src/entities/*`
- `incampus-app/backend/packages/*/src/routes/index.ts`
- `incampus-app/backend/packages/*/src/controllers/*`
- `incampus-app/backend/packages/*/src/services/*`
- `incampus-app/backend/packages/*/src/repositories/*`
- `incampus-app/backend/packages/*/src/__tests__/*`
- `incampus-app/mobile/package.json`
- `incampus-app/mobile/App.tsx`
- `incampus-app/mobile/src/navigation/AppNavigator.tsx`
- `incampus-app/mobile/src/services/api.ts`
- `incampus-app/mobile/src/screens/*`
- `incampus-app/Documentation/InCampus_Project_Map.md`
- `incampus-app/Documentation/INcampusFILES/requirements-data-model-crud/*`
- `incampus-app/Documentation/INcampusFILES/system architecture/*`
- `incampus-app/codingOrganization/workdivisionCODINGv1.2_corrected.md`
- `inCampusLLMwiki/wiki/index.md`
- `inCampusLLMwiki/wiki/project/overview.md`
- `inCampusLLMwiki/wiki/architecture/overview.md`
- `inCampusLLMwiki/wiki/architecture/data-model.md`
- `inCampusLLMwiki/wiki/requirements/traceability.md`

### Commands run for this review

- `rg --files`
- `find ...`
- `rg -n ...`
- `sed -n ...`
- `git status --short`
- `npm run lint`
- `npm run build`
- `npm run typecheck --workspace mobile`
- `npm test`

### Verification results

| Verification | Result |
| --- | --- |
| Backend lint | Passed |
| Backend build | Passed |
| Mobile typecheck | Passed |
| Backend tests | Passed: 27 files, 182 tests |

### Main evidence threads

- Product vision and MVP scope: `incampus-app/README.md`, `inCampusLLMwiki/wiki/project/overview.md`.
- Requirements and use cases: `Documentation/INcampusFILES/requirements-data-model-crud/Use cases v1.2.md`, `Functional Requirements v1.3.md`, `wiki/requirements/traceability.md`.
- First-skeleton architecture: `Documentation/INcampusFILES/system architecture/01 Design Scope and Architectural Choice v1.1.md`, `backend/src/app.ts`.
- Store ownership and data model: `shared/src/db/constraints.ts`, `shared/src/config/database.ts`, `shared/src/migrations/*`, `wiki/architecture/data-model.md`.
- Live routes: `backend/packages/*/src/routes/index.ts`.
- Events and notifications: `shared/src/events/EventBus.ts`, `InternalEventDispatcher.ts`, `notifications-system-flow/src/handlers/*`.
- Mobile implementation: `mobile/src/navigation/AppNavigator.tsx`, `mobile/src/services/api.ts`, `mobile/src/screens/*`.
- Mobile gaps: `CreateActivityScreen.tsx`, `PersonalActivityListPlaceholderScreen.tsx`.
- Delivery gaps: `EmailVerificationService.ts`, `NotificationDispatcher.ts`, `backend/src/app.ts`.
- CI: `.github/workflows/ci.yml`.

### Domain glossary

- AP: Access and Profile. Student identity, verification, campus selection, profile, and consent.
- CA: Campus Administration. Campus setup, structured options, and admin insights.
- H&L: Hosting and Lifecycle. Host-created activities and host-side lifecycle management.
- D&P: Discovery and Participation. Feed, activity details, join/request, withdrawal/leave, and personal list.
- SM: Safety and Moderation. Rules, blocking, reports, and review.
- NSF: Notifications and System Flow. Internal events, notification records, list, and notification context opening.
- `CampusID`: tenant boundary for data, activities, and admin operations.
- `AuthenticatedAdminContext`: runtime admin context, not a persistent admin store in the first skeleton.
- `ActivityReminderDue`: MVP reminder event branch currently lacking a real scheduler producer.

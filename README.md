# InCampus

InCampus is a campus-scoped mobile app for reducing isolation and supporting low-pressure student participation in ordinary university life: lunch, coffee, study sessions, sports, language exchange, and small campus activities.

First rollout focus: Tongji University, Jiading Campus.

## Phase 0 Status

This branch establishes the alpha sprint foundation. It is not feature implementation yet.

Implemented now:

- Node.js / TypeScript backend workspace.
- Express backend health route: `GET /health`.
- Modular monolith package skeletons under `backend/packages/`.
- Shared TypeScript contracts, enums, auth contexts, middleware placeholders, errors, EventBus, TypeORM config, DB constraint notes, demo seed data, and transaction helper.
- Contract docs under `docs/`.
- Folder-only mobile shell under `mobile/`.
- GitHub Actions CI under `.github/workflows/ci.yml`.

Business endpoints are contract-only until feature branches implement them.

## Architecture

InCampus uses one deployable multi-tenant modular monolith.

- `CampusID` is the tenant boundary.
- Backend packages represent logical module boundaries, not microservices.
- The shared persistence layer keeps logical store ownership.
- Cross-module access must use shared contracts, exported interfaces, or owning-module services.
- `AuthenticatedAdminContext` is runtime context only. There is no Campus Admin database/store.
- D&P owns no persistent entities or stores; it reads/orchestrates through the owning modules.
- NSF is the only writer of notification records.
- Notification records have no `isRead`, `readAt`, or read/unread state.
- Pending request withdrawal creates no notification.
- Cancellation and deletion are distinct.

## Backend Modules

- Access and Profile (AP)
- Campus Administration (CA)
- Hosting and Lifecycle (H&L)
- Discovery and Participation (D&P)
- Safety and Moderation (SM)
- Notifications and System Flow (NSF)

## Canonical Stores

- `DS-CA-001` Campus Configuration
- `DS-CA-002` Campus Structured Options
- `DS-AP-001` Student Account
- `DS-AP-002` Student Profile
- `DS-AP-003` University Identity Rules
- `DS-HL-001` Activities
- `DS-HL-002` Activity Participations
- `DS-SM-001` Block Relationships
- `DS-SM-002` Report Records
- `DS-NS-001` Notification Records

`DS-CA-002` must be one physical table named `campus_structured_options`, with `optionType = activity_category | campus_location`.

## Getting Started

```bash
npm install
npm run dev:backend
```

Backend health check:

```http
GET http://localhost:3000/health
```

For environment variables:

```bash
cp backend/.env.example backend/.env
```

Do not commit `.env` files.

## Checks

```bash
npm run lint
npm run build
npm test
```

## Mobile

`mobile/` is currently a folder-only Expo/React Native shell. Expo dependencies were not installed in Phase 0.

See `mobile/README.md` for the intended setup commands.

## Contracts and Setup

Root `docs/` is the Phase 0 / Phase 1 contract location. `backend/docs/` is only for backend-local notes.

- API contract: `docs/api-contract.md`
- Event contract: `docs/event-contract.md`
- Internal command contract: `docs/internal-command-contract.md`
- Error contract: `docs/error-contract.md`
- Demo scenarios: `docs/demo-scenarios.md`
- Setup notes: `docs/setup.md`

## Workflow

- Work on feature branches only.
- Do not push directly to `main` or `develop`.
- Use GitHub Pull Requests.
- Target `develop` once it exists. If `develop` is still missing, report that the PR target needs to be created or confirmed.

Current Phase 0 branch:

```text
feature/francesco/phase-0-foundation
```

## Ownership

- Francesco / `Natizh`: CA, SM, shared infrastructure, CI, DB, admin auth, integration review.
- Jacopo / `jaacopocoding`: AP, NSF, shared auth contracts, AP mobile flows.
- Matteo / `MatteoSilvestro`: H&L, D&P, activity mobile flows, transaction-sensitive participation flows.

## Documentation

The source documentation remains in `Documentation/`. The earlier `codingOrganization/` planning folder has been retired from the active repository after the initial work-division phase.

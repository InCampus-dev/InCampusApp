# Setup

## Repository Purpose

This repository is the coding foundation for the InCampus alpha/MVP sprint. It keeps the final documentation in `Documentation/` while root `docs/` carries the active operational contracts and readiness runbooks.

Root `docs/` is the active contract location for Phase 0 / Phase 1 implementation. `backend/docs/` is reserved for backend-local notes only.

## Architecture

The backend is one deployable multi-tenant modular monolith.

- `CampusID` is the tenant boundary.
- Backend packages represent logical module boundaries, not microservices.
- Cross-module access goes through shared contracts, exported interfaces, or owning-module services.
- `AuthenticatedAdminContext` is runtime context only.
- There is no Campus Admin database/store.
- D&P owns no persistent entities or stores; it reads/orchestrates through the owning modules.
- NSF is the only writer of notification records.
- Notification records have no `isRead`, `readAt`, or read/unread state.
- Pending request withdrawal creates no notification.
- Cancellation stores `Activity.Status = cancelled`; deletion is hard-delete behavior.
- `DS-CA-002` is one physical table named `campus_structured_options` with `optionId`, `campusId`, `optionType`, `name`, `description`, `isActive`, `createdAt`, and `updatedAt`.

## Install

```bash
npm install
```

## Run Backend

```bash
cp backend/.env.example backend/.env
npm run dev:backend
```

The Phase 0 backend exposes:

```http
GET /health
```

Do not commit `backend/.env`.

## Seed Demo Data

On a fresh development or demo database, seed the local Tongji Jiading demo data:

```bash
npm run seed:demo
```

This seeds the university identity rule, campus, structured options, verified host/guest accounts, profiles, consent settings, and demo activities. The seed is idempotent and local/demo only. See:

```text
docs/demo-seed.md
```

If you only need the historical identity-rule seed, the old command remains available:

```bash
npm run seed:demo:identity-rules --workspace backend
```

## Backend Demo Smoke Check

With the backend running and demo data seeded:

```bash
npm run smoke:demo
```

See `docs/backend-smoke-check.md` for required, conditional, and skipped checks.

## Run Mobile

The mobile app is an Expo workspace. Configure the backend URL before running it:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

For a physical device, replace `localhost` with the machine LAN IP. See `docs/mobile-run-check.md`.

## Checks

```bash
npm run lint
npm run build
npm test
```

## Branch Workflow

- Work on feature branches only.
- No direct pushes to `main` or `develop`.
- Open GitHub Pull Requests.
- Target `develop` once the team creates it.
- If `develop` is still missing, report that PR target is unresolved instead of inventing destructive branch operations.

Current Phase 0 branch:

```text
feature/francesco/phase-0-foundation
```

## Contributor Ownership

| Contributor | GitHub            | Ownership                                                                  |
| ----------- | ----------------- | -------------------------------------------------------------------------- |
| Francesco   | `Natizh`          | CA, SM, shared infrastructure, CI, DB, admin auth, integration review      |
| Jacopo      | `jaacopocoding`   | AP, NSF, shared auth contracts, AP mobile flows                            |
| Matteo      | `MatteoSilvestro` | H&L, D&P, activity mobile flows, transaction-sensitive participation flows |

## Documentation Sources Used

- `Documentation/InCampus_Project_Map.md`
- Earlier `codingOrganization/` planning files were used during initial work division and have been retired from the active repository.
- `Documentation/INcampusFILES/requirements-data-model-crud/CRUD matrix v1.6.md`
- `Documentation/INcampusFILES/requirements-data-model-crud/Entities & Attributes v1.2.md`
- `Documentation/INcampusFILES/requirements-data-model-crud/Databases v1.1.md`
- `Documentation/INcampusFILES/requirements-data-model-crud/Functional Requirements v1.3.md`
- `Documentation/INcampusFILES/requirements-data-model-crud/Non-Functional Requirements v1.2.md`
- `Documentation/INcampusFILES/requirements-data-model-crud/Relationship Table v1.1.md`
- `Documentation/INcampusFILES/requirements-data-model-crud/Use cases v1.2.md`
- `Documentation/INcampusFILES/system architecture/01 Design Scope and Architectural Choice v1.1.md`
- `Documentation/INcampusFILES/system architecture/System Architecture Diagram/SystemarchitectureDiagram.md`
- `Documentation/INcampusFILES/use case realizations/UCR - A&P v1.2.md`
- `Documentation/INcampusFILES/use case realizations/UCR - C&A v1.1.md`
- `Documentation/INcampusFILES/use case realizations/UCR - D&P v1.2.md`
- `Documentation/INcampusFILES/use case realizations/UCR - H&L v1.4.md`
- `Documentation/INcampusFILES/use case realizations/UCR - N&S v1.2.md`
- `Documentation/INcampusFILES/use case realizations/UCR - S&M v1.3.md`

## Known Mismatch

`GenderPreference` follows final docs: `all | male_only | female_only`.
The sprint plan listed `all | male | female`, so the foundation records this as an intentional documentation-priority decision.

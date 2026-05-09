# Setup

## Repository Purpose

This repository is the first coding foundation for the InCampus alpha sprint. It keeps the final documentation in `Documentation/` and `codingOrganization/` untouched while adding a GitHub monorepo foundation.

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

## Run Mobile

The mobile folder is a shell only. Expo is intentionally not initialized in Phase 0.

When the team is ready:

```bash
npx create-expo-app@latest mobile
cd mobile
npm install
npm run start
```

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
- `codingOrganization/workdivisionCODINGv1.2_corrected.md`
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

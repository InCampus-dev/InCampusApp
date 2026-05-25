# InCampus

<p align="center">
  <img src="mobile/assets/incampus-wordmark.png" alt="InCampus wordmark" width="240" />
</p>

**InCampus helps university students turn campus life from something they watch into something they can enter.**

It is a campus-scoped mobile app for low-pressure participation: lunch, coffee,
study sessions, sports, language exchange, small activities, and the everyday
moments where students often want company but do not want the weight of a big
event.

The first rollout target is **Tongji University, Jiading Campus**. The product is
intentionally not a dating app and not a generic events board. It is a safer,
campus-bounded layer for hosting, discovering, joining, and moderating ordinary
student life.

## Why It Matters

University isolation is often quiet. Students may be surrounded by people and
still miss easy ways to start a simple shared moment. InCampus treats that
problem as a real product and systems challenge:

- Students can discover nearby activities scoped to their campus.
- Hosts can create activities and manage join requests.
- Participants can join directly or request approval depending on the activity.
- Safety, reports, blocks, campus boundaries, and notification context are part
  of the core model rather than an afterthought.
- The backend keeps clear module ownership so the MVP can grow without turning
  into a fragile demo.

## Current State

InCampus is currently an **alpha/MVP integration** suitable for guided local
demos and continued feature work.

Implemented foundation:

- Expo + React Native mobile workspace with the main MVP student flows.
- Node.js / TypeScript / Express backend organized as a modular monolith.
- PostgreSQL persistence through TypeORM.
- Campus-scoped auth, profile, consent, feed, activity detail, join, request,
  notifications, report, block, and community-rules flows.
- Demo seed data for Tongji Jiading.
- Backend smoke checks and GitHub Actions CI with PostgreSQL.
- Expo Go support aligned to Expo SDK 54.

Known alpha limits:

- Email verification and push delivery are mocked/logged.
- No production admin UI yet.
- Some mobile flows still need final physical-device QA and polish.
- Mobile structured options are not fully dynamic yet.
- Production hardening is outside the current demo scope.

For the full evidence trail, read the
[current state update](docs/incampus-current-state-update-2026-05-17.md), the
[demo readiness review](docs/demo-readiness-review.md), and the
[mobile run check](docs/mobile-run-check.md).

## Repository Map

```text
.
|-- backend/        Node.js, Express, TypeScript, TypeORM backend
|-- mobile/         Expo + React Native mobile app
|-- docs/           Active contracts, runbooks, QA notes, demo readiness
|-- Documentation/  Domain documentation, diagrams, requirements, UCRs
|-- scripts/        Root helper scripts for local/device workflows
```

## Start Here

| Need | Link |
| --- | --- |
| Run the project locally | [docs/setup.md](docs/setup.md) |
| Run the mobile app with Expo Go | [mobile/README.md](mobile/README.md) |
| Check the mobile QA/runtime status | [docs/mobile-run-check.md](docs/mobile-run-check.md) |
| Understand backend commands and boundaries | [backend/README.md](backend/README.md) |
| Follow the integration-owner checklist | [docs/project-runbook.md](docs/project-runbook.md) |
| Review the API surface | [docs/api-contract.md](docs/api-contract.md) |
| Review events and notification flow | [docs/event-contract.md](docs/event-contract.md) |
| Review internal command boundaries | [docs/internal-command-contract.md](docs/internal-command-contract.md) |
| Review shared error behavior | [docs/error-contract.md](docs/error-contract.md) |
| Seed demo data | [docs/demo-seed.md](docs/demo-seed.md) |
| Run backend smoke checks | [docs/backend-smoke-check.md](docs/backend-smoke-check.md) |
| Walk through demo scenarios | [docs/demo-scenarios.md](docs/demo-scenarios.md) |
| Read backend-local notes | [backend/docs/README.md](backend/docs/README.md) |
| Read the domain documentation map | [Documentation/InCampus_Project_Map.md](Documentation/InCampus_Project_Map.md) |

## Quick Start

Use **Node 20 or 22**. Avoid Node 25 for Expo/Metro work; local testing found
Expo/Metro/ngrok startup failures with Node 25.

From the repository root:

```bash
npm install
cp backend/.env.example backend/.env
npm run migrate
npm run seed:demo
npm run dev:backend
```

Backend health check:

```http
GET http://localhost:3000/health
```

In another terminal, start the mobile app for an iOS Simulator or local mobile
runtime:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

For physical iPhone or Android testing with Expo Go, use the full guide in
[mobile/README.md](mobile/README.md). The short version is:

```bash
npm run dev:backend:device
npm run start:device --workspace mobile
```

If LAN mode is unreliable, prefer the tunnel flow documented in the mobile
README.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Host | `demo.host@tongji.edu.cn` | `InCampusDemo2026!` |
| Guest | `demo.guest@tongji.edu.cn` | `InCampusDemo2026!` |

## Quality Checks

```bash
npm run lint
npm run build
npm test
npm run typecheck --workspace mobile
```

For backend demo verification with a migrated local database:

```bash
npm run seed:demo
npm run dev:backend
npm run smoke:demo
```

## Architecture At A Glance

The backend is one deployable, campus-aware modular monolith.

- `CampusID` is the tenant boundary.
- Backend packages are logical module boundaries, not microservices.
- Cross-module access goes through shared contracts, exported interfaces, or
  owning-module services.
- Notification records are owned by NSF and have no read/unread state.
- D&P orchestrates discovery and participation but owns no persistent store.
- Cancellation and deletion are intentionally distinct.

Core modules:

| Module | Responsibility |
| --- | --- |
| AP | Access and Profile |
| CA | Campus Administration |
| H&L | Hosting and Lifecycle |
| D&P | Discovery and Participation |
| SM | Safety and Moderation |
| NSF | Notifications and System Flow |

## Dependency Policy

`package-lock.json` is committed on purpose. It makes installs reproducible for
the team and for CI.

Commit dependency files when:

- `package.json` changes.
- A real dependency version, resolved package, or workspace install graph
  changes.
- The lockfile change is required for CI or another teammate to reproduce the
  app.

Do not merge lockfile noise when:

- Running `npm install` only adds npm-version metadata.
- There is no matching `package.json` change and no actual package version
  change.
- The diff is caused by using a different local npm/Node version.

For this project, use Node 20 or 22 and run installs from the repository root.
That keeps the Expo SDK 54 dependency set coherent and avoids unnecessary
lockfile churn.

## Workflow

- Work on feature branches.
- Open GitHub Pull Requests for review.
- Keep `backend/.env` and other local secrets out of git.
- Keep `node_modules`, build output, temporary SQLite indexes, and local logs
  out of git.
- Preserve the domain documentation in `Documentation/` and the active
  implementation contracts in `docs/`.

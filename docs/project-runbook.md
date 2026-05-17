# Project Runbook

Updated: 2026-05-17

This runbook is the Integration Owner checklist for the final readiness pass after PR #35 and the real PR #36. PR #36 is Expo Go/device testing support, not the old roadmap T12 PR.

## Fresh Branch

```bash
git checkout main
git pull origin main
git checkout -b docs/francesco-final-readiness-reconciliation
git status --short
```

If local work blocks checkout, preserve it with a named stash before continuing.

## Baseline Checks

```bash
git diff --check
npm run lint
npm run build
npm test
npm run typecheck --workspace mobile
```

## Backend Runtime Verification

Prepare a local PostgreSQL database using the values in `backend/.env.example`, then run:

```bash
npm run migrate
npm run seed:demo
npm run dev:backend
npm run smoke:demo
```

The smoke command defaults to `http://localhost:3000`. Override it when needed:

```bash
DEMO_API_BASE_URL=http://localhost:3000 npm run smoke:demo
```

Current local verification on 2026-05-17 passed with `pass=15`, `fail=0`, `skipped=3`, `blocked=0`.

## CI Expectations

Backend CI should keep the existing lint/build/test checks and also run a Postgres-backed cycle:

```bash
npm run migrate
npm run seed:demo
npm run start --workspace backend
DEMO_API_BASE_URL=http://127.0.0.1:3000 npm run smoke:demo
```

This branch adds that cycle to `.github/workflows/ci.yml`. The branch is still waiting for a remote Actions run.

## Device QA

For simulator:

```bash
npm run dev:backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

For physical iPhone/Android with Expo Go:

```bash
npm run dev:backend:device
npm run start:device --workspace mobile
```

Override the detected host if necessary:

```bash
INCAMPUS_DEVICE_HOST=<reachable-ip> npm run start:device --workspace mobile
```

Do not close T17/T20 as fully validated until the physical device path has actually been executed.

## Known Limitations

- Email verification delivery is mock/console based.
- Push dispatch is mock/log based; notification records and context endpoints are real.
- Reminder handling exists for `ActivityReminderDue`, but no real scheduler produces those events automatically.
- Admin auth remains header-based for local/demo use.
- No admin UI exists for campus/options or report review workflows.
- Mobile create activity still relies on demo-seed fallback category/location options; structured options are not fully dynamic in mobile.
- Mobile withdraw pending request and leave joined activity UI is missing.
- Secrets, logging, rate limiting, deploy hardening, production admin IAM, real email gateway, and real push gateway are out of scope for this pass.

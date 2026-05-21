# Demo Readiness Review

Updated: 2026-05-21

This review reconciles the integrated demo state after PR #48 and the small demo stabilization pass.

Important PR note: the real merged PR #36 is `chore: support latest Expo Go device testing`. It is not the older roadmap PR #36 for T12. Status below is tracked by Task ID and current behavior on `main`, not by old roadmap PR numbers.

## Task Status T10-T20

| Task | Status | Evidence on current main or this branch | Remaining validation |
| --- | --- | --- | --- |
| T10 - Feed refresh after create/join | Implemented on main | PR #35 added feed refresh parameters after create/join plus pull-to-refresh in `ActivityFeedScreen`; backend feed/detail passed smoke. | Manual Expo QA still needs to verify the mobile transition on device/simulator. |
| T11 - Join/request activity flow | Implemented before/through current main | Backend direct join and approval request paths passed smoke; mobile detail calls the join endpoint, supports withdraw pending request and leave joined activity, and returns to feed with refresh. | Manual Expo QA for open, approval-based, withdraw, and leave paths. |
| T12 - Manage requests | Implemented on main | PR #35 added the real backend DTO with `requestId`, `applicantId`, and applicant profile summary; smoke passed pending request lookup and approval. | Manual host UI QA on device/simulator. |
| T13 - Notifications list/context/fallback | Implemented on main, push delivery mocked | Smoke passed notification list/context and deleted-activity fallback. Mobile notification list routes to activity, manage requests, personal activity, or fallback screens. | Push dispatch is still a log/stub, so only records and context are verified. |
| T14 - Personal activities | Implemented on main | Mobile `PersonalActivityListScreen` calls real `GET /profiles/me/activities`; backend route is mounted and service tests exist. | Manual mobile QA for upcoming/history grouping with seeded and runtime data. |
| T15 - Safety screens | Implemented on main | Report submission, block user, community rules, StudentProfile context, and demo admin report review screens are wired to backend routes. | Manual safety-flow QA and admin review QA remain. |
| T16 - Backend seed/smoke reliability | Locally verified; CI support added in this branch | `npm run migrate`, `npm run seed:demo`, `npm run dev:backend`, and `npm run smoke:demo` were run locally against a migrated DB. CI now has a Postgres-backed migrate/seed/smoke step. | Remote GitHub Actions run has not executed yet for this branch. |
| T17 - Expo Go/device support | Implemented on main by real PR #36; device QA pending | Root `dev:backend:device`, mobile `start:device`, LAN API base detection, and `INCAMPUS_DEVICE_HOST` override exist. | Physical iPhone/Android Expo Go flow still needs real validation. |
| T18 - Mobile polish/loading/error/empty states | Implemented on main, QA pending | Loading/error/empty handling exists across relevant mobile screens; stabilization adds profile edit, neutral/real campus display in Mine, and centralized student session-expired handling. | Final mobile pass should confirm states with slow backend, empty data, expired token, and API errors. |
| T19 - Runbook/checklist | Updated in this branch | `docs/mobile-run-check.md` and `docs/project-runbook.md` now include PR #36 device commands and current seed/smoke flow. | Keep updated with actual device QA results. |
| T20 - Final integrated review | Draft only | `docs/final-integrated-review.md` is created as a skeleton. | Do not mark complete until QA/device flow and CI are actually complete. |

## Runtime Seed/Smoke Verification

Local verification was actually executed on 2026-05-17 against the local migrated PostgreSQL database.

Commands and results:

```bash
npm run migrate
```

Result: pass. The local DB was already migrated, so the runner reported `Applied 0 migration(s).`

```bash
npm run seed:demo
```

Result: pass. Summary: 1 identity rule, 1 campus, 9 structured options, 2 student accounts, 2 profiles, 2 activities, and 2 existing demo activities reset.

```bash
npm run dev:backend
```

Result: pass. Backend started on port 3000 for smoke verification.

```bash
npm run smoke:demo
```

Result: pass. Summary: `pass=15`, `fail=0`, `skipped=3`, `blocked=0`.

Skipped smoke checks are intentional: mobile UI execution, mobile create-activity UI, and real push delivery are outside the backend smoke script.

## Device Run Commands

Backend for physical device testing:

```bash
npm run dev:backend:device
```

Expo Go device start:

```bash
npm run start:device --workspace mobile
```

Explicit host override when auto-detection chooses the wrong interface:

```bash
INCAMPUS_DEVICE_HOST=<reachable-ip> npm run start:device --workspace mobile
```

## Known Limits

- Email verification delivery is still mock/console based through `EmailVerificationService`.
- Push dispatch is still mock/log based through `NotificationDispatcher`; notification records/list/context are real.
- Reminder handling exists for `ActivityReminderDue`, but no real scheduler produces those events automatically.
- Admin auth remains provisional and header-based for demo/local workflows.
- Admin UI is demo-only; production admin auth remains out of scope.
- Mobile create activity loads dynamic campus structured options through the student-safe endpoint.
- Mobile withdraw pending request and leave joined activity UI is present in Activity Details.
- Mine no longer shows a hardcoded campus badge; it resolves the selected campus label when available.
- Profile edit is available from Mine and uses `PATCH /profiles/me`.
- Expired/invalid student-token 401s clear student auth storage and reset to sign-in.
- Secrets, logging, rate limiting, deploy hardening, and broader production hardening are out of scope for this readiness pass.
- Physical iPhone/Android Expo Go validation was not executed in this pass.

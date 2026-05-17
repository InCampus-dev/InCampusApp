# Final Integrated Review

Status: Draft skeleton only
Updated: 2026-05-17

Do not mark T20 complete from this document alone. Final completion requires remote CI, backend seed/smoke, and real mobile QA/device execution.

## Scope

- Reconcile T10-T20 after merged PR #35 and the real PR #36.
- Confirm backend seed/smoke repeatability.
- Confirm runbook/device commands.
- Capture remaining limitations before final demo sign-off.

## Current Evidence

| Area | Evidence | Status |
| --- | --- | --- |
| Static checks | `git diff --check`, `npm run lint`, `npm run build`, `npm test`, `npm run typecheck --workspace mobile` | Passed locally after docs/CI edits on 2026-05-17. |
| Backend migrations | `npm run migrate` | Passed locally, applied 0 new migrations because DB was already migrated. |
| Demo seed | `npm run seed:demo` | Passed locally against migrated DB. |
| Backend smoke | `npm run smoke:demo` against `npm run dev:backend` | Passed locally with `pass=15`, `fail=0`, `skipped=3`, `blocked=0`. |
| CI DB-backed smoke | `.github/workflows/ci.yml` Postgres service and migrate/seed/smoke step | Added in this branch, remote run pending. |
| Device commands | `npm run dev:backend:device`, `npm run start:device --workspace mobile`, `INCAMPUS_DEVICE_HOST=<reachable-ip>` override | Documented, physical device run pending. |

## Task Gate

| Task | Review state |
| --- | --- |
| T10 | Implemented; needs manual mobile QA evidence. |
| T11 | Implemented; backend smoke passed, mobile QA pending. |
| T12 | Implemented; backend smoke passed, host UI QA pending. |
| T13 | Implemented for records/context/fallback; push dispatch remains mocked. |
| T14 | Implemented; personal activities route/UI need manual QA. |
| T15 | Implemented; safety screens need manual QA. |
| T16 | Locally verified; CI support added, remote Actions pending. |
| T17 | Device support implemented; physical iPhone/Android validation pending. |
| T18 | Implemented; final mobile polish QA pending. |
| T19 | Runbook/checklist updated in this branch. |
| T20 | Open until final QA and device evidence are recorded. |

## Final Sign-Off Checklist

- Remote CI passes, including Postgres migrate/seed/smoke.
- Clean local run of baseline checks after final docs edits.
- Backend seed/smoke rerun on a known migrated DB.
- Simulator or physical-device walkthrough covers sign-in, feed, detail, create/join, manage requests, notifications, personal activities, report, block, and community rules.
- Physical Expo Go flow is run with PR #36 commands or explicitly recorded as not executed.
- Known mocks are acknowledged: email verification delivery, push dispatch, and admin header auth.

## Remaining Limitations

- Email verification delivery is mock/console based.
- Push dispatch is mock/log based; notification records and context endpoints are real.
- Reminder handling exists for `ActivityReminderDue`, but no real scheduler produces those events automatically.
- Admin auth remains header-based for local/demo use, and no admin UI exists for campus/options or report review workflows.
- Mobile create activity still relies on demo-seed fallback category/location options; structured options are not fully dynamic in mobile.
- Mobile withdraw pending request and leave joined activity UI is missing.
- Secrets, logging, rate limiting, deploy hardening, and broader production hardening remain out of scope.

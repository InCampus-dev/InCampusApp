# Backend Demo Smoke Check

The backend smoke check verifies the real demo path through HTTP calls against a running local backend. It does not introduce a new e2e framework.

## Prerequisites

1. Local database exists and migrations have been applied.

   ```bash
   npm run migrate
   ```

2. Backend is running:

   ```bash
   npm run dev:backend
   ```

3. Demo seed has been applied:

   ```bash
   npm run seed:demo
   ```

4. Optional custom base URL:

   ```bash
   DEMO_API_BASE_URL=http://localhost:3000 npm run smoke:demo
   ```

Default base URL is `http://localhost:3000`.

## Run

```bash
npm run smoke:demo
```

The command prints every check as `PASS`, `FAIL`, or `SKIPPED`.

On 2026-05-17 the local migrated database passed with `pass=15`, `fail=0`, `skipped=3`, `blocked=0`.

## Required Checks

These must pass for the backend demo path to be considered usable:

| Check | Expected result |
| --- | --- |
| Health | `GET /health` returns `status: ok`. |
| Demo sign-in | Host and guest demo accounts return access tokens. |
| Campus selection | `PATCH /accounts/me/campus` refreshes host and guest tokens with `selectedCampusId`. |
| Profile read | `GET /profiles/me` returns seeded host and guest profiles. |
| Campus list | `GET /campuses` returns Tongji Jiading for the signed-in student. |
| Structured options | Admin list returns at least five categories and four locations. |
| Seeded feed/detail | Guest sees a seeded realistic activity in feed and can open detail. |

## Conditional Checks

These run when required prerequisites are present. Unexpected failures are reported as failures because they affect the backend demo path.

| Check | Expected result |
| --- | --- |
| Create direct-join activity | Host can create a runtime smoke activity through `POST /activities`. |
| Direct join | Guest can join that activity through `POST /activities/:id/join`. |
| Direct-join notification | Host receives a notification record; list and context are readable. |
| Create approval activity | Host can create an approval-based runtime activity. |
| Request and approval | Guest requests to join; host sees pending request and approves it. |
| Approval notification | Guest receives application outcome notification; list and context are readable. |
| Fallback context | After deleting the direct-join smoke activity, the notification context returns fallback instead of reconstructing deleted state. |

Notification smoke checks verify notification records, `GET /notifications`, and `GET /notifications/:id/context`. They do not verify push delivery because `NotificationDispatcher` is still a known stub.

CI now runs the same backend path with a Postgres service: migrate, seed, start backend, then smoke.

## Skipped Or Blocked Checks

The backend smoke intentionally skips mobile-owned checks:

- mobile create activity UI (`T09`);
- mobile feed refresh, join/request, and manage-request UI (`T10`-`T12`);
- push delivery (`T13` / NSF delivery hardening).

Skipped checks do not fail the command when the skip is expected and printed.

## Manual Curl Checklist

Use this checklist if the script cannot be run in the current environment.

1. Health:

   ```bash
   curl -s http://localhost:3000/health
   ```

2. Host sign-in:

   ```bash
   curl -s -X POST http://localhost:3000/auth/signin \
     -H 'content-type: application/json' \
     -d '{"universityEmail":"demo.host@tongji.edu.cn","password":"88888888"}'
   ```

3. Guest sign-in:

   ```bash
   curl -s -X POST http://localhost:3000/auth/signin \
     -H 'content-type: application/json' \
     -d '{"universityEmail":"demo.guest@tongji.edu.cn","password":"88888888"}'
   ```

4. Campus list:

   ```bash
   curl -s http://localhost:3000/campuses \
     -H "authorization: Bearer $HOST_TOKEN"
   ```

5. Profile read:

   ```bash
   curl -s http://localhost:3000/profiles/me \
     -H "authorization: Bearer $HOST_TOKEN"
   ```

6. Structured options:

   ```bash
   curl -s http://localhost:3000/admin/campuses/$CAMPUS_ID/structured-options \
     -H 'x-admin-id: demo-admin' \
     -H 'x-admin-email: demo.admin@tongji.edu.cn' \
     -H 'x-admin-role: campus_admin' \
     -H "x-admin-selected-campus-id: $CAMPUS_ID" \
     -H "x-admin-authorized-campus-ids: $CAMPUS_ID"
   ```

7. Feed and detail:

   ```bash
   curl -s http://localhost:3000/activities \
     -H "authorization: Bearer $GUEST_TOKEN"
   curl -s http://localhost:3000/activities/$ACTIVITY_ID \
     -H "authorization: Bearer $GUEST_TOKEN"
   ```

8. Join/request and manage requests:

   ```bash
   curl -s -X POST http://localhost:3000/activities/$ACTIVITY_ID/join \
     -H "authorization: Bearer $GUEST_TOKEN" \
     -H 'content-type: application/json' \
     -d '{}'

   curl -s http://localhost:3000/activities/$ACTIVITY_ID/requests \
     -H "authorization: Bearer $HOST_TOKEN"

   curl -s -X PATCH http://localhost:3000/activities/$ACTIVITY_ID/requests/$REQUEST_ID \
     -H "authorization: Bearer $HOST_TOKEN" \
     -H 'content-type: application/json' \
     -d '{"decision":"approve"}'
   ```

9. Notifications:

   ```bash
   curl -s http://localhost:3000/notifications \
     -H "authorization: Bearer $HOST_TOKEN"
   curl -s http://localhost:3000/notifications/$NOTIFICATION_ID/context \
     -H "authorization: Bearer $HOST_TOKEN"
   ```

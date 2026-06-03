# Demo Seed

This seed is for local and demo environments only. It prepares the minimum real data needed for the InCampus demo path without creating hidden mocks or production data.

Run it only after the local database exists and the current migrations have been applied.

```bash
npm run seed:demo
```

The command delegates to the backend workspace and uses the existing `tsx` dev tool. It refuses to run when `NODE_ENV=production`.

To refresh only the richer mock activity feed while the backend and Expo demo are already running, use:

```bash
npm run seed:mock-activities
```

This command upserts only the dedicated `[DEMO] Mock:` activities. It does not reset the database, delete accounts, remove structured options, create notifications, or clear existing participation records.

## Demo Credentials

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Host student | `demo.host@tongji.edu.cn` | `InCampusDemo2026!` | Verified, active, selected into Tongji Jiading, insight consent enabled. |
| Guest student | `demo.guest@tongji.edu.cn` | `InCampusDemo2026!` | Verified, active, selected into Tongji Jiading, insight consent disabled. |

Admin routes use the provisional local header context:

```text
x-admin-id: demo-admin
x-admin-email: demo.admin@tongji.edu.cn
x-admin-role: campus_admin
x-admin-selected-campus-id: <demo campus id>
x-admin-authorized-campus-ids: <demo campus id>
```

## Seeded Data

- University identity rule: `tongji.edu.cn`.
- Campus: `Tongji University / Jiading Campus`.
- Activity categories: Lunch, Coffee, Study, Sport, Language Exchange.
- Meeting points: Library Plaza, Cafeteria, Main Gate, Sports Center.
- Student accounts: one host and one guest.
- Student profiles: one host profile and one guest profile.
- Activities:
  - `[DEMO] Lunch near Library Plaza`, open join.
  - `[DEMO] Language Exchange at Cafeteria`, approval-based.
  - `[DEMO] Moderation Review Activity`, dedicated to admin report-review and `remove_activity` checks.
- Mock activity feed records:
  - 22 `[DEMO] Mock:` activities across lunch, coffee, study, sport, language exchange, casual social, campus walk, exam prep, cultural exchange, and evening hangout scenarios.
  - Mixed open and approval-based participation modes.
  - Mixed capacities from 1-to-1 to small groups of 3-5 total people including the host.
  - Mixed gender preferences using the existing `all`, `male_only`, and `female_only` enum values.
- Report records:
  - One pending `[DEMO]` report targeting only the moderation review activity.

## Idempotency Rules

The seed reuses stable demo keys and updates records instead of creating uncontrolled duplicates:

| Data | Idempotency key |
| --- | --- |
| Identity rule | `emailDomain` |
| Campus | `universityName + campusName` |
| Structured option | `campusId + optionType + name` |
| Account | `universityEmail` |
| Profile | `studentAccountId` |
| Activity | `campusId + hostAccountId + title`, where title starts with `[DEMO]` |
| Mock activity | `campusId + title`, where title starts with `[DEMO] Mock:` |
| Report | Stable seeded demo report ID |

Rerunning the seed updates the demo records and resets only participations and notification records attached to the seeded `[DEMO]` activities. It does not delete or mutate non-demo data.
The seeded admin-demo report is reset by its stable report ID only; non-demo reports are not deleted or overwritten.
The mock activity command uses a PostgreSQL transaction and advisory lock, updates existing mock rows in place, recomputes counters from current participation rows, and leaves existing participation and notification records intact.

## Start Order

1. Start or reset the local PostgreSQL database.
2. Apply the backend migrations:

   ```bash
   npm run migrate
   ```

3. Start the backend:

   ```bash
   npm run dev:backend
   ```

4. In another terminal, run:

   ```bash
   npm run seed:demo
   ```

5. To refresh only the feed mock activities during a live demo, run:

   ```bash
   npm run seed:mock-activities
   ```

6. Optionally run the backend smoke check:

   ```bash
   npm run smoke:demo
   ```

## Reset And Rerun

For normal demo cleanup, rerun:

```bash
npm run seed:demo
```

For a live feed refresh without resetting core demo records, rerun:

```bash
npm run seed:mock-activities
```

For a full database reset, recreate the local database, apply migrations again with `npm run migrate`, and rerun the seed.

## Quick API Verification

Health:

```bash
curl -s http://localhost:3000/health
```

Host sign-in:

```bash
curl -s -X POST http://localhost:3000/auth/signin \
  -H 'content-type: application/json' \
  -d '{"universityEmail":"demo.host@tongji.edu.cn","password":"InCampusDemo2026!"}'
```

After sign-in, store the returned token:

```bash
HOST_TOKEN=<accessToken>
```

List campuses:

```bash
curl -s http://localhost:3000/campuses \
  -H "authorization: Bearer $HOST_TOKEN"
```

List structured options:

```bash
curl -s http://localhost:3000/admin/campuses/<campusId>/structured-options \
  -H 'x-admin-id: demo-admin' \
  -H 'x-admin-email: demo.admin@tongji.edu.cn' \
  -H 'x-admin-role: campus_admin' \
  -H 'x-admin-selected-campus-id: <campusId>' \
  -H 'x-admin-authorized-campus-ids: <campusId>'
```

Guest feed:

```bash
curl -s http://localhost:3000/activities \
  -H "authorization: Bearer $GUEST_TOKEN"
```

## Expected Demo Tour

1. Sign in as host or guest.
2. Confirm campus selection for Tongji Jiading.
3. Read or create profile.
4. Use the seeded feed activities to verify feed and detail.
5. Use backend smoke or mobile screens, where implemented, to verify join/request and manage requests.
6. Use notification list/context routes to verify notification records and fallback behavior.

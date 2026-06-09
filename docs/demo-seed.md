# Demo Seed

This seed is for local and demo environments only. It prepares realistic data for the InCampus demo path without creating hidden mocks, production data, or a seed-specific schema migration.

Important: these credentials are only for the local/demo seed. Do not use them for production, staging, or any real deployment.

Run it only after the local database exists and the current migrations have been applied.

```bash
npm run seed:demo
```

The command delegates to the backend workspace and uses the existing `tsx` dev tool. It refuses to run when `NODE_ENV=production`.

To refresh only the richer support activity feed while the backend and Expo demo are already running, use:

```bash
npm run seed:mock-activities
```

This command upserts only the support feed activities explicitly listed in the mock activity manifest. It does not reset the database, delete accounts, remove structured options, create notifications, or clear existing participation records.

## Demo Credentials

All local/demo student accounts use password `88888888`. Password hashing still runs through the normal backend bcrypt flow.

| Role | Email | Password | Demo scenario |
| --- | --- | --- | --- |
| Host student | `demo.host@tongji.edu.cn` | `88888888` | Hosts `Mandarin Practice Circle` with pending join requests for Manage Requests. |
| Guest student | `demo.guest@tongji.edu.cn` | `88888888` | Has a pending request for Withdraw Request and a confirmed coffee activity. |
| Joined guest | `user1@tongji.edu.cn` | `88888888` | Already confirmed in `Library Lunch Table` for Joined/Leave state. |
| Request applicant | `user2@tongji.edu.cn` | `88888888` | Pending applicant and host of a quick coffee activity. |
| Request applicant | `user3@tongji.edu.cn` | `88888888` | Pending applicant and host of the reported activity. |
| Study host | `user4@tongji.edu.cn` | `88888888` | Hosts tomorrow's study block. |
| Sport host | `user5@tongji.edu.cn` | `88888888` | Hosts basketball and has a pending CV review request. |
| Design host | `user6@tongji.edu.cn` | `88888888` | Hosts approval-based design critique. |
| Photo host | `user7@tongji.edu.cn` | `88888888` | Hosts the day-after-tomorrow photo walk. |
| Planning host | `user8@tongji.edu.cn` | `88888888` | Hosts career/planning meetups. |

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
- Student accounts and profiles: `demo.host`, `demo.guest`, and `user1` through `user8`.
- Scenario activities:
  - Today: `Library Lunch Table`, `Mandarin Practice Circle`, `Espresso Break Before Lab`.
  - Tomorrow: `Quiet Algorithms Study Block`, `CV Review Swap`, `Basketball Shooting Practice`, `Evening Design Critique`.
  - Day after tomorrow: `Campus Photo Walk`, `Finals Planning Coffee`, `Main Gate Coffee Chat`.
- Support feed activities:
  - 22 realistic feed activities across lunch, coffee, study, sport, language exchange, campus walk, exam prep, cultural exchange, and evening hangout scenarios.
  - Mixed open and approval-based participation modes.
  - Mixed capacities from 1-to-1 to small groups of 3-5 total people including the host.
  - Mixed gender preferences using the existing `all`, `male_only`, and `female_only` enum values.
- Participations:
  - Pending requests on `Mandarin Practice Circle` for host-side request review.
  - A pending request from `demo.guest` for the withdraw-request path.
  - Confirmed guests on open activities for Joined/Leave state and capacity display.
- Report records:
  - One pending report targeting `Main Gate Coffee Chat`.

No seeded activity is configured as immediately full, and no visible activity title contains `[DEMO]`.

## Idempotency Rules

The seed reuses stable demo keys and updates records instead of creating uncontrolled duplicates:

| Data | Idempotency key |
| --- | --- |
| Identity rule | `emailDomain` |
| Campus | `universityName + campusName` |
| Structured option | `campusId + optionType + name` |
| Account | `universityEmail` |
| Profile | `studentAccountId` |
| Scenario activity | Stable seeded activity ID |
| Support feed activity | `campusId + title` from the support activity manifest |
| Participation | Stable seeded participation ID |
| Report | Stable seeded report ID |

Rerunning the seed updates only the demo records explicitly listed in the manifests. It does not delete unrelated local data, does not reset the database, and does not create a TypeORM migration for this seed refresh. Activity counters are recalculated for the seeded scenario activities after listed participations are upserted.

The support feed command uses a PostgreSQL transaction and advisory lock, updates existing support rows in place, recomputes counters from current participation rows, and leaves existing participation and notification records intact.

## Start Order

1. Start the local PostgreSQL database.
2. Apply the backend migrations:

   ```bash
   npm run migrate
   ```

3. Seed local/demo data:

   ```bash
   npm run seed:demo
   ```

4. Start the backend:

   ```bash
   npm run dev:backend
   ```

5. In another terminal, run:

   ```bash
   npm run smoke:demo
   ```

6. To refresh only the support feed activities during a live demo, run:

   ```bash
   npm run seed:mock-activities
   ```

## Reset And Rerun

For normal demo refresh, rerun:

```bash
npm run seed:demo
```

For a live feed refresh without resetting core demo records, rerun:

```bash
npm run seed:mock-activities
```

For a full local database reset, recreate the local database, apply migrations again with `npm run migrate`, and rerun the seed. A full reset is not required for this demo refresh.

## Quick API Verification

Health:

```bash
curl -s http://localhost:3000/health
```

Host sign-in:

```bash
curl -s -X POST http://localhost:3000/auth/signin \
  -H 'content-type: application/json' \
  -d '{"universityEmail":"demo.host@tongji.edu.cn","password":"88888888"}'
```

Guest sign-in:

```bash
curl -s -X POST http://localhost:3000/auth/signin \
  -H 'content-type: application/json' \
  -d '{"universityEmail":"demo.guest@tongji.edu.cn","password":"88888888"}'
```

After sign-in, store the returned token:

```bash
HOST_TOKEN=<accessToken>
GUEST_TOKEN=<accessToken>
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

1. Sign in as `demo.guest@tongji.edu.cn`.
2. Confirm campus selection for Tongji Jiading.
3. Browse the activity feed and open realistic activity details.
4. Open `Mandarin Practice Circle` to show a pending request and withdraw when available.
5. Sign in as `user1@tongji.edu.cn` and open `Library Lunch Table` to show Joined/Leave state when available.
6. Sign in as `demo.host@tongji.edu.cn` and open `Mandarin Practice Circle` to manage pending requests.
7. Use the admin report flow to review the report linked to `Main Gate Coffee Chat`.

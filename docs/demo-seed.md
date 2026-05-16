# Demo Seed

This seed is for local and demo environments only. It prepares the minimum real data needed for the InCampus demo path without creating hidden mocks or production data.

Run it only after the local database exists and the current migrations have been applied.

```bash
npm run seed:demo
```

The command delegates to the backend workspace and uses the existing `tsx` dev tool. It refuses to run when `NODE_ENV=production`.

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

Rerunning the seed updates the demo records and resets only participations and notification records attached to the seeded `[DEMO]` activities. It does not delete or mutate non-demo data.

## Start Order

1. Start or reset the local PostgreSQL database.
2. Apply the backend migrations using the team's current local migration process.
3. Start the backend:

   ```bash
   npm run dev:backend
   ```

4. In another terminal, run:

   ```bash
   npm run seed:demo
   ```

5. Optionally run the backend smoke check:

   ```bash
   npm run smoke:demo
   ```

## Reset And Rerun

For normal demo cleanup, rerun:

```bash
npm run seed:demo
```

For a full database reset, recreate the local database, apply migrations again, and rerun the seed. The repository does not currently define a standard DB reset or migration CLI command, so use the project team's local database process.

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

# Mobile Run Check

Updated: 2026-05-17

This checklist verifies the current mobile app after merged PR #35 and the real PR #36, which is the Expo Go/device-testing PR. Do not use old roadmap PR numbers as status evidence.

## Local Backend And Seed

Prepare the local database and demo data first:

```bash
npm run migrate
npm run seed:demo
```

For a local simulator:

```bash
npm run dev:backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

For a physical iPhone or Android with Expo Go:

```bash
npm run dev:backend:device
npm run start:device --workspace mobile
```

If the LAN IP auto-detection chooses the wrong interface:

```bash
INCAMPUS_DEVICE_HOST=<reachable-ip> npm run start:device --workspace mobile
```

The phone and development machine must be able to reach each other on the same LAN, VPN, or routable mesh network.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Host | `demo.host@tongji.edu.cn` | `InCampusDemo2026!` |
| Guest | `demo.guest@tongji.edu.cn` | `InCampusDemo2026!` |

## Navigation Checklist

| Area | Expected status | Check |
| --- | --- | --- |
| Sign in | Implemented | Sign in with the host or guest seeded account. |
| Sign up | Partial | Flow exists, but email verification delivery is console/mock based. |
| Campus selection | Implemented | If selected campus is missing, select Tongji Jiading and confirm token refresh. |
| Profile setup | Implemented | Seeded accounts already have profiles; profile create/update remains available. |
| Consent settings | Implemented | Toggle consent and continue to feed. |
| Create activity | Implemented, partial | `POST /activities` is wired, but category/location options still rely on demo-seed fallback IDs instead of fully dynamic mobile structured-options loading. |
| Feed refresh, T10 | Implemented, QA pending | Create or join an activity and verify the feed refreshes; also pull to refresh. |
| Activity detail and join, T11 | Implemented, QA pending | Open seeded `[DEMO]` activities and verify open join plus approval request behavior. |
| Manage requests, T12 | Implemented, QA pending | Sign in as host, open an approval-based activity, and approve/decline a pending request. |
| Notifications, T13 | Implemented records/context, push mocked | Verify list, context routing, and fallback routing after backend smoke creates records. |
| Personal activities, T14 | Implemented, QA pending | Open My Activities and verify `GET /profiles/me/activities` data appears in upcoming/history. |
| Report/block/community rules, T15 | Implemented, QA pending | Submit a report, block a host/student where available, and open community rules. |
| Loading/error/empty states, T18 | Implemented, QA pending | Check offline backend, empty lists, retry buttons, and spinners. |

## Manual Demo Path

1. Run `npm run migrate`.
2. Run `npm run seed:demo`.
3. Start the backend with `npm run dev:backend` for simulator or `npm run dev:backend:device` for physical device.
4. Start Expo with `npm run start --workspace mobile` for simulator or `npm run start:device --workspace mobile` for physical device.
5. Sign in as guest and confirm campus/profile/consent path reaches Activity Feed.
6. Open seeded `[DEMO]` activities from feed.
7. Try open join and approval-based request.
8. Sign in as host and verify manage requests.
9. Open notifications after the smoke script or manual join/request creates notification records.
10. Open My Activities, Community Rules, Report, and Block flows.

## Not Yet Claimed

- Physical iPhone/Android Expo Go validation has not been executed in this pass.
- Push delivery is not real; only notification records and context routing are verified.
- Email verification delivery is not real; use seeded accounts for demos.
- Mobile withdraw pending request and leave joined activity UI is missing.
- No admin UI exists for campus/options or report review workflows.

# Mobile Run Check

This checklist verifies the mobile app without implementing feature work owned by Matteo or Jacopo.

## Typecheck

```bash
npm run typecheck --workspace mobile
```

This should pass before any manual Expo check.

## Backend URL

Set the mobile API base URL before starting Expo.

For iOS simulator on the same machine:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

For a physical device, use the machine LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<LAN_IP>:3000 npm run start --workspace mobile
```

Make sure the backend is already running and the seed has been applied:

```bash
npm run dev:backend
npm run seed:demo
```

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Host | `demo.host@tongji.edu.cn` | `InCampusDemo2026!` |
| Guest | `demo.guest@tongji.edu.cn` | `InCampusDemo2026!` |

## Navigation Checklist

| Area | Expected status in current branch | Check |
| --- | --- | --- |
| Sign in | Pass if backend/seed are running | Sign in with host or guest credentials. |
| Sign up | Partial | Flow exists, but email verification is console/mock based. |
| Campus selection | Pass | If selected campus is missing, select Tongji Jiading and confirm token refresh. |
| Profile setup | Pass/partial | Creating a profile is wired; seeded accounts already have profiles. |
| Consent settings | Pass | Toggle consent and continue to feed. |
| Feed | Partial | Basic `GET /activities` wiring exists; refresh behavior from T10 must be verified after merge. |
| Activity detail | Partial | Detail fetch and join button exist; host profile display may need DTO alignment. |
| Create activity | Blocked by T09 | Current screen still uses mock option IDs and does not call `POST /activities`. Do not treat as complete. |
| Join/request | Partial, owned outside Francesco | Screen calls backend join endpoint; full UX is T11/T12 territory. |
| Manage requests | Partial, owned outside Francesco | Screen calls backend request endpoints but request DTO/display alignment still needs verification. |
| Notifications | Partial | Notification list/context screens exist; push delivery is not real. |
| Personal activity list | Blocked by T15 | Placeholder screen explicitly says personal history is not wired. |

## What Not To Change In This Check

- Do not replace the mock create-activity implementation as part of Francesco's tasks.
- Do not rewrite feed, join/request, manage-requests, notifications, or secondary placeholders.
- Only fix TypeScript/runtime breakage caused directly by the Francesco demo tooling if it appears.

## Manual Demo Path

1. Start backend and seed data.
2. Start Expo with `EXPO_PUBLIC_API_BASE_URL`.
3. Sign in as guest.
4. Confirm campus/profile path reaches Activity Feed.
5. Open seeded `[DEMO]` activity from feed.
6. Try join/request only if T11/T12 code is present in the branch under test.
7. Sign in as host and verify manage requests only if the UI receives a real activity context.
8. Open notification list only after backend smoke or manual join/request has created notification records.

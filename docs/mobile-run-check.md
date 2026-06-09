# Mobile Run Check

Updated: 2026-05-21

This checklist verifies the current mobile app after the Expo Go compatibility
alignment to Expo SDK 54. Do not use old roadmap PR numbers as status evidence.
The current pass confirms runtime/tooling compatibility and iOS Simulator
launch only; full frontend walkthrough and physical-device QA are still pending.

## Expo Runtime Alignment

The mobile workspace is pinned to Expo SDK 54 because SDK 55 required a newer
Expo Go than the iPhone App Store build available during testing. SDK 54 is the
compatible target for the currently available Expo Go runtime.

Keep this dependency set coherent unless the team moves to a development build
or Expo Go SDK 55 becomes available:

- `expo@54.0.34`
- `react@19.1.0`
- `react-native@0.81.5`
- `expo-status-bar@3.0.9`
- `react-native-gesture-handler@2.28.0`
- `react-native-safe-area-context@5.6.2`
- `react-native-screens@4.16.0`
- `babel-preset-expo@54.0.10`

Use Node 20 or 22. Do not use Node 25; Expo/Metro/ngrok failed in local testing
with Node 25.

With Homebrew Node 20:

```bash
export PATH="$(brew --prefix node@20)/bin:$PATH"
```

## Local Backend And Seed

Prepare the local database and demo data first:

```bash
npm run migrate
npm run seed:demo
```

Start the backend from the repository root:

```bash
npm run dev:backend
```

Expose the backend with ngrok v3 or another working tunnel:

```bash
ngrok http 3000
```

Verify the public backend URL before starting Expo:

```bash
curl https://<backend-tunnel-url>/health
```

Start Expo from inside the mobile workspace:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://<backend-tunnel-url> npx expo start --tunnel --clear
```

For a local simulator without a backend tunnel:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

The legacy device helper remains available for LAN/IP-based device testing:

```bash
npm run dev:backend:device
npm run start:device --workspace mobile
```

If the LAN IP auto-detection chooses the wrong interface:

```bash
INCAMPUS_DEVICE_HOST=<reachable-ip> npm run start:device --workspace mobile
```

The phone and development machine must be able to reach each other on the same
LAN, VPN, or routable mesh network. On unreliable LANs, prefer backend tunnel
plus Expo tunnel. Do not use Node 25.

## Demo Accounts

| Role | Display name | Email | Password |
| --- | --- | --- | --- |
| Host | Luca Ferri | `demo.host@tongji.edu.cn` | `88888888` |
| Guest | Giulia Conti | `demo.guest@tongji.edu.cn` | `88888888` |
| Numbered users | Mei Chen through Nora Smith | `user1@tongji.edu.cn` through `user8@tongji.edu.cn` | `88888888` |

These credentials are local/demo only and must not be used for production.

## Navigation Checklist

| Area | Expected status | Check |
| --- | --- | --- |
| Sign in | Implemented | Sign in with the host or guest seeded account. |
| Sign up | Partial | Flow exists, but email verification delivery is console/mock based. |
| Campus selection | Implemented | If selected campus is missing, select Tongji Jiading and confirm token refresh. |
| Profile setup/edit | Implemented | Seeded accounts already have profiles; onboarding creates profiles and Mine > Edit profile updates via `PATCH /profiles/me`. |
| Consent settings | Implemented | Toggle consent and continue to feed. |
| Create activity | Implemented | `POST /activities` is wired and category/location options load from the student-safe structured-options endpoint. |
| Feed refresh, T10 | Implemented, QA pending | Create or join an activity and verify the feed refreshes; also pull to refresh. |
| Activity detail and join, T11 | Implemented, QA pending | Open seeded realistic activities and verify open join, approval request, withdraw request, and leave activity behavior. |
| Manage requests, T12 | Implemented, QA pending | Sign in as host, open an approval-based activity, and approve/decline a pending request. |
| Notifications, T13 | Implemented records/context, push mocked | Verify list, context routing, and fallback routing after backend smoke creates records. |
| Personal activities, T14 | Implemented, QA pending | Open My Activities and verify `GET /profiles/me/activities` data appears in upcoming/history. |
| Report/block/community rules, T15 | Implemented, QA pending | Submit a report, open contextual student profile, block a host/student where available, and open community rules. |
| Loading/error/empty states, T18 | Implemented, QA pending | Check offline backend, empty lists, retry buttons, spinners, and expired-token reset to Sign In. |

## Manual Demo Path

1. Run `npm run migrate`.
2. Run `npm run seed:demo`.
3. Start the backend with `npm run dev:backend`.
4. Expose it with `ngrok http 3000` and verify `https://<backend-tunnel-url>/health`.
5. Start Expo from `mobile/` with `EXPO_PUBLIC_API_BASE_URL=https://<backend-tunnel-url> npx expo start --tunnel --clear`.
6. Sign in as guest and confirm campus/profile/consent path reaches Activity Feed.
7. Open seeded realistic activities from feed.
8. Try open join, approval-based request, withdraw request, and leave joined activity.
9. Sign in as host and verify manage requests.
10. Open notifications after the smoke script or manual join/request creates notification records.
11. Open My Activities, Community Rules, Report, Block, Student Profile, Mine campus label, and Edit Profile flows.

## Not Yet Claimed

- App launch was confirmed in iOS Simulator after the Expo SDK 54 alignment.
- Full frontend walkthrough has not been completed in this pass.
- Physical iPhone/Android Expo Go QA has not been completed in this pass.
- General mobile UI is not final and still needs polish.
- Some mobile flows are still MVP/partial.
- Some report/block contexts are still MVP fallback/manual.
- Push delivery is still mock/log; only notification records and context routing are verified.
- Email verification delivery is still mock/console; use seeded accounts for demos.
- Reminder scheduler is missing.
- Demo admin UI exists for campus/options, reports, and insights; admin auth production flow is missing.
- EventBus handler isolation is implemented with `Promise.allSettled`; production observability around handler failures is still minimal.
- Production hardening remains out of scope.

# InCampus Mobile

This workspace now contains a minimal Expo + React Native scaffold around the existing MVP screens.

## Install

From the repository root:

```bash
npm install
```

## Runtime

Use Node 20 or 22 for Expo/Metro work. Avoid Node 25: local testing hit
Expo/Metro/ngrok startup failures with Node 25.

With Homebrew Node 20:

```bash
export PATH="$(brew --prefix node@20)/bin:$PATH"
```

The mobile workspace is intentionally aligned to Expo SDK 54 because SDK 55
required a newer Expo Go than the iPhone App Store build available during
testing. Keep the Expo SDK 54 dependency set coherent unless the team moves to a
development build or Expo Go SDK 55 becomes available.

Current runtime pins:

- `expo@54.0.34`
- `react@19.1.0`
- `react-native@0.81.5`
- `expo-status-bar@3.0.9`
- `react-native-gesture-handler@2.28.0`
- `react-native-safe-area-context@5.6.2`
- `react-native-screens@4.16.0`
- `babel-preset-expo@54.0.10`

## Start

For the most reliable Expo Go path, start the backend from the repository root:

```bash
npm run dev:backend
```

Expose the backend through ngrok v3 or another working tunnel:

```bash
ngrok http 3000
```

Verify the tunnel before starting Expo:

```bash
curl https://<backend-tunnel-url>/health
```

Then start Expo from inside the mobile workspace:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://<backend-tunnel-url> npx expo start --tunnel --clear
```

For a local simulator, this root command is still available:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

The LAN device helper is still available:

```bash
npm run dev:backend:device
npm run start:device --workspace mobile
```

The device flow detects the machine LAN IP and sets
`EXPO_PUBLIC_API_BASE_URL=http://<lan-ip>:3000` before starting Expo. If auto
detection picks the wrong interface, set the host explicitly:

```bash
INCAMPUS_DEVICE_HOST=192.168.1.10 npm run start:device --workspace mobile
```

PowerShell:

```powershell
$env:INCAMPUS_DEVICE_HOST="192.168.1.10"; npm run start:device --workspace mobile
```

`npm run start:device --workspace mobile` is LAN/IP based. It can fail on
networks where the phone cannot directly reach the Mac. For unreliable LANs, use
the backend tunnel plus Expo tunnel flow above.

Optional device shortcuts:

```bash
npm run ios --workspace mobile
npm run android --workspace mobile
```

## Verify

Type-check the mobile workspace:

```bash
npm run typecheck --workspace mobile
```

The mobile API client reads `EXPO_PUBLIC_API_BASE_URL`. If it is not set, it falls back to `http://localhost:3000`.
Use `mobile/.env.example` as the local configuration template.

Examples:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000 npm run start --workspace mobile
```

PowerShell:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.10:3000"; npm run start --workspace mobile
```

Use `localhost` for a local simulator when that is supported by your setup. Use your machine's LAN IP for a physical device.

## Current Validation

The corrected Expo SDK 54 / React Native dependency graph has been confirmed to
launch in iOS Simulator. Full frontend walkthrough and physical-device QA are
still pending. This is a runtime/tooling compatibility setup, not frontend
completion or production readiness.

Known limitations remain:

- Frontend polish is still needed and the general mobile UI is not final.
- Some mobile flows are still MVP/partial.
- Dynamic structured options are not fully wired in mobile.
- Withdraw pending request and leave joined activity UI is missing.
- Some report/block contexts are still MVP fallback/manual.
- Email delivery is still mock/console.
- Push delivery is still mock/log.
- Reminder scheduler is missing.
- Admin UI/auth production flow is missing.
- Production hardening remains out of scope.

Keep the mobile screens aligned with the shared contracts in `../docs/api-contract.md`.

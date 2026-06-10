# InCampus Mobile

This workspace contains the Expo + React Native mobile app for the InCampus MVP
screens.

Use this guide when running the app locally, in iOS Simulator, or on a physical
iPhone with Expo Go.

## Requirements

- Node 20 or 22.
- npm from the same Node installation.
- Expo Go compatible with Expo SDK 54.
- A local backend on port `3000`.
- ngrok v3 for the backend tunnel when testing on a physical phone.

Avoid Node 25 for Expo/Metro work. Local testing hit Expo/Metro/ngrok startup
failures with Node 25.

With `nvm`:

```bash
nvm install 20
nvm use 20
node -v
```

With Homebrew Node 20:

```bash
export PATH="$(brew --prefix node@20)/bin:$PATH"
node -v
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

## First Setup

Run these commands from the repository root:

```bash
npm install
npm run migrate
npm run seed:demo
```

Demo login accounts:

```text
Luca Ferri
demo.host@tongji.edu.cn
88888888
```

```text
Giulia Conti
demo.guest@tongji.edu.cn
88888888
```

Numbered demo accounts `user1@tongji.edu.cn` through `user8@tongji.edu.cn`
show person-name profiles from Mei Chen through Nora Smith and also use
`88888888`. These credentials are local/demo only.

## Physical iPhone with Expo Go

This is the recommended path when the phone is not reliably reachable through
the same LAN as the Mac.

Use three terminals.

Terminal 1, from the repository root, start the backend:

```bash
npm run dev:backend:device
```

Terminal 2, expose the backend with system ngrok v3:

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL shown by ngrok. Verify that it reaches the
backend before starting Expo:

```bash
curl https://<backend-tunnel-url>/health
```

Terminal 3, start Expo from the mobile workspace:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://<backend-tunnel-url> npx expo start --tunnel --clear
```

Important details:

- Use the backend ngrok base URL, for example `https://abc123.ngrok-free.app`.
- Do not append `/health` to `EXPO_PUBLIC_API_BASE_URL`.
- Keep the backend terminal and the ngrok terminal open.
- Scan the Expo QR code with Expo Go on the iPhone.
- If login fails after changing URLs, stop Expo and rerun the command with
  `--clear`.

## iOS Simulator

For the simulator, start the backend locally:

```bash
npm run dev:backend
```

Then start Expo with a localhost API URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run start --workspace mobile
```

Optional simulator shortcut:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run ios --workspace mobile
```

## LAN Device Helper

The LAN helper is useful only when the phone can directly reach the Mac on the
local network. It does not use Expo tunnel mode.

From the repository root:

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

## Verify

Type-check the mobile workspace:

```bash
npm run typecheck --workspace mobile
```

The mobile API client reads `EXPO_PUBLIC_API_BASE_URL`. If it is not set, it
falls back to `http://localhost:3000`. Use `mobile/.env.example` as the local
configuration template.

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

## Troubleshooting

Check the Node version first:

```bash
node -v
```

If it prints Node 25, switch to Node 20 or 22, reinstall dependencies, and retry:

```bash
nvm use 20
npm install
```

Check the system ngrok version for the backend tunnel:

```bash
ngrok version
```

It should be ngrok v3. The backend tunnel is separate from Expo's internal
tunnel package.

If the backend tunnel works but the app cannot log in:

- Confirm `curl https://<backend-tunnel-url>/health` works.
- Confirm `EXPO_PUBLIC_API_BASE_URL` is exactly the backend tunnel base URL.
- Restart Expo with `--clear`.
- Rerun `npm run seed:demo` if the demo accounts are missing.

If Expo Go cannot open the project through LAN mode, use the physical iPhone
tunnel flow above instead of `npm run start:device --workspace mobile`.

## Current Validation

The Expo SDK 54 / React Native dependency graph has been confirmed to launch in
iOS Simulator. The physical iPhone Expo Go startup path works when using Node 20
or 22, a working backend ngrok v3 URL, and Expo tunnel mode. Full product QA is
still separate from this runtime/tooling setup.

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

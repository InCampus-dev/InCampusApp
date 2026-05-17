# InCampus Mobile

This workspace now contains a minimal Expo + React Native scaffold around the existing MVP screens.

## Install

From the repository root:

```bash
npm install
```

## Start

Run the Expo dev server from the repository root:

```bash
npm run start --workspace mobile
```

For physical iPhone or Android testing with Expo Go, keep the backend running on
the same machine and start Expo in LAN mode:

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

The phone and development machine must be on the same network. Disable VPNs or
firewall rules that block device-to-machine traffic. Some VPN or mesh-network IPs
can work too when the phone can route to them; if auto detection picks the wrong
one, set `INCAMPUS_DEVICE_HOST` explicitly.

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

Keep the mobile screens aligned with the shared contracts in `../docs/api-contract.md`.

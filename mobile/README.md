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

Use `localhost` for a local simulator when that is supported by your setup. Use your machine's LAN IP for a physical device.

Keep the mobile screens aligned with the shared contracts in `../docs/api-contract.md`.

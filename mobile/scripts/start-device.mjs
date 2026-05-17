import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.INCAMPUS_BACKEND_PORT ?? "3000";
const host = process.env.INCAMPUS_DEVICE_HOST ?? findLanAddress();
const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (!host) {
  console.error(
    "Unable to detect a reachable device IP. Set INCAMPUS_DEVICE_HOST to your machine IP and retry."
  );
  process.exit(1);
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${host}:${port}`;

console.log(`Starting Expo for physical devices with API base URL: ${apiBaseUrl}`);
console.log("Keep the phone able to reach this host IP; set INCAMPUS_DEVICE_HOST if auto detection picks the wrong one.");

const child = spawn("npx", ["expo", "start", "--lan"], {
  cwd: mobileRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    EXPO_PUBLIC_API_BASE_URL: apiBaseUrl
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function findLanAddress() {
  const candidates = [];

  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        candidates.push(entry.address);
      }
    }
  }

  return candidates.find(isLikelyLocalNetworkAddress) ?? candidates[0];
}

function isLikelyLocalNetworkAddress(address) {
  if (address.startsWith("192.168.")) {
    return true;
  }

  if (address.startsWith("10.")) {
    return !address.startsWith("100.");
  }

  const parts = address.split(".").map((part) => Number(part));
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? "3000";
const childOptions = {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    HOST: host,
    PORT: port
  }
};

console.log(`Starting InCampus backend for physical devices on ${host}:${port}`);

const child = spawnCommand("npm", ["run", "dev", "--workspace", "backend"], childOptions);

child.on("error", (error) => {
  console.error(`Failed to start backend device command: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function spawnCommand(command, args, options) {
  if (!isWindows) {
    return spawn(command, args, options);
  }

  return spawn("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], options);
}

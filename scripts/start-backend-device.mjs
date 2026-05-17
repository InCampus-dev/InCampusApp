import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? "3000";

console.log(`Starting InCampus backend for physical devices on ${host}:${port}`);

const child = spawn(npmCommand, ["run", "dev", "--workspace", "backend"], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOST: host,
    PORT: port
  }
});

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

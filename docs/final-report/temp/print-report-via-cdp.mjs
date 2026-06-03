import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const bravePath = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const port = 9227;
const root = path.resolve("docs/final-report");
const htmlUrl = `file://${path.join(root, "temp", "final-report.html")}`;
const outputPdf = path.join(root, "final-report.pdf");
const userDataDir = path.join(os.tmpdir(), "incampus-report-brave");

rmSync(userDataDir, { recursive: true, force: true });
mkdirSync(userDataDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, tries = 60, options = undefined) {
  let lastError;
  for (let i = 0; i < tries; i += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError;
}

async function send(ws, method, params = {}, waitForEvent) {
  const id = send.nextId++;
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const payload = JSON.parse(event.data);
      if (waitForEvent && payload.method === waitForEvent) {
        ws.removeEventListener("message", onMessage);
        resolve(payload.params ?? payload);
        return;
      }
      if (!waitForEvent && payload.id === id) {
        ws.removeEventListener("message", onMessage);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
send.nextId = 1;

const browser = spawn(
  bravePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "about:blank"
  ],
  { stdio: "ignore" }
);

browser.unref();

try {
  await fetchJson(`http://127.0.0.1:${port}/json/version`);
  const target = await fetchJson(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(htmlUrl)}`,
    10,
    { method: "PUT" }
  );
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");
  await send(ws, "Page.loadEventFired", {}, "Page.loadEventFired");

  await send(
    ws,
    "Runtime.evaluate",
    {
      expression: `
        Promise.all([
          document.fonts ? document.fonts.ready : Promise.resolve(),
          ...Array.from(document.images, (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.addEventListener("load", resolve, { once: true });
                  img.addEventListener("error", resolve, { once: true });
                })
          )
        ]).then(() => true)
      `,
      awaitPromise: true
    }
  );

  await sleep(1200);

  const pdf = await send(ws, "Page.printToPDF", {
    printBackground: true,
    displayHeaderFooter: false,
    preferCSSPageSize: true,
    scale: 1
  });

  writeFileSync(outputPdf, Buffer.from(pdf.data, "base64"));
  ws.close();
} finally {
  browser.kill("SIGTERM");
  await sleep(400);
  rmSync(userDataDir, { recursive: true, force: true });
}

console.log(outputPdf);

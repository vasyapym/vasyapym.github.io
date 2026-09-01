// Visual probe for the /art-directions comparison page: boots the Vite dev
// server on a scratch port, then photographs each variant section (desktop),
// a hover state, the full page, a mobile pass, and a reduced-motion pass.
//
//   node portfolio/shell/tests/art-directions-shots.mjs [outDir]
//
// Uses puppeteer-core with a chrome-headless-shell binary (no Chrome install
// needed); skips cleanly when no browser binary is available.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const PORT = 5219;
const BASE = `http://localhost:${PORT}`;
const outDir = process.argv[2] || join(tmpdir(), "art-directions-shots");
mkdirSync(outDir, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Users/vasilij/.cache/chrome-headless/chrome-headless-shell/mac-152.0.7977.64/chrome-headless-shell-mac-x64/chrome-headless-shell",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("shots: no Chrome/Chromium found — skipping (set CHROME_PATH)");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");

const viteJs = resolve(shellDir, "../node_modules/vite/bin/vite.js");
const server = spawn(
  process.execPath,
  [viteJs, "--port", String(PORT), "--strictPort"],
  {
    cwd: shellDir,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
const serverOutput = [];
server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));

const waitForServer = async () => {
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite did not start:\n${serverOutput.join("")}`);
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

try {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath,
    headless: "shell",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  // Desktop — header, one shot per variant section, full page, hover state.
  const desktop = await browser.newPage();
  const consoleErrors = [];
  desktop.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  desktop.on("pageerror", (err) => consoleErrors.push(String(err)));
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktop.goto(`${BASE}/art-directions`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));

  const head = await desktop.$(".art-directions-head");
  if (head) await head.screenshot({ path: join(outDir, "header.png") });

  const sections = await desktop.$$(".art-variant-section");
  check("five sections render (3 variants + raft + trail rounds)", sections.length === 5, `found ${sections.length}`);

  const names = ["variant-a", "variant-b", "variant-c", "raft-round", "trail-round"];
  for (let i = 0; i < sections.length && i < 5; i += 1) {
    await sections[i].screenshot({ path: join(outDir, `${names[i]}.png`) });
  }

  await desktop.screenshot({ path: join(outDir, "art-directions-full.png"), fullPage: true });

  // Hover state on the first card of variant A (lift + tilt + halo brighten).
  const firstCard = await desktop.$(".art-variant-section .signal-index-card");
  if (firstCard) {
    await firstCard.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await new Promise((r) => setTimeout(r, 600));
    await firstCard.hover();
    await new Promise((r) => setTimeout(r, 500));
    await sections[0].screenshot({ path: join(outDir, "variant-a-hover.png") });
  }

  // Mobile — single-column sanity + overflow check.
  const mobile = await browser.newPage();
  mobile.on("pageerror", (err) => consoleErrors.push(String(err)));
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobile.goto(`${BASE}/art-directions`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));
  await mobile.screenshot({ path: join(outDir, "mobile-full.png"), fullPage: true });
  const mobileOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check("no horizontal overflow at 390", mobileOverflow <= 1, `delta ${mobileOverflow}px`);

  // Reduced motion — static frames, content fully visible.
  const reduced = await browser.newPage();
  await reduced.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await reduced.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await reduced.goto(`${BASE}/art-directions`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));
  const reducedSections = await reduced.$$(".art-variant-section");
  if (reducedSections[0]) {
    await reducedSections[0].screenshot({ path: join(outDir, "variant-a-reduced-motion.png") });
  }

  check("zero console/page errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await browser.close();
  console.log(`shots: wrote ${outDir} (${failures} failures)`);
  process.exit(failures === 0 ? 0 : 1);
} finally {
  server.kill("SIGTERM");
}

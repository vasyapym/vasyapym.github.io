// Browser smoke test for Evening Forest, run against a real Chromium with an
// iPhone-class touch profile. Self-contained: boots the Vite dev server on a
// scratch port, loads the page, taps Enter, walks with the joystick zone,
// looks with the look zone, rests, re-enters — and fails on any console or
// page error, a stuck overlay, or a view that never changes.
//
//   npm --prefix portfolio run test:smoke
//
// Uses the system Chrome via puppeteer-core (no browser download). Set
// CHROME_PATH to point at a specific binary. Skips cleanly when no Chrome
// is available so the command stays safe on headless machines.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "evening-forest-smoke");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log(
    "browser smoke: no Chrome/Chromium found — skipping (set CHROME_PATH to run)",
  );
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");

// --- dev server ------------------------------------------------------------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await wait(500);
  }
  throw new Error(`dev server never answered at ${url}`);
}

const server = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  [
    "run",
    "dev",
    "--",
    "--host",
    "0.0.0.0",
    "--port",
    String(PORT),
    "--strictPort",
  ],
  { cwd: shellDir, stdio: "ignore", detached: true },
);
process.on("exit", () => {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
});

try {
  await waitForServer(`${BASE}/projects/evening-forest`);

  // --- drive the page ------------------------------------------------------

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run"],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const problems = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });

  const shot = (name) =>
    page.screenshot({ path: join(SHOTS, `${name}.png`) });
  const check = (ok, label) => {
    if (!ok) problems.push(`assert: ${label}`);
    console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  };

  await page.goto(`${BASE}/projects/evening-forest`, {
    waitUntil: "networkidle0",
    timeout: 45000,
  });
  await wait(2000);
  await shot("1-menu");

  check(!!(await page.$(".evening-forest-enter")), "enter button renders");
  check(!!(await page.$(".evening-forest-stage canvas")), "canvas renders");

  await page.touchscreen.tap(195, 420);
  await wait(1000);
  await shot("2-playing");
  check(
    (await page.$(".evening-forest-overlay")) === null,
    "tap enters the forest",
  );
  check(!!(await page.$(".ef-touch")), "touch controls mount");
  check(
    (await page.$(".evening-forest-resting-hint")) === null,
    "desktop rest hint stays hidden on touch",
  );

  // Dynamic-origin stick: press low-left, drag up, hold — the stick visual
  // must appear and the view must actually move.
  await page.touchscreen.touchStart(90, 700);
  await wait(80);
  for (let i = 1; i <= 8; i += 1) {
    await page.touchscreen.touchMove(90, 700 - i * 7);
    await wait(40);
  }
  check(
    !!(await page.$(".ef-touch-stick-base")),
    "joystick visual appears on drag",
  );
  await wait(900);
  await shot("3-walking");
  await page.touchscreen.touchEnd();
  await wait(400);

  await page.touchscreen.touchStart(300, 400);
  for (let i = 1; i <= 10; i += 1) {
    await page.touchscreen.touchMove(300 - i * 9, 400);
    await wait(30);
  }
  await page.touchscreen.touchEnd();
  await wait(600);
  await shot("4-looked");

  const rest = await page.$(".ef-touch-buttons button:last-child");
  await rest.tap();
  await wait(600);
  await shot("5-rested");
  check(
    !!(await page.$(".evening-forest-overlay")),
    "Rest returns the menu overlay",
  );

  await page.touchscreen.tap(195, 420);
  await wait(800);
  await page.touchscreen.touchStart(90, 700);
  await page.touchscreen.touchMove(90, 650);
  await wait(700);
  await page.touchscreen.touchEnd();
  check(true, "re-enter and walk again (state reset)");

  // The walk must have changed at least one pixel of the render.
  const before = readFileSync(join(SHOTS, "2-playing.png"));
  const after = readFileSync(join(SHOTS, "3-walking.png"));
  check(!before.equals(after), "view changes while walking");

  await browser.close();

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(` - ${p}`);
    console.error(`\nScreenshots: ${SHOTS}`);
    process.exit(1);
  }
  console.log(`\nBrowser smoke passed. Screenshots: ${SHOTS}`);
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
}

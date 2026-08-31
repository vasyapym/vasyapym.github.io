// Visual probe for Hello Kitty Run: boots the Vite dev server on a scratch
// port, seeds a stored best-run replay into localStorage so the echo is on
// stage, then photographs the run at desktop and phone sizes.
//
//   node portfolio/projects/kitty-run/tests/kitty-run.shots.mjs
//
// Uses the system Chrome/Edge via puppeteer-core (no browser download).
// Set CHROME_PATH to point at a specific binary; skips cleanly when no
// browser is available.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5217;
// Vite binds "localhost" (IPv6 ::1 on many Windows boxes), so the probe
// must use the same name rather than 127.0.0.1.
const BASE = `http://localhost:${PORT}`;
const SHOTS = join(tmpdir(), "kitty-run-shots");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("shots: no Chrome/Chromium found — skipping (set CHROME_PATH)");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");

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

// Windows refuses to spawn .cmd shims without a shell, so boot Vite's JS
// entry with the current Node binary directly.
const viteJs = resolve(here, "../../../node_modules/vite/bin/vite.js");
const server = spawn(
  process.execPath,
  [viteJs, "--port", String(PORT), "--strictPort"],
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
  await waitForServer(`${BASE}/projects/kitty-run`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run", "--use-gl=angle"],
  });

  // A tiny but well-formed best-run replay: two jumps in the first seconds.
  // The echo reuses its seed, launches once the player opens the four-and-
  // a-half-metre lead, and stays pinned inside the visible band from there.
  const seedEcho = async (page) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "kitty-run.replay.v3",
        JSON.stringify({
          seed: "kitty-run/run/probe/1",
          score: 900,
          distance: 1200,
          skill: 0.5,
          inputs: [
            { t: 0.8, kind: "jump" },
            { t: 1.1, kind: "release" },
            { t: 2.4, kind: "jump" },
            { t: 2.7, kind: "release" },
            { t: 4.0, kind: "dash" },
          ],
        }),
      );
    });
  };

  const problems = [];

  async function runViewport(name, viewport, withBullet = false) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    page.on("pageerror", (err) => problems.push(`[${name}] pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      // Headless Chrome blocks navigator.vibrate before any user gesture —
      // the haptics module fires on game events, which is expected here.
      if (msg.text().includes("navigator.vibrate")) return;
      problems.push(`[${name}] console.error: ${msg.text()}`);
    });
    await page.goto(`${BASE}/projects/kitty-run`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    // localStorage exists only once a document with an origin is loaded,
    // so seed after the first paint and re-enter with autostart.
    await seedEcho(page);
    await page.goto(`${BASE}/projects/kitty-run?autostart`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await wait(1500);
    await page.screenshot({ path: join(SHOTS, `${name}-start.png`) });
    // Give the run long enough to pass the echo launch gate and settle.
    await wait(7000);
    await page.screenshot({ path: join(SHOTS, `${name}-running.png`) });
    if (withBullet) {
      // Fire a dash and photograph the bullet-time stretch: vignette up,
      // speed lines flying, FOV pushed wide.
      await page.keyboard.press("Shift");
      await wait(120);
      await page.screenshot({ path: join(SHOTS, `${name}-bullettime.png`) });
      const bulletOpacity = await page.$eval(".kitty-run-bullet", (el) => el.style.opacity);
      if (Number(bulletOpacity) <= 0.05) {
        problems.push(`[${name}] bullet vignette never bloomed (opacity ${bulletOpacity})`);
      }
    }
    const canvas = await page.$(".kitty-run-stage canvas");
    if (!canvas) problems.push(`[${name}] no stage canvas`);
    await page.close();
    console.log(`ok   ${name} shots captured`);
  }

  await runViewport("desktop", {
    width: 1440,
    height: 810,
    deviceScaleFactor: 1,
  }, true);
  await runViewport("mobile", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // The ready card is a visitor's very first impression — photograph it
  // without autostart, on both stages: the desktop card parks in the
  // run-ahead space; the phone card centres with the autopilot invitation.
  async function menuShot(name, viewport) {
    const menuPage = await browser.newPage();
    await menuPage.setViewport(viewport);
    menuPage.on("pageerror", (err) => problems.push(`[menu-${name}] pageerror: ${err.message}`));
    await menuPage.goto(`${BASE}/projects/kitty-run`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    // Seed after first paint (localStorage needs an origin), then reload so
    // the ready card renders with the echo line in place.
    await seedEcho(menuPage);
    await menuPage.reload({ waitUntil: "networkidle0", timeout: 45000 });
    await wait(1500);
    await menuPage.screenshot({ path: join(SHOTS, `${name}-menu.png`) });
    await menuPage.close();
    console.log(`ok   ${name} menu shot captured`);
  }

  await menuShot("desktop", { width: 1440, height: 810, deviceScaleFactor: 1 });
  await menuShot("mobile", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // The autopilot exhibition: the lookahead pilot drives from launch. The
  // probe asserts the takeover chip exists and photographs the bot mid-run.
  const autoPage = await browser.newPage();
  await autoPage.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1 });
  autoPage.on("pageerror", (err) => problems.push(`[auto] pageerror: ${err.message}`));
  await autoPage.goto(`${BASE}/projects/kitty-run`, {
    waitUntil: "networkidle0",
    timeout: 45000,
  });
  await seedEcho(autoPage);
  await autoPage.goto(`${BASE}/projects/kitty-run?autopilot`, {
    waitUntil: "networkidle0",
    timeout: 45000,
  });
  await wait(7000);
  if (!(await autoPage.$(".kitty-run-pilotchip"))) {
    problems.push("[auto] autopilot chip missing while the bot drives");
  }
  const autoScore = await autoPage.$eval(".kitty-run-score", (el) => el.textContent);
  if (!autoScore || Number(autoScore) <= 0) {
    problems.push(`[auto] bot scored nothing: "${autoScore}"`);
  }
  await autoPage.screenshot({ path: join(SHOTS, `desktop-autopilot.png`) });
  await autoPage.close();
  console.log("ok   autopilot shot captured");

  // The sound path: clicking start is the user gesture that creates the
  // AudioContext, the sfx and the adaptive soundtrack. Run a few seconds
  // with sound on, pause and resume (the music must fade out and back),
  // then assert the whole thing stayed error-free.
  const soundPage = await browser.newPage();
  await soundPage.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1 });
  soundPage.on("pageerror", (err) => problems.push(`[sound] pageerror: ${err.message}`));
  soundPage.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("navigator.vibrate")) {
      problems.push(`[sound] console.error: ${msg.text()}`);
    }
  });
  await soundPage.goto(`${BASE}/projects/kitty-run`, {
    waitUntil: "networkidle0",
    timeout: 45000,
  });
  await soundPage.click(".kitty-run-card--ready");
  await wait(3000);
  await soundPage.keyboard.press("KeyP");
  await wait(600);
  await soundPage.keyboard.press("KeyP");
  await wait(1200);
  const soundScore = await soundPage.$eval(".kitty-run-score", (el) => el.textContent);
  if (!soundScore || Number(soundScore) <= 0) {
    problems.push(`[sound] run made no progress: "${soundScore}"`);
  }
  await soundPage.screenshot({ path: join(SHOTS, `desktop-sound.png`) });
  await soundPage.close();
  console.log("ok   sound shot captured");

  await browser.close();

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(` - ${p}`);
    console.error(`\nScreenshots: ${SHOTS}`);
    process.exit(1);
  }
  console.log(`\nShots captured. Screenshots: ${SHOTS}`);
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
}

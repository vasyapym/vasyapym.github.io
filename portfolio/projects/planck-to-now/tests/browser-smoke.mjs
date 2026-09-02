// Browser smoke test for Planck to Now, run against a real Chromium.
// Self-contained: boots the Vite dev server of the shell on a scratch port,
// loads the standalone simulation, and verifies the GPGPU path, the static
// fallback, the timeline scrub, and the field poke — failing on any console
// or page error, a dead render loop, or a stuck HUD.
//
//   npm run test:smoke
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
const PORT = 5207;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "planck-to-now-smoke");
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

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npmArgs = ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(PORT), "--strictPort"];
const spawnCmd = process.env.npm_execpath ? process.execPath : npm;
const spawnArgs = process.env.npm_execpath
  ? [process.env.npm_execpath, ...npmArgs]
  : npmArgs;
const server = spawn(spawnCmd, spawnArgs, {
  cwd: shellDir,
  stdio: "ignore",
  detached: true,
});
process.on("exit", () => {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
});

try {
  await waitForServer(`${BASE}/planck-to-now/`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const problems = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });

  const shot = (name) => page.screenshot({ path: join(SHOTS, `${name}.png`) });
  const check = (ok, label) => {
    if (!ok) problems.push(`assert: ${label}`);
    console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  };

  // --- gpgpu path -----------------------------------------------------------

  await page.goto(`${BASE}/planck-to-now/?t=17`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await wait(2500);
  await shot("1-present-gpgpu");

  const mode = await page.evaluate(() => window.__p2n_mode);
  check(mode === "gpgpu", `gpgpu path active (got ${mode})`);

  const techline = await page.evaluate(
    () => document.getElementById("techline").textContent,
  );
  check(techline.includes("gpgpu"), "techline names the gpgpu solver");

  const fps = await page.evaluate(() =>
    Number(document.getElementById("fps").textContent),
  );
  check(Number.isFinite(fps) && fps >= 20, `render loop alive at ${fps} fps`);

  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector("#app canvas");
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  check(
    canvasBox !== null && canvasBox.w > 100 && canvasBox.h > 100,
    "webgl canvas fills the page",
  );

  // The simulation must keep repainting while playing.
  await shot("frame-a");
  await wait(900);
  await shot("frame-b");
  const a = readFileSync(join(SHOTS, "frame-a.png"));
  const b = readFileSync(join(SHOTS, "frame-b.png"));
  check(!a.equals(b), "frame changes while playing");

  // Poke the field — the click must not throw and must perturb the render.
  await page.mouse.click(700, 450);
  await wait(350);
  await shot("frame-c");
  const c = readFileSync(join(SHOTS, "frame-c.png"));
  check(!b.equals(c), "poke perturbs the field");

  // Scrub the timeline — the epoch HUD must follow.
  const epochBefore = await page.evaluate(
    () => document.getElementById("epoch").textContent,
  );
  const tl = await page.evaluate(() => {
    const r = document.getElementById("timeline").getBoundingClientRect();
    return { x: r.x, y: r.y + r.height / 2, w: r.width };
  });
  await page.mouse.move(tl.x + tl.w * 0.1, tl.y);
  await page.mouse.down();
  await page.mouse.move(tl.x + tl.w * 0.55, tl.y, { steps: 12 });
  await page.mouse.up();
  await wait(600);
  const epochAfter = await page.evaluate(
    () => document.getElementById("epoch").textContent,
  );
  check(
    epochBefore !== epochAfter,
    `scrub moves the epoch (${epochBefore} → ${epochAfter})`,
  );
  await shot("2-scrubbed");

  // Restart key reseeds without errors.
  await page.keyboard.press("KeyR");
  await wait(800);
  check(true, "restart key handled");

  // --- static fallback ------------------------------------------------------

  await page.goto(`${BASE}/planck-to-now/?static=1&t=6`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await wait(1500);
  await shot("3-static-fallback");

  const staticMode = await page.evaluate(() => window.__p2n_mode);
  check(staticMode === "static", `static fallback active (got ${staticMode})`);
  const staticTech = await page.evaluate(
    () => document.getElementById("techline").textContent,
  );
  check(staticTech.includes("static"), "techline names the static buffers");

  // --- mobile viewport ------------------------------------------------------

  // Release the desktop page's WebGL context first: headless SwiftShader
  // struggles to host two live contexts in one browser.
  await page.close();

  const mobile = await browser.newPage();
  await mobile.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (err) => problems.push(`mobile pageerror: ${err.message}`));
  mobile.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`mobile console.error: ${msg.text()}`);
  });

  await mobile.goto(`${BASE}/planck-to-now/`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await wait(2500);
  await mobile.screenshot({ path: join(SHOTS, "4-mobile.png") });
  const mobileMode = await mobile.evaluate(() => window.__p2n_mode);
  check(mobileMode === "gpgpu", `mobile runs the gpgpu path (got ${mobileMode})`);
  await mobile.touchscreen.tap(195, 420);
  await wait(500);
  check(true, "mobile poke handled");

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

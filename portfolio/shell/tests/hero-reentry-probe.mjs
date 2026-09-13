// bug-iteration reproduction probe: hero transition broken after realm exit.
//
// Reported: exit realm/deep mode, scroll up quickly to the hero — the hero
// appears abruptly with no transition instead of the darkening + smooth
// reappearance the scroll-driven --hero-exit law produces.
//
// Law under test: after the realm closes, with the viewport restored below
// the hero, --hero-exit must be ≈1 (hero invisible), and a scroll back up
// must interpolate --hero-exit (opacity = 1 − exit) instead of jumping.
//
//   CHROME_PATH=<bin> node portfolio/shell/tests/hero-reentry-probe.mjs
//
// Same harness as realm-probe.mjs: puppeteer-core + a local Chrome binary,
// skips cleanly when no browser is available.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const PORT = 5221;
const BASE = `http://localhost:${PORT}`;
mkdirSync(join(tmpdir(), "hero-reentry-probe"), { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("hero-reentry-probe: no Chrome/Chromium found — skipping (set CHROME_PATH)");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");

const viteJs = resolve(shellDir, "../node_modules/vite/bin/vite.js");
const server = spawn(
  process.execPath,
  [viteJs, "--port", String(PORT), "--strictPort"],
  { cwd: shellDir, stdio: ["ignore", "pipe", "pipe"] },
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const open = async (page) => {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 150000 });
  await page.waitForFunction(
    () => document.querySelector(".realm-threshold") !== null,
    { timeout: 60000, polling: 250 },
  );
  await wait(800);
};

const until = async (page, fn, ms = 2500) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await page.evaluate(fn)) return true; } catch {}
    await wait(100);
  }
  return false;
};

let failures = 0;
const check = (name, ok, detail = "") => {
  const tag = ok ? "PASS" : "FAIL";
  if (!ok) failures += 1;
  console.log(`${tag}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const enterRealm = async (page) => {
  await page.evaluate(() => {
    const t = document.querySelector(".realm-threshold");
    const bottom = t
      ? Math.ceil(t.getBoundingClientRect().bottom + window.scrollY)
      : window.scrollY;
    window.scrollTo({ top: bottom + 80, behavior: "instant" });
  });
  await until(page, () => {
    const el = document.querySelector(".realm-enter-chip");
    return !!el && el.classList.contains("is-visible") && !el.disabled;
  });
  const at = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    document.querySelector(".realm-enter-chip")?.click();
  });
  await wait(1700);
  return at;
};

const exitViaButton = async (page) => {
  await page.evaluate(() => {
    document.querySelector(".realm-btn--leave")?.click();
  });
};

// Run the core assertions after any exit path has settled.
const assertReentryLaw = async (page, label, enteredAt) => {
  // Diagnostic: where does the viewport actually sit after the close, and
  // does anything move it during the settle window (focus rescue etc.)?
  const trace = await page.evaluate(async () => {
    const marks = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 1200) {
      marks.push({ t: Math.round(performance.now() - t0), y: window.scrollY });
      await new Promise((r) => setTimeout(r, 100));
    }
    return marks;
  });
  const yFinal = trace[trace.length - 1].y;
  console.log(
    `${label}: scrollY trace after close — entered=${enteredAt} ` +
    `marks=${trace.map((m) => `${m.t}:${m.y}`).join(" ")}`,
  );

  const post = await page.evaluate(() => {
    const hero = document.querySelector(".signal-index-hero-fluid");
    return {
      scrollY: window.scrollY,
      computed: getComputedStyle(hero).getPropertyValue("--hero-exit").trim(),
      opacity: getComputedStyle(hero).opacity,
      span: hero.offsetHeight * 0.9,
    };
  });
  // THE LAW: below the hero the exit ratio is clamped to 1 — the hero must be
  // invisible until the scroll-up carries it back through its fade range.
  const expectedExit = Math.min(1, post.scrollY / post.span);
  check(`${label}: hero-exit re-armed to 1 at the restored offset`,
    Math.abs(parseFloat(post.computed || "0") - expectedExit) < 0.02,
    `scrollY=${post.scrollY} computed=${post.computed || "(unset)"} expected=${expectedExit.toFixed(4)} opacity=${post.opacity}`);

  // Fast flick back up: 12 instant steps over the whole offset, double-rAF
  // settling per step so the page's rAF-driven update loop reacts first.
  await page.evaluate(async () => {
    const hero = document.querySelector(".signal-index-hero-fluid");
    const span = hero.offsetHeight * 0.9;
    const start = window.scrollY;
    const samples = [];
    const steps = 12;
    for (let i = 1; i <= steps; i += 1) {
      const y = Math.max(0, Math.round(start * (1 - i / steps)));
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      samples.push({
        y: window.scrollY,
        exit: Number.parseFloat(
          getComputedStyle(hero).getPropertyValue("--hero-exit").trim() || "0",
        ),
        opacity: Number.parseFloat(getComputedStyle(hero).opacity),
      });
    }
    window.__heroSamples = samples;
    window.__heroSpan = span;
  });

  const law = await page.evaluate(() => {
    const span = window.__heroSpan;
    const samples = window.__heroSamples;
    let worst = 0;
    let worstAt = null;
    for (const s of samples) {
      const expected = Math.min(1, Math.max(0, s.y / span));
      const delta = Math.abs(s.exit - expected);
      if (delta > worst) { worst = delta; worstAt = s; }
    }
    const transitioning = samples.filter(
      (s) => s.exit > 0.05 && s.exit < 0.95,
    ).length;
    return { worst, worstAt, transitioning };
  });
  check(`${label}: scroll-up interpolates --hero-exit (no abrupt pop)`,
    law.worst < 0.08 && law.transitioning >= 2,
    `worstDelta=${law.worst.toFixed(3)} at y=${law.worstAt?.y} transitioningSamples=${law.transitioning}`);
};

try {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath,
    headless: "shell",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await open(page);

  // ── scenario 1: normal surface exit ──
  const enteredAt = await enterRealm(page);
  check("surface: realm opened", await until(page, () =>
    document.querySelector(".realm-layer") !== null, 3000));

  await exitViaButton(page);
  check("surface: realm closed", await until(page, () =>
    document.querySelector(".realm-layer") === null, 8000));
  await wait(600); // settle: focus rescue window + effect re-arm

  await assertReentryLaw(page, "surface", enteredAt);

  // ── scenario 2: deep-return exit (r11/r12: dive → project → back → exit) ──
  const deep = await browser.newPage();
  await deep.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await open(deep);
  const deepEnteredAt = await enterRealm(deep);
  check("deep: realm opened", await until(deep, () =>
    document.querySelector(".realm-layer") !== null, 3000));

  await deep.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  await deep.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  check("deep: dive hands off to the project page",
    await until(deep, () => window.location.pathname.includes("projects"), 5000));
  await deep.evaluate(() => document.querySelector(".back-link")?.click());
  check("deep: in-page back restores the realm over the project",
    await until(deep, () =>
      document.querySelector(".realm-layer") !== null &&
      document.querySelector(".project-frame") !== null, 6000));
  await wait(1700); // the re-entry flood reaches the active phase
  check("deep: opaque settlement resolves root beneath the same realm",
    await until(deep, () =>
      window.location.pathname === "/" &&
      document.querySelectorAll(".realm-layer").length === 1, 6000));

  await exitViaButton(deep);
  check("deep: realm closed", await until(deep, () =>
    document.querySelector(".realm-layer") === null, 8000));
  await wait(600);

  await assertReentryLaw(deep, "deep", deepEnteredAt);

  await browser.close();
  console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("probe crashed:", err);
  process.exitCode = 1;
} finally {
  server.kill("SIGKILL");
}

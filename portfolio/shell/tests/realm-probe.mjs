// Behavioural probe for the realm ("the deep"): boots the Vite dev server,
// then walks the opt-in layer end to end in headless Chrome — enter flood,
// canvas presence, animation liveness, legend a11y (including the
// focused-button Enter rule), esc chain, scroll restoration, dive→SPA
// handoff, mobile viewport hygiene and reduced motion.
//
//   node portfolio/shell/tests/realm-probe.mjs [outDir]
//
// Same harness as landing-shots.mjs: puppeteer-core + system Chrome, skips
// cleanly when no browser is available.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const PORT = 5219;
const BASE = `http://localhost:${PORT}`;
const outDir = process.argv[2] || join(tmpdir(), "realm-probe");
mkdirSync(outDir, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("realm-probe: no Chrome/Chromium found — skipping (set CHROME_PATH)");
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

// poll until fn() is truthy (page.evaluate wrapper) — immune to commit/anim timing
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

const collectErrors = (page) => {
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") page.errors.push(m.text());
  });
};

const enterRealm = async (page) => {
  await page.evaluate(() => {
    const chip = document.querySelector(".realm-enter-chip");
    chip?.click();
  });
  await wait(1700); // flood ≈1.05s + settle
};

const exitViaButton = async (page) => {
  await page.evaluate(() => {
    const leave = document.querySelector(".realm-btn--leave");
    leave?.click();
  });
  await wait(1300); // leave script 0.9s + unmount
};

try {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath,
    headless: "shell",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  // ── desktop: enter, liveness, legend a11y, esc chain, restore ──
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(desktop);
  await desktop.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  // chip law: desktop = visible from first render, never scroll-gated, never
  // hidden at page end (the old band inverted on tall viewports — 2560x1440
  // never showed the chip at all); mobile = one-shot reveal past
  // min(0.4·vh, 320px), then it stays.
  await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(400);
  check("chip visible at scroll 0 on desktop",
    await desktop.$eval(".realm-enter-chip", (el) =>
      window.scrollY === 0 && el.classList.contains("is-visible")));
  await desktop.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
  await wait(400);
  check("chip revealed past the hero",
    await desktop.$eval(".realm-enter-chip", (el) => el.classList.contains("is-visible")));

  // regression page: tall desktop (the reported-Edge case) + page end + mobile
  const regression = await browser.newPage();
  {
    await regression.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1 });
    await regression.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
    await regression.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await wait(400);
    check("chip visible at scroll 0 on 2560x1440",
      await regression.$eval(".realm-enter-chip", (el) =>
        window.innerWidth === 2560 && window.innerHeight === 1440 &&
        window.scrollY === 0 && el.classList.contains("is-visible")));
    await regression.evaluate(() => window.scrollTo({
      top: document.documentElement.scrollHeight - window.innerHeight,
      behavior: "instant",
    }));
    await wait(400);
    check("chip remains visible at desktop page end",
      await regression.$eval(".realm-enter-chip", (el) =>
        Math.abs(window.scrollY - Math.max(0,
          document.documentElement.scrollHeight - window.innerHeight)) <= 1 &&
        el.classList.contains("is-visible")));

    // fresh page for the mobile leg: reloading the scrolled desktop page lets
    // scroll restoration (>320px) fire the one-shot reveal before we can reset
    await regression.close();
    const mobileReg = await browser.newPage();
    await mobileReg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true });
    await mobileReg.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
    await mobileReg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await wait(400);
    check("mobile chip hidden at scroll 0 on 390x844",
      await mobileReg.$eval(".realm-enter-chip", (el) =>
        window.innerWidth === 390 && window.innerHeight === 844 &&
        window.scrollY === 0 && !el.classList.contains("is-visible")));
    await mobileReg.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
    await wait(400);
    check("mobile chip revealed at scroll 400",
      await mobileReg.$eval(".realm-enter-chip", (el) =>
        Math.abs(window.scrollY - 400) <= 1 && el.classList.contains("is-visible")));
    await mobileReg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await wait(400);
    check("mobile chip stays visible after returning to scroll 0",
      await mobileReg.$eval(".realm-enter-chip", (el) =>
        window.scrollY === 0 && el.classList.contains("is-visible")));
    await mobileReg.close();
  }

  await enterRealm(desktop);
  check("realm opens over the landing", await desktop.$(".realm-layer") !== null);
  check("gl + overlay canvases present",
    (await desktop.$$(".realm-layer canvas")).length === 2);
  check("legend has 7 door buttons",
    (await desktop.$$(".realm-legend-btn")).length === 7);
  check("caption names the technique",
    await desktop.$eval(".realm-layer .realm-caption", (el) => /the deep/.test(el.textContent)));

  // liveness: two frames ~800ms apart must differ (fluid/snow/creatures move)
  const a = Buffer.from(await desktop.screenshot());
  await wait(800);
  const b = Buffer.from(await desktop.screenshot());
  check("scene animates (frame delta)", !a.equals(b));

  // focused legend button + Enter must open THAT project (native click wins)
  await desktop.evaluate(() => {
    const btn = document.querySelectorAll(".realm-legend-btn")[2]; // explosion
    btn.focus();
  });
  await desktop.keyboard.press("Enter");
  await wait(500);
  check("focused legend button Enter opens its own panel",
    await desktop.$eval(".realm-panel-title", (el) => el.textContent.includes("Explosion"), { timeout: 2000 }).catch(() => false));

  await desktop.screenshot({ path: join(outDir, "desktop-panel.png") });
  await desktop.keyboard.press("Escape"); // panel → layer
  await wait(300);
  check("esc closes the panel", (await desktop.$(".realm-panel")) === null);
  await desktop.keyboard.press("Escape"); // layer → landing
  await wait(1300);
  check("esc exits the realm", (await desktop.$(".realm-layer")) === null);
  const scrollAfter = await desktop.evaluate(() => window.scrollY);
  check("landing scroll restored", Math.abs(scrollAfter - 1250) < 30, `scrollY=${scrollAfter}`);
  check("chip is back", await desktop.evaluate(() =>
    document.querySelector(".realm-enter-chip") !== null));

  // ── desktop: canvas tap = select (opens the tapped creature's panel) ──
  const dive = await browser.newPage();
  await dive.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(dive);
  await dive.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await dive.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
  await wait(400);
  await enterRealm(dive);
  await dive.mouse.move(360, 468); // creature 0 anchor: (0.25·vw, 0.26·2vh) at zoom 1, cam 0
  await wait(600); // settle: hover before the tap, past any entering-frame under load
  await dive.mouse.down();
  await dive.mouse.up();
  check("canvas tap-select opens the tapped creature's panel",
    await until(dive, () =>
      document.querySelector(".realm-panel-title")?.textContent.trim().toLowerCase() ===
      document.querySelector(".realm-legend-btn")?.textContent.split("—").pop().trim().toLowerCase()));
  await dive.keyboard.press("Escape");
  await wait(300);
  check("esc closes the tap-opened panel", (await dive.$(".realm-panel")) === null);

  // ── desktop: dive → SPA handoff ──
  await dive.click(".realm-legend-btn:nth-child(3)"); // explosion
  await wait(400);
  await dive.click(".realm-panel-dive");
  await wait(350);
  check("iris closes during the dive", await dive.$(".realm-iris") !== null);
  await wait(1100); // dive commits at ~1.0s
  check("dive hands off to the project page",
    await dive.evaluate(() => window.location.pathname.includes("explosion")));

  // ── mobile: viewport hygiene ──
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true });
  collectErrors(mobile);
  await mobile.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await mobile.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
  await wait(400);
  await enterRealm(mobile);
  const overflow = await mobile.evaluate(() =>
    document.scrollingElement.scrollWidth - window.innerWidth);
  check("no horizontal overflow at 390px", overflow <= 0, `overflow=${overflow}px`);
  check("mobile legend strip reachable", await mobile.$(".realm-legend-btn") !== null);

  // first tap on a creature must open the BOTTOM-SHEET panel (item 8: it used to
  // only surface a mid-screen canvas label; the sheet must come on tap one)
  await mobile.touchscreen.touchStart(98, 439); // creature 0 anchor at 390×844
  await mobile.touchscreen.touchEnd();
  check("mobile first tap opens the bottom-sheet panel",
    await until(mobile, () => {
      const el = document.querySelector(".realm-panel");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return Math.abs(r.bottom - window.innerHeight) < 4 &&
        r.top > window.innerHeight * 0.5; // top edge sits in the lower half
    }));
  await mobile.screenshot({ path: join(outDir, "mobile-realm.png") });

  // ── reduced motion: opens, works, exits ──
  const reduced = await browser.newPage();
  await reduced.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await reduced.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  collectErrors(reduced);
  await reduced.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await reduced.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
  await wait(400);
  await enterRealm(reduced);
  check("reduced: realm opens with the reduced class",
    await reduced.$eval(".realm-layer", (el) => el.className.includes("realm-reduced")));
  check("reduced: legend intact",
    (await reduced.$$(".realm-legend-btn")).length === 7);
  await exitViaButton(reduced);
  check("reduced: leave restores the landing", (await reduced.$(".realm-layer")) === null);

  for (const p of [desktop, dive, mobile, reduced]) {
    check(`console clean (${p.errors.length} errors)`, p.errors.length === 0,
      p.errors.slice(0, 2).join(" | "));
  }

  await browser.close();
  console.log(failures === 0 ? "realm-probe: all checks passed" : `realm-probe: ${failures} FAILURES`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  server.kill("SIGTERM");
}

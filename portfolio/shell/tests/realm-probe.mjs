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

// open the landing: domcontentloaded + wait for the app to mount. networkidle0
// never settles under heavy machine load (SwiftShader renders starve the
// 500ms idle window), so navigation is gated on the mounted section instead.
const open = async (page, url = BASE) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 150000 });
  await page.waitForFunction(
    () => document.querySelector(".realm-threshold") !== null,
    { timeout: 60000, polling: 250 },
  );
  await wait(800); // settle: reveal callbacks, chip mount
};

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
  // scroll past the in-flow threshold section, await the strip, then click it
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
  // read the entry scroll position BEFORE the click locks the body (a fixed
  // body collapses document scroll geometry to zero)
  const at = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    document.querySelector(".realm-enter-chip")?.click();
  });
  await wait(1700); // flood ≈1.05s + settle
  return at;
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
  await open(desktop);
  // strip law: one reversible rule on every viewport class. The fixed strip
  // appears when scroll passes the in-flow threshold section's bottom edge and
  // hides again when the visitor returns above it (measured positions — the
  // page gained a threshold section between hero and cards).
  const thresholdBottomOf = (p) => p.evaluate(() => {
    const t = document.querySelector(".realm-threshold");
    return t ? Math.ceil(t.getBoundingClientRect().bottom + window.scrollY) : 0;
  });
  const stripVisible = (p) => p.$eval(".realm-enter-chip", (el) =>
    el.classList.contains("is-visible") && !el.disabled);

  await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(400);
  const dT = await thresholdBottomOf(desktop);
  check("strip hidden at scroll 0 on desktop", !(await stripVisible(desktop)));
  // chip arrival law (r8 D1): is-visible must run the finite entrance
  // animation; reduced motion settles with none. Scroll into the band first.
  await desktop.evaluate((y) => window.scrollTo({ top: y + 2, behavior: "instant" }), dT);
  check("chip entrance animates on arrival",
    await until(desktop, () => {
      const el = document.querySelector(".realm-enter-chip");
      return !!el && getComputedStyle(el).animationName === "realm-chip-arrive";
    }, 2500));
  await desktop.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(400);
  await desktop.evaluate((y) => window.scrollTo({ top: y - 300, behavior: "instant" }), dT);
  await wait(400);
  check("strip hidden while the threshold bottom is still onscreen",
    !(await stripVisible(desktop)));
  await desktop.evaluate((y) => window.scrollTo({ top: y + 2, behavior: "instant" }), dT);
  check("strip appears past the threshold on desktop",
    await until(desktop, () =>
      document.querySelector(".realm-enter-chip")?.classList.contains("is-visible") === true &&
      !document.querySelector(".realm-enter-chip")?.disabled, 2500));
  const dFloor = await desktop.$eval(".realm-bottom-floor", (el) =>
    parseFloat(getComputedStyle(el).opacity));
  check("floor still near zero above page end", dFloor < 0.4, `floor=${dFloor}`);

  // regression page: tall desktop (the reported-Edge case) + page end +
  // scroll-back hide + mobile reversibility
  const regression = await browser.newPage();
  {
    await regression.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1 });
    await open(regression);
    await regression.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await wait(400);
    const rT = await thresholdBottomOf(regression);
    check("strip hidden at scroll 0 on 2560x1440", !(await stripVisible(regression)));
    await regression.evaluate((y) => window.scrollTo({
      top: y + 2,
      behavior: "instant",
    }), rT);
    check("strip appears past the threshold on 2560x1440",
      await until(regression, () =>
        document.querySelector(".realm-enter-chip")?.classList.contains("is-visible") === true &&
        !document.querySelector(".realm-enter-chip")?.disabled, 2500));
    await regression.evaluate(() => window.scrollTo({
      top: document.documentElement.scrollHeight - window.innerHeight,
      behavior: "instant",
    }));
    await wait(400);
    check("strip remains visible at desktop page end",
      await stripVisible(regression));
    check("floor ramps to full at page end",
      await regression.$eval(".realm-bottom-floor", (el) =>
        getComputedStyle(el).opacity) === "1");
    await regression.evaluate((y) => window.scrollTo({ top: y - 300, behavior: "instant" }), rT);
    check("strip hides again above the threshold boundary",
      await until(regression, () =>
        !(document.querySelector(".realm-enter-chip")?.classList.contains("is-visible") === true &&
          !document.querySelector(".realm-enter-chip")?.disabled), 2500));
    check("floor recedes away from page end",
      await until(regression, () =>
        parseFloat(getComputedStyle(document.querySelector(".realm-bottom-floor")).opacity) < 0.4, 2500));

    // fresh page for the mobile leg: reuse would inherit a revealed position
    await regression.close();
    const mobileReg = await browser.newPage();
    await mobileReg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true });
    await open(mobileReg);
    await mobileReg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await wait(400);
    const mT = await thresholdBottomOf(mobileReg);
    check("strip hidden at scroll 0 on 390x844", !(await stripVisible(mobileReg)));
    await mobileReg.evaluate((y) => window.scrollTo({ top: y + 2, behavior: "instant" }), mT);
    check("strip appears past the threshold on mobile",
      await until(mobileReg, () =>
        document.querySelector(".realm-enter-chip")?.classList.contains("is-visible") === true &&
        !document.querySelector(".realm-enter-chip")?.disabled, 2500));
    await mobileReg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await wait(400);
    check("strip hides again at scroll 0 on mobile", !(await stripVisible(mobileReg)));
    await mobileReg.close();
  }

  // ── the in-flow threshold section is its own entry ──
  const section = await browser.newPage();
  collectErrors(section);
  await section.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await open(section);
  await section.evaluate(() => {
    document.querySelector(".realm-threshold-enter")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await wait(500);
  await section.evaluate(() => document.querySelector(".realm-threshold-enter")?.click());
  await wait(1700);
  check("threshold section opens the realm", await section.$(".realm-layer") !== null);
  check("shell inert while immersed",
    await section.$eval(".signal-index-shell", (el) => el.inert === true));
  check("strip unavailable while immersed",
    await section.$eval(".realm-enter-chip", (el) =>
      el.disabled || !el.classList.contains("is-visible")));
  await section.keyboard.press("Escape");
  // the leave choreography (0.9s script + unmount) stretches past 1.3s under
  // software-GL load — poll the unmount instead of trusting a fixed wait
  check("esc exits from the section entry",
    await until(section, () => document.querySelector(".realm-layer") === null, 4000));
  check("focus returns to the section control",
    await until(section, () =>
      document.activeElement?.classList.contains("realm-threshold-enter") === true, 2000));
  await section.close();

  const enteredAt = await enterRealm(desktop);
  check("realm opens over the landing", await desktop.$(".realm-layer") !== null);
  check("gl + overlay canvases present",
    (await desktop.$$(".realm-layer canvas")).length === 2);
  check("legend has 7 door buttons",
    (await desktop.$$(".realm-legend-btn")).length === 7);
  check("caption names the technique",
    await desktop.$eval(".realm-layer .realm-caption", (el) => /the deep/.test(el.textContent)));

  // exit-tone law (r8 D1): the landing's tone variables must not be rewritten
  // while the realm is open. A resize mid-session (URL-bar collapse on iOS,
  // window resize on desktop) used to clobber --hero-exit to 0 through the
  // unguarded scroll effect; the guarded effect must keep the pre-open value.
  const heroExitBefore = await desktop.$eval(
    ".signal-index-hero-fluid",
    (el) => getComputedStyle(el).getPropertyValue("--hero-exit").trim(),
  );
  await desktop.setViewport({ width: 1440, height: 820, deviceScaleFactor: 1 });
  await wait(400);
  const heroExitAfterResize = await desktop.$eval(
    ".signal-index-hero-fluid",
    (el) => getComputedStyle(el).getPropertyValue("--hero-exit").trim(),
  );
  check("hero-exit frozen during the session",
    heroExitBefore !== "" && heroExitBefore === heroExitAfterResize,
    `${heroExitBefore} → ${heroExitAfterResize}`);
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await wait(400);

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
  // the panel wrapper is persistent since r5 pass D — closed = no .is-open
  check("esc closes the panel", (await desktop.$(".realm-panel.is-open")) === null);
  // r8 D2 close-button hygiene: the unconditionally-mounted close glyph must be
  // gone from the DOM once the panel is closed (the iOS paint bug's structural fix).
  check("closed panel leaves no close button in the DOM",
    (await desktop.$(".realm-panel .realm-panel-close")) === null);
  await desktop.keyboard.press("Escape"); // layer → landing
  check("esc exits the realm",
    await until(desktop, () => document.querySelector(".realm-layer") === null, 4000));
  const scrollAfter = await desktop.evaluate(() => window.scrollY);
  check("landing scroll restored", Math.abs(scrollAfter - enteredAt) < 30, `scrollY=${scrollAfter}`);
  check("chip is back", await desktop.evaluate(() =>
    document.querySelector(".realm-enter-chip") !== null));

  // ── desktop: canvas tap = select (opens the tapped creature's panel) ──
  const dive = await browser.newPage();
  await dive.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(dive);
  await open(dive);
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
  check("esc closes the tap-opened panel", (await dive.$(".realm-panel.is-open")) === null);

  // ── desktop: dive → SPA handoff ──
  await dive.click(".realm-legend-btn:nth-child(3)"); // explosion
  await wait(400);
  await dive.click(".realm-panel-dive");
  check("iris closes during the dive", await until(dive, () =>
    document.querySelector(".realm-iris") !== null, 2500));
  // the dive commits at ~1.0s after the panel action; poll under load
  check("dive hands off to the project page",
    await until(dive, () => window.location.pathname.includes("explosion"), 4000));

  // ── r8 D2: direct dive — qualified mouse pairing + bare-layer Enter ──
  const direct = await browser.newPage();
  await direct.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(direct);
  await open(direct);
  await enterRealm(direct);
  await direct.mouse.move(360, 468); // creature 0 anchor: (0.25·vw, 0.26·2vh)
  await wait(600);
  // single quick click still selects (selection timing unchanged)
  await direct.mouse.down();
  await direct.mouse.up();
  check("r8 d2: single quick click still selects",
    await until(direct, () => document.querySelector(".realm-panel-title") !== null, 2500));
  await wait(400); // the entrance settles; focus lands on the close button
  // the close button keeps its box while open: a real click must close the panel
  await direct.mouse.click(1408, 32); // close glyph center: right 1rem + 1rem half
  check("r8 d2: open panel's close button stays native (click closes)",
    await until(direct, () => {
      const el = document.querySelector(".realm-panel.is-open");
      return el === null;
    }, 2500));
  await wait(200);
  // double-click dive: two qualified quick releases on the same creature
  await direct.mouse.move(360, 468); // back on creature 0
  await wait(400); // hover settles; pair history reset by the close interaction
  await direct.mouse.down();
  await direct.mouse.up();
  await wait(120);
  await direct.mouse.down();
  await direct.mouse.up();
  check("r8 d2: double-click dives through confirmDive (iris)",
    await until(direct, () => document.querySelector(".realm-iris") !== null, 2500));
  check("r8 d2: double-click hands off to a project page",
    await until(direct, () =>
      window.location.pathname !== "/" &&
      window.location.pathname.includes("projects"), 5000));
  await direct.close();

  const directEnter = await browser.newPage();
  await directEnter.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(directEnter);
  await open(directEnter);
  await enterRealm(directEnter);
  await directEnter.keyboard.press("1"); // warp to creature 0; the lantern lands there
  check("r8 d2: nearest announced with the dive instruction",
    await until(directEnter, () => {
      const el = document.querySelector(".realm-aria");
      return !!el && /press enter to dive in/.test(el.textContent || "");
    }, 2500));
  await directEnter.keyboard.press("Enter"); // bare layer: dive into the nearest
  check("r8 d2: bare-layer Enter dives (iris)",
    await until(directEnter, () => document.querySelector(".realm-iris") !== null, 2500));
  check("r8 d2: bare-layer Enter hands off to a project page",
    await until(directEnter, () => window.location.pathname.includes("projects"), 5000));
  await directEnter.close();

  // ── mobile: viewport hygiene ──
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true });
  collectErrors(mobile);
  await open(mobile);
  await mobile.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
  await wait(400);
  await enterRealm(mobile);
  const overflow = await mobile.evaluate(() =>
    document.scrollingElement.scrollWidth - window.innerWidth);
  check("no horizontal overflow at 390px", overflow <= 0, `overflow=${overflow}px`);
  check("mobile legend strip reachable", await mobile.$(".realm-legend-btn") !== null);

  // r8 D2 touch law: a quick double-tap on empty canvas must never dive.
  await mobile.touchscreen.touchStart(98, 300);
  await mobile.touchscreen.touchEnd();
  await wait(120);
  await mobile.touchscreen.touchStart(98, 300);
  await mobile.touchscreen.touchEnd();
  await wait(700);
  check("r8 d2: touch double-tap never dives",
    (await mobile.$(".realm-iris")) === null &&
    (await mobile.evaluate(() => window.location.pathname)) === "/");
  await wait(200);

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
  await open(reduced);
  await reduced.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
  await wait(400);
  await enterRealm(reduced);
  check("reduced: realm opens with the reduced class",
    await reduced.$eval(".realm-layer", (el) => el.className.includes("realm-reduced")));
  check("reduced: legend intact",
    (await reduced.$$(".realm-legend-btn")).length === 7);
  await exitViaButton(reduced);
  check("reduced: leave restores the landing",
    await until(reduced, () => document.querySelector(".realm-layer") === null, 4000));
  // reduced-motion chip law (r8 D1): the entrance animation must be inert.
  await reduced.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(400);
  const rT = await thresholdBottomOf(reduced);
  await reduced.evaluate((y) => window.scrollTo({ top: y + 2, behavior: "instant" }), rT);
  check("reduced: chip settles without animation",
    await until(reduced, () => {
      const el = document.querySelector(".realm-enter-chip");
      return !!el && el.classList.contains("is-visible") &&
        getComputedStyle(el).animationName === "none";
    }, 2500));

  for (const p of [desktop, dive, mobile, section, reduced]) {
    check(`console clean (${p.errors.length} errors)`, p.errors.length === 0,
      p.errors.slice(0, 2).join(" | "));
  }

  await browser.close();
  console.log(failures === 0 ? "realm-probe: all checks passed" : `realm-probe: ${failures} FAILURES`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  server.kill("SIGTERM");
}

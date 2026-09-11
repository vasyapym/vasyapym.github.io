// Behavioural probe for the realm ("the deep"): boots the Vite dev server,
// then walks the opt-in layer end to end in headless Chrome — enter flood,
// canvas presence, animation liveness, legend a11y (including the
// focused-button Enter rule), esc chain, scroll restoration, dive→SPA
// handoff, the r11 deep-return intent with the r12 project-backed return
// (flood starts over the project page, root swap under the opaque cover),
// mobile viewport hygiene and reduced motion.
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

// r11/r12 law: the restored realm floods over the still-mounted project page.
// That state is transient (the root swap lands under the opaque cover), so a
// poll can miss it under load — a MutationObserver latches the sighting.
const armProjectBacked = (page) => page.evaluate(() => {
  window.__pbRecorder = { saw: false };
  const obs = new MutationObserver(() => {
    if (
      document.querySelector(".realm-layer") !== null &&
      document.querySelector(".project-frame") !== null &&
      document.querySelector(".signal-index") === null
    ) {
      window.__pbRecorder.saw = true;
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
});

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
  // r10 d1: the selection parks the lantern (scene hold), whatever path opened it
  check("r10 d1: legend Enter parks the lantern",
    await desktop.evaluate(() => {
      const g = window.__realmScene?.getLanternSnapshot?.();
      return !!g && g.held === true;
    }));

  await desktop.screenshot({ path: join(outDir, "desktop-panel.png") });
  await desktop.keyboard.press("Escape"); // panel → layer
  await wait(300);
  // the panel wrapper is persistent since r5 pass D — closed = no .is-open
  check("esc closes the panel", (await desktop.$(".realm-panel.is-open")) === null);
  // r8 D2 close-button hygiene: the unconditionally-mounted close glyph must be
  // gone from the DOM once the panel is closed (the iOS paint bug's structural fix).
  check("closed panel leaves no close button in the DOM",
    (await desktop.$(".realm-panel .realm-panel-close")) === null);
  // r10 d2: wheel ownership. Headless shell delivers WheelEvents but never
  // runs their default scroll, so a real page.mouse.wheel cannot gate the
  // scroll here; the handler's contract is asserted with cancelable wheels:
  // during the active session the handler cancels (breatheLight), during the
  // fade it must not cancel, leaving the default scroll to the (unlocked)
  // document. Real scrolling itself stays an owner-device check.
  const activeWheelCancelled = await desktop.evaluate(() => {
    const ev = new WheelEvent("wheel", {
      deltaY: 400, cancelable: true, bubbles: true,
    });
    window.dispatchEvent(ev);
    return ev.defaultPrevented === true;
  });
  check("r10 d2: wheel stays cancelled during the active session",
    activeWheelCancelled);
  // r10 d2: the tone freeze must hold through the scroll events the exit now
  // fires at leave start (the early unlock happens beneath the opaque veil).
  const heroExitAtLeave = await desktop.$eval(
    ".signal-index-hero-fluid",
    (el) => getComputedStyle(el).getPropertyValue("--hero-exit").trim(),
  );
  // r9 D1 staged teardown: the retirement must begin only at layer opacity 0.
  // The stage windows are shorter than a poll cadence, so a MutationObserver
  // records the invariants AT each stage transition instead.
  await desktop.evaluate(() => {
    window.__stages = [];
    const layer = document.querySelector(".realm-layer");
    if (!layer) return;
    const record = () => {
      const canvases = layer.querySelectorAll("canvas");
      window.__stages.push({
        stage: layer.dataset.realmExitStage ?? null,
        canvasesHidden: canvases.length > 0 && Array.from(canvases).every(
          (c) => getComputedStyle(c).display === "none"),
        bodyLocked: getComputedStyle(document.body).position === "fixed",
        shellInert: document.querySelector(".signal-index-shell")?.inert === true,
        opacity: getComputedStyle(layer).opacity,
      });
    };
    new MutationObserver(record).observe(layer, {
      attributes: true, attributeFilter: ["data-realm-exit-stage"],
    });
    record();
  });
  await desktop.keyboard.press("Escape"); // layer → landing
  // r10 d2 unlock-under-veil: the body must restore in the fade's FIRST frame —
  // the layer still covers the page (opacity > 0) when scrolling is released,
  // so the scrollbar-gutter reflow (the Edge lateral shift) is never visible.
  await desktop.evaluate(() => {
    window.__exitProbe = { scrollWhenUnlocked: null, opacityWhenUnlocked: null };
  });
  check("r10 d2: body unlocks at the leave start (unlocked while the exit veil still covers)",
    await until(desktop, () => {
      const layer = document.querySelector(".realm-layer");
      if (layer === null) return false;
      const locked = getComputedStyle(document.body).position === "fixed";
      if (!locked) {
        const probe = window.__exitProbe;
        if (probe.scrollWhenUnlocked === null) {
          probe.scrollWhenUnlocked = window.scrollY;
          probe.opacityWhenUnlocked =
            Number.parseFloat(getComputedStyle(layer).opacity);
        }
        return true;
      }
      return false;
    }, 4000));
  check("r10 d2: scroll exact at the unlock moment beneath an opaque veil",
    await desktop.evaluate((entered) => {
      const probe = window.__exitProbe;
      return probe.scrollWhenUnlocked !== null &&
        probe.opacityWhenUnlocked > 0 &&
        Math.abs(probe.scrollWhenUnlocked - entered) < 30;
    }, enteredAt));
  // r10 d2: wheel ownership (mid-fade half).
  const midFadeWheel = await desktop.evaluate(() => {
    const layer = document.querySelector(".realm-layer");
    if (layer === null) return false;
    const ev = new WheelEvent("wheel", {
      deltaY: 400, cancelable: true, bubbles: true,
    });
    window.dispatchEvent(ev);
    return ev.defaultPrevented === false;
  });
  check("r10 d2: wheel is no longer cancelled during the exit fade",
    midFadeWheel);
  check("r10 d2: hero-exit stays frozen through the early-unlock scroll",
    await desktop.evaluate((expected) =>
      getComputedStyle(document.querySelector(".signal-index-hero-fluid"))
        .getPropertyValue("--hero-exit").trim() === expected, heroExitAtLeave));
  check("esc exits the realm",
    await until(desktop, () => document.querySelector(".realm-layer") === null, 4000));
  check("r9 d1: retirement starts at opacity 0 with canvases hidden (body already unlocked, shell inert)",
    await desktop.evaluate(() => {
      const stages = window.__stages ?? [];
      const retired = stages.filter((s) => s.stage === "retired");
      return retired.length > 0 && retired.every((s) =>
        s.canvasesHidden && !s.bodyLocked && s.shellInert &&
        Number.parseFloat(s.opacity) === 0);
    }));
  check("r10 d2: exit staging has no unlocked stage (one retirement beat)",
    await desktop.evaluate(() =>
      (window.__stages ?? []).every((s) => s.stage !== "unlocked")));
  const scrollAfter = await desktop.evaluate(() => window.scrollY);
  check("landing scroll restored", Math.abs(scrollAfter - enteredAt) < 30, `scrollY=${scrollAfter}`);
  check("chip is back", await desktop.evaluate(() =>
    document.querySelector(".realm-enter-chip") !== null));
  // r9 D1 artwork refresh: the temporary will-change hint must be fully
  // restored after the post-exit sampling window (no permanent inline hints).
  check("r9 d1: artwork refresh hint restored after release",
    await until(desktop, () => {
      const nodes = document.querySelectorAll(".project-artwork-object");
      return Array.from(nodes).every(
        (n) => n.style.getPropertyValue("will-change") === "");
    }, 2500));

  // ── desktop: canvas tap = select (opens the tapped creature's panel) ──
  const dive = await browser.newPage();
  await dive.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(dive);
  await open(dive);
  await dive.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
  await wait(400);
  await enterRealm(dive);
  // r10 d1: wrap the hold setter so the park point is captured exactly —
  // snapshots immediately before and after the real call distinguish
  // parking from teleporting.
  await dive.evaluate(() => {
    const s = window.__realmScene;
    window.__holdProbe = { before: null, after: null };
    const orig = s.setLanternHold.bind(s);
    s.setLanternHold = (hold) => {
      window.__holdProbe.before = { ...s.getLanternSnapshot() };
      orig(hold);
      window.__holdProbe.after = { ...s.getLanternSnapshot() };
    };
  });
  await dive.mouse.move(360, 468); // creature 0 anchor: (0.25·vw, 0.26·2vh) at zoom 1, cam 0
  await wait(600); // settle: hover before the tap, past any entering-frame under load
  // fast out-and-back sweep: the light builds chasing speed without leaving
  // the pick band; the press itself stays still
  await dive.mouse.move(430, 560, { steps: 3 });
  await dive.mouse.move(360, 468, { steps: 3 });
  await dive.mouse.down();
  await dive.mouse.up();
  check("canvas tap-select opens the tapped creature's panel",
    await until(dive, () =>
      document.querySelector(".realm-panel-title")?.textContent.trim().toLowerCase() ===
      document.querySelector(".realm-legend-btn")?.textContent.split("—").pop().trim().toLowerCase()));
  check("r10 d1: canvas tap parks the lantern at its pre-selection point",
    await dive.evaluate(() => {
      const p = window.__holdProbe;
      return p.before !== null && p.after !== null &&
        p.before.held === false && p.after.held === true &&
        p.after.speed === 0 &&
        Math.abs(p.after.x - p.before.x) < 25 &&
        Math.abs(p.after.y - p.before.y) < 25;
    }));
  // held: pointer sweeps and key input must not move the lantern at all
  await dive.mouse.move(700, 300, { steps: 4 });
  await dive.mouse.move(200, 600, { steps: 4 });
  await dive.keyboard.down("d");
  await wait(120);
  await dive.keyboard.up("d");
  await dive.evaluate(async () => {
    const s = window.__realmScene;
    const series = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 320) {
      const g = s.getLanternSnapshot();
      series.push({ x: g.x, y: g.y, vx: g.vx, speed: g.speed, held: g.held });
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.__holdSeries = series;
  });
  check("r10 d1: held lantern keeps exact coordinates and zero velocity across frames",
    await dive.evaluate(() => {
      const series = window.__holdSeries ?? [];
      return series.length > 4 && series.every((g) =>
        g.held === true && g.speed === 0 &&
        g.x === series[0].x && g.y === series[0].y);
    }));
  await dive.keyboard.press("Escape");
  await wait(300);
  check("esc closes the tap-opened panel", (await dive.$(".realm-panel.is-open")) === null);
  check("r10 d1: panel close disarms following, preserving parked coordinates",
    await dive.evaluate(() => {
      const g = window.__realmScene.getLanternSnapshot();
      return g !== null && g.held === false && g.pointerActive === false &&
        g.speed === 0 &&
        Math.abs(g.x - window.__holdProbe.after.x) < 0.5 &&
        Math.abs(g.y - window.__holdProbe.after.y) < 0.5;
    }));
  await dive.mouse.move(420, 500, { steps: 4 });
  await wait(400);
  check("r10 d1: fresh pointer movement resumes following from the parked lantern",
    await dive.evaluate(() => {
      const g = window.__realmScene.getLanternSnapshot();
      return g !== null && g.held === false && g.pointerActive === true &&
        (Math.abs(g.x - window.__holdProbe.after.x) > 5 ||
          Math.abs(g.y - window.__holdProbe.after.y) > 5);
    }));

  // ── desktop: dive → SPA handoff ──
  await dive.click(".realm-legend-btn:nth-child(3)"); // explosion
  await wait(400);
  await dive.click(".realm-panel-dive");
  check("iris closes during the dive", await until(dive, () =>
    document.querySelector(".realm-iris") !== null, 2500));
  // the dive commits at ~1.0s after the panel action; poll under load
  check("dive hands off to the project page",
    await until(dive, () => window.location.pathname.includes("explosion"), 4000));

  // ── r13: deep floor + selection framing ──
  const r13 = await browser.newPage();
  await r13.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(r13);
  await open(r13);
  await enterRealm(r13);
  const depthOf = (p) => p.evaluate(() => window.__r13?.getDepthSnapshot());
  const frameOf = (p) => p.evaluate(() => window.__r13?.getFrameSnapshot());

  const ds13 = await depthOf(r13);
  check("r13: depth model = frozen anchor span + additive deep",
    !!ds13 && ds13.anchorH === 2 * ds13.vh && ds13.deep === Math.round(ds13.vh * 0.5) &&
    ds13.h === ds13.anchorH + ds13.deep && ds13.range === ds13.h - ds13.vh,
    JSON.stringify(ds13));
  check("r13: frame idle before any selection",
    await r13.evaluate(() => {
      const f = window.__r13?.getFrameSnapshot();
      return !!f && f.active === false && f.settled === false && f.doorId === null;
    }));

  await r13.evaluate(() => document.querySelectorAll(".realm-legend-btn")[0]?.click());
  check("r13: legend selection opens the panel and activates the frame",
    await until(r13, () => {
      const f = window.__r13?.getFrameSnapshot();
      return document.querySelector(".realm-panel.is-open") !== null && !!f && f.active === true;
    }, 2500));
  check("r13: frame settles; left-half creature keeps the sheet right",
    await until(r13, () => {
      const f = window.__r13?.getFrameSnapshot();
      return !!f && f.settled === true &&
        document.querySelector(".realm-panel")?.getAttribute("data-side") === "right";
    }, 3000));
  check("r13: framed camY puts door 1 at the chrome-free band centre",
    await r13.evaluate(() => {
      const d = window.__r13?.getDepthSnapshot();
      const f = window.__r13?.getFrameSnapshot();
      if (!d || !f) return false;
      const sy13 = 0.26 * d.anchorH - d.camYState;
      return Math.abs(sy13 - (f.bandTop + f.bandBottom) / 2) < 5;
    }));
  await r13.evaluate(() => {
    window.__r13park = { ...window.__realmScene.getLanternSnapshot() };
  });
  await wait(400);
  check("r13: parked lantern world coords exact across the framing tween",
    await r13.evaluate(() => {
      const g = window.__realmScene.getLanternSnapshot();
      const b = window.__r13park;
      return g.held === true && g.speed === 0 &&
        Math.abs(g.x - b.x) < 0.5 && Math.abs(g.y - b.y) < 0.5;
    }));

  await r13.keyboard.press("Escape"); // close door 1
  check("r13: framed camY held at the close moment (no snap)",
    await until(r13, () => {
      if (document.querySelector(".realm-panel.is-open") !== null) return false;
      const d = window.__r13?.getDepthSnapshot();
      return !!d && Math.abs(d.camYState - 18) < 30;
    }, 2500));
  check("r13: side attributes clear after the close fade",
    await until(r13, () => {
      const panel = document.querySelector(".realm-panel");
      const layer = document.querySelector(".realm-layer");
      return panel?.getAttribute("data-side") === null &&
        layer?.getAttribute("data-panel-side") === null;
    }, 2500));

  await r13.evaluate(() => document.querySelectorAll(".realm-legend-btn")[3]?.click()); // spine fx 0.8
  check("r13: right-half creature flips the sheet to the left edge",
    await until(r13, () => {
      const panel = document.querySelector(".realm-panel");
      return panel?.getAttribute("data-side") === "left" &&
        document.querySelector(".realm-layer")?.getAttribute("data-panel-side") === "left";
    }, 3000));
  check("r13: flipped panel rect anchors the left edge",
    await until(r13, () => {
      const el = document.querySelector(".realm-panel");
      if (!el || !el.classList.contains("is-open")) return false;
      const r = el.getBoundingClientRect();
      return Math.abs(r.left) < 2 && r.right < window.innerWidth - 1;
    }, 2500));
  check("r13: legend clears to the right of the left sheet",
    await r13.evaluate(() => {
      const l = document.querySelector(".realm-legend")?.getBoundingClientRect();
      const p = document.querySelector(".realm-panel")?.getBoundingClientRect();
      return !!l && !!p && l.left >= p.right - 1;
    }));
  check("r13: door 4's greeting core sits inside the clear band",
    await until(r13, () => {
      const f = window.__r13?.getFrameSnapshot();
      const d = window.__r13?.getDepthSnapshot();
      if (!f || !d || !f.settled) return false;
      const r = Math.min(window.innerWidth, window.innerHeight) * 0.28;
      const sy13 = 0.55 * d.anchorH - d.camYState;
      return sy13 - r > f.bandTop && sy13 + r < f.bandBottom;
    }, 3000));

  await r13.keyboard.press("Escape");
  await wait(600);
  await r13.keyboard.press("7"); // warp to door 7 (fy 0.9)
  await wait(300);
  check("r13: warp to door 7 reaches the deep floor (camY 1170, was capped at vh)",
    await r13.evaluate(() => {
      const d = window.__r13?.getDepthSnapshot();
      return !!d && Math.abs(d.camYState - 1170) < 3;
    }));
  await r13.keyboard.down("s");
  await wait(1200);
  await r13.keyboard.up("s");
  check("r13: light travels below the anchor band (owner's deep-floor ask)",
    await r13.evaluate(() => {
      const d = window.__r13?.getDepthSnapshot();
      const g = window.__realmScene?.getLanternSnapshot();
      return !!d && !!g && g.y > d.anchorH;
    }));

  await r13.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click()); // explosion fx 0.46
  await wait(600);
  check("r13: door 3 keeps the sheet on the right edge",
    await r13.evaluate(() =>
      document.querySelector(".realm-panel")?.getAttribute("data-side") === "right"));
  await r13.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  check("r13: dive clears the frame state",
    await r13.evaluate(() => {
      const f = window.__r13?.getFrameSnapshot();
      return !!f && f.active === false;
    }));
  check("r13: dive hands off to the project page",
    await until(r13, () => window.location.pathname.includes("projects"), 5000));
  await r13.close();

  // ── r11: returning from a deep-opened project restores the deep ──
  const ret = await browser.newPage();
  await ret.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(ret);
  await open(ret);
  await enterRealm(ret);
  await ret.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  check("r11: entry and panel opening write no return intent",
    await ret.evaluate(() =>
      window.sessionStorage.getItem("portfolio.realm.return.v1") === null));
  await ret.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  check("r11: committed dive records the deep-return intent",
    await until(ret, () =>
      window.sessionStorage.getItem("portfolio.realm.return.v1") === "deep", 5000));
  check("r11: dive hands off to the project page",
    await until(ret, () => window.location.pathname.includes("projects"), 5000));
  await armProjectBacked(ret);
  await ret.evaluate(() => document.querySelector(".back-link")?.click());
  check("r11: in-page back restores the deep (no surface detour)",
    await until(ret, () =>
      document.querySelector(".realm-layer") !== null &&
      window.__pbRecorder?.saw === true, 5000));
  check("r12: in-page return keeps the project pathname until opaque settlement",
    await ret.evaluate(() =>
      window.location.pathname.includes("/projects/") &&
      document.querySelector(".realm-layer") !== null &&
      document.querySelector(".project-frame") !== null));
  check("r12: project backdrop is inert and aria-hidden during return entry",
    await ret.evaluate(() => {
      const frame = document.querySelector(".project-frame");
      const cover = frame?.parentElement;
      return cover?.inert === true &&
        cover?.getAttribute("aria-hidden") === "true";
    }));
  await wait(1700); // the re-entry flood must reach the active phase before input
  check("r12: opaque settlement resolves root beneath the same realm",
    await until(ret, () =>
      window.location.pathname === "/" &&
      document.querySelector(".signal-index-shell")?.inert === true &&
      getComputedStyle(document.body).position === "fixed" &&
      document.querySelectorAll(".realm-layer").length === 1, 5000));
  check("r12: restored return never mounts two realm layers",
    await ret.evaluate(() =>
      document.querySelectorAll(".realm-layer").length === 1));
  // browser back while immersed in the restored deep: one realm, at root
  await ret.goBack();
  check("r12: browser back during restored deep keeps one realm at root",
    await until(ret, () =>
      window.location.pathname === "/" &&
      document.querySelectorAll(".realm-layer").length === 1 &&
      document.querySelector(".signal-index-shell")?.inert === true &&
      getComputedStyle(document.body).position === "fixed", 3000));
  await exitViaButton(ret);
  check("r11: normal exit from a restored realm clears the intent",
    await until(ret, () =>
      document.querySelector(".realm-layer") === null &&
      window.sessionStorage.getItem("portfolio.realm.return.v1") === null, 5000));
  check("r11: exit from a restored realm focuses the threshold fallback",
    await until(ret, () =>
      document.activeElement?.classList.contains("realm-threshold-enter") === true, 3000));
  check("r12: restored exit reveals root surface with no realm replacement",
    await until(ret, () =>
      window.location.pathname === "/" &&
      document.querySelector(".signal-index-shell") !== null &&
      document.querySelector(".realm-layer") === null, 5000));
  await ret.evaluate(() => {
    document.querySelector(".signal-index-card")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await wait(400);
  await ret.evaluate(() => document.querySelector(".signal-index-card")?.click());
  check("r11: surface card still hands off to a project page",
    await until(ret, () => window.location.pathname.includes("projects"), 5000));
  check("r11: surface handoff keeps the intent cleared",
    await ret.evaluate(() =>
      window.sessionStorage.getItem("portfolio.realm.return.v1") === null));
  await ret.evaluate(() => document.querySelector(".back-link")?.click());
  check("r11: surface project still returns to the surface",
    await until(ret, () =>
      document.querySelector(".realm-layer") === null &&
      window.location.pathname === "/", 5000));
  await ret.close();

  // browser-back + consecutive-deep legs
  const retBack = await browser.newPage();
  await retBack.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(retBack);
  await open(retBack);
  await enterRealm(retBack);
  await retBack.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  await retBack.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  await until(retBack, () => window.location.pathname.includes("projects"), 5000);
  await armProjectBacked(retBack);
  await retBack.goBack();
  check("r11: browser back restores the deep",
    await until(retBack, () =>
      document.querySelector(".realm-layer") !== null &&
      window.__pbRecorder?.saw === true, 5000));
  await wait(1700); // the re-entry flood must reach the active phase before input
  await retBack.evaluate(() => document.querySelectorAll(".realm-legend-btn")[3]?.click());
  await wait(500);
  await retBack.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  check("r11: second deep dive hands off again",
    await until(retBack, () => window.location.pathname.includes("projects"), 5000));
  check("r12: consecutive restored dive unmounts the external realm at project commit",
    await until(retBack, () =>
      window.location.pathname.includes("/projects/") &&
      document.querySelector(".project-frame") !== null &&
      document.querySelector(".realm-layer") === null, 5000));
  await armProjectBacked(retBack);
  await retBack.goBack();
  check("r11: second deep return still restores the deep (non-consuming intent)",
    await until(retBack, () =>
      document.querySelector(".realm-layer") !== null &&
      window.__pbRecorder?.saw === true, 5000));
  await retBack.close();

  // reload legs: session storage must survive a fresh boot on the project page
  const retReload = await browser.newPage();
  await retReload.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(retReload);
  await open(retReload);
  await enterRealm(retReload);
  await retReload.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  await retReload.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  await until(retReload, () => window.location.pathname.includes("projects"), 5000);
  await retReload.reload({ waitUntil: "domcontentloaded" });
  await retReload.waitForFunction(
    () => document.querySelector(".back-link") !== null,
    { timeout: 30000, polling: 250 },
  );
  await armProjectBacked(retReload);
  await retReload.evaluate(() => document.querySelector(".back-link")?.click());
  check("r11: project reload then in-page back restores the deep (session storage)",
    await until(retReload, () =>
      document.querySelector(".realm-layer") !== null &&
      window.__pbRecorder?.saw === true, 5000));
  await wait(1700); // the re-entry flood must reach the active phase before input
  await retReload.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  await retReload.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  await until(retReload, () => window.location.pathname.includes("projects"), 5000);
  await retReload.reload({ waitUntil: "domcontentloaded" });
  await retReload.waitForFunction(
    () => document.querySelector(".back-link") !== null,
    { timeout: 30000, polling: 250 },
  );
  await retReload.evaluate(() => { window.location.href = "/"; });
  check("r11: same-tab root navigation after reload restores the deep",
    await until(retReload, () =>
      document.querySelector(".realm-layer") !== null, 5000));
  await retReload.close();

  // fresh boot directly on a project URL (the GitHub Pages 404 path)
  const retFresh = await browser.newPage();
  await retFresh.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  collectErrors(retFresh);
  await retFresh.goto(`${BASE}/projects/explosion/`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await retFresh.waitForFunction(
    () => document.querySelector(".back-link") !== null,
    { timeout: 30000, polling: 250 },
  );
  await retFresh.evaluate(() => document.querySelector(".back-link")?.click());
  check("r11: fresh-context direct project boot returns to the surface",
    await until(retFresh, () =>
      document.querySelector(".realm-layer") === null &&
      window.location.pathname === "/", 5000));
  await retFresh.close();

  // reduced-motion leg: the return uses the settled reduced path
  const retReduced = await browser.newPage();
  await retReduced.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await retReduced.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  collectErrors(retReduced);
  await open(retReduced);
  await enterRealm(retReduced);
  check("r11 reduced: realm opens with the reduced class",
    await retReduced.$eval(".realm-layer", (el) => el.className.includes("realm-reduced")));
  await retReduced.evaluate(() => document.querySelectorAll(".realm-legend-btn")[2]?.click());
  await wait(500);
  await retReduced.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  await until(retReduced, () => window.location.pathname.includes("projects"), 5000);
  await armProjectBacked(retReduced);
  await retReduced.goBack();
  check("r11 reduced: return restores the deep with the settled reduced path",
    await until(retReduced, () => {
      const layer = document.querySelector(".realm-layer");
      return layer !== null && layer.className.includes("realm-reduced") &&
        window.__pbRecorder?.saw === true;
    }, 5000));
  check("r12 reduced: route resolves only after the reduced realm has settled",
    await until(retReduced, () =>
      window.location.pathname === "/" &&
      document.querySelector(".signal-index-shell")?.inert === true &&
      document.querySelectorAll(".realm-layer").length === 1, 3000));
  await exitViaButton(retReduced);
  check("r11 reduced: exit from a restored realm restores the landing",
    await until(retReduced, () => document.querySelector(".realm-layer") === null, 4000));
  await retReduced.close();

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

  // r9 D2 sheet law: the wrapper is a stationary frame; only the inner body
  // scrolls, and the close X must not move while the copy scrolls beneath it.
  // (The real device's 34px safe-area inset is what overflows the sheet; the
  // longest description is used here so Blink overflows the body too.)
  const closeRectAt = () => mobile.evaluate(() => {
    const b = document.querySelector(".realm-panel-close")?.getBoundingClientRect();
    return b ? { top: Math.round(b.top), left: Math.round(b.left) } : null;
  });
  await mobile.evaluate(() =>
    document.querySelectorAll(".realm-legend-btn")[2]?.click()); // explosion: longest copy
  await wait(700);
  const closeRest = await closeRectAt();
  // Emulate the real device's 34px safe-area inset (Blink reports 0): shrink
  // the sheet's content box by 34px so the longest copy overflows the body —
  // on iPhone 11 that overflow is what used to scroll the whole sheet.
  await mobile.evaluate(() => {
    const panel = document.querySelector(".realm-panel");
    panel.style.paddingBottom = "calc(1.4rem + 34px)";
  });
  await wait(300);
  // The layer's touch-action:none blocks native panning in Blink (WebKit's
  // historical quirk allowed it on device — the drift the owner saw), so the
  // geometry contract is asserted with a programmatic body scroll.
  await mobile.evaluate(() => {
    const body = document.querySelector(".realm-panel-body");
    if (body) body.scrollTop = 120;
  });
  await wait(300);
  const scrolledSheet = await mobile.evaluate(() => ({
    wrapperScroll: document.querySelector(".realm-panel").scrollTop,
    bodyScroll: document.querySelector(".realm-panel-body")?.scrollTop ?? -1,
  }));
  const closeRectScrolled = await closeRectAt();
  check("r9 d2: sheet copy scrolls in the body; wrapper and X stay fixed",
    closeRest !== null && closeRectScrolled !== null &&
    closeRectScrolled.top === closeRest.top &&
    closeRectScrolled.left === closeRest.left &&
    scrolledSheet.wrapperScroll === 0 &&
    scrolledSheet.bodyScroll > 0,
    `body=${scrolledSheet.bodyScroll} close=${JSON.stringify(closeRest)}→${JSON.stringify(closeRectScrolled)}`);
  // the final action stays reachable above the emulated safe-area pad
  await mobile.evaluate(() => {
    const body = document.querySelector(".realm-panel-body");
    if (body) body.scrollTop = body.scrollHeight;
  });
  await wait(400);
  const diveGap = await mobile.evaluate(() => {
    const dive = document.querySelector(".realm-panel-dive")?.getBoundingClientRect();
    const panel = document.querySelector(".realm-panel")?.getBoundingClientRect();
    if (!dive || !panel) return null;
    return Math.round(panel.bottom - dive.bottom);
  });
  check("r9 d2: dive action reachable above the safe-area padding",
    diveGap !== null && diveGap > 30, `gap=${diveGap}px`);
  // clean up the emulation before the next gates
  await mobile.evaluate(() => {
    const panel = document.querySelector(".realm-panel");
    panel.style.removeProperty("padding-bottom");
  });
  // switching projects resets the body scroll (keyed remount)
  await mobile.evaluate(() =>
    document.querySelectorAll(".realm-legend-btn")[0]?.click());
  check("r9 d2: body scroll resets on project switch",
    await until(mobile, () => {
      const body = document.querySelector(".realm-panel-body");
      return !!body && body.scrollTop === 0;
    }, 2500));
  // r13 mobile: the bottom-sheet law stands; the frame lifts door 7 above it
  await mobile.keyboard.press("Escape");
  await wait(400);
  await mobile.evaluate(() =>
    document.querySelectorAll(".realm-legend-btn")[6]?.click()); // practice-map fy 0.9
  check("r13 mobile: sheet keeps its r9 geometry regardless of side",
    await until(mobile, () => {
      const el = document.querySelector(".realm-panel");
      if (!el || !el.classList.contains("is-open")) return false;
      const r = el.getBoundingClientRect();
      return Math.abs(r.left) < 2 && Math.abs(r.right - window.innerWidth) < 2 &&
        Math.abs(r.top - window.innerHeight * 0.52) < 6 &&
        el.getAttribute("data-side") === "right";
    }, 3000));
  check("r13 mobile: frame lifts door 7's core above the sheet",
    await until(mobile, () => {
      const d = window.__r13?.getDepthSnapshot();
      const f = window.__r13?.getFrameSnapshot();
      if (!d || !f || !f.settled) return false;
      const r = Math.min(window.innerWidth, window.innerHeight) * 0.28;
      const sy13 = 0.9 * d.anchorH - d.camYState;
      const panel = document.querySelector(".realm-panel")?.getBoundingClientRect();
      return sy13 - r > f.bandTop && sy13 + r <= (panel?.top ?? 0) + 2;
    }, 3000));
  await mobile.keyboard.press("Escape"); // close the sheet before the reduced leg
  await wait(300);

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
  // r10 d1: reduced motion parks the lantern too — the held branch precedes
  // the softened-follow branch, so no follow or thrust can move it.
  await reduced.mouse.click(360, 468); // creature 0 anchor: (0.25·vw, 0.26·2vh)
  await wait(500);
  check("reduced: canvas tap opens the panel",
    await reduced.$eval(".realm-panel-title", (el) => el.textContent.length > 0, { timeout: 2000 }).catch(() => false));
  check("r10 d1: reduced-motion hold parks the lantern",
    await reduced.evaluate(() => {
      const g = window.__realmScene?.getLanternSnapshot?.();
      return !!g && g.held === true && g.speed === 0;
    }));
  await reduced.keyboard.press("Escape");
  await wait(300);
  check("reduced: panel closes", (await reduced.$(".realm-panel.is-open")) === null);
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

  for (const p of [desktop, dive, mobile, section, reduced, ret, retBack, retReload, retFresh, retReduced]) {
    check(`console clean (${p.errors.length} errors)`, p.errors.length === 0,
      p.errors.slice(0, 2).join(" | "));
  }

  await browser.close();
  console.log(failures === 0 ? "realm-probe: all checks passed" : `realm-probe: ${failures} FAILURES`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  server.kill("SIGTERM");
}

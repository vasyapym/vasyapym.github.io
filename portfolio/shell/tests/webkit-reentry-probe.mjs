// bug-iteration WebKit probe: hero reappearance after realm exit, on WebKit.
//
// Blink (realm-probe.mjs harness) interpolates --hero-exit per frame, so the
// surface and deep exits hold the law there. The owner reports the hero
// appearing abruptly after exiting the realm — hypothesis: on WebKit the
// rAF-driven inline-style writer starves during main-thread scroll, so the
// hero-exit var jumps 1 → 0 in one late update and the hero pops.
//
// Law: with the viewport below the hero, --hero-exit ≈ 1; a fast wheel
// scroll back up must interpolate (opacity = 1 − y/span) across in-range
// frames instead of popping.
//
//   CHROME_PATH=/path/to/pw_run.sh node tests/webkit-reentry-probe.mjs
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const PORT = 5223;
const BASE = `http://localhost:${PORT}`;

const WEBKIT = process.env.CHROME_PATH ||
  "/Users/vasilij/Library/Caches/ms-playwright/webkit-2104/pw_run.sh";
if (!existsSync(WEBKIT)) {
  console.log("webkit-reentry-probe: no WebKit binary — skipping");
  process.exit(0);
}

const { webkit } = await import("playwright-core");

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

let failures = 0;
const check = (name, ok, detail = "") => {
  const tag = ok ? "PASS" : "FAIL";
  if (!ok) failures += 1;
  console.log(`${tag}  ${name}${detail ? ` — ${detail}` : ""}`);
};

// Run one scenario: optionally through the realm, then the fast-flick law.
const runScenario = async (browser, label, throughRealm) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 150000 });
  await page.waitForSelector(".realm-threshold", { timeout: 60000 });
  await wait(800);

  // scroll below the hero, past the threshold, exactly like a visitor
  await page.evaluate(() => {
    const t = document.querySelector(".realm-threshold");
    const bottom = t
      ? Math.ceil(t.getBoundingClientRect().bottom + window.scrollY)
      : window.scrollY;
    window.scrollTo({ top: bottom + 80, behavior: "instant" });
  });
  await wait(400);

  if (throughRealm) {
    await page.waitForFunction(() => {
      const el = document.querySelector(".realm-enter-chip");
      return !!el && el.classList.contains("is-visible") && !el.disabled;
    }, { timeout: 5000 });
    await page.click(".realm-enter-chip");
    await wait(2200); // flood + settle
    check(`${label}: realm opened`, await page.evaluate(() =>
      document.querySelector(".realm-layer") !== null));
    await page.click(".realm-btn--leave");
    await page.waitForFunction(() =>
      document.querySelector(".realm-layer") === null, { timeout: 10000 });
    await wait(800);
  }

  const post = await page.evaluate(() => {
    const hero = document.querySelector(".signal-index-hero-fluid");
    return {
      scrollY: window.scrollY,
      computed: getComputedStyle(hero).getPropertyValue("--hero-exit").trim(),
      opacity: getComputedStyle(hero).opacity,
      span: hero.offsetHeight * 0.9,
    };
  });
  const expectedExit = Math.min(1, post.scrollY / post.span);
  check(`${label}: hero-exit is 1 at the offset below the hero`,
    Math.abs(parseFloat(post.computed || "0") - expectedExit) < 0.02,
    `scrollY=${post.scrollY} computed=${post.computed || "(unset)"} opacity=${post.opacity}`);

  // start a per-frame recorder, then fire a fast real wheel flick back up
  await page.evaluate(() => {
    window.__frames = [];
    window.__recOn = true;
    const hero = document.querySelector(".signal-index-hero-fluid");
    const rec = () => {
      if (!window.__recOn) return;
      window.__frames.push({
        t: Math.round(performance.now()),
        y: window.scrollY,
        exit: Number.parseFloat(
          getComputedStyle(hero).getPropertyValue("--hero-exit").trim() || "0",
        ),
        op: Number.parseFloat(getComputedStyle(hero).opacity),
      });
      requestAnimationFrame(rec);
    };
    requestAnimationFrame(rec);
  });
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel(0, -1000);
    await wait(16);
  }
  await wait(600);
  await page.evaluate(() => { window.__recOn = false; });

  const analysis = await page.evaluate(() => {
    const hero = document.querySelector(".signal-index-hero-fluid");
    const span = hero.offsetHeight * 0.9;
    const frames = window.__frames;
    const gaps = [];
    for (let i = 1; i < frames.length; i += 1) {
      gaps.push(frames[i].t - frames[i - 1].t);
    }
    const inRange = frames.filter((f) => f.y > 0 && f.y < span);
    let worst = 0;
    let worstFrame = null;
    for (const f of inRange) {
      const expected = f.y / span;
      const delta = Math.abs(f.exit - expected);
      if (delta > worst) { worst = delta; worstFrame = f; }
    }
    let pop = null;
    for (let i = 1; i < frames.length; i += 1) {
      const a = frames[i - 1];
      const b = frames[i];
      if (a.op <= 0.15 && b.op >= 0.85 && b.y > 0 && b.y < span * 0.95) {
        pop = { from: a, to: b };
        break;
      }
    }
    const settled = frames.length ? frames[frames.length - 1] : null;
    const settledOk = settled
      ? Math.abs(settled.op - (1 - Math.min(1, Math.max(0, settled.y / span)))) < 0.05
      : false;
    return {
      frameCount: frames.length,
      maxGap: Math.max(...gaps, 0),
      inRangeCount: inRange.length,
      worst, worstFrame, pop, settled, settledOk,
    };
  });

  console.log(
    `${label}: frames=${analysis.frameCount} maxRafGap=${analysis.maxGap}ms ` +
    `inRange=${analysis.inRangeCount} ` +
    `worstDelta=${analysis.worst.toFixed(3)} at y=${analysis.worstFrame?.y} ` +
    `pop=${analysis.pop ? `y${analysis.pop.from.y}->${analysis.pop.to.y} op${analysis.pop.from.op}->${analysis.pop.to.op}` : "none"} ` +
    `settledOp=${analysis.settled?.op}`,
  );
  check(`${label}: scroll-up interpolates opacity (no abrupt pop)`,
    !analysis.pop && analysis.settledOk,
    `pop=${analysis.pop ? "yes" : "no"} settledOk=${analysis.settledOk}`);
  await page.close();
};

try {
  await waitForServer();
  const browser = await webkit.launch({ headless: true, executablePath: WEBKIT });

  // baseline: no realm — does the pop belong to the realm exit at all?
  await runScenario(browser, "baseline", false);
  // the reported path: realm exit, then the fast scroll up
  await runScenario(browser, "realm", true);

  await browser.close();
  console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("probe crashed:", err);
  process.exitCode = 1;
} finally {
  server.kill("SIGKILL");
  process.exit(process.exitCode ?? 0);
}

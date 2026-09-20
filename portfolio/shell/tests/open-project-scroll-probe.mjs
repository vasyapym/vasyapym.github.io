// Regression gate (bug-iteration): opening a project from the landing — and a
// plain no-intent back to the menu — must reset the scroll INSTANTLY.
//
// html{scroll-behavior:smooth} turned App's bare window.scrollTo({top:0})
// (openProject + goHome) into a ~0.3s browser-animated scroll-up the owner saw
// as a jerk on every card click ("waste of tokens", raft cluster, explosion).
// The signature of an animated scroll is INTERMEDIATE scrollY values strictly
// between the start offset and 0; an instant jump never produces any. Samples
// come from a rAF loop armed before the click, so nothing depends on sampling
// latency.
//
//   CHROME_PATH=<bin> node portfolio/shell/tests/open-project-scroll-probe.mjs
//
// Same harness as the other shell probes: puppeteer-core + a local Chrome
// binary, skips cleanly when no browser is available.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const viteJs = resolve(here, "../../node_modules/vite/bin/vite.js");
const PORT = 5241;
const BASE = `http://localhost:${PORT}`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("open-project-scroll-probe: no Chrome/Chromium found — skipping (set CHROME_PATH)");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, [viteJs, "--port", String(PORT), "--strictPort"], {
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

await waitForServer(`${BASE}/projects/kitty-run`);

let failures = 0;
const problems = [];
const check = (label, ok, detail) => {
  if (ok) {
    console.log(`ok   ${label}`);
  } else {
    failures += 1;
    problems.push(detail);
    console.log(`FAIL ${label}`);
    console.log(`     ${detail}`);
  }
};

// Arm a rAF sampler BEFORE the gesture and click inside the same task: every
// frame from the click onward lands in __sy. An animated scroll shows up as a
// descent through intermediate offsets; an instant jump as startY → 0. The
// loop runs 2000ms because loading the project page janks the main thread
// (exactly when the animation plays) — a short window starves under load.
const SAMPLE_ARM = (clickExpr) => `
  (() => {
    window.__sy = [];
    const t0 = performance.now();
    const loop = () => {
      if (performance.now() - t0 > 2000) return;
      window.__sy.push(Math.round(performance.now() - t0), Math.round(window.scrollY));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return (${clickExpr}) !== undefined ? "clicked" : "no-target";
  })()`;

// The gate itself: no observed scrollY strictly between 2 and startY-2.
// Samples are [t, y] pairs (headless main-thread jank makes timestamps as
// important as values — a single late sample still proves the animation ran).
const noIntermediate = (samples, startY) => {
  const lo = 2;
  const hi = startY - 2;
  const inside = [];
  for (let i = 1; i < samples.length; i += 2) {
    const y = samples[i];
    if (y > lo && y < hi) inside.push(y);
  }
  const frames = samples.length / 2;
  return { ok: inside.length === 0 && frames >= 3, inside, frames };
};

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--no-first-run"],
});

try {
  // --- scenario 1: card click from a deep catalogue offset (App.openProject) ---
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(700);

  const saved = await page.evaluate(() => {
    // The owner's repro is a card whose project page is TALL ("waste of
    // tokens" = practice-map): a short page clamps the running animation to 0
    // at the tree swap and no intermediate survives — the tall page lets the
    // animated descent play out, which is exactly the defect being gated.
    const target = document.getElementById("project-practice-map")
      ?? [...document.querySelectorAll("a[id^='project-']")].pop()
      ?? null;
    const y = Math.max(600, target ? Math.round(target.getBoundingClientRect().top + window.scrollY - 120) : 900);
    window.scrollTo({ top: y, behavior: "instant" });
    return { startY: Math.round(window.scrollY), id: target?.id?.replace("project-", "") ?? null };
  });
  await wait(400);
  if (!saved.id) {
    failures += 1;
    console.log("FAIL scenario 1: no project card found on the landing");
  } else {
    await page.evaluate(SAMPLE_ARM(
      `document.getElementById('project-${saved.id}')?.click()`,
    ));
    await wait(2300);
    const after = await page.evaluate(() => ({
      path: window.location.pathname,
      y: Math.round(window.scrollY),
      sy: window.__sy ?? [],
    }));
    const gate = noIntermediate(after.sy, saved.startY);
    check(
      "card click: no animated pass-through (instant reset)",
      gate.ok,
      `startY=${saved.startY} frames=${gate.frames} intermediate=[${gate.inside.join(", ")}] ys=[${after.sy.filter((_, i) => i % 2 === 1).join(", ")}]`,
    );
    check(
      "card click: project opened at top",
      after.path.startsWith("/projects/") && after.y <= 2,
      `opened ${after.path} at scrollY=${after.y}`,
    );
  }
  await page.close();

  // --- scenario 2: no-intent back from a scrolled project page (App.goHome) ---
  const direct = await browser.newPage();
  await direct.setViewport({ width: 1440, height: 810 });
  // A tall project page is required: the jerk needs scroll distance. The
  // practice-map lesson reader is reliably tall; fail loudly if it is not.
  await direct.goto(`${BASE}/projects/practice-map/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);
  const tall = await direct.evaluate(() => {
    const s = document.scrollingElement ?? document.documentElement;
    return s.scrollHeight - window.innerHeight;
  });
  if (tall < 300) {
    failures += 1;
    console.log(`FAIL scenario 2: project page not scrollable (scrollHeight-innerHeight=${tall}, need >=300)`);
  } else {
    const startY = await direct.evaluate(() => {
      const y = Math.min(Math.round((document.scrollingElement ?? document.documentElement).scrollHeight - window.innerHeight), 900);
      window.scrollTo({ top: y, behavior: "instant" });
      return Math.round(window.scrollY);
    });
    await wait(300);
    await direct.evaluate(SAMPLE_ARM(
      `[...document.querySelectorAll("button")].find((b) => /Vasily Argounov/.test(b.textContent ?? ""))?.click()`,
    ));
    await wait(2300);
    const backState = await direct.evaluate(() => ({
      path: window.location.pathname,
      y: Math.round(window.scrollY),
      sy: window.__sy ?? [],
      landMounted: document.querySelector(".signal-index") !== null,
      projMounted: document.querySelector(".project-frame") !== null,
      sh: (document.scrollingElement ?? document.documentElement).scrollHeight,
    }));
    const gate = noIntermediate(backState.sy, startY);
    check(
      "no-intent back: no animated pass-through (instant reset)",
      gate.ok,
      `startY=${startY} frames=${gate.frames} intermediate=[${gate.inside.join(", ")}] ys=[${backState.sy.filter((_, i) => i % 2 === 1).join(", ")}]`,
    );
    check(
      "no-intent back lands at top",
      backState.path === "/" && backState.y <= 2,
      `back landed at ${backState.path} scrollY=${backState.y}`,
    );
  }
  await direct.close();
} finally {
  await browser.close();
}

if (problems.length > 0) console.log(problems.join("\n"));
console.log(failures === 0 ? "open-project-scroll-probe: every route reset is instant" : `open-project-scroll-probe: ${failures} failing scenario(s)`);
process.exit(failures === 0 ? 0 : 1);

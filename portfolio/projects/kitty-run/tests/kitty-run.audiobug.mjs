// Regression gate for the audio-controls page-shift bug, in BOTH themes.
// Boots the Vite dev server on a scratch port, clicks the sound and mix
// buttons, and reports every observable consequence: exact geometry deltas,
// browser events caught in the act (scroll / resize / style mutations), a
// header-strip pixel compare, and a canvas jump detector — per-interval
// pixel diffs across the click, so a one-frame background snap inside the
// animated scene shows up as a spike against the baseline drift.
//
//   node portfolio/projects/kitty-run/tests/kitty-run.audiobug.mjs
//   (set CHROME_PATH when the default candidates miss)
//
// Skips cleanly when no browser is available. Exit code 1 when any click
// provokes a geometry delta, an unexpected event, or a jump spike.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5219;
const BASE = `http://localhost:${PORT}`;
const SHOTS = join(tmpdir(), "kitty-run-audiobug");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("audiobug: no Chrome/Chromium found — skipping (set CHROME_PATH)");
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

const snapshot = () => {
  const rect = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: +r.x.toFixed(2),
      y: +r.y.toFixed(2),
      w: +r.width.toFixed(2),
      h: +r.height.toFixed(2),
    };
  };
  const canvas = document.querySelector(".kitty-run-stage canvas");
  return {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollbarPx: window.innerWidth - document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    frame: rect(".project-frame"),
    topbar: rect(".project-frame-topbar"),
    field: rect(".kitty-run-field"),
    title: rect(".kitty-run-title"),
    audio: rect(".kitty-run-audio"),
    mute: rect(".kitty-run-mute"),
    mix: rect(".kitty-run-mix"),
    stage: rect(".kitty-run-stage"),
    canvasEl: canvas ? { w: canvas.width, h: canvas.height } : null,
  };
};

const armWatchers = () => {
  window.__events = [];
  const push = (kind, detail) => window.__events.push(`${kind}: ${detail}`);
  addEventListener("scroll", () => push("scroll", `x=${scrollX} y=${scrollY}`), true);
  addEventListener("resize", () => push("resize", `${innerWidth}x${innerHeight}`));
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      push(
        "resized",
        `${e.target.className || e.target.tagName} ${e.contentRect.width.toFixed(1)}x${e.contentRect.height.toFixed(1)}`,
      );
    }
  });
  for (const sel of [".kitty-run-stage", ".kitty-run-audio"]) {
    const el = document.querySelector(sel);
    if (el) ro.observe(el);
  }
  const canvas = document.querySelector(".kitty-run-stage canvas");
  if (canvas) {
    ro.observe(canvas);
    new MutationObserver((m) => {
      for (const entry of m) {
        push("canvas-style", entry.target.getAttribute("style") ?? "");
      }
    }).observe(canvas, { attributes: true, attributeFilter: ["style"] });
  }
};

const diff = (a, b) => {
  const out = [];
  const walk = (path, x, y) => {
    if (x === null || y === null) {
      if (x !== y) out.push(`${path}: ${JSON.stringify(x)} -> ${JSON.stringify(y)}`);
      return;
    }
    if (typeof x === "object") {
      for (const k of Object.keys(x)) walk(`${path}.${k}`, x[k], y[k]);
      return;
    }
    if (x !== y) out.push(`${path}: ${x} -> ${y}`);
  };
  for (const k of Object.keys(a)) walk(k, a[k], b[k]);
  return out;
};

// Mean absolute pixel difference between two PNG buffers, decoded in-page
// (createImageBitmap) and sampled every 3rd pixel. Runs against the live
// page so no extra decode dependency is needed here.
const frameDelta = async (pg, a, b) => {
  const dataUrlA = `data:image/png;base64,${a.toString("base64")}`;
  const dataUrlB = `data:image/png;base64,${b.toString("base64")}`;
  return pg.evaluate(async (urls) => {
    const load = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("decode failed"));
        img.src = url;
      });
    const [imgA, imgB] = await Promise.all(urls.map(load));
    const canvas = new OffscreenCanvas(imgA.width, imgA.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(imgA, 0, 0);
    const pa = ctx.getImageData(0, 0, imgA.width, imgA.height).data;
    ctx.clearRect(0, 0, imgA.width, imgA.height);
    ctx.drawImage(imgB, 0, 0);
    const pb = ctx.getImageData(0, 0, imgB.width, imgB.height).data;
    let total = 0;
    let n = 0;
    for (let i = 0; i < pa.length; i += 4 * 3) {
      total += Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]);
      n += 1;
    }
    return total / (n * 3);
  }, [dataUrlA, dataUrlB]);
};

let failures = 0;

async function scenario(name, viewport, query) {
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run", "--use-gl=angle"],
  });
  const tag = name.replace(/[^a-z0-9]+/gi, "-");
  try {
    const page = await browser.newPage();
    globalThis.__page = page;
    await page.setViewport(viewport);
    await page.goto(`${BASE}/projects/kitty-run${query}`, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });
    await wait(1000);
    await page.evaluate(armWatchers);

    const stageClip = await page.evaluate(() => {
      const r = document.querySelector(".kitty-run-stage").getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    });
    const shot = async (clip) => {
      // puppeteer-core's screenshot return type varies by version: a base64
      // string, a Buffer or a Uint8Array — normalise to PNG bytes.
      const raw = await page.screenshot({ clip });
      return Buffer.isBuffer(raw)
        ? raw
        : typeof raw === "string"
          ? Buffer.from(raw, "base64")
          : Buffer.from(raw);
    };
    const delta = (a, b) => frameDelta(page, a, b);

    await page.mouse.move(5, 5);
    await wait(200);

    // --- phase A: canvas jump detection (screenshots ARE the instrument
    // here; this old headless build fires a resize event per screenshot, so
    // event capture is deferred to phase B, which takes none) ---
    const frames = [];
    for (let i = 0; i < 5; i += 1) {
      frames.push(await shot(stageClip));
      await wait(90);
    }
    await page.click(".kitty-run-mute");
    for (let i = 0; i < 8; i += 1) {
      frames.push(await shot(stageClip));
      await wait(90);
    }
    const intervals = [];
    for (let i = 1; i < frames.length; i += 1) {
      intervals.push(await delta(frames[i - 1], frames[i]));
    }
    // Frames 0-4 are baseline; the click lands between frame 4 and 5, so the
    // jump would live in interval 4. A jump = interval-4 far above baseline.
    const baseline = intervals.slice(0, 4);
    const baseMedian = [...baseline].sort((x, y) => x - y)[Math.floor(baseline.length / 2)];
    const clickInterval = intervals[4];
    const spike = clickInterval > Math.max(0.5, baseMedian * 3 + 0.5);
    await page.mouse.move(5, 5);
    await wait(300);

    // --- phase B: the click whose window contains NO screenshots — any
    // event here is real, not a screenshot artifact ---
    await page.evaluate(() => window.__events.splice(0));
    const before = await page.evaluate(snapshot);
    await page.click(".kitty-run-mute");
    await wait(400);
    await page.mouse.move(5, 5);
    await wait(300);
    const afterMute = await page.evaluate(snapshot);
    const muteEvents = await page.evaluate(() => window.__events.splice(0));
    const stripBefore = Buffer.from(
      await page.screenshot({ clip: { x: 0, y: 0, width: viewport.width, height: 150 } }),
    );

    // --- mix open / close ---
    await page.evaluate(() => window.__events.splice(0));
    await page.click(".kitty-run-mix");
    await wait(400);
    await page.mouse.move(5, 5);
    await wait(300);
    const afterMixOpen = await page.evaluate(snapshot);
    const mixOpenEvents = await page.evaluate(() => window.__events.splice(0));
    await page.click(".kitty-run-mix");
    await wait(400);
    await page.mouse.move(5, 5);
    await wait(300);
    const afterMixClose = await page.evaluate(snapshot);
    const mixCloseEvents = await page.evaluate(() => window.__events.splice(0));
    const stripAfter = Buffer.from(
      await page.screenshot({ clip: { x: 0, y: 0, width: viewport.width, height: 150 } }),
    );

    const problems = [];
    const deltas = diff(before, afterMute);
    if (deltas.length > 0) problems.push(`geometry: ${deltas.join(" | ")}`);
    if (spike) problems.push(`canvas jump on mute: interval ${clickInterval.toFixed(2)} vs baseline median ${baseMedian.toFixed(2)}`);
    if (diff(afterMixOpen, afterMute).length > 0) problems.push(`geometry(mix open): ${diff(afterMixOpen, afterMute).join(" | ")}`);
    if (mixOpenEvents.length > 0) problems.push(`events(mix open): ${mixOpenEvents.join(" | ")}`);
    if (diff(afterMixClose, afterMute).length > 0) problems.push(`geometry(mix close): ${diff(afterMixClose, afterMute).join(" | ")}`);
    if (mixCloseEvents.length > 0) problems.push(`events(mix close): ${mixCloseEvents.join(" | ")}`);
    // Header strip must return to its pre-click bytes (mouse parked away, so
    // no hover paint); a persistent difference = an unexpected residue.
    if (!stripBefore.equals(stripAfter)) {
      writeFileSync(join(SHOTS, `${tag}-before.png`), stripBefore);
      writeFileSync(join(SHOTS, `${tag}-after.png`), stripAfter);
      problems.push(`header strip bytes differ (${stripBefore.length}B vs ${stripAfter.length}B) — saved ${tag}-*.png`);
    }
    // Mute click events themselves: report separately (a benign canvas-style
    // re-assert from R3F is tolerated; everything else is a problem).
    const noisyMute = muteEvents.filter((e) => !e.startsWith("canvas-style"));
    if (noisyMute.length > 0) problems.push(`events(mute): ${noisyMute.join(" | ")}`);

    if (problems.length === 0) {
      console.log(`ok   ${name} (baseline drift ${baseMedian.toFixed(2)}, click interval ${clickInterval.toFixed(2)})`);
    } else {
      failures += 1;
      console.log(`FAIL ${name}:`);
      for (const line of problems) console.log(`     ${line}`);
    }
    await page.close();
  } finally {
    await browser.close();
    delete globalThis.__page;
  }
}

const desktop = { width: 1440, height: 810, deviceScaleFactor: 1 };
const mobile = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true };

await waitForServer(`${BASE}/projects/kitty-run`);
await scenario("souls desktop mute+mix", desktop, "?souls");
await scenario("souls mobile mute+mix", mobile, "?souls");
await scenario("pastel desktop mute+mix", desktop, "");
await scenario("pastel mobile mute+mix", mobile, "");

console.log(failures === 0 ? "audiobug: all clicks leave the page still (both themes)" : `audiobug: ${failures} shifting scenario(s)`);
process.exit(failures === 0 ? 0 : 1);

// WebKit (Safari engine) regression gate for the audio-button background
// jump: boots the Vite dev server, clicks the title (control), mute and mix
// in both orders, and diffs the WebGL canvas IN-PAGE per rAF (the page must
// run with ?preserve, which the probe appends). A header click must never
// disturb the drawing buffer: the click-frame canvas delta must stay at the
// baseline level.
//
//   node portfolio/projects/kitty-run/tests/kitty-run.webkit-shift.mjs
//
// Needs playwright with the WebKit build (`npx playwright install webkit`);
// skips cleanly when either is missing. Exit code 1 on a spike.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const viteJs = resolve(here, "../../../node_modules/vite/bin/vite.js");
const PORT = 5247;
const BASE = `http://localhost:${PORT}`;

const playwright = await import("playwright").catch(() => null);
if (!playwright) {
  console.log("webkit-shift: playwright not installed — skipping (npm i playwright + npx playwright install webkit)");
  process.exit(0);
}
const { webkit } = playwright;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, [viteJs, "--port", String(PORT), "--strictPort"], {
  cwd: shellDir, stdio: "ignore", detached: true,
});
process.on("exit", () => {
  try { process.kill(-server.pid); } catch { /* already gone */ }
});
for (let i = 0; i < 40; i++) {
  try { const r = await fetch(BASE); if (r.ok) break; } catch { /* not up yet */ }
  await wait(500);
}

const browser = await webkit.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
await page.goto(`${BASE}/projects/kitty-run/?preserve&souls`, {
  waitUntil: "networkidle", timeout: 60000,
});
await page.waitForSelector(".kitty-run-stage", { timeout: 20000 });
await wait(1200);

// Per-rAF in-page canvas diff: no screenshots (their capture suspends rAF
// in WebKit and poisons the intervals).
const probe = await page.evaluate(async () => {
  const canvas = document.querySelector(".kitty-run-stage canvas");
  const c2 = document.createElement("canvas");
  c2.width = canvas.width;
  c2.height = canvas.height;
  const ctx = c2.getContext("2d", { willReadFrequently: true });
  let prev = null;
  const frames = [];
  window.__rec = true;
  const tick = () => {
    if (!window.__rec) return;
    ctx.drawImage(canvas, 0, 0);
    const d = ctx.getImageData(0, 0, c2.width, c2.height).data;
    let mean = -1;
    if (prev) {
      let t = 0, n = 0;
      for (let i = 0; i < d.length; i += 40) {
        t += Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]);
        n += 1;
      }
      mean = t / (n * 3);
    }
    prev = d.slice();
    frames.push({ t: performance.now(), d: mean });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
  const clickAndMeasure = async (selector) => {
    const before = frames.length;
    await waitMs(500);
    document.querySelector(selector).click();
    await waitMs(700);
    let max = 0;
    for (let i = Math.max(1, before - 2); i < frames.length; i += 1) {
      if (frames[i].d > max) max = frames[i].d;
    }
    return max;
  };
  const out = {
    title: await clickAndMeasure(".kitty-run-title"),
    mute1: await clickAndMeasure(".kitty-run-mute"),
    mute2: await clickAndMeasure(".kitty-run-mute"),
    mix1: await clickAndMeasure(".kitty-run-mix"),
    mix2: await clickAndMeasure(".kitty-run-mix"),
  };
  window.__rec = false;
  const all = frames.filter((f) => f.d >= 0).map((f) => f.d).sort((a, b) => a - b);
  out.median = all[Math.floor(all.length / 2)];
  return out;
});

const { median, title, mute1, mute2, mix1, mix2 } = probe;
const limit = median * 3 + 0.5;
const rows = [
  ["title (control)", title],
  ["mute 1", mute1],
  ["mute 2", mute2],
  ["mix 1", mix1],
  ["mix 2", mix2],
];
let failures = 0;
for (const [label, value] of rows) {
  const ok = value <= limit;
  if (!ok) failures += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(16)} click-frame delta ${value.toFixed(2)} (limit ${limit.toFixed(2)}, baseline median ${median.toFixed(2)})`);
}
await browser.close();
console.log(failures === 0 ? "webkit-shift: the drawing buffer stays still across header clicks" : `webkit-shift: ${failures} spike(s)`);
process.exit(failures === 0 ? 0 : 1);

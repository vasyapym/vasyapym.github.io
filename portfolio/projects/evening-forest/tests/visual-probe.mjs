// One-off visual probe: enters the forest, captures the ground up close at
// several times of day. Run: node probe.mjs
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5198;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "/tmp/ef-probe";
const { mkdirSync } = await import("node:fs");
mkdirSync(OUT, { recursive: true });

const candidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(existsSync);
if (!candidates.length) {
  console.error("no chrome");
  process.exit(1);
}
const { default: puppeteer } = await import("puppeteer-core");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await wait(500);
  }
  throw new Error("dev server never came up");
}

const server = spawn(
  process.execPath,
  [
    resolve(shellDir, "../node_modules/vite/bin/vite.js"),
    "--host", "0.0.0.0",
    "--port", String(PORT),
    "--strictPort",
  ],
  { cwd: shellDir, stdio: "ignore", detached: true, env: process.env },
);
process.on("exit", () => { try { process.kill(-server.pid); } catch {} });

await waitForServer(BASE);
const browser = await puppeteer.launch({
  executablePath: candidates[0],
  headless: "new",
  args: ["--no-first-run"],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 700 });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.error("CONSOLE ERROR:", m.text());
});

await page.goto(`${BASE}/projects/evening-forest`, {
  waitUntil: "networkidle0",
  timeout: 45000,
});
await wait(2500);
await page.click(".evening-forest-enter");
await wait(1200);

// Look down at the ground: pointer lock needs a gesture; use the drag-look
// path instead — desktop uses pointer lock, so simulate via mouse drag on
// the canvas? PointerLockControls needs lock; instead evaluate JS to tilt
// the camera through the uniform? Simplest: drag with mouse (desktop page
// uses pointer lock on click — already locked after click? click entered).
// After lock, mousemove rotates the camera.
await page.mouse.move(450, 350);
await page.mouse.down?.();
// big downward drag
for (let i = 0; i < 20; i += 1) {
  await page.mouse.move(450, 350 + i * 18);
  await wait(16);
}
await page.mouse.up?.();
await wait(800);
await page.screenshot({ path: `${OUT}/1-ground-golden.png` });

// Slide time: 27 steps ×0.02 ≈ t0.54 (night), then far past the end
// (clamps to sunrise) — the two contrast anchors of the dial.
for (let i = 0; i < 27; i += 1) await page.keyboard.press("BracketRight");
await wait(600);
await page.screenshot({ path: `${OUT}/2-ground-night.png` });
for (let i = 0; i < 90; i += 1) await page.keyboard.press("BracketRight");
await wait(600);
await page.screenshot({ path: `${OUT}/3-ground-sunrise.png` });

// Look back up toward the vista, then open the fox-mind HUD.
for (let i = 0; i < 14; i += 1) {
  await page.mouse.move(450, 350 - i * 22);
  await wait(16);
}
await page.keyboard.press("KeyM");
await wait(900);
console.log("fox-mind panel in DOM:", !!(await page.$(".ef-fox-mind")));
await page.screenshot({ path: `${OUT}/4-fox-mind.png` });

await browser.close();
process.kill(-server.pid);
console.log("probe done ->", OUT);

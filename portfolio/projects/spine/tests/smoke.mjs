// Browser smoke test for Spine, run against a real Chromium. Self-contained:
// boots the Vite dev server on a scratch port, opens /projects/spine/, waits
// for the Go wasm engine to bind, then exercises the inspector, the toolbar,
// undo/redo and the code output — and fails on any console or page error.
//
//   node portfolio/projects/spine/tests/smoke.mjs
//
// Uses the system Chrome via puppeteer-core (no browser download). Skips
// cleanly when no Chrome is available so the command stays safe on headless
// machines. HTML5 drag-and-drop is intentionally not simulated here — the
// synthetic event machinery required to make it fire is notoriously
// browser-specific; the rest of the mutation surface is covered.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5231;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "spine-smoke");
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
  console.log("spine smoke: no Chrome/Chromium found — skipping (set CHROME_PATH to run)");
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

const server = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(PORT), "--strictPort"],
  { cwd: shellDir, stdio: "ignore", detached: true },
);
process.on("exit", () => {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
});

let failed = false;
let browser = null;
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);
setTimeout(() => {
  console.error("spine smoke: WATCHDOG — 120s elapsed, aborting");
  process.exit(2);
}, 120000).unref();
try {
  log("waiting for dev server");
  await waitForServer(BASE);
  log("dev server up");

  log("launching browser");
  const headlessMode = executablePath.includes("chrome-headless-shell") ? "shell" : "new";
  browser = await puppeteer.launch({
    executablePath,
    headless: headlessMode,
    args: ["--no-first-run"],
  });
  log("browser launched");
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const problems = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  });

  await page.goto(`${BASE}/projects/spine/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  log("page loaded");

  // Wait for the Go engine to bind and render.
  await page.waitForFunction(() => window.spineReady === true, { timeout: 30000, polling: 250 });
  log("engine ready");
  await page.waitForSelector("#spine-canvas .node", { timeout: 10000 });

  const countNodes = () =>
    page.$$eval("#spine-canvas .node", (els) => els.length).catch(() => -1);

  const initial = await countNodes();
  if (initial < 4) throw new Error(`demo tree did not render (nodes: ${initial})`);

  // --- add items via the toolbar -------------------------------------------
  await page.click("#spine-btn-add-item");
  await page.click("#spine-btn-add-item");
  const afterAdd = await countNodes();
  if (afterAdd !== initial + 2) {
    throw new Error(`add-item expected ${initial + 2} nodes, got ${afterAdd}`);
  }

  // --- code output reflects the tree ---------------------------------------
  const codeHtml = await page.$eval("#spine-code-html", (el) => el.textContent);
  if (!codeHtml || !codeHtml.includes("box-1") || !codeHtml.includes("item-")) {
    throw new Error(`code output missing expected classes:\n${codeHtml}`);
  }

  // --- inspector: flip the root to grid ------------------------------------
  // (clicking geometrically could hit a child node covering the root's
  // centre — dispatch the click on the root element itself instead)
  await page.evaluate(() => {
    document
      .querySelector("#spine-canvas > .node")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(100);
  await page.select("#spine-f-mode", "grid");
  await wait(200);
  const rootDisplay = await page.$eval("#spine-canvas > .node", (el) => el.style.display);
  if (rootDisplay !== "grid") {
    throw new Error(`mode toggle failed — root display is "${rootDisplay}"`);
  }
  const gridPanelHidden = await page.$eval("#spine-panel-grid", (el) =>
    el.classList.contains("hidden"),
  );
  if (gridPanelHidden) throw new Error("grid panel stayed hidden after mode toggle");

  // --- undo / redo ----------------------------------------------------------
  await page.click("#spine-btn-undo");
  await wait(200);
  const undoneDisplay = await page.$eval("#spine-canvas > .node", (el) => el.style.display);
  if (undoneDisplay !== "flex") {
    throw new Error(`undo failed — root display is "${undoneDisplay}"`);
  }
  const redoDisabled = await page.$eval("#spine-btn-redo", (el) => el.disabled);
  if (redoDisabled) throw new Error("redo button disabled though a redo exists");
  await page.click("#spine-btn-redo");
  await wait(200);
  const redoneDisplay = await page.$eval("#spine-canvas > .node", (el) => el.style.display);
  if (redoneDisplay !== "grid") {
    throw new Error(`redo failed — root display is "${redoneDisplay}"`);
  }

  // --- shareable hash --------------------------------------------------------
  const hash = await page.evaluate(() => window.location.hash);
  if (hash.length < 20) throw new Error(`URL hash too short: "${hash}"`);

  // --- delete + undo restores ------------------------------------------------
  const beforeDelete = await countNodes();
  await page.click("#spine-canvas .node.item");
  await page.click("#spine-btn-delete");
  await wait(200);
  const afterDelete = await countNodes();
  if (afterDelete !== beforeDelete - 1) {
    throw new Error(`delete expected ${beforeDelete - 1} nodes, got ${afterDelete}`);
  }
  await page.click("#spine-btn-undo");
  await wait(200);
  const afterUndoDelete = await countNodes();
  if (afterUndoDelete !== beforeDelete) {
    throw new Error(`delete undo expected ${beforeDelete} nodes, got ${afterUndoDelete}`);
  }

  await page.screenshot({ path: join(SHOTS, "spine.png"), fullPage: false });

  log("all steps done");
  await browser.close();
  browser = null;

  if (problems.length > 0) {
    console.error("spine smoke: page reported problems:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(`spine smoke: ok (${initial} → ${afterAdd} nodes, grid toggle, undo/redo, hash, screenshots in ${SHOTS})`);
} catch (err) {
  failed = true;
  console.error(`spine smoke: FAILED — ${err.message}`);
  process.exitCode = 1;
} finally {
  try {
    if (browser) await browser.close();
  } catch {
    /* already closed */
  }
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
}

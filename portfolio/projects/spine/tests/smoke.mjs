// Browser smoke test for Spine, run against a real Chromium. Self-contained:
// boots the Vite dev server on a scratch port, opens /projects/spine/, waits
// for the Go wasm engine to bind, then exercises the inspector, the toolbar,
// undo/redo, the code output, the selection echo in the heading, the mobile
// modebar (both panes must stay mounted) and a 390px rebind pass — and fails
// on any console or page error.
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

  // --- wrap default: many items must stay inside the root --------------------
  // (selection is root at this point; put it back into flex mode first)
  await page.evaluate(() => {
    document
      .querySelector("#spine-canvas > .node")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.select("#spine-f-mode", "flex");
  await wait(150);
  for (let i = 0; i < 20; i += 1) {
    await page.click("#spine-btn-add-item");
  }
  const overflow = await page.$eval(
    "#spine-canvas > .node",
    (el) => el.scrollWidth - el.clientWidth,
  );
  if (overflow > 2) {
    throw new Error(`root overflows horizontally by ${overflow}px — flex-wrap default broken`);
  }

  // --- drag feedback + a synthetic drop must actually re-nest -----------------
  const childIds = () =>
    page.$$eval("#spine-canvas > .node > .node", (els) => els.map((e) => e.dataset.id));
  const before = await childIds();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    const src = document.querySelector("#spine-canvas > .node > .node");
    const target = document.querySelectorAll("#spine-canvas > .node > .node")[2];
    src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
    target.dispatchEvent(
      new DragEvent("dragover", { bubbles: true, dataTransfer: dt, cancelable: true }),
    );
  });
  const srcDragging = await page.$eval("#spine-canvas > .node > .node", (el) =>
    el.classList.contains("dragging"),
  );
  if (!srcDragging) throw new Error("dragged source did not get .dragging");
  const targetMarked = await page.$eval(
    "#spine-canvas > .node > .node:nth-child(3)",
    (el) => el.classList.contains("drop-target"),
  );
  if (!targetMarked) throw new Error("drop target did not get .drop-target");
  await page.evaluate(() => {
    const dt = new DataTransfer();
    const target = document.querySelectorAll("#spine-canvas > .node > .node")[2];
    target.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: dt, cancelable: true }),
    );
  });
  const after = await childIds();
  if (after.length !== before.length || JSON.stringify(after) === JSON.stringify(before)) {
    throw new Error(`drop did not re-nest: before=${before} after=${after}`);
  }
  const leftover = await page.$$eval(
    "#spine-canvas .dragging, #spine-canvas .drop-target",
    (els) => els.length,
  );
  if (leftover !== 0) throw new Error(`${leftover} drag marker classes survived the drop`);

  // --- Start Anew: reset → demo tree (6 nodes, flex), undo restores ---------
  const preResetCount = await countNodes();
  await page.click("#spine-btn-reset");
  await wait(200);
  const resetCount = await countNodes();
  if (resetCount !== 6) {
    throw new Error(`Start Anew: expected 6 nodes after reset, got ${resetCount}`);
  }
  const rootMode = await page.$eval("#spine-f-mode", (el) => el.value);
  if (rootMode !== "flex") {
    throw new Error(`Start Anew: expected root mode 'flex', got '${rootMode}'`);
  }
  await page.click("#spine-btn-undo");
  await wait(200);
  const undoneCount = await countNodes();
  if (undoneCount !== preResetCount) {
    throw new Error(`Start Anew undo: expected ${preResetCount} nodes, got ${undoneCount}`);
  }

  await page.screenshot({ path: join(SHOTS, "spine.png"), fullPage: false });

  // --- selection echo in the Inspector heading --------------------------------
  await page.evaluate(() => {
    const root = document.querySelector("#spine-canvas > .node");
    const inner = root.querySelector(":scope > .node.container");
    inner.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(150);
  const selLabel = await page.$eval("#spine-sel-label", (el) => el.textContent);
  if (selLabel !== "container") {
    throw new Error(`selection label is "${selLabel}", expected "container"`);
  }
  await page.evaluate(() => {
    document
      .querySelector("#spine-canvas > .node")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(150);
  const rootSelLabel = await page.$eval("#spine-sel-label", (el) => el.textContent);
  if (rootSelLabel !== "root") {
    throw new Error(`selection label is "${rootSelLabel}", expected "root"`);
  }

  // --- modebar: toggles data-mode, every pane id stays mounted ----------------
  await page.evaluate(() => {
    document
      .querySelector(".spine-modebar button[aria-pressed='false']")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(100);
  const modeAfter = await page.$eval(".spine-root", (el) => el.dataset.mode);
  if (modeAfter !== "code") {
    throw new Error(`modebar toggle failed — data-mode is "${modeAfter}"`);
  }
  const idsIntact = await page.evaluate(() =>
    ["spine-canvas", "spine-f-mode", "spine-code-html", "spine-btn-add-item"].every(
      (id) => !!document.getElementById(id),
    ),
  );
  if (!idsIntact) throw new Error("pane ids disappeared after mode switch");
  await page.evaluate(() => {
    document
      .querySelector(".spine-modebar button[aria-pressed='false']")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(100);
  const modeBack = await page.$eval(".spine-root", (el) => el.dataset.mode);
  if (modeBack !== "design") {
    throw new Error(`modebar toggle-back failed — data-mode is "${modeBack}"`);
  }

  // --- mobile pass: 390px, both modes ------------------------------------------
  // (the wasm module survives the reload; the page re-binds via spineRebind,
  // which is itself the SPA-remount path worth exercising here)
  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.spineReady === true, {
    timeout: 30000,
    polling: 250,
  });
  await wait(300);
  const mobileNodes = await countNodes();
  if (mobileNodes < 4) {
    throw new Error(`mobile rebind lost the tree (nodes: ${mobileNodes})`);
  }
  await page.screenshot({ path: join(SHOTS, "spine-mobile-design.png"), fullPage: true });
  await page.evaluate(() => {
    document
      .querySelector(".spine-modebar button[aria-pressed='false']")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await wait(200);
  await page.screenshot({ path: join(SHOTS, "spine-mobile-code.png"), fullPage: true });

  log("all steps done");
  await browser.close();
  browser = null;

  if (problems.length > 0) {
    console.error("spine smoke: page reported problems:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `spine smoke: ok (${initial} → ${afterAdd} nodes, grid toggle, undo/redo, hash, sel-label, modebar, mobile shots in ${SHOTS})`,
  );
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

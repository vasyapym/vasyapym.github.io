// Browser check for Practice Map: deep-lesson reader, mobile overlay fit,
// fragment-tab fallback, keyboard nav, touch-visible copy buttons.
//
//   node projects/practice-map/tests/practice-map.check.mjs   (from portfolio/)
//
// Self-contained: boots the Vite dev server on a scratch port, drives the page
// in headless system Chrome via puppeteer-core, fails on any console error,
// horizontal overflow, or panel that escapes the viewport.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5198;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "practice-map-check");
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
  console.log("practice-map check: no Chrome/Chromium found — skipping");
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

try {
  await waitForServer(`${BASE}/projects/practice-map`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run"],
  });
  const problems = [];
  const check = (ok, label) => {
    if (!ok) problems.push(`assert: ${label}`);
    console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  };
  const shot = (name) => page.screenshot({ path: join(SHOTS, `${name}.png`) });
  const appears = (selector, timeout = 30000) =>
    page.waitForSelector(selector, { timeout }).then(() => true).catch(() => false);

  const consoleProblems = [];
  const attachConsole = (page) => {
    page.on("pageerror", (err) => consoleProblems.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleProblems.push(`console.error: ${msg.text()}`);
    });
  };

  // --- desktop: deep reader ------------------------------------------------

  let page = await browser.newPage();
  attachConsole(page);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/projects/practice-map`, { waitUntil: "networkidle0", timeout: 45000 });

  check(await appears(".practice-topic-card"), "map renders");
  const cardCount = await page.$$eval(".practice-topic-card", (cards) => cards.length);
  check(cardCount === 20, `20 topic cards render (${cardCount})`);

  await page.click(".practice-topic-card .practice-lesson-open");
  check(await appears(".practice-reader"), "deep reader opens for lesson 01");
  check(await appears(".practice-lesson-progress span"), "progress hairline mounts");

  const chipCount = await page.$$eval(".practice-reader-nav button", (b) => b.length);
  check(chipCount >= 10, `section nav lists all sections (${chipCount})`);

  const typography = await page.evaluate(() => {
    const reader = document.querySelector(".practice-reader");
    return {
      figures: reader.querySelectorAll(".practice-example").length,
      pre: reader.querySelectorAll("pre").length,
      callouts: reader.querySelectorAll(".practice-callout").length,
      code: reader.querySelectorAll("p > code, li > code, aside code").length,
      bold: reader.querySelectorAll("strong").length,
    };
  });
  check(
    typography.figures >= 4 && typography.pre >= 4,
    `code examples render (figures=${typography.figures}, pre=${typography.pre})`,
  );
  check(typography.callouts >= 2, `callouts render (${typography.callouts})`);
  check(
    typography.code >= 5 && typography.bold >= 3,
    `inline markup renders (code=${typography.code}, strong=${typography.bold})`,
  );
  await shot("desktop-deep-typography");

  const fitsDesktop = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
  check(fitsDesktop, "panel fits viewport at 1440px");

  const beforeScroll = await page.evaluate(() => document.querySelector(".practice-lesson-panel").scrollTop);
  await page.click(".practice-reader-nav button:nth-child(6)");
  await wait(900);
  const afterScroll = await page.evaluate(() => document.querySelector(".practice-lesson-panel").scrollTop);
  check(afterScroll > beforeScroll + 100, "section chip scrolls the panel");

  const activeIndex = await page.$$eval(
    ".practice-reader-nav button",
    (buttons) => buttons.findIndex((b) => b.classList.contains("is-active")),
  );
  check(activeIndex === 5, `scrolled section becomes active chip (${activeIndex})`);

  await page.keyboard.press("ArrowRight");
  await wait(700);
  const arrowIndex = await page.$$eval(
    ".practice-reader-nav button",
    (buttons) => buttons.findIndex((b) => b.classList.contains("is-active")),
  );
  check(arrowIndex === 6, "ArrowRight advances sections");

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes the lesson");

  // --- desktop: fragment fallback -------------------------------------------

  // card 6 (linux-users-groups) is the first remaining fragment card — cards
  // 1-5 are deep lessons since the long-form md course landed.
  const cards = await page.$$(".practice-topic-card .practice-lesson-open");
  await cards[5].click();
  check(await appears(".practice-lesson-tabs"), "fragment lesson still uses tabs");
  check((await page.$(".practice-reader")) === null, "fragment lesson renders no reader");
  await page.keyboard.press("Escape");
  await wait(300);

  // --- desktop: concept graph ------------------------------------------------

  await page.click(".practice-graph-open");
  check(await appears(".practice-graph-overlay"), "concept graph opens");

  const nodeCount = await page.$$eval(".practice-graph-node", (n) => n.length);
  check(nodeCount === 28, `graph renders 28 nodes (${nodeCount})`);

  const nodesInside = await page.evaluate(() => {
    const canvas = document.querySelector(".practice-graph-canvas").getBoundingClientRect();
    return Array.from(document.querySelectorAll(".practice-graph-node")).every((n) => {
      const r = n.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return cx >= canvas.left - 2 && cx <= canvas.right + 2 && cy >= canvas.top - 2 && cy <= canvas.bottom + 2;
    });
  });
  check(nodesInside, "all node centers sit inside the canvas");

  const emptyReadout = await page.$eval(".practice-graph-readout", (el) => el.textContent);
  check(emptyReadout.includes("drag a node"), "readout shows the empty hint first");

  // Hover node 0: connections light up.
  const pipeBox = await page.$eval(".practice-graph-node", (n) => {
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, nodeX: getComputedStyle(n).getPropertyValue("--node-x") };
  });
  await page.mouse.move(pipeBox.x, pipeBox.y);
  await wait(400);
  const edgeCount = await page.$$eval(".practice-graph-edges line", (l) => l.length);
  check(edgeCount >= 1, `hovering a node draws its edges (${edgeCount})`);
  const edgeStroke = await page.$eval(".practice-graph-edges line", (l) => getComputedStyle(l).stroke);
  check(edgeStroke !== "none" && edgeStroke !== "", `edge stroke resolves (${edgeStroke})`);
  const activeReadout = await page.$eval(".practice-graph-readout", (el) => el.textContent);
  check(activeReadout.includes("topics"), `readout inspects the active concept (${activeReadout.slice(0, 60)})`);

  // Drag the node: it moves, edges follow, readout stays.
  await page.mouse.down();
  await page.mouse.move(pipeBox.x + 160, pipeBox.y + 90, { steps: 8 });
  await page.mouse.up();
  await wait(300);
  const pipeAfter = await page.$eval(".practice-graph-node", (n) => getComputedStyle(n).getPropertyValue("--node-x"));
  check(pipeAfter !== pipeBox.nodeX, `dragging moves the node (${pipeBox.nodeX} -> ${pipeAfter})`);
  const edgesAfterDrag = await page.$$eval(".practice-graph-edges line", (l) => l.length);
  check(edgesAfterDrag >= 1, "edges follow the dragged node");
  check(await appears(".practice-graph-node.is-dimmed"), "unrelated nodes dim while a node is active");

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-graph-overlay")) === null, "Escape closes the graph");

  await page.close();

  // --- mobile: fit, reachability, touch affordances -------------------------

  const walkHorizontalEscape = () =>
    page.evaluate(() => {
      const panel = document.querySelector(".practice-lesson-panel");
      if (!panel) return ["panel missing"];
      const escapes = [];
      for (const element of panel.querySelectorAll("*")) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.right <= window.innerWidth + 1 && rect.left >= -1) continue;
        // Anything clipped by a scrollable/hiding ancestor is reachable by
        // scrolling that container (reader chips, code blocks) — not a leak.
        let clipped = false;
        for (let node = element.parentElement; node && node !== panel; node = node.parentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") {
            clipped = true;
            break;
          }
        }
        if (!clipped) {
          escapes.push(
            `${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]} right=${Math.round(rect.right)} left=${Math.round(rect.left)}`,
          );
        }
      }
      return escapes;
    });

  page = await browser.newPage();
  attachConsole(page);
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(`${BASE}/projects/practice-map`, { waitUntil: "networkidle0", timeout: 45000 });

  const noOverflowPage = await page.evaluate(
    () => document.scrollingElement.scrollWidth <= window.innerWidth,
  );
  check(noOverflowPage, "no horizontal overflow on the map at 390px");

  await page.tap(".practice-topic-card .practice-lesson-open");
  check(await appears(".practice-reader"), "deep reader opens on mobile");

  const fitsMobile = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return rect.top >= 0
      && rect.bottom <= window.innerHeight + 1
      && rect.left >= -1
      && rect.right <= window.innerWidth + 1;
  });
  check(fitsMobile, "panel fits the viewport on both axes at 390px (the reported bug)");

  await page.evaluate(() => {
    const panel = document.querySelector(".practice-lesson-panel");
    panel.scrollTop = panel.scrollHeight;
  });
  await wait(600);
  const bottomReachable = await page.evaluate(() => {
    const panel = document.querySelector(".practice-lesson-panel");
    const footer = document.querySelector(".practice-lesson-footer");
    const rect = footer.getBoundingClientRect();
    return rect.top < window.innerHeight && panel.scrollTop > 0;
  });
  check(bottomReachable, "examples/references reachable by scrolling");
  await shot("mobile-deep-bottom");

  const progressBar = await page.evaluate(() => {
    const span = document.querySelector(".practice-lesson-progress span");
    return span ? span.style.transform : "";
  });
  check(progressBar.includes("scaleX(1") || progressBar.includes("scaleX(0.9"), `progress fills after full scroll (${progressBar})`);

  const copyVisible = await page.evaluate(() => {
    const button = document.querySelector(".practice-example-copy");
    return button ? getComputedStyle(button).opacity === "1" : false;
  });
  check(copyVisible, "copy button visible without hover on touch");

  const noOverflowOverlay = await page.evaluate(
    () => document.querySelector(".practice-lesson-overlay").scrollWidth <= window.innerWidth,
  );
  check(noOverflowOverlay, "no horizontal overflow inside the overlay");

  const escapes390 = await walkHorizontalEscape();
  check(escapes390.length === 0, `no descendant escapes the panel at 390px${escapes390.length ? `: ${escapes390.slice(0, 4).join(" | ")}` : ""}`);

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes on mobile too");

  // --- mobile: the map is a full-height sheet with a usable canvas ----------

  await page.tap(".practice-graph-open");
  check(await appears(".practice-graph-overlay"), "concept graph opens on mobile");

  const sheetFit = await page.evaluate(() => {
    const panel = document.querySelector(".practice-graph-panel").getBoundingClientRect();
    const canvas = document.querySelector(".practice-graph-canvas").getBoundingClientRect();
    return {
      panelFits: panel.top >= -1 && panel.bottom <= window.innerHeight + 1 && panel.left >= -1 && panel.right <= window.innerWidth + 1,
      panelTall: panel.height >= window.innerHeight * 0.8,
      canvasBig: canvas.height >= window.innerHeight * 0.55,
    };
  });
  check(sheetFit.panelFits, "graph sheet fits the viewport at 390px");
  check(sheetFit.panelTall, `graph sheet is near full height (${Math.round(sheetFit.panelTall)})`);
  check(sheetFit.canvasBig, `graph canvas fills ≥55vh on mobile (${Math.round(sheetFit.canvasBig)})`);

  const noOverflowGraph = await page.evaluate(
    () => document.querySelector(".practice-graph-overlay").scrollWidth <= window.innerWidth,
  );
  check(noOverflowGraph, "no horizontal overflow inside the graph sheet");

  // Tap a node: it activates and the readout inspects it.
  await page.tap(".practice-graph-node");
  await wait(400);
  const mobileReadout = await page.$eval(".practice-graph-readout", (el) => el.textContent);
  check(mobileReadout.includes("topics") || mobileReadout.includes("topic"), `tap inspects a concept (${mobileReadout.slice(0, 50)})`);

  const canvasStable = await page.$eval(
    ".practice-graph-canvas",
    (el) => el.getBoundingClientRect().height,
  );

  // Touch-drag: the node moves with the finger. The box is read AFTER the
  // tap — measuring earlier races the sheet's layout settle.
  const nodeBox = await page.$eval(".practice-graph-node", (n) => {
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, nodeX: getComputedStyle(n).getPropertyValue("--node-x") };
  });

  // Touch-drag: the node moves with the finger.
  await page.touchscreen.touchStart(nodeBox.x, nodeBox.y);
  await page.touchscreen.touchMove(nodeBox.x - 60, nodeBox.y - 80);
  await page.touchscreen.touchMove(nodeBox.x - 120, nodeBox.y - 140);
  await page.touchscreen.touchEnd();
  await wait(300);
  const nodeAfterDrag = await page.$eval(".practice-graph-node", (n) => getComputedStyle(n).getPropertyValue("--node-x"));
  check(nodeAfterDrag !== nodeBox.nodeX, `touch-drag moves the node (${nodeBox.nodeX} -> ${nodeAfterDrag})`);

  const canvasAfterDrag = await page.$eval(
    ".practice-graph-canvas",
    (el) => el.getBoundingClientRect().height,
  );
  check(Math.abs(canvasAfterDrag - canvasStable) < 2, "inspecting a node never resizes the canvas");

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-graph-overlay")) === null, "Escape closes the graph on mobile");

  // --- narrow phone (iPhone SE class): the real-device regression ------------

  await page.setViewport({
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.reload({ waitUntil: "networkidle0", timeout: 45000 });

  const noOverflowNarrow = await page.evaluate(
    () => document.scrollingElement.scrollWidth <= window.innerWidth,
  );
  check(noOverflowNarrow, "no horizontal overflow on the map at 320px");

  await page.tap(".practice-topic-card .practice-lesson-open");
  check(await appears(".practice-reader"), "deep reader opens at 320px");

  const fitsNarrow = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return (
      rect.top >= -1 &&
      rect.bottom <= window.innerHeight + 1 &&
      rect.left >= -1 &&
      rect.right <= window.innerWidth + 1
    );
  });
  check(fitsNarrow, "panel fits the viewport on both axes at 320px");

  const escapesNarrow = await walkHorizontalEscape();
  check(escapesNarrow.length === 0, `no descendant escapes the panel at 320px${escapesNarrow.length ? `: ${escapesNarrow.slice(0, 4).join(" | ")}` : ""}`);
  await shot("narrow-deep-top");

  await page.evaluate(() => {
    const panel = document.querySelector(".practice-lesson-panel");
    panel.scrollTop = panel.scrollHeight;
  });
  await wait(600);
  const escapesNarrowBottom = await walkHorizontalEscape();
  check(escapesNarrowBottom.length === 0, "no descendant escapes the panel at 320px after full scroll");
  await shot("narrow-deep-bottom");

  // --- narrow phone: graph sheet stays usable -------------------------------

  await page.keyboard.press("Escape");
  await wait(300);
  await page.tap(".practice-graph-open");
  check(await appears(".practice-graph-overlay"), "graph opens at 320px");
  const narrowGraph = await page.evaluate(() => ({
    noOverflow: document.querySelector(".practice-graph-overlay").scrollWidth <= window.innerWidth,
    fits: (() => {
      const r = document.querySelector(".practice-graph-panel").getBoundingClientRect();
      return r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.left >= -1 && r.right <= window.innerWidth + 1;
    })(),
    canvasBig: document.querySelector(".practice-graph-canvas").getBoundingClientRect().height >= window.innerHeight * 0.5,
  }));
  check(narrowGraph.noOverflow, "no horizontal overflow in the graph at 320px");
  check(narrowGraph.fits, "graph sheet fits the viewport at 320px");
  check(narrowGraph.canvasBig, "graph canvas still fills the sheet at 320px");
  await shot("narrow-graph");
  await page.keyboard.press("Escape");
  await wait(300);
  check((await page.$(".practice-graph-overlay")) === null, "Escape closes the graph at 320px");

  await page.close();
  await browser.close();

  problems.push(...consoleProblems);

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(` - ${p}`);
    console.error(`\nScreenshots: ${SHOTS}`);
    process.exit(1);
  }
  console.log(`\nPractice Map check passed. Screenshots: ${SHOTS}`);
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
}

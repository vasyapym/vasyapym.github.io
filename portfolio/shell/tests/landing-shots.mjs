// Visual probe for the landing page: boots the Vite dev server on a scratch
// port, scrolls the project grid into view so the reveal animations fire,
// then photographs the cards at desktop and phone sizes.
//
//   node portfolio/shell/tests/landing-shots.mjs [outDir]
//
// Uses the system Chrome/Edge via puppeteer-core (no browser download).
// Set CHROME_PATH to point at a specific binary; skips cleanly when no
// browser is available.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const PORT = 5218;
const BASE = `http://localhost:${PORT}`;
const outDir = process.argv[2] || join(tmpdir(), "landing-shots");
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
  console.log("shots: no Chrome/Chromium found — skipping (set CHROME_PATH)");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");

// Vite dev server on a scratch port. Spawn vite's JS entry through this
// node process directly — going through npx leaves the vite child alive
// after SIGTERM and the scratch port stays occupied.
const viteJs = resolve(shellDir, "../node_modules/vite/bin/vite.js");
const server = spawn(
  process.execPath,
  [viteJs, "--port", String(PORT), "--strictPort"],
  {
    cwd: shellDir,
    stdio: ["ignore", "pipe", "pipe"],
  },
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

const scrollThrough = async (page) => {
  // Walk the page so the scroll-position reveal sweep fires for every card,
  // then settle back at the projects section.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  await new Promise((r) => setTimeout(r, 900));
};

try {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath,
    headless: "shell",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  // Desktop
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktop.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await desktop.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 1600));
  await desktop.screenshot({ path: join(outDir, "desktop-hero.png") });
  await scrollThrough(desktop);
  const grid = await desktop.$("#projects");
  await grid.screenshot({ path: join(outDir, "desktop-cards.png") });
  await desktop.screenshot({ path: join(outDir, "desktop-full.png"), fullPage: true });

  // Hover state on the first card
  await desktop.evaluate(() => {
    document.querySelector(".signal-index-card")?.scrollIntoView({ block: "center" });
  });
  await new Promise((r) => setTimeout(r, 700));
  const firstCard = await desktop.$(".signal-index-card");
  await firstCard.hover();
  await new Promise((r) => setTimeout(r, 500));
  await grid.screenshot({ path: join(outDir, "desktop-cards-hover.png") });

  // Mobile
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobile.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await scrollThrough(mobile);
  await mobile.screenshot({ path: join(outDir, "mobile-full.png"), fullPage: true });

  // Reduced motion: same walk + full-grid capture as the desktop path, so no
  // card is cropped out of the evidence.
  const reduced = await browser.newPage();
  await reduced.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await reduced.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await reduced.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await reduced.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 800));
  await scrollThrough(reduced);
  const reducedGrid = await reduced.$("#projects");
  await reducedGrid.screenshot({ path: join(outDir, "desktop-reduced-motion.png") });

  await browser.close();
  console.log(`shots: wrote ${outDir}`);
} finally {
  server.kill("SIGTERM");
}

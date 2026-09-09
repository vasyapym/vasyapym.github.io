// Screenshot probe for the realm: captures the enter flood mid-flight, the
// active abyss, a stirred lantern wake near a creature, the open panel and
// the mobile abyss. Same harness as landing-shots.mjs.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const PORT = 5222;
const BASE = `http://localhost:${PORT}`;
const outDir = process.argv[2] || join(tmpdir(), "realm-shots");
mkdirSync(outDir, { recursive: true });

const CHROME = process.env.CHROME_PATH ??
  "/Users/vasilij/Library/Caches/ms-playwright/chromium-1134/chrome-mac/Chromium.app/Contents/MacOS/Chromium";
if (!existsSync(CHROME)) { console.log("no chrome"); process.exit(0); }
const { default: puppeteer } = await import("puppeteer-core");

const viteJs = resolve(shellDir, "../node_modules/vite/bin/vite.js");
const server = spawn(process.execPath, [viteJs, "--port", String(PORT), "--strictPort"],
  { cwd: shellDir, stdio: "ignore" });
for (let i = 0; i < 120; i++) { try { const r = await fetch(BASE); if (r.ok) break; } catch {} await new Promise(r => setTimeout(r, 250)); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// the strip only exists past the threshold section: scroll there, await it, click
const revealAndEnter = async (page) => {
  await page.evaluate(() => {
    const t = document.querySelector(".realm-threshold");
    const bottom = t
      ? Math.ceil(t.getBoundingClientRect().bottom + window.scrollY)
      : window.scrollY;
    window.scrollTo({ top: bottom + 80, behavior: "instant" });
  });
  await wait(700);
  await page.evaluate(() => {
    document.querySelector(".realm-enter-chip")?.click();
  });
};

try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell", args: ["--no-sandbox", "--hide-scrollbars"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
  await wait(600);

  await revealAndEnter(page);
  await wait(420);
  await page.screenshot({ path: join(outDir, "1-flood.png") });
  await wait(1400); // active
  await page.screenshot({ path: join(outDir, "2-active.png") });

  // stir the wake and swim toward the first creature (raft at fx .25, fy .26 → upper-left of view 1)
  await page.mouse.move(900, 700);
  for (let i = 0; i < 14; i++) {
    await page.mouse.move(900 - i * 32, 700 - i * 26);
    await wait(28);
  }
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(430 + i * 6, 430 - i * 10);
    await wait(30);
  }
  await wait(350);
  await page.screenshot({ path: join(outDir, "3-wake.png") });

  await wait(500);
  await page.screenshot({ path: join(outDir, "4-approach.png") });

  // open a panel from the legend (raft)
  await page.evaluate(() => document.querySelectorAll(".realm-legend-btn")[0]?.click());
  await wait(900);
  await page.screenshot({ path: join(outDir, "5-panel.png") });

  // mobile
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobile.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await mobile.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
  await wait(500);
  await revealAndEnter(mobile);
  await wait(1800);
  await mobile.screenshot({ path: join(outDir, "6-mobile.png") });

  await browser.close();
  console.log(`realm-shots: wrote ${outDir}`);
} finally { server.kill("SIGTERM"); }

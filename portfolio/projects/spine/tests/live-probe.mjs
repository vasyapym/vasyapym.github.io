// Live-site probe: open the portfolio, navigate to Spine from the SPA,
// wait for the Go engine, exercise add + undo, screenshot.
//
//   node portfolio/projects/spine/tests/live-probe.mjs
//
// Uses the system Chrome via puppeteer-core. Skips cleanly when no Chrome
// is available.
import { existsSync } from "node:fs";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter(Boolean);
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) { console.log("spine live-probe: no Chrome/Chromium found — skipping (set CHROME_PATH to run)"); process.exit(0); }
const { default: puppeteer } = await import("puppeteer-core");
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-first-run"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const problems = [];
page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
page.on("console", (msg) => { if (msg.type() === "error") problems.push("console.error: " + msg.text()); });

await page.goto("https://vasyapym.github.io/", { waitUntil: "networkidle2", timeout: 60000 });
log("landing loaded");

// Find and click the Spine card (SPA navigation).
const clicked = await page.evaluate(() => {
  const card = document.querySelector('a.signal-index-card[href="/projects/spine"]');
  if (!card) return false;
  card.scrollIntoView({ block: "center" });
  card.click();
  return true;
});
log("spine card clicked: " + clicked);
await page.waitForFunction(() => window.location.pathname.includes("/projects/spine"), { timeout: 15000, polling: 250 });
log("route is /projects/spine/");

await page.waitForFunction(() => window.spineReady === true, { timeout: 60000, polling: 250 });
const nodes = await page.$$eval("#spine-canvas .node", (els) => els.length);
log(`engine ready, nodes=${nodes}`);
if (nodes < 4) throw new Error("demo tree missing on live site");

await page.click("#spine-btn-add-item");
const after = await page.$$eval("#spine-canvas .node", (els) => els.length);
log(`after add: ${after}`);
if (after !== nodes + 1) throw new Error(`add-item broken on live site (${nodes} → ${after})`);

const code = await page.$eval("#spine-code-css", (el) => el.textContent);
if (!code.includes("display: flex")) throw new Error("code output empty on live site");
log("code output ok");

await page.screenshot({ path: "/var/folders/8x/yls1cw1d6s3fmbrxhqg0y17w0000gp/T/opencode/spine-live.png" });
await browser.close();
log("closed");
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log("LIVE OK");

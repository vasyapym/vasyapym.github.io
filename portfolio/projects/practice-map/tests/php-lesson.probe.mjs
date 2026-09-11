// Ad-hoc probe: the php-frameworks area + deep reader render (Symfony/Laravel lesson).
// Same harness approach as practice-map.check.mjs, but driven at the 4th area.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "php-lesson-probe");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.log("php lesson probe: no Chrome/Chromium found — skipping");
  process.exit(0);
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
  throw new Error(`dev server never answered at ${url}`);
}

const npmBin = process.env.NPM_BIN || (process.platform === "win32" ? "npm.cmd" : "npm");
const server = spawn(
  npmBin,
  ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(PORT), "--strictPort"],
  { cwd: shellDir, stdio: "ignore", detached: true },
);
process.on("exit", () => {
  try {
    process.kill(-server.pid);
  } catch {}
});

const problems = [];
const check = (cond, label) => {
  console.log(`${cond ? "ok  " : "FAIL"}  ${label}`);
  if (!cond) problems.push(label);
};

try {
  await waitForServer(BASE);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const consoleProblems = [];
  let page = await browser.newPage();
  page.on("pageerror", (err) => consoleProblems.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleProblems.push(`console.error: ${msg.text()}`);
  });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/projects/practice-map`, { waitUntil: "networkidle0", timeout: 45000 });

  await page.waitForSelector(".practice-area-list button", { timeout: 30000 });
  const areaButtons = await page.$$eval(".practice-area-list button", (b) =>
    b.map((x) => x.textContent.trim()),
  );
  check(areaButtons.length === 4, `4 areas listed (${areaButtons.length})`);
  check(
    areaButtons[3].includes("Laravel") || areaButtons[3].includes("Symfony"),
    `4th area is Symfony/Laravel (${areaButtons[3]})`,
  );

  await page.click(".practice-area-list button:nth-child(4)");
  await wait(400);
  const cardCount = await page.$$eval(".practice-topic-card", (c) => c.length);
  check(cardCount === 1, `php-frameworks area renders its single card (${cardCount})`);

  const cardTitle = await page.$eval(".practice-topic-card", (c) => c.textContent);
  check(cardTitle.includes("Symfony"), "card title mentions Symfony");

  await page.click(".practice-topic-card .practice-lesson-open");
  await page.waitForSelector(".practice-reader", { timeout: 30000 });
  const chipCount = await page.$$eval(".practice-reader-nav button", (b) => b.length);
  check(chipCount === 23, `php lesson lists 23 sections (${chipCount})`);

  const stats = await page.evaluate(() => {
    const reader = document.querySelector(".practice-reader");
    return {
      examples: reader.querySelectorAll(".practice-example").length,
      pre: reader.querySelectorAll("pre").length,
      callouts: reader.querySelectorAll(".practice-callout").length,
      lists: reader.querySelectorAll("li").length,
      code: reader.querySelectorAll("p > code, li > code, aside code").length,
      headings: Array.from(reader.querySelectorAll("h2, h3")).map((h) => h.textContent.trim()).slice(0, 26),
    };
  });
  check(stats.examples >= 100, `examples render (${stats.examples})`);
  check(stats.callouts >= 8, `callouts render (${stats.callouts})`);
  check(stats.code >= 40, `inline code renders (${stats.code})`);
  const text = await page.evaluate(() => document.querySelector(".practice-reader").textContent);
  check(text.includes("booking"), "scenario vocabulary (booking) present");
  check(text.includes("Doctrine"), "Doctrine present");
  check(text.includes("Eloquent"), "Eloquent present");
  check(text.includes("doctrine-orm/en/3.8"), "versioned doctrine URL present");
  check(text.includes("docs.phpunit.de/en/11.5"), "versioned phpunit URL present");
  check(!text.includes("en/current"), "no unversioned doctrine current URL");
  check(!text.includes("(проверить)"), "no leftover проверить mark");

  // last section heading: заключение
  const lastChip = await page.$$eval(".practice-reader-nav button", (b) => b[b.length - 1].textContent.trim());
  check(lastChip.includes("8 недель") || lastChip.includes("Заключение"), `last chip is заключение (${lastChip})`);

  // render a mid-lesson section via chip click (chunk nav click, not keyboard)
  const beforeScroll = await page.evaluate(
    () => document.querySelector(".practice-lesson-panel").scrollTop,
  );
  await page.click(".practice-reader-nav button:nth-child(11)");
  await wait(900);
  const afterScroll = await page.evaluate(
    () => document.querySelector(".practice-lesson-panel").scrollTop,
  );
  check(afterScroll > beforeScroll + 100, "chip click scrolls the panel");

  await page.screenshot({ path: join(SHOTS, "php-reader.png") });

  // mobile fit for the heavy php card
  await page.setViewport({ width: 390, height: 844 });
  await wait(300);
  const fits = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return rect.left >= -1 && rect.right <= window.innerWidth + 1;
  });
  check(fits, "panel fits at 390px horizontally");
  await page.screenshot({ path: join(SHOTS, "php-reader-mobile.png") });

  check(consoleProblems.length === 0, `no console errors (${consoleProblems.length})`);
  if (consoleProblems.length) console.log(consoleProblems.slice(0, 5));

  await browser.close();
} catch (err) {
  problems.push(`probe crashed: ${err.message}`);
  console.error(err);
} finally {
  process.exit(problems.length ? 1 : 0);
}

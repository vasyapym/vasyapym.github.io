import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5201;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "explosion-check");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("explosion check: no Chrome/Edge found — skipping (set CHROME_PATH)");
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

const isWin = process.platform === "win32";
const server = spawn(
  isWin ? "npm.cmd" : "npm",
  ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(PORT), "--strictPort"],
  { cwd: shellDir, stdio: "ignore", detached: !isWin, shell: isWin },
);
process.on("exit", () => {
  try {
    if (isWin) {
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(-server.pid);
    }
  } catch {}
});

let failures = 0;
const problems = [];

try {
  await waitForServer(`${BASE}/projects/explosion`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  const check = (ok, label) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
    if (!ok) {
      failures += 1;
      problems.push(label);
    }
  };

  async function loadViewport(width, height, label, { mobile = false } = {}) {
    const page = await browser.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const errors = [];
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });
    await page.goto(`${BASE}/projects/explosion`, { waitUntil: "networkidle0", timeout: 45000 });
    await wait(1800);
    await page.evaluate(() => {
      document.querySelector("#explosion-stage")?.scrollIntoView({ block: "center" });
    });
    await wait(400);

    const shot = (name) => page.screenshot({ path: join(SHOTS, `${name}.png`) });
    await shot(`${label}-1-arrival`);

    const hasCanvas = !!(await page.$("#explosion-stage canvas"));
    check(hasCanvas, `${label}: webgl canvas mounted`);

    const stageBox = await page.evaluate(() => {
      const rect = document.querySelector("#explosion-stage").getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    });

    const standingBefore = await page.$eval(
      ".explosion-stage-copy strong",
      (el) => Number.parseInt(el.textContent ?? "", 10),
    );
    check(standingBefore === 100, `${label}: monument starts 100% standing`);

    // Fire three shots into the structure. Aim at the plinth band: it spans
    // the full monument width, so these fractions land on voxels from the
    // narrowest phone viewport to the widest desktop one.
    for (const [fx, fy] of [[0.47, 0.84], [0.53, 0.86], [0.5, 0.82]]) {
      const px = stageBox.x + stageBox.width * fx;
      const py = stageBox.y + stageBox.height * fy;
      if (mobile) {
        await page.touchscreen.tap(px, py);
      } else {
        await page.mouse.click(px, py);
      }
      await wait(650);
    }
    await wait(1200);
    await shot(`${label}-2-damaged`);

    const standingAfter = await page.$eval(
      ".explosion-stage-copy strong",
      (el) => Number.parseInt(el.textContent ?? "", 10),
    );
    check(standingAfter < 100, `${label}: shots carved the monument (${standingAfter}% left)`);

    // Sever BOTH pillars mid-height: with both load paths cut, the whole
    // span above must cascade down via the integrity solver. Camera
    // constants (fov 40, z 13.6) mirror detonate.ts so the pillars can be
    // aimed from any aspect ratio.
    const aspect = stageBox.width / stageBox.height;
    const halfH = Math.tan((40 / 2) * (Math.PI / 180));
    const visibleWidth = 2 * 13.6 * halfH * aspect;
    const pillarFy = 0.545;
    for (const side of [-1.95, 1.95]) {
      const fx = 0.5 + side / visibleWidth;
      for (let i = 0; i < 3; i += 1) {
        const px = stageBox.x + stageBox.width * fx;
        const py = stageBox.y + stageBox.height * pillarFy;
        if (mobile) {
          await page.touchscreen.tap(px, py);
        } else {
          await page.mouse.click(px, py);
        }
        await wait(450);
      }
    }
    await wait(2600);
    await shot(`${label}-2b-collapsed`);
    const standingAfterCollapse = await page.$eval(
      ".explosion-stage-copy strong",
      (el) => Number.parseInt(el.textContent ?? "", 10),
    );
    check(
      standingAfterCollapse <= standingAfter - 15,
      `${label}: cut pillars collapse the span above (${standingAfter}% -> ${standingAfterCollapse}%)`,
    );

    const telemetryText = await page.$eval(".explosion-telemetry", (el) => el.textContent ?? "");
    check(/voxels/.test(telemetryText), `${label}: telemetry line renders (${telemetryText.trim()})`);

    // Slow motion must not explode anything.
    if (!mobile) {
      await page.keyboard.down("Shift");
      await page.mouse.click(stageBox.x + stageBox.width * 0.5, stageBox.y + stageBox.height * 0.45);
      await wait(700);
      await shot(`${label}-3-slowmo`);
      await page.keyboard.up("Shift");
    }

    // Restore rebuilds to a full monument.
    await page.click(".explosion-control");
    let standingRestored = -1;
    for (let i = 0; i < 12; i += 1) {
      await wait(450);
      standingRestored = await page.$eval(
        ".explosion-stage-copy strong",
        (el) => Number.parseInt(el.textContent ?? "", 10),
      );
      if (standingRestored === 100) {
        break;
      }
    }
    await shot(`${label}-4-restored`);
    if (standingRestored !== 100) {
      const diag = await page.evaluate(() => {
        const rect = document.querySelectorAll(".explosion-control")[0].getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
          hit: hit ? `${hit.tagName}.${hit.className}` : "null",
          copy: document.querySelector(".explosion-stage-copy")?.textContent ?? "",
        };
      });
      console.log(`    diag ${label}:`, JSON.stringify(diag));
    }
    check(standingRestored === 100, `${label}: restore returns monument to 100%`);

    // Sound toggle flips aria-pressed.
    const soundBefore = await page.$eval(
      '.explosion-control[aria-pressed]',
      (el) => el.getAttribute("aria-pressed"),
    );
    await page.click('.explosion-control[aria-pressed]');
    await wait(400);
    const soundAfter = await page.$eval(
      '.explosion-control[aria-pressed]',
      (el) => el.getAttribute("aria-pressed"),
    );
    check(soundBefore !== soundAfter, `${label}: sound toggle flips (${soundBefore} -> ${soundAfter})`);

    // Horizontal overflow guard.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(overflow <= 0, `${label}: no horizontal overflow (${overflow}px)`);

    check(errors.length === 0, `${label}: zero console/page errors${errors.length ? ` — ${errors.join(" | ")}` : ""}`);
    await page.close();
  }

  await loadViewport(1440, 900, "desktop-1440");
  await loadViewport(1024, 768, "tablet-1024");
  await loadViewport(390, 844, "mobile-390", { mobile: true });

  // Landing card copy sanity.
  const landing = await browser.newPage();
  await landing.setViewport({ width: 1440, height: 900 });
  const landingErrors = [];
  landing.on("pageerror", (err) => landingErrors.push(err.message));
  await landing.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  const landingText = await landing.content();
  check(
    landingText.includes("voxel monument") && landingText.includes("/ physics"),
    "landing card shows the new explosion pitch",
  );
  check(
    !landingText.includes("Unlisted kinetic specimen") && !landingText.includes("impact test"),
    "old specimen copy gone",
  );
  check(landingErrors.length === 0, "landing loads without errors");
  await landing.close();

  await browser.close();

  if (failures > 0) {
    console.error(`\n${failures} failing check(s):`);
    for (const p of problems) console.error(` - ${p}`);
    console.error(`\nScreenshots: ${SHOTS}`);
    process.exit(1);
  }
  console.log(`\nAll explosion checks passed. Screenshots: ${SHOTS}`);
} finally {
  try {
    if (isWin) {
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(-server.pid);
    }
  } catch {}
}

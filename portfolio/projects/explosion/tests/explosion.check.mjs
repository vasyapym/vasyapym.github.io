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
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("explosion check: no Chrome/Chromium found — skipping (set CHROME_PATH)");
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

const check = (ok, label) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) {
    failures += 1;
    problems.push(label);
  }
};

// "fps 60 · phase detonating · aloft 583/600 · sim gpu · blooms 2" -> structured read.
const readHud = (page) =>
  page.evaluate(() => {
    const text = document.querySelector(".explosion-hud-line")?.textContent ?? "";
    const num = (re) => {
      const m = re.exec(text);
      return m ? Number.parseInt(m[1], 10) : -1;
    };
    const aloftM = /aloft (\d+)\/(\d+)/.exec(text);
    return {
      text,
      fps: num(/fps (\d+)/),
      phase: (/phase ([a-z]+)/.exec(text) ?? [])[1] ?? "",
      aloft: aloftM ? Number.parseInt(aloftM[1], 10) : -1,
      shards: aloftM ? Number.parseInt(aloftM[2], 10) : -1,
      sim: (/sim ([a-z]+)/.exec(text) ?? [])[1] ?? "",
      blooms: num(/blooms (\d+)/),
    };
  });

const engagements = (page) =>
  page.$eval("#explosion-stage", (el) =>
    Number.parseInt(el.getAttribute("data-engagements") ?? "0", 10),
  );

const press = async (page, x, y) => {
  if (await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches)) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
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
  await wait(1500);
  // The shell sets scroll-behavior: smooth — force instant scrolling so stage
  // rect reads are never stale.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    document.querySelector("#explosion-stage")?.scrollIntoView({ block: "center" });
  });
  await wait(400);

  const shot = (name) => page.screenshot({ path: join(SHOTS, `${name}.png`) });
  await shot(`${label}-1-arrival`);

  const hasCanvas = !!(await page.$("#explosion-stage canvas"));
  check(hasCanvas, `${label}: webgl canvas mounted`);

  // Pristine HUD: 600 shards at rest, zero blooms, animation actually running,
  // and the GPGPU path engaged (SwiftShader supplies EXT_color_buffer_float).
  const fresh = await readHud(page);
  check(fresh.phase === "pristine", `${label}: starts pristine (${fresh.phase})`);
  check(fresh.shards === 600, `${label}: 600 shards in the HUD (${fresh.shards})`);
  check(fresh.aloft === 0, `${label}: lantern holds at arrival, nothing aloft (${fresh.aloft})`);
  check(fresh.sim === "gpu", `${label}: gpgpu backend engaged (${fresh.sim})`);
  check(fresh.blooms === 0, `${label}: no blooms before the first click (${fresh.blooms})`);
  check(fresh.fps >= 5, `${label}: loop is live (fps ${fresh.fps})`);

  const stageBox = await page.evaluate(() => {
    const rect = document.querySelector("#explosion-stage").getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });

  // Center click detonates: the flashpoint bloom arms ~90ms later and the
  // engagement counter moves; shards go aloft.
  await press(
    page,
    stageBox.x + stageBox.width / 2,
    stageBox.y + stageBox.height / 2,
  );
  let bloomed = 0;
  for (let i = 0; i < 8 && !bloomed; i += 1) {
    await wait(320);
    bloomed = await engagements(page);
  }
  check(bloomed >= 1, `${label}: center blast fires the flashpoint bloom (${bloomed})`);
  let sawFlight = false;
  for (let i = 0; i < 8 && !sawFlight; i += 1) {
    sawFlight = (await readHud(page)).aloft >= 1;
    if (!sawFlight) await wait(250);
  }
  check(sawFlight, `${label}: shards go aloft after the blast`);
  await shot(`${label}-2-detonating`);

  // Enter/space blasts from center: a second bloom arms.
  if (!mobile) {
    const bloomsBefore = await engagements(page);
    await page.$eval("#explosion-stage", (el) => el.focus());
    await page.keyboard.press("Enter");
    let bloomsAfter = bloomsBefore;
    for (let i = 0; i < 8 && bloomsAfter === bloomsBefore; i += 1) {
      await wait(320);
      bloomsAfter = await engagements(page);
    }
    check(
      bloomsAfter > bloomsBefore,
      `${label}: enter blasts from center (${bloomsBefore} -> ${bloomsAfter})`,
    );
  }

  // Restore reassembles the lantern. Budget is generous: under SwiftShader load
  // the 0.05s sim-dt clamp makes sim time crawl relative to wall time, and the
  // settle needs ~1.2 sim-s to converge.
  await page.click(".explosion-btn-restore");
  let settled = null;
  for (let i = 0; i < 40; i += 1) {
    await wait(450);
    settled = await readHud(page);
    if (settled.phase === "pristine" && settled.aloft === 0) break;
  }
  await shot(`${label}-3-restored`);
  check(
    settled?.phase === "pristine" && settled?.aloft === 0,
    `${label}: restore reassembles (${settled?.phase}, aloft ${settled?.aloft})`,
  );

  // Honest miss: a corner click (the ray passes far from the lantern) must
  // change nothing at all — no bloom, no phase move, no flight. Runs only once
  // the piece has settled pristine, so a benign settling->pristine transition
  // between reads cannot masquerade as an effect.
  let beforeMiss = await readHud(page);
  for (let i = 0; i < 20 && beforeMiss.phase !== "pristine"; i += 1) {
    await wait(450);
    beforeMiss = await readHud(page);
  }
  await press(
    page,
    stageBox.x + stageBox.width * 0.02,
    stageBox.y + stageBox.height * 0.02,
  );
  await wait(900);
  const afterMiss = await readHud(page);
  check(
    afterMiss.blooms === beforeMiss.blooms && afterMiss.phase === beforeMiss.phase,
    `${label}: corner miss changes nothing (${beforeMiss.blooms} blooms ${beforeMiss.phase} -> ${afterMiss.blooms} blooms ${afterMiss.phase})`,
  );

  // Toggles flip aria-pressed.
  const slowBefore = await page.$eval(".explosion-btn-slow", (el) => el.getAttribute("aria-pressed"));
  await page.click(".explosion-btn-slow");
  await wait(300);
  const slowAfter = await page.$eval(".explosion-btn-slow", (el) => el.getAttribute("aria-pressed"));
  check(slowBefore !== slowAfter, `${label}: slow-mo toggle flips (${slowBefore} -> ${slowAfter})`);
  await page.click(".explosion-btn-slow");

  const soundBefore = await page.$eval(".explosion-btn-sound", (el) => el.getAttribute("aria-pressed"));
  await page.click(".explosion-btn-sound");
  await wait(300);
  const soundAfter = await page.$eval(".explosion-btn-sound", (el) => el.getAttribute("aria-pressed"));
  check(soundBefore !== soundAfter, `${label}: sound toggle flips (${soundBefore} -> ${soundAfter})`);
  await page.click(".explosion-btn-sound");

  // Horizontal overflow guard.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(overflow <= 0, `${label}: no horizontal overflow (${overflow}px)`);

  check(errors.length === 0, `${label}: zero console/page errors${errors.length ? ` — ${errors.join(" | ")}` : ""}`);
  await page.close();
}

let browser = null;
try {
  await waitForServer(`${BASE}/projects/explosion`);

  browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
  });

  // VIEWPORTS=desktop-1440,mobile-390 node explosion.check.mjs — run a subset.
  const wanted = (process.env.VIEWPORTS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const wants = (name) => wanted.length === 0 || wanted.includes(name);
  if (wants("desktop-1440")) {
    await loadViewport(1440, 900, "desktop-1440");
  }
  if (wants("tablet-1024")) {
    await loadViewport(1024, 768, "tablet-1024");
  }
  if (wants("mobile-390")) {
    await loadViewport(390, 844, "mobile-390", { mobile: true });
  }

  // Landing card copy sanity (skipped when a viewport subset was requested).
  if (wanted.length === 0) {
    const landing = await browser.newPage();
    await landing.setViewport({ width: 1440, height: 900 });
    const landingErrors = [];
    landing.on("pageerror", (err) => landingErrors.push(err.message));
    await landing.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
    const landingText = await landing.content();
    check(
      landingText.includes("paper-lantern") && landingText.includes("/ physics"),
      "landing card shows the ember-lantern pitch",
    );
    check(
      landingText.includes("fragment shaders"),
      "landing card names the gpu physics",
    );
    check(
      !landingText.includes("voxel monument") && !landingText.includes("Raze the district"),
      "old demolition copy gone",
    );
    check(landingErrors.length === 0, "landing loads without errors");
    await landing.close();
  }

  if (failures > 0) {
    console.error(`\n${failures} failing check(s):`);
    for (const p of problems) console.error(` - ${p}`);
    console.error(`\nScreenshots: ${SHOTS}`);
    process.exit(1);
  }
  console.log(`\nAll explosion checks passed. Screenshots: ${SHOTS}`);
} finally {
  await browser?.close();
  try {
    if (isWin) {
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(-server.pid);
    }
  } catch {}
}

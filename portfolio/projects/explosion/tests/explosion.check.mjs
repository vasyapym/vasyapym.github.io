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

// Cold Vite transforms + SwiftShader can push one networkidle0 past the window;
// a timed-out navigation is retried rather than crashing the whole run.
const gotoStable = async (page, url, { timeout = 45000, tries = 3 } = {}) => {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout });
      return;
    } catch (err) {
      if (attempt === tries) throw err;
      console.log(`  retry ${attempt}/${tries - 1} after navigation timeout: ${err.message}`);
      await wait(1000);
    }
  }
};

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
      splats: num(/splats (\d+)/),
      blasts: num(/blasts (\d+)/),
      strikes: num(/engagements (\d+)/),
      grid: num(/grid (\d+)/),
      steps: num(/steps (\d+)/),
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
  await gotoStable(page, `${BASE}/projects/explosion`);
  // Fresh-profile semantics: earlier viewports leak localStorage into this one,
  // so clear it and reload before the first-visit assertions.
  await page.evaluate(() => { try { window.localStorage.clear(); } catch {} });
  await gotoStable(page, `${BASE}/projects/explosion`);
  await wait(1500);

  // First visit: the mode selector, not a canvas. Three cards, then enter lantern.
  const cards = await page.$$(".explosion-mode-card");
  check(cards.length === 3, `${label}: first visit shows three mode cards (${cards.length})`);
  const noCanvasYet = !(await page.$("#explosion-stage canvas"));
  check(noCanvasYet, `${label}: no stage canvas while the selector is up`);
  await page.click('.explosion-mode-card[data-mode-id="lantern"]');
  await wait(900);

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
  // settle needs ~1.2 sim-s to converge. 90×450ms ≈ 40s covers slow machines.
  await page.click(".explosion-btn-restore");
  let settled = null;
  for (let i = 0; i < 90; i += 1) {
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

  // ---- second mode: runtime switch to the ink shockwave, no reload -----------
  await page.evaluate(() => { window.__explosionProbe = "keep-me"; });
  await page.click(".explosion-btn-mode");
  await wait(400);
  const selectorBack = await page.$('.explosion-mode-card[data-mode-id="ink"]');
  check(!!selectorBack, `${label}: switch-mode returns to the selector`);
  await page.click('.explosion-mode-card[data-mode-id="ink"]');
  const stageBox2 = await page.evaluate(() => {
    const rect = document.querySelector("#explosion-stage").getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });
  // The auto-detonation fires ~0.9s after mount (wall-clock countdown); shader
  // compilation under SwiftShader can delay it well past that, so poll wide.
  let inkHud = null;
  for (let i = 0; i < 24; i += 1) {
    await wait(500);
    inkHud = await readHud(page);
    if (inkHud.blasts >= 1) break;
  }
  check(inkHud?.blasts >= 1, `${label}: ink auto-detonation fires (${inkHud?.blasts})`);
  check(inkHud?.grid >= 64, `${label}: ink sim grid reported (${inkHud?.grid})`);
  check(inkHud?.fps >= 5, `${label}: ink loop is live (fps ${inkHud?.fps})`);
  const inkField = await page.$eval(".explosion-field", (el) => el.getAttribute("data-mode"));
  check(inkField === "ink", `${label}: data-mode flips to ink (${inkField})`);
  const probe = await page.evaluate(() => window.__explosionProbe);
  check(probe === "keep-me", `${label}: mode switch kept the page alive (probe ${String(probe)})`);

  // The pointer stirs (desktop only): sweep the stage, splats must grow.
  if (!mobile) {
    const splatsBefore = inkHud.splats;
    await page.mouse.move(stageBox2.x + stageBox2.width * 0.3, stageBox2.y + stageBox2.height * 0.5);
    for (let i = 1; i <= 6; i += 1) {
      await page.mouse.move(stageBox2.x + stageBox2.width * (0.3 + 0.08 * i), stageBox2.y + stageBox2.height * 0.5, { steps: 4 });
    }
    await wait(700);
    const splatsAfter = (await readHud(page)).splats;
    check(splatsAfter > splatsBefore, `${label}: pointer stirs the ink (${splatsBefore} -> ${splatsAfter} splats)`);
  }

  // A click detonates: blasts increments again.
  const blastsBefore = (await readHud(page)).blasts;
  await press(
    page,
    stageBox2.x + stageBox2.width / 2,
    stageBox2.y + stageBox2.height / 2,
  );
  let blastsAfter = blastsBefore;
  for (let i = 0; i < 8 && blastsAfter === blastsBefore; i += 1) {
    await wait(320);
    blastsAfter = (await readHud(page)).blasts;
  }
  check(blastsAfter > blastsBefore, `${label}: ink click detonates (${blastsBefore} -> ${blastsAfter})`);
  await shot(`${label}-4-ink`);

  // localStorage remembers ink across a reload; the intro refires on the new mount.
  await gotoStable(page, page.url(), { timeout: 30000 });
  let restoredBlasts = -1;
  for (let i = 0; i < 24; i += 1) {
    await wait(500);
    restoredBlasts = (await readHud(page)).blasts;
    if (restoredBlasts >= 1) break;
  }
  const restoredMode = await page.$eval(".explosion-field", (el) => el.getAttribute("data-mode"));
  const restoredAloft = (await readHud(page)).aloft;
  check(restoredMode === "ink" && restoredAloft === -1 && restoredBlasts >= 1,
    `${label}: ink remembered across reload (${restoredMode}, aloft ${restoredAloft}, blasts ${restoredBlasts})`);

  // ---- third mode: runtime switch to the cinder fault, no reload -------------
  await page.evaluate(() => { window.__explosionProbe = "keep-me"; });
  await page.click(".explosion-btn-mode");
  await wait(400);
  await page.click('.explosion-mode-card[data-mode-id="fault"]');
  await wait(900);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    document.querySelector("#explosion-stage")?.scrollIntoView({ block: "center" });
  });
  await wait(400);

  // The seal mounts pristine: no engagement yet, loop live.
  let faultHud = null;
  for (let i = 0; i < 8 && (!faultHud || faultHud.fps < 5); i += 1) {
    await wait(500);
    faultHud = await readHud(page);
  }
  check(faultHud?.phase === "pristine", `${label}: fault starts pristine (${faultHud?.phase})`);
  check(faultHud?.strikes === 0, `${label}: fault starts unstruck (${faultHud?.strikes})`);
  check(faultHud?.grid >= 64, `${label}: fault sim grid reported (${faultHud?.grid})`);
  check(faultHud?.fps >= 5, `${label}: fault loop is live (fps ${faultHud?.fps})`);
  const faultField = await page.$eval(".explosion-field", (el) => el.getAttribute("data-mode"));
  check(faultField === "fault", `${label}: data-mode flips to fault (${faultField})`);
  const faultProbe = await page.evaluate(() => window.__explosionProbe);
  check(faultProbe === "keep-me", `${label}: fault switch kept the page alive (probe ${String(faultProbe)})`);

  // Center click strikes the seal: the impact registers same-frame.
  const stageBox3 = await page.evaluate(() => {
    const rect = document.querySelector("#explosion-stage").getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });
  await press(
    page,
    stageBox3.x + stageBox3.width / 2,
    stageBox3.y + stageBox3.height / 2,
  );
  let strikesAfterHit = -1;
  for (let i = 0; i < 8; i += 1) {
    strikesAfterHit = (await readHud(page)).strikes;
    if (strikesAfterHit >= 1) break;
    await wait(320);
  }
  check(strikesAfterHit >= 1, `${label}: fault center strike fires (engagements ${strikesAfterHit})`);
  await shot(`${label}-5-fault-blast`);

  // Relax into settling. Sim time accrues at most maxSteps/120 per frame, so
  // the blast envelope stretches as fps drops — budget for ~4fps SwiftShader.
  let settlingPhase = "";
  for (let i = 0; i < 48; i += 1) {
    settlingPhase = (await readHud(page)).phase;
    if (settlingPhase === "settling" || settlingPhase === "pristine") break;
    await wait(450);
  }
  check(settlingPhase === "settling", `${label}: fault settles after the blast (${settlingPhase})`);
  const beforeFaultMiss = await readHud(page);
  await press(
    page,
    stageBox3.x + stageBox3.width * 0.02,
    stageBox3.y + stageBox3.height * 0.02,
  );
  await wait(900);
  const afterFaultMiss = await readHud(page);
  check(
    afterFaultMiss.strikes === beforeFaultMiss.strikes && afterFaultMiss.phase === beforeFaultMiss.phase,
    `${label}: fault corner miss changes nothing (${beforeFaultMiss.strikes} strikes ${beforeFaultMiss.phase} -> ${afterFaultMiss.strikes} strikes ${afterFaultMiss.phase})`,
  );

  // Restore reseals: the identical authored seal returns, counters reset.
  await page.click(".explosion-btn-restore");
  let faultSettled = null;
  for (let i = 0; i < 10; i += 1) {
    await wait(450);
    faultSettled = await readHud(page);
    if (faultSettled.phase === "pristine" && faultSettled.strikes === 0) break;
  }
  await shot(`${label}-6-fault-restored`);
  check(
    faultSettled?.phase === "pristine" && faultSettled?.strikes === 0,
    `${label}: restore reseals the seal (${faultSettled?.phase}, strikes ${faultSettled?.strikes})`,
  );

  // ?mode=fault deep link enters the fault directly.
  await gotoStable(page, `${BASE}/projects/explosion?mode=fault`);
  await wait(1500);
  const faultDeepMode = await page.$eval(".explosion-field", (el) => el.getAttribute("data-mode"));
  check(faultDeepMode === "fault", `${label}: ?mode=fault deep link wins (${faultDeepMode})`);

  // ?mode= deep link overrides the remembered mode.
  await gotoStable(page, `${BASE}/projects/explosion?mode=lantern`);
  await wait(1500);
  const deepMode = await page.$eval(".explosion-field", (el) => el.getAttribute("data-mode"));
  check(deepMode === "lantern", `${label}: ?mode=lantern deep link wins (${deepMode})`);

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
    await gotoStable(landing, `${BASE}/`);
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

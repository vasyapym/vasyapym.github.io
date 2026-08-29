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

const check = (ok, label) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) {
    failures += 1;
    problems.push(label);
  }
};

// "lx-01 · 004 shots" -> 4
const shotOf = (hudLabel) => {
  const match = /(\d+)\s+shots/.exec(hudLabel);
  return match ? Number.parseInt(match[1], 10) : -1;
};

// "768 voxels · 1534 debris · 87 fps" -> debris number, or -1 when absent.
const debrisCount = async (page) =>
  page.evaluate(() => {
    const text = document.querySelector(".explosion-telemetry")?.textContent ?? "";
    const match = /(\d+)\s+debris/.exec(text);
    return match ? Number.parseInt(match[1], 10) : -1;
  });

// Full HUD snapshot: shots label, % standing, % peak stress.
const readHudState = (page) =>
  page.evaluate(() => {
    const spans = document.querySelectorAll(".explosion-stage-copy span");
    const strong = document.querySelector(".explosion-stage-copy strong");
    const tele = document.querySelector(".explosion-telemetry")?.textContent ?? "";
    const num = (re) => {
      const m = re.exec(tele);
      return m ? Number.parseInt(m[1], 10) : -1;
    };
    return {
      label: spans[0]?.textContent ?? "",
      standing: Number.parseInt(strong?.textContent ?? "", 10),
      peak: num(/peak (\d+)% stress/),
      debris: num(/(\d+)\s+debris/),
    };
  });

try {
  await waitForServer(`${BASE}/projects/explosion`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

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
    // The shell sets `scroll-behavior: smooth`, so scrollIntoView animates and any
    // rect read mid-animation is stale (every aim would land outside the stage).
    // Force instant scrolling, then verify the stage rect before aiming anything.
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
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

    // Aim math — mirrors the renderer's locked framing (detonate.ts, "Golden Hour
    // Ruin"): fov 40, level camera, distance = clamp(27.475 / aspect, 22.5, 46),
    // targetY = 0.25478 * distance. Aiming by world point (projected onto the stage)
    // instead of hardcoded screen fractions keeps every shot on-structure from the
    // narrowest phone viewport to the widest desktop one.
    const aspect = stageBox.width / stageBox.height;
    const tanHalfFov = Math.tan((40 / 2) * (Math.PI / 180));
    const distance = Math.min(46, Math.max(22.5, 27.475 / aspect));
    const targetY = 0.25478 * distance;
    const halfH = distance * tanHalfFov;
    const visibleWidth = 2 * halfH * aspect;
    const project = (wx, wy) => ({
      x: stageBox.x + stageBox.width * (0.5 + wx / visibleWidth),
      y: stageBox.y + stageBox.height * (0.5 - (wy - targetY) / (2 * halfH)),
    });

    const standingBefore = await page.$eval(
      ".explosion-stage-copy strong",
      (el) => Number.parseInt(el.textContent ?? "", 10),
    );
    check(standingBefore === 100, `${label}: monument starts 100% standing`);

    // Stress HUD: peak stress renders as a percentage on a fresh monument.
    const fresh = await readHudState(page);
    check(
      fresh.peak >= 0 && fresh.peak <= 100,
      `${label}: peak stress renders (${fresh.peak}%)`,
    );

    // Aim preview: hovering the plinth shows the ghost ring and the
    // solver's verdict ("≈ N voxels"); open sky clears it again.
    if (!mobile) {
      // Aim at a voxel-cell CENTER: a ray on a cell boundary can graze the
      // instance box in THREE's raycaster while the core's DDA still hits,
      // which would hide the chip exactly where the verdict should show.
      const slabHover = project(-0.26, 0.3);
      await page.mouse.move(slabHover.x, slabHover.y, { steps: 6 });
      await wait(300);
      const chipState = await page.$eval(".explosion-target-chip", (el) => ({
        display: el.style.display,
        text: el.textContent ?? "",
      }));
      check(
        chipState.display === "block" && /≈ \d+ voxels/.test(chipState.text),
        `${label}: aim preview names its target ("${chipState.text}")`,
      );
      await page.mouse.move(
        stageBox.x + stageBox.width * 0.5,
        stageBox.y + stageBox.height * 0.03,
        { steps: 4 },
      );
      await wait(250);
      const chipGone = await page.$eval(
        ".explosion-target-chip",
        (el) => el.style.display,
      );
      check(chipGone === "none", `${label}: aim preview clears over sky (${chipGone})`);
      await page.mouse.move(stageBox.x + 8, stageBox.y + 8);
      await wait(120);
    }

    // Fire three shots into the structure. Aim at the hall wall / slab band on
    // voxel-cell centers: these world points land on filled voxels from the
    // narrowest phone viewport to the widest desktop one.
    for (const [wx, wy] of [[-0.52, 0.3], [0.52, 0.28], [0.26, 0.34]]) {
      const aim = project(wx, wy);
      if (mobile) {
        await page.touchscreen.tap(aim.x, aim.y);
      } else {
        await page.mouse.click(aim.x, aim.y);
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

    // Aim math for the pillar shots below: the hero pillar banks sit at world
    // x ±2.55 (grid x 18..25 / 38..45); a mid-bank world y of 3.0 projects
    // through the locked framing via project() above.
    const tap = async (px, py) => {
      if (mobile) {
        await page.touchscreen.tap(px, py);
      } else {
        await page.mouse.click(px, py);
      }
    };

    // Stress solver showcase: cut ONE pillar's upper section. The aim threads the
    // gap between the foreground ziggurat (its east face ends at world x −2.47 at
    // this height) and hits the left bank's x22 column, carving full bank width;
    // the load the severed section carried detours through the survivor — the
    // solved peak must climb hard enough to cross the glow threshold.
    const cutLeft = project(-2.34, 4.9);
    await tap(cutLeft.x, cutLeft.y);
    await wait(900);
    const stressed = await readHudState(page);
    check(
      stressed.peak > fresh.peak && stressed.peak >= 60,
      `${label}: cutting one pillar reroutes its load (${fresh.peak}% -> ${stressed.peak}%)`,
    );

    // Sever BOTH pillars mid-height: with both load paths cut, the whole
    // span above must cascade down via the integrity solver. A cascade this
    // large also engages the collapse camera — time dilation must show up
    // in the hint line.
    // Sever BOTH pillar banks. Each bank is 11 voxels deep but one blast sphere
    // only reaches ~6.5, so the first tap opens a crater the next taps thread
    // through: the second tap charges the back wall, the third the front wall —
    // after three taps the left bank is cut through its full depth and its
    // unsupported top section falls. The right bank hides behind the domed
    // hall, so its ray first punches a hole through the hall wall, reaches the
    // bank through the hall's hollow interior, and needs five taps to sever.
    let sawDilation = false;
    const sever = async (aim, times) => {
      for (let i = 0; i < times; i += 1) {
        await tap(aim.x, aim.y);
        // Poll a little past the cam window so slower devices can surface
        // the hint between frames.
        for (let poll = 0; poll < 8 && !sawDilation; poll += 1) {
          await wait(160);
          sawDilation = await page.$eval(".explosion-hint", (el) =>
            /dilat/.test(el.textContent ?? ""),
          );
        }
      }
    };
    await sever(cutLeft, 2);
    const cutRight = project(2.55, 3.0);
    await sever(cutRight, 5);
    await wait(2600);
    await shot(`${label}-2b-collapsed`);
    const standingAfterCollapse = await page.$eval(
      ".explosion-stage-copy strong",
      (el) => Number.parseInt(el.textContent ?? "", 10),
    );
    check(
      standingAfterCollapse <= standingAfter - 3,
      `${label}: repeated severing shots reshape the district (${standingAfter}% -> ${standingAfterCollapse}%)`,
    );

    // The engine must have engaged the collapse cam for the cascade. The
    // counter is read from a data attribute because DOM sampling on
    // software-rendered devices is too slow to catch the hint text live.
    const engagements = await page.$eval("#explosion-stage", (el) =>
      Number.parseInt(el.getAttribute("data-engagements") ?? "0", 10),
    );
    check(
      engagements >= 1,
      `${label}: big cascade engages the collapse cam (${engagements} engagement(s))`,
    );
    if (label === "desktop-1440") {
      // Live-text sampling is only reliable enough to assert the visible
      // hint on the fastest viewport; slower devices assert via the
      // engagement counter above.
      check(sawDilation, `${label}: dilation visible in the hint line`);
    }

    // Integrity fixpoint: once the dust settles the ruin must be stable —
    // no orphaned chunks hanging in the air and falling seconds later.
    await wait(1500);
    const settleA = await readHudState(page);
    await wait(900);
    const settleB = await readHudState(page);
    check(
      settleA.standing === settleB.standing && settleB.standing <= standingAfterCollapse,
      `${label}: ruin settles with no stragglers (${settleA.standing}% -> ${settleB.standing}%)`,
    );

    const telemetryText = await page.$eval(".explosion-telemetry", (el) => el.textContent ?? "");
    check(/voxels/.test(telemetryText), `${label}: telemetry line renders (${telemetryText.trim()})`);
    check(
      /peak \d+% stress/.test(telemetryText),
      `${label}: peak stress chip renders (${telemetryText.trim()})`,
    );

    // Slow motion must not explode anything.
    if (!mobile) {
      await page.keyboard.down("Shift");
      const spanAim = project(0, 6.5);
      await page.mouse.click(spanAim.x, spanAim.y);
      await wait(700);
      await shot(`${label}-3-slowmo`);
      await page.keyboard.up("Shift");
    }

    // Restore rebuilds to a full monument.
    await page.click(".explosion-control-restore");
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
        const rect = document.querySelectorAll(".explosion-control-restore")[0].getBoundingClientRect();
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

    // X-ray: the load-path heat map toggles from the keyboard and repaints
    // the whole monument (screenshot kept for the eyeball pass).
    if (!mobile) {
      await page.keyboard.press("x");
      await wait(400);
      const xrayPressed = await page.$eval(
        ".explosion-control-xray",
        (el) => el.getAttribute("aria-pressed"),
      );
      check(xrayPressed === "true", `${label}: x key flips the x-ray on`);
      await shot(`${label}-5-xray`);
      await page.keyboard.press("x");
      await wait(300);
      const xrayOff = await page.$eval(
        ".explosion-control-xray",
        (el) => el.getAttribute("aria-pressed"),
      );
      check(xrayOff === "false", `${label}: x key flips the x-ray back off`);
    }

    // Sound toggle flips aria-pressed.
    const soundBefore = await page.$eval(
      ".explosion-control-sound",
      (el) => el.getAttribute("aria-pressed"),
    );
    await page.click(".explosion-control-sound");
    await wait(400);
    const soundAfter = await page.$eval(
      ".explosion-control-sound",
      (el) => el.getAttribute("aria-pressed"),
    );
    check(soundBefore !== soundAfter, `${label}: sound toggle flips (${soundBefore} -> ${soundAfter})`);

    // An honest miss: clicking empty sky registers as a shot but must not
    // change what is standing (the old build played a full explosion here).
    // The pyramid apex reaches ~10% below the stage top, so walk upward
    // until the click provably lands in open air.
    const readHud = () => page.evaluate(() => {
      const spans = document.querySelectorAll(".explosion-stage-copy span");
      const strong = document.querySelector(".explosion-stage-copy strong");
      const tele = document.querySelector(".explosion-telemetry")?.textContent ?? "";
      const m = /(\d+)\s+voxels/.exec(tele);
      return {
        label: spans[0]?.textContent ?? "",
        standing: Number.parseInt(strong?.textContent ?? "", 10),
        voxels: m ? Number.parseInt(m[1], 10) : -1,
      };
    });
    let beforeMiss = null;
    let afterMiss = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const fy = 0.09 * Math.pow(0.55, attempt);
      beforeMiss = await readHud();
      await page.mouse.click(stageBox.x + stageBox.width * 0.5, stageBox.y + stageBox.height * fy);
      await wait(550);
      afterMiss = await readHud();
      if (
        shotOf(afterMiss.label) === shotOf(beforeMiss.label) + 1 &&
        afterMiss.standing === beforeMiss.standing
      ) {
        break;
      }
    }
    check(
      afterMiss.standing === beforeMiss.standing,
      `${label}: sky shot changes nothing (${beforeMiss.standing}% -> ${afterMiss.standing}%)`,
    );
    check(
      shotOf(afterMiss.label) === shotOf(beforeMiss.label) + 1,
      `${label}: sky shot still registers (${beforeMiss.label} -> ${afterMiss.label})`,
    );

    // A single direct hit on the structure must visibly bite — no more silent
    // scuffs where the charge "breaks" audibly but the wall stays intact.
    // Asserted on the raw voxel count: one blast sphere removes ~100+ voxels
    // of a ~25k district, which the rounded percent would smooth back to 100.
    const voxelOf = (hud) => hud.voxels;
    const biteAim = project(0.26, 0.3);
    await page.mouse.click(biteAim.x, biteAim.y);
    let bite = -1;
    for (let i = 0; i < 8; i += 1) {
      await wait(150);
      bite = voxelOf(await readHud());
      if (bite >= 0 && bite <= afterMiss.voxels - 40) {
        break;
      }
    }
    check(
      bite >= 0 && bite <= afterMiss.voxels - 40,
      `${label}: single direct hit takes a visible bite (${afterMiss.voxels} -> ${bite} voxels)`,
    );

    // Chaos: rapid fire mixing hits and misses, restore punched mid-cascade,
    // more fire — state must stay consistent and settle back to a clean
    // 100% monument with all debris drained. World points scattered across
    // the six structures + slab, projected through the locked framing.
    const chaosTargets = [
      [-2.55, 3.0], [2.55, 3.0], [0.26, 6.5], [-2.55, 1.2], [2.55, 1.2],
      [-6.0, 0.3], [6.0, 0.3], [-6.0, 8.0], [5.5, 7.0], [0.26, 0.3],
    ].map(([wx, wy]) => project(wx, wy));
    let maxDebris = 0;
    for (const aim of chaosTargets) {
      await page.mouse.click(aim.x, aim.y);
      await wait(70);
      maxDebris = Math.max(maxDebris, await debrisCount(page));
    }
    await page.click(".explosion-control-restore");
    for (const aim of chaosTargets.slice(0, 5)) {
      await page.mouse.click(aim.x, aim.y);
      await wait(70);
      maxDebris = Math.max(maxDebris, await debrisCount(page));
    }
    let chaosRestored = -1;
    for (let i = 0; i < 24; i += 1) {
      await wait(450);
      chaosRestored = (await readHud()).standing;
      if (chaosRestored === 100) break;
    }
    check(chaosRestored === 100, `${label}: mid-cascade restore settles at 100% (${chaosRestored}%)`);
    let drained = -1;
    for (let i = 0; i < 16; i += 1) {
      await wait(450);
      drained = await debrisCount(page);
      if (drained === 0) break;
    }
    check(drained === 0, `${label}: debris drains completely after chaos (peak ${maxDebris}, left ${drained})`);

    // Horizontal overflow guard.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(overflow <= 0, `${label}: no horizontal overflow (${overflow}px)`);

    check(errors.length === 0, `${label}: zero console/page errors${errors.length ? ` — ${errors.join(" | ")}` : ""}`);
    await page.close();
  }

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
      landingText.includes("voxel monument") && landingText.includes("/ physics"),
      "landing card shows the new explosion pitch",
    );
    check(
      !landingText.includes("Unlisted kinetic specimen") && !landingText.includes("impact test"),
      "old specimen copy gone",
    );
    check(landingErrors.length === 0, "landing loads without errors");
    await landing.close();
  }

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

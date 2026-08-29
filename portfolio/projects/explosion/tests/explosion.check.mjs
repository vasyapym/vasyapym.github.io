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

    // Stress HUD: peak stress renders as a percentage on a fresh monument.
    const fresh = await readHudState(page);
    check(
      fresh.peak >= 0 && fresh.peak <= 100,
      `${label}: peak stress renders (${fresh.peak}%)`,
    );

    // Aim preview: hovering the plinth shows the ghost ring and the
    // solver's verdict ("≈ N voxels"); open sky clears it again.
    if (!mobile) {
      await page.mouse.move(
        stageBox.x + stageBox.width * 0.5,
        stageBox.y + stageBox.height * 0.84,
        { steps: 6 },
      );
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

    // Aim math for the pillar shots below: the hero banks occupy grid x
    // 18..25 and 38..45, which maps to roughly ±2.5 world units at the
    // camera's frozen fov 40 / z 20.5 framing.
    const aspect = stageBox.width / stageBox.height;
    const halfH = Math.tan((40 / 2) * (Math.PI / 180));
    const visibleWidth = 2 * 20.5 * halfH * aspect;
    const pillarFx = 2.55;
    const pillarFy = 0.58;
    const tap = async (px, py) => {
      if (mobile) {
        await page.touchscreen.tap(px, py);
      } else {
        await page.mouse.click(px, py);
      }
    };

    // Stress solver showcase: cut ONE pillar mid-height. The arch wall
    // catches the severed top sideways (no cascade), and the load it used
    // to carry detours through the survivor — the solved peak must climb
    // hard enough to cross the glow threshold.
    await tap(
      stageBox.x + stageBox.width * (0.5 + -pillarFx / visibleWidth),
      stageBox.y + stageBox.height * pillarFy,
    );
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
    let sawDilation = false;
    for (const side of [-pillarFx, pillarFx]) {
      const fx = 0.5 + side / visibleWidth;
      for (let i = 0; i < 3; i += 1) {
        await tap(stageBox.x + stageBox.width * fx, stageBox.y + stageBox.height * pillarFy);
        // Poll a little past the cam window so slower devices can surface
        // the hint between frames.
        for (let poll = 0; poll < 8 && !sawDilation; poll += 1) {
          await wait(160);
          sawDilation = await page.$eval(".explosion-hint", (el) =>
            /dilat/.test(el.textContent ?? ""),
          );
        }
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
      await page.mouse.click(stageBox.x + stageBox.width * 0.5, stageBox.y + stageBox.height * 0.45);
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
      return {
        label: spans[0]?.textContent ?? "",
        standing: Number.parseInt(strong?.textContent ?? "", 10),
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

    // A single direct hit on the plinth must visibly bite — no more silent
    // scuffs where the charge "breaks" audibly but the wall stays intact.
    await page.mouse.click(stageBox.x + stageBox.width * 0.5, stageBox.y + stageBox.height * 0.84);
    let bite = -1;
    for (let i = 0; i < 6 && bite < 100; i += 1) {
      await wait(120);
      bite = (await readHud()).standing;
    }
    check(bite < afterMiss.standing, `${label}: single direct hit takes a visible bite (${afterMiss.standing}% -> ${bite}%)`);

    // Chaos: rapid fire mixing hits and misses, restore punched mid-cascade,
    // more fire — state must stay consistent and settle back to a clean
    // 100% monument with all debris drained.
    const chaosTargets = [
      [0.44, 0.8], [0.56, 0.78], [0.5, 0.55], [0.35, 0.86], [0.62, 0.82],
      [0.47, 0.45], [0.53, 0.7], [0.4, 0.75], [0.58, 0.6], [0.5, 0.88],
    ];
    let maxDebris = 0;
    for (const [fx, fy] of chaosTargets) {
      await page.mouse.click(stageBox.x + stageBox.width * fx, stageBox.y + stageBox.height * fy);
      await wait(70);
      maxDebris = Math.max(maxDebris, await debrisCount(page));
    }
    await page.click(".explosion-control-restore");
    for (const [fx, fy] of chaosTargets.slice(0, 5)) {
      await page.mouse.click(stageBox.x + stageBox.width * fx, stageBox.y + stageBox.height * fy);
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

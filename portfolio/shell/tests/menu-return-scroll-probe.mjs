// Acceptance probe: returning to the main menu must restore the catalogue
// scroll offset the visitor left, instead of dropping them at the top.
//
// Flow under test: land on /, scroll the catalogue to a project row, open
// that project (in-app pushState), then press the frame's "← Vasily
// Argounov" back button — the landing must reappear at (±40px of) the
// captured offset. Also covers the no-intent fallback: a direct boot into a
// project (fresh load of /projects/<id>/) and a plain back must land at the
// top, as before.
//
//   CHROME_PATH=<bin> node portfolio/shell/tests/menu-return-scroll-probe.mjs
//
// Same harness as the other shell probes: puppeteer-core + a local Chrome
// binary, skips cleanly when no browser is available.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const viteJs = resolve(here, "../../node_modules/vite/bin/vite.js");
const PORT = 5223;
const BASE = `http://localhost:${PORT}`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("menu-return-scroll-probe: no Chrome/Chromium found — skipping (set CHROME_PATH)");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, [viteJs, "--port", String(PORT), "--strictPort"], {
  cwd: shellDir,
  stdio: "ignore",
  detached: true,
});
process.on("exit", () => {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
});

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

await waitForServer(`${BASE}/projects/kitty-run`);

let failures = 0;
const problems = [];
const check = (label, ok, detail) => {
  if (ok) {
    console.log(`ok   ${label}`);
  } else {
    failures += 1;
    problems.push(detail);
    console.log(`FAIL ${label}`);
    console.log(`     ${detail}`);
  }
};

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--no-first-run"],
});

try {
  // --- scenario 1: open a project from a scrolled catalogue, press back ---
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(600);

  // Scroll the catalogue to a mid-page anchor: the deepest row with a
  // project card is the safest deterministic target.
  const saved = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("a[id^='project-']")];
    const target = cards[cards.length - 1] ?? document.querySelector("section:last-of-type");
    const y = Math.max(120, target ? Math.round(target.getBoundingClientRect().top + window.scrollY - 120) : 800);
    window.scrollTo({ top: y, behavior: "instant" });
    return { savedY: Math.round(window.scrollY), id: target?.id?.replace("project-", "") ?? null };
  });
  await wait(400);
  const targetId = saved.id;
  if (!targetId) {
    failures += 1;
    console.log("FAIL scenario 1: no project card found on the landing");
  } else {
    // Click the catalogue card (same-document navigation).
    await page.evaluate((id) => {
      document.getElementById(`project-${id}`)?.click();
    }, targetId);
    await wait(1200);
    const inProject = await page.evaluate(() => ({
      path: window.location.pathname,
      y: Math.round(window.scrollY),
    }));
    check(
      "project opened at top",
      inProject.path.startsWith("/projects/") && inProject.y <= 2,
      `opened ${inProject.path} at scrollY=${inProject.y}`,
    );

    // Press the in-app back button.
    await page.evaluate(() => {
      const back = [...document.querySelectorAll("button")].find((b) =>
        /Vasily Argounov/.test(b.textContent ?? ""),
      );
      back?.click();
    });
    await wait(900);
    const backState = await page.evaluate(() => ({
      path: window.location.pathname,
      y: Math.round(window.scrollY),
    }));
    const drift = Math.abs(backState.y - saved.savedY);
    check(
      "back restores the catalogue offset",
      backState.path === "/" && drift <= 40,
      `back landed at ${backState.path} scrollY=${backState.y}, expected ≈${saved.savedY} (drift ${drift}px)`,
    );

    // The return mount shows the settled catalogue: every card carries
    // is-revealed, and no entrance keyframe runs on a visible card.
    const settled = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("[data-project-reveal]")];
      const unRevealed = cards.filter((c) => !c.classList.contains("is-revealed")).length;
      const animation = cards.length ? getComputedStyle(cards[0]).animationName : "";
      const instant = document.querySelector(".signal-index-reveal-instant") != null;
      return { unRevealed, animation, instant };
    });
    check(
      "return mount: every card settled",
      settled.unRevealed === 0 && settled.instant,
      `${settled.unRevealed} card(s) still un-revealed after return (instant class: ${settled.instant})`,
    );
    check(
      "return mount: no entrance keyframe",
      settled.animation === "none",
      `returned card animationName=${settled.animation}, expected none`,
    );

    // The intent is single-shot: a second return without opening a project
    // keeps the plain top behaviour.
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await wait(300);
  }
  await page.close();

  // --- scenario 2: direct project boot, back lands at the top ---
  const direct = await browser.newPage();
  await direct.setViewport({ width: 1440, height: 810 });
  await direct.goto(`${BASE}/projects/evening-forest/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(800);
  await direct.evaluate(() => {
    const back = [...document.querySelectorAll("button")].find((b) =>
      /Vasily Argounov/.test(b.textContent ?? ""),
    );
    back?.click();
  });
  await wait(900);
  const directBack = await direct.evaluate(() => ({
    path: window.location.pathname,
    y: Math.round(window.scrollY),
  }));
  check(
    "no-intent back lands at top",
    directBack.path === "/" && directBack.y <= 2,
    `direct boot back landed at ${directBack.path} scrollY=${directBack.y}`,
  );
  await direct.close();

  // --- scenario 3 (control): a fresh landing still plays the entrance ---
  const fresh = await browser.newPage();
  await fresh.setViewport({ width: 1440, height: 810 });
  await fresh.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);
  // The hero fills the first screen; scroll into the grid so the sweep
  // reveals a card, then sample the running keyframe.
  await fresh.evaluate(() => {
    window.scrollTo({ top: Math.round(window.innerHeight * 0.8), behavior: "instant" });
  });
  await wait(150);
  const freshReveal = await fresh.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-project-reveal]")];
    const inView = cards.find((c) => {
      const r = c.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0 && c.classList.contains("is-revealed");
    });
    return inView ? getComputedStyle(inView).animationName : "no-in-view-card";
  });
  check(
    "fresh load still reveals with the keyframe",
    freshReveal === "gem-reveal",
    `fresh in-view card animationName=${freshReveal}, expected gem-reveal`,
  );
  await fresh.close();
} finally {
  await browser.close();
}

if (problems.length > 0) console.log(problems.join("\n"));
console.log(failures === 0 ? "menu-return-scroll-probe: all returns land where the visitor left" : `menu-return-scroll-probe: ${failures} failing scenario(s)`);
process.exit(failures === 0 ? 0 : 1);

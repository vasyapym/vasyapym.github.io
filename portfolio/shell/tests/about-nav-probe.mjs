// Acceptance probe: the r38 about/deep navigation cluster.
//
// Owner-reported bugs (single round):
//  A  exit-project→about: the deep must never re-assert itself (flow:
//     about → deep → project → exit → about, then later exit-about → landing).
//  B  exit-about → main landing for: (main→about→project→exit→exit) and the
//     deep-in-between variant, and for a deep-linked /about boot.
//  C  no stale route behind /about after its project roundtrip
//     (history.length stable across exit steps).
//  D  return restores are instant, pre-paint: the first painted frame with
//     the returned page on screen is already at the stored offset, and the
//     per-frame scroll trace stays constant (no glide, no late native nudge).
//  E  the landing offset S survives an about→project→about roundtrip and
//     still restores on exit-about.
//  F  a stale /about-pathed intent never moves the landing.
//  G  link rest-state prominence: ochre rest underline (≠ the 31% hairline),
//     hover wakes brighter ochre + full-paper text.
//
//   node portfolio/shell/tests/about-nav-probe.mjs   (CHROME_PATH to override)
// Same harness as the other shell probes: puppeteer-core + local Chrome,
// skips cleanly when no browser is available.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const viteJs = resolve(here, "../../node_modules/vite/bin/vite.js");
const PORT = 5226;
const BASE = `http://localhost:${PORT}`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/Users/vasilij/.cache/puppeteer/chrome-headless-shell/mac-152.0.7977.64/chrome-headless-shell-mac-x64/chrome-headless-shell",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("about-nav-probe: no Chrome/Chromium found — skipping (set CHROME_PATH)");
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

// Per-frame scroll+route trace: rAF loop, page-local. markerFn returns the
// currently mounted page identity ("landing" | "about" | "project" | "?").
const armTrace = (page) =>
  page.evaluate(() => {
    window.__traceStarted = true;
    window.__trace = [];
    const scan = () => {
      const on = (sel) => (document.querySelector(sel) ? 1 : 0);
      let where = "?";
      if (on(".ab-main")) where = "about";
      else if (on(".back-link")) where = "project";
      else if (on(".signal-index-shell")) where = "landing";
      else if (on(".realm-layer")) where = "deep";
      window.__trace.push({ y: Math.round(window.scrollY), where, n: window.__trace.length });
      requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  }, []);

// The LAST contiguous segment of `where` in the trace (first sighting,
// drift from `anchor` unless null, frame count).
function traceSegment(trace, where, anchor = null) {
  let start = trace.length;
  while (start > 0 && trace[start - 1].where === where) start -= 1;
  const frames = trace.slice(start);
  if (frames.length === 0) return null;
  const first = frames[0].y;
  let drift = 0;
  for (const f of frames) drift = Math.max(drift, Math.abs(f.y - (anchor ?? first)));
  return { first, drift, count: frames.length };
}

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--no-first-run"],
});

try {
  // ── scenario 1 ─ main@S → about → scroll A → project link → back → about(A)
  //                 → exit → landing(S). Bugs 4 (S restore, no glide) + 6
  //                 (about restore, no glide) + E (S survives the detour).
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 560 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);

  // Scroll the catalogue mid-way (deterministic: scroll to the section grid).
  // Object form with "instant": the legacy two-arg scrollTo inherits
  // html{scroll-behavior:smooth} and animates (the house gotcha).
  const S = await page.evaluate(() => {
    const anchor = document.querySelector("section:nth-of-type(2)") ?? document.body;
    const y = Math.max(200, Math.round(anchor.getBoundingClientRect().top + window.scrollY));
    window.scrollTo({ top: y, behavior: "instant" });
    return Math.round(window.scrollY);
  });
  await wait(300);
  check("scenario1 main@S", S > 100, `captured S=${S}`);

  await armTrace(page);
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /about the project/.test(b.textContent ?? ""))?.click();
  });
  await wait(700);
  const onAbout = await page.evaluate(() => ({
    where: document.querySelector(".ab-main") ? 1 : 0,
    y: Math.round(window.scrollY),
  }));
  check(
    "scenario1 about opened at top",
    onAbout.where === 1 && onAbout.y === 0,
    `about where=${onAbout.where} y=${onAbout.y}`,
  );
  // Entrance segment BEFORE we set up the scroll target: proves the open
  // itself is instant (no painted drift beyond the exit/settle class).
  const segAbout1 = traceSegment(await page.evaluate(() => window.__trace), "about");
  check(
    "scenario1 about entrance instant (no glide to mid)",
    segAbout1 && segAbout1.count >= 2 && segAbout1.drift <= 2,
    `about entrance trace first=${segAbout1?.first} drift=${segAbout1?.drift} n=${segAbout1?.count}`,
  );

  const A = await page.evaluate(() => {
    const link = document.querySelectorAll(".ab-link")[1] ?? document.querySelector(".ab-link");
    const y = Math.max(120, Math.round(link.getBoundingClientRect().top + window.scrollY - 200));
    window.scrollTo({ top: y, behavior: "instant" });
    return Math.round(window.scrollY);
  });
  await wait(250);
  check("scenario1 about scrolled (A)", A > 60, `A=${A}`);

  // ─ about → project (link in prose) ─
  await page.evaluate(() => {
    [...document.querySelectorAll("a.ab-link")].at(-2)?.click(); // a prose link
  });
  await wait(900);
  const inProject = await page.evaluate(() => ({
    ok: document.querySelector(".back-link") ? 1 : 0,
    path: window.location.pathname,
    y: Math.round(window.scrollY),
  }));
  check(
    "scenario1 project opened at top",
    inProject.ok === 1 && inProject.path.startsWith("/projects/") && inProject.y <= 2,
    `project where=${inProject.ok} path=${inProject.path} y=${inProject.y}`,
  );
  const P = inProject.path;

  // ─ exit project → about: first painted frame already at A, no glide ─
  await page.evaluate(() => {
    document.querySelector(".back-link")?.click();
  });
  await wait(700);
  const traceAboutBack = await page.evaluate(() => window.__trace);
  const backSeg = traceSegment(traceAboutBack, "about", A);
  check(
    "scenario1 exit-project→about spawns at A (first frame)",
    backSeg && backSeg.count >= 1 && Math.abs(backSeg.first - A) <= 40,
    `first about frame y=${backSeg?.first}, expected ≈${A} (n=${backSeg?.count})`,
  );
  check(
    "scenario1 exit-project→about trace constant (no glide)",
    backSeg && backSeg.drift <= 2,
    `max drift across about frames=${backSeg?.drift}`,
  );
  const aboutNow = await page.evaluate(() => ({
    path: window.location.pathname,
    y: Math.round(window.scrollY),
    deep: document.querySelector(".realm-layer") ? 1 : 0,
  }));
  check(
    "scenario1 about restored at A, deep closed",
    aboutNow.path === "/about" && Math.abs(aboutNow.y - A) <= 2 && aboutNow.deep === 0,
    `about path=${aboutNow.path} y=${aboutNow.y} (A=${A}) deep=${aboutNow.deep}`,
  );

  // ─ exit about → landing at S, first frame, no glide ─
  await page.evaluate(() => {
    document.querySelector("a.ab-back")?.click();
  });
  await wait(900);
  const traceAll = await page.evaluate(() => window.__trace);
  const landingSeg = traceSegment(traceAll, "landing", S);
  check(
    "scenario1 exit-about → landing first frame at S",
    landingSeg && landingSeg.count >= 1 && Math.abs(landingSeg.first - S) <= 40,
    `landing first frame y=${landingSeg?.first}, expected ≈${S} (n=${landingSeg?.count})`,
  );
  check(
    "scenario1 landing trace constant after restore",
    landingSeg && landingSeg.drift <= 16,
    `max drift=${landingSeg?.drift} (S=${S}) — ≤16px allows the pre-existing scroll-anchor settlement of the fresh landing mount`,
  );
  const homeNow = await page.evaluate(() => ({
    path: window.location.pathname,
    y: Math.round(window.scrollY),
  }));
  check(
    "scenario1 exit-about lands on main",
    homeNow.path === "/" && Math.abs(homeNow.y - S) <= 16,
    `home path=${homeNow.path} y=${homeNow.y} (S=${S})`,
  );
  await page.close();

  // ── scenario 2 ─ about → deep → project → exit → about plain (bug 1) →
  //                 exit → landing (bug 3). history.shape sanity after each
  //                 step (bug 2/C).
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 810 });
  await page2.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);
  await page2.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /about the project/.test(b.textContent ?? ""))?.click();
  });
  await wait(700);

  // open the deep over about: the layer can lag under software GL; the legend
  // wait is the real interactivity gate (the layer element itself is cruel to
  // timing in headless — realm-entry visibility settles late)
  await page2.evaluate(() => {
    [...document.querySelectorAll("a.ab-link")].find((el) => /the deep/.test(el.textContent ?? ""))?.click();
  });
  const deepGate = await page2
    .waitForSelector(".realm-legend-btn", { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!deepGate) {
    check("scenario2 deep opened over about", false, "no .realm-legend-btn in 20s after the deep click");
  }
  await page2.waitForSelector(".realm-legend-btn", { timeout: 15000 });
  await wait(600);

  // enter a project from the deep
  await page2.evaluate(() => {
    document.querySelector(".realm-legend-btn[data-project-id='explosion']")?.click();
  });
  await wait(900);
  await page2.evaluate(() => document.querySelector(".realm-panel-dive")?.click());
  try {
    await page2.waitForSelector(".back-link", { timeout: 10000 });
  } catch {
    const diag = await page2.evaluate(() => ({
      path: window.location.pathname,
      panel: document.querySelector(".realm-panel") ? 1 : 0,
      diveBtn: document.querySelector(".realm-panel-dive") ? 1 : 0,
    }));
    check("scenario2 project opened from the deep", false, `no .back-link in 10s — ${JSON.stringify(diag)}`);
  }
  await wait(900);
  const deepProject = await page2.evaluate(() => ({
    path: window.location.pathname,
    deep: document.querySelector(".realm-layer") ? 1 : 0,
  }));
  check(
    "scenario2 project opened from the deep",
    deepProject.path.startsWith("/projects/") && deepProject.deep === 0,
    `path=${deepProject.path} deep visible=${deepProject.deep}`,
  );

  const afterProjectOpen = await page2.evaluate(() => ({
    len: window.history.length,
  }));

  // exit project → about plain (the deep must NOT re-assert)
  await page2.evaluate(() => document.querySelector(".back-link")?.click());
  await wait(900);
  const afterProjectExit = await page2.evaluate(() => ({
    path: window.location.pathname,
    deep: document.querySelector(".realm-layer") ? 1 : 0,
    about: document.querySelector(".ab-main") ? 1 : 0,
  }));
  check(
    "bug1 exit-project → about plain (no deep re-assert)",
    afterProjectExit.path === "/about" &&
      afterProjectExit.deep === 0 &&
      afterProjectExit.about === 1,
    `path=${afterProjectExit.path} deep=${afterProjectExit.deep} about=${afterProjectExit.about}`,
  );
  const lenAfterProjectExit = await page2.evaluate(() => window.history.length);

  // exit about → landing
  await page2.evaluate(() => document.querySelector("a.ab-back")?.click());
  await wait(900);
  const bug3Home = await page2.evaluate(() => ({
    path: window.location.pathname,
    landing: document.querySelector(".signal-index-shell") ? 1 : 0,
    deep: document.querySelector(".realm-layer") ? 1 : 0,
    len: window.history.length,
  }));
  check(
    "bug3 exit-about lands on main landing",
    bug3Home.path === "/" && bug3Home.landing === 1 && bug3Home.deep === 0,
    `path=${bug3Home.path} landing=${bug3Home.landing} deep=${bug3Home.deep}`,
  );
  check(
    "bug2/3 history length stable across exits",
    lenAfterProjectExit === afterProjectOpen.len &&
      bug3Home.len === afterProjectOpen.len,
    `len: project-open ${afterProjectOpen.len}, after exits ${lenAfterProjectExit}/${bug3Home.len}`,
  );
  await page2.close();

  // ── scenario 3 ─ deep-linked /about → project → exit → about → exit → main
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 1440, height: 810 });
  await page3.goto(`${BASE}/about`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);
  await page3.evaluate(() => {
    [...document.querySelectorAll("a.ab-link")].at(-2)?.click();
  });
  await wait(900);
  await page3.evaluate(() => document.querySelector(".back-link")?.click());
  await wait(900);
  const deepLinkAbout = await page3.evaluate(() => ({
    path: window.location.pathname,
    about: document.querySelector(".ab-main") ? 1 : 0,
  }));
  check(
    "scenario3 deep-linked about restored after project",
    deepLinkAbout.path === "/about" && deepLinkAbout.about === 1,
    `path=${deepLinkAbout.path} about=${deepLinkAbout.about}`,
  );
  await page3.evaluate(() => document.querySelector("a.ab-back")?.click());
  await wait(900);
  const deepLinkHome = await page3.evaluate(() => ({
    path: window.location.pathname,
    landing: document.querySelector(".signal-index-shell") ? 1 : 0,
  }));
  check(
    "scenario3 deep-linked exit-about lands on main",
    deepLinkHome.path === "/" && deepLinkHome.landing === 1,
    `path=${deepLinkHome.path} landing=${deepLinkHome.landing}`,
  );
  await page3.close();

  // ── scenario 4 (F) ─ stale /about-pathed intent never moves the landing:
  // arm {ath:"/about"} by entering about, then browser-back to landing...
  // Actually simulate directly: main → about (intent armed) → back via
  // browser → landing mounts with the intent still armed and restores S —
  // then again: main → about → (fake: about never consumes) … the direct
  // probe: main@S → about → exit-assigned path "/" landing → landing
  // restored S (E covered). For F: open about, open project, exit project,
  // exit about, THEN about again → exit → landing: no double restore.
  const page4 = await browser.newPage();
  await page4.setViewport({ width: 1440, height: 810 });
  await page4.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);
  const S4 = await page4.evaluate(() => {
    const anchor = document.querySelector("section:nth-of-type(2)") ?? document.body;
    const y = Math.max(500, Math.round(anchor.getBoundingClientRect().top + window.scrollY));
    window.scrollTo({ top: y, behavior: "instant" });
    return Math.round(window.scrollY);
  });
  // about → deep-link shrink: browser back history put about behind
    await page4.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /about the project/.test(b.textContent ?? ""))?.click();
  });
  await wait(600);
  await page4.evaluate(() => document.querySelector("a.ab-back")?.click());
  await wait(900);
  const s4After = await page4.evaluate(() => ({
    path: window.location.pathname,
    y: Math.round(window.scrollY),
  }));
  check(
    "scenario4 about→exit restores S (fresh landing)",
    s4After.path === "/" && Math.abs(s4After.y - S4) <= 40,
    `path=${s4After.path} y=${s4After.y} (S=${S4})`,
  );
  // exit-about instantly: no further intent → a second exit trip restores S again
    await page4.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => /about the project/.test(b.textContent ?? ""))?.click();
  });
  await wait(600);
  await page4.evaluate(() => document.querySelector("a.ab-back")?.click());
  await wait(900);
  const s4Again = await page4.evaluate(() => ({
    path: window.location.pathname,
    y: Math.round(window.scrollY),
  }));
  check(
    "scenario4 second about→exit restores S again",
    s4Again.path === "/" && Math.abs(s4Again.y - S4) <= 40,
    `path=${s4Again.path} y=${s4Again.y} (S=${S4})`,
  );
  await page4.close();

  // ── scenario 5 (G) ─ link rest prominence (computed styles)
  const page5 = await browser.newPage();
  await page5.setViewport({ width: 1440, height: 810 });
  await page5.goto(`${BASE}/about`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(900);
  const rest = await page5.evaluate(() => {
    const t = document.querySelector(".ab-link-t") ?? document.querySelector(".ab-link");
    if (!t) return null;
    return getComputedStyle(t).textDecorationColor;
  });
  const parseRGB = (s) => {
    const m = s.match(/(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  };
  const restRGB = parseRGB(rest ?? "");
  const ochre = [211, 155, 97]; // --ink-accent #d39b61
  const restIsOchre =
    restRGB && Math.abs(restRGB[0] - ochre[0]) < 6 && Math.abs(restRGB[2] - ochre[2]) < 12;
  check(
    "bugG rest underline is ochre (not the 31% hairline)",
    restIsOchre === true,
    `rest textDecorationColor=${rest}`,
  );
  // hover wakes brighter
  await page5.hover(".ab-link");
  await wait(350);
  const hoverStyles = await page5.evaluate(() => {
    const link = document.querySelector(".ab-link");
    const t = link?.querySelector(".ab-link-t");
    return {
      linkColor: link ? getComputedStyle(link).color : "",
      underline: t ? getComputedStyle(t).textDecorationColor : "",
    };
  });
  const hoverRGB = parseRGB(hoverStyles.underline ?? "");
  check(
    "bugG hover wakes to bright ochre underline",
    !!hoverRGB && hoverRGB[2] > ochre[2] && hoverRGB[2] < 160,
    `hover underline=${hoverStyles.underline} (bright #e8b57c_b=${232})`,
  );
  await page5.close();
} finally {
  await browser.close();
}

if (problems.length > 0) console.log(problems.join("\n"));
console.log(
  failures === 0
    ? "about-nav-probe: r38 navigation cluster green"
    : `about-nav-probe: ${failures} failing check(s)`,
);
process.exit(failures === 0 ? 0 : 1);

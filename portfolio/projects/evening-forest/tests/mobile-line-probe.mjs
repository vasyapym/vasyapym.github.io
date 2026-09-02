// One-off mobile probe for the "white line" report: boots the shell, visits
// the evening-forest page at common phone widths in an iPhone-class
// (touch, mobile) Chrome, and in both rest and playing states
//   1. screenshots the full page to /tmp/ef-mobile-probe,
//   2. scans the DOM for visible elements painted with light
//      backgrounds/borders/outlines/shadows (the "stray white" sweep),
//   3. checks geometry: any gap below the stage, page overflow, or
//      light body background exposed.
// Run: node projects/evening-forest/tests/mobile-line-probe.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "/tmp/ef-mobile-probe";
mkdirSync(OUT, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean).filter(existsSync);
if (!candidates.length) {
  console.error("no chrome (set CHROME_PATH)");
  process.exit(1);
}
const { default: puppeteer } = await import("puppeteer-core");
// chrome-headless-shell only speaks the old headless mode.
const headlessMode = candidates[0].includes("chrome-headless-shell")
  ? "shell"
  : "new";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await wait(500);
  }
  throw new Error("dev server never came up");
}

const server = spawn(
  process.execPath,
  [
    resolve(shellDir, "../node_modules/vite/bin/vite.js"),
    "--host", "0.0.0.0",
    "--port", String(PORT),
    "--strictPort",
  ],
  { cwd: shellDir, stdio: "ignore", detached: true, env: process.env },
);
process.on("exit", () => { try { process.kill(-server.pid); } catch {} });

await waitForServer(BASE);
const browser = await puppeteer.launch({
  executablePath: candidates[0],
  headless: headlessMode,
  args: ["--no-first-run"],
});

const VIEWPORTS = [
  { label: "360", width: 360, height: 740 },
  { label: "390", width: 390, height: 844 },
  { label: "414", width: 414, height: 896 },
];

const SCAN = () => {
  const lum = (cssColor) => {
    const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?/.exec(cssColor || "");
    if (!m) return null;
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if (a === 0) return null;
    const [r, g, b] = [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
    return { a, lum: 0.2126 * r + 0.7152 * g + 0.0722 * b };
  };
  const out = [];
  const seen = new Set();
  const els = document.querySelectorAll("*");
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    const paintables = [
      ["bg", cs.backgroundColor, r.width > 0 && r.height > 0],
      ["border-top", cs.borderTopColor, parseFloat(cs.borderTopWidth) > 0],
      ["border-bottom", cs.borderBottomColor, parseFloat(cs.borderBottomWidth) > 0],
      ["border-left", cs.borderLeftColor, parseFloat(cs.borderLeftWidth) > 0],
      ["border-right", cs.borderRightColor, parseFloat(cs.borderRightWidth) > 0],
      ["outline", cs.outlineColor, cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0],
      ["shadow", cs.boxShadow, cs.boxShadow !== "none"],
    ];
    const tag = (el.className?.toString?.() || el.tagName).slice(0, 70);
    for (const [kind, color, active] of paintables) {
      if (!active) continue;
      // Gradients/shadows can embed several colors; test every rgba chunk.
      const chunks = kind === "shadow" || kind === "bg"
        ? (color || "").match(/rgba?\([^)]*\)/g) || []
        : [color];
      for (const chunk of chunks) {
        const v = lum(chunk);
        if (v && v.lum > 0.72 && v.a > 0.05) {
          const key = tag + "|" + kind + "|" + chunk;
          if (seen.has(key)) break;
          seen.add(key);
          out.push({
            el: tag,
            kind,
            paint: chunk,
            lum: +v.lum.toFixed(2),
            a: +v.a.toFixed(2),
            rect: { x: +r.left.toFixed(0), y: +r.top.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) },
          });
          break;
        }
      }
    }
    // Pseudo-elements can paint hairlines too.
    for (const pseudo of ["::before", "::after"]) {
      const pcs = getComputedStyle(el, pseudo);
      if (pcs.content === "none" || pcs.content === '""') continue;
      if (pcs.display === "none") continue;
      const pr = el.getBoundingClientRect();
      const v = lum(pcs.backgroundColor);
      if (v && v.lum > 0.72 && v.a > 0.05 && pr.width > 0) {
        const key = tag + "|" + pseudo + "|bg";
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ el: tag, kind: pseudo + "-bg", paint: pcs.backgroundColor, lum: +v.lum.toFixed(2), a: +v.a.toFixed(2), rect: { x: +pr.left.toFixed(0), y: +pr.top.toFixed(0), w: +pr.width.toFixed(0), h: +pr.height.toFixed(0) } });
        }
      }
    }
  }
  return out;
};

const GEO = () => {
  const q = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1) };
  };
  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    dvh: window.visualViewport ? +window.visualViewport.height.toFixed(1) : null,
    scrollH: document.documentElement.scrollHeight,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    frame: q(".project-frame"),
    topbar: q(".project-frame-topbar"),
    page: q(".evening-forest-page"),
    stage: q(".evening-forest-stage"),
    canvas: q(".evening-forest-stage canvas"),
  };
};

const report = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error("CONSOLE ERROR:", m.text());
  });

  await page.goto(`${BASE}/projects/evening-forest`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await wait(4500);

  const restScan = await page.evaluate(SCAN);
  const restGeo = await page.evaluate(GEO);
  await page.screenshot({ path: `${OUT}/${vp.label}-rest.png` });

  await page.tap(".evening-forest-enter");
  await wait(1800);
  const playScan = await page.evaluate(SCAN);
  const playGeo = await page.evaluate(GEO);
  await page.screenshot({ path: `${OUT}/${vp.label}-play.png` });

  // Back to rest via the Rest button, in case the playing rest overlay differs.
  const restBtn = await page.$(".ef-touch-button:last-child");
  if (restBtn) {
    await restBtn.tap();
    await wait(900);
    await page.screenshot({ path: `${OUT}/${vp.label}-rested.png` });
  }

  report.push({ viewport: vp, restGeo, playGeo, restScan, playScan });
  await page.close();
}

await browser.close();
process.kill(-server.pid);
console.log(JSON.stringify(report, null, 1));
console.log("probe done ->", OUT);

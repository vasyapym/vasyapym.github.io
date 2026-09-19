// Landing scrollbar gate — regression check for the main-menu scrollbar.
//
// Bug: the shell landing is a full-height scrollable document, so the engine
// paints its scrollbar — a classic bar on desktop platforms and the native
// indicator on iOS. The owner noticed it right after the quicknotes N033 pass
// removed the card's inner (second) scrollbar: with one bar left it became
// unwanted on the main menu, desktop and mobile both. Owner verdict: the main
// menu never paints its scrollbar, but the page must keep scrolling.
//
// Fix: LandingPage sets html[data-no-scroll-bar] (route-local, restored on
// unmount); styles.css hides the bar via scrollbar-width:none PLUS an
// UNCONDITIONAL webkit display:none — the owner device check proved the
// fine-pointer scoping left the big classic bar on iOS Safari (older 18.x
// lacks scrollbar-width), so for the document scroller the webkit kill
// applies in every context: it is the mechanism that hides the bar in both
// classic and overlay WebKit modes.
//
// This gate loads the BUILT site and asserts, per context:
//   G1 desktop landing — attribute set, bar hidden (where the engine supports
//      scrollbar-width), page still scrolls;
//   G2 touch landing — attribute set (WebKit touch contexts included);
//   G3 route-local — a project page clears the attribute and keeps its bar;
//   G4 static — the webkit kill in the built CSS is unconditional (not inside
//      any fine-pointer-only media block).
//
//   node shell/tests/landing-scrollbar-gate.mjs     (from portfolio/)
//   node tests/landing-scrollbar-gate.mjs           (from shell/)
//
// Skips cleanly when neither Playwright WebKit nor Chrome is available.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const home = homedir();

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const distDir = join(shellDir, "dist");
const OUT = join(shellDir, ".landing-scrollbar-gate");
mkdirSync(OUT, { recursive: true });

// ---- static server for dist (SPA fallback via 404.html) -------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  let file = resolve(join(distDir, "." + pathname));
  if (!file.startsWith(distDir)) { res.writeHead(403); res.end(); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) {
    file = pathname.startsWith("/projects/") ? join(distDir, "404.html") : join(distDir, "index.html");
  }
  try {
    const data = readFileSync(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

// ---- browser: Playwright WebKit first (the owner's engine), Chrome fallback
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/chromium",
].filter(Boolean);

let browser = null;
let engine = "chrome";
let isPlaywright = false;
try {
  const { webkit } = await import("playwright-core");
  const candidates = [
    join(home, "Library/Caches/ms-playwright/webkit-2104/pw_run.sh"),
    join(home, "Library/Caches/ms-playwright/webkit-2070/pw_run.sh"),
  ];
  const webkitPath = candidates.find((p) => existsSync(p));
  if (!webkitPath) throw new Error("no cached WebKit");
  browser = await webkit.launch({ headless: true, executablePath: webkitPath });
  engine = "webkit";
  console.log("landing-scrollbar-gate: running on Playwright WebKit (the owner's engine)");
} catch {
  const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chromePath) {
    console.log("landing-scrollbar-gate: neither Playwright WebKit nor Chrome found — skipping");
    process.exit(0);
  }
  const puppeteer = (await import("puppeteer-core")).default;
  browser = await puppeteer.launch({ headless: "new", executablePath: chromePath, args: ["--no-first-run"] });
  console.log("landing-scrollbar-gate: running on Chrome (WebKit unavailable)");
}

const problems = [];
const check = (ok, label) => {
  if (!ok) problems.push(`assert: ${label}`);
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Playwright and puppeteer name these differently; normalize.
const setViewport = async (page, { width, height, touch }) => {
  if (typeof page.setViewportSize === "function") {
    await page.setViewportSize({ width, height });
    if (touch) await page.emulateMedia({ pointer: "coarse", hover: "none" });
  } else {
    await page.setViewport({ width, height, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch });
  }
};
const waitFor = async (page, fn, timeout) => {
  if (typeof page.setViewportSize === "function") {
    await page.waitForFunction(fn, undefined, { timeout });
  } else {
    await page.waitForFunction(fn, { timeout });
  }
};

const readState = () => ({
  attr: document.documentElement.hasAttribute("data-no-scroll-bar"),
  sbWidth: getComputedStyle(document.documentElement).scrollbarWidth,
  supportsSbWidth: CSS.supports("scrollbar-width", "none"),
});

// Instant scroll only: html{scroll-behavior:smooth} animates plain scrollTo.
const probeScroll = () =>
  new Promise((done) => {
    const max = document.scrollingElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: 300, behavior: "instant" });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const y = window.scrollY;
        window.scrollTo({ top: 0, behavior: "instant" });
        done(max > 0 && y >= 300);
      }),
    );
  });

// ---------------------------------------------------------------------------
// G1 — desktop landing (1440×900, fine pointer): bar hidden, scroll intact.
{
  const page = await browser.newPage();
  await setViewport(page, { width: 1440, height: 900, touch: false });
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".signal-index")), 20000);
  await wait(600);
  const s = await page.evaluate(readState);
  check(s.attr, "desktop landing sets html[data-no-scroll-bar]");
  check(
    !s.supportsSbWidth || s.sbWidth === "none",
    `desktop hides the document scrollbar (scrollbar-width=${s.sbWidth}${s.supportsSbWidth ? "" : " — engine lacks scrollbar-width, attribute-only pass"})`,
  );
  const scrolls = await page.evaluate(probeScroll);
  check(scrolls, "landing still scrolls with the bar hidden");
  await page.close();
}

// G2 — touch landing (390×844 coarse pointer): attribute set; the hide must
// not depend on the fine-pointer-only webkit rule here.
{
  const page = await browser.newPage();
  await setViewport(page, { width: 390, height: 844, touch: true });
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".signal-index")), 20000);
  await wait(600);
  const s = await page.evaluate(readState);
  check(s.attr, "mobile landing sets html[data-no-scroll-bar]");
  check(
    !s.supportsSbWidth || s.sbWidth === "none",
    `mobile hides the bar where the engine supports it (${s.sbWidth})`,
  );
  await page.close();
}

// G3 — route-local: a project page clears the attribute and keeps its bar.
{
  const page = await browser.newPage();
  await setViewport(page, { width: 1440, height: 900, touch: false });
  await page.goto(`${base}/projects/practice-map`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".pg-card")), 25000);
  await wait(600);
  const s = await page.evaluate(readState);
  check(!s.attr, "project page clears the landing attribute (route-local)");
  check(s.sbWidth !== "none", `project page keeps its scrollbar (${s.sbWidth})`);
  await page.close();
}

// G4 — the owner device check (iOS Safari: the bar survived the fine-pointer
// scoping and stayed big) inverted the scoping: for the DOCUMENT scroller the
// webkit kill must be UNCONDITIONAL — it is the only mechanism that hides the
// bar in both classic and overlay modes on every WebKit version. Assert: every
// html[data-no-scroll-bar]::-webkit-scrollbar rule in the built CSS sits OUTSIDE
// any fine-pointer-only media block.
{
  let built = "";
  try {
    const cssDir = join(distDir, "assets");
    for (const f of readdirSync(cssDir)) {
      if (f.endsWith(".css")) built += readFileSync(join(cssDir, f), "utf8");
    }
  } catch {}
  if (built) {
    let unscoped = 0;
    let scoped = 0;
    for (
      let at = built.indexOf("data-no-scroll-bar]::-webkit-scrollbar");
      at !== -1;
      at = built.indexOf("data-no-scroll-bar]::-webkit-scrollbar", at + 1)
    ) {
      // Walk backwards through brace depth to the enclosing block's opening
      // brace; if that block is a @media with hover/pointer:fine in its
      // condition, the occurrence is scoped (and would NOT apply on iOS).
      let depth = 0;
      let fine = false;
      for (let j = at; j >= 0; j -= 1) {
        const ch = built[j];
        if (ch === "}") depth += 1;
        else if (ch === "{") {
          if (depth === 0) {
            const head = built.slice(Math.max(0, built.lastIndexOf(";", j) + 1), j);
            if (/@media/.test(head) && (/hover/.test(head) || /pointer\s*:\s*fine/.test(head))) fine = true;
            break;
          }
          depth -= 1;
        }
      }
      if (fine) scoped += 1;
      else unscoped += 1;
    }
    check(unscoped > 0 && scoped === 0, `webkit kill unconditional on the document (unscoped ${unscoped}, fine-pointer-scoped ${scoped})`);
  } else {
    console.log("ok   (built css not found — G4 static scoping check skipped)");
  }
}

console.log(problems.length ? `landing-scrollbar-gate: ${problems.length} FAIL` : "landing-scrollbar-gate: ALL PASSED");
console.log(`engine: ${engine}`);
await browser.close();
process.exit(problems.length ? 1 : 0);

// Landing scrollbar gate — regression check for the main-menu scrollbar.
//
// Bug history (3 device verdicts from the owner, one bug, three passes):
//   P1: a bar "appeared" on the landing (the quicknotes card's inner bar went
//       quiet; the host bar became the only visible one). First fix: hide it.
//   P2: on iOS the bar stayed AND went big — the fine-pointer scoping never
//       applied on iOS; the unconditional webkit display:none engaged the
//       classic bar instead (iOS ignores scrollbar-width on the root).
//   P3: color-scheme: dark didn't darken it — the REAL law was already in the
//       repo (practice-map round 4): ANY non-auto scrollbar-width makes
//       Safari 18+/Chrome 121+ ignore every webkit pseudo and draw the
//       engine default — the light bar. And iOS forces the root indicator to
//       exist regardless.
//   P3 final (owner's direct ask: "why didn't you just make it black?"): the
//       landing renders its bar in the INK register — the practice-map
//       reader's approved treatment (8px, transparent track, translucent
//       paper thumb, 999px radius, literal rgba because custom properties do
//       not resolve inside scrollbar pseudos), unconditional, and WITHOUT
//       scrollbar-width (the interop poison).
//
// This gate loads the BUILT site and asserts, per context:
//   G1 desktop landing — attribute set, NO scrollbar-width (interop law:
//      the engine must actually apply the webkit pseudos), color-scheme dark
//      (Firefox fallback), page still scrolls;
//   G2 touch landing — same contract (the styled bar applies on iOS too);
//   G3 route-local — a project page clears the attribute and keeps its bar;
//   G4 static — the ink webkit rules exist unconditionally (not inside any
//      fine-pointer media), and no scrollbar-width:none is attached to the
//      attribute (the interop poison that resurrected the white bar).
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
  attr: document.documentElement.hasAttribute("data-ink-scroll-bar"),
  sbWidth: getComputedStyle(document.documentElement).scrollbarWidth,
  colorScheme: getComputedStyle(document.documentElement).colorScheme,
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
// G1 — desktop landing (1440×900, fine pointer): ink bar wired, scroll intact.
{
  const page = await browser.newPage();
  await setViewport(page, { width: 1440, height: 900, touch: false });
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".signal-index")), 20000);
  await wait(600);
  const s = await page.evaluate(readState);
  check(s.attr, "desktop landing sets html[data-ink-scroll-bar]");
  // The interop law: a non-auto scrollbar-width would make Safari 18+ ignore
  // every webkit pseudo and resurrect the engine-default light bar.
  check(s.sbWidth === "auto", `no scrollbar-width poison on the landing (${s.sbWidth})`);
  check(
    /dark/.test(s.colorScheme),
    `root color-scheme covers the Firefox fallback (${s.colorScheme})`,
  );
  const scrolls = await page.evaluate(probeScroll);
  check(scrolls, "landing still scrolls with the ink bar");
  await page.close();
}

// G2 — touch landing (390×844 coarse pointer): the styled bar applies on iOS
// too (the owner accepts the forced indicator — it must be the ink one).
{
  const page = await browser.newPage();
  await setViewport(page, { width: 390, height: 844, touch: true });
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".signal-index")), 20000);
  await wait(600);
  const s = await page.evaluate(readState);
  check(s.attr, "mobile landing sets html[data-ink-scroll-bar]");
  check(s.sbWidth === "auto", `mobile: no scrollbar-width poison (${s.sbWidth})`);
  check(
    /dark/.test(s.colorScheme),
    `mobile root color-scheme covers the fallback (${s.colorScheme})`,
  );
  await page.close();
}

// G3 — route-local: a project page clears the attribute (engine default bar).
{
  const page = await browser.newPage();
  await setViewport(page, { width: 1440, height: 900, touch: false });
  await page.goto(`${base}/projects/practice-map`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".pg-card")), 25000);
  await wait(600);
  const s = await page.evaluate(readState);
  check(!s.attr, "project page clears the landing attribute (route-local)");
  check(s.sbWidth === "auto", `project page keeps its engine bar (${s.sbWidth})`);
  await page.close();
}

// G4 — static law in the BUILT css: the ink webkit rules for the attribute
// exist UNCONDITIONALLY (not inside any fine-pointer media), and no
// scrollbar-width:none is attached to the attribute (interop poison).
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
      let at = built.indexOf("data-ink-scroll-bar]::-webkit-scrollbar");
      at !== -1;
      at = built.indexOf("data-ink-scroll-bar]::-webkit-scrollbar", at + 1)
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
    check(unscoped >= 3 && scoped === 0, `ink webkit rules unconditional (unscoped ${unscoped}, fine-pointer-scoped ${scoped})`);
    check(!built.includes("data-ink-scroll-bar]{scrollbar-width"), "no scrollbar-width poison attached to the attribute");
    // The thumb must be a LITERAL color (vars do not resolve inside scrollbar
    // pseudos — an invalid background falls back to the engine's light thumb;
    // esbuild may minify the rgba literal to hex — accept either form).
    const thumbAt = built.indexOf("data-ink-scroll-bar]::-webkit-scrollbar-thumb");
    const thumbBlock = thumbAt === -1 ? "" : built.slice(thumbAt, thumbAt + 220).split("}")[0];
    const literalThumb = thumbBlock.length > 0 && !thumbBlock.includes("var(") && (/#eeeae0|rgba\(/.test(thumbBlock));
    check(literalThumb, `thumb pinned to a literal ink color (${thumbBlock.slice(0, 80)})`);
  } else {
    console.log("ok   (built css not found — G4 static checks skipped)");
  }
}

console.log(problems.length ? `landing-scrollbar-gate: ${problems.length} FAIL` : "landing-scrollbar-gate: ALL PASSED");
console.log(`engine: ${engine}`);
await browser.close();
process.exit(problems.length ? 1 : 0);

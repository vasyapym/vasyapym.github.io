// Landing scrollbar gate — regression check for the main-menu scrollbar.
//
// Bug history (4 device verdicts from the owner, one bug, four passes):
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
//   P4: "it is not dark" — the webkit thumb is a NO-OP on the iOS ROOT
//       scroller (the indicator is a native overlay webkit pseudos cannot
//       touch), and color-scheme: dark still paints it light (contrast law:
//       dark scheme ⇒ LIGHT indicator — the instant P3 added the dark scheme
//       the bar turned white). The black the owner wants is a LIGHT scheme on
//       the landing root, never a webkit thumb.
//
// P5 (picker pass): the landing root drives data-landing-scroll via
// resolveScrollBarTreatment() — ?bar=light|none|dark persisted in
// localStorage["shell:bar"]; default "light" (light scheme ⇒ native DARK
// indicator). "none" matches Raft Cluster (no override). "dark" is today's
// P4 look, the never-worse degrade. One device round settles the winner.
//
// P6 (macOS ghost pass, owner report): the light default resurrected a bar
// on macOS Safari ("previously no scrollbar in macos safari") with a pale
// "ghost" strip left of the native thumb — the light-scheme scrollbar
// gutter/track painting. Fix: the light treatment also carries
// scrollbar-width:none. Desktop engines honor it (bar gone, ghost gone);
// iOS ignores it on the ROOT (P1/P2 device-proven), so the iPhone keeps the
// scheme-driven native indicator — the owner confirms the bar is "still
// there" on iOS, which is the mechanism, not a regression.
//
// This gate loads the BUILT site and asserts, per context:
//   G1 desktop landing, no param — attribute defaults to "light", computed
//      color-scheme "light" (assertion 6), scrollbar-width none (the macOS
//      no-bar restoration), scroll intact;
//   G2 touch landing — same default contract (iOS is the owner's engine);
//   G3 picker round — each ?bar= value sets the attribute AND persists
//      (assertions 3–4); a reload without the param keeps the treatment;
//      invalid ?bar=zzz is ignored and NOT persisted (assertion 5); the
//      computed color-scheme differs across treatments (assertion 6, the
//      staleness canary: identical values ⇒ stale bundle, not CSS);
//   G4 route-local — a project page carries no attribute and keeps the
//      global dark scheme (assertion 9);
//   G5 static — only the "dark" treatment emits root webkit rules (7), and
//      the only scrollbar-width allowed is light's `none` (macOS no-bar
//      restoration — the light block ships no root webkit pseudos, so the
//      interop law is defeated there ON PURPOSE and scoped to that block;
//      none/dark/html stay clean) (8).
//      resolveScrollBarTreatment()'s guarded storage/URL fallbacks
//      (assertion 10) are runtime code paths, asserted by review not gate.
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
// Selector waits pass the selector as an ARGUMENT (the closure is serialized
// into the page, where local bindings do not exist).
const waitForSelector = async (page, selector, timeout) => {
  if (typeof page.setViewportSize === "function") {
    await page.waitForFunction((sel) => Boolean(document.querySelector(sel)), selector, { timeout });
  } else {
    await page.waitForFunction((sel) => Boolean(document.querySelector(sel)), { timeout }, selector);
  }
};

const readState = () => ({
  attr: document.documentElement.getAttribute("data-landing-scroll"),
  sbWidth: getComputedStyle(document.documentElement).scrollbarWidth,
  colorScheme: getComputedStyle(document.documentElement).colorScheme,
  stored: (() => {
    try { return window.localStorage.getItem("shell:bar"); } catch { return null; }
  })(),
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

const openLanding = async (url, viewport, waitSelector = ".signal-index", waitTimeout = 20000) => {
  const page = await browser.newPage();
  await setViewport(page, viewport);
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await waitForSelector(page, waitSelector, waitTimeout);
  await wait(600);
  return page;
};

// Fresh storage, then reload: the default contract must be judged with empty
// persistence (assertion 2 — "empty localStorage ⇒ light").
const freshLanding = async (viewport) => {
  const page = await openLanding(`${base}/`, viewport);
  await page.evaluate(() => { try { window.localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".signal-index")), 20000);
  await wait(600);
  return page;
};

// ---------------------------------------------------------------------------
// G1 — desktop landing (1440×900, fine pointer), no param: default "light".
{
  const page = await freshLanding({ width: 1440, height: 900, touch: false });
  const s = await page.evaluate(readState);
  check(
    ["light", "none", "dark"].includes(s.attr ?? ""),
    `desktop landing carries data-landing-scroll (got ${s.attr})`,
  );
  check(s.attr === "light", `no param + empty storage resolves to "light" (got ${s.attr})`);
  // The interop law: a non-auto scrollbar-width would make Safari 18+ ignore
  // every webkit pseudo and resurrect the engine-default light bar.
  check(s.sbWidth === "none", `light treatment hides the root bar on desktop (${s.sbWidth})`);
  check(s.colorScheme === "light", `light treatment computes color-scheme "light" (${s.colorScheme})`);
  const scrolls = await page.evaluate(probeScroll);
  check(scrolls, "landing still scrolls with the picker in place");
  await page.close();
}

// G2 — touch landing (390×844 coarse pointer): same default contract.
{
  const page = await freshLanding({ width: 390, height: 844, touch: true });
  const s = await page.evaluate(readState);
  check(s.attr === "light", `mobile: default resolves to "light" (got ${s.attr})`);
  // Computed declaration only — iOS renders the bar anyway (ignored on the
  // root, P1/P2 device-proven); the iPhone colour verdict is the device round.
  check(s.sbWidth === "none", `mobile: light treatment declares scrollbar-width none (${s.sbWidth})`);
  check(s.colorScheme === "light", `mobile: light treatment computes "light" (${s.colorScheme})`);
  await page.close();
}

// G3 — the picker round (desktop): every treatment sets + persists; the
// invalid value is ignored; the schemes actually differ (staleness canary).
// ONE page for the none→reload persistence chain; then a FRESH page per
// treatment — Playwright gives each newPage() its own storage context, so
// every param write is judged from a clean slate and goto-races vanish.
{
  const page = await openLanding(`${base}/?bar=none`, { width: 1440, height: 900, touch: false });
  let s = await page.evaluate(readState);
  check(s.attr === "none" && s.stored === "none", `?bar=none sets the attribute and persists (${s.attr}, stored ${s.stored})`);
  check(s.colorScheme === "normal", `none treatment computes "normal" (${s.colorScheme})`);
  check(s.sbWidth === "auto", `none treatment = Raft purity: no scrollbar-width (${s.sbWidth})`);

  await page.goto(`${base}/`, { waitUntil: "load", timeout: 60000 });
  await waitFor(page, () => Boolean(document.querySelector(".signal-index")), 20000);
  await wait(600);
  s = await page.evaluate(readState);
  check(s.attr === "none", `reload without the param keeps the persisted treatment (${s.attr})`);
  await page.close();

  const darkPage = await openLanding(`${base}/?bar=dark`, { width: 1440, height: 900, touch: false });
  s = await darkPage.evaluate(readState);
  check(s.attr === "dark" && s.stored === "dark", `?bar=dark sets + persists "dark" (${s.attr}, stored ${s.stored})`);
  check(s.colorScheme === "dark", `dark treatment computes "dark" (${s.colorScheme})`);
  check(s.sbWidth === "auto", `dark treatment keeps its webkit pseudos honored (${s.sbWidth})`);
  await darkPage.close();

  const lightPage = await openLanding(`${base}/?bar=light`, { width: 1440, height: 900, touch: false });
  s = await lightPage.evaluate(readState);
  check(s.attr === "light" && s.stored === "light", `?bar=light sets + persists "light" (${s.attr}, stored ${s.stored})`);
  check(s.sbWidth === "none", `light treatment declares scrollbar-width none (${s.sbWidth})`);
  await lightPage.close();

  const zzzPage = await openLanding(`${base}/?bar=zzz`, { width: 1440, height: 900, touch: false });
  s = await zzzPage.evaluate(readState);
  check(s.attr === "light", `invalid ?bar=zzz falls back to the default (${s.attr})`);
  check(s.stored === null, `invalid ?bar=zzz is not written to storage (stored ${s.stored})`);
  check(s.sbWidth === "none", `invalid ?bar=zzz falls back to light's scrollbar-width (${s.sbWidth})`);
  await zzzPage.close();
}

// G4 — route-local: a project page clears the attribute (engine default bar)
// and keeps the global dark scheme on documentElement (assertion 9).
{
  // The practice-map chunk is ~1.5 MB: cold first load needs the old gate's
  // generous 25s window (a fresh profile has no warm caches).
  const page = await openLanding(
    `${base}/projects/practice-map`,
    { width: 1440, height: 900, touch: false },
    ".pg-card",
    25000,
  );
  const s = await page.evaluate(readState);
  check(s.attr === null, "project page carries no data-landing-scroll (route-local)");
  check(s.sbWidth === "auto", `project page keeps its engine bar (${s.sbWidth})`);
  check(/dark/.test(s.colorScheme), `project page keeps the global dark scheme (${s.colorScheme})`);
  await page.close();
}

// G5 — static law in the BUILT css: only "dark" emits root webkit rules; the
// html rule and every treatment carry no scrollbar-width/scrollbar-color.
{
  let built = "";
  try {
    const cssDir = join(distDir, "assets");
    for (const f of readdirSync(cssDir)) {
      if (f.endsWith(".css")) built += readFileSync(join(cssDir, f), "utf8");
    }
  } catch {}
  if (built) {
    // Minifiers may drop the quotes around attribute values — compare both.
    const norm = built.replaceAll('"', "");
    check(norm.includes('data-landing-scroll=light]{color-scheme:light;scrollbar-width:none'), 'light treatment ships color-scheme:light + scrollbar-width:none (macOS no-bar restoration)');
    check(norm.includes('data-landing-scroll=none]{color-scheme:normal'), 'none treatment ships color-scheme:normal');
    check(norm.includes('data-landing-scroll=dark]{color-scheme:dark'), 'dark treatment ships color-scheme:dark');
    check(
      !norm.includes('data-landing-scroll=light]::-webkit-scrollbar') &&
        !norm.includes('data-landing-scroll=none]::-webkit-scrollbar'),
      "light/none treatments emit no root webkit rules (only dark does)",
    );
    // The dark thumb must be UNCONDITIONAL (not inside a fine-pointer @media)
    // and a LITERAL color (vars do not resolve inside scrollbar pseudos).
    const thumbAt = norm.indexOf('data-landing-scroll=dark]::-webkit-scrollbar-thumb');
    const thumbBlock = thumbAt === -1 ? "" : norm.slice(thumbAt, thumbAt + 220).split("}")[0];
    let unscoped = thumbBlock.length > 0;
    if (unscoped) {
      // Walk backwards through brace depth to the enclosing block's opening
      // brace; a @media hover/pointer:fine head would mean iOS never applies.
      let depth = 0;
      for (let j = thumbAt; j >= 0; j -= 1) {
        const ch = norm[j];
        if (ch === "}") depth += 1;
        else if (ch === "{") {
          if (depth === 0) {
            const head = norm.slice(Math.max(0, norm.lastIndexOf(";", j) + 1), j);
            if (/@media/.test(head) && (/hover/.test(head) || /pointer\s*:\s*fine/.test(head))) unscoped = false;
            break;
          }
          depth -= 1;
        }
      }
    }
    check(
      unscoped && !thumbBlock.includes("var(") && /#eeeae0|rgba\(/.test(thumbBlock),
      `dark thumb unconditional + literal ink color (${thumbBlock.slice(0, 80)})`,
    );
    // No interop poison on this path: scan every treatment block AND the
    // plain html rule for scrollbar-width/scrollbar-color declarations.
    // The interop law, scoped: the light treatment DELIBERATELY ships
    // scrollbar-width:none (macOS no-bar restoration; it carries no root
    // webkit pseudos, so the law has nothing to kill there). none/dark and
    // the html rule must carry NO scrollbar-width/scrollbar-color: none =
    // Raft purity, dark = the webkit pseudos must stay honored.
    let poison = false;
    for (let at = norm.indexOf("data-landing-scroll="); at !== -1; ) {
      const open = norm.indexOf("{", at);
      const close = norm.indexOf("}", open);
      const block = open === -1 || close === -1 ? "" : norm.slice(open + 1, close);
      const head = norm.slice(norm.lastIndexOf("}", at) + 1, open);
      const isLight = /data-landing-scroll=light\]/.test(head);
      if (!isLight && /scrollbar-(width|color)\s*:/.test(block)) poison = true;
      at = norm.indexOf("data-landing-scroll=", at + 1);
    }
    const htmlAt = norm.indexOf("html{");
    const htmlBlock = htmlAt === -1 ? "" : norm.slice(htmlAt, norm.indexOf("}", htmlAt));
    if (/scrollbar-(width|color)\s*:/.test(htmlBlock)) poison = true;
    check(!poison, "no scrollbar-width/color outside the light treatment (none=Raft purity, dark=webkit pseudos, html=global)");
  } else {
    console.log("ok   (built css not found — G5 static checks skipped)");
  }
}

console.log(problems.length ? `landing-scrollbar-gate: ${problems.length} FAIL` : "landing-scrollbar-gate: ALL PASSED");
console.log(`engine: ${engine}`);
await browser.close();
process.exit(problems.length ? 1 : 0);

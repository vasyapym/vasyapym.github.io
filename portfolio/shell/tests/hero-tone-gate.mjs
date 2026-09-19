// Hero tone gate — regression check for the Safari landing tone flash.
//
// Bug: on a fresh Safari entry the landing paints flat ink (#0b1317) first,
// then the landing's film-grain overlay (.signal-index::after) lands a beat
// later and the page visibly "turns lighter" — and stays lighter than the
// grain-free project pages. The grain was the owner-rejected tone lift.
//
// This gate loads the built site in WebKit (the engine where the symptom
// lives; Playwright's managed build), waits for the hero to settle, and
// asserts the right hero band's average tone stays close to the flat ink
// tone. It fails whenever a tonal overlay lifts the hero band again.
//
//   node shell/tests/hero-tone-gate.mjs            (from portfolio/)
//   node tests/hero-tone-gate.mjs                  (from shell/)
//
// Skips cleanly when neither Playwright WebKit nor Chrome is available.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { inflateSync } from "node:zlib";

const home = homedir();

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "..");
const distDir = join(shellDir, "dist");
const OUT = join(shellDir, ".hero-tone-gate");
mkdirSync(OUT, { recursive: true });

// ---- thresholds -----------------------------------------------------------
// WebKit-measured: grain-on settled band ~26-27 luma; ink-only band ~19.
// 22 sits between; any new tonal overlay lifts the band past it.
const BAND_LUMA_MAX = 22;

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
    // "/" → the SPA entry; anything else missing → the SPA fallback page.
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

// ---- browser: Playwright WebKit first, system Chrome as fallback ----------
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/chromium",
].filter(Boolean);

let browser = null;
try {
  const { webkit } = await import("playwright-core");
  // The managed WebKit's installed revision may differ from this
  // playwright-core's expected revision; accept any cached WebKit build.
  const candidates = [
    join(home, "Library/Caches/ms-playwright/webkit-2104/pw_run.sh"),
    join(home, "Library/Caches/ms-playwright/webkit-2070/pw_run.sh"),
  ];
  const webkitPath = candidates.find((p) => existsSync(p));
  browser = await webkit.launch({ headless: true, executablePath: webkitPath });
  console.log("hero-tone-gate: running on Playwright WebKit (the reported engine)");
} catch (err) {
  if (!String(err).includes("Executable doesn't exist") || true) {
    // fall through to Chrome
  }
  const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chromePath) {
    console.log("hero-tone-gate: neither Playwright WebKit nor Chrome found — skipping");
    process.exit(0);
  }
  const puppeteer = (await import("puppeteer-core")).default;
  browser = await puppeteer.launch({ headless: "shell", executablePath: chromePath, args: ["--hide-scrollbars"] });
  console.log("hero-tone-gate: running on Chrome (WebKit unavailable)");
}

try {
  const page = await browser.newPage();
  // Playwright and puppeteer name these differently; normalize.
  const isPlaywright = typeof page.setViewportSize === "function";
  if (isPlaywright) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${base}/`, { waitUntil: "load" });
  } else {
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    await page.goto(`${base}/`, { waitUntil: "load" });
  }
  await page.waitForSelector(".signal-index-hero-fluid-canvas", { timeout: 10000, state: "attached" });
  // The canvas fade ends (fill both) at mount + 1.45s; the headline rises by
  // mount + ~1.4s. Wait for the canvas's computed opacity to reach its final
  // value instead of sleeping: deterministic end-of-animation marker.
  const settled = () => {
    const c = document.querySelector(".signal-index-hero-fluid-canvas");
    return c && getComputedStyle(c).opacity === "1";
  };
  if (isPlaywright) {
    await page.waitForFunction(settled, undefined, { timeout: 8000, polling: 120 });
  } else {
    await page.waitForFunction(settled, { timeout: 8000, polling: 120 });
  }
  await new Promise((r) => setTimeout(r, 250));

  const shotPath = join(OUT, "settled.png");
  const buf = await page.screenshot();
  writeFileSync(shotPath, buf);
  const { rightHeroLuma, inkRefLuma } = bandLumas(buf);

  console.log(`settled right-hero band luma: ${rightHeroLuma} (ink ref: ${inkRefLuma})`);
  const ok = rightHeroLuma <= BAND_LUMA_MAX;
  if (!ok) {
    console.log(
      `hero-tone-gate: FAIL — settled hero band luma ${rightHeroLuma} > ${BAND_LUMA_MAX} ` +
      `(a tonal overlay is lifting the landing; see .hero-tone-gate/settled.png)`,
    );
  } else {
    console.log("hero-tone-gate: PASS");
  }
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}

// ---- PNG decode (8-bit truecolor) + hero band luma ------------------------
// Minimal: concatenate IDATs, inflate, undo per-scanline filters. Supports
// color types 2 (RGB) and 6 (RGBA), bit depth 8 — what both engines emit.
function bandLumas(png) {
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 6;
  const idat = [];
  while (pos < png.length) {
    const len = png.readUInt32BE(pos);
    const type = png.toString("latin1", pos + 4, pos + 8);
    const data = png.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : null;
  if (!channels) throw new Error(`hero-tone-gate: unexpected PNG color type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(stride * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    for (let i = 0; i < stride; i++) {
      const x = raw[p++];
      const left = i >= channels ? out[y * stride + i - channels] : 0;
      const up = y > 0 ? out[(y - 1) * stride + i] : 0;
      const ul = y > 0 && i >= channels ? out[(y - 1) * stride + i - channels] : 0;
      let val = x;
      if (filter === 1) val += left;
      else if (filter === 2) val += up;
      else if (filter === 3) val += (left + up) >> 1;
      else if (filter === 4) {
        const a = left, b = up, c = ul;
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        val += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + i] = val & 0xff;
    }
  }
  const sample = (x0, y0, cw, ch) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y0 + ch; y++) {
      for (let x = x0; x < x0 + cw; x++) {
        const i = y * stride + x * channels;
        r += out[i]; g += out[i + 1]; b += out[i + 2]; n++;
      }
    }
    r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
    return { rgb: [r, g, b], luma: Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b) };
  };
  // Right hero band: away from the copy panel, inside the fluid field.
  const rightHero = sample(Math.round(w * 0.55), Math.round(h * 0.08), w - Math.round(w * 0.55), Math.round(h * 0.52));
  // Ink reference: the far bottom-right of the viewport — the page's flat ink
  // ground (the grain overlay covered it before the fix).
  const inkRef = sample(Math.round(w * 0.62), Math.round(h * 0.94), Math.round(w * 0.3), Math.round(h * 0.045));
  return { rightHeroLuma: rightHero.luma, rightHeroRGB: rightHero.rgb, inkRefLuma: inkRef.luma };
}

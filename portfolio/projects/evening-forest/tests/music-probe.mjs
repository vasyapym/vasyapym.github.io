// One-off probe: enter the forest and verify the procedural score actually
// runs — the score graph builds (drone + scheduled voices), the context
// stays "running", scheduled envelopes complete, and no errors surface.
// Context teardown on leaving the project is asserted by browser-smoke.
//
// Run: CHROME_PATH=... node projects/evening-forest/tests/music-probe.mjs
// (spawns its own dev server unless EF_PORT is set to a running one)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = process.env.EF_PORT ? Number(process.env.EF_PORT) : 5198;
// localhost, not 127.0.0.1: a plain `vite` binds IPv6 ::1 only, so the
// IPv4 loopback refuses connections.
const BASE = `http://localhost:${PORT}`;

const candidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean).filter(existsSync);
if (!candidates.length) {
  console.error("no chrome (set CHROME_PATH)");
  process.exit(1);
}
const { default: puppeteer } = await import("puppeteer-core");
const headlessMode = candidates[0].includes("chrome-headless-shell")
  ? "shell"
  : "new";

const useSpawnedServer = !process.env.EF_PORT;
const server = useSpawnedServer
  ? spawn(
      process.execPath,
      [
        resolve(shellDir, "../node_modules/vite/bin/vite.js"),
        "--port", String(PORT),
        "--strictPort",
      ],
      { cwd: shellDir, stdio: "ignore", detached: true },
    )
  : null;
if (server) {
  process.on("exit", () => { try { process.kill(-server.pid); } catch {} });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
if (server) {
  let up = false;
  for (let i = 0; i < 40 && !up; i += 1) {
    try { up = (await fetch(BASE)).ok; } catch {}
    if (!up) await wait(500);
  }
}

const browser = await puppeteer.launch({
  executablePath: candidates[0],
  headless: headlessMode,
  args: ["--no-first-run", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

// Instrument WebAudio before the app boots: count oscillator voices, track
// natural "ended" completions (addEventListener, so the score's own
// onended handlers stay intact), and keep the live context for state reads.
await page.evaluateOnNewDocument(() => {
  window.__audio = { oscs: 0, ended: 0, ctx: null };
  const NativeCtx = window.AudioContext;
  window.AudioContext = class extends NativeCtx {
    constructor(...args) {
      super(...args);
      window.__audio.ctx = this;
    }
    createOscillator() {
      window.__audio.oscs += 1;
      const osc = super.createOscillator();
      osc.addEventListener("ended", () => {
        window.__audio.ended += 1;
      });
      return osc;
    }
  };
});

await page.goto(`${BASE}/projects/evening-forest`, {
  waitUntil: "domcontentloaded",
  timeout: 45000,
});
await page.waitForSelector(".evening-forest-enter", { timeout: 30000 });
await wait(1500);

await page.tap(".evening-forest-enter");
await wait(9000); // spans several scheduler ticks and the first melody notes

const inside = await page.evaluate(() => ({
  oscs: window.__audio.oscs,
  ended: window.__audio.ended,
  ctxState: window.__audio.ctx ? window.__audio.ctx.state : "missing",
}));

console.log(JSON.stringify({ inside, errors }, null, 1));
const okOscs = inside.oscs >= 8; // drone(3) + first-cycle notes/pad/chime
const okRunning = inside.ctxState === "running";
const okEnvelopes = inside.ended >= 1; // scheduled stops fire, cleanup runs
const okErrors = errors.length === 0;
console.log(
  `score built (oscs>=8): ${okOscs} | context running: ${okRunning} | envelopes complete: ${okEnvelopes} | no errors: ${okErrors}`,
);
if (!(okOscs && okRunning && okEnvelopes && okErrors)) process.exit(1);

await browser.close();
if (server) process.kill(-server.pid);
console.log("music probe done");

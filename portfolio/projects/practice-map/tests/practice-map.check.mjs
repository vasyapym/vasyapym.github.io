// Browser check for Practice Map: deep-lesson reader, mobile overlay fit,
// fragment-tab fallback, keyboard nav, touch-visible copy buttons,
// shadow typing (interactive reading), saved scroll restore (ed2e302 regression).
//
//   node projects/practice-map/tests/practice-map.check.mjs   (from portfolio/)
//
// Self-contained: boots the Vite dev server on a scratch port, drives the page
// in headless system Chrome via puppeteer-core, fails on any console error,
// horizontal overflow, or panel that escapes the viewport.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shellDir = resolve(here, "../../../shell");
const PORT = Number(process.env.PM_CHECK_PORT) || 5198;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(tmpdir(), "practice-map-check");
mkdirSync(SHOTS, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));

if (!executablePath) {
  console.log("practice-map check: no Chrome/Chromium found — skipping");
  process.exit(0);
}

const { default: puppeteer } = await import("puppeteer-core");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

const isWin = process.platform === "win32";
// Node >= 20.12 refuses to spawn .cmd shims without a shell (spawn EINVAL).
const server = spawn(
  isWin ? "npm.cmd" : "npm",
  ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(PORT), "--strictPort"],
  { cwd: shellDir, stdio: "ignore", detached: !isWin, shell: isWin },
);
const killServer = () => {
  try {
    if (isWin) {
      // No process groups on Windows: kill the cmd wrapper's whole tree.
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(-server.pid);
    }
  } catch {
    /* already gone */
  }
};
process.on("exit", killServer);

try {
  await waitForServer(`${BASE}/projects/practice-map`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-first-run"],
  });
  const problems = [];
  const check = (ok, label) => {
    if (!ok) problems.push(`assert: ${label}`);
    console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  };
  const shot = (name) => page.screenshot({ path: join(SHOTS, `${name}.png`) });
  const appears = (selector, timeout = 30000) =>
    page.waitForSelector(selector, { timeout }).then(() => true).catch(() => false);

  const consoleProblems = [];
  const attachConsole = (page) => {
    page.on("pageerror", (err) => consoleProblems.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleProblems.push(`console.error: ${msg.text()}`);
    });
  };

  // --- desktop: deep reader ------------------------------------------------

  let page = await browser.newPage();
  attachConsole(page);
  await page.setViewport({ width: 1440, height: 900 });
  // domcontentloaded + wait for the app to mount (the realm-probe law):
  // networkidle0 never settles on this dev app, and 45s of it times out.
  await page.goto(`${BASE}/projects/practice-map`, { waitUntil: "domcontentloaded", timeout: 150000 });

  check(await appears(".pg-card"), "map renders");

  // The map opens on the first tier (astra-6-max, two lesson cards).
  // The thinking tier (opus-4.8-thinking) sorts LAST in the tier list — the
  // owner's fixed data order — and folds its 20 lessons into 5 volume faces.
  await page.click(".pg-tier-list button:nth-last-child(1)");
  await wait(400);
  const faceCount = await page.$$eval(".pg-face-head", (faces) => faces.length);
  check(faceCount === 5, `the thinking tier folds into 5 volume faces (${faceCount})`);
  const tierCount = await page.$eval(".pg-tier-row:nth-last-child(1) .pg-tier-count", (el) => el.textContent.trim());
  check(tierCount === "20 lessons", `thinking tier counts its 20 lessons (${tierCount})`);
  await page.click(".pg-face-head");
  await wait(400);
  const cardCount = await page.$$eval(".pg-card", (cards) => cards.length);
  check(cardCount === 4, `vol 01 renders its 4 lessons (${cardCount})`);

  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader"), "deep reader opens for lesson 01");
  check(await appears(".practice-lesson-progress span"), "progress hairline mounts");
  // the lesson text now loads as a lazy per-lesson chunk — wait for the nav
  // to mount before measuring content (otherwise this gate races the import)
  check(await appears(".practice-reader-nav button"), "lazy lesson chunk resolves (nav mounts)");

  const chipCount = await page.$$eval(".practice-reader-nav button", (b) => b.length);
  check(chipCount >= 10, `section nav lists all sections (${chipCount})`);

  const typography = await page.evaluate(() => {
    const reader = document.querySelector(".practice-reader");
    return {
      figures: reader.querySelectorAll(".practice-example").length,
      pre: reader.querySelectorAll("pre").length,
      callouts: reader.querySelectorAll(".practice-callout").length,
      code: reader.querySelectorAll("p > code, li > code, aside code").length,
      bold: reader.querySelectorAll("strong").length,
    };
  });
  check(
    typography.figures >= 4 && typography.pre >= 4,
    `code examples render (figures=${typography.figures}, pre=${typography.pre})`,
  );
  check(typography.callouts >= 2, `callouts render (${typography.callouts})`);
  check(
    typography.code >= 5 && typography.bold >= 3,
    `inline markup renders (code=${typography.code}, strong=${typography.bold})`,
  );
  await shot("desktop-deep-typography");

  const fitsDesktop = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
  check(fitsDesktop, "panel fits viewport at 1440px");

  // Reader geometry laws: the widened panel (~1190px — the owner's +25%
  // window ask; was ~950px before that round) and the visible
  // ink-consistent scrollbar (owner round 4: neither white nor invisible —
  // the bar must render from the webkit pseudos, which requires the
  // interop-suppressing standard properties to be ABSENT from the element).
  const readerLaws = await page.evaluate(() => {
    const panel = document.querySelector(".practice-lesson-panel")?.getBoundingClientRect();
    const scroll = document.querySelector(".practice-lesson-scroll");
    const overlay = document.querySelector(".practice-lesson-overlay");
    const rules = [...document.styleSheets].flatMap((sheet) => {
      try { return [...sheet.cssRules]; } catch { return []; }
    });
    const bodyRule = rules.find((r) => r.selectorText === ".practice-lesson-scroll");
    const barRule = rules.find((r) =>
      r.selectorText?.trim() === ".practice-lesson-scroll::-webkit-scrollbar");
    const thumbRule = rules.find((r) =>
      r.selectorText?.includes(".practice-lesson-scroll::-webkit-scrollbar-thumb"));
    return {
      panelWidth: panel ? Math.round(panel.width) : -1,
      viewport: window.innerWidth,
      scrollbarWidth: scroll ? getComputedStyle(scroll).scrollbarWidth : "?",
      scrollbarColor: scroll ? getComputedStyle(scroll).scrollbarColor : "?",
      overlayColorScheme: overlay ? getComputedStyle(overlay).colorScheme : "?",
      barWidth: barRule ? barRule.style.width : "none",
      thumbBackground: thumbRule ? thumbRule.style.background || thumbRule.style.backgroundColor : "none",
      bodyRuleText: bodyRule ? bodyRule.cssText : "",
    };
  });
  check(
    readerLaws.panelWidth >= 1150 && readerLaws.panelWidth <= Math.min(1200, readerLaws.viewport - 24),
    `lesson panel widened to ~1190px (${readerLaws.panelWidth}px @ ${readerLaws.viewport})`,
  );
  check(
    readerLaws.scrollbarWidth === "auto" &&
      readerLaws.scrollbarColor === "auto" &&
      !/scrollbar-(width|color):/.test(readerLaws.bodyRuleText) &&
      readerLaws.barWidth === "8px" &&
      /rgba\(238, 234, 224,\s*0\.26\)/.test(readerLaws.thumbBackground),
    `lesson scroll body renders the ink webkit bar (8px lane, translucent thumb ${readerLaws.thumbBackground})`,
  );
  check(
    readerLaws.overlayColorScheme === "dark",
    `portaled lesson overlay declares color-scheme: dark (${readerLaws.overlayColorScheme})`,
  );

  const beforeScroll = await page.evaluate(() => document.querySelector(".practice-lesson-scroll").scrollTop);
  await page.click(".practice-reader-nav button:nth-child(6)");
  await wait(900);
  const afterScroll = await page.evaluate(() => document.querySelector(".practice-lesson-scroll").scrollTop);
  check(afterScroll > beforeScroll + 100, "section chip scrolls the panel");

  const activeIndex = await page.$$eval(
    ".practice-reader-nav button",
    (buttons) => buttons.findIndex((b) => b.classList.contains("is-active")),
  );
  check(activeIndex === 5, `scrolled section becomes active chip (${activeIndex})`);

  await page.keyboard.press("ArrowRight");
  await wait(700);
  const arrowIndex = await page.$$eval(
    ".practice-reader-nav button",
    (buttons) => buttons.findIndex((b) => b.classList.contains("is-active")),
  );
  check(arrowIndex === 6, "ArrowRight advances sections");

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes the lesson");

  // --- desktop: saved scroll restore (the ed2e302 regression) -----------------

  // Reading position must survive close/reopen: scroll, close (the unmount
  // flush writes the record), reopen — the pre-paint restore keyed on `deep`
  // must land the reader back at the saved offset, not at the top.
  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader-nav button"), "reader reopens for the restore leg");
  const restoreTarget = 900;
  await page.evaluate((top) => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    scroller.scrollTop = top;
  }, restoreTarget);
  await wait(600); // past the 300ms save debounce
  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes for the restore leg");
  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader-nav button"), "reader reopens again for the restore leg");
  const restoredScroll = await page.evaluate(
    () => document.querySelector(".practice-lesson-scroll").scrollTop,
  );
  check(restoredScroll > restoreTarget - 150, `reopen restores the saved reading position (${restoredScroll})`);
  await page.keyboard.press("Escape");
  await wait(400);

  // --- desktop: free reading (note-style sections) ----------------------------

  const freeCards = await page.$$(".pg-card .pg-pill");
  await freeCards[0].click();
  check(await appears(".practice-reader"), "reader reopens for the free-reading leg");
  check(await appears(".fr-controls"), "free reading controls render in the bar");

  const overlayCovers = await page.evaluate(() => {
    const r = document.querySelector(".practice-lesson-overlay").getBoundingClientRect();
    return r.top <= 0 && r.bottom >= window.innerHeight && r.left <= 0 && r.right >= window.innerWidth;
  });
  check(overlayCovers, "lesson overlay covers the viewport (bug-4 guard)");

  const offParagraphs = await page.$$eval(".practice-reader-section p", (els) => els.length);
  check(offParagraphs > 0, `passive mode renders rich prose (${offParagraphs} paragraphs)`);

  await page.click(".fr-controls button");
  check(await appears(".fr .fr-area"), "free reading mounts a real textarea");
  check(await appears(".fr-count"), "section progress counter renders");

  const countBefore = await page.$eval(".fr-count", (el) => el.textContent.trim());
  check(countBefore.startsWith("0/"), `counter starts at zero (${countBefore})`);
  const proseWords = await page.$eval(
    ".fr .fr-area",
    (el) => el.value.split(/\s+/).filter(Boolean).length,
  );
  check(proseWords > 10, `textarea is prefilled with the section prose (${proseWords} words)`);

  const areaLaws = await page.$eval(".fr .fr-area", (el) => ({
    grows: el.scrollHeight <= el.clientHeight + 1,
    font: parseFloat(getComputedStyle(el).fontSize),
  }));
  check(areaLaws.grows, "textarea auto-grow leaves nothing clipped");
  check(areaLaws.font >= 16, `textarea font >= 16px so iOS never auto-zooms (${areaLaws.font})`);

  // Reading = removing the original text: select everything and delete.
  await page.$eval(".fr .fr-area", (el) => {
    el.focus();
    el.setSelectionRange(0, el.value.length);
  });
  await page.keyboard.press("Backspace");
  await wait(500); // past the 300ms persistence debounce
  const progressAfter = await page.$eval(".fr-progress", (el) => ({
    value: Number(el.value),
    max: Number(el.max),
  }));
  check(
    progressAfter.max > 0 && progressAfter.value === progressAfter.max,
    `deleting the text consumes every word (${progressAfter.value}/${progressAfter.max})`,
  );

  // The surface behaves like a note: typed words just land.
  await page.click(".fr .fr-area");
  await page.keyboard.type("my own note", { delay: 6 });
  await wait(400);
  const noteValue = await page.$eval(".fr .fr-area", (el) => el.value);
  check(noteValue.includes("my own note"), "typed notes land in the surface");

  // Digits/arrows typed into the note must not drive section navigation.
  const activeBeforeType = await page.$$eval(
    ".practice-reader-nav button",
    (buttons) => buttons.findIndex((b) => b.classList.contains("is-active")),
  );
  await page.keyboard.type("12345", { delay: 6 });
  await wait(300);
  const activeAfterType = await page.$$eval(
    ".practice-reader-nav button",
    (buttons) => buttons.findIndex((b) => b.classList.contains("is-active")),
  );
  check(
    activeBeforeType === activeAfterType,
    `typing digits in the note never navigates sections (${activeBeforeType} -> ${activeAfterType})`,
  );

  const progressLatched = await page.$eval(".fr-progress", (el) => ({
    value: Number(el.value),
    max: Number(el.max),
  }));
  check(
    progressLatched.value === progressLatched.max,
    `typing notes never regresses a finished section (${progressLatched.value}/${progressLatched.max})`,
  );

  const savedOk = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes("free:v2") && k.includes("#s0"));
    if (!key) return false;
    try {
      const rec = JSON.parse(localStorage.getItem(key));
      return rec?.v === 2 && typeof rec.text === "string" && rec.text.includes("my own note");
    } catch {
      return false;
    }
  });
  check(savedOk, "debounced flush persisted the note to localStorage");

  // Reset restores the prose and clears the counter.
  await page.click(".practice-reader .fr-mini");
  await wait(300);
  const countReset = await page.$eval(".fr-count", (el) => el.textContent.trim());
  check(countReset.startsWith("0/"), `section reset returns to zero (${countReset})`);
  const resetFilled = await page.$eval(".fr .fr-area", (el) => el.value.length > 0);
  check(resetFilled, "reset restores the prose into the textarea");
  const recordGone = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes("free:v2") && k.includes("#s0"));
    return key == null;
  });
  check(recordGone, "resetting to pristine removes the section record");

  await page.click(".fr-controls button");
  await wait(300);
  const offAgain = await page.$$eval(".practice-reader-section p", (els) => els.length);
  check(offAgain > 0, "passive mode restored after toggling off");

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes after the free-reading leg");

  // --- desktop: fragment fallback -------------------------------------------

  // card 6 (linux-users-groups) is the first remaining fragment card — Linux
  // cards 1-5 are deep lessons since the long-form md course landed.
  // vol 01 holds the four deep lessons; the first fragment (linux-users-groups)
  // lives at index 1 of vol 02 — exit, enter vol 02, open its second card.
  await page.click(".pg-crumb-back");
  await wait(300);
  const facesAfter = await page.$$(".pg-face-head");
  await facesAfter[1].click();
  await wait(400);
  const cards = await page.$$(".pg-card .pg-pill");
  await cards[1].click();
  check(await appears(".practice-lesson-tabs"), "fragment lesson still uses tabs");
  check((await page.$(".practice-reader")) === null, "fragment lesson renders no reader");
  await page.keyboard.press("Escape");
  await wait(300);

  // --- desktop: the Go area deep lesson --------------------------------------

  // curriculum[0] is the Go area: one flagship card whose deep lesson carries
  // the full 19-section course.
  // The Go flagship lives in the fable-5.1-low tier (4th row of TIERS data order).
  await page.click(".pg-tier-list button:nth-child(4)");
  await wait(400);
  const goCardCount = await page.$$eval(".pg-card", (cards) => cards.length);
  check(goCardCount === 1, `Go area renders its single flagship card (${goCardCount})`);
  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader"), "Go deep reader opens");
  // lazy per-lesson chunk: the 19-section nav mounts only after the import
  check(await appears(".practice-reader-nav button"), "Go lazy chunk resolves (nav mounts)");
  const goOverlayCovers = await page.evaluate(() => {
    const r = document.querySelector(".practice-lesson-overlay").getBoundingClientRect();
    return r.top <= 0 && r.bottom >= window.innerHeight && r.left <= 0 && r.right >= window.innerWidth;
  });
  check(goOverlayCovers, "Go lesson overlay covers the viewport (19-section bug-4 guard)");
  const goChipCount = await page.$$eval(".practice-reader-nav button", (b) => b.length);
  check(goChipCount === 19, `Go lesson lists all 19 sections (${goChipCount})`);
  const goCallouts = await page.$$eval(".practice-callout", (c) => c.length);
  check(goCallouts >= 1, `Go lesson renders callouts (${goCallouts})`);
  await page.keyboard.press("Escape");
  await wait(300);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes the Go lesson");

  await page.close();

  // --- mobile: fit, reachability, touch affordances -------------------------

  const walkHorizontalEscape = () =>
    page.evaluate(() => {
      const panel = document.querySelector(".practice-lesson-panel");
      if (!panel) return ["panel missing"];
      const escapes = [];
      for (const element of panel.querySelectorAll("*")) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.right <= window.innerWidth + 1 && rect.left >= -1) continue;
        // Anything clipped by a scrollable/hiding ancestor is reachable by
        // scrolling that container (reader chips, code blocks) — not a leak.
        let clipped = false;
        for (let node = element.parentElement; node && node !== panel; node = node.parentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") {
            clipped = true;
            break;
          }
        }
        if (!clipped) {
          escapes.push(
            `${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]} right=${Math.round(rect.right)} left=${Math.round(rect.left)}`,
          );
        }
      }
      return escapes;
    });

  page = await browser.newPage();
  attachConsole(page);
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  // domcontentloaded + wait for the app to mount (the realm-probe law):
  // networkidle0 never settles on this dev app, and 45s of it times out.
  await page.goto(`${BASE}/projects/practice-map`, { waitUntil: "domcontentloaded", timeout: 150000 });

  const noOverflowPage = await page.evaluate(
    () => document.scrollingElement.scrollWidth <= window.innerWidth,
  );
  check(noOverflowPage, "no horizontal overflow on the map at 390px");

  // domcontentloaded returns before React mounts — wait for the map first
  // (networkidle0 used to buy this implicitly).
  check(await appears(".pg-card"), "map renders at 390px");
  // The pinned-close / copy-button laws were tuned on the Linux deep reader:
  // reach it the way the tier design does — thinking tier (last row), vol 01.
  await page.tap(".pg-tier-list button:nth-last-child(1)");
  await wait(400);
  await page.tap(".pg-face-head");
  await wait(400);
  await page.tap(".pg-card .pg-pill");
  check(await appears(".practice-reader"), "deep reader opens on mobile");
  // lazy per-lesson chunk settles before the geometry asserts below
  await appears(".practice-reader-nav button");

  // the 180ms entry animation moves the panel 6px — let it settle before
  // asserting geometry (a bare appears() raced the animation mid-flight).
  await wait(300);

  const fitsMobile = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return rect.top >= 0
      && rect.bottom <= window.innerHeight + 1
      && rect.left >= -1
      && rect.right <= window.innerWidth + 1;
  });
  check(fitsMobile, "panel fits the viewport on both axes at 390px (the reported bug)");

  // The iOS close-X repair: the panel is a stationary frame (never scrolls),
  // the keyed body is the only scroller, and the close button keeps its
  // viewport geometry no matter how far the content is scrolled.
  const closeStructure = await page.evaluate(() => {
    const panel = document.querySelector(".practice-lesson-panel");
    const scroller = document.querySelector(".practice-lesson-scroll");
    const close = document.querySelector(".practice-lesson-close");
    return {
      panelOverflow: getComputedStyle(panel).overflowY,
      scrollerOverflow: getComputedStyle(scroller).overflowY,
      closeInsideScroller: scroller.contains(close),
      panelScrollable: panel.scrollHeight - panel.clientHeight > 4,
    };
  });
  check(closeStructure.panelOverflow === "hidden", `panel is a stationary frame (${closeStructure.panelOverflow})`);
  check(closeStructure.scrollerOverflow === "auto", `body is the scroller (${closeStructure.scrollerOverflow})`);
  check(closeStructure.closeInsideScroller === false, "close button lives outside the scroller");

  const closeBefore = await page.$eval(".practice-lesson-close", (b) => {
    const r = b.getBoundingClientRect();
    return `${Math.round(r.left)},${Math.round(r.top)}`;
  });
  await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    scroller.scrollTop = scroller.scrollHeight;
  });
  await wait(600);
  const closeAfter = await page.$eval(".practice-lesson-close", (b) => {
    const r = b.getBoundingClientRect();
    return `${Math.round(r.left)},${Math.round(r.top)}`;
  });
  check(closeBefore === closeAfter, `close button stays pinned while content scrolls (${closeBefore} -> ${closeAfter})`);

  const bottomReachable = await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const footer = document.querySelector(".practice-lesson-footer");
    const rect = footer.getBoundingClientRect();
    return rect.top < window.innerHeight && scroller.scrollTop > 0;
  });
  check(bottomReachable, "examples/references reachable by scrolling");
  await shot("mobile-deep-bottom");

  const progressBar = await page.evaluate(() => {
    const span = document.querySelector(".practice-lesson-progress span");
    return span ? span.style.transform : "";
  });
  check(progressBar.includes("scaleX(1") || progressBar.includes("scaleX(0.9"), `progress fills after full scroll (${progressBar})`);

  const copyVisible = await page.evaluate(() => {
    const button = document.querySelector(".practice-example-copy");
    return button ? getComputedStyle(button).opacity === "1" : false;
  });
  check(copyVisible, "copy button visible without hover on touch");

  const noOverflowOverlay = await page.evaluate(
    () => document.querySelector(".practice-lesson-overlay").scrollWidth <= window.innerWidth,
  );
  check(noOverflowOverlay, "no horizontal overflow inside the overlay");

  const escapes390 = await walkHorizontalEscape();
  check(escapes390.length === 0, `no descendant escapes the panel at 390px${escapes390.length ? `: ${escapes390.slice(0, 4).join(" | ")}` : ""}`);

  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes on mobile too");

  // --- narrow phone (iPhone SE class): the real-device regression ------------

  await page.setViewport({
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 150000 });

  const noOverflowNarrow = await page.evaluate(
    () => document.scrollingElement.scrollWidth <= window.innerWidth,
  );
  check(noOverflowNarrow, "no horizontal overflow on the map at 320px");

  check(await appears(".pg-card"), "map renders at 320px");
  await page.tap(".pg-tier-list button:nth-last-child(1)");
  await wait(400);
  await page.tap(".pg-face-head");
  await wait(400);
  await page.tap(".pg-card .pg-pill");
  check(await appears(".practice-reader"), "deep reader opens at 320px");
  // lazy per-lesson chunk settles before the geometry asserts below
  await appears(".practice-reader-nav button");

  // same animation-settle law as the 390 leg
  await wait(300);

  const fitsNarrow = await page.evaluate(() => {
    const rect = document.querySelector(".practice-lesson-panel").getBoundingClientRect();
    return (
      rect.top >= -1 &&
      rect.bottom <= window.innerHeight + 1 &&
      rect.left >= -1 &&
      rect.right <= window.innerWidth + 1
    );
  });
  check(fitsNarrow, "panel fits the viewport on both axes at 320px");

  const escapesNarrow = await walkHorizontalEscape();
  check(escapesNarrow.length === 0, `no descendant escapes the panel at 320px${escapesNarrow.length ? `: ${escapesNarrow.slice(0, 4).join(" | ")}` : ""}`);
  await shot("narrow-deep-top");

  await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    scroller.scrollTop = scroller.scrollHeight;
  });
  await wait(600);
  const escapesNarrowBottom = await walkHorizontalEscape();
  check(escapesNarrowBottom.length === 0, "no descendant escapes the panel at 320px after full scroll");
  await shot("narrow-deep-bottom");

  // --- narrow phone: free reading stays inside the panel ---------------------

  await page.keyboard.press("Escape");
  await wait(300);

  // page.tap's scrollIntoView→touch race after the overlay's scroll restore can
  // land ~50px off the pill; tap at the element's live coordinates instead.
  const narrowPill = await page.$eval(".pg-card .pg-pill", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.touchscreen.touchStart(narrowPill.x, narrowPill.y);
  await page.touchscreen.touchEnd();
  check(await appears(".practice-reader"), "reader opens at 320px for the free-reading leg");
  await page.tap(".fr-controls button");
  check(await appears(".fr .fr-area"), "free reading mounts at 320px");

  const narrowGrow = await page.$eval(".fr .fr-area", (el) => el.scrollHeight <= el.clientHeight + 1);
  check(narrowGrow, "auto-grow leaves nothing clipped at 320px");

  const escapesFree = await walkHorizontalEscape();
  check(
    escapesFree.length === 0,
    `no descendant escapes at 320px with free reading on${escapesFree.length ? `: ${escapesFree.slice(0, 4).join(" | ")}` : ""}`,
  );
  await shot("narrow-free");

  await page.tap(".fr-controls button");
  await wait(300);
  await page.keyboard.press("Escape");
  await wait(400);
  check(
    (await page.$(".practice-lesson-overlay")) === null,
    "Escape closes after the 320px free-reading leg",
  );

  await page.close();
  await browser.close();

  problems.push(...consoleProblems);

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(` - ${p}`);
    console.error(`\nScreenshots: ${SHOTS}`);
    process.exit(1);
  }
  console.log(`\nPractice Map check passed. Screenshots: ${SHOTS}`);
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
}

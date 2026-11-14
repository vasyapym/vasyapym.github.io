// Browser check for Practice Map: deep-lesson reader, mobile overlay fit,
// fragment-tab fallback, keyboard nav, touch-visible copy buttons,
// shadow typing (interactive reading), saved scroll restore (ed2e302 regression),
// read as code (GitHub-fill mode, F077 re-gate, anchor parity, migration).
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

  // The landing tier is muse-wonder-max (the owner ordered it FIRST; it is
  // flat — 7 lessons < the 8+ fold threshold — so cards render directly).
  // Folder-face coverage runs on the first foldered tier (astra-6-max).
  check(await appears(".pg-card"), "map renders (first tier is flat — cards render directly)");
  await page.click('.pg-tier-row[data-tier-id="astra-6-max"]');
  await wait(400);
  check(await appears(".pg-face-head"), "astra-6-max folds into folder faces");
  await page.click(".pg-face-head");
  await wait(400);
  check(await appears(".pg-card"), "first folder opens into cards");

  // The thinking tier (opus-4.8-thinking) sorts LAST in the tier list — the
  // owner's fixed data order — and folds its 20 lessons into 5 volume faces.
  // The tier list PAGES at 5 rows (R040): 12 tiers → 3 pages; the pager is the
  // last child, rows are picked by data-tier-id and exist only on their page
  // (page 1 = rows 01–05, page 3 = the last two tiers).
  check(await appears(".pg-tier-pager"), "tier list pages (pager renders)");
  const pagerLabel = await page.$eval(".pg-tier-page-cue-text", (el) => el.textContent.trim());
  check(pagerLabel === "page 1 of 3", `pager cue states the page (${pagerLabel})`);
  const firstPageRows = await page.$$eval(".pg-tier-row", (rows) => rows.map((r) => r.querySelector(".pg-tier-index").textContent));
  check(firstPageRows.join(",") === "01,02,03,04,05", `page 1 holds the first five global ordinals (${firstPageRows.join(" ")})`);
  check(await page.$eval('[data-turn="prev"]', (el) => el.disabled), "prev arrow disabled on the first page");
  await page.click('[data-turn="next"]');
  await wait(300);
  check((await page.$eval(".pg-tier-list", (el) => el.dataset.page)) === "2", "next turns to page 2");
  await page.click('[data-turn="next"]');
  await wait(300);
  check((await page.$eval(".pg-tier-list", (el) => el.dataset.page)) === "3", "next turns to page 3");
  check(await page.$eval('[data-turn="next"]', (el) => el.disabled), "next arrow disabled on the last page");
  await page.click('.pg-tier-row[data-tier-id="opus-4.8-thinking"]');
  await wait(400);
  const faceCount = await page.$$eval(".pg-face-head", (faces) => faces.length);
  check(faceCount === 5, `the thinking tier folds into 5 volume faces (${faceCount})`);
  const tierCount = await page.$eval('.pg-tier-row[data-tier-id="opus-4.8-thinking"] .pg-tier-count', (el) => el.textContent.trim());
  check(tierCount === "20 lessons", `thinking tier counts its 20 lessons (${tierCount})`);
  await page.click(".pg-face-head");
  await wait(400);
  const cardCount = await page.$$eval(".pg-card", (cards) => cards.length);
  check(cardCount === 4, `vol 01 renders its 4 lessons (${cardCount})`);
  // pagination invariants: the active tier's landing — with the thinking tier
  // active, the list rests on page 3; turning back shows the off-page cue
  // suffix; the global ordinals never renumber. At 12 tiers the tail page
  // holds TWO tiers (gpt-6-sol-max, opus-4.8-thinking) — no more 1-row stub.
  check((await page.$eval(".pg-tier-list", (el) => el.dataset.page)) === "3", "active tier's page is current (tail landing)");
  const tailRows = await page.$$eval(".pg-tier-row", (rows) => rows.map((r) => r.querySelector(".pg-tier-index").textContent));
  check(tailRows.join(",") === "11,12", `tail page holds the last two global ordinals (${tailRows.join(" ")})`);
  // the short-page air dial (MIN_ROWS=2) only shows on a 1-row tail page;
  // at 12 tiers the tail page holds 2 rows = the floor → no air anywhere.
  const air = await page.evaluate(() => {
    const rowH = parseFloat(getComputedStyle(document.querySelector(".pg-tier-list")).getPropertyValue("--pg-tier-row-h"));
    const mt = parseFloat(getComputedStyle(document.querySelector(".pg-tier-pager")).marginTop);
    return { rowH, mt, pad: mt / rowH };
  });
  check(air.pad < 0.02, `2-row tail page carries no air (${air.mt}px = ${air.pad} rows)`);
  await page.click('[data-turn="prev"]');
  await wait(300);
  check((await page.$eval(".pg-tier-list", (el) => el.dataset.page)) === "2", "prev returns to page 2");
  const midCue = await page.$eval(".pg-tier-page-cue-text", (el) => el.textContent.trim());
  check(midCue === "page 2 of 3", `cue states the bare page (${midCue})`);
  check(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".pg-tier-pager")).marginTop) < 1), "full pages carry no air");
  // restore the tuned state: thinking tier + vol 01 (the free-reading and
  // fragment legs below run on the Linux deep reader's note sections).
  await page.click('[data-turn="next"]');
  await wait(300);
  await page.click('.pg-tier-row[data-tier-id="opus-4.8-thinking"]');
  await wait(400);
  await page.click(".pg-face-head");
  await wait(400);

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

  // the callout is a quiet titled block: the marginal ochre rule is gone
  // (owner's word, 2026-11) and the text joins the shared 0.75rem edge
  const calloutLaws = await page.evaluate(() => {
    const callout = document.querySelector(".practice-reader-section > .practice-callout");
    if (!callout) return null;
    const cs = getComputedStyle(callout);
    return { borderLeft: cs.borderLeftWidth, pad: cs.paddingLeft };
  });
  check(
    calloutLaws !== null
      && (calloutLaws.borderLeft === "0px" || calloutLaws.borderLeft === "none")
      && calloutLaws.pad === "12px",
    `callout is a quiet block: no ochre rule, 0.75rem text edge (${calloutLaws?.borderLeft}/${calloutLaws?.pad})`,
  );

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

  // --- desktop: read as code (the GitHub-fill reading mode) ------------------

  // D leg: two independent pills (the four states are their on/off
  // readings); the fill's computed voice is the styleguide's §10 dark
  // values; code+free composes at 16px with the pre at 13.6px; the F077
  // re-gate must not drift default ↔ free; anchor parity across every
  // code-touching change (including free flips inside code); per-lesson
  // persistence; v1/fossil migrations.
  // State premise: the free-reading leg above left lesson 01 (linux-cli-
  // terminal) in prose mode through the new v2 record.
  const premise = await page.evaluate(() => {
    const rec = localStorage.getItem("practice-map:reading:v2:linux-cli-terminal");
    return rec ? JSON.parse(rec) : null;
  });
  check(
    premise?.v === 2 && premise?.presentation === "prose" && premise?.free === false,
    `the free-reading toggles persisted as v2 records (${JSON.stringify(premise)})`,
  );

  // Seed the superseded records for the NEXT lessons — a fresh run never
  // writes them (the new controls write v2 directly). The migration sub-leg
  // at the end proves the read-time mappings: lesson 02 carries a v1 code
  // record plus the stale free:v2 settings fossil (v1 strictly supersedes
  // it — both must go), lesson 03 only the fossil.
  await page.evaluate(() => {
    window.localStorage.setItem(
      "practice-map:reading:v1:linux-filesystem-hierarchy",
      JSON.stringify({ v: 1, mode: "code", updatedAt: 1 }),
    );
    window.localStorage.setItem(
      "practice-map:free:v2:linux-filesystem-hierarchy",
      JSON.stringify({ v: 2, enabled: true, updatedAt: 1 }),
    );
    window.localStorage.setItem(
      "practice-map:free:v2:linux-shell-fundamentals",
      JSON.stringify({ v: 2, enabled: true, updatedAt: 1 }),
    );
  });

  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader-nav button"), "reader reopens for the read-as-code leg");
  check((await page.$(".practice-reader-section.is-code")) === null, "prose baseline renders no is-code section");

  // F077 default side: h3 slot + the shared text edge voice
  const f077Default = await page.evaluate(() => {
    const section = [...document.querySelectorAll(".practice-reader-section")]
      .find((s) => s.querySelector(":scope > h3") && s.querySelector(":scope > p"));
    if (!section) return null;
    const cs = (el) => getComputedStyle(el);
    return {
      h3Pad: cs(section.querySelector(":scope > h3")).paddingBottom,
      p: (({ paddingLeft, fontSize, lineHeight }) => ({ paddingLeft, fontSize, lineHeight }))(
        cs(section.querySelector(":scope > p")),
      ),
    };
  });
  check(f077Default?.h3Pad === "35.2px", `F077 h3 slot intact in default mode (${f077Default?.h3Pad})`);
  check(f077Default?.p.paddingLeft === "12px", `shared text edge at 0.75rem (${f077Default?.p.paddingLeft})`);

  // toggle "read as code" on (the second pill)
  await page.click(".reading-modes button:nth-child(2)");
  check(await appears(".practice-reader-section.is-code"), "read as code mounts is-code sections");
  await wait(300); // past the 180ms fill fade-in — colors settle before measuring
  const hookedOn = await page.$eval(".practice-lesson-scroll", (el) => ({
    reading: el.dataset.reading,
    free: el.dataset.free,
  }));
  check(
    hookedOn.reading === "code" && hookedOn.free === undefined,
    `scroller carries the state hooks (reading=${hookedOn.reading}, free=${hookedOn.free})`,
  );
  const pressedOn = await page.$$eval(".reading-modes button", (b) => b.map((x) => x.getAttribute("aria-pressed")));
  check(pressedOn.join(",") === "false,true", `pill states after code on (${pressedOn.join("/")})`);

  const codeLaws = await page.evaluate(() => {
    const sections = [...document.querySelectorAll(".practice-reader-section.is-code")];
    const pick = sections.find((s) => s.querySelector(":scope > h3") && s.querySelector(":scope > p"));
    if (!pick) return null;
    const cs = (el) => getComputedStyle(el);
    const fields = (el, names) => el ? Object.fromEntries(names.map((n) => [n, cs(el)[n]])) : null;
    const fills = [...pick.children].filter((c) => !c.classList.contains("practice-reader-examples"));
    return {
      p: fields(pick.querySelector(":scope > p"), ["fontSize", "lineHeight", "backgroundColor", "color"]),
      h3: fields(pick.querySelector(":scope > h3"), [
        "paddingTop", "borderTopLeftRadius", "borderTopRightRadius",
      ]),
      last: fields(fills[fills.length - 1], [
        "paddingBottom", "borderBottomLeftRadius", "borderBottomRightRadius",
      ]),
      pre: fields(
        document.querySelector(".practice-reader-section.is-code .practice-example-code pre"),
        ["whiteSpace", "overflow", "backgroundColor", "color", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopLeftRadius"],
      ),
      inline: fields(
        document.querySelector(".practice-reader-section.is-code > :not(.practice-reader-examples) code"),
        ["color", "backgroundColor"],
      ),
      callout: fields(
        document.querySelector(".practice-reader-section.is-code > .practice-callout"),
        ["paddingLeft"],
      ),
    };
  });
  const near = (a, b, eps = 0.06) => Math.abs(a - b) <= eps;
  check(!!codeLaws, "a code-mode section with heading and prose exists");
  check(near(parseFloat(codeLaws.p.fontSize), 13.6), `fill text is 13.6px (${codeLaws.p.fontSize})`);
  check(near(parseFloat(codeLaws.p.lineHeight), 19.72, 0.1), `fill pitch is 19.72px (${codeLaws.p.lineHeight})`);
  check(codeLaws.p.backgroundColor === "rgb(21, 27, 35)", `fill ground is #151b23 (${codeLaws.p.backgroundColor})`);
  check(codeLaws.p.color === "rgb(240, 246, 252)", `fill text is #f0f6fc (${codeLaws.p.color})`);
  check(codeLaws.h3.paddingTop === "16px", `first fill child pads 16px on top (${codeLaws.h3.paddingTop})`);
  check(
    codeLaws.h3.borderTopLeftRadius === "6px" && codeLaws.h3.borderTopRightRadius === "6px",
    `first fill child rounds its top corners (${codeLaws.h3.borderTopLeftRadius}/${codeLaws.h3.borderTopRightRadius})`,
  );
  check(codeLaws.last.paddingBottom === "16px", `last fill child pads 16px below (${codeLaws.last.paddingBottom})`);
  check(
    codeLaws.last.borderBottomLeftRadius === "6px" && codeLaws.last.borderBottomRightRadius === "6px",
    `last fill child rounds its bottom corners (${codeLaws.last.borderBottomLeftRadius}/${codeLaws.last.borderBottomRightRadius})`,
  );
  check(
    codeLaws.pre.whiteSpace === "pre" && codeLaws.pre.overflow === "auto",
    `example pre keeps white-space: pre + overflow: auto (${codeLaws.pre?.whiteSpace}/${codeLaws.pre?.overflow})`,
  );
  check(
    codeLaws.pre.backgroundColor === "rgb(21, 27, 35)" && codeLaws.pre.color === "rgb(240, 246, 252)",
    `example pre wears the fill (${codeLaws.pre?.backgroundColor}/${codeLaws.pre?.color})`,
  );
  check(
    codeLaws.pre.paddingTop === "16px" && codeLaws.pre.paddingRight === "16px"
      && codeLaws.pre.paddingBottom === "16px" && codeLaws.pre.paddingLeft === "16px",
    `example pre pads 16px on all sides (${codeLaws.pre?.paddingTop}/${codeLaws.pre?.paddingRight}/${codeLaws.pre?.paddingBottom}/${codeLaws.pre?.paddingLeft})`,
  );
  check(codeLaws.pre.borderTopLeftRadius === "6px", `example pre radius 6px (${codeLaws.pre?.borderTopLeftRadius})`);
  check(
    codeLaws.inline && codeLaws.inline.color === "rgb(121, 192, 255)"
      && codeLaws.inline.backgroundColor === "rgba(0, 0, 0, 0)",
    `inline code on the fill is flat constant blue (${codeLaws.inline?.color}/${codeLaws.inline?.backgroundColor})`,
  );
  check(
    codeLaws.callout && codeLaws.callout.paddingLeft === "16px",
    `callout keeps the fill's 16px gutter in code mode (${codeLaws.callout?.paddingLeft})`,
  );

  const noOverflowCode = await page.evaluate(
    () => document.querySelector(".practice-lesson-overlay").scrollWidth <= window.innerWidth,
  );
  check(noOverflowCode, "no horizontal overflow in code mode at 1440px");

  // --- anchor helpers: shared by the posture legs and the reflow legs -------

  const measureAnchor = () => page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const edge = scroller.getBoundingClientRect().top;
    for (const el of scroller.querySelectorAll("[data-section-index]")) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= edge) continue;
      if (r.top > edge) break;
      return {
        index: el.dataset.sectionIndex,
        topVisible: r.top >= edge - 0.5,
        offset: r.top - edge,
        fraction: (edge - r.top) / r.height,
      };
    }
    return null;
  });
  const measureRestored = (idx) => page.evaluate((idx) => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const edge = scroller.getBoundingClientRect().top;
    const el = scroller.querySelector(`[data-section-index="${idx.index}"]`);
    const r = el.getBoundingClientRect();
    return {
      topVisible: idx.topVisible,
      value: idx.topVisible ? r.top - edge : (edge - r.top) / r.height,
      height: r.height,
    };
  }, idx);
  // the chip's smooth scroll can outlive a fixed wait — settle on a stable
  // scrollTop before measuring (a late tick would displace the landing)
  const scrollSettled = async () => {
    for (let i = 0; i < 20; i++) {
      const a = await page.$eval(".practice-lesson-scroll", (el) => el.scrollTop);
      await wait(120);
      const b = await page.$eval(".practice-lesson-scroll", (el) => el.scrollTop);
      if (Math.abs(a - b) < 0.5) return true;
    }
    return false;
  };

  // --- the size control (styleguide §8.1): one token, four readings ---------

  // default: github-exact, the attribute always present on the overlay
  const readSize = () => page.evaluate(() => ({
    attr: document.querySelector(".practice-lesson-overlay")?.getAttribute("data-code-size"),
    fill: getComputedStyle(document.querySelector(".practice-reader-section.is-code > p")).fontSize,
    pre: getComputedStyle(document.querySelector(".practice-reader-section.is-code .practice-example-code pre")).fontSize,
  }));
  check(await appears(".practice-lesson-tools .fr-size"), "the size pill renders while the code voice is on");
  const pillLaws = await page.$eval(".fr-size", (el) => ({
    label: el.getAttribute("aria-label"),
    text: el.textContent?.trim() ?? "",
  }));
  check(
    pillLaws.label === null && /size: (13\.6|14|15|16)/.test(pillLaws.text),
    `the size pill names itself with its visible value (aria-label=${pillLaws.label}, text="${pillLaws.text}")`,
  );
  const sizeDefault = await readSize();
  check(
    sizeDefault.attr === "github" && near(parseFloat(sizeDefault.fill), 13.6),
    `default size is github-exact (data-code-size=${sizeDefault.attr}, fill ${sizeDefault.fill})`,
  );
  await page.click(".fr-size");
  await wait(100);
  const size14 = await readSize();
  check(size14.attr === "14" && near(parseFloat(size14.fill), 14), `size cycles to 14 (attr=${size14.attr}, fill ${size14.fill})`);
  await page.click(".fr-size");
  await wait(100);
  const size15 = await readSize();
  check(
    size15.attr === "15" && near(parseFloat(size15.fill), 15) && near(parseFloat(size15.pre), 15, 0.1),
    `size cycles to 15 and the pre rides the same voice (attr=${size15.attr}, fill ${size15.fill}, pre ${size15.pre})`,
  );
  await page.click(".fr-size");
  await wait(100);
  const size16 = await readSize();
  check(size16.attr === "16" && near(parseFloat(size16.fill), 16), `size cycles to 16 (attr=${size16.attr}, fill ${size16.fill})`);
  await page.click(".fr-size");
  await wait(100);
  const sizeWrap = await readSize();
  check(
    sizeWrap.attr === "github" && near(parseFloat(sizeWrap.fill), 13.6),
    `size wraps back to github (attr=${sizeWrap.attr}, fill ${sizeWrap.fill})`,
  );

  // anchor parity for the size voice: cycling re-wraps the code-voice
  // content, so the section keeps its place (posture-2 formula)
  await page.click(".practice-reader-nav button:nth-child(6)");
  check(await scrollSettled(), "the chip's smooth scroll settles before the size-anchor landing");
  await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const edge = scroller.getBoundingClientRect().top;
    const el = scroller.querySelector('[data-section-index="5"]');
    const r = el.getBoundingClientRect();
    scroller.scrollTop += r.height * 0.4;
  });
  check(await scrollSettled(), "the mid-section push settles before the size flip");
  const anchorSize = await measureAnchor();
  check(
    anchorSize != null && !anchorSize.topVisible && anchorSize.index === "5",
    `size-anchor leg puts section ${anchorSize?.index} at fraction ${anchorSize?.fraction?.toFixed(2)}`,
  );
  await page.click(".fr-size"); // github → 14: the voice re-wraps
  await wait(120);
  const restoredSize = await measureRestored(anchorSize);
  const sizeDelta = Math.abs(restoredSize.value - anchorSize.fraction) * restoredSize.height;
  check(
    sizeDelta <= 2,
    `size reflow keeps the fraction (Δ ${sizeDelta.toFixed(2)}px of the restored ${restoredSize.height.toFixed(0)}px section)`,
  );
  // cycle back to github so the downstream legs see the default voice
  await page.click(".fr-size");
  await wait(100);
  await page.click(".fr-size");
  await wait(100);
  await page.click(".fr-size");
  await wait(100);
  const sizeBack = await readSize();
  check(
    sizeBack.attr === "github" && near(parseFloat(sizeBack.fill), 13.6),
    `the size-anchor leg leaves github (attr=${sizeBack.attr}, fill ${sizeBack.fill})`,
  );

  // cross-tab size write: a second page on the same origin writes the size
  // record — the storage event fires in page1, the wrapper captures, the
  // restore lands (the reader is already mid-section from the local leg)
  const page2 = await browser.newPage();
  attachConsole(page2);
  await page2.setViewport({ width: 1440, height: 900 });
  await page2.goto(`${BASE}/projects/practice-map`, { waitUntil: "domcontentloaded", timeout: 150000 });
  const appears2 = (selector, timeout = 30000) =>
    page2.waitForSelector(selector, { timeout }).then(() => true).catch(() => false);
  check(await appears2(".pg-card"), "the second page mounts on the same origin");
  check(await scrollSettled(), "page1 rests mid-section before the cross-tab write");
  const anchorCross = await measureAnchor();
  check(
    anchorCross != null && !anchorCross.topVisible && anchorCross.index === "5",
    `cross-tab leg measures section ${anchorCross?.index} at fraction ${anchorCross?.fraction?.toFixed(2)}`,
  );
  await page2.evaluate(() => {
    localStorage.setItem(
      "practice-map:code-size:v1",
      JSON.stringify({ v: 1, size: "15", updatedAt: Date.now() }),
    );
  });
  await wait(300); // the storage event → capture → render → restore
  const restoredCross = await measureRestored(anchorCross);
  const crossDelta = Math.abs(restoredCross.value - anchorCross.fraction) * restoredCross.height;
  check(
    crossDelta <= 2,
    `a cross-tab size write keeps the fraction (Δ ${crossDelta.toFixed(2)}px of the restored ${restoredCross.height.toFixed(0)}px section)`,
  );
  const crossSize = await readSize();
  check(
    crossSize.attr === "15" && near(parseFloat(crossSize.fill), 15),
    `the cross-tab write applied in page1 (attr=${crossSize.attr}, fill ${crossSize.fill})`,
  );
  await page2.close();
  // cycle back to github so the downstream legs see the default voice
  await page.click(".fr-size");
  await wait(100);
  await page.click(".fr-size");
  await wait(100);
  const crossBack = await readSize();
  check(
    crossBack.attr === "github" && near(parseFloat(crossBack.fill), 13.6),
    `the cross-tab leg leaves github (attr=${crossBack.attr}, fill ${crossBack.fill})`,
  );

  // composition (design D7): the pills are independent — free joins code,
  // code releases leave free alone, and both come back
  await page.click(".reading-modes button:nth-child(1)");
  check(await appears(".fr .fr-area"), "free reading joins code (the combined state)");
  const combined = await page.evaluate(() => ({
    pressed: [...document.querySelectorAll(".reading-modes button")].map((b) => b.getAttribute("aria-pressed")),
    codeSections: document.querySelectorAll(".practice-reader-section.is-code").length,
    reading: document.querySelector(".practice-lesson-scroll")?.dataset.reading,
    free: document.querySelector(".practice-lesson-scroll")?.dataset.free,
  }));
  check(combined.pressed.join(",") === "true,true", `both pills pressed in the combined state (${combined.pressed.join("/")})`);
  check(combined.codeSections > 0 && combined.reading === "code" && combined.free === "true", `code stays on while free joins (${combined.codeSections} is-code, reading=${combined.reading}, free=${combined.free})`);

  await wait(300); // past the fill fade — the combined voice settles before measuring

  // combined laws: one voice per box — the panel is 16px/1.45, the example
  // pre keeps 13.6px; ochre appears only as caret and focus
  const combinedLaws = await page.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    const fields = (el, names) => el ? Object.fromEntries(names.map((n) => [n, cs(el)[n]])) : null;
    const sections = [...document.querySelectorAll(".practice-reader-section.is-code.is-fr")];
    const pick = sections.find((s) => s.querySelector(":scope > h3") && s.querySelector(":scope > .fr"));
    if (!pick) return null;
    const headingLess = sections.find((s) => !s.querySelector(":scope > h3") && s.querySelector(":scope > .fr-row"));
    return {
      h3: fields(pick.querySelector(":scope > h3"), ["fontSize"]),
      row: fields(pick.querySelector(":scope > .fr-row"), ["fontSize", "height"]),
      fr: fields(pick.querySelector(":scope > .fr"), ["fontSize"]),
      area: fields(pick.querySelector(".fr .fr-area"), [
        "fontSize", "lineHeight", "color", "backgroundColor", "paddingLeft",
      ]),
      mini: fields(pick.querySelector(":scope > .fr-row .fr-mini"), [
        "borderRadius", "borderTopWidth", "borderTopColor", "height",
      ]),
      pre: fields(
        document.querySelector(".practice-reader-section.is-code.is-fr .practice-example-code pre"),
        ["fontSize", "lineHeight"],
      ),
      headingLess: headingLess
        ? fields(headingLess.firstElementChild, ["paddingTop", "borderTopLeftRadius"])
        : null,
    };
  });
  check(!!combinedLaws, "a combined-state section with heading and prose exists");
  check(
    combinedLaws.h3.fontSize === "16px" && combinedLaws.row.fontSize === "16px" && combinedLaws.fr.fontSize === "16px",
    `combined fill children take the 16px voice (${combinedLaws.h3.fontSize}/${combinedLaws.row.fontSize}/${combinedLaws.fr.fontSize})`,
  );
  check(
    combinedLaws.area.fontSize === "16px" && combinedLaws.area.lineHeight === "23.2px"
      && combinedLaws.area.color === "rgb(240, 246, 252)" && combinedLaws.area.paddingLeft === "16px",
    `editable surface carries the fill voice (${combinedLaws.area.fontSize}/${combinedLaws.area.lineHeight}/${combinedLaws.area.color}/${combinedLaws.area.paddingLeft})`,
  );
  check(
    combinedLaws.mini.borderRadius === "0px" && combinedLaws.mini.borderTopWidth === "1px"
      && combinedLaws.mini.borderTopColor === "rgb(61, 68, 77)",
    `reset control is a square with the 1px gh border (${combinedLaws.mini.borderRadius}/${combinedLaws.mini.borderTopWidth}/${combinedLaws.mini.borderTopColor})`,
  );
  check(
    near(parseFloat(combinedLaws.pre.fontSize), 13.6) && near(parseFloat(combinedLaws.pre.lineHeight), 19.72, 0.1),
    `example pre keeps the 13.6px voice in the combined state (${combinedLaws.pre.fontSize}/${combinedLaws.pre.lineHeight})`,
  );
  check(
    combinedLaws.headingLess && combinedLaws.headingLess.paddingTop === "16px"
      && combinedLaws.headingLess.borderTopLeftRadius === "6px",
    `heading-less section's first child takes the top edge (${combinedLaws.headingLess?.paddingTop}/${combinedLaws.headingLess?.borderTopLeftRadius})`,
  );

  // the focus bar: ochre = presence (declared exception to the governing rule)
  await page.$eval(".fr .fr-area", (el) => el.focus());
  await wait(300); // the focus re-render paints the bar; settle before measuring
  const barLaws = await page.evaluate(() => {
    const el = document.querySelector(".fr .fr-area");
    return {
      focused: !!el && el.closest(".fr").hasAttribute("data-focused"),
      shadow: el ? getComputedStyle(el).boxShadow : "",
    };
  });
  check(
    barLaws.focused && barLaws.shadow.includes("inset") && barLaws.shadow.includes("rgb(211, 155, 97)"),
    `textarea focus paints the 3px ochre inset bar (${barLaws.shadow})`,
  );

  // code releases, free stays
  await page.click(".reading-modes button:nth-child(2)");
  check(await appears(".practice-reader-section.is-fr"), "ink free surface remains after code releases");
  const released = await page.evaluate(() => ({
    pressed: [...document.querySelectorAll(".reading-modes button")].map((b) => b.getAttribute("aria-pressed")),
    codeSections: document.querySelectorAll(".practice-reader-section.is-code").length,
    reading: document.querySelector(".practice-lesson-scroll")?.dataset.reading,
    free: document.querySelector(".practice-lesson-scroll")?.dataset.free,
  }));
  check(released.pressed.join(",") === "true,false", `code pill releases alone (${released.pressed.join("/")})`);
  check(released.codeSections === 0 && released.reading === "prose" && released.free === "true", `free stays on after code releases (${released.codeSections} is-code, reading=${released.reading}, free=${released.free})`);
  // code returns — combined again
  await page.click(".reading-modes button:nth-child(2)");
  check(await appears(".practice-reader-section.is-code.is-fr"), "code rejoins the free state");
  const rejoined = await page.$$eval(".reading-modes button", (b) => b.map((x) => x.getAttribute("aria-pressed")));
  check(rejoined.join(",") === "true,true", `both pills pressed again (${rejoined.join("/")})`);
  // release free — code-only again (the §10 voice)
  await page.click(".reading-modes button:nth-child(1)");
  await wait(300);
  check(await appears(".practice-reader-section.is-code"), "code-only state returns after free releases");
  check((await page.$(".fr .fr-area")) === null, "the editable surface leaves with the free flag");

  // F077 toggle parity through the re-gate: free adopts the prose voice and
  // default returns to the same values after the code round-trip
  await page.click(".reading-modes button:nth-child(2)"); // code → prose
  await wait(300);
  await page.click(".reading-modes button:nth-child(1)");
  check(await appears(".fr .fr-area"), "free reading mounts for the F077 parity check");
  const f077Free = await page.evaluate(() => {
    const section = [...document.querySelectorAll(".practice-reader-section.is-fr")]
      .find((s) => s.querySelector(":scope > h3") && s.querySelector(":scope > .fr"));
    if (!section) return null;
    const cs = (el) => getComputedStyle(el);
    return {
      h3Pad: cs(section.querySelector(":scope > h3")).paddingBottom,
      area: (({ paddingLeft, fontSize, lineHeight }) => ({ paddingLeft, fontSize, lineHeight }))(
        cs(section.querySelector(".fr .fr-area")),
      ),
    };
  });
  check(f077Free?.h3Pad === "0px", `is-fr releases the F077 h3 slot (${f077Free?.h3Pad})`);
  check(
    f077Free?.area.paddingLeft === f077Default.p.paddingLeft
      && f077Free?.area.fontSize === f077Default.p.fontSize
      && f077Free?.area.lineHeight === f077Default.p.lineHeight,
    `free surface carries the prose voice (F077 parity: ${JSON.stringify(f077Free?.area)})`,
  );
  await page.click(".reading-modes button:nth-child(1)"); // free → prose
  await wait(300);
  const f077Back = await page.evaluate(() => {
    const section = [...document.querySelectorAll(".practice-reader-section")]
      .find((s) => s.querySelector(":scope > h3") && s.querySelector(":scope > p"));
    if (!section) return null;
    const cs = (el) => getComputedStyle(el);
    return {
      h3Pad: cs(section.querySelector(":scope > h3")).paddingBottom,
      p: (({ paddingLeft, fontSize, lineHeight }) => ({ paddingLeft, fontSize, lineHeight }))(
        cs(section.querySelector(":scope > p")),
      ),
    };
  });
  check(
    JSON.stringify(f077Back) === JSON.stringify(f077Default),
    `default values return unchanged after the re-gate (${JSON.stringify(f077Back)})`,
  );

  // anchor parity, two scroll postures: a section top exactly on the edge
  // (topVisible → px offset parity) and a deliberately mid-section position
  // (top above the edge → the fraction error converts to px via the
  // restored section height before the 2px tolerance)
  await page.click(".practice-reader-nav button:nth-child(6)");
  check(await scrollSettled(), "the chip's smooth scroll settles before the anchor landing");
  // posture 1: land section 5's top 0.25px inside the edge (crossing, top
  // visible) — the restore's topVisible branch, px offset parity. The 0.25
  // slack keeps the LayoutUnit snap (~1/64px) inside the window.
  const edgeLanding = await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const edge = scroller.getBoundingClientRect().top;
    const el = scroller.querySelector('[data-section-index="5"]');
    const r = el.getBoundingClientRect();
    scroller.scrollTop += r.top - edge + 0.25;
    return el.getBoundingClientRect().top - edge;
  });
  const anchorTop = await measureAnchor();
  check(
    anchorTop != null && anchorTop.topVisible,
    `edge landing puts section 5 at ${edgeLanding?.toFixed(2)}px from the edge (anchor=${anchorTop?.index}, topVisible=${anchorTop?.topVisible})`,
  );
  await page.click(".reading-modes button:nth-child(2)"); // prose → code
  await wait(120); // the restore is pre-paint; give the commit a beat
  const restoredTop = await measureRestored(anchorTop);
  const topDelta = Math.abs(restoredTop.value - anchorTop.offset);
  check(topDelta <= 2, `topVisible path: section keeps its px offset across the code switch (Δ ${topDelta.toFixed(2)}px)`);

  // posture 2: back to prose, then push the same section 40% through itself
  // so its top sits above the edge — the restore's fractional branch
  await page.click(".reading-modes button:nth-child(2)"); // code → prose
  await wait(300);
  await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const edge = scroller.getBoundingClientRect().top;
    const el = scroller.querySelector('[data-section-index="5"]');
    const r = el.getBoundingClientRect();
    scroller.scrollTop += r.height * 0.4;
  });
  check(await scrollSettled(), "the mid-section push settles before measuring");
  const anchorMid = await measureAnchor();
  check(
    anchorMid != null && !anchorMid.topVisible && anchorMid.index === "5",
    `mid-section scroll puts section ${anchorMid?.index} at fraction ${anchorMid?.fraction?.toFixed(2)} (topVisible=${anchorMid?.topVisible})`,
  );
  await page.click(".reading-modes button:nth-child(2)"); // prose → code
  await wait(120);
  const restoredMid = await measureRestored(anchorMid);
  // the fraction error is unitless — scale it by the RESTORED section
  // height so the 2px tolerance means the same thing on both paths
  const midDelta = Math.abs(restoredMid.value - anchorMid.fraction) * restoredMid.height;
  check(
    midDelta <= 2,
    `fraction path: the edge keeps its fraction through the section (Δ ${midDelta.toFixed(2)}px of the restored ${restoredMid.height.toFixed(0)}px section)`,
  );

  // anchor parity inside code: a free flip reflows the editable surface
  // (voice/size change plus a body remount) — the section must keep its
  // place across the flip too
  await page.click(".reading-modes button:nth-child(1)"); // free joins code (anchored)
  check(await appears(".fr .fr-area"), "combined state mounts for the in-code anchor leg");
  check(await scrollSettled(), "the combined flip settles");
  await page.evaluate(() => {
    const scroller = document.querySelector(".practice-lesson-scroll");
    const edge = scroller.getBoundingClientRect().top;
    const el = scroller.querySelector('[data-section-index="5"]');
    const r = el.getBoundingClientRect();
    scroller.scrollTop += r.height * 0.4;
  });
  check(await scrollSettled(), "the in-code mid-section push settles before measuring");
  const anchorCode = await measureAnchor();
  check(
    anchorCode != null && !anchorCode.topVisible && anchorCode.index === "5",
    `in-code mid-section puts section ${anchorCode?.index} at fraction ${anchorCode?.fraction?.toFixed(2)}`,
  );
  await page.click(".reading-modes button:nth-child(1)"); // free leaves, code stays (anchored)
  await wait(120);
  const restoredCode = await measureRestored(anchorCode);
  // the fraction error is unitless — scale it by the RESTORED section
  // height so the 2px tolerance means the same thing as the px path
  const codeDelta = Math.abs(restoredCode.value - anchorCode.fraction) * restoredCode.height;
  check(
    codeDelta <= 2,
    `in-code fraction path: the edge keeps its fraction across the free flip (Δ ${codeDelta.toFixed(2)}px of the restored ${restoredCode.height.toFixed(0)}px section)`,
  );

  // persistence: the v2 record holds code (free left inside the in-code
  // anchor leg), and a reload reopens in code
  const persisted = await page.evaluate(() => {
    const rec = localStorage.getItem("practice-map:reading:v2:linux-cli-terminal");
    return rec ? JSON.parse(rec) : null;
  });
  check(
    persisted?.v === 2 && persisted?.presentation === "code" && persisted?.free === false,
    `v2 record holds code after the toggles (${JSON.stringify(persisted)})`,
  );
  // the size choice rides the same reload (§8.1 is a global record): land on
  // 15 and expect it back after the reopen
  await page.click(".fr-size");
  await wait(100);
  await page.click(".fr-size");
  await wait(100);
  const size15Set = await readSize();
  check(size15Set.attr === "15" && near(parseFloat(size15Set.fill), 15), `size set to 15 for the persistence leg (attr=${size15Set.attr}, fill ${size15Set.fill})`);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 150000 });
  check(await appears(".pg-card"), "map renders after reload");
  await page.click('[data-turn="next"]');
  await wait(300);
  await page.click('[data-turn="next"]');
  await wait(300);
  await page.click('.pg-tier-row[data-tier-id="opus-4.8-thinking"]');
  await wait(400);
  await page.click(".pg-face-head");
  await wait(400);
  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader-nav button"), "reader reopens after reload");
  const restoredHooks = await page.$eval(".practice-lesson-scroll", (el) => ({
    reading: el.dataset.reading,
    free: el.dataset.free,
  }));
  check(
    restoredHooks.reading === "code" && restoredHooks.free === undefined,
    `reopened lesson reads as code from storage (reading=${restoredHooks.reading}, free=${restoredHooks.free})`,
  );
  check(
    (await page.$(".practice-reader-section.is-code")) !== null,
    "persisted code mode renders is-code sections after reload",
  );
  const sizeRestored = await readSize();
  check(
    sizeRestored.attr === "15" && near(parseFloat(sizeRestored.fill), 15) && near(parseFloat(sizeRestored.pre), 15, 0.1),
    `the size choice survives the reload (attr=${sizeRestored.attr}, fill ${sizeRestored.fill}, pre ${sizeRestored.pre})`,
  );
  // cycle back to github so downstream legs stay default
  await page.click(".fr-size");
  await wait(100);
  await page.click(".fr-size");
  await wait(100);
  const sizeReset = await readSize();
  check(
    sizeReset.attr === "github" && near(parseFloat(sizeReset.fill), 13.6),
    `size cycled back to github for the downstream legs (attr=${sizeReset.attr}, fill ${sizeReset.fill})`,
  );

  // leave prose for the downstream (mobile) legs — a persisted code mode
  // would otherwise follow lesson 01 into them
  await page.click(".reading-modes button:nth-child(2)"); // code → prose (free already off)
  await wait(300);
  check((await page.$(".practice-reader-section.is-code")) === null, "code releases for the downstream legs");
  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes after the read-as-code leg");

  // migration: the seeded v1 record strictly supersedes the free:v2 fossil —
  // opening lesson 02 migrates to v2 code and removes BOTH superseded records
  const volCards = await page.$$(".pg-card .pg-pill");
  await volCards[1].click();
  check(await appears(".practice-reader-nav button"), "lesson 02 opens for the migration leg");
  check(
    (await page.$(".practice-reader-section.is-code")) !== null,
    "the v1 code record migrates — the reader opens as code",
  );
  check((await page.$(".fr .fr-area")) === null, "the migrated code state mounts no editable surface");
  const migrated02 = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const read = (k) => {
      const r = localStorage.getItem(k);
      return r ? JSON.parse(r) : null;
    };
    return {
      v1Gone: keys.every((k) => k !== "practice-map:reading:v1:linux-filesystem-hierarchy"),
      fossilGone: keys.every((k) => k !== "practice-map:free:v2:linux-filesystem-hierarchy"),
      rec: read("practice-map:reading:v2:linux-filesystem-hierarchy"),
    };
  });
  check(
    migrated02.v1Gone && migrated02.fossilGone
      && migrated02.rec?.v === 2 && migrated02.rec?.presentation === "code" && migrated02.rec?.free === false,
    `v1 code record migrates to v2 and removes both superseded records (${JSON.stringify(migrated02.rec)})`,
  );
  const pressed02 = await page.$$eval(".reading-modes button", (b) => b.map((x) => x.getAttribute("aria-pressed")));
  check(pressed02.join(",") === "false,true", `pills reflect the migrated code state (${pressed02.join("/")})`);
  // release lesson 02 from code before leaving — downstream legs must see
  // no surprise state (they only open lesson 01, but the record stays tidy)
  await page.click(".reading-modes button:nth-child(2)"); // code → prose (free already off)
  await wait(300);
  check((await page.$(".practice-reader-section.is-code")) === null, "lesson 02 released to prose before closing");
  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes after the lesson-02 migration leg");

  // lesson 03: only the free:v2 fossil — migrates to prose+free on read
  const volCards2 = await page.$$(".pg-card .pg-pill");
  await volCards2[2].click();
  check(await appears(".fr .fr-area"), "the free:v2 fossil migrates — lesson 03 opens straight into free reading");
  const migrated03 = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const rec = localStorage.getItem("practice-map:reading:v2:linux-shell-fundamentals");
    return {
      fossilGone: keys.every((k) => k !== "practice-map:free:v2:linux-shell-fundamentals"),
      rec: rec ? JSON.parse(rec) : null,
    };
  });
  check(
    migrated03.fossilGone && migrated03.rec?.v === 2
      && migrated03.rec?.presentation === "prose" && migrated03.rec?.free === true,
    `free:v2 fossil migrates to v2 prose+free and is removed (${JSON.stringify(migrated03.rec)})`,
  );
  const pressed03 = await page.$$eval(".reading-modes button", (b) => b.map((x) => x.getAttribute("aria-pressed")));
  check(pressed03.join(",") === "true,false", `pills reflect the migrated free state (${pressed03.join("/")})`);
  await page.click(".reading-modes button:nth-child(1)"); // free → prose
  await wait(300);
  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes after the lesson-03 migration leg");

  // --- the race guard: a migration adopts a newer v2 instead of overwriting it

  // Cross-tab race, simulated deterministically: A reads no v2 record and
  // computes the migration from a v1 record; B's newer user choice lands in
  // durable storage before A's guard re-read. Seed lesson 01 with the v1
  // record, reload (fresh module state and snapshot cache), then hide B's
  // raw from A's FIRST read only — the guard's re-read must see and adopt it.
  await page.evaluate(() => {
    const v2key = "practice-map:reading:v2:linux-cli-terminal";
    window.localStorage.removeItem(v2key);
    window.localStorage.setItem(
      "practice-map:reading:v1:linux-cli-terminal",
      JSON.stringify({ v: 1, mode: "code", updatedAt: 1 }),
    );
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 150000 });
  check(await appears(".pg-card"), "map renders after the race-guard reload");
  await page.click('[data-turn="next"]');
  await wait(300);
  await page.click('[data-turn="next"]');
  await wait(300);
  await page.click('.pg-tier-row[data-tier-id="opus-4.8-thinking"]');
  await wait(400);
  await page.click(".pg-face-head");
  await wait(400);
  // the stub: an own property on the storage instance (the prototype method
  // stays intact for the restore) — call 1 hides B, every later read passes
  // through; B's newer write lands right after the stub takes effect
  await page.evaluate(() => {
    const v2key = "practice-map:reading:v2:linux-cli-terminal";
    const foreign = JSON.stringify({
      v: 2,
      presentation: "code",
      free: true,
      updatedAt: 9999999999999,
    });
    const original = window.localStorage.getItem.bind(window.localStorage);
    let calls = 0;
    window.localStorage.getItem = function (k) {
      if (k === v2key && calls++ === 0) return null; // A's stale first read
      return original(k);
    };
    window.localStorage.setItem(v2key, foreign); // B's newer choice lands
  });
  await page.click(".pg-card .pg-pill");
  check(await appears(".practice-reader-nav button"), "reader opens for the race-guard leg");
  const raceHooks = await page.$eval(".practice-lesson-scroll", (el) => ({
    reading: el.dataset.reading,
    free: el.dataset.free,
  }));
  check(
    raceHooks.reading === "code" && raceHooks.free === "true",
    `a migration adopts a newer v2 instead of overwriting it — the adopted state renders (reading=${raceHooks.reading}, free=${raceHooks.free})`,
  );
  check(await appears(".fr .fr-area"), "the adopted free flag mounts the editable surface");
  const racePressed = await page.$$eval(".reading-modes button", (b) => b.map((x) => x.getAttribute("aria-pressed")));
  check(racePressed.join(",") === "true,true", `pills reflect the adopted state (${racePressed.join("/")})`);
  const raceRecords = await page.evaluate(() => {
    const rec = localStorage.getItem("practice-map:reading:v2:linux-cli-terminal");
    return {
      stored: rec ? JSON.parse(rec) : null,
      raw: rec,
      v1Still: localStorage.getItem("practice-map:reading:v1:linux-cli-terminal") !== null,
    };
  });
  check(
    raceRecords.stored?.v === 2 && raceRecords.stored?.presentation === "code"
      && raceRecords.stored?.free === true && raceRecords.stored?.updatedAt === 9999999999999,
    `the stored v2 key holds the foreign raw verbatim (no overwrite: ${raceRecords.raw})`,
  );
  check(
    raceRecords.v1Still,
    "the adopt path leaves the superseded v1 record to its owner (removal skipped)",
  );
  // cleanup: remove the stub (the own property — the prototype method
  // returns) and put lesson 01 back to prose so downstream legs stay clean
  await page.evaluate(() => {
    delete window.localStorage.getItem;
    window.localStorage.setItem(
      "practice-map:reading:v2:linux-cli-terminal",
      JSON.stringify({ v: 2, presentation: "prose", free: false, updatedAt: Date.now() }),
    );
    window.localStorage.removeItem("practice-map:reading:v1:linux-cli-terminal");
  });
  await page.keyboard.press("Escape");
  await wait(400);
  check((await page.$(".practice-lesson-overlay")) === null, "Escape closes after the race-guard leg");

  // --- desktop: fragment fallback -------------------------------------------

  // card 6 (linux-users-groups) is the first remaining fragment card — Linux
  // cards 1-5 are deep lessons since the long-form md course landed.
  // vol 01 holds the four deep lessons; the first fragment (linux-users-groups)
  // lives at index 1 of vol 02 — the reader was opened from the thinking tier's
  // vol 01 (restored by the fold-invariant leg), so exit to the faces, then
  // enter vol 02.
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
  // The Go flagship lives in the fable-5.1-low tier (row 06, page 2 of TIERS
  // data order since muse-wonder-max joined first — the astra run leads the
  // list per the owner's request: astra-6-max first, astra-6-medium second;
  // the fable run follows). One prev turns from page 3 to page 2.
  await page.click('[data-turn="prev"]');
  await wait(300);
  await page.click('.pg-tier-list .pg-tier-row[data-tier-id="fable-5.1-low"]');
  await wait(400);
  // The tier leads with the English Go lesson (owner's EN-first rule); the
  // 19-section flagship card is picked by its title, not by position.
  const goTierRows = await page.$$('.pg-tier-row[data-tier-id="fable-5.1-low"]');
  check(goTierRows.length === 1, `the fable-5.1-low tier is reachable (${goTierRows.length})`);
  await goTierRows[0].click();
  await wait(400);
  // The tier folds into folder faces (owner's 8+ fold rule); the Go flagship
  // lives in the tech folder — the first face in the data.
  await page.click(".pg-face-head");
  await wait(400);
  // the flagship card is picked by its title, not by position.
  const goCardTitles = await page.$$eval(".pg-card h3", (els) => els.map((el) => el.textContent.trim()));
  check(goCardTitles.some((t) => t === "Go с нуля до глубокого понимания"), `flagship card sits in the fable-5.1-low tier (${goCardTitles.join(" | ").slice(0, 120)})`);
  const goCardHandles = await page.$$(".pg-card");
  const goCardIndex = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".pg-card"));
    return cards.findIndex((c) => c.querySelector("h3")?.textContent.trim() === "Go с нуля до глубокого понимания");
  });
  await (await goCardHandles[goCardIndex].$(".pg-pill")).click();
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
  check(await appears(".pg-card"), "map renders at 390px (first tier is flat — cards)");
  // Folder faces are covered on the first foldered tier (astra-6-max).
  await page.tap('.pg-tier-row[data-tier-id="astra-6-max"]');
  await wait(400);
  check(await appears(".pg-face-head"), "astra-6-max folds into folder faces at 390px");
  // The pinned-close / copy-button laws were tuned on the Linux deep reader:
  // reach it the way the tier design does — thinking tier (last row), vol 01.
  // The tier list pages at 5 rows: page to page 3 first, then pick the row.
  await page.tap('[data-turn="next"]');
  await wait(300);
  await page.tap('[data-turn="next"]');
  await wait(300);
  await page.tap('.pg-tier-row[data-tier-id="opus-4.8-thinking"]');
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

  check(await appears(".pg-card"), "map renders at 320px (first tier is flat — cards)");
  await page.tap('.pg-tier-row[data-tier-id="astra-6-max"]');
  await wait(400);
  check(await appears(".pg-face-head"), "astra-6-max folds into folder faces at 320px");
  await page.tap('[data-turn="next"]');
  await wait(300);
  await page.tap('[data-turn="next"]');
  await wait(300);
  await page.tap('.pg-tier-row[data-tier-id="opus-4.8-thinking"]');
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

  // --- desktop: storage-quota resilience (NQ01) ------------------------------
  // Owner report: on Edge Windows + iOS Safari the shared-origin localStorage
  // was already full, the first mount write (progress v1) threw and the
  // ProjectFrame error boundary killed the project ("hit a snag"). The guard
  // fix is progress.ts's try/catch + memory fallback; this leg reproduces the
  // full-storage start in Chrome and pins the two behaviors: the map opens,
  // the crash view never mounts.
  const quotaPage = await browser.newPage();
  const quotaProblems = [];
  quotaPage.on("pageerror", (err) => quotaProblems.push(`pageerror: ${err.message}`));
  quotaPage.on("console", (msg) => {
    if (msg.type() === "error") quotaProblems.push(`console.error: ${msg.text()}`);
  });
  await quotaPage.setViewport({ width: 1440, height: 900 });
  // 1) mount on the dev-server origin so the filler targets THE app's storage
  //    (evaluateOnNewDocument would fill about:blank — a different origin).
  await quotaPage.goto(`${BASE}/projects/practice-map`, { waitUntil: "domcontentloaded", timeout: 150000 });
  check(await appears(".pg-card", 30000), "quota leg: app mounts before the fill (NQ01)");
  // 2) reconstruct the owner's incident: the origin is at its quota, the
  //    STORED progress blob is SMALL (the pre-batch state), and the mount's
  //    rewrite is BIGGER (the batch added topics). A growth vs an at-quota
  //    storage is the case that throws on ALL engines. Park a tiny valid
  //    blob in the app's own key, then fill the remaining space with small
  //    keys so no headroom remains, and reload: the mount's rewrite must
  //    pass only via the save guard (before the guard this was the reported
  //    "hit a snag"). Small filler keys keep the tail free-space under 4KB.
  await quotaPage.evaluate(() => {
    window.localStorage.setItem("practice-map:progress:v1", '{"topics":{}}');
    const filler = "x".repeat(4096);
    for (let i = 0; ; i++) {
      try {
        window.localStorage.setItem(`quota-filler:${i}`, filler);
      } catch {
        return `tail jammed at ${i * 4}KB leftovers`;
      }
    }
  });
  const parked = await quotaPage.evaluate(() => window.localStorage.getItem("practice-map:progress:v1")?.length ?? 0);
  const items = await quotaPage.evaluate(() => window.localStorage.length);
  check(parked === 13 && items > 1, `storage at quota with a small valid progress blob (blob ${parked}B, ${items} keys)`);
  await quotaPage.goto(`${BASE}/projects/practice-map`, { waitUntil: "domcontentloaded", timeout: 150000 });
  await quotaPage.waitForSelector(".pg-card", { timeout: 30000 }).catch(() => {});
  const opened = await appears(".pg-card");
  if (!opened) {
    // failure diagnostics: what actually rendered under a full storage
    const dump = await quotaPage.evaluate(() => ({
      cardCount: document.querySelectorAll(".pg-card").length,
      crashCount: document.querySelectorAll(".project-crash").length,
      crashDetail: document.querySelector(".project-crash-detail")?.textContent?.trim()?.slice(0, 200) ?? null,
      progressLen: window.localStorage.getItem("practice-map:progress:v1")?.length ?? -1,
      parkedLen: 0,
    }));
    console.log(`quota leg failure dump: ${JSON.stringify(dump)}`);
    await quotaPage.screenshot({ path: join(SHOTS, "quota-failure.png") });
  }
  check(opened, "map opens with a full localStorage (NQ01 quota guard)");
  check((await quotaPage.$(".project-crash")) === null, "no crash boundary behind a full storage (NQ01)");

  quotaPage.close();

  await page.close();
  await browser.close();

  problems.push(...consoleProblems);
  problems.push(...quotaProblems);

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

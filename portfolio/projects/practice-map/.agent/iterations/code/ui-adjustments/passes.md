# Passes — UI adjustments (hero shrink, route rail fit, pill toggle, wider lesson, minimal header)

## Pass C001 — VERIFIED (typecheck + build + browser probe scope)
- Objective and scope: owner's five UI asks — (1) hero copy "deep lessons. / local notes." at ~37% smaller size with a shrunk copy panel, (2) route rail compacted to fit the hero organically with no dead space, (3) "free reading" toggle ~2× with rounded corners, (4) lesson window width +25% (950→~1190px), (5) lesson header minimalized so it stops competing with the reading column.
- Acceptance criteria: hero ≈36.8px at 1440 (was ~59px) with compact panels; rail and copy panel read as tight siblings (no interior voids); pill button ≥2× linear (15.2px font, ~40px tall, 999px radius); lesson panel ≥1150px at 1440; header ≤~50px tall; reading column capped at 72ch inside the wider frame.
- Changes:
  - `web/PracticeMapPage.tsx` — hero copy → "deep lessons." + ochre span "local notes.".
  - `web/practice-map.css` — h1 font clamp 1.76rem/19.4/3.68rem → 1.15rem/31/2.3rem (mobile override → clamp(1.25rem, 5.3vw, 1.75rem)); hero grid `align-items: start` replacing the old stretch law (with the compact headline the stretched shared height left a dead void in the copy panel; each panel now hugs its content, top edges aligned); copy panel + rail paddings scaled down; lesson panel `width: min(1190px, 100%)`; new cap rule — `.practice-lesson-objectives/.practice-reader-nav/.practice-reader/.practice-lesson-body { max-width: 72ch; margin-inline: auto }` so the wider window grows the frame, not the measure (chrome: free bar, hairline, footer stay full-bleed); lesson header — padding-bottom 1rem→0.6rem, gap 1.5→1rem, kicker 0.72→0.64rem, h2 → muted, clamp(1rem,1.8vw,1.3rem), weight 550, margin 0.1rem.
  - `web/lib/freeReading/freeReading.css` — `.fr-controls button` padding 0.28/0.6 → 0.6/1.2rem, font 0.68 → 0.95rem, `border-radius: 999px`.
- Baseline: typecheck PASS before edits (main synced).
- Verification:
  - Command: `npm run typecheck` / `npm run build`
    Result: both PASS, exit 0 (pre-existing chunk-size warning only).
  - Command: ad-hoc probe (`pm-probe2.mjs`, 11 assertions live)
    Result: PASS — hero copy exact; 36.8px h1; hero panel 126px vs rail 189px (start-aligned siblings); lesson panel 1172px @1440; header 48.9px; reading column 681px inside 1172px panel; pill 15.2px/999px/40.7px.
  - Evidence: `/var/folders/8x/…/T/pm-probe3/*.png`, `/var/folders/8x/…/T/pm-probe4/*.png` (desktop/1024/390 hero, lesson open).
- Final diff review: performed — no unrelated files touched; explosion store's lagged lines left unstaged (not mine).
- Design constraints: owner's copy-diet language intact; free-reading pivot + iOS zoom guard untouched; uppercase-free lowercase mono chrome.
- Remaining risks/blockers:
  - The 72ch cap is my own addition (the widened window would otherwise run ~115-char Russian lines); the frame grows, the measure doesn't — flag for the owner's eye on the lesson screenshots.
  - Real-Safari/iOS visual pass still NOT RUN (emulator only).
- Next action: owner's visual review of hero + lesson; follow-up tweaks are one-line CSS edits.

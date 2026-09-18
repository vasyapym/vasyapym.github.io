# Ledger — chrome-trim

Task: (1) remove the Raft Cluster hero text (h1 + thesis); (2) tighten the
whitespace surrounding the Practice Map hero band ("deep lessons." /
"local notes." / "explore concept graph") by ~35% — surrounding
padding/margins only, section dimensions untouched.
Delegated to the chat model via briefs; orchestrator integrates, verifies,
records rounds. Two projects: raft-cluster, practice-map.

## Baseline (R000) — measured 2026-09-18, dev server, Chromium 129

Raft desktop 1440: .raft-head y=93..159 (hero text block 66px tall; topbar
61 + 32px page padding), .raft-grid starts y=175. Mobile 390: .raft-head
y=89..219 (text block 89..168), grid at y=235.
Practice map desktop 1440: page starts y=61; hero band y=133..314 (page
padding-top = 72px = clamp(3rem,5vw,4.5rem) max); .practice-map-layout
starts y=394 (margin-top 80px = clamp(3rem,6vw,5rem) max). Mobile 390:
hero y=113..489 (padding-top 40px = 2.5rem ≤560 rule), layout at y=537
(margin-top 48px).
Artifacts: artifacts/R000-baseline/

## Round R001
- Goal: the two changes above, delegated to the chat model (brief 1).
- Preserved preferences: raft trim-thesis-copy direction (owner rejects
  wordy hero copy on this page — F001/F002 in that thread); practice-map
  n41/n42 scope-trim direction (compact chrome); card internal padding and
  section dimensions stay.
- Changes: pending chat-model response.
- Before: artifacts/R000-baseline/
- After: —
- Visual inspection: baseline performed (screenshots + metrics above).
- Code verification: NOT RUN
- Open question: awaiting chat-model deliverable.

## Round R001 (implemented — completes the R001 briefing above)
- Goal: the two changes above (raft hero text removal; practice-map hero-band
  whitespace −35%), designed by the chat model, integrated by orchestrator.
- Preserved preferences: raft trim-thesis-copy direction; practice-map n41/n42
  compact-chrome direction; card internals + section dimensions untouched.
- Changes:
  - RaftPage.tsx: .raft-head-text block (h1 + thesis) deleted; sr-only
    `<h1 class="raft-sr-title">Raft cluster</h1>` keeps the outline; wrapper
    .raft-head kept (margin-bottom spacer intact); controls untouched.
  - raft.css: dead rules .raft-head-text / .raft-head h1 / .raft-thesis
    replaced by one .raft-sr-title utility.
  - practice-map.css ×0.65 on surrounding whitespace only:
    page padding-top clamp(3,5vw,4.5)→clamp(1.95,3.25vw,2.9)rem;
    hero gap clamp(1.25,3vw,2.5)→clamp(0.8,1.95vw,1.6)rem;
    layout margin-top clamp(3,6vw,5)→clamp(1.95,3.9vw,3.25)rem;
    ≤900 hero gap 2.5→1.6rem; ≤560 page padding-top 2.5→1.6rem.
    Untouched by design: page padding-bottom, layout internal gap, card
    internals, min-height:10.5rem.
- Before: artifacts/R000-baseline/
- After: artifacts/R001/
- Visual inspection: PERFORMED (Chromium 129, 1440 + 390). Metrics: raft head
  93..159 → 93..127 (controls only), grid 175→143 desktop / 235→140 mobile;
  sr-title 1px out-of-flow. Practice map above-hero 72→46px, below-hero
  80→52px (desktop), 40→26 / 48→32 mobile (all ×0.65); hero card heights
  unchanged (181=181 desktop; mobile band −14px = the gap cut itself).
  Screenshots read: raft shows controls row only; practice-map cards intact.
- Code verification: `npm run typecheck` PASS; no horizontal scroll at
  1440/390 on either page.
- Open question: LIKED / REJECTED on the round?

## Feedback F001
- Round: R001
- Verdict: LIKED
- Scope: the round as a whole — raft hero text removal + practice-map hero
  band whitespace −35%
- Decision: both changes stand as shipped
- User source: "i like it"
- Artifact: artifacts/R001/
- Supersedes: none

## Round R002
- Goal: owner-specified copy replacement on raft — add "A full Raft state
  machine written in Rust, compiled to WebAssembly, and visualized with
  Canvas 2D." in the removed thesis's slot (the smaller-font line), sr-only
  h1 stays.
- Preserved preferences: F001; no big hero headline returns.
- Changes (owner gave the exact text and placement — trivial, integrated
  directly without chat-model delegation):
  - RaftPage.tsx: `<p className="raft-thesis">` added to .raft-head before
    the controls, with the owner's sentence verbatim.
  - raft.css: .raft-thesis rule restored verbatim (0.9rem, muted, 60ch).
- Before: artifacts/R001/raft-desktop.png
- After: artifacts/R001/raft-thesis-desktop.png, raft-thesis-mobile.png
- Visual inspection: PERFORMED (1440 + 390): thesis 14.4px muted at
  x=120/top-left, controls right-aligned (flex-end), grid at y=152 desktop /
  y=199 mobile; no overlap, no horizontal scroll.
- Code verification: `npm run typecheck` PASS.
- Open question: none — owner-specified copy; thread continues if feedback.

## Round R003
- Goal: owner tweak — the R002 thesis line becomes the TITLE (the removed
  hero headline's register) instead of the small muted line.
- Preserved preferences: F001; owner's sentence is the verbatim copy; no
  extra text.
- Changes (owner-specified, trivial — integrated directly):
  - RaftPage.tsx: sr-only h1 + p.raft-thesis replaced by one visible
    `<h1>` with the owner's sentence; controls untouched.
  - raft.css: .raft-sr-title and .raft-thesis rules removed; .raft-head h1
    rule restored with the removed headline's styles (clamp 1.25-1.6rem,
    600, -0.01em) PLUS the removed text-track flex (1 1 340px, min-width
    260px) so the removed hero's geometry returns: title left, controls
    right on the same row. (First attempt without the track wrapped the
    controls below-left — rejected during visual check.)
- Before: artifacts/R001/raft-thesis-desktop.png
- After: artifacts/R001/raft-title2-desktop.png, raft-title2-mobile.png
- Visual inspection: PERFORMED (1440 + 390): desktop h1 two lines at
  x=120..949 y=93..170, controls right-aligned x=965..1320 same row, grid at
  y=186; mobile title wraps, controls follow below; no horizontal scroll.
- Code verification: `npm run typecheck` PASS.
- Open question: LIKED / REJECTED on the title treatment?

## Round R004
- Goal: owner tweak — title shortened to "A full Raft state machine written
  in Rust." and font size reduced ~30%.
- Preserved preferences: F001; R003 geometry (track left, controls right).
- Changes (owner-specified, trivial — integrated directly):
  - RaftPage.tsx: h1 text shortened to the owner's sentence verbatim.
  - raft.css: h1 font-size clamp(1.25rem, 2.4vw, 1.6rem) →
    clamp(0.875rem, 1.68vw, 1.12rem) (×0.7 on every stop).
- Before: artifacts/R001/raft-title2-desktop.png
- After: artifacts/R001/raft-title3-desktop.png, raft-title3-mobile.png
- Visual inspection: PERFORMED (1440 + 390): desktop one line at 17.9px,
  controls same row (y=93..127), grid at y=143; mobile 14px single line,
  grid at y=177; no horizontal scroll either width.
- Code verification: `npm run typecheck` PASS.
- Open question: LIKED / REJECTED?

## Round R005
- Goal: owner tweak — title "too small", must sit 5-10% above the option
  choice texts ("3 nodes" / "5 nodes" / "7 nodes").
- Interpretation (recorded): the option texts render at 0.85rem = 13.6px
  (desktop) and 16px in the any-pointer:coarse zoom-guard regime. R004's
  clamp floored at 14px — BELOW the 16px option texts on touch/narrow
  viewports, which is the regime where the title could read "too small".
  Fix anchors the title to the option size itself: options × 1.075 in both
  regimes. On desktop this also reduces the title 17.9 → 14.64px (the old
  +32% gap exceeded the requested 5-10%); flagged to the owner with numbers.
- Changes (owner-specified ratio — integrated directly):
  - raft.css: .raft-head h1 font-size clamp(0.875rem, 1.68vw, 1.12rem) →
    0.915rem (= 0.85rem × 1.075); new rule in the any-pointer:coarse block:
    1.075rem (= 16px × 1.075).
- Before: artifacts/R001/raft-title3-desktop.png
- After: artifacts/R001/raft-title4-desktop.png, raft-title4-mobile.png
- Visual inspection: PERFORMED (1440 + 390 touch): desktop title 14.64px vs
  select 13.6px (+7.6%), one line, controls same row; touch title 17.2px vs
  select 16px (+7.5%); no horizontal scroll.
- Code verification: `npm run typecheck` PASS.
- Open question: LIKED / REJECTED? If the owner meant the desktop title to
  stay larger (they said "too small" seeing 17.9px), the anchor multiplier
  is one number to change.

## Feedback F002
- Round: R005
- Verdict: LIKED (partial — mobile)
- Scope: the mobile/touch title size (1.075rem = option texts × 1.075)
- Decision: keep the mobile title size as shipped; desktop must grow and
  adapt to the simulation window width
- User source: "i like this on mobile. on desktop it is small. increase.
  make it so that it is adaptable to the 'raft cluster' simulation window"
- Artifact: artifacts/R001/raft-title4-mobile.png
- Supersedes: none

## Round R006
- Goal: desktop title bigger and window-adaptive per F002; mobile untouched.
- Preserved preferences: F002 (mobile 1.075rem coarse rule stays verbatim);
  R003 geometry; owner sentence verbatim.
- Changes: raft.css .raft-head h1 font-size 0.915rem →
  clamp(1.075rem, 1.6vw, 1.5rem) — floor is the liked mobile size, scales
  with viewport, caps at 1.5rem. Coarse-pointer rule (1.075rem) untouched.
- Before: artifacts/R001/raft-title4-desktop.png
- After: artifacts/R001/raft-title5-desktop.png, -1920.png, -mobile.png
- Visual inspection: PERFORMED. Measured font sizes: 390 → 17.2px (floor,
  liked); 1024 → 17.2px (floor knee ~1075px); 1440 → 23.04px; 1920 → 24px
  (cap). No horizontal scroll at any width; typecheck PASS.
- Open question: LIKED / REJECTED on the desktop scaling curve (floor 17.2 →
  cap 24px; the vw slope and cap are single numbers to tweak)?

## Feedback F003
- Round: R006
- Verdict: LIKED
- Scope: the desktop title scaling curve (clamp(1.075rem, 1.6vw, 1.5rem)) —
  and with it the whole raft title line of iterations (R002-R006)
- Decision: the window-adaptive title stands; the chrome-trim thread is
  CLOSED — raft hero (title + geometry + adaptive size) and practice-map
  whitespace (R001, F001) both settled, no remaining work
- User source: "liked"
- Artifact: artifacts/R001/raft-title5-desktop.png
- Supersedes: none

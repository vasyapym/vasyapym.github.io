# Passes — kitty-run DMCA redesign (card mark, select portrait, in-game cat)

Task: redesign the pastel cat identity across three surfaces (landing-card
mark, character-select portrait, in-game playable cat) to reduce
Hello Kitty / Sanrio IP risk while preserving the current form, silhouette,
and charm. The ashen knight is out of scope (already distinct).

Delegation: chat model (no repo access) produces drop-in code; this agent
integrates, verifies, and records. Owner protocol applies: full design/code
autonomy for the chat model, with a shown deep-reasoning chain
(restate → 5+ directions → prune → develop → stress-test → rank → commit).

## Baseline (2026-09-13)

- `npm --prefix portfolio run typecheck` — PASS (clean).
- `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts` — PASS (all checks).
- Surfaces in scope:
  - `portfolio/shell/src/shell/ProjectArtwork.tsx` — `KittyCenterMark` (card mark, viewBox 260×160).
  - `portfolio/projects/kitty-run/web/CharacterPortraits.tsx` — `KittyPortrait` (select poster, viewBox 100×100).
  - `portfolio/projects/kitty-run/web/kitty/Kitty.tsx` — pastel branch of the playable rig (+ `lib/palette.ts` keys shared with the souls theme).
- Stale handoff h3 (ashen skyline) acknowledged but unclosed — belongs to the
  ashen direction, not this task; left alone per STATE.md.

## Pass C001 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: replace the two flat SVG cat surfaces (landing-card
  mark, character-select portrait) with the "Pop Kitty" differentiators —
  star hairclip replaces the ear bow, small w-mouth added (Sanrio's cat has
  none), white catchlight specks in the eyes, red accent nose — while keeping
  the existing silhouette geometry (wide head, buried ear bases, card
  composition, poster bust) untouched.
- Acceptance criteria: tsc clean; kitty-run node checks pass; ids
  gem-cat-dense/sparse/halo/head-clip preserved; exactly one `.gem-halo`
  ellipse with `style={haloVar(0.12)}`; no imports/props added; portrait
  keeps the OUTLINE_PASTEL stroke convention and hardcoded colours.
- Changes:
  - `portfolio/shell/src/shell/ProjectArtwork.tsx` — `KittyCenterMark`
    rewritten: cream head `#fff6ee` with pink shadow step `#f1b9c5`, dense
    dot pattern recoloured to the accent `#e94f64`, star clip polygon on the
    right ear (bow removed), w-mouth path, catchlights, accent nose.
  - `portfolio/projects/kitty-run/web/CharacterPortraits.tsx` —
    `KittyPortrait`: bow paths replaced by a star clip polygon
    (`stroke="none"`), yellow nose → `#e94f64`, catchlight specks, small
    w-mouth at strokeWidth 2.
- Delegation note: chat-model reply arrived as a props/imports component
  with gradient-mask shading and non-reserved ids; salvaged the character
  design (features, palette, star geometry) and re-laid it onto the repo's
  existing geometry and contracts. The reply's radial-gradient fade mask was
  dropped (violates the flat halftone family); stepped tone fill kept.
- Baseline: tsc clean, node checks pass (see baseline section above).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0, no output).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Command: landing-card screenshot via puppeteer-core
    Result: NOT RUN — no Chrome/Chromium/Edge binary exists on this machine
    (mdfind/ls found none); shot script exited "no chrome" and was removed.
- Final diff review: diff inspected — only the two functions changed; no
  debug scaffolding, no secrets, no unrelated edits.
- Design constraints: not applicable (no design-iteration ledger for this
  task yet; visual acceptance belongs to a design-iteration round).
- Remaining risks/blockers: visual check of both surfaces pending (owner or
  a machine with a browser); star-clip placement on the card ear apex is
  hand-computed and unviewed; the card's dense-dot hue moved #ff8fbf →
  #e94f64 (deeper rose-red) — hover/wash CSS keys off `--project-accent`,
  not the pattern fill, so no CSS coupling expected.
- Next action: part 2 — brief the in-game rig (Kitty.tsx pastel branch) from
  the Pop Kitty design language; visual round after that.

## Pass C002 — VERIFIED (code scope) / visual NOT RUN

- Objective and scope: apply the Pop Kitty language to the in-game rig's
  pastel branch (star clip replaces bow, red accent nose, "w" mouth, white
  catchlights, warm cream base coat) without touching the souls branch,
  silhouette geometry, or rig.ts.
- Acceptance criteria: tsc clean; node checks pass; palette keys unchanged
  (only `kittyWhite` value changed); `bowRef`/`eyeLRef`/`eyeRRef` refs and
  pose contract intact; new z values with stated clearance; souls branch
  byte-identical.
- Changes:
  - `web/kitty/Kitty.tsx` — added `starShape()` (5-point, outer 0.2 /
    inner 0.09) and `mouthWShape()` (two shallow arcs, hw 0.18, dip 0.11,
    thickness 0.05); geo entries `star`, `mouth`, `catchlight`; face block:
    catchlights parented INSIDE eye meshes (blink squash propagates), nose
    `noseYellow` → `bowRed`, mouth at [0, -0.32, 0.255] (0.035 above head
    fill 0.22, no xy overlap with nose z 0.27); bow group replaced by a
    single star `Part` (outline 1.2) keeping `ref={bowRef}` and its
    position, so bowRot/bowScale animation carries over.
  - `web/lib/palette.ts` — `kittyWhite` `#ffffff` → `#fff6ee` (warm cream,
    matches card art; knight palette unaffected — it overrides every key).
- Delegation note: chat-model reply (normal model, full brief) arrived
  contract-clean; integrated verbatim with formatting adapted to the file's
  prettier style. Rationale from the reply: star stays in the bow group
  (ear-nesting would couple it to ear-flap and lose dash/happy pulse);
  catchlights enlarged to r 0.035 for the ~55px head; mouth thicker than
  whisker gauge on purpose.
- Baseline: tsc clean, node checks pass (C001).
- Verification:
  - Command: `npm --prefix portfolio run typecheck`
    Result: PASS (exit 0).
  - Command: `node --experimental-strip-types portfolio/projects/kitty-run/tests/kitty-run.check.ts`
    Result: PASS — "All kitty-run checks passed."
  - Visual (in-game render): NOT RUN — no browser binary on this machine
    (C001 finding); rig z-ladder reasoned through but unviewed.
- Final diff review: `git diff --stat` shows only the four task files
  (+ unrelated explosion graph line from another agent, untouched). Souls
  branch untouched; `bowLoop`/`bowKnot` geo entries now unused but retained
  to keep the diff minimal (harmless; candidate for a cleanup pass).
- Design constraints: not applicable.
- Remaining risks/blockers: visual acceptance of all three surfaces pending
  (owner device check or design-iteration round); star sits at the old bow
  anchor floating beside the ear rather than ON it — unviewed, may want a
  nudge in the visual round.
- Next action: task code-complete; deliver (commit+push), record graph
  node, hand visual round to the owner / design-iteration.



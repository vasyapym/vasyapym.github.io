# Passes — shell · realm creature prominence (quicknotes + waste-of-tokens)

Task: owner (2026-09-21): creatures blend into the star field — worst on
iOS Safari / mobile — make their lines ~20% bolder. Tiered plan agreed:
tier 1 (flat ×1.2 material) this session; tier 2 (mobile/DPR-specific
measures) deferred to a next session by owner instruction.

## Pass C001 — VERIFIED (tier 1 only)
- Objective and scope: quicknotes (NoteWebCreature) and waste-of-tokens
  (TokenPyreCreature) draw ×1.2 bolder (alpha and width) and ×1.2 brighter
  locator; nothing else moves (concepts, choreography, reduced-motion,
  other six species untouched).
- Acceptance criteria: prom field on base, overridden dot/seg in the two
  classes only; typecheck/build/probe green; before/after shots at
  1440×900@2x and 390×844@3x (greet + settled idle) captured.
- Changes (`realm-creatures.ts`):
  - base `Creature`: `protected prom = 1;`; base locator dot alpha × prom
    (clamped) — species-level presence for the shared aura dot.
  - NoteWebCreature + TokenPyreCreature: `this.prom = 1.2` in ctor;
    protected dot/seg overrides ride `size/width × prom`, `alpha × prom`
    (clamped ≤1). Applied AFTER the class's own rung quantization, so the
    5-rung discipline stays intact and the material bump is uniform.
- Baseline: typecheck/build green (R004 state); probe 169 checks green
  pre-change.
- Verification:
  - Command: `npm --prefix portfolio run typecheck` — PASS.
  - Command: `npm --prefix portfolio run build` — PASS.
  - Command: `CHROME_PATH=… node portfolio/shell/tests/realm-probe.mjs` —
    PASS (169 checks, exit 0).
  - Shots (probe `realm-prominence-shots.mjs`): baseline
    /tmp/opencode/prom/baseline, after /tmp/opencode/prom/after —
    mobile-quicknotes-idle pair read: web visibly brighter (notes with
    distinct glow, filaments more legible at 390×844@3x); greet frames
    brighter accordingly. Still quieter than the star field on mobile —
    honest tier-1 ceiling (see risks).
- Final diff review: one file + pass record; no debug scaffolding; no
  unrelated species touched; header comments note the owner directive.
- Design constraints: F001 (creature interaction round, owner-liked) —
  choreography untouched; F002/R003/R004 (quicknotes size/greet) untouched;
  hue purity law kept (white-mix clamp ≤0.38 unchanged — material bump only).
- Remaining risks/blockers:
  - On mobile (390×844@3x) the ×1.2 helps but the creature still reads
    quieter than the interact-radius ring (scene-level ochre ring, brighter
    than the web) and the dense crisp star field — tier-2 candidates
    (DPR/viewport-aware ink floor, ring/star contrast) deferred per owner.
  - Real iOS Safari not run (headless Chromium stands in); owner device
    verdict is the acceptance gate.
- Next action: task complete for tier 1; owner verdict decides whether
  tier 2 opens next session.

# Task brief — Quicknotes card mark: 10 original SVG concepts

You are a design-minded front-end engineer with strong taste. You have **no
access to any repository, conversation, or tools** — everything you need is in
this brief. You will produce 10 alternative SVG illustrations; another agent
will render them side-by-side, tune the winner, and paste it into the repo.

## 1. The product context

A personal portfolio's main menu shows 8 project cards on a near-black ink
field (`#0b1317`). Each card has one spot-ink SVG illustration — its "mark" —
centered in a dark artwork panel, rendered about 170–218px wide (marks are
designed in a 260×160 viewBox). The **Quicknotes** card's mark is being
redesigned. Card copy: "Fast markdown notes that live on-device and sync
through Firebase — [[wiki-links]], live preview, command palette, one-button
zip export." Mono caption under the artwork: "the scratch buffer".

What QuickNotes actually is: local-first markdown notes that live on-device,
synced through Firebase; `[[wiki-links]]` with live preview; a command
palette; folders with a collapsible tree; drag-and-drop; one-button zip
export; no build step, plain ES modules.

## 2. The current mark (being replaced — verbatim)

```svg
<svg viewBox="0 0 260 160">
  <defs>
    <pattern id="qn-bed" width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#465059" opacity=".5" />
    </pattern>
  </defs>
  <ellipse cx="130" cy="88" rx="115" ry="56" fill="url(#qn-bed)" opacity=".35" />
  <rect x="34" y="112" width="192" height="8" rx="4" fill="#465059" />
  <rect x="44" y="82" width="28" height="28" rx="5" fill="#26333b" stroke="#7b93b3" strokeWidth="1.5" />
  <rect x="80" y="82" width="28" height="28" rx="5" fill="#465059" stroke="#7b93b3" strokeWidth="1.5" />
  <rect x="116" y="82" width="28" height="28" rx="5" fill="#26333b" stroke="#b6ac95" strokeWidth="1.5" />
  <rect x="152" y="82" width="28" height="28" rx="5" fill="#7aa2f7" opacity=".9" />
  <rect x="188" y="46" width="28" height="28" rx="5" fill="none" stroke="#b6ac95" strokeWidth="2.5" strokeDasharray="6 5" />
  <rect x="197" y="86" width="9" height="9" rx="4.5" fill="#7b93b3" opacity=".7" />
</svg>
```

Why it fails: it commits to no gesture — a row of four rounded squares reads
as generic UI chrome, the plainest of the eight marks. It skips the house
palette, has no depth, no texture, no story.

## 3. The house language (what "organically consistent" means)

All eight marks share one spot-ink register. Flat vector, no gradients, no
filters, no text/letterforms, nothing photographic. The neutral ramp, used
from darkest to lightest:

- `#26333b` deep ink, `#465059` slate, `#7d7669` warm grey, `#b6ac95` bone,
  `#eeeae0` paper (rare, for a hero mass or highlight)

One accent spot ink per card — taken hues you must not collide with:
coral `#ff6a5f`, pink `#ff8fbf`, teal `#4fd1a5`, amber `#ffb347`,
violet `#a98cff`, sky `#5cc8ff`, rust `#c56b52`. Quicknotes' accent is
**blue `#7aa2f7`** — stay in the blue family (a slightly shifted blue is fine).

Recurring grammar devices (use several, not all, per mark):
- a **sparse halftone dot bed** — a large soft ellipse filled with a
  `userSpaceOnUse` dot pattern behind the subject;
- a **hover halo** — a second dot-pattern ellipse at low opacity
  (an ellipse with `class="gem-halo"`);
- **dashed strokes** mean "waiting / future / in-progress";
- **tiny white square glints** (1–3px rects, opacity .4–.6) as light hits;
- **stepped caps** — a shape layered 2–3 times, each layer offset a few px and
  one step lighter, reading as light on a bevel;
- **halftone overprints** — a shape's fill or cap replaced by the dot pattern;
- `clipPath` to keep texture inside a shape.

Each mark commits to ONE bold narrative gesture — a single readable moment,
not a diagram of everything. Examples of the bar: Cat Runner is one big cat
head with whisker spikes punching past its silhouette plus speed dashes;
Raft is a crowned leader flop cascading stage-by-stage into committed log
slates, the next stage dashed and empty; Explosion is a lantern disc mid-shatter
with a fan of solid shards. Composition is asymmetric, seated on an implied
ground, with generous air.

## 4. What to avoid (sibling collisions + clichés)

- Rounded-square rows/slats/columns (the mark being replaced; also echoes the
  neighbouring Spine card's dragged square).
- Spine's snap grammar: corner bracket + tilted square + cursor arrow.
- Pigeonhole grids (another card owns the occupancy-wall grammar).
- Cat head, burst-of-shards, election cascade, tree landscape, nested arcs —
  the other marks' subjects.
- Generic note-app clichés executed the obvious way: plain notepad with
  pencil, sticky note with a folded corner, bare document sheet with text
  lines — unless your execution is genuinely fresh.
- Scope creep: no scene with five-plus subjects, no confetti scatter.

## 5. Technical constraints (every concept)

- One standalone `<svg viewBox="0 0 260 160">` — complete and renderable in a
  browser as-is; no CSS, no scripts, no external references, no `<text>`.
- Flat fills and strokes only; `pattern`/`clipPath` allowed but every `id`
  must start with `qn-` (ids are page-global).
- Think in the full 260×160 box, keep ~8px clear of the edges, and make it
  legible at 150px wide — if a detail dies at card scale, drop it.
- Roughly 12–35 elements. Layered fills over strokes for mass; strokes for
  hairlines.
- Accent blue `#7aa2f7` should appear on ONE protagonist element, not sprayed.

## 6. Expected output format

Exactly ten concepts, numbered 1–10, in this exact shape — nothing else, no
closing commentary:

## 1 · two-word-name
One sentence: the gesture and what carries it.
```svg
<svg viewBox="0 0 260 160">…</svg>
```

Vary the metaphors across the ten (e.g. writing flow, the wiki-link graph,
the command palette, folders, sync, scratch/buffer, versioning) — all ten
should not be the same idea restyled. Every concept must still commit to one
gesture in the house register.

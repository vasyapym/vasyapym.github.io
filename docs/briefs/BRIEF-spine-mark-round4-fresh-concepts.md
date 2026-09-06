# Work Package — Spine card mark: 5 FRESH-CONCEPT candidates (round 4)

You are designing five alternative SVG illustrations for one card in a dark-portfolio grid. NO repo access — everything is below. ONE response, all deliverables, exact output format at the end.

## What exists (the thing to beat — and move AWAY from)

Spine is a Flexbox/Grid layout editor (drag/nest containers, retune flex/grid, export HTML/CSS). Its card mark went through three rounds: (1) a resting arrangement — rejected as boring; (2) an item corkscrew-diving into a drop slot — liked but "not senior"; (3) the current winner, an item *placed* along an L-shaped dotted trace into a crosshair slot.

**The user's verdict now:** the current mark is liked, but concept-wise it is still the same idea as rounds 1–3 — *an item travelling into a slot*. This round must deliver **5 fresh CONCEPTS**, not better stagings of "travel to slot". The "travel/trajectory/trace" axis is used up — do not reuse it (no arcs, no traces, no dives, no gantries, no falling).

## Hard frame (owner-approved, every candidate)

- **Instant at-a-glance reading: nested layout boxes / a layout system.**
- A **dashed drop-target** motif participates in the story (dashed = "empty/not yet placed"; it echoes the app's real UI).
- **No face, no eyes, no physiognomy** — character through posture/motion/geometry only.
- **Senior register** (the owner's phrase): planned, precise, disciplined — engineering vocabulary, not playful bounce. Orthogonal geometry is the house register; blueprints, dimension ticks, crosshairs, registration brackets are welcome garnish (optional, ≤2 furniture items each, never load-bearing).
- **Palette FIXED** (owner picked it deliberately): accent **ochre `#d39b61`**, dark companion **`#7a5230`**, family neutrals `#26333b` `#465059` `#7d7669` `#b6ac95` `#eeeae0` (paper), nested fill `#1c262d` allowed. Do not propose other hues.
- Static SVG; a subtle halo pulse is wired in CSS later (not your concern).

## Stage & technique

- viewBox **0 0 260 160**, composition centered ~(130, 80), `aria-hidden`, **no text inside the art**; renders on a 200px dark stage (`#0b1317`), must stay legible at 150px height (no sub-2px detail reliance).
- All cards share ONE DOM: every `<defs>` id **must be prefixed per candidate**: `gem-spine-a-*` … `gem-spine-e-*`.
- Keep one `halo` ellipse with `className="gem-halo"` + `style={haloVar(0.12)}` + `opacity={0.12}` (functional hover hook; hue = ochre).
- Family texture conventions (use as needed, not mandatory everywhere): halftone dot patterns — `patternUnits="userSpaceOnUse"` dense 7×7 accent `r=1.9`, sparse 11×11 neutral `r=1.6`; stepped neutrals for depth; one tiny white glint (`<rect fill="#fff" opacity="0.4–0.6"`, ~2–5px); thick strokes 2.5–3, hairlines 1–1.5; dashed strokes `1.5` with `strokeDasharray="4 4"`.
- ≤~35 elements, generous negative space. No gradients — flat spot-ink style only.

## The current mark (to beat — conceptually move away from it)

```tsx
function SpineCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-spine-dense" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#d39b61" /></pattern>
        <pattern id="gem-spine-sparse" patternUnits="userSpaceOnUse" width="11" height="11"><circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" /></pattern>
        <pattern id="gem-spine-halo" patternUnits="userSpaceOnUse" width="7" height="7"><circle cx="3.5" cy="3.5" r="1.9" fill="#d39b61" /></pattern>
      </defs>
      <ellipse cx="130" cy="80" rx="104" ry="64" fill="url(#gem-spine-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" cx="130" cy="80" rx="58" ry="42" fill="url(#gem-spine-halo)" style={haloVar(0.12)} opacity={0.12} />
      <rect x="40" y="86" width="150" height="32" rx="3" fill="#26333b" stroke="#b6ac95" strokeWidth="3" />
      <rect x="46" y="93" width="24" height="18" rx="2" fill="#465059" stroke="#b6ac95" strokeWidth="2" />
      <rect x="78" y="90" width="54" height="24" rx="2" fill="#1c262d" stroke="#b6ac95" strokeWidth="2" />
      <rect x="84" y="94" width="20" height="6" rx="1" fill="#7d7669" />
      <rect x="84" y="104" width="14" height="6" rx="1" fill="#7d7669" />
      <rect x="146" y="92" width="34" height="20" rx="2" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="163" y1="95" x2="163" y2="109" stroke="#d39b61" strokeWidth="1.5" />
      <line x1="156" y1="102" x2="170" y2="102" stroke="#d39b61" strokeWidth="1.5" />
      <path d="M114 47 H147 Q163 47 163 63 V88" fill="none" stroke="#7a5230" strokeWidth="2" strokeDasharray="2 5" />
      <line x1="124" y1="44" x2="124" y2="51" stroke="#7a5230" strokeWidth="1.5" opacity="0.7" />
      <line x1="136" y1="44" x2="136" y2="51" stroke="#7a5230" strokeWidth="1.5" opacity="0.5" />
      <g transform="rotate(10 100 40)">
        <rect x="79" y="29" width="42" height="22" rx="2" fill="url(#gem-spine-dense)" stroke="#7a5230" strokeWidth="2.5" />
        <circle cx="100" cy="40" r="2" fill="#eeeae0" />
      </g>
      <rect x="85" y="32" width="5" height="2" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
```

Sibling-register calibration (what "senior" beat): a coral mark recounts a consensus cascade stage-by-stage; a kitty mark is a paper-white character dominating the stage with one pink signifier. Marks are hand-authored spot-ink drawings — $200 feeling, not clip-art.

## The five candidates (five DIFFERENT concepts)

**A · Vertebrae.** The project is called Spine — earn the name: a vertical stack of abstract vertebrae (stacked structural blocks, each narrower/wider in a controlled rhythm, maybe one "inverted" showing stress), the accent vertebra sliding into its slot in the stack along an alignment rail. Anatomical read, abstracted to pure boxes. The dashed target = the empty vertebral slot.

**B · Floor plan.** Architectural plan view: an outer wall as the container, interior partitions subdividing rooms; one room still dashed/undrawn while a room fill (halftone) is being committed next to it; dimension ticks on one side. The layout engine as drafting a floor plan.

**C · The Split.** One box caught mid-subdivision: a seam line splitting it into a two-column container, the right half already furnished (mini items), the left half dashed — the exact frame where `flex-direction: row` is born. The seam is the drama; furniture may include one dimension tick across the halves.

**D · Reorder.** Two siblings mid-swap along the main axis — the accent item transposed above/behind the row's baseline while its target slot waits dashed; everything else orthogonal. The visible story of drag-reorder / the `order` property.

**E · Wild card.** Any concept keeping the frame. Think: a grid template solidifying cell-by-cell (dashed cells → filled, one accent cell mid-turn), scaffolding around a growing structure, a brick-bond wall of boxes, a "table of contents" assembling — your call. This one exists to swing.

## Output format (exactly)

```
## Candidates
### A · Vertebrae — "<name>"
<2 sentences: the story, why it reads senior, what makes it a CONCEPT (not a staging)>

### FILE: (component A)
<complete TSX function SpineMarkVertebrae() { ... } with a family-style one-sentence comment header>

### B · Floor plan — "<name>" → SpineMarkPlan()
... C → SpineMarkSplit(), D → SpineMarkReorder(), E → SpineMarkWild() ...
```

Rules: ids prefixed per candidate; each candidate includes the gem-halo ellipse; no gradients; no text; no travel/trace/trajectory language anywhere — the concept must not be about an object moving along a path to its target.

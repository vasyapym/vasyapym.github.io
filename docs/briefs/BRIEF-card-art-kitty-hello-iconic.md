# BRIEF — Redraw "Cat Runner" card mark as polished Hello-Kitty-iconic geometry

Round context: owner approved the page and the Spot-Colour Overprint card family; this round reworks four marks. This brief covers Cat Runner only. Delegated to the chat model (no repo access). Output integrates into `portfolio/shell/src/shell/ProjectArtwork.tsx` as `KittyCenterMark`.

---

## TASK

You are designing ONE SVG illustration for a senior developer's portfolio landing page. You have no repo access; everything you need is below.

## Page context

Dark editorial "ink catalogue": plate `#0b1317` card background, quiet neutral ramp, IBM Plex mono/sans lowercase, hairlines, film grain. Project cards each carry a `260 × 160` SVG "mark" (renders ~213–260px wide) in one shared family language called **Spot-Colour Overprint**: neutral ink dominates; each card keeps ONE identity hue as a confined second ink — halftone dot screens + small focal fills, ≤3 hue groups, ≤~15% coverage. Six marks must read as one printed family. Audience: serious technical/product — the bar is "polished, professional, designed", never "cute clip-art". This card's hue is PINK. Card subject: "Cat Runner — a pastel endless runner with a bullet-time dash, a ghost of your best run, and a soundtrack that plays along."

## Why the current mark fails (must not repeat)

The current cat reads as a child's drawing because of: chibi proportions (big head rx34 floating over a tiny rx22 body), oversized close-set oval eyes, thick whiskers, scratchy diagonal speed bars, a floating pink halftone "ghost" far off to the upper-left, and stray dot pairs on the body (meant as paws, reading as glitch). Diagnosis: the failures are proportion discipline and detail hygiene — NOT the subject. Do not abstract or infantilize the subject further; fix the geometry.

## Direction (owner-approved): iconic Hello-Kitty-style geometry, runner context

Redraw the cat with the precise, minimal geometry of the iconic Sanrio Hello Kitty face (owner explicitly asked for Hello Kitty resemblance; a past "no girly" verdict is superseded — but execution must stay disciplined and professional). What makes that face read "designed", and what you must reproduce:

1. **HEAD**: very wide, rounded, WIDER than tall (~1.4:1), dominating the composition, generous empty face space. Two SMALL triangular ears placed wide apart, apexes up with slight outward lean; ear bases buried in the head silhouette (no visible seams — same fill, overlapping shapes). NO inner-ear detail.
2. **EYES**: two SMALL solid-ink vertical ovals, WIDE-SET on exactly the same horizontal line, at the outer thirds of the face. This wide-set spacing is the single most important proportion fix.
3. **NOSE**: tiny flat oval, centred exactly between the eyes, slightly below the eye line. PINK (this card's spot hue).
4. **NO MOUTH.** The blank face is iconic — do not add one.
5. **WHISKERS**: exactly three per side, perfectly straight thin lines fanning slightly (±3–4°), crisp — not wavy, not thick.
6. **BOW**: the Hello Kitty signature — sits at the top-right of the head over the right ear base: two rounded-triangle loops + small centre knot. Deep-pink fills, one loop carrying a pink halftone overprint cap. Deliberate, owner-delegated addition; keep it small and precise.
7. Flat fills and stepped caps only — NO cartoon outline strokes; silhouettes read by fill contrast against the dark plate.

Runner context (keep the project's meaning):

- The cat moves RIGHT: compact small body under the wide head, slight forward lean, two stubby legs mid-stride, one thin curved tail. Body/legs/tail stay neutral paper.
- **"Ghost of your best run"**: ONE pink halftone SILHOUETTE echo of the cat (simplified — 3–4 shapes total: head-with-ears blob + body blob, NOT a full detailed copy), close behind-left, grounded on the same ground line (not floating), low opacity ~0.12–0.16.
- Speed: 3–4 ordered HORIZONTAL neutral dashes behind the cat, descending lengths, consistent 5–6px height, evenly spaced — an intentional rhythm, NOT scattered diagonal bars.
- Ground: one clean neutral curve under everything.

## Geometry anchors (start from these; refine numbers if needed, but keep proportions and layout)

- Head: ellipse cx 152 cy 72 rx 50 ry 36 (base `#eeeae0`; underside volume cap `#b6ac95` clipped inside, offset down ~8px).
- Ears: small triangles on the head's top edge: bases around (118,45) and (186,45), apexes ~(108,18) and (198,20), fill `#f4efe4` (same family as head so seams vanish).
- Bow: centred ~ (190,36), loops ~13×11 each, knot r≈4.
- Eyes: (126,78) and (178,78) — wide-set, rx 3 ry 4.5, fill `#26333b`.
- Nose: (152,90), rx 3.2 ry 2.4, fill `#ff8fbf`.
- Whiskers: three per side from x≈116→94 and x≈188→210 at y 72/80/88, straight, stroke `#26333b` width 1.6, round caps, opacity 0.8.
- Body: compact ellipse ~cx 146 cy 120 rx 15 ry 10, base `#eeeae0` + `#b6ac95` underside cap; two stubby rounded legs mid-stride reaching the ground; thin curved tail from the body's left curling up-left, stroke `#f4efe4` width 5 round cap.
- Ground: `M 56 134 Q 150 124 244 132`, stroke `#465059` width 5, round cap, opacity 0.5.
- Ghost silhouette: group translate(-48,-2) scale(0.94), simplified shapes, fill `url(#gem-cat-dense)`, opacity 0.14.
- Speed dashes: rounded rects at y ≈ 100/110/120 behind the cat (right edges stepping toward the cat's back), widths ~34/26/18, height 5–6, fill `#7d7669`, opacity 0.4.

## Palette (exhaustive — no other colours, NO ochre)

- NEUTRAL RAMP: `#26333b`, `#465059`, `#7d7669`, `#b6ac95`
- PAPER (cat fills): `#eeeae0`, `#f4efe4` (+ white `#ffffff` glints)
- PINK (this card's only hue): `#ff8fbf` (halftone dots + nose), deep `#a33a72` (bow fills), cap `#ffe1ef`
- Plate behind the mark: `#0b1317`

## Hard technique rules

- Pure SVG primitives (rect/circle/ellipse/polygon/path/line); NO text, NO filters, NO gradients.
- Halftone patterns defined once in `<defs>`:
  - `gem-cat-dense`: patternUnits="userSpaceOnUse" width 7 height 7, circle cx 3.5 cy 3.5 r 1.9 fill `#ff8fbf`
  - `gem-cat-sparse`: width 11 height 11, circle cx 5.5 cy 5.5 r 1.6 fill `#7d7669`
  - `gem-cat-halo`: width 7 height 7, circle cx 3.5 cy 3.5 r 1.9 fill `#7d7669` (neutral halo — keep)
- Halo contract (hover hook, do not alter): exactly one ellipse `className="gem-halo"` `style={haloVar(0.12)}` rx≈62 ry≈40 `fill="url(#gem-cat-halo)"` opacity 0.12. `haloVar` is an existing module-scope helper — just call `haloVar(0.12)`.
- Stepped volume caps via `<clipPath>` clipping a lighter/darker shape inside a base shape. Never gradients.
- Wide sparse backdrop ellipse (`fill="url(#gem-cat-sparse)"` opacity 0.09, ~rx 104 ry 62) behind everything.
- 1–2 tiny white square glints max.
- Budget ~10–25 elements (whiskers/legs/dashes count as groups).
- Legible at 213px wide: no detail thinner than ~1.4px stroke or ~3px shape, except whiskers/glints.
- All ids prefixed `gem-cat-`.
- React/TSX: output ONLY the component function — no imports, no props, no hooks.

## Self-check before answering

- Eyes on the same y; wide-set (±26 from face centre); small (≤4.5 ry).
- Head width ≈ 1.4× height; head clearly dominates; ears small, wide apart, no inner detail.
- No mouth anywhere. Whiskers straight, thin, 3 per side.
- Bow overlaps the right ear base; small; deep pink; one halftone loop.
- Ghost grounded (shares the ground line), close behind, simplified silhouette.
- Dashes horizontal, ordered, evenly spaced. No diagonal scratch bars.
- No stray dot pairs anywhere. Exactly one `gem-halo` ellipse.

## Current code (for conventions only — replace fully)

```tsx
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff8fbf" />
        </pattern>
        <pattern id="gem-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-cat-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#7d7669" />
        </pattern>
        <clipPath id="gem-cat-head"><ellipse cx="150" cy="70" rx="34" ry="28" /></clipPath>
        <clipPath id="gem-cat-body"><ellipse cx="150" cy="112" rx="22" ry="15" /></clipPath>
        <clipPath id="gem-cat-earL"><polygon points="130,49 122,26 142,45" /></clipPath>
        <clipPath id="gem-cat-earR"><polygon points="160,48 178,26 176,54" /></clipPath>
      </defs>
      <ellipse cx="140" cy="80" rx="104" ry="62" fill="url(#gem-cat-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="150" cy="80" rx="62" ry="40" fill="url(#gem-cat-halo)" opacity="0.12" />
      <g opacity="0.16" transform="translate(-70 -20) scale(0.82)">
        <ellipse cx="150" cy="70" rx="34" ry="28" fill="url(#gem-cat-dense)" />
        <polygon points="130,49 122,26 142,45" fill="url(#gem-cat-dense)" />
        <polygon points="160,48 178,26 176,54" fill="url(#gem-cat-dense)" />
        <ellipse cx="150" cy="112" rx="22" ry="15" fill="url(#gem-cat-dense)" />
      </g>
      <g opacity="0.45">
        <rect x="86" y="104" width="28" height="7" rx="3.5" fill="url(#gem-cat-dense)" />
        <rect x="76" y="114" width="34" height="7" rx="3.5" fill="url(#gem-cat-dense)" />
        <rect x="90" y="124" width="22" height="7" rx="3.5" fill="url(#gem-cat-dense)" />
      </g>
      <path d="M 60 138 Q 150 128 240 136" stroke="#465059" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.4" />
      <ellipse cx="150" cy="134" rx="44" ry="6" fill="url(#gem-cat-dense)" opacity="0.4" />
      <ellipse cx="150" cy="112" rx="22" ry="15" fill="#b6ac95" />
      <g clipPath="url(#gem-cat-body)">
        <ellipse cx="148" cy="110" rx="19" ry="12" fill="#f4efe4" />
        <ellipse cx="144" cy="107" rx="9" ry="6" fill="#eeeae0" />
      </g>
      <polygon points="130,49 122,26 142,45" fill="#f4efe4" />
      <polygon points="160,48 178,26 176,54" fill="#f4efe4" />
      <ellipse cx="150" cy="70" rx="34" ry="28" fill="#b6ac95" />
      <g clipPath="url(#gem-cat-head)">
        <ellipse cx="148" cy="68" rx="31" ry="25" fill="#f4efe4" />
        <ellipse cx="142" cy="62" rx="16" ry="12" fill="#eeeae0" />
      </g>
      <polygon points="131,46 126,33 138,44" fill="#26333b" opacity="0.85" />
      <polygon points="163,47 173,34 171,50" fill="#26333b" opacity="0.85" />
      <g clipPath="url(#gem-cat-earL)"><rect x="118" y="24" width="28" height="17" fill="url(#gem-cat-dense)" opacity="0.6" /></g>
      <g clipPath="url(#gem-cat-earR)"><rect x="156" y="24" width="26" height="18" fill="url(#gem-cat-dense)" opacity="0.6" /></g>
      <ellipse cx="143" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="157" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="138" cy="72" rx="3.4" ry="5" fill="#26333b" />
      <ellipse cx="162" cy="72" rx="3.4" ry="5" fill="#26333b" />
      <ellipse cx="150" cy="82" rx="4" ry="3" fill="#ff8fbf" />
      <g stroke="#26333b" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
        <line x1="124" y1="74" x2="104" y2="70" />
        <line x1="124" y1="79" x2="102" y2="80" />
        <line x1="124" y1="84" x2="106" y2="90" />
        <line x1="176" y1="74" x2="196" y2="70" />
        <line x1="176" y1="79" x2="198" y2="80" />
        <line x1="176" y1="84" x2="194" y2="90" />
      </g>
      <rect x="140" y="60" width="3.4" height="3.4" fill="#ffffff" opacity="0.6" />
      <rect x="140" y="104" width="2.8" height="2.8" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}
```

## Output format

1. One ```tsx block containing the complete replacement: `function KittyCenterMark() { ... }`.
2. Then ≤4 sentences stating: (a) the pink groups used and rough coverage %, (b) halo colour choice, (c) any deviation from the geometry anchors and why.

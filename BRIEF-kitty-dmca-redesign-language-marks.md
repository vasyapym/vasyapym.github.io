# BRIEF — Cat Runner DMCA-safe redesign, part 1 of 2: shared design language + the two flat SVG marks

You are a design-minded front-end engineer and character designer. You have **no access to the repository or any prior conversation** — everything you need is in this brief. Your output will be pasted into the repo verbatim by an integrating agent, then typechecked and visually verified.

**You have full design and code autonomy.** No per-decision approvals are needed; make every choice yourself. What we ask in return is that your reasoning is shown (see §6) — we want depth, not speed.

---

## 1. The problem

A personal portfolio site includes a game project, "Cat Runner" — a pastel endless runner. Its mascot is currently a white cat that, unintentionally, reads as **Hello Kitty** (Sanrio). The owner is worried about a DMCA takedown taking down their GitHub Pages site.

Sanrio's Hello Kitty trade dress is a *combination* of features (no single feature is protectable, but the combination is):

- white/cream cat, head much wider than tall, flat-ish crown
- small pointed triangular ears
- exactly three whiskers per side
- small yellow oval nose, centered
- **no mouth, ever**
- a bow worn over one ear
- small black vertical oval eyes, wide-set

The current design hits **every one** of these. Your job: break the combination decisively while keeping the character lovable.

## 2. The constraint that makes this hard

**The owner loves the current design.** The redesign must keep the character's overall form, silhouette, and general layout — big wide head, small ears, compact body, the same pose energy — so it still feels familiar, cute, and lovable. What changes is the *detail layer*: facial features, accessory, colors, small original details that make the character unmistakably its own.

Think "same cat, different cat": someone who liked the old design should still recognize it; someone looking for Hello Kitty should not find it.

## 3. What you are redesigning in this brief (part 1 of 2)

Two flat SVG surfaces. A second brief (not yours) will apply your design language to the in-game 3D rig — see §5.

### 3.1 The landing-card mark — `KittyCenterMark`

One inline-SVG illustration inside the "Cat Runner" card on the portfolio landing page. Card art stage: dark plate `#0b1317`, "printed halftone" family — dot-screen `<pattern>` fills, stepped tone fills, no smooth gradients, no filters, no text. It idles with a tiny CSS breathe (±3px bob) — nothing may break under that. It must read instantly at ~213px wide.

Current code (verbatim — evolve or restart, your call):

```tsx
/* ── 2 · Cat Runner — pink spot ink, Hello-Kitty head mark in motion ── */
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
        <clipPath id="gem-cat-head-clip">
          <ellipse cx="136" cy="76" rx="40" ry="30" />
        </clipPath>
      </defs>
      {/* wide sparse neutral backdrop field */}
      <ellipse cx="136" cy="78" rx="104" ry="62" fill="url(#gem-cat-sparse)" opacity="0.09" />
      {/* single neutral halo */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="136" cy="78" rx="62" ry="40" fill="url(#gem-cat-halo)" opacity="0.12" />
      {/* ordered horizontal speed dashes */}
      <rect x="26" y="72" width="40" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      <rect x="26" y="84" width="30" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      <rect x="26" y="96" width="20" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      {/* one clean ground curve */}
      <path d="M 46 120 Q 140 112 236 118" stroke="#465059" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* bullet-time dash trail on the ground */}
      <rect x="100" y="114" width="60" height="5" rx="2.5" fill="url(#gem-cat-dense)" opacity="0.45" />
      {/* pink halftone ghost echo — head-only, close behind-left */}
      <g transform="translate(-40 4) scale(0.94)" opacity="0.14">
        <ellipse cx="136" cy="76" rx="40" ry="30" fill="url(#gem-cat-dense)" />
        <polygon points="106,62 94,38 122,54" fill="url(#gem-cat-dense)" />
        <polygon points="166,62 178,38 150,54" fill="url(#gem-cat-dense)" />
      </g>
      {/* ears (bases buried, painted before head) */}
      <polygon points="106,62 94,38 122,54" fill="#f4efe4" />
      <polygon points="166,62 178,38 150,54" fill="#f4efe4" />
      {/* head dominates — the whole mark */}
      <ellipse cx="136" cy="76" rx="40" ry="30" fill="#eeeae0" />
      <g clipPath="url(#gem-cat-head-clip)">
        <ellipse cx="136" cy="90" rx="40" ry="30" fill="#b6ac95" />
      </g>
      {/* whisker spikes — paper, punching past the head edge */}
      <path d="M 100 68 L 78 64" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 76 L 76 76" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 84 L 78 88" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 68 L 194 64" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 76 L 196 76" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 84 L 194 88" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      {/* negative-space eyes, wide-set on one line */}
      <ellipse cx="118" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      <ellipse cx="154" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      {/* bow — the single pink signifier, overlapping right ear base */}
      <ellipse cx="164" cy="54" rx="6" ry="5" fill="#ff8fbf" />
      <ellipse cx="176" cy="54" rx="6" ry="5" fill="#ff8fbf" />
      <circle cx="170" cy="55" r="3.2" fill="#a33a72" />
      {/* single tiny glint */}
      <rect x="122" y="58" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
```

(`haloVar` is a module-level helper that already exists — use it exactly as shown, do not import anything.)

**Hard constraints for this mark:**

- Function name stays `KittyCenterMark`; `viewBox="0 0 260 160"`; `aria-hidden="true"`; React/TSX, no props, no hooks, no imports.
- Keep the ids `gem-cat-dense`, `gem-cat-sparse`, `gem-cat-halo`, `gem-cat-head-clip` (they are unique page-wide; other cards use `gem-fox-*` etc.). You may repoint what they contain, but keep the names and count.
- Exactly one `.gem-halo` ellipse with `style={haloVar(0.12)}` (a hover hook wired elsewhere).
- Flat fills + dot patterns only; no filters, no text, no new gradient defs.
- Element budget similar to current (~30 shapes); must read at ~213px.
- The card's pink identity (`#ff8fbf` family) may stay as the card's hue — pink itself is not the problem — but the *subject* must not read as Hello Kitty.

### 3.2 The character-select portrait — `KittyPortrait`

A flat-vector poster shown on the game's character-select card. It is drawn in outline style: the whole svg carries `stroke` + `strokeWidth={3}` and each shape fills itself; fine details set `stroke="none"`.

Current code (verbatim — evolve or restart, your call):

```tsx
export function KittyPortrait() {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={OUTLINE_PASTEL}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* white shirt under the pink pinafore; the head overlaps it (no neck) */}
      <path d="M24 84 C24 71 36 64 50 64 C64 64 76 71 76 84 L78 100 L22 100 Z" fill="#ffffff" />
      <path d="M36 64 L41 64 L41 74 L59 74 L59 64 L64 64 L64 74 L70 74 L76 100 L24 100 L30 74 L36 74 Z" fill="#f6a9c0" />

      {/* stubby arms, outward-down from shoulder level */}
      <ellipse cx="23" cy="78" rx="9" ry="4.8" transform="rotate(38 23 78)" fill="#ffffff" />
      <ellipse cx="77" cy="78" rx="9" ry="4.8" transform="rotate(-38 77 78)" fill="#ffffff" />

      {/* head 75×50 (1.5:1), fullest at the cheeks, flat crown, soft flat chin */}
      <path d="M12.5 46 C12.5 30 26 18 50 18 C74 18 87.5 30 87.5 46 C87.5 60 70 68 50 68 C30 68 12.5 60 12.5 46 Z" fill="#ffffff" />

      {/* ears: open paths (no base line) drawn over the crown so the head stroke hides under them */}
      <path d="M21.5 27.5 L25 14 Q26.5 11 29 13.5 L37.5 20.5" fill="#ffffff" />
      <path d="M78.5 27.5 L75 14 Q73.5 11 71 13.5 L62.5 20.5" fill="#ffffff" />

      {/* the bow: upper-right ear, ~40% of head width */}
      <path d="M67 22 C61 12 51 15 54.5 22 C51 29 61 32 67 22 Z" fill="#e94f64" />
      <path d="M69 22 C75 12 85 15 81.5 22 C85 29 75 32 69 22 Z" fill="#e94f64" />
      <ellipse cx="68" cy="22" rx="3.6" ry="4.4" fill="#d13a50" />

      {/* face in the lower half: small vertical eyes, small ochre nose, NO mouth */}
      <ellipse cx="34" cy="49" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="66" cy="49" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="50" cy="50.5" rx="2.6" ry="1.9" fill="#ffd44d" stroke="none" />

      {/* whiskers: three per side, eye level, slightly fanned */}
      <path d="M27 45 L3 40.5 M27 49 L2 49 M27 53 L3 57.5" strokeWidth={2} />
      <path d="M73 45 L97 40.5 M73 49 L98 49 M73 53 L97 57.5" strokeWidth={2} />
    </svg>
  );
}
```

**Hard constraints for this portrait:**

- Function name stays `KittyPortrait`; `viewBox="0 0 100 100"`; same svg attributes (`role`, `aria-hidden`, `focusable`, `fill="none"`, `stroke={OUTLINE_PASTEL}`, `strokeWidth={3}`, round joins/caps). `OUTLINE_PASTEL` (`#3a3142`) is a module-level constant that already exists.
- Colours stay hardcoded (each portrait is a poster of its own character, not of the active theme).
- The sibling `KnightPortrait` (an ashen knight in a great helm) is **not yours and must not appear in your output**.
- The poster composition family may stay (head + body + arms + face, portrait bust), but the character's details must follow your new design language.

## 4. The differentiator toolbox (examples — you choose, you may invent better)

Individually generic features are safe; the Hello-Kitty *combination* is the risk. Candidates seen in original cat characters: a visible mouth (Hello Kitty famously has none — a small smile is the single strongest differentiator); a different nose (colour and shape); round eyes with catchlights instead of bare vertical ovals; replacing the ear bow with another accessory (bandana, scarf, goggles, flower, hood, backpack strap…); inner-ear colour; fur markings (patches, stripes, tail tip); eyebrows or brow marks; changed whisker treatment (count, thickness, curvature, or none); body outfit change. Whiskers themselves are fine to keep — but then more of the other features must move.

## 5. The design language must be rig-ready

The second brief will rebuild the in-game playable cat (a flat-vector three.js rig) from your language. That rig:

- is built from flat coloured shapes with ink outlines — no gradients, no textures;
- colours come from a fixed palette with roles: base coat, outline ink, one red-family accent + its deep step, one pink-family clothing colour + its deep step, a yellow (currently the nose), a cheek blush, an eye ink.

So your design language spec (§6) must list every feature with **both** its hex values and its palette role, and every feature must be expressible as flat vector shapes with a clear silhouette. Features that only work in 2D illustration (complex gradients, tiny detail) will not survive the rig — design for the rig.

## 6. Required working method — show your reasoning

State.md protocol for this project: briefs grant you full autonomy, and in exchange the response shows a **deep-reasoning chain**:

1. **Restate** the problem in your own words (brief, 2–3 sentences).
2. **≥5 distinct directions** for the character's differentiating identity — one line each, genuinely different (not five flavours of one idea).
3. **Prune with explicit criteria** (e.g. charm preservation, silhouette familiarity, rig-translatability, distinctiveness from Sanrio at a glance, how few features must change).
4. **Develop the top 1–2 directions to depth** — the actual feature decisions (head, ears, eyes, nose, mouth, accessory, colours, body) with hexes and palette roles.
5. **Stress-test**: check your winner against the Sanrio feature list in §1 feature by feature; check it at 213px and 100px; check it survives a ±3px bob; check the two surfaces still read as the same character.
6. **Rank and commit** to the final direction.

Keep the chain compact but real — we would rather read a tight 40-line chain than a 4-line one.

## 7. Expected output format

A single markdown document with exactly these sections:

1. `## Reasoning chain` — the §6 chain.
2. `## Design language` — the final character spec: every feature, its shape, its hex, its palette role. This section is copied verbatim into the part-2 brief, so write it for an engineer who has not seen your reasoning.
3. `### KittyCenterMark` — one fenced ```tsx block with the complete replacement function (no ellipses, no diffs).
4. `### KittyPortrait` — one fenced ```tsx block with the complete replacement function (no ellipses, no diffs).
5. `## Integration notes` — ≤5 bullets: what to eyeball in the dev server, any risk you want the integrator to double-check.

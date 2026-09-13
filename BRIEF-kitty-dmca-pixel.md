# BRIEF — Cat Runner: re-skin all three surfaces to "Pixel Kitty" (variant #2)

You are a design-minded front-end engineer. You have no repo access; this brief is self-contained. Your output will be integrated by an agent, then typechecked and visually reviewed. Full design/code autonomy within the stated contracts.

## Context

A portfolio game's cat mascot was just redesigned away from a Hello-Kitty read using a "Pop Kitty" language (star clip, w-mouth, catchlights, red nose). The owner reviewed it: **"this is fine but is not it"** — acceptable, but not the character they want. They are now steering to variant #2 from the same five-variant round:

**Pixel Kitty** — 12×10 grid, chunky 1-cell outline, CRT scanline shading, tiny bell instead of bow. Palette from that round: ink `#2A1B3D`, fill `#F7E8FF`, accent `#FFD23F`, highlight `#FFFFFF`, shadow `#9A6FBF`, bg `#3B2A5E`.

Your job: carry that pixel identity across three surfaces — the two flat SVG marks below (deliverable A) AND a design-language delta for the 3D rig (deliverable B). Same character on all three.

## Deliverable A — two flat SVG functions

### A1. `KittyCenterMark` — landing-card mark

Current (Pop Kitty, verbatim). Card stage: dark plate `#0b1317`, halftone dot family, stepped tones, no gradients, no filters, no text; must read at ~213px; idles with a ±3px CSS breathe.

```tsx
/* ── 2 · Cat Runner — pop-ink cat: star clip, w-mouth, catchlight eyes ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#e94f64" />
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
      {/* pop halftone ghost echo — head-only, close behind-left */}
      <g transform="translate(-40 4) scale(0.94)" opacity="0.14">
        <ellipse cx="136" cy="76" rx="40" ry="30" fill="url(#gem-cat-dense)" />
        <polygon points="106,62 94,38 122,54" fill="url(#gem-cat-dense)" />
        <polygon points="166,62 178,38 150,54" fill="url(#gem-cat-dense)" />
      </g>
      {/* ears (bases buried, painted before head) */}
      <polygon points="106,62 94,38 122,54" fill="#fff6ee" />
      <polygon points="166,62 178,38 150,54" fill="#fff6ee" />
      {/* head dominates — warm cream, flat comic fill */}
      <ellipse cx="136" cy="76" rx="40" ry="30" fill="#fff6ee" />
      <g clipPath="url(#gem-cat-head-clip)">
        <ellipse cx="136" cy="90" rx="40" ry="30" fill="#f1b9c5" />
      </g>
      {/* whisker spikes — paper, punching past the head edge */}
      <path d="M 100 68 L 78 64" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 76 L 76 76" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 84 L 78 88" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 68 L 194 64" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 76 L 196 76" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 84 L 194 88" stroke="#f4efe4" strokeWidth="2.2" strokeLinecap="round" />
      {/* ink eyes, low and wide, each with a white catchlight speck */}
      <ellipse cx="118" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      <ellipse cx="154" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      <circle cx="119" cy="76.4" r="1" fill="#ffffff" />
      <circle cx="155" cy="76.4" r="1" fill="#ffffff" />
      {/* accent nose (was unmarked) */}
      <ellipse cx="136" cy="86" rx="3.4" ry="2.4" fill="#e94f64" />
      {/* the w mouth — the loudest differentiator */}
      <path d="M 130 92 Q 133 96 136 92.5 Q 139 96 142 92" fill="none" stroke="#3a3142" strokeWidth="2" strokeLinecap="round" />
      {/* star clip on the right ear — the bow is gone */}
      <polygon points="176,31 178.9,38 186.5,38.6 180.8,43.5 182.5,50.9 176,47 169.5,50.9 171.2,43.5 165.5,38.6 173.1,38" fill="#e94f64" />
      {/* single tiny glint */}
      <rect x="122" y="58" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
```

**Hard constraints:** function name stays `KittyCenterMark`; `viewBox="0 0 260 160"`; `aria-hidden="true"`; React/TSX, no props, no hooks, no imports; keep ids `gem-cat-dense`, `gem-cat-sparse`, `gem-cat-halo`, `gem-cat-head-clip` (contents may change); exactly one `.gem-halo` ellipse with `style={haloVar(0.12)}`; flat fills + dot patterns only, no gradients/filters; keep the composition family (backdrop field, halo, speed dashes, ground curve, dash trail, ghost echo behind-left, subject right-of-centre) — the cat itself becomes pixel-art.

### A2. `KittyPortrait` — character-select poster

Current (Pop Kitty, verbatim). Outline-poster style: svg-level `stroke`/`strokeWidth={3}`, shapes fill themselves, fine details `stroke="none"`.

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

      {/* the star clip: upper-right ear, where the bow used to sit */}
      <polygon
        points="71,11.5 72.5,14.9 76.2,15.3 73.5,17.8 74.2,21.4 71,19.6 67.8,21.4 68.5,17.8 65.8,15.3 69.5,14.9"
        fill="#e94f64"
        stroke="none"
      />

      {/* face in the lower half: catchlight eyes, red nose, small w mouth */}
      <ellipse cx="34" cy="49" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <ellipse cx="66" cy="49" rx="2.2" ry="3.4" fill={OUTLINE_PASTEL} stroke="none" />
      <circle cx="34.9" cy="47.6" r="0.9" fill="#ffffff" stroke="none" />
      <circle cx="66.9" cy="47.6" r="0.9" fill="#ffffff" stroke="none" />
      <ellipse cx="50" cy="50.5" rx="2.6" ry="1.9" fill="#e94f64" stroke="none" />
      <path d="M46 55 Q48 58 50 55.8 Q52 58 54 55" strokeWidth={2} />

      {/* whiskers: three per side, eye level, slightly fanned */}
      <path d="M27 45 L3 40.5 M27 49 L2 49 M27 53 L3 57.5" strokeWidth={2} />
      <path d="M73 45 L97 40.5 M73 49 L98 49 M73 53 L97 57.5" strokeWidth={2} />
    </svg>
  );
}
```

**Hard constraints:** function name stays `KittyPortrait`; `viewBox="0 0 100 100"`; same svg attributes (`role`, `aria-hidden`, `focusable`, `fill="none"`, `stroke={OUTLINE_PASTEL}`, `strokeWidth={3}`, round joins/caps); hardcoded colours; sibling `KnightPortrait` is not yours — do not output it.

For the portrait you may keep the outline-poster approach with pixel-flavoured features (stepped/blocky shapes, square-ish eyes, pixel bell), or go full pixel-grid (a `<path>` per pixel block or a compact set of rects on a 10×10-ish grid). Choose what reads better at ~100px and say why in one line.

## Deliverable B — rig design-language delta (spec, not code)

The in-game cat is a flat-vector three.js rig (shapes + ink outlines, no textures/gradients). Palette keys are frozen: `kittyWhite` (base coat), `outlineInk`, `bowRed` (accent), `bowDeep` (accent deep), `suitPink` (clothing), `suitDeep` (clothing deep), `noseYellow`, `cheek`, `eyeInk`. Give a compact spec the integrator can apply mechanically:

1. New hex for each key (pastel theme only — knight theme is separate).
2. How each Pop Kitty feature translates to pixel language on the rig: star clip → bell (shape, size in world units, where it hangs, what animates it — the rig has a `bowRef` group with bob+pulse animation that the bell should inherit); w-mouth → pixel mouth (keep/drop/reshape?); catchlights → square pixel specks?; whiskers → keep/drop?
3. One risk callout: what will NOT read at 55px head height in 3D flat shapes, and what to do instead.

## Expected output format

1. `### KittyCenterMark` — one fenced ```tsx block, complete function, no ellipses.
2. `### KittyPortrait` — one fenced ```tsx block, complete function, no ellipses.
3. `## Rig delta` — the compact spec above (hexes + feature translations + risk callout).
4. `## Notes` — ≤4 bullets (portrait-approach choice, what you kept vs changed, anything for the integrator to eyeball).

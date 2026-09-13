# BRIEF — Cat Runner DMCA redesign, part 2: apply the "Pop Kitty" language to the in-game rig

You are a design-minded front-end engineer working on a three.js flat-vector character rig. You have no repo access; this brief is self-contained. Your output will be pasted into the repo verbatim by an integrating agent, then typechecked.

The character's new design language was decided in part 1 ("Pop Kitty"): star hairclip replaces the ear bow, a small "w" mouth is added (the strongest differentiator — the infringing cat has none), white catchlight specks in the eyes, red accent nose. Silhouette, pose, proportions stay untouched.

## 1. The rig you are changing

`Kitty.tsx` builds the cat from flat `THREE.ShapeGeometry` fills, each with an ink copy grown behind it (the `Part` helper) so it reads as an outlined vector shape. React renders parts once; a `useFrame` writes transforms every frame from a pure pose function (`rig.ts` — NOT yours, do not change it). There are two bodies sharing one rig: the pastel cat (your target) and an ashen knight (`isSouls` branch — NOT yours, do not touch it).

Palette roles are shared between the two bodies: the knight reuses the same keys with different values (`bowRed`/`bowDeep` are steel there). The best-run ghost retints the cat by hex lookup, so **palette keys must keep their names**; values may change.

### Part helper (contract, verbatim)

```tsx
function Part({ geometry, color, z, position, rotation, scale = 1, outline = 0, outlineColor, inkGeometry }: PartProps) {
  const ink = outlineColor ?? PALETTE.outlineInk;
  const hasInk = outline > 0 || inkGeometry !== undefined;
  return (
    <>
      {hasInk && (
        <mesh geometry={inkGeometry ?? geometry}
          position={position ? [position[0], position[1], z - 0.03] : [0, 0, z - 0.03]}
          rotation={[0, 0, rotation ?? 0]}
          scale={inkGeometry ? scale : scale * outline}>
          <meshBasicMaterial color={ink} />
        </mesh>
      )}
      <mesh geometry={geometry}
        position={position ? [position[0], position[1], z] : [0, 0, z]}
        rotation={[0, 0, rotation ?? 0]} scale={scale}>
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  );
}
```

### Current pastel palette (`lib/palette.ts`, verbatim — values you may change, keys you may not)

```ts
export const PALETTE = {
  kittyWhite: "#ffffff",
  outlineInk: "#3a3142",
  bowRed: "#e94f64",
  bowDeep: "#d13a50",
  suitPink: "#f6a9c0",
  suitDeep: "#e88bab",
  noseYellow: "#ffd44d",
  cheek: "#ffc9d8",
  eyeInk: "#3a3142",
  // ... scene keys (sky, ground, pickups) — not yours
} as const;
```

Note: `bowRed`/`bowDeep` already carry the Pop accent (#e94f64 / #d13a50) — reuse them for the star clip and nose; do not invent new keys.

### Current face + ears + bow JSX (verbatim, inside the head group at position [0, 1.5, 0])

```tsx
<group ref={earLRef} position={[-0.58, 0.52, 0.15]}>
  <Part geometry={geo.ear} color={palette.kittyWhite} z={0} outline={1.12} outlineColor={palette.outlineInk} />
</group>
<group ref={earRRef} position={[0.58, 0.52, 0.15]}>
  <Part geometry={geo.ear} color={palette.kittyWhite} z={0} outline={1.12} outlineColor={palette.outlineInk} />
</group>
<Part geometry={geo.head} color={palette.kittyWhite} z={0.22} outline={1.045} outlineColor={palette.outlineInk} />

{/* face — pastel only; the visor replaces it in souls mode */}
{!isSouls && (
  <>
    <mesh ref={eyeLRef} geometry={geo.eye} position={[-0.4, 0.06, 0.27]}>
      <meshBasicMaterial color={palette.eyeInk} />
    </mesh>
    <mesh ref={eyeRRef} geometry={geo.eye} position={[0.4, 0.06, 0.27]}>
      <meshBasicMaterial color={palette.eyeInk} />
    </mesh>
    <mesh geometry={geo.nose} position={[0, -0.16, 0.27]}>
      <meshBasicMaterial color={palette.noseYellow} />
    </mesh>
    <mesh geometry={geo.cheek} position={[-0.68, -0.22, 0.26]}>
      <meshBasicMaterial color={palette.cheek} />
    </mesh>
    <mesh geometry={geo.cheek} position={[0.68, -0.22, 0.26]}>
      <meshBasicMaterial color={palette.cheek} />
    </mesh>
    {[-1, 1].map((side) =>
      [0.18, 0.02, -0.14].map((y, i) => (
        <mesh key={`${side}:${i}`} geometry={geo.whisker}
          position={[side * 0.88, y, 0.27]}
          rotation={[0, 0, side * (0.08 - i * 0.08)]}>
          <meshBasicMaterial color={palette.outlineInk} />
        </mesh>
      )),
    )}
  </>
)}

{isSouls ? (
  /* ... the knight's great helm — NOT YOURS, leave the whole branch as-is ... */
  <group position={[0, 0, 0]}>/* ... */</group>
) : (
  /* bow */
  <group ref={bowRef} position={[0.52, 0.66, 0.32]}>
    <Part geometry={geo.bowLoop} color={palette.bowRed} z={0.004} position={[-0.3, 0]} rotation={0.45} outline={1.12} outlineColor={palette.outlineInk} />
    <Part geometry={geo.bowLoop} color={palette.bowRed} z={0.004} position={[0.3, 0]} rotation={-0.45} outline={1.12} outlineColor={palette.outlineInk} />
    <Part geometry={geo.bowKnot} color={palette.bowDeep} z={0.016} outline={1.18} outlineColor={palette.outlineInk} />
  </group>
)}
```

### Relevant geometry entries (`geo` useMemo)

```ts
head: new THREE.ShapeGeometry(ellipseShape(1.0, 0.84), seg),   // head-local, centre (0,0)
ear:  new THREE.ShapeGeometry(earShape(), seg),                // base at y 0, apex ~y 0.54, half-width 0.28
eye:  new THREE.ShapeGeometry(ellipseShape(0.085, 0.135), seg),
nose: new THREE.ShapeGeometry(ellipseShape(0.13, 0.1), seg),
cheek: new THREE.ShapeGeometry(ellipseShape(0.14, 0.09), seg),
whisker: new THREE.PlaneGeometry(0.36, 0.032),
bowLoop: new THREE.ShapeGeometry(ellipseShape(0.34, 0.24), seg),
bowKnot: new THREE.ShapeGeometry(ellipseShape(0.16, 0.16), seg),
```

Shape helpers that exist: `ellipseShape(rx, ry)`, `rectShape(w, h)`, `roundedRectShape(w, h, r)`. You may add new shape functions (the file has several, e.g. `helmCrestShape()` — follow that style: plain `THREE.Shape` with `moveTo/quadraticCurveTo/lineTo`, closed with `closePath()`).

### Animation contract (do not break)

- `useFrame` writes `bowRef.rotation.z = pose.bowRot; bowRef.current.scale.setScalar(pose.bowScale)` — the bow group bobs and pulses (dash/happy). Your star clip must live in a group carrying `ref={bowRef}` so it inherits this motion. Its local position may change (e.g. ride the right ear tip instead of floating beside it — but the ear group `earRRef` rotates independently, so if you move the star inside `earRRef` it will NOT get bowRot; decide which reads better and say so).
- `eyeLRef`/`eyeRRef` get `scale.y = pose.eyeScaleY` (blink squashes eyes to 0.08). A catchlight that is a sibling mesh will NOT blink with the eye — either parent it inside the eye mesh (meshes accept children) or accept the desync and say why it's fine at this scale. Head is ~55px tall on screen.
- `rig.ts` pose fields (`bowRot`, `bowScale`, etc.) are frozen — no new pose inputs.

## 2. The changes to make (pastel branch only)

1. **Star clip replaces the bow.** A five-pointed star, accent `bowRed`, with ink outline, sized ~0.3–0.4 world units across, sitting where the bow sat (or riding the right ear — your call, justify). Author a `starShape()` (outer radius ~0.2, inner radius ~0.09 is a good start; round the joins by using many short segments if needed — hard corners are also fine, this is a flat comic style).
2. **Nose goes accent red**: `palette.bowRed` instead of `palette.noseYellow`. Keep the existing nose geometry (or enlarge slightly, your call). `noseYellow` key stays in the palette (the knight uses it for ember eyes) — the pastel branch just stops referencing it.
3. **"w" mouth** below the nose: a small flat shape reading as a stroked line (two shallow arcs). Ink colour `outlineInk` (or `eyeInk`). Must survive at 55px head height — err on slightly thicker/bigger than feels natural. Give it its own z with stated clearance from the nose (nose z 0.27, head fill 0.22).
4. **Catchlights**: small white specks on the eyes (white, not palette-keyed — hardcode `#ffffff` is fine, the file already hardcodes one literal for souls steel). Handle the blink-parenting question explicitly.
5. **Base coat**: decide whether `kittyWhite` pastel value should go warm cream `#fff6ee` (matching the card art) or stay `#ffffff`. `kittyWhite` colours head, ears, arms, feet — one value changes all. State your choice and reason in one line.

Do NOT: touch the souls branch, rename palette keys, change proportions/silhouette geometry (head ellipse, ear shape, dress, arms, feet), add gradients/textures/refs/new pose fields, or add comments beyond short rationale notes in the style of the file.

## 3. Expected output format

Numbered drop-in blocks, each with: `File: <path>` + an unambiguous anchor ("replace the bow group block", "add to the geo object after `bowKnot:`", "add function after `earShape()`") + the complete new code in a fenced ```tsx/ts block. No ellipses, no diffs, no full-file rewrites. End with ≤5 lines of rationale covering: star placement choice, catchlight blink choice, kittyWhite choice, and any z-ladder values you introduced.

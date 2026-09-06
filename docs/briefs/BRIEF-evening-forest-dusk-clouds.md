# BRIEF — Evening Forest: painterly cloud band in the dusk sky shader

You are revising one small React+GLSL file for a shipped web game. You
cannot see the repository; this brief contains the entire current file and
everything else you need.

## Situation

"Evening Forest" is a calm first-person walking simulator at dusk
(Proteus-inspired). The sky is a shader dome: a four-stop gradient with a
sun halo/disc and sparse twinkling stars, driven per frame by a daylight
engine that writes the uniforms (the arc runs golden hour → deep night at
t≈0.55 → sunrise; night is NOT pitch black — the moon takes the sun's
place with a cool colour and halo). The sky currently has no clouds, which
is the most visible "stillness" left in the scene.

Your task: add a **slow, painterly cloud band** to the existing fragment
shader — minimalist Proteus-style: soft shapes, strong colour, no texture
detail. This is a refinement of the file below, not a rewrite.

## How the file is driven (do not change any of this)

- `DaylightDriver` writes every frame: `uZenith`, `uUpper`, `uBand`,
  `uHorizon`, `uSunDirection`, `uSunColor` (all vec3 colors/direction in
  linear space), and scalars `uSunHalo` (0..1, fades the sun disc/halo —
  at night it drives a faint cool moon) and `uStarGain` (0..1 stars).
- `uTime` is the one shared shader clock (seconds, slowly advanced; slowed
  further under prefers-reduced-motion).
- The registry export `duskSkyUniforms` and the component API must stay
  exactly as they are; the defaults should keep describing the golden-hour
  opening frame.

## Required behaviour

1. **Cloud sheet.** Sample a small 2D value-noise (hash-based, 2 octaves of
   FBM — cheap, no loops beyond 2) over a drifting coordinate. Derive the
   coordinate from the view direction so the sheet reads as far away:
   something like `uv = dir.xz / (dir.y + 0.25)` plus a slow drift
   (`uTime * ~0.006`), scaled to taste. Cloud density = a smoothstep band
   over the FBM (e.g. `smoothstep(0.52, 0.78, fbm)`); pick thresholds so
   the sky stays mostly open (duty ~30–40% coverage, soft ragged edges).
2. **Clouds only above the horizon.** Fade cloud alpha out below
   `h ≈ 0.02` and let them thicken slightly toward the horizon band, so
   the sunset horizon can carry long soft banks (very Proteus).
3. **Painterly tint.** Two-tone clouds, both derived from uniforms the
   daylight engine already provides:
   - lit faces lean on `uSunColor` (warm amber at golden hour, pale cool
     at night, pink-amber at sunrise),
   - shadowed bellies lean on `uZenith` (deep blue-violet).
   Scale overall cloud brightness down at night (roughly with
   `0.35 + 0.65 * uSunHalo`) so night clouds read as faint moonlit shapes,
   never bright patches. Mix the two tones by something directional
   (e.g. how much the fragment faces the sun, like the existing
   `sunAmount`), then blend the result over the sky with cloud alpha.
4. **Stars dim behind clouds.** Multiply the existing star contribution by
   `(1.0 - cloudAlpha)`. Keep the sun halo/disc as is (it sits above the
   cloud layer — a disc glimpsed through a bank still reads).
5. **Restraint.** Max cloud alpha ~0.55; no bright rim lighting; no
   specular; clouds must never flicker (the drift is pure translation —
   no per-frame noise reseeding; `uTime` only scrolls the sample point).

## Hard constraints

- Modify ONLY this file. Keep the vertex shader, the uniform registry, the
  geometry, the component export and every existing uniform name unchanged.
- Keep the existing GLSL dialect and style: GLSL ES 1.0, `gl_FragColor`,
  hash helpers like the existing `hash13`, small helper functions above
  `main`. No new uniforms, no textures, no loops beyond the 2-octave FBM,
  no conditionals-heavy code.
- Deterministic: no `Math.random`, no time-based reseeding.

## The complete current file (revision base)

```tsx
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { daylightGains, windUniform } from "../lib/clock";

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uBand;
  uniform vec3 uHorizon;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uSunHalo;
  uniform float uStarGain;
  uniform float uTime;
  varying vec3 vDirection;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 dir = normalize(vDirection);
    float h = dir.y;
    float sunAmount = max(dot(dir, uSunDirection), 0.0);

    vec3 col = mix(uHorizon, uBand, smoothstep(0.0, 0.14, h));
    col = mix(col, uUpper, smoothstep(0.10, 0.40, h));
    col = mix(col, uZenith, smoothstep(0.36, 0.92, h));

    // Warm halo and a small soft sun disc sitting on the treeline. Both
    // scale with uSunHalo so night's moon stays a quiet cool point.
    col += uSunColor * pow(sunAmount, 8.0) * 0.55 * uSunHalo;
    col += mix(uSunColor, vec3(1.0, 0.98, 0.9), 0.4) *
      pow(sunAmount, 240.0) * 1.6 * uSunHalo;

    // Sparse twinkling stars in the upper violet.
    float cell = hash13(floor(dir * 190.0));
    float starMask = step(0.9986, cell) * smoothstep(0.30, 0.75, h);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + cell * 90.0);
    col += vec3(0.85, 0.9, 1.0) * starMask * twinkle * 0.7 * uStarGain;

    // Below the horizon the sky sinks into dark ground haze.
    col = mix(col, vec3(0.05, 0.04, 0.07), smoothstep(0.0, -0.12, h));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Registry the material publishes its uniforms into on mount, so
// DaylightDriver can retint the sky each frame without prop threading
// through the scene tree.
export const duskSkyUniforms: {
  current: Record<string, THREE.IUniform> | null;
} = { current: null };

// The sky dome. All colors, the sun direction and the star brightness are
// uniforms driven by DaylightDriver each frame; the defaults here are the
// golden-hour opening state so the first frame is already correct.
export function DuskSky() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: new THREE.Color("#3a2a66") },
        uUpper: { value: new THREE.Color("#58409a") },
        uBand: { value: new THREE.Color("#b06a86") },
        uHorizon: { value: new THREE.Color("#f2955a") },
        uSunDirection: { value: new THREE.Vector3(-0.42, 0.16, -0.86) },
        uSunColor: { value: new THREE.Color("#ffb066") },
        uSunHalo: { value: 1 },
        uStarGain: daylightGains.star,
        uTime: windUniform,
      },
    });
  }, []);

  const geometry = useMemo(() => new THREE.SphereGeometry(300, 32, 20), []);

  useEffect(() => {
    duskSkyUniforms.current = material.uniforms;
    return () => {
      duskSkyUniforms.current = null;
    };
  }, [material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-10}
      frustumCulled={false}
    />
  );
}
```

## Output format

Reply with exactly two things:

1. The complete replacement file in one fenced ```tsx block.
2. A short list (≤ 6 bullets): the knobs you exposed as plain constants
   (coverage, drift speed, alpha cap…) and anything the integrator should
   eyeball on the probe screenshots. No restated spec, no extra prose.

// Stress opens mineral boundaries; heat marks the work they cannot return.

// The stored band has wide sampling support. Decode the original narrow
// weak-boundary profile wherever it controls physics or ember fissures.
const WEAK_BOUNDARY_GLSL = /* glsl */ `
float weakBoundary(float band) {
  float boundary = 0.32 * (1.0 - band);
  return 1.0 - smoothstep(0.025, 0.115, boundary);
}
`;

export const PASS_VERT = /* glsl */ `
precision highp float;

out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const MINERAL_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform vec2 uSeed;

out vec4 outColor;

vec2 hash22(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  h += dot(h, h.yzx + 33.33);
  return fract((h.xx + h.yz) * h.zy);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  vec2 q = p * 6.5;
  vec2 cell = floor(q);
  vec2 local = fract(q);

  float first = 100.0;
  float second = 100.0;
  float identity = 0.0;
  float hardness = 0.0;

  for (int y = -1; y <= 1; ++y) {
    for (int x = -1; x <= 1; ++x) {
      vec2 offset = vec2(float(x), float(y));
      vec2 h = hash22(cell + offset + uSeed);
      vec2 site = offset + 0.18 + h * 0.64;
      vec2 delta = site - local;
      float distanceSquared = dot(delta, delta);

      if (distanceSquared < first) {
        second = first;
        first = distanceSquared;
        identity = h.x;
        hardness = h.y;
      } else if (distanceSquared < second) {
        second = distanceSquared;
      }
    }
  }

  float boundary = 0.5 * (sqrt(second) - sqrt(first));

  // Full support is 0.64 Voronoi units: 3.15 texels at grid 64.
  // Keep 0.32 synchronized with weakBoundary().
  float seam = clamp(1.0 - boundary / 0.32, 0.0, 1.0);

  float band = sin(p.x * 31.0 + p.y * 15.0 + identity * 7.0);
  float mineral = clamp(identity * 0.85 + 0.075 * band + 0.075, 0.0, 1.0);
  float cohesion = mix(0.45, 1.0, hardness);
  float mask = length(p) <= 0.86 ? 1.0 : 0.0;

  // Cohesion, mineral identity, broad boundary band, disc mask.
  outColor = vec4(cohesion, mineral, seam, mask);
}
`;

export const RESET_FRAG = /* glsl */ `
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(0.0);
}
`;

export const IMPULSE_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform sampler2D uState;
uniform sampler2D uMineral;
uniform vec2 uHit;
uniform float uStrength;

out vec4 outColor;

${WEAK_BOUNDARY_GLSL}

void main() {
  vec4 mineral = texture(uMineral, vUv);

  if (mineral.a < 0.5) {
    outColor = vec4(0.0);
    return;
  }

  // This pass samples at mineral texel centers.
  mineral.b = weakBoundary(mineral.b);

  vec4 state = texture(uState, vUv);
  vec2 p = vUv * 2.0 - 1.0;
  float distanceToHit = length(p - uHit);
  float core = exp(-distanceToHit * distanceToHit / 0.0256);
  float shellDistance = (distanceToHit - 0.23) / 0.055;
  float shell = exp(-shellDistance * shellDistance);
  float kick = (-2.8 * core + 0.55 * shell) * uStrength;

  float damage = 0.38 * core * mineral.b * uStrength;
  state.x = clamp(state.x - 0.012 * core * uStrength, -0.5, 0.5);
  state.y = clamp(state.y + kick, -4.0, 4.0);
  state.z = clamp(state.z + damage * (1.0 - state.z), 0.0, 1.0);
  state.w = clamp(state.w + (0.8 * core + 0.24 * shell) * uStrength, 0.0, 1.0);

  outColor = state;
}
`;

export const INTEGRATE_FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;

uniform sampler2D uState;
uniform sampler2D uMineral;
uniform vec2 uTexel;
uniform float uDt;

out vec4 outColor;

${WEAK_BOUNDARY_GLSL}

float bond(vec4 a, vec4 b, vec4 ma, vec4 mb) {
  float boundary = max(ma.b, mb.b);
  float damage = max(a.z, b.z);
  return step(0.5, mb.a) * (1.0 - 0.985 * boundary * damage);
}

void main() {
  vec4 mineral = texture(uMineral, vUv);

  if (mineral.a < 0.5) {
    outColor = vec4(0.0);
    return;
  }

  vec2 ex = vec2(uTexel.x, 0.0);
  vec2 ey = vec2(0.0, uTexel.y);

  vec4 state = texture(uState, vUv);
  vec4 left = texture(uState, vUv - ex);
  vec4 right = texture(uState, vUv + ex);
  vec4 down = texture(uState, vUv - ey);
  vec4 up = texture(uState, vUv + ey);

  vec4 ml = texture(uMineral, vUv - ex);
  vec4 mr = texture(uMineral, vUv + ex);
  vec4 md = texture(uMineral, vUv - ey);
  vec4 mu = texture(uMineral, vUv + ey);

  // Preserve the narrow, shared mechanical boundary at texel centers.
  mineral.b = weakBoundary(mineral.b);
  ml.b = weakBoundary(ml.b);
  mr.b = weakBoundary(mr.b);
  md.b = weakBoundary(md.b);
  mu.b = weakBoundary(mu.b);

  float bl = bond(state, left, mineral, ml);
  float br = bond(state, right, mineral, mr);
  float bd = bond(state, down, mineral, md);
  float bu = bond(state, up, mineral, mu);

  float spacing = 2.0 * uTexel.x;
  float dl = (left.x - state.x) * step(0.5, ml.a);
  float dr = (right.x - state.x) * step(0.5, mr.a);
  float dd = (down.x - state.x) * step(0.5, md.a);
  float du = (up.x - state.x) * step(0.5, mu.a);

  float laplacian = (bl * dl + br * dr + bd * dd + bu * du)
    / (spacing * spacing);

  float strain = max(max(abs(dl), abs(dr)), max(abs(dd), abs(du))) / spacing;
  float threshold = mix(0.28, 0.82, mineral.r);
  threshold *= mix(1.35, 0.7, mineral.b);

  float damageRate = max(strain - threshold, 0.0)
    * (0.15 + 0.85 * mineral.b) * 2.4;

  float damage = clamp(
    state.z + uDt * damageRate * (1.0 - state.z),
    0.0,
    1.0
  );

  float acceleration = 0.3025 * laplacian
    - 7.0 * state.x
    - (2.2 + 4.0 * damage) * state.y;

  float velocity = clamp(state.y + uDt * acceleration, -4.0, 4.0);
  float depth = clamp(state.x + uDt * velocity, -0.5, 0.5);

  if (abs(depth) >= 0.4999) {
    velocity *= 0.25;
  }

  float heat = state.w * exp(-uDt * 0.9);
  heat += (damage - state.z) * 3.0;
  heat += uDt * 0.018 * abs(velocity) * mineral.b;

  // View-depth displacement, velocity, irreversible damage, heat.
  outColor = vec4(depth, velocity, damage, clamp(heat, 0.0, 1.0));
}
`;

export const PRESENT_FRAG = /* glsl */ `
precision highp float;
precision highp int;

in vec2 vUv;

uniform sampler2D uState;
uniform sampler2D uMineral;
uniform vec2 uTexel;
uniform vec2 uAspect;
uniform vec3 uCoal;
uniform vec3 uClay;
uniform vec3 uEmber;
uniform vec3 uGold;

out vec4 outColor;

${WEAK_BOUNDARY_GLSL}

// Reconstruct Linear filtering explicitly for the center sample.
// Decode the mechanical seam BEFORE interpolation, preserving the old
// filtered fissure profile rather than decoding a blurred distance band.
vec4 sampleMineral(vec2 uv, out float seam) {
  ivec2 size = textureSize(uMineral, 0);
  vec2 position = uv * vec2(size) - 0.5;
  ivec2 base = ivec2(floor(position));
  vec2 weight = fract(position);
  ivec2 high = size - ivec2(1);

  vec4 m00 = texelFetch(
    uMineral,
    clamp(base, ivec2(0), high),
    0
  );
  vec4 m10 = texelFetch(
    uMineral,
    clamp(base + ivec2(1, 0), ivec2(0), high),
    0
  );
  vec4 m01 = texelFetch(
    uMineral,
    clamp(base + ivec2(0, 1), ivec2(0), high),
    0
  );
  vec4 m11 = texelFetch(
    uMineral,
    clamp(base + ivec2(1, 1), ivec2(0), high),
    0
  );

  float lower = mix(
    weakBoundary(m00.b),
    weakBoundary(m10.b),
    weight.x
  );
  float upper = mix(
    weakBoundary(m01.b),
    weakBoundary(m11.b),
    weight.x
  );
  seam = mix(lower, upper, weight.y);

  return mix(
    mix(m00, m10, weight.x),
    mix(m01, m11, weight.x),
    weight.y
  );
}

void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uAspect;
  float radius = length(p);
  float aa = max(fwidth(radius), 0.0001);
  float coverage = 1.0 - smoothstep(0.86 - aa, 0.86 + aa, radius);

  // Conservative ramp-space footprint; evaluated before divergent discard.
  // The ramp slope in disc coordinates is at most 6.5 / 0.32.
  vec2 pixelSpan = fwidth(p);
  float grainAA = clamp(
    max(pixelSpan.x, pixelSpan.y) * (6.5 / 0.32),
    0.015,
    0.14
  );

  if (radius > 0.86 + aa) {
    outColor = vec4(0.0);
    return;
  }

  vec2 uv = p * 0.5 + 0.5;
  vec2 ex = vec2(uTexel.x, 0.0);
  vec2 ey = vec2(0.0, uTexel.y);

  vec4 state = texture(uState, uv);
  float seam;
  vec4 mineral = sampleMineral(uv, seam);

  vec4 left = texture(uState, uv - ex);
  vec4 right = texture(uState, uv + ex);
  vec4 down = texture(uState, uv - ey);
  vec4 up = texture(uState, uv + ey);

  vec4 ml = texture(uMineral, uv - ex);
  vec4 mr = texture(uMineral, uv + ex);
  vec4 md = texture(uMineral, uv - ey);
  vec4 mu = texture(uMineral, uv + ey);

  float insideLeft = step(0.5, ml.a);
  float insideRight = step(0.5, mr.a);
  float insideDown = step(0.5, md.a);
  float insideUp = step(0.5, mu.a);

  float zl = mix(state.x, left.x, insideLeft);
  float zr = mix(state.x, right.x, insideRight);
  float zd = mix(state.x, down.x, insideDown);
  float zu = mix(state.x, up.x, insideUp);

  float opening = smoothstep(0.1, 0.65, state.z);
  float fracture = seam * opening;
  float grain = smoothstep(
    0.30 - grainAA,
    0.73 + grainAA,
    mineral.b
  );

  // New dry-material accents yield to the existing hot blast surface.
  float dry = 1.0 - smoothstep(0.03, 0.35, max(state.z, state.w));

  vec2 identityGradient = vec2(
    mix(mineral.g, mr.g, insideRight)
      - mix(mineral.g, ml.g, insideLeft),
    mix(mineral.g, mu.g, insideUp)
      - mix(mineral.g, md.g, insideDown)
  ) / (4.0 * uTexel.x);

  vec2 seamGradient = vec2(
    mix(mineral.b, mr.b, insideRight)
      - mix(mineral.b, ml.b, insideLeft),
    mix(mineral.b, mu.b, insideUp)
      - mix(mineral.b, md.b, insideDown)
  ) / (4.0 * uTexel.x);

  vec2 gradient = vec2(zr - zl, zu - zd) / (4.0 * uTexel.x);
  gradient += mix(0.005, 0.008, dry) * identityGradient;

  // A shallow groove, not displaced geometry or another state channel.
  gradient -= 0.0025 * seamGradient * dry * (1.0 - opening);
  gradient -= p * 0.14;

  vec3 normal = normalize(vec3(-gradient, 1.0));
  vec3 light = normalize(vec3(-0.45, 0.62, 0.8));
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));

  float diffuse = max(dot(normal, light), 0.0);
  float specular = pow(max(dot(normal, halfway), 0.0), 18.0);

  // Identity remains a continuous material signal, never a plate index.
  float plate = smoothstep(0.08, 0.92, mineral.g);
  float originalTone = 0.2 + mineral.g * 0.65;
  float dryTone = 0.18 + plate * 0.70;
  vec3 stone = mix(uCoal, uClay, mix(originalTone, dryTone, dry));
  stone *= 0.32 + 0.8 * diffuse;

  // Intact seams and damage share one darkness budget at crossings.
  float intactShade = mix(seam * 0.13, grain * 0.34, dry)
    * (1.0 - opening);
  stone *= 1.0 - max(intactShade, 0.92 * fracture);
  stone *= clamp(1.0 + state.x * 0.8, 0.65, 1.2);

  float originalSpecular = 0.025 + 0.045 * mineral.g;
  float drySpecular = 0.018 + 0.032 * plate;
  stone += uGold * specular
    * mix(originalSpecular, drySpecular, dry)
    * (1.0 - fracture);

  float outerRing = 1.0 - smoothstep(
    0.003,
    0.003 + aa * 1.5,
    abs(radius - 0.833)
  );
  float innerRing = 1.0 - smoothstep(
    0.0015,
    0.0015 + aa * 1.5,
    abs(radius - 0.793)
  );
  float rim = smoothstep(0.836, 0.86, radius);

  stone += uClay * (outerRing * 0.36 + innerRing * 0.12)
    * (1.0 - fracture * 0.85);
  stone = mix(stone, uCoal * 0.55, rim * 0.6);

  float heat = pow(clamp(state.w, 0.0, 1.0), 1.35);
  float glow = heat * (0.16 + seam * 1.4 + fracture * 0.65);
  vec3 fire = mix(uEmber, uGold, smoothstep(0.45, 1.0, state.w));
  stone += fire * glow;

  outColor = vec4(clamp(stone, 0.0, 1.0), coverage);
}
`;

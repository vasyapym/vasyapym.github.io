// ember-gpu-shaders.ts — GLSL source for the GPGPU shard simulation.
// Constraint: consumed by THREE.ShaderMaterial({ glslVersion: THREE.GLSL3 }); three
// prepends the #version + precision header (and an `out vec4` only for GLSL1
// materials), so these strings carry NO #version / precision / #include lines.
// GLSL3 syntax only: in/out, `flat` where interpolation must not happen, no
// `varying`, no `gl_FragColor` (fragment shaders declare their own `out vec4`).
// All physics constants are baked here and mirror the CPU path (gravity -3.4,
// drag 0.18, floor -1.35, restitution -0.35 / xz 0.6, rest eps 0.35, cool 0.55,
// settle ease 9.0, radius 1.15). No Math.random equivalent: every per-shard value
// is a deterministic hash of the shard index.

// Shared fullscreen-triangle vertex shader for every sim pass. `position` is the
// three-provided attribute (ShaderMaterial injects it). The triangle covers clip
// space with 3 verts; z is pinned so gl_FragCoord.xy indexes the target texel grid.
export const PASS_VERT: string = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Fullscreen blit: copies uSrcTex verbatim into the bound target. Used once per
// ping-pong head at init to upload the DataTextures (and to smoke-test the pass
// machinery before any stepping). Nearest, texelFetch — never sample the RT we write.
export const COPY_FRAG: string = /* glsl */ `
uniform sampler2D uSrcTex;
out vec4 fragColor;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  fragColor = texelFetch(uSrcTex, p, 0);
}
`;

// Velocity integration pass: reads previous pos + previous vel, writes new vel.
// w channel carries the airborne flag (1.0 aloft, 0.0 at rest).
export const SIM_VEL_FRAG: string = /* glsl */ `
#define GRID 32
#define PI 3.141592653589793
#define R 1.15
#define GRAV 3.4
#define DRAG 0.18
#define FLOOR -1.35
#define REST_EPS 0.35

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uDt;
uniform float uNow;
uniform float uKick;
uniform float uKickStrength;
uniform float uSettling;
uniform float uSnap;

out vec4 fragColor;

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

// rest position: golden-angle sphere, i in [0, 599].
vec3 restPos(int i) {
  float y = 1.0 - (float(i) / 599.0) * 2.0;
  float rad = sqrt(max(0.0, 1.0 - y * y));
  float th = float(i) * (PI * (3.0 - sqrt(5.0)));
  return vec3(cos(th) * rad, y, sin(th) * rad) * R;
}

// Cheap 3D value-noise curl, built from a scalar hash — used only while airborne so
// rest stays a stable fixed point (turbulence is gated to zero at rest below).
float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z) * 2.0 - 1.0;
}
vec3 potential(vec3 p) {
  return vec3(
    noise3(p),
    noise3(p + vec3(31.3, 17.7, 5.1)),
    noise3(p + vec3(7.2, 91.5, 43.8))
  );
}
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = potential(p - dx), px1 = potential(p + dx);
  vec3 py0 = potential(p - dy), py1 = potential(p + dy);
  vec3 pz0 = potential(p - dz), pz1 = potential(p + dz);
  float x = (py1.z - py0.z) - (pz1.y - pz0.y);
  float y = (pz1.x - pz0.x) - (px1.z - px0.z);
  float z = (px1.y - px0.y) - (py1.x - py0.x);
  return vec3(x, y, z) / (2.0 * e);
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int i = p.y * GRID + p.x;
  vec3 pos = texelFetch(uPosTex, p, 0).xyz;
  vec3 vel = texelFetch(uVelTex, p, 0).xyz;
  vec3 rest = restPos(i);
  float s = hash11(float(i) + 0.123);

  // 1. Same-frame snap: dead stop, at rest.
  if (uSnap > 0.5) {
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // 2. Blast impulse (mirrors CPU seedShards).
  if (uKick > 0.5) {
    vec3 dir = pos - vec3(0.0);
    float len = length(dir);
    dir = len > 1e-5 ? dir / len : normalize(rest);
    float speed = (2.6 + 2.2 * uKickStrength) * (0.85 + s * 0.35);
    vec3 v = dir * speed + vec3(
      (hash11(s * 3.1) - 0.5) * 1.4,
      0.7 + s * 0.6,
      (hash11(s * 7.7) - 0.5) * 1.4
    );
    fragColor = vec4(v, 1.0);
    return;
  }

  // 3. Settling: no velocity; report aloft until arrival at rest.
  if (uSettling > 0.5) {
    float aloft = step(1e-4, distance(pos, rest));
    fragColor = vec4(0.0, 0.0, 0.0, aloft);
    return;
  }

  // 4. Free integration.
  vel.y += -GRAV * uDt;
  vel *= max(0.0, 1.0 - DRAG * uDt);
  if (pos.y <= FLOOR && vel.y < 0.0) {
    vel.y = -vel.y * 0.35;
    vel.xz *= 0.6;
  }
  // CPU-path parity: snap at-rest shards to zero velocity (REST_EPS), so the
  // free-integration floor micro-bounce cannot jitter rest or drift tumble.
  if (pos.y <= FLOOR + 0.001 && length(vel) < REST_EPS) {
    vel = vec3(0.0);
  }

  float sp = length(vel);
  // airborne 1 when length(vel) >= 0.35 OR pos.y > -1.33.
  float aloftNow = ((sp >= REST_EPS) || (pos.y > -1.33)) ? 1.0 : 0.0;

  // Turbulence — gated to flight so a resting shard receives exactly zero.
  vec3 curl = curlNoise(pos * 0.9 + vec3(0.0, uNow * 0.15, 0.0));
  float breathe = 0.5 + 0.5 * sin(uNow);
  vel += curl * (aloftNow * clamp(sp / 6.0, 0.0, 1.0) * 0.4 * breathe);

  fragColor = vec4(vel, aloftNow);
}
`;

// Position integration pass: reads previous pos + the NEW vel head, writes new pos.
export const SIM_POS_FRAG: string = /* glsl */ `
#define GRID 32
#define PI 3.141592653589793
#define R 1.15
#define FLOOR -1.35

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uDt;
uniform float uSettling;
uniform float uSnap;

out vec4 fragColor;

vec3 restPos(int i) {
  float y = 1.0 - (float(i) / 599.0) * 2.0;
  float rad = sqrt(max(0.0, 1.0 - y * y));
  float th = float(i) * (PI * (3.0 - sqrt(5.0)));
  return vec3(cos(th) * rad, y, sin(th) * rad) * R;
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int i = p.y * GRID + p.x;
  vec3 pos = texelFetch(uPosTex, p, 0).xyz;
  vec3 vel = texelFetch(uVelTex, p, 0).xyz;
  vec3 rest = restPos(i);

  if (uSnap > 0.5) {
    fragColor = vec4(rest, 0.0);
    return;
  }

  if (uSettling > 0.5) {
    pos += (rest - pos) * (1.0 - exp(-9.0 * uDt));
    pos.y = max(pos.y, FLOOR);
    fragColor = vec4(pos, 0.0);
    return;
  }

  pos += vel * uDt;
  pos.y = max(pos.y, FLOOR);
  fragColor = vec4(pos, 0.0);
}
`;

// Instanced shard vertex shader. Fetches per-shard state from the sim textures via
// texelFetch (zero CPU per-shard work). Heat and tumble are PURE functions of
// (index, uNow, uBlastTime, uSettleTime) — no stored orientation, no stored heat.
export const SHARD_VERT: string = /* glsl */ `
#define REST_EPS 0.35

in float aIndex;

uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uNow;
uniform float uBlastTime;
uniform float uSettleTime;

flat out vec3 vColor;

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

// Repo ember ramp, evaluated in-shader. Stops (sRGB->linear-agnostic, matches CPU):
// #2b2622 @0.0, #8a3a1e @0.2, #d39b61 @0.45, #e4a669 @0.7, #ffd9a0 @1.0.
vec3 emberRamp(float t) {
  const vec3 c0 = vec3(0.16862745, 0.14901961, 0.13333333);
  const vec3 c1 = vec3(0.54117647, 0.22745098, 0.11764706);
  const vec3 c2 = vec3(0.82745098, 0.60784314, 0.38039216);
  const vec3 c3 = vec3(0.89411765, 0.65098039, 0.41176471);
  const vec3 c4 = vec3(1.0, 0.85098039, 0.62745098);
  t = clamp(t, 0.0, 1.0);
  if (t < 0.2) return mix(c0, c1, t / 0.2);
  if (t < 0.45) return mix(c1, c2, (t - 0.2) / 0.25);
  if (t < 0.7) return mix(c2, c3, (t - 0.45) / 0.25);
  return mix(c3, c4, (t - 0.7) / 0.3);
}

// Unit-quaternion helpers (xyz = imaginary, w = real).
vec4 quatAxisAngle(vec3 axis, float angle) {
  float h = angle * 0.5;
  return vec4(axis * sin(h), cos(h));
}
vec4 quatFromEuler(vec3 e) {
  vec3 c = cos(e * 0.5);
  vec3 sn = sin(e * 0.5);
  return vec4(
    sn.x * c.y * c.z + c.x * sn.y * sn.z,
    c.x * sn.y * c.z - sn.x * c.y * sn.z,
    c.x * c.y * sn.z + sn.x * sn.y * c.z,
    c.x * c.y * c.z - sn.x * sn.y * sn.z
  );
}
vec4 quatMul(vec4 a, vec4 b) {
  return vec4(
    a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
    a.w * b.w - dot(a.xyz, b.xyz)
  );
}
vec3 rotateByQuat(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  int idx = int(aIndex + 0.5);
  ivec2 p = ivec2(idx % 32, idx / 32);
  vec3 sPos = texelFetch(uPosTex, p, 0).xyz;
  vec3 vel = texelFetch(uVelTex, p, 0).xyz;

  float s = hash11(float(idx) + 0.123);
  float baseHeat = 0.5 + (hash11(float(idx) + 1.7) - 0.5) * 0.14;

  // Heat: pure function of time since blast, eased back toward baseHeat on settle.
  float tBlast = uNow - uBlastTime;
  float heat = baseHeat + (1.0 - baseHeat) * exp(-0.55 * tBlast);
  heat = mix(heat, baseHeat, clamp((uNow - uSettleTime) * 3.0, 0.0, 1.0));
  vColor = emberRamp(heat);

  // Tumble: pure function of s + speed. At rest tumble->0 and the angle freezes at
  // s * 6.2831, giving a varied static rest orientation (no stored state).
  // Gated below REST_EPS (CPU-path parity) so rest is exactly frozen.
  vec3 axis = normalize(vec3(
    hash11(s * 5.3) - 0.5,
    hash11(s * 9.1) - 0.5,
    hash11(s * 13.7) - 0.5
  ) + vec3(1e-4, 0.0, 0.0));
  float tumble = clamp((length(vel) - REST_EPS) / 4.0, 0.0, 1.0);
  float angle = s * 6.2831 + uNow * (1.5 + s * 2.5) * tumble;
  vec4 qSpin = quatAxisAngle(axis, angle);
  vec4 qRest = quatFromEuler(vec3(
    hash11(s * 2.1) * 6.2831,
    hash11(s * 4.7) * 6.2831,
    hash11(s * 8.9) * 6.2831
  ));
  vec4 q = quatMul(qSpin, qRest);

  vec3 world = rotateByQuat(position, q) + sPos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}
`;

// Shard fragment shader — unlit; the heat color IS the light (matches aesthetic).
export const SHARD_FRAG: string = /* glsl */ `
flat in vec3 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

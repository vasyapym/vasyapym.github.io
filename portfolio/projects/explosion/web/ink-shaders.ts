// ink-shaders.ts — GLSL source for the Ink Shockwave fluid simulation.
// Constraint: consumed by THREE.ShaderMaterial({ glslVersion: THREE.GLSL3 }); three
// prepends the #version + precision header, so these strings carry NO #version /
// precision / #include lines. GLSL3 syntax only: in/out, no `varying`, no
// `gl_FragColor` (fragment shaders declare their own `out vec4 fragColor;`).
// Velocity is stored in uv units per second — resolution-independent by design.

// Fullscreen triangle (-1,-1) (3,-1) (-1,3); vUv > 1 outside the viewport is harmless.
export const PASS_VERT: string = `
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// uSource must never be the bound write target (feedback loop) — ping-pong only.
export const CLEAR_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
uniform float uValue;
void main() {
  fragColor = texture(uSource, vUv) * uValue;
}
`;

// Semi-Lagrangian back-trace in uv space; uDt in seconds, velocity in uv/s, so no
// texel conversion. Serves both velocity (uSource = velocity) and dye.
export const ADVECT_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 back = vUv - uDt * texture(uVelocity, vUv).xy;
  fragColor = texture(uSource, back) / (1.0 + uDt * uDissipation);
}
`;

// Additive (ONE, ONE) — outputs only the contribution; no base read, no uTarget.
// Distances in pixels via uResolution so splats stay round; uRadius in pixels.
export const SPLAT_DYE_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uPoint;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uRadius;
uniform float uStrength;
void main() {
  vec2 d = (vUv - uPoint) * uResolution;
  float m = exp(-dot(d, d) / max(uRadius * uRadius, 1e-4));
  fragColor = vec4(uColor * (m * uStrength), 1.0);
}
`;

// Additive velocity splat. uMode 0 = gaussian disc, 1 = annulus (ring in pixels).
// uRadial 1 = radial-outward impulse scaled by uImpulseScale; 0 = constant uImpulse
// (uv/s). Inner edge guarded: smoothstep with equal edges is undefined in GLSL.
export const SPLAT_VEL_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uPoint;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uStrength;
uniform float uMode;
uniform float uRingInner;
uniform float uRingOuter;
uniform float uRadial;
uniform vec2 uImpulse;
uniform float uImpulseScale;
void main() {
  vec2 d = (vUv - uPoint) * uResolution;
  float dist = length(d);
  float m;
  if (uMode < 0.5) {
    m = exp(-dot(d, d) / max(uRadius * uRadius, 1e-4));
  } else {
    float outer = 1.0 - smoothstep(uRingOuter * 0.72, uRingOuter, dist);
    float inner = smoothstep(uRingInner * 0.55, max(uRingInner, 1e-3), dist);
    m = inner * outer;
  }
  vec2 v = (uRadial > 0.5)
    ? d / max(dist, 1e-4) * uImpulseScale
    : uImpulse;
  fragColor = vec4(v * (m * uStrength), 0.0, 1.0);
}
`;

// Signed scalar curl in .x; uTexel = 1 / sim grid size (neighbor offsets in uv).
export const CURL_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float w = 0.5 * (r - l - t + b);
  fragColor = vec4(w, 0.0, 0.0, 1.0);
}
`;

// Vorticity confinement; velocity clamped to ±2.0 uv/s so a stacked blast cannot
// launch NaN-scale back-traces in ADVECT.
export const VORTICITY_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlEps;
uniform float uDt;
void main() {
  float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 1e-4;
  force *= uCurlEps * c;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * uDt;
  vel = clamp(vel, vec2(-2.0), vec2(2.0));
  fragColor = vec4(vel, 0.0, 1.0);
}
`;

export const DIVERGENCE_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float div = 0.5 * (r - l + t - b);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

// One Jacobi iteration; uPressure is the previous ping-pong half, never the bound one.
export const PRESSURE_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float div = texture(uDivergence, vUv).x;
  fragColor = vec4((l + r + b + t - div) * 0.25, 0.0, 0.0, 1.0);
}
`;

export const GRADIENT_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
  fragColor = vec4(vel, 0.0, 1.0);
}
`;

// Dye → canvas. Output is premultiplied alpha (composited over the stage gradient).
// Grain is a pure hash of vUv + uTime: deterministic for a given clock, no RNG.
export const DISPLAY_FRAG: string = `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uDye;
uniform float uTime;
uniform vec2 uResolution;
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec3 dye = max(texture(uDye, vUv).rgb, vec3(0.0));
  vec3 c = 1.0 - exp(-dye * 1.35);
  float grain = (hash12(vUv * uResolution + uTime) - 0.5) * 0.02;
  c = clamp(c + grain, 0.0, 1.0);
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float r = length((vUv - 0.5) * vec2(aspect, 1.0));
  float vig = smoothstep(1.15, 0.45, r);
  float a = smoothstep(0.0, 1.0, clamp(max(c.r, max(c.g, c.b)) * 1.5, 0.0, 1.0)) * vig;
  fragColor = vec4(c * a, a);
}
`;

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  Vignette,
  wrapEffect,
} from "@react-three/postprocessing";
import { BlendFunction, Effect } from "postprocessing";
import { daylightGains } from "../lib/clock";

// The 8-bit pass: a gentle dusk grade, ordered dithering (4x4 Bayer matrix)
// and palette quantisation in one fragment shader. Pixelation itself is
// free — the Canvas renders at ~0.36 device pixels and CSS upscales it
// with image-rendering: pixelated.
const FRAGMENT_SHADER = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uLevels;
  uniform float uStrength;
  uniform float uNightLift;

  // Compact recursive Bayer: bayer2 tiled at half frequency builds bayer4.
  float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x * 0.5 + a.y * a.y * 0.75);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;

    // Dusk readability: warm the mids, lift the toe just enough that the
    // shadow side of the meadow keeps texture after 6-level quantisation.
    // As uNightLift rises toward deep night the gamma pull deepens and the
    // toe lift grows with a blue-weighted push, so moonlit shadows stay
    // textured instead of crushing into the quantisation mud.
    c = pow(c, vec3(0.88, 0.94, 0.86) - uNightLift * vec3(0.05, 0.03, 0.08));
    c += vec3(0.015, 0.008, 0.03) + uNightLift * vec3(0.010, 0.012, 0.028);

    vec2 pixel = floor(uv * uResolution);
    float bayer = bayer2(pixel * 0.5) * 0.25 + bayer2(pixel);
    vec3 quantised = floor(c * uLevels + (bayer - 0.5) * uStrength) / uLevels;
    quantised = clamp(quantised, 0.0, 1.0);

    outputColor = vec4(quantised, inputColor.a);
  }
`;

class PosterizeDitherEffect extends Effect {
  constructor() {
    super("PosterizeDitherEffect", FRAGMENT_SHADER, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["uResolution", new THREE.Uniform(new THREE.Vector2(512, 288))],
        ["uLevels", new THREE.Uniform(6)],
        ["uStrength", new THREE.Uniform(1)],
        ["uNightLift", new THREE.Uniform(0)],
      ]),
    });
  }
}

const PosterizeDither = wrapEffect(PosterizeDitherEffect);

// The postprocessing composer needs renderable float frame buffers; some
// Safari builds refuse them and would crash the whole canvas. The forest
// reads fine without the grade — degrade instead of dying.
function composerSupported(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) return false;
    return Boolean(
      gl.getExtension("EXT_color_buffer_float") ||
        gl.getExtension("EXT_color_buffer_half_float"),
    );
  } catch {
    return false;
  }
}

const composerOk = composerSupported();

// The drawing buffer size changes on resize; keep the dither grid locked to
// real device pixels so the pattern never swims.
function ResolutionSync({
  handle,
}: {
  handle: React.RefObject<PosterizeDitherEffect | null>;
}) {
  const size = useMemo(() => new THREE.Vector2(), []);
  useFrame(({ gl }) => {
    gl.getDrawingBufferSize(size);
    handle.current?.uniforms.get("uResolution")?.value.copy(size);
    const nightUniform = handle.current?.uniforms.get("uNightLift");
    if (nightUniform) nightUniform.value = daylightGains.night.value;
  });
  return null;
}

export function RetroEffects({
  bloomIntensity = 0.65,
}: {
  bloomIntensity?: number;
}) {
  const ditherRef = useRef<PosterizeDitherEffect | null>(null);

  if (!composerOk) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={bloomIntensity}
        luminanceThreshold={0.52}
        luminanceSmoothing={0.25}
      />
      <PosterizeDither ref={ditherRef} />
      <Vignette offset={0.3} darkness={0.42} eskil={false} />
      <ResolutionSync handle={ditherRef} />
    </EffectComposer>
  );
}

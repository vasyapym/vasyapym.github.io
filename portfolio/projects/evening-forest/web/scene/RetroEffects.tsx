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

// The 8-bit pass: a gentle dusk grade, ordered dithering (4x4 Bayer matrix)
// and palette quantisation in one fragment shader. Pixelation itself is
// free — the Canvas renders at ~0.36 device pixels and CSS upscales it
// with image-rendering: pixelated.
const FRAGMENT_SHADER = /* glsl */ `
  uniform vec2 uResolution;
  uniform float uLevels;
  uniform float uStrength;

  // Compact recursive Bayer: bayer2 tiled at half frequency builds bayer4.
  float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x * 0.5 + a.y * a.y * 0.75);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;

    // Warm the mids slightly, lift the shadows toward violet.
    c = pow(c, vec3(0.94, 1.03, 0.90));
    c += vec3(0.012, 0.004, 0.03);

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
      ]),
    });
  }
}

const PosterizeDither = wrapEffect(PosterizeDitherEffect);

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
  });
  return null;
}

export function RetroEffects({
  bloomIntensity = 0.65,
}: {
  bloomIntensity?: number;
}) {
  const ditherRef = useRef<PosterizeDitherEffect | null>(null);

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={bloomIntensity}
        luminanceThreshold={0.52}
        luminanceSmoothing={0.25}
      />
      <PosterizeDither ref={ditherRef} />
      <Vignette offset={0.26} darkness={0.62} eskil={false} />
      <ResolutionSync handle={ditherRef} />
    </EffectComposer>
  );
}

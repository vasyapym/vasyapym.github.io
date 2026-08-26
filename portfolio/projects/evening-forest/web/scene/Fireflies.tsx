import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../lib/palette";
import { terrainHeight } from "../lib/heightfield";
import { createRng } from "../lib/rng";
import { playerPositionUniform, windUniform, daylightGains } from "../lib/clock";

const DEFAULT_COUNT = 150;

// Fireflies drift entirely on the GPU: base positions are baked once
// (seeded), and the vertex shader offsets them with per-firefly phases read
// from a shared clock — zero CPU work per frame. When the walker comes
// close, a second uniform gently reels them into an orbit around the
// camera, so walking through the hollow feels like stirring sparks.
const VERTEX_SHADER = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform vec3 uPlayer;
  varying float vFade;
  varying float vNear;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * (0.21 + aSeed.x * 0.25) + aSeed.y * 40.0) * (1.4 + aSeed.x * 2.2);
    pos.z += cos(uTime * (0.19 + aSeed.y * 0.22) + aSeed.z * 40.0) * (1.4 + aSeed.y * 2.2);
    pos.y += sin(uTime * (0.3 + aSeed.z * 0.3) + aSeed.w * 50.0) * (0.35 + aSeed.z * 0.5);

    // Curious fireflies: inside ~12m they drift toward the walker, easing
    // into a loose ring about two metres out instead of swallowing them.
    vec3 toPlayer = uPlayer - pos;
    float dist = length(toPlayer);
    float pull = smoothstep(12.0, 3.0, dist);
    pos += (toPlayer / max(dist, 0.001)) * pull * max(dist - 2.2, 0.0) * 0.45;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float distView = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(260.0 / distView, 1.5, 7.0);

    float pulse = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed.w * 1.6) + aSeed.x * 60.0);
    vFade = pulse * smoothstep(78.0, 16.0, distView);
    vNear = pull;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGain;
  varying float vFade;
  varying float vNear;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float disc = smoothstep(0.5, 0.12, d);
    if (disc < 0.01) discard;
    gl_FragColor = vec4(uColor, disc * vFade * (1.0 + vNear * 0.7) * uGain);
  }
`;

export function Fireflies({ count = DEFAULT_COUNT }: { count?: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    const rand = createRng("evening-forest/fireflies/v1");
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = Math.sqrt(rand()) * 72;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions[i * 3] = x;
      positions[i * 3 + 1] = terrainHeight(x, z) + 0.5 + rand() * 2.4;
      positions[i * 3 + 2] = z;
      seeds[i * 4] = rand();
      seeds[i * 4 + 1] = rand();
      seeds[i * 4 + 2] = rand();
      seeds[i * 4 + 3] = rand();
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    return g;
  }, [count]);

  // The hollow travels: once the walker strays too far from the swarm's
  // centre, the whole cloud quietly re-seeds around them, so fireflies stay
  // part of every walk instead of being a spawn-area landmark.
  const anchorRef = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(() => {
    if (playerPositionUniform.value.distanceTo(anchorRef.current) < 46) return;
    anchorRef.current.copy(playerPositionUniform.value);
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const positions = attr.array as Float32Array;
    const rand = Math.random;
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = 8 + Math.sqrt(rand()) * 64;
      const x = playerPositionUniform.value.x + Math.cos(angle) * radius;
      const z = playerPositionUniform.value.z + Math.sin(angle) * radius;
      positions[i * 3] = x;
      positions[i * 3 + 1] = terrainHeight(x, z) + 0.5 + rand() * 2.4;
      positions[i * 3 + 2] = z;
    }
    attr.needsUpdate = true;
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: windUniform,
          uPlayer: playerPositionUniform,
          uColor: { value: COLORS.firefly.clone() },
          uGain: daylightGains.firefly,
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points geometry={geometry} material={material} renderOrder={6} frustumCulled={false} />
  );
}

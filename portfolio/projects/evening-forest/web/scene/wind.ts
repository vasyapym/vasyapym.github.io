import type { MeshLambertMaterial } from "three";
import { windUniform } from "../lib/clock";

// Injects a coherent wind sway into a standard material's vertex shader.
// Every instance of an InstancedMesh shares the phase of its world position,
// so the canopy breathes in waves instead of wobbling randomly. Amplitude
// grows with the square of local height: trunks stay still, crowns move.
export function applyWind(
  material: MeshLambertMaterial,
  strength: number,
  referenceHeight: number,
): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniform;
    shader.uniforms.uSwayStrength = { value: strength };
    shader.uniforms.uSwayHeight = { value: referenceHeight };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform float uSwayStrength;
        uniform float uSwayHeight;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          vec3 iOrigin = vec3(0.0);
          #ifdef USE_INSTANCING
            iOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #endif
          float phase = uTime * 1.7 + iOrigin.x * 0.43 + iOrigin.z * 0.37;
          float amp = clamp(transformed.y / uSwayHeight, 0.0, 1.0);
          amp *= amp;
          transformed.x += sin(phase) * amp * uSwayStrength;
          transformed.z += cos(phase * 0.77 + iOrigin.x * 0.11) * amp * uSwayStrength * 0.85;
        }`,
      );
  };
}

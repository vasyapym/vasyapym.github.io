import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { daylightGains, timeOfDay } from "../lib/clock";
import { sampleDaylight } from "../lib/daylight";
import { duskSkyUniforms } from "./DuskSky";

// The single place where a time-of-day sample becomes lighting. Every frame
// it expands timeOfDay into the sky uniforms, both lights, the fog, the
// clear colour and the shared effect gains — one writer per frame, so the
// whole forest relights in step no matter how fast the dial is dragged.
export function DaylightDriver() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);

  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);

  const scratch = useMemo(
    () => ({
      fogColor: new THREE.Color(),
      sunDir: new THREE.Vector3(),
    }),
    [],
  );

  useFrame(() => {
    const s = sampleDaylight(timeOfDay.value);
    // three r155+ uses physical light units — classic-looking intensities
    // need a ×π. Keyframes stay in readable classic units; this is the one
    // place the conversion happens.
    const PI = Math.PI;

    if (hemiRef.current) {
      hemiRef.current.color.setRGB(...s.hemiSky, THREE.SRGBColorSpace);
      hemiRef.current.groundColor.setRGB(...s.hemiGround, THREE.SRGBColorSpace);
      hemiRef.current.intensity = s.hemiIntensity * PI;
    }
    if (dirRef.current) {
      dirRef.current.color.setRGB(...s.sunColor, THREE.SRGBColorSpace);
      dirRef.current.intensity = s.sunIntensity * PI;
      scratch.sunDir.set(...s.sunDir).normalize();
      dirRef.current.position.copy(scratch.sunDir).multiplyScalar(120);
    }

    // Sky dome colors + halo strength; stars ride the shared gain uniform.
    const sky = duskSkyUniforms.current;
    if (sky) {
      (sky.uZenith.value as THREE.Color).setRGB(...s.zenith, THREE.SRGBColorSpace);
      (sky.uUpper.value as THREE.Color).setRGB(...s.upper, THREE.SRGBColorSpace);
      (sky.uBand.value as THREE.Color).setRGB(...s.band, THREE.SRGBColorSpace);
      (sky.uHorizon.value as THREE.Color).setRGB(...s.horizon, THREE.SRGBColorSpace);
      (sky.uSunDirection.value as THREE.Vector3)
        .set(...s.sunDir)
        .normalize();
      (sky.uSunColor.value as THREE.Color).setRGB(...s.sunColor, THREE.SRGBColorSpace);
      sky.uSunHalo.value = Math.min(s.sunIntensity / 3.2, 1);
    }

    daylightGains.star.value = s.starGain;
    daylightGains.firefly.value = s.fireflyGain;
    daylightGains.shaft.value = s.shaftGain;

    // Fog and clear colour share the sampled haze; FogExp2 was attached by
    // ForestCanvas's JSX.
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      scratch.fogColor.setRGB(...s.fog, THREE.SRGBColorSpace);
      fog.color.copy(scratch.fogColor);
      fog.density = s.fogDensity;
      gl.setClearColor(scratch.fogColor);
    }
  });

  return (
    <>
      {/* JSX defaults mirror the golden-hour keyframe ×π; the first driver
          tick takes over from here. */}
      <hemisphereLight ref={hemiRef} args={["#b3aadf", "#63513a", 3.4 * Math.PI]} />
      <directionalLight
        ref={dirRef}
        color="#ffb066"
        intensity={3.2 * Math.PI}
        position={[
          -0.42 * 120,
          0.2 * 120,
          -0.86 * 120,
        ]}
      />
    </>
  );
}

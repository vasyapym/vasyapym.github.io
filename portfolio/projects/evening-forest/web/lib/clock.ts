import * as THREE from "three";
import { WALKER_START } from "./heightfield";

// Shared shader uniforms. Every animated material (foliage wind, fireflies,
// light shafts, sky twinkle) reads uTime from this one object, and the
// WindClock component advances it exactly once per frame so all animations
// stay in step.
export const windUniform = { value: 0 };

// Where the walker stands right now. The rig writes it each frame; shaders
// read it to lean their effects toward (or away from) the player.
export const playerPositionUniform = {
  value: new THREE.Vector3(WALKER_START.x, 2.4, WALKER_START.z),
};

// Time of day, 0..1 — golden hour → night → sunrise. The UI dial and the
// [ / ] keys write it; DaylightDriver samples it once per frame and spreads
// the result across sky, lights, fog and these shared effect gains.
export const timeOfDay = { value: 0 };

export const daylightGains = {
  star: { value: 0.05 },
  firefly: { value: 0.35 },
  shaft: { value: 1 },
};

import * as THREE from "three";

// Shared shader uniforms. Every animated material (foliage wind, fireflies,
// light shafts, sky twinkle) reads uTime from this one object, and the
// WindClock component advances it exactly once per frame so all animations
// stay in step.
export const windUniform = { value: 0 };

// Where the walker stands right now. The rig writes it each frame; shaders
// read it to lean their effects toward (or away from) the player.
export const playerPositionUniform = {
  value: new THREE.Vector3(0, 2.4, 10),
};

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EYE_HEIGHT,
  PLAY_RADIUS,
  terrainHeight,
} from "../lib/heightfield";
import { playerPositionUniform } from "../lib/clock";
import { clampPitch, type TouchInputState } from "../lib/touch-input";

const WALK_SPEED = 3.4;
const IDLE_DRIFT = 0.022; // rad/s slow pan while the pause overlay is up

const FORWARD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const WISH = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

type KeyMap = Record<string, boolean | undefined>;

export type FirstPersonRigProps = {
  reducedMotion: boolean;
  // True while the player is in control — pointer-locked (desktop) or
  // touch-playing (phone). False leaves the camera to its idle drift.
  active: boolean;
  inputRef?: React.RefObject<TouchInputState | null>;
  // Fired once per footfall so the page can layer footsteps onto the mix.
  onFootstep?: (intensity: number) => void;
};

// Walking rig. The camera's rotation belongs to drei's PointerLockControls
// on desktop; on phones the touch overlay feeds yaw/pitch deltas into
// inputRef instead. This component owns position: smoothed velocity, ground
// following from the shared heightfield, a soft world boundary and a small
// head-bob (disabled under prefers-reduced-motion).
export function FirstPersonRig({
  reducedMotion,
  active,
  inputRef,
  onFootstep,
}: FirstPersonRigProps) {
  const { camera } = useThree();
  const keys = useRef<KeyMap>({});
  const velocity = useRef(new THREE.Vector3());
  const baseY = useRef<number | null>(null);
  const bobPhase = useRef(0);
  const lastStep = useRef(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current = {};
    };
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const locked = document.pointerLockElement != null;
    const controlled = locked || active;
    const input = inputRef?.current;

    // Apply queued look deltas from the touch overlay before anything
    // derives a heading from the camera.
    if (controlled && input && (input.yaw !== 0 || input.pitch !== 0)) {
      camera.rotation.y += input.yaw;
      camera.rotation.x = clampPitch(camera.rotation.x + input.pitch);
      input.yaw = 0;
      input.pitch = 0;
    }

    if (!controlled && !reducedMotion) {
      // Gentle drift keeps the vista alive behind the pause overlay.
      camera.rotation.y -= IDLE_DRIFT * dt;
    }

    FORWARD.set(0, 0, -1).applyQuaternion(camera.quaternion);
    FORWARD.y = 0;
    if (FORWARD.lengthSq() < 1e-6) FORWARD.set(0, 0, -1);
    FORWARD.normalize();
    RIGHT.crossVectors(FORWARD, UP).normalize();

    let moveZ = 0;
    let moveX = 0;
    if (locked) {
      const k = keys.current;
      moveZ =
        (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      moveX =
        (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    }
    if (active && input) {
      moveX += input.moveX;
      moveZ += input.moveZ;
    }
    const wishLength = Math.hypot(moveX, moveZ);
    if (wishLength > 1) {
      moveX /= wishLength;
      moveZ /= wishLength;
    }
    WISH.set(0, 0, 0).addScaledVector(FORWARD, moveZ).addScaledVector(RIGHT, moveX);
    WISH.multiplyScalar(WALK_SPEED * Math.min(wishLength, 1));

    velocity.current.lerp(WISH, 1 - Math.exp(-dt * 9));
    camera.position.addScaledVector(velocity.current, dt);

    // Soft boundary: ease back inside the meadow instead of hard-clipping.
    const radius = Math.hypot(camera.position.x, camera.position.z);
    if (radius > PLAY_RADIUS) {
      const pull = ((radius - PLAY_RADIUS) / radius) * (1 - Math.exp(-dt * 5));
      camera.position.x -= camera.position.x * pull;
      camera.position.z -= camera.position.z * pull;
    }

    // Ground follow with its own smoothing so slopes feel like steps,
    // then a bob layered on top purely as an offset.
    const targetY = terrainHeight(camera.position.x, camera.position.z) + EYE_HEIGHT;
    if (baseY.current === null) baseY.current = targetY;
    baseY.current += (targetY - baseY.current) * (1 - Math.exp(-dt * 11));

    const speed = velocity.current.length();
    if (controlled && !reducedMotion) {
      bobPhase.current += dt * (2.0 + speed * 2.4);
    }
    const bobOffset =
      Math.sin(bobPhase.current) * 0.045 * Math.min(speed / WALK_SPEED, 1);
    camera.position.y = baseY.current + bobOffset;

    // Publish the eye position for player-aware effects (firefly pull).
    playerPositionUniform.value.copy(camera.position);

    // A footfall lands every half cycle of the bob while actually moving.
    if (onFootstep && speed > 0.6) {
      const step = Math.floor(bobPhase.current / Math.PI);
      if (step > lastStep.current) {
        lastStep.current = step;
        onFootstep(Math.min(speed / WALK_SPEED, 1));
      }
    } else {
      lastStep.current = Math.floor(bobPhase.current / Math.PI);
    }
  });

  return null;
}

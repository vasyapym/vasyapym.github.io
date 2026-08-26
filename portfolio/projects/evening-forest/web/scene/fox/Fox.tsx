import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../../lib/palette";
import { terrainHeight } from "../../lib/heightfield";
import { createRng } from "../../lib/rng";
import { playerPositionUniform } from "../../lib/clock";
import { FoxBrain, FOX_SPAWN, type FoxSnapshot } from "./brain";
import { foxStore } from "./store";

// The director: a fox left behind quietly rejoins the story. Tight enough
// that encounters recur every couple of minutes of strolling.
const RELOCATE_RADIUS = 90;
const EYE_SAMPLE_STEP = 0.6;

function wrapAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

// A hip-pivoted leg: geometry hangs from the origin so rotation.z swings
// the foot fore-aft around the hip joint.
function legGeometry() {
  const g = new THREE.BoxGeometry(0.1, 0.5, 0.1);
  g.translate(0, -0.25, 0);
  return g;
}

// The fox's body. Built entirely from primitives so it stays inside the
// project's no-assets rule; the brain (pure TS, see brain.ts) decides what
// the fox does, this component only turns its output into a pose:
// diagonal-pair trot scaled by speed, slope-following pitch, banking into
// turns, tail sway, and the alert/curious/flee body language.
export function Fox() {
  const { camera } = useThree();

  const brain = useMemo(
    () => new FoxBrain(FOX_SPAWN, createRng("evening-forest/fox/v1")),
    [],
  );

  const materials = useMemo(
    () => ({
      // The dusk backlights everything into silhouette; a low emissive lift
      // keeps the one living creature warm and readable against it.
      coat: new THREE.MeshLambertMaterial({
        color: COLORS.fox,
        emissive: COLORS.fox,
        emissiveIntensity: 0.5,
      }),
      cream: new THREE.MeshLambertMaterial({
        color: COLORS.foxCream,
        emissive: COLORS.foxCream,
        emissiveIntensity: 0.34,
      }),
      dark: new THREE.MeshLambertMaterial({
        color: COLORS.foxDark,
        emissive: COLORS.foxDark,
        emissiveIntensity: 0.3,
      }),
    }),
    [],
  );

  const geometries = useMemo(() => {
    const leg = legGeometry();
    const tail = new THREE.ConeGeometry(0.17, 0.72, 6);
    tail.rotateZ(Math.PI / 2); // point -X
    tail.translate(-0.36, 0, 0);
    const tailTip = new THREE.ConeGeometry(0.095, 0.22, 6);
    tailTip.rotateZ(Math.PI / 2);
    tailTip.translate(-0.68, 0, 0);
    return {
      body: new THREE.BoxGeometry(0.95, 0.4, 0.36),
      chest: new THREE.BoxGeometry(0.3, 0.32, 0.3),
      head: new THREE.BoxGeometry(0.34, 0.3, 0.34),
      snout: new THREE.BoxGeometry(0.24, 0.14, 0.18),
      nose: new THREE.BoxGeometry(0.06, 0.06, 0.06),
      ear: new THREE.ConeGeometry(0.11, 0.3, 4),
      leg,
      tail,
      tailTip,
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const geometry of Object.values(geometries)) geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
    };
  }, [geometries, materials]);

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Mesh>(null);
  const earRRef = useRef<THREE.Mesh>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);

  const anim = useRef({
    phase: 0,
    groundY: terrainHeight(FOX_SPAWN.x, FOX_SPAWN.z),
    lastPlayer: new THREE.Vector3(),
    playerSpeed: 0,
    lastHeading: brain.heading,
    earPose: 0,
    initialized: false,
  });

  // Publish for the DOM UI (whisper hint, mind HUD); disposed on unmount so
  // a stale snapshot can't outlive the fox.
  useEffect(
    () => () => {
      foxStore.snapshot = null;
    },
    [],
  );

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const a = anim.current;
    const player = playerPositionUniform.value;

    // Walker speed from the shared uniform's frame-to-frame movement.
    if (!a.initialized) {
      a.lastPlayer.copy(player);
      a.initialized = true;
    }
    const playerStep = Math.hypot(
      player.x - a.lastPlayer.x,
      player.z - a.lastPlayer.z,
    );
    a.playerSpeed += (playerStep / Math.max(dt, 1e-4) - a.playerSpeed) *
      (1 - Math.exp(-dt * 8));
    a.lastPlayer.copy(player);

    // The director: a fox left 160m behind quietly rejoins the story.
    const storyDist = Math.hypot(brain.pos.x - player.x, brain.pos.z - player.z);
    if (storyDist > RELOCATE_RADIUS) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      );
      brain.relocate(player, { x: forward.x, z: forward.z });
    }

    const snap: FoxSnapshot = brain.tick({
      dt,
      playerPos: { x: player.x, z: player.z },
      playerSpeed: a.playerSpeed,
    });

    // DOM UI bridge: one plain object, polled at human cadence.
    foxStore.snapshot = {
      state: snap.state,
      dist: Math.hypot(snap.pos.x - player.x, snap.pos.z - player.z),
    };

    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    // --- placement --------------------------------------------------------
    const targetGroundY = terrainHeight(snap.pos.x, snap.pos.z);
    a.groundY += (targetGroundY - a.groundY) * (1 - Math.exp(-dt * 10));

    // Heading (cos h, sin h) -> three.js yaw with the nose built along +X.
    const turnRate = wrapAngle(snap.heading - a.lastHeading) / Math.max(dt, 1e-4);
    a.lastHeading = snap.heading;
    root.position.set(snap.pos.x, a.groundY, snap.pos.z);
    root.rotation.y = -snap.heading;

    // --- gait ---------------------------------------------------------------
    const speedNorm = Math.min(snap.speed / 1.7, 1.8);
    const dirX = Math.cos(snap.heading);
    const dirZ = Math.sin(snap.heading);
    a.phase += dt * (2.6 + snap.speed * 2.3);
    const swing = Math.sin(a.phase) * 0.5 * speedNorm;
    // Feet find the ground: each leg samples the heightfield under its own
    // world position, so slopes don't leave paws floating or buried.
    const rightX = -dirZ;
    const rightZ = dirX;
    const footPlant = (forward: number, side: number) =>
      terrainHeight(
        snap.pos.x + dirX * forward + rightX * side,
        snap.pos.z + dirZ * forward + rightZ * side,
      ) - a.groundY;
    if (legFL.current) legFL.current.rotation.z = swing;
    if (legBR.current) legBR.current.rotation.z = swing;
    if (legFR.current) legFR.current.rotation.z = -swing;
    if (legBL.current) legBL.current.rotation.z = -swing;
    const lift = Math.max(0, Math.cos(a.phase)) * 0.09 * speedNorm;
    const liftOff = Math.max(0, -Math.cos(a.phase)) * 0.09 * speedNorm;
    if (legFL.current)
      legFL.current.position.y =
        0.52 + lift + clamp(footPlant(0.3, 0.14), 0.25);
    if (legBR.current)
      legBR.current.position.y =
        0.52 + lift + clamp(footPlant(-0.3, -0.14), 0.25);
    if (legFR.current)
      legFR.current.position.y =
        0.52 + liftOff + clamp(footPlant(0.3, -0.14), 0.25);
    if (legBL.current)
      legBL.current.position.y =
        0.52 + liftOff + clamp(footPlant(-0.3, 0.14), 0.25);

    // Body: bob with the stride, pitch along the slope, bank into turns,
    // breathe when standing still.
    const ahead = terrainHeight(
      snap.pos.x + dirX * EYE_SAMPLE_STEP,
      snap.pos.z + dirZ * EYE_SAMPLE_STEP,
    );
    const behind = terrainHeight(
      snap.pos.x - dirX * EYE_SAMPLE_STEP,
      snap.pos.z - dirZ * EYE_SAMPLE_STEP,
    );
    body.rotation.z = Math.atan2(ahead - behind, EYE_SAMPLE_STEP * 2);
    body.rotation.x = clamp(turnRate * snap.speed * 0.05, 0.22) * -1;
    body.position.y = 0.62 + Math.abs(Math.sin(a.phase)) * 0.035 * speedNorm;
    const breathe = 1 + Math.sin(a.phase * 0.35) * 0.03 * (1 - Math.min(speedNorm, 1));
    body.scale.set(1, breathe, 1);

    // --- expression ---------------------------------------------------------
    const aware = snap.state === "alert" || snap.state === "curious";
    if (headRef.current) {
      if (aware) {
        const toPlayer = Math.atan2(player.z - snap.pos.z, player.x - snap.pos.x);
        const relative = wrapAngle(toPlayer - snap.heading);
        headRef.current.rotation.y = -clamp(relative, 0.85);
        headRef.current.rotation.x = Math.sin(a.phase * 0.5) * 0.05;
      } else {
        headRef.current.rotation.y = 0;
        headRef.current.rotation.x = Math.sin(a.phase * 0.4) * 0.06;
      }
    }
    const earTarget = snap.state === "flee" ? -0.55 : aware ? 0 : -0.12;
    a.earPose += (earTarget - a.earPose) * (1 - Math.exp(-dt * 6));
    if (earLRef.current) earLRef.current.rotation.z = a.earPose;
    if (earRRef.current) earRRef.current.rotation.z = a.earPose;

    if (tailRef.current) {
      tailRef.current.rotation.y =
        Math.sin(a.phase * 0.5 + 1.3) * (0.22 + speedNorm * 0.12);
      tailRef.current.rotation.z = -0.15 - speedNorm * 0.14;
    }
  });

  return (
    <group ref={rootRef} position={[FOX_SPAWN.x, 0, FOX_SPAWN.z]}>
      {/* Oversized ~1.4x: at dusk distance and heavy pixelation a real-fox
          scale silhouette turns to mush; games fudge this constantly. */}
      <group scale={1.4}>
      <group ref={bodyRef} position={[0, 0.62, 0]}>
        <mesh geometry={geometries.body} material={materials.coat} />
        <mesh
          geometry={geometries.chest}
          material={materials.cream}
          position={[0.3, -0.08, 0]}
        />
        {/* Head looks at the walker when aware; the group pivots at the neck. */}
        <group ref={headRef} position={[0.55, 0.26, 0]}>
          <mesh geometry={geometries.head} material={materials.coat} />
          <mesh
            geometry={geometries.snout}
            material={materials.cream}
            position={[0.24, -0.05, 0]}
          />
          <mesh
            geometry={geometries.nose}
            material={materials.dark}
            position={[0.37, -0.05, 0]}
          />
          <mesh
            ref={earLRef}
            geometry={geometries.ear}
            material={materials.dark}
            position={[-0.04, 0.24, 0.11]}
          />
          <mesh
            ref={earRRef}
            geometry={geometries.ear}
            material={materials.dark}
            position={[-0.04, 0.24, -0.11]}
          />
        </group>
      </group>
      <group ref={tailRef} position={[-0.48, 0.68, 0]}>
        <mesh geometry={geometries.tail} material={materials.coat} />
        <mesh geometry={geometries.tailTip} material={materials.cream} />
      </group>
      {/* Diagonal trot pairs: FL+BR share a phase, FR+BL oppose it. */}
      <mesh
        ref={legFL}
        geometry={geometries.leg}
        material={materials.coat}
        position={[0.3, 0.52, 0.14]}
      />
      <mesh
        ref={legFR}
        geometry={geometries.leg}
        material={materials.coat}
        position={[0.3, 0.52, -0.14]}
      />
      <mesh
        ref={legBL}
        geometry={geometries.leg}
        material={materials.coat}
        position={[-0.3, 0.52, 0.14]}
      />
      <mesh
        ref={legBR}
        geometry={geometries.leg}
        material={materials.coat}
        position={[-0.3, 0.52, -0.14]}
      />
      </group>
    </group>
  );
}

// ember-gpu.ts — GPGPU shard simulation driver.
// Single source of truth: the pos/vel ping-pong float textures ARE the shard state.
// The render mesh's vertex shader reads those same textures via texelFetch, so there
// is no CPU-side per-shard array to desync (no "mid-air ghosts"). Every entity's
// visual and logical reading come from one owned buffer, written once per frame by
// exactly one code path (step/snap). Rendered view is a pure function of that state.
//
// Constraints honoured here: WebGL2 + EXT_color_buffer_float probed before any float
// target is created; NearestFilter only on float textures (read via texelFetch); the
// RT being written is never sampled in the same pass (classic ping-pong); no
// Math.random (all variation is hashed in-shader); never throws (all failure paths
// return null); full disposal hygiene.

import * as THREE from "three";
import {
  COPY_FRAG,
  SIM_VEL_FRAG,
  SIM_POS_FRAG,
  SHARD_VERT,
  SHARD_FRAG,
  PASS_VERT,
} from "./ember-gpu-shaders";

const GRID = 32; // 1024 slots; first `count` used.
const R = 1.15; // sphere radius — mirrors CPU + GLSL restPos.
const GOLDEN = Math.PI * (3.0 - Math.sqrt(5.0));

export type EmberGpu = {
  /** The instanced shard mesh — add to your scene, remove in your dispose. */
  readonly mesh: THREE.Mesh;
  /** Arm a blast impulse; consumed by the next step(). */
  kick(strength: number): void;
  /** Enter/leave the settle phase (shards ease back to rest). */
  setSettling(on: boolean): void;
  /** Same-frame pristine snap (reduced-motion restore path). */
  snapToRest(): void;
  /** Run one sim step at sim-dt (already slow-mo scaled by the caller).
   *  Returns the last-read aloft count. */
  step(dt: number): number;
  /** Last-read airborne shard count (readback on an internal cadence). */
  readonly aloft: number;
  dispose(): void;
};

export function createEmberGpu(
  renderer: THREE.WebGLRenderer,
  count: number,
): EmberGpu | null {
  // Capability gate — calling getExtension enables the extension; must precede any
  // float render-target creation. Any failure here returns null (never throws).
  if (renderer.capabilities.isWebGL2 !== true) return null;
  const gl = renderer.getContext();
  if (gl.getExtension("EXT_color_buffer_float") === null) return null;

  try {
    // ---- Ping-pong float render targets -------------------------------------
    const rtOpts: THREE.RenderTargetOptions = {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    const makeRT = (): THREE.WebGLRenderTarget =>
      new THREE.WebGLRenderTarget(GRID, GRID, rtOpts);

    const posRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] = [
      makeRT(),
      makeRT(),
    ];
    const velRT: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] = [
      makeRT(),
      makeRT(),
    ];
    // Read heads (write goes to the other slot; heads swap after each step).
    let posRead = 0;
    let velRead = 0;

    // ---- Sim pass plumbing: one fullscreen triangle, one scene/camera -------
    const triGeo = new THREE.BufferGeometry();
    triGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
        3,
      ),
    );

    const copyMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PASS_VERT,
      fragmentShader: COPY_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uSrcTex: { value: null as THREE.Texture | null },
      },
    });

    const velMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PASS_VERT,
      fragmentShader: SIM_VEL_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPosTex: { value: null as THREE.Texture | null },
        uVelTex: { value: null as THREE.Texture | null },
        uDt: { value: 0 },
        uNow: { value: 0 },
        uKick: { value: 0 },
        uKickStrength: { value: 0 },
        uSettling: { value: 0 },
        uSnap: { value: 0 },
      },
    });

    const posMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: PASS_VERT,
      fragmentShader: SIM_POS_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPosTex: { value: null as THREE.Texture | null },
        uVelTex: { value: null as THREE.Texture | null },
        uDt: { value: 0 },
        uSettling: { value: 0 },
        uSnap: { value: 0 },
      },
    });

    const passScene = new THREE.Scene();
    const passCamera = new THREE.Camera();
    const passMesh = new THREE.Mesh(triGeo, copyMat);
    passMesh.frustumCulled = false;
    passScene.add(passMesh);

    const runPass = (
      mat: THREE.ShaderMaterial,
      target: THREE.WebGLRenderTarget,
    ): void => {
      passMesh.material = mat;
      renderer.setRenderTarget(target);
      renderer.render(passScene, passCamera);
    };

    // ---- One-time init: upload rest pos + zero vel via COPY blits -----------
    // The only per-shard CPU data in this module. Disposed immediately after blit.
    const posData = new Float32Array(GRID * GRID * 4);
    const velData = new Float32Array(GRID * GRID * 4); // zeros == vel 0, airborne 0.
    for (let i = 0; i < count; i++) {
      const y = 1.0 - (i / 599.0) * 2.0; // 599 mirrors the GLSL restPos denominator.
      const rad = Math.sqrt(Math.max(0.0, 1.0 - y * y));
      const th = i * GOLDEN;
      const o = i * 4;
      posData[o + 0] = Math.cos(th) * rad * R;
      posData[o + 1] = y * R;
      posData[o + 2] = Math.sin(th) * rad * R;
      posData[o + 3] = 0.0;
    }

    const posDataTex = new THREE.DataTexture(
      posData,
      GRID,
      GRID,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    posDataTex.minFilter = THREE.NearestFilter;
    posDataTex.magFilter = THREE.NearestFilter;
    posDataTex.needsUpdate = true;

    const velDataTex = new THREE.DataTexture(
      velData,
      GRID,
      GRID,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    velDataTex.minFilter = THREE.NearestFilter;
    velDataTex.magFilter = THREE.NearestFilter;
    velDataTex.needsUpdate = true;

    copyMat.uniforms.uSrcTex.value = posDataTex;
    runPass(copyMat, posRT[0]);
    copyMat.uniforms.uSrcTex.value = velDataTex;
    runPass(copyMat, velRT[0]);
    renderer.setRenderTarget(null);

    // DataTextures owed their disposal the moment their contents are in the
    // ping-pong heads; from here on the textures are the sole state.
    posDataTex.dispose();
    velDataTex.dispose();

    // ---- Render mesh: instanced tetrahedra, state fetched in the vertex shader
    const tetra = new THREE.TetrahedronGeometry(0.09, 0);
    const geo = new THREE.InstancedBufferGeometry();
    const tPos = tetra.getAttribute("position");
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(tPos.array), 3),
    );
    const tNrm = tetra.getAttribute("normal");
    if (tNrm !== undefined) {
      geo.setAttribute(
        "normal",
        new THREE.BufferAttribute(new Float32Array(tNrm.array), 3),
      );
    }
    tetra.dispose();

    const idxArr = new Float32Array(count);
    for (let i = 0; i < count; i++) idxArr[i] = i;
    geo.setAttribute("aIndex", new THREE.InstancedBufferAttribute(idxArr, 1));
    geo.instanceCount = count;

    const renderMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SHARD_VERT,
      fragmentShader: SHARD_FRAG,
      uniforms: {
        uPosTex: { value: posRT[posRead].texture },
        uVelTex: { value: velRT[velRead].texture },
        uNow: { value: 0 },
        // Pristine start: blast/settle far in the past => heat reads baseHeat.
        uBlastTime: { value: -100 },
        uSettleTime: { value: -100 },
      },
    });

    const mesh = new THREE.Mesh(geo, renderMat);
    mesh.frustumCulled = false; // state lives in textures; bounds are meaningless.

    // ---- Module-owned mutable state (single writers noted in the law audit) --
    let simTime = 0; // sole writer: step().
    let kickArmed = false;
    let kickStrength = 0;
    let settling = false;
    let stepCount = 0;
    let forceReadback = false;
    let aloftCache = 0; // sole writer: readbackAloft().
    let readbackBuf: Float32Array | null = new Float32Array(GRID * GRID * 4);

    const readbackAloft = (): void => {
      if (readbackBuf === null) return;
      renderer.readRenderTargetPixels(
        velRT[velRead],
        0,
        0,
        GRID,
        GRID,
        readbackBuf,
      );
      let n = 0;
      for (let i = 0; i < count; i++) {
        if (readbackBuf[i * 4 + 3] > 0.5) n++;
      }
      aloftCache = n;
      renderer.setRenderTarget(null);
    };

    // Vel pass -> vel write; pos pass reads the NEW vel; swap; retarget render.
    const advance = (dt: number, snap: number): void => {
      const posReadRT = posRT[posRead];
      const velReadRT = velRT[velRead];
      const velWriteRT = velRT[1 - velRead];
      const posWriteRT = posRT[1 - posRead];

      velMat.uniforms.uPosTex.value = posReadRT.texture;
      velMat.uniforms.uVelTex.value = velReadRT.texture;
      velMat.uniforms.uDt.value = dt;
      velMat.uniforms.uNow.value = simTime;
      velMat.uniforms.uKick.value = snap > 0.5 ? 0 : kickArmed ? 1 : 0;
      velMat.uniforms.uKickStrength.value = kickStrength;
      velMat.uniforms.uSettling.value = snap > 0.5 ? 0 : settling ? 1 : 0;
      velMat.uniforms.uSnap.value = snap;
      runPass(velMat, velWriteRT);

      posMat.uniforms.uPosTex.value = posReadRT.texture;
      posMat.uniforms.uVelTex.value = velWriteRT.texture; // the new vel head.
      posMat.uniforms.uDt.value = dt;
      posMat.uniforms.uSettling.value = snap > 0.5 ? 0 : settling ? 1 : 0;
      posMat.uniforms.uSnap.value = snap;
      runPass(posMat, posWriteRT);

      velRead = 1 - velRead;
      posRead = 1 - posRead;

      renderMat.uniforms.uPosTex.value = posRT[posRead].texture;
      renderMat.uniforms.uVelTex.value = velRT[velRead].texture;
      renderMat.uniforms.uNow.value = simTime;
      renderer.setRenderTarget(null);
    };

    const kick = (strength: number): void => {
      kickArmed = true;
      kickStrength = strength;
      renderMat.uniforms.uBlastTime.value = simTime;
      // Integration fix: retire any prior settle blend so the re-kick glows.
      // Without this, clamp((uNow - uSettleTime) * 3.0) stays at 1 forever and
      // heat is pinned to baseHeat after the first restore.
      renderMat.uniforms.uSettleTime.value = simTime - 100;
      forceReadback = true;
    };

    const setSettling = (on: boolean): void => {
      settling = on;
      velMat.uniforms.uSettling.value = on ? 1 : 0;
      posMat.uniforms.uSettling.value = on ? 1 : 0;
      if (on) renderMat.uniforms.uSettleTime.value = simTime;
    };

    const snapToRest = (): void => {
      // One immediate vel+pos pair with uSnap=1 => vel 0 / airborne 0, pos = rest.
      advance(0, 1);
      settling = false;
      // Pristine visuals: no cooldown, no settle animation.
      renderMat.uniforms.uBlastTime.value = simTime - 100;
      renderMat.uniforms.uSettleTime.value = simTime - 100;
      forceReadback = true;
      readbackAloft();
    };

    const step = (dt: number): number => {
      simTime += dt;
      const doKick = kickArmed;
      advance(dt, 0);
      if (doKick) {
        kickArmed = false;
        forceReadback = true;
      }
      stepCount++;
      if (forceReadback || stepCount % 6 === 0) {
        readbackAloft();
        forceReadback = false;
      }
      return aloftCache;
    };

    const dispose = (): void => {
      posRT[0].dispose();
      posRT[1].dispose();
      velRT[0].dispose();
      velRT[1].dispose();
      triGeo.dispose();
      copyMat.dispose();
      velMat.dispose();
      posMat.dispose();
      renderMat.dispose();
      geo.dispose();
      // DataTextures were disposed at init (post-blit).
      readbackBuf = null;
      renderer.setRenderTarget(null);
    };

    const api: EmberGpu = {
      mesh,
      kick,
      setSettling,
      snapToRest,
      step,
      get aloft(): number {
        return aloftCache;
      },
      dispose,
    };
    return api;
  } catch {
    // Constructor throw anywhere above => safe null return.
    return null;
  }
}

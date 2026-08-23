import * as THREE from "three";
import { createRng } from "./rng";

// A tiny neutral grain texture. Multiplied over the vertex-coloured terrain it
// breaks up flat fills; nearest filtering keeps the texels crunchy at the
// low internal render resolution.
export function makeGrainTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Evening Forest: 2D canvas context unavailable");
  }
  ctx.fillStyle = "#e4e4e4";
  ctx.fillRect(0, 0, size, size);
  const rand = createRng("evening-forest/grain/v1");
  for (let i = 0; i < 2400; i += 1) {
    const shade = Math.floor(150 + rand() * 120);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${(0.06 + rand() * 0.1).toFixed(3)})`;
    const r = 1 + rand() * 2.6;
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(26, 26);
  return texture;
}

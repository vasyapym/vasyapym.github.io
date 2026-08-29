//! Grid dimensions, the frozen index formula, and grid<->world transforms.
//! Every module imports these constants; they are locked in Part 1 §0.

pub const W: usize = 64;
pub const H: usize = 42;
pub const D: usize = 26;
pub const N: usize = W * H * D; // 69_888 voxels

pub const CELL: f32 = 0.26; // world units per cell (fixed by the reference build)

// Grid is centred on x and z; it rests on the ground plane at y = 0.
const CX: f32 = (W as f32 - 1.0) * 0.5; // 31.5
const CZ: f32 = (D as f32 - 1.0) * 0.5; // 12.5

/// FROZEN index formula: y-major, then z, then x (runs are contiguous along x).
#[inline(always)]
pub fn vidx(x: usize, y: usize, z: usize) -> usize {
    (y * D + z) * W + x
}

/// Split a linear index back into grid coords (solvers/debris walk indices).
#[inline(always)]
pub fn coords_of(i: usize) -> (usize, usize, usize) {
    let x = i % W;
    let z = (i / W) % D;
    let y = i / (W * D);
    (x, y, z)
}

#[inline(always)]
pub fn in_bounds(x: i32, y: i32, z: i32) -> bool {
    x >= 0 && y >= 0 && z >= 0 && (x as usize) < W && (y as usize) < H && (z as usize) < D
}

// Cell centre in world space.
#[inline(always)]
pub fn world_x(gx: i32) -> f32 { (gx as f32 - CX) * CELL }
#[inline(always)]
pub fn world_y(gy: i32) -> f32 { (gy as f32 + 0.5) * CELL }
#[inline(always)]
pub fn world_z(gz: i32) -> f32 { (gz as f32 - CZ) * CELL }

// Inverse mapping is done inline by the DDA pick (blast.rs), which walks
// cell boundaries arithmetically from the AABB entry point instead of
// repeatedly converting world -> grid coords.

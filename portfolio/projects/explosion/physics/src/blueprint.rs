//! Procedural district generator (§4.1). Deterministic from `seed`, column-first
//! from each structure's ground row so every filled voxel already has a load path.
//! Writes into the frozen per-voxel arrays and fills the structure-bounds table.
//! Structures are spatially disjoint (two depth bands + x-gaps) so a blast on one
//! never condemns another through the shared ground row; a continuous basalt
//! groundworks band ties them to y=0 without creating cross-structure dependency.

use crate::coords::*;
use crate::rng::Rng;

pub const STRUCTURE_COUNT: usize = 6;

// Material ids (also index into PALETTE). kind carries colour + a solver capacity hint.
pub const KIND_BASALT: u8 = 0;
pub const KIND_BONE: u8 = 1;
pub const KIND_OCHRE: u8 = 2;
pub const KIND_LINTEL: u8 = 3;
pub const KIND_EMBER: u8 = 4; // reserved for ember-tinted pieces; TS may repaint
pub const KIND_TEAL: u8 = 5;

#[inline(always)]
fn palette(k: u8) -> u32 {
    match k {
        KIND_BASALT => 0x5a5446,
        KIND_BONE => 0xe9e0d0,
        KIND_OCHRE => 0xff9d4d,
        KIND_LINTEL => 0xd8cdb6,
        KIND_EMBER => 0xffc77b,
        _ => 0x5bb6bd, // teal accent
    }
}

#[inline(always)]
fn shade(base: u32, j: f32) -> u32 {
    let r = ((((base >> 16) & 0xff) as f32 * j) as u32).min(255);
    let g = ((((base >> 8) & 0xff) as f32 * j) as u32).min(255);
    let b = (((base & 0xff) as f32 * j) as u32).min(255);
    (r << 16) | (g << 8) | b
}

/// Fills the voxel arrays and the 6-structure bounds table.
/// Called by `world::init` and `world::restore`; fully repopulates every array
/// from scratch, so restore is just a re-run with the same seed → identical scene.
pub fn generate(
    seed: u32,
    filled: &mut [u8],
    kind: &mut [u8],
    color: &mut [u32],
    bounds: &mut [f32], // 6 structs * 6 floats
) {
    // Wipe the world; the blueprint owns every filled voxel it produces.
    for i in 0..N {
        filled[i] = 0;
        kind[i] = 0;
        color[i] = 0;
    }
    let mut rng = Rng::new(seed as u64);

    // Order is fixed and deterministic: the shared plinth first (anchors every
    // structure to the ground row), then the six structures in index order.
    ground_slab(&mut rng, filled, kind, color);
    hero_arch(&mut rng, filled, kind, color); // 0
    tower(&mut rng, filled, kind, color); // 1
    bridge(&mut rng, filled, kind, color); // 2
    ziggurat(&mut rng, filled, kind, color); // 3
    domed_hall(&mut rng, filled, kind, color); // 4
    obelisk(&mut rng, filled, kind, color); // 5

    write_bounds(bounds);
}

/// Place one voxel: sets filled, rolls a teal accent (~3.5%, never on the basalt
/// plinth so the groundworks stay uniform), bakes per-voxel brightness jitter.
/// Two RNG draws for coloured kinds, one for basalt (short-circuit) — fixed order.
#[inline]
fn place(
    rng: &mut Rng,
    filled: &mut [u8],
    kind: &mut [u8],
    color: &mut [u32],
    x: i32,
    y: i32,
    z: i32,
    k: u8,
) {
    if !in_bounds(x, y, z) {
        return;
    }
    let i = vidx(x as usize, y as usize, z as usize);
    let kk = if k != KIND_BASALT && rng.chance(0.035) {
        KIND_TEAL
    } else {
        k
    };
    filled[i] = 1;
    kind[i] = kk;
    color[i] = shade(palette(kk), rng.range(0.9, 1.08));
}

// ---- Structure 0: hero arch — two solid banks + a span they alone support. ----
// The span (y22..28) rides on top of both banks (y1..21). The open bay between
// the banks means the middle span cells are anchored only through the banks, so
// severing both banks floats the whole span (flood-fill condemns it), and cutting
// one bank forces its full load through the survivor — the aiming-anchor topology.
fn hero_arch(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    for y in 1..=21 {
        for z in 3..=13 {
            for x in 18..=25 {
                place(rng, f, k, c, x, y, z, KIND_OCHRE); // left bank
            }
            for x in 38..=45 {
                place(rng, f, k, c, x, y, z, KIND_OCHRE); // right bank
            }
        }
    }
    for y in 22..=28 {
        for z in 3..=13 {
            for x in 18..=45 {
                place(rng, f, k, c, x, y, z, KIND_LINTEL); // span
            }
        }
    }
}

// ---- Structure 1: tower — solid, gently tapering bone shell over a basalt core.
fn tower(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (cx, cz) = (8, 8);
    for y in 1..=40 {
        let t = y as f32 / 40.0;
        let h = (5.0 - 1.0 * t).round() as i32; // 5 -> 4
        for x in (cx - h)..=(cx + h) {
            for z in (cz - h)..=(cz + h) {
                let shell = x == cx - h || x == cx + h || z == cz - h || z == cz + h;
                let kind = if y >= 38 {
                    KIND_TEAL
                } else if shell {
                    KIND_BONE
                } else {
                    KIND_BASALT
                };
                place(rng, f, k, c, x, y, z, kind);
            }
        }
    }
}

// ---- Structure 2: bridge — three solid pier pairs, a thick deck, pylons + rail.
fn bridge(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    const PIERS: [(i32, i32); 3] = [(49, 50), (55, 56), (61, 62)];
    for &(a, b) in PIERS.iter() {
        for y in 1..=14 {
            for z in 3..=13 {
                place(rng, f, k, c, a, y, z, KIND_BASALT);
                place(rng, f, k, c, b, y, z, KIND_BASALT);
            }
        }
    }
    for y in 15..=18 {
        for x in 49..=62 {
            for z in 3..=13 {
                place(rng, f, k, c, x, y, z, KIND_LINTEL); // deck (spans between piers)
            }
        }
    }
    for &(a, b) in PIERS.iter() {
        for y in 19..=24 {
            for z in 3..=13 {
                place(rng, f, k, c, a, y, z, KIND_BONE); // pylons rise off the piers
                place(rng, f, k, c, b, y, z, KIND_BONE);
            }
        }
    }
    for y in 19..=20 {
        for x in 49..=62 {
            place(rng, f, k, c, x, y, 3, KIND_BONE); // railings on the deck edges
            place(rng, f, k, c, x, y, 13, KIND_BONE);
        }
    }
}

// ---- Structure 3: ziggurat — solid stepped mass, each terrace on the one below.
fn ziggurat(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (cx, cz) = (14, 19);
    for y in 1..=29 {
        let step = (y - 1) / 6; // 0..4
        let hx = 11 - 2 * step;
        let hz = 5 - step;
        if hx < 0 || hz < 0 {
            break;
        }
        for x in (cx - hx)..=(cx + hx) {
            for z in (cz - hz)..=(cz + hz) {
                let kind = if step >= 4 { KIND_OCHRE } else { KIND_BONE };
                place(rng, f, k, c, x, y, z, kind);
            }
        }
    }
}

// ---- Structure 4: domed hall — 2-thick hollow walls capped by a solid dome.
// The dome is filled (not a shell) so every dome cell rests on the disk below and
// the base disk's rim lands on the walls — nothing in the cap can float.
fn domed_hall(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (x0, x1, z0, z1) = (27, 47, 14, 24);
    for y in 1..=14 {
        for x in x0..=x1 {
            for z in z0..=z1 {
                let wall = x <= x0 + 1 || x >= x1 - 1 || z <= z0 + 1 || z >= z1 - 1;
                if wall {
                    place(rng, f, k, c, x, y, z, KIND_BONE);
                }
            }
        }
    }
    let (cx, cz, rx0, rz0) = (37.0f32, 19.0f32, 10.0f32, 5.0f32);
    for y in 15..=24 {
        let t = (y - 15) as f32 / 9.0;
        let s = (1.0 - t * t).max(0.0).sqrt();
        let (rx, rz) = (rx0 * s, rz0 * s);
        for x in x0..=x1 {
            for z in z0..=z1 {
                let dx = (x as f32 - cx) / (rx + 0.5);
                let dz = (z as f32 - cz) / (rz + 0.5);
                if dx * dx + dz * dz <= 1.0 {
                    place(rng, f, k, c, x, y, z, KIND_BONE);
                }
            }
        }
    }
}

// ---- Structure 5: obelisk — solid square spire tapering to a teal-tipped point.
fn obelisk(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (cx, cz) = (55, 19);
    for y in 1..=39 {
        let t = y as f32 / 39.0;
        let hx = (6.0 * (1.0 - 0.85 * t)).round() as i32;
        let hz = (4.0 * (1.0 - 0.85 * t)).round() as i32;
        for x in (cx - hx)..=(cx + hx) {
            for z in (cz - hz)..=(cz + hz) {
                let kind = if y >= 36 { KIND_TEAL } else { KIND_BONE };
                place(rng, f, k, c, x, y, z, kind);
            }
        }
    }
}

// ---- Shared groundworks: a single continuous basalt plinth on the ground row. ----
// It spans both depth bands (z 3..24) and every structure's x-extent. Because the
// support solver seeds from y==0, the whole plinth is inherently anchored, so it
// visually ties the district together without creating any cross-structure load
// dependency: severing plinth cells between two structures cannot condemn either.
fn ground_slab(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    for x in 3..=62 {
        for z in 3..=24 {
            place(rng, f, k, c, x, 0, z, KIND_BASALT);
        }
    }
}

// ---- Structure-bounds table (world-space, full-cell ±CELL/2). ----
// Written directly from each structure's frozen grid footprint so the exported
// table is bit-for-bit the §0 table; generation above stays inside these boxes.
fn write_bounds(b: &mut [f32]) {
    set_bounds(b, 0, 18, 45, 0, 28, 3, 13); // hero arch
    set_bounds(b, 1, 3, 13, 0, 40, 3, 13); // tower
    set_bounds(b, 2, 49, 62, 0, 24, 3, 13); // bridge
    set_bounds(b, 3, 3, 25, 0, 29, 14, 24); // ziggurat
    set_bounds(b, 4, 27, 47, 0, 24, 14, 24); // domed hall
    set_bounds(b, 5, 49, 61, 0, 39, 15, 23); // obelisk
}

#[inline]
fn set_bounds(b: &mut [f32], s: usize, x0: i32, x1: i32, y0: i32, y1: i32, z0: i32, z1: i32) {
    let h = CELL * 0.5;
    let o = s * 6;
    b[o] = world_x(x0) - h;
    b[o + 1] = world_y(y0) - h;
    b[o + 2] = world_z(z0) - h;
    b[o + 3] = world_x(x1) + h;
    b[o + 4] = world_y(y1) + h;
    b[o + 5] = world_z(z1) + h;
}

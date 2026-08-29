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
            for x in 19..=24 {
                place(rng, f, k, c, x, y, z, KIND_OCHRE); // left bank
            }
            for x in 39..=44 {
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
// Widened to a 13x11 footprint (x 1..13; the slab runs from x=1 to carry the
// west face) and the taper now bites only in x (6 -> 5); z keeps the full
// 11-deep band, so the donjon reads slab-sided. Teal crown from y=38.
fn tower(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (cx, cz) = (7, 8);
    for y in 1..=40 {
        let t = y as f32 / 40.0;
        let hx = (6.0 - t).round() as i32; // 6 -> 5
        let hz = 5;
        for x in (cx - hx)..=(cx + hx) {
            for z in (cz - hz)..=(cz + hz) {
                let shell = x == cx - hx || x == cx + hx || z == cz - hz || z == cz + hz;
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

// ---- Structure 2: bridge — three solid 3-wide pier blocks, a thick deck,
// full-width pylons + rail. Deck y15..20 rides the piers, pylons rise off the
// deck to y=26, railings crown the deck edges. x=48 pier face keeps a 1-cell
// z-gap to the domed hall (hall walls start at z=14).
fn bridge(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    const PIERS: [(i32, i32, i32); 3] = [(48, 49, 50), (54, 55, 56), (60, 61, 62)];
    for &(a, b, d) in PIERS.iter() {
        for y in 1..=14 {
            for z in 3..=13 {
                place(rng, f, k, c, a, y, z, KIND_BASALT);
                place(rng, f, k, c, b, y, z, KIND_BASALT);
                place(rng, f, k, c, d, y, z, KIND_BASALT);
            }
        }
    }
    for y in 15..=20 {
        for x in 48..=62 {
            for z in 3..=13 {
                place(rng, f, k, c, x, y, z, KIND_LINTEL); // deck (spans between piers)
            }
        }
    }
    for &(a, b, d) in PIERS.iter() {
        for y in 21..=26 {
            for z in 3..=13 {
                place(rng, f, k, c, a, y, z, KIND_BONE); // pylons rise off the deck
                place(rng, f, k, c, b, y, z, KIND_BONE);
                place(rng, f, k, c, d, y, z, KIND_BONE);
            }
        }
    }
    for y in 21..=22 {
        for x in 48..=62 {
            place(rng, f, k, c, x, y, 3, KIND_BONE); // railings on the deck edges
            place(rng, f, k, c, x, y, 13, KIND_BONE);
        }
    }
}

// ---- Structure 3: ziggurat — solid stepped mass, each terrace on the one below.
// Terraces are taller ((y+2)/9 instead of (y-1)/6) so the same 23x11 base
// carries the mass up to y=40; the bottom terrace keeps its 6 rows so the
// z=13/14 contact faces with the arch bank and tower stay exactly as shipped.
fn ziggurat(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (cx, cz) = (14, 19);
    for y in 1..=40 {
        let step = ((y + 2) / 9).min(4); // 0..4
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

// ---- Structure 4: domed hall — 3-thick hollow walls capped by a solid dome.
// The dome is filled (not a shell) so every dome cell rests on the disk below and
// the base disk's rim lands on the walls — nothing in the cap can float. The
// drum is 3 cells thick and 16 rows tall; the dome runs y17..28 on the same
// 10x5 half-ellipse profile. x=45 wall face leaves the arch bank a shared
// z=13/14 face (pre-existing topology, x 39..44 stays bank-only against it).
fn domed_hall(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (x0, x1, z0, z1) = (27, 47, 14, 24);
    for y in 1..=16 {
        for x in x0..=x1 {
            for z in z0..=z1 {
                let wall = x <= x0 + 2 || x >= x1 - 2 || z <= z0 + 2 || z >= z1 - 2;
                if wall {
                    place(rng, f, k, c, x, y, z, KIND_BONE);
                }
            }
        }
    }
    let (cx, cz, rx0, rz0) = (37.0f32, 19.0f32, 10.0f32, 5.0f32);
    for y in 17..=28 {
        let t = (y - 17) as f32 / 11.0;
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
// Gentler taper (0.55 vs 0.85) keeps the shaft near-full width most of the way
// up; the spire tops out at y=41 with the teal tip from y=38. Footprint envelope
// (x 49..61, z 15..23) is unchanged — the z=14 gap to the bridge deck survives.
fn obelisk(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    let (cx, cz) = (55, 19);
    for y in 1..=41 {
        let t = y as f32 / 41.0;
        let hx = (6.0 * (1.0 - 0.55 * t)).round() as i32;
        let hz = (4.0 * (1.0 - 0.55 * t)).round() as i32;
        for x in (cx - hx)..=(cx + hx) {
            for z in (cz - hz)..=(cz + hz) {
                let kind = if y >= 38 { KIND_TEAL } else { KIND_BONE };
                place(rng, f, k, c, x, y, z, kind);
            }
        }
    }
}

// ---- Shared groundworks: a single continuous basalt plinth, two rows thick. ----
// It spans both depth bands (z 3..24) and every structure's x-extent, and runs
// x 1..62 so the widened tower's west face lands on it. Because the support
// solver seeds from y==0, the whole plinth is inherently anchored, so it
// visually ties the district together without creating any cross-structure load
// dependency: severing plinth cells between two structures cannot condemn either.
// Structure footprints overwrite their own y=1 cells, so the second row reads as
// a raised terrace across the open ground only.
fn ground_slab(rng: &mut Rng, f: &mut [u8], k: &mut [u8], c: &mut [u32]) {
    for y in 0..=1 {
        for x in 1..=62 {
            for z in 3..=24 {
                place(rng, f, k, c, x, y, z, KIND_BASALT);
            }
        }
    }
}

// ---- Structure-bounds table (world-space, full-cell ±CELL/2). ----
// Written directly from each structure's frozen grid footprint so the exported
// table is bit-for-bit the §0 table; generation above stays inside these boxes.
fn write_bounds(b: &mut [f32]) {
    set_bounds(b, 0, 18, 45, 0, 28, 3, 13); // hero arch
    set_bounds(b, 1, 1, 13, 0, 40, 3, 13); // tower
    set_bounds(b, 2, 48, 62, 0, 26, 3, 13); // bridge
    set_bounds(b, 3, 3, 25, 0, 40, 14, 24); // ziggurat
    set_bounds(b, 4, 27, 47, 0, 28, 14, 24); // domed hall
    set_bounds(b, 5, 49, 61, 0, 41, 15, 23); // obelisk
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

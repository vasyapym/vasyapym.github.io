//! Ray picking, charge placement, preview, and deterministic voxel carving.

use crate::coords::{self, CELL, D, H, W};
use crate::world::World;

#[inline(always)]
fn finite6(
    a: f32,
    b: f32,
    c: f32,
    d: f32,
    e: f32,
    f: f32,
) -> bool {
    a.is_finite()
        && b.is_finite()
        && c.is_finite()
        && d.is_finite()
        && e.is_finite()
        && f.is_finite()
}

fn normalized_dir(dx: f32, dy: f32, dz: f32) -> Option<(f32, f32, f32)> {
    let magnitude_sq = dx * dx + dy * dy + dz * dz;

    if !magnitude_sq.is_finite() || magnitude_sq < 1.0e-12 {
        return None;
    }

    let inv = 1.0 / magnitude_sq.sqrt();
    Some((dx * inv, dy * inv, dz * inv))
}

#[inline(always)]
fn world_min_x() -> f32 {
    coords::world_x(0) - CELL * 0.5
}

#[inline(always)]
fn world_max_x() -> f32 {
    coords::world_x((W - 1) as i32) + CELL * 0.5
}

#[inline(always)]
fn world_min_y() -> f32 {
    0.0
}

#[inline(always)]
fn world_max_y() -> f32 {
    coords::world_y((H - 1) as i32) + CELL * 0.5
}

#[inline(always)]
fn world_min_z() -> f32 {
    coords::world_z(0) - CELL * 0.5
}

#[inline(always)]
fn world_max_z() -> f32 {
    coords::world_z((D - 1) as i32) + CELL * 0.5
}

fn ray_box(
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
) -> Option<(f32, f32)> {
    let mut lo = 0.0f32;
    let mut hi = f32::INFINITY;

    let slabs = [
        (ox, dx, world_min_x(), world_max_x()),
        (oy, dy, world_min_y(), world_max_y()),
        (oz, dz, world_min_z(), world_max_z()),
    ];

    for &(origin, direction, min_bound, max_bound) in &slabs {
        if direction.abs() < 1.0e-9 {
            if origin < min_bound || origin > max_bound {
                return None;
            }
            continue;
        }

        let inv = 1.0 / direction;
        let mut a = (min_bound - origin) * inv;
        let mut b = (max_bound - origin) * inv;

        if a > b {
            core::mem::swap(&mut a, &mut b);
        }

        lo = lo.max(a);
        hi = hi.min(b);

        if hi < lo {
            return None;
        }
    }

    if hi < 0.0 {
        return None;
    }

    Some((lo.max(0.0), hi))
}

fn dda_pick(
    w: &World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
) -> i32 {
    if !finite6(ox, oy, oz, dx, dy, dz) {
        return -1;
    }

    let Some((dx, dy, dz)) = normalized_dir(dx, dy, dz) else {
        return -1;
    };

    let Some((mut t, t_exit)) = ray_box(ox, oy, oz, dx, dy, dz) else {
        return -1;
    };

    t = (t + 1.0e-5).min(t_exit);

    let min_x = world_min_x();
    let min_y = world_min_y();
    let min_z = world_min_z();

    let max_x = world_max_x();
    let max_y = world_max_y();
    let max_z = world_max_z();

    let mut px = ox + dx * t;
    let mut py = oy + dy * t;
    let mut pz = oz + dz * t;

    px = px.max(min_x + 1.0e-6).min(max_x - 1.0e-6);
    py = py.max(min_y + 1.0e-6).min(max_y - 1.0e-6);
    pz = pz.max(min_z + 1.0e-6).min(max_z - 1.0e-6);

    let mut x = ((px - min_x) / CELL).floor() as i32;
    let mut y = ((py - min_y) / CELL).floor() as i32;
    let mut z = ((pz - min_z) / CELL).floor() as i32;

    if !coords::in_bounds(x, y, z) {
        return -1;
    }

    let sx = if dx > 0.0 {
        1
    } else if dx < 0.0 {
        -1
    } else {
        0
    };

    let sy = if dy > 0.0 {
        1
    } else if dy < 0.0 {
        -1
    } else {
        0
    };

    let sz = if dz > 0.0 {
        1
    } else if dz < 0.0 {
        -1
    } else {
        0
    };

    let tx = if sx > 0 {
        t + ((min_x + (x + 1) as f32 * CELL) - px) / dx
    } else if sx < 0 {
        t + ((min_x + x as f32 * CELL) - px) / dx
    } else {
        f32::INFINITY
    };

    let ty = if sy > 0 {
        t + ((min_y + (y + 1) as f32 * CELL) - py) / dy
    } else if sy < 0 {
        t + ((min_y + y as f32 * CELL) - py) / dy
    } else {
        f32::INFINITY
    };

    let tz = if sz > 0 {
        t + ((min_z + (z + 1) as f32 * CELL) - pz) / dz
    } else if sz < 0 {
        t + ((min_z + z as f32 * CELL) - pz) / dz
    } else {
        f32::INFINITY
    };

    let mut tmx = tx;
    let mut tmy = ty;
    let mut tmz = tz;

    let dtx = if sx != 0 {
        CELL / dx.abs()
    } else {
        f32::INFINITY
    };

    let dty = if sy != 0 {
        CELL / dy.abs()
    } else {
        f32::INFINITY
    };

    let dtz = if sz != 0 {
        CELL / dz.abs()
    } else {
        f32::INFINITY
    };

    while t <= t_exit + 1.0e-5 {
        if x >= 0
            && y >= 0
            && z >= 0
            && x < W as i32
            && y < H as i32
            && z < D as i32
        {
            let i = coords::vidx(x as usize, y as usize, z as usize);

            if w.filled[i] != 0 {
                return i as i32;
            }
        }

        if tmx <= tmy && tmx <= tmz {
            x += sx;
            t = tmx;
            tmx += dtx;
        } else if tmy <= tmz {
            y += sy;
            t = tmy;
            tmy += dty;
        } else {
            z += sz;
            t = tmz;
            tmz += dtz;
        }

        if t > t_exit + 1.0e-5 {
            break;
        }
    }

    -1
}

fn charge_from_hit(
    w: &World,
    hit: usize,
    dx: f32,
    dy: f32,
    dz: f32,
) -> usize {
    let (x0, y0, z0) = coords::coords_of(hit);

    let sx = if dx > 0.0 {
        1
    } else if dx < 0.0 {
        -1
    } else {
        0
    };

    let sy = if dy > 0.0 {
        1
    } else if dy < 0.0 {
        -1
    } else {
        0
    };

    let sz = if dz > 0.0 {
        1
    } else if dz < 0.0 {
        -1
    } else {
        0
    };

    let mut x = x0 as i32;
    let mut y = y0 as i32;
    let mut z = z0 as i32;

    // Starting at the hit voxel center keeps the run traversal deterministic
    // without requiring a second heap allocation for the ray.
    let center_x = x0 as f32 + 0.5;
    let center_y = y0 as f32 + 0.5;
    let center_z = z0 as f32 + 0.5;

    let mut tx = if sx > 0 {
        ((x as f32 + 1.0) - center_x) / dx
    } else if sx < 0 {
        (x as f32 - center_x) / dx
    } else {
        f32::INFINITY
    };

    let mut ty = if sy > 0 {
        ((y as f32 + 1.0) - center_y) / dy
    } else if sy < 0 {
        (y as f32 - center_y) / dy
    } else {
        f32::INFINITY
    };

    let mut tz = if sz > 0 {
        ((z as f32 + 1.0) - center_z) / dz
    } else if sz < 0 {
        (z as f32 - center_z) / dz
    } else {
        f32::INFINITY
    };

    let dtx = if sx != 0 {
        1.0 / dx.abs()
    } else {
        f32::INFINITY
    };

    let dty = if sy != 0 {
        1.0 / dy.abs()
    } else {
        f32::INFINITY
    };

    let dtz = if sz != 0 {
        1.0 / dz.abs()
    } else {
        f32::INFINITY
    };

    let mut run = 1usize;
    let mut samples = [0usize; 128];
    samples[0] = hit;

    while run < samples.len() {
        if tx <= ty && tx <= tz {
            x += sx;
            tx += dtx;
        } else if ty <= tz {
            y += sy;
            ty += dty;
        } else {
            z += sz;
            tz += dtz;
        }

        if !coords::in_bounds(x, y, z) {
            break;
        }

        let i = coords::vidx(x as usize, y as usize, z as usize);

        if w.filled[i] == 0 {
            break;
        }

        samples[run] = i;
        run += 1;
    }

    samples[(run - 1) / 2]
}

#[inline(always)]
fn hash01(seed: u32, i: usize) -> f32 {
    let mut x = (seed as u64)
        .wrapping_add((i as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15));

    x ^= x >> 30;
    x = x.wrapping_mul(0xBF58_476D_1CE4_E5B9);
    x ^= x >> 27;
    x = x.wrapping_mul(0x94D0_49BB_1331_11EB);
    x ^= x >> 31;

    ((x >> 40) as f32) * (1.0 / 16_777_216.0)
}

#[inline(always)]
fn is_victim(
    w: &World,
    i: usize,
    cx: f32,
    cy: f32,
    cz: f32,
    radius: f32,
) -> bool {
    let (px, py, pz) = w.voxel_center(i);

    let dx = px - cx;
    let dy = py - cy;
    let dz = pz - cz;

    let distance_sq = dx * dx + dy * dy + dz * dz;
    let jitter = 0.91 + 0.18 * hash01(w.seed, i);
    let effective_radius = radius * jitter;

    distance_sq <= effective_radius * effective_radius
}

fn victims_for_charge(
    w: &World,
    charge: usize,
    radius: f32,
) -> u32 {
    let (cx, cy, cz) = w.voxel_center(charge);
    let mut count = 0u32;

    for i in 0..w.filled.len() {
        if w.filled[i] != 0
            && is_victim(w, i, cx, cy, cz, radius)
        {
            count += 1;
        }
    }

    count
}

pub fn pick(
    w: &World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
) -> i32 {
    dda_pick(w, ox, oy, oz, dx, dy, dz)
}

pub fn preview(
    w: &World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
) -> u32 {
    let hit = dda_pick(w, ox, oy, oz, dx, dy, dz);

    if hit < 0 {
        return 0;
    }

    let Some((dx, dy, dz)) = normalized_dir(dx, dy, dz) else {
        return 0;
    };

    let charge = charge_from_hit(
        w,
        hit as usize,
        dx,
        dy,
        dz,
    );

    victims_for_charge(w, charge, w.blast_radius * CELL)
}

pub fn blast(
    w: &mut World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
    radius_scale: f32,
) -> u32 {
    let hit = dda_pick(w, ox, oy, oz, dx, dy, dz);

    if hit < 0 {
        return 0;
    }

    let Some((dx, dy, dz)) = normalized_dir(dx, dy, dz) else {
        return 0;
    };

    let charge = charge_from_hit(
        w,
        hit as usize,
        dx,
        dy,
        dz,
    );

    let scale = if radius_scale.is_finite() {
        radius_scale.clamp(0.5, 1.5)
    } else {
        1.0
    };

    let radius = w.blast_radius * scale * CELL;
    let radius_cells = (radius / CELL).max(0.1);

    let (cx, cy, cz) = w.voxel_center(charge);
    let mut victims = 0u32;

    for i in 0..w.filled.len() {
        if w.filled[i] == 0
            || !is_victim(w, i, cx, cy, cz, radius)
        {
            continue;
        }

        let (px, py, pz) = w.voxel_center(i);

        let vx = px - cx;
        let vy = py - cy;
        let vz = pz - cz;

        let distance = (vx * vx + vy * vy + vz * vz)
            .sqrt()
            .max(CELL * 0.25);

        let falloff = (
            1.0
                - distance / (radius_cells * CELL)
        )
        .clamp(0.0, 1.0);

        let nx = vx / distance;
        let ny = vy / distance;
        let nz = vz / distance;

        let (tx, ty, tz) = w.next_seeded_tumble();
        let impulse = 3.2 + 8.5 * falloff;

        crate::debris::spawn_blast(
            w,
            px,
            py,
            pz,
            w.kind[i],
            w.color[i],
            nx * impulse * 0.34,
            ny * impulse * 0.28
                + 3.0
                + 5.0 * falloff,
            nz * impulse * 0.34,
            tx * (0.7 + 2.4 * falloff),
            ty * (0.7 + 2.4 * falloff),
            tz * (0.7 + 2.4 * falloff),
        );

        w.filled[i] = 0;
        w.doomed[i] = 0;
        w.doom_timer[i] = 0.0;
        w.stress_target[i] = 0.0;
        w.stress_shown[i] = 0.0;

        victims += 1;
    }

    if victims != 0 {
        // total remains the frozen blueprint total; standing is recomputed
        // by the packed-instance rebuild.
        w.world_version = w.world_version.wrapping_add(1).max(1);
        w.rebuild_instances();
        w.solve_and_schedule(true);
        w.refresh_stats();
    }

    victims
}

//! Support, distance/load/stress, display lag, and progressive failure.

use crate::coords::{self, D, H, N, W};
use crate::world::World;

#[inline(always)]
fn each_neighbor(i: usize, mut f: impl FnMut(usize)) {
    let x = i % W;
    let z = (i / W) % D;
    let y = i / (W * D);

    if x > 0 {
        f(i - 1);
    }
    if x + 1 < W {
        f(i + 1);
    }
    if z > 0 {
        f(i - W);
    }
    if z + 1 < D {
        f(i + W);
    }
    if y > 0 {
        f(i - W * D);
    }
    if y + 1 < H {
        f(i + W * D);
    }
}

pub fn solve(w: &mut World, _allow_breaks: bool) {
    support_pass(w);
    load_pass(w);
    failure_pass(w);
}

fn support_pass(w: &mut World) {
    w.support.fill(0);

    let mut head = 0usize;
    let mut tail = 0usize;

    // Every filled ground-row voxel is an explicit structural support seed.
    for z in 0..D {
        for x in 0..W {
            let i = coords::vidx(x, 0, z);

            if w.filled[i] != 0 {
                w.support[i] = 1;
                w.support_queue[tail] = i as u32;
                tail += 1;
            }
        }
    }

    while head < tail {
        let i = w.support_queue[head] as usize;
        head += 1;

        each_neighbor(i, |j| {
            if w.filled[j] != 0 && w.support[j] == 0 {
                w.support[j] = 1;
                w.support_queue[tail] = j as u32;
                tail += 1;
            }
        });
    }
}

fn load_pass(w: &mut World) {
    w.distance.fill(u16::MAX);
    w.load.fill(0.0);

    let mut head = 0usize;
    let mut tail = 0usize;

    // Distance 0 is the grounded row. Every voxel carries a unit self-load.
    for z in 0..D {
        for x in 0..W {
            let i = coords::vidx(x, 0, z);

            if w.filled[i] != 0 {
                w.distance[i] = 0;
                w.load[i] = 1.0;
                w.bfs_queue[tail] = i as u32;
                tail += 1;
            }
        }
    }

    // BFS creates nondecreasing distance order, which can be consumed backwards.
    while head < tail {
        let i = w.bfs_queue[head] as usize;
        head += 1;

        let next_distance = w.distance[i].saturating_add(1);

        each_neighbor(i, |j| {
            if w.filled[j] != 0 && w.distance[j] == u16::MAX {
                w.distance[j] = next_distance;
                w.load[j] = 1.0;
                w.bfs_queue[tail] = j as u32;
                tail += 1;
            }
        });
    }

    // Each voxel routes its ENTIRE accumulated load to the single most-loaded
    // neighbour exactly one graph step closer to the ground; ties go to the
    // lowest index (each_neighbor visits in ascending index order, so the
    // strict comparison keeps the first). Real load paths concentrate into a
    // few gravity columns instead of diluting evenly over wide cones, which is
    // what makes a severed bank visibly overload its survivor. The reverse
    // BFS order guarantees all inflow has already arrived when a voxel sends,
    // so the pass is a deterministic DAG accumulation over a drainage tree.
    for pos in (0..tail).rev() {
        let i = w.bfs_queue[pos] as usize;
        let d = w.distance[i];

        if d == 0 {
            continue;
        }

        let mut parent = usize::MAX;
        let mut parent_load = 0.0f32;

        each_neighbor(i, |j| {
            if w.filled[j] != 0
                && w.distance[j] != u16::MAX
                && w.distance[j] + 1 == d
                && w.load[j] > parent_load
            {
                parent = j;
                parent_load = w.load[j];
            }
        });

        if parent != usize::MAX {
            w.load[parent] += w.load[i];
        }
    }

    for i in 0..N {
        w.stress_target[i] = if w.filled[i] != 0 {
            w.load[i] / w.stress_capacity
        } else {
            0.0
        };
    }
}

fn failure_pass(w: &mut World) {
    let h = H as f32;

    for i in 0..N {
        if w.filled[i] == 0 {
            w.doomed[i] = 0;
            w.doom_timer[i] = 0.0;
            continue;
        }

        // Unsupported voxels fail structurally; overloaded supported voxels fail
        // from the stress criterion. Both enter the same visible crack scheduler.
        let condemned = w.support[i] == 0 || w.stress_target[i] >= 1.0;

        if condemned && w.doomed[i] == 0 {
            let (_, y, _) = coords::coords_of(i);

            w.doomed[i] = 1;
            w.doom_timer[i] =
                w.rng.range(0.04, 0.22) + (y as f32 / h) * 0.18;
        }
    }
}

pub fn break_ready(w: &mut World) -> u32 {
    let mut broken = 0u32;

    for i in 0..N {
        if w.filled[i] == 0
            || w.doomed[i] == 0
            || w.doom_timer[i] > 0.0
        {
            continue;
        }

        let (x, y, z) = coords::coords_of(i);
        let (px, py, pz) = w.voxel_center(i);
        let kind = w.kind[i];
        let color = w.color[i];

        // Structural failure gets only a settling nudge, not a blast impulse.
        crate::debris::spawn_settling(
            w,
            px,
            py,
            pz,
            kind,
            color,
            0.10 + (y as f32 / H as f32) * 0.14,
            (x as f32, z as f32),
        );

        w.filled[i] = 0;
        w.doomed[i] = 0;
        w.doom_timer[i] = 0.0;
        w.stress_target[i] = 0.0;
        w.stress_shown[i] = 0.0;
        w.kind[i] = 0;
        w.color[i] = 0;

        broken += 1;
    }

    broken
}

pub fn chase_display(w: &mut World, dt_real: f32) {
    if !dt_real.is_finite() || dt_real <= 0.0 {
        return;
    }

    // dt_real is intentionally not time-dilated: rerouting remains visible during
    // bullet time and collapse cam.
    let step = 4.2 * dt_real.min(0.1);

    for i in 0..N {
        let shown = w.stress_shown[i];
        let target = w.stress_target[i];

        w.stress_shown[i] = if shown < target {
            (shown + step).min(target)
        } else {
            (shown - step).max(target)
        };
    }
}

pub fn solve_and_refresh(w: &mut World) {
    solve(w, false);
    w.refresh_stats();
}

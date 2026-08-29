//! Pooled rigid-body debris. Debris/debris collisions are intentionally omitted:
//! ground contact plus real orientation gives the visible result without an O(n²) narrow phase.

use crate::blueprint::KIND_BASALT;
use crate::coords::CELL;
use crate::world::World;

#[inline(always)]
fn finite3(x: f32, y: f32, z: f32) -> bool {
    x.is_finite() && y.is_finite() && z.is_finite()
}

#[inline(always)]
fn clampf(x: f32, lo: f32, hi: f32) -> f32 {
    x.max(lo).min(hi)
}

fn choose_slot(w: &World) -> usize {
    // Prefer an actually unused pool slot; rubble remains occupied until recycled.
    for i in 0..w.debris_capacity {
        if w.debris_used[i] == 0 {
            return i;
        }
    }

    // The pool is full. Exact oldest-first recycling is O(cap), but it occurs only
    // on spawn pressure and avoids any extra dynamic queue or linked-list storage.
    let mut best = 0usize;
    let mut oldest = u32::MAX;

    for i in 0..w.debris_capacity {
        if w.debris_age[i] < oldest {
            oldest = w.debris_age[i];
            best = i;
        }
    }

    best
}

fn spawn(
    w: &mut World,
    px: f32,
    py: f32,
    pz: f32,
    kind: u8,
    rgb: u32,
    vx: f32,
    vy: f32,
    vz: f32,
    ax: f32,
    ay: f32,
    az: f32,
    blast: bool,
) {
    let slot = choose_slot(w);
    let was_used = w.debris_used[slot] != 0;

    let p = 3 * slot;
    let q = 4 * slot;

    if !was_used {
        w.debris_count += 1;
    }

    w.debris_used[slot] = 1;

    w.debris_age[slot] = w.next_debris_age;
    w.next_debris_age =
        w.next_debris_age.wrapping_add(1).max(1);

    w.debris_pos[p] = px;
    w.debris_pos[p + 1] = py;
    w.debris_pos[p + 2] = pz;

    w.debris_quat[q] = 0.0;
    w.debris_quat[q + 1] = 0.0;
    w.debris_quat[q + 2] = 0.0;
    w.debris_quat[q + 3] = 1.0;

    // Renderer receives half-extents, one voxel per debris piece.
    let half_extent = CELL * 0.5;
    let _ = kind;
    let _ = KIND_BASALT;

    w.debris_scale[p] = half_extent;
    w.debris_scale[p + 1] = half_extent;
    w.debris_scale[p + 2] = half_extent;

    w.debris_rgb[slot] = rgb;

    let impulse_scale = if blast { 1.0 } else { 0.55 };

    w.debris_vel[p] = clampf(
        if finite3(vx, vy, vz) {
            vx * impulse_scale
        } else {
            0.0
        },
        -18.0,
        18.0,
    );

    w.debris_vel[p + 1] = clampf(
        if finite3(vx, vy, vz) {
            vy * impulse_scale
        } else {
            0.0
        },
        -20.0,
        20.0,
    );

    w.debris_vel[p + 2] = clampf(
        if finite3(vx, vy, vz) {
            vz * impulse_scale
        } else {
            0.0
        },
        -18.0,
        18.0,
    );

    w.debris_ang_vel[p] = clampf(
        if finite3(ax, ay, az) { ax } else { 0.0 },
        -24.0,
        24.0,
    );

    w.debris_ang_vel[p + 1] = clampf(
        if finite3(ax, ay, az) { ay } else { 0.0 },
        -24.0,
        24.0,
    );

    w.debris_ang_vel[p + 2] = clampf(
        if finite3(ax, ay, az) { az } else { 0.0 },
        -24.0,
        24.0,
    );

    w.debris_awake[slot] = 1;
}

pub fn spawn_blast(
    w: &mut World,
    px: f32,
    py: f32,
    pz: f32,
    kind: u8,
    rgb: u32,
    vx: f32,
    vy: f32,
    vz: f32,
    ax: f32,
    ay: f32,
    az: f32,
) {
    spawn(
        w, px, py, pz, kind, rgb,
        vx, vy, vz,
        ax, ay, az,
        true,
    );
}

pub fn spawn_settling(
    w: &mut World,
    px: f32,
    py: f32,
    pz: f32,
    kind: u8,
    rgb: u32,
    nudge: f32,
    seed_pos: (f32, f32),
) {
    let (a, b) = seed_pos;

    spawn(
        w,
        px,
        py,
        pz,
        kind,
        rgb,
        (a * 0.013).sin() * nudge,
        0.15 + nudge * 0.25,
        (b * 0.017).cos() * nudge,
        a * 0.008,
        b * 0.008,
        (a - b) * 0.004,
        false,
    );
}

fn normalize_quat(
    x: f32,
    y: f32,
    z: f32,
    w: f32,
) -> (f32, f32, f32, f32) {
    let magnitude = (x * x + y * y + z * z + w * w).sqrt();

    if magnitude.is_finite() && magnitude > 1.0e-7 {
        (
            x / magnitude,
            y / magnitude,
            z / magnitude,
            w / magnitude,
        )
    } else {
        (0.0, 0.0, 0.0, 1.0)
    }
}

pub fn integrate(w: &mut World, dt: f32) {
    if !dt.is_finite() || dt <= 0.0 {
        return;
    }

    for i in 0..w.debris_capacity {
        if w.debris_used[i] == 0 || w.debris_awake[i] == 0 {
            continue;
        }

        let p = 3 * i;
        let q = 4 * i;

        let mut x = w.debris_pos[p];
        let mut y = w.debris_pos[p + 1];
        let mut z = w.debris_pos[p + 2];

        let mut vx = w.debris_vel[p];
        let mut vy =
            w.debris_vel[p + 1] + w.gravity * dt;
        let mut vz = w.debris_vel[p + 2];

        vx = clampf(vx, -22.0, 22.0);
        vy = clampf(vy, -24.0, 24.0);
        vz = clampf(vz, -22.0, 22.0);

        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        let half_height =
            w.debris_scale[p + 1].abs();

        if y - half_height < 0.0 {
            y = half_height.max(0.0);

            if vy < 0.0 {
                vy = -vy * w.restitution;
                vx *= w.friction;
                vz *= w.friction;
            } else {
                vy *= 0.5;
            }
        }

        let angular_damp =
            (1.0 - 0.55 * dt).max(0.0);

        let ax = w.debris_ang_vel[p] * angular_damp;
        let ay = w.debris_ang_vel[p + 1] * angular_damp;
        let az = w.debris_ang_vel[p + 2] * angular_damp;

        let qx = w.debris_quat[q];
        let qy = w.debris_quat[q + 1];
        let qz = w.debris_quat[q + 2];
        let qw = w.debris_quat[q + 3];

        // Small-angle quaternion integration:
        // dq/dt = 1/2 * omega_quat * q.
        let half_x = 0.5 * ax * dt;
        let half_y = 0.5 * ay * dt;
        let half_z = 0.5 * az * dt;

        let next_x =
            qx + (half_x * qw
                + half_y * qz
                - half_z * qy);

        let next_y =
            qy + (half_y * qw
                + half_z * qx
                - half_x * qz);

        let next_z =
            qz + (half_z * qw
                + half_x * qy
                - half_y * qx);

        let next_w =
            qw + (-half_x * qx
                - half_y * qy
                - half_z * qz);

        let (qx, qy, qz, qw) =
            normalize_quat(
                next_x,
                next_y,
                next_z,
                next_w,
            );

        let mut rx = x;
        let mut ry = y;
        let mut rz = z;
        let mut rvx = vx;
        let mut rvy = vy;
        let mut rvz = vz;
        let mut rax = ax;
        let mut ray = ay;
        let mut raz = az;

        // A bad impulse must never contaminate renderer-visible state.
        if !finite3(rx, ry, rz)
            || !finite3(rvx, rvy, rvz)
            || !finite3(rax, ray, raz)
        {
            rx = 0.0;
            ry = half_height.max(0.0);
            rz = 0.0;

            rvx = 0.0;
            rvy = 0.0;
            rvz = 0.0;

            rax = 0.0;
            ray = 0.0;
            raz = 0.0;
        }

        w.debris_pos[p] = rx;
        w.debris_pos[p + 1] = ry;
        w.debris_pos[p + 2] = rz;

        w.debris_vel[p] = rvx;
        w.debris_vel[p + 1] = rvy;
        w.debris_vel[p + 2] = rvz;

        w.debris_ang_vel[p] = rax;
        w.debris_ang_vel[p + 1] = ray;
        w.debris_ang_vel[p + 2] = raz;

        w.debris_quat[q] = qx;
        w.debris_quat[q + 1] = qy;
        w.debris_quat[q + 2] = qz;
        w.debris_quat[q + 3] = qw;

        let horizontal_speed =
            (rvx * rvx + rvz * rvz).sqrt();

        if rvy.abs() < 0.55
            && horizontal_speed < 0.4
        {
            w.debris_awake[i] = 0;
        }
    }
}

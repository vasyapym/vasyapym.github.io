#![allow(clippy::missing_safety_doc)]

mod blast;
mod blueprint;
mod coords;
mod debris;
mod rng;
mod solvers;
mod world;

use world::World;

#[inline(always)]
fn valid(
    w: *mut World,
) -> Option<&'static mut World> {
    if w.is_null() {
        None
    } else {
        unsafe { Some(&mut *w) }
    }
}

#[inline(always)]
fn offset<T>(ptr: *const T) -> u32 {
    ptr as usize as u32
}

#[no_mangle]
pub extern "C" fn core_init(
    seed: u32,
    debris_capacity: u32,
    stress_capacity: f32,
    blast_radius: f32,
) -> *mut World {
    Box::into_raw(Box::new(World::init(
        seed,
        debris_capacity,
        stress_capacity,
        blast_radius,
    )))
}

#[no_mangle]
pub extern "C" fn core_dispose(
    w: *mut World,
) {
    if !w.is_null() {
        unsafe {
            drop(Box::from_raw(w));
        }
    }
}

#[no_mangle]
pub extern "C" fn core_restore(
    w: *mut World,
) {
    if let Some(w) = valid(w) {
        w.restore();
    }
}

#[no_mangle]
pub extern "C" fn core_step(
    w: *mut World,
    mut dt_sim: f32,
    dt_real: f32,
) {
    if let Some(w) = valid(w) {
        if !dt_sim.is_finite() {
            dt_sim = 0.0;
        }

        // The caller already applies bullet-time/collapse-cam dilation.
        dt_sim = dt_sim.clamp(0.0, 0.05);

        w.accumulator =
            (w.accumulator + dt_sim).min(0.25);

        while w.accumulator >= world::FIXED_DT {
            w.accumulator -= world::FIXED_DT;
            w.advance_substep(world::FIXED_DT);
        }

        // Stress is re-solved every frame even when there was no substep.
        // Display lag uses real time and is therefore not slowed by bullet time.
        solvers::solve_and_refresh(w);
        solvers::chase_display(w, dt_real);
        w.refresh_stats();
    }
}

#[no_mangle]
pub extern "C" fn core_pick(
    w: *mut World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
) -> i32 {
    if let Some(w) = valid(w) {
        blast::pick(
            w, ox, oy, oz,
            dx, dy, dz,
        )
    } else {
        -1
    }
}

#[no_mangle]
pub extern "C" fn core_preview_victims(
    w: *mut World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
) -> u32 {
    if let Some(w) = valid(w) {
        blast::preview(
            w, ox, oy, oz,
            dx, dy, dz,
        )
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn core_blast(
    w: *mut World,
    ox: f32,
    oy: f32,
    oz: f32,
    dx: f32,
    dy: f32,
    dz: f32,
    radius_scale: f32,
) -> u32 {
    if let Some(w) = valid(w) {
        blast::blast(
            w,
            ox,
            oy,
            oz,
            dx,
            dy,
            dz,
            radius_scale,
        )
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn core_set_params(
    w: *mut World,
    gravity: f32,
    blast_radius: f32,
    stress_capacity: f32,
    restitution: f32,
    friction: f32,
) {
    if let Some(w) = valid(w) {
        if gravity.is_finite() {
            w.gravity = gravity.clamp(-100.0, 0.0);
        }

        if blast_radius.is_finite() {
            w.blast_radius =
                blast_radius.clamp(0.5, 12.0);
        }

        if stress_capacity.is_finite()
            && stress_capacity > 0.01
        {
            w.stress_capacity =
                stress_capacity.clamp(0.05, 1000.0);
        }

        if restitution.is_finite() {
            w.restitution =
                restitution.clamp(0.0, 1.0);
        }

        if friction.is_finite() {
            w.friction =
                friction.clamp(0.0, 1.0);
        }
    }
}

#[no_mangle]
pub extern "C" fn core_dims_w(
    _w: *mut World,
) -> u32 {
    coords::W as u32
}

#[no_mangle]
pub extern "C" fn core_dims_h(
    _w: *mut World,
) -> u32 {
    coords::H as u32
}

#[no_mangle]
pub extern "C" fn core_dims_d(
    _w: *mut World,
) -> u32 {
    coords::D as u32
}

#[no_mangle]
pub extern "C" fn core_total(
    w: *mut World,
) -> u32 {
    valid(w).map_or(0, |w| w.total)
}

#[no_mangle]
pub extern "C" fn core_standing(
    w: *mut World,
) -> u32 {
    valid(w).map_or(0, |w| w.standing)
}

#[no_mangle]
pub extern "C" fn core_debris_capacity(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| w.debris_capacity as u32,
    )
}

#[no_mangle]
pub extern "C" fn core_structure_count(
    _w: *mut World,
) -> u32 {
    blueprint::STRUCTURE_COUNT as u32
}

#[no_mangle]
pub extern "C" fn core_world_version(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| w.world_version,
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_filled(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.filled.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_kind(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.kind.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_color(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.color.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_doomed(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.doomed.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_stress_target(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.stress_target.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_stress_shown(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.stress_shown.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_instance_of_voxel(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.instance_of_voxel.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_voxel_of_instance(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.voxel_of_instance.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_debris_pos(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.debris_pos.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_debris_quat(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.debris_quat.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_debris_scale(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.debris_scale.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_debris_rgb(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.debris_rgb.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_debris_awake(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.debris_awake.as_ptr()),
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_stats(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| {
            offset(
                core::ptr::addr_of!(w.stats)
                    .cast::<u32>(),
            )
        },
    )
}

#[no_mangle]
pub extern "C" fn core_ptr_bounds(
    w: *mut World,
) -> u32 {
    valid(w).map_or(
        0,
        |w| offset(w.bounds.as_ptr()),
    )
}

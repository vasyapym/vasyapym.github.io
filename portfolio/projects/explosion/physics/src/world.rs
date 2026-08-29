//! Simulation container. All steady-state buffers are allocated here during init.

use crate::blueprint::{self, STRUCTURE_COUNT};
use crate::coords::{self, N};
use crate::rng::Rng;

pub const FIXED_DT: f32 = 1.0 / 120.0;

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct StatsBlock {
    pub standing: u32,
    pub doomed: u32,
    pub debris: u32,
    pub debris_awake: u32,
    pub peak_stress: f32,
    pub world_version: u32,
}

pub struct World {
    pub seed: u32,
    pub rng: Rng,

    // Frozen renderer-facing voxel buffers.
    pub filled: Vec<u8>,
    pub kind: Vec<u8>,
    pub color: Vec<u32>,
    pub doomed: Vec<u8>,
    pub stress_target: Vec<f32>,
    pub stress_shown: Vec<f32>,
    pub instance_of_voxel: Vec<i32>,
    pub voxel_of_instance: Vec<u32>,

    // Fixed-capacity solver scratch.
    pub doom_timer: Vec<f32>,
    pub support: Vec<u8>,
    pub distance: Vec<u16>,
    pub load: Vec<f32>,
    pub support_queue: Vec<u32>,
    pub bfs_queue: Vec<u32>,

    // Frozen renderer-facing debris SoA.
    pub debris_pos: Vec<f32>,
    pub debris_quat: Vec<f32>,
    pub debris_scale: Vec<f32>,
    pub debris_rgb: Vec<u32>,
    pub debris_awake: Vec<u8>,

    // Hidden debris state kept at the same fixed pool capacity.
    pub debris_used: Vec<u8>,
    pub debris_vel: Vec<f32>,
    pub debris_ang_vel: Vec<f32>,
    pub debris_age: Vec<u32>,
    pub debris_recycle_cursor: usize,
    pub debris_count: u32,
    pub next_debris_age: u32,
    pub debris_capacity: usize,

    pub bounds: Vec<f32>,
    pub stats: StatsBlock,

    // total is the blueprint total; standing is the current filled count.
    pub total: u32,
    pub standing: u32,
    pub doomed_count: u32,
    pub world_version: u32,

    // Runtime tuning.
    pub gravity: f32,
    pub blast_radius: f32,
    pub stress_capacity: f32,
    pub restitution: f32,
    pub friction: f32,

    pub accumulator: f32,
}

impl World {
    pub fn init(
        seed: u32,
        debris_capacity: u32,
        stress_capacity: f32,
        blast_radius: f32,
    ) -> Self {
        let cap = (debris_capacity as usize).max(1);

        let mut world = Self {
            seed,
            rng: Rng::new(seed as u64 ^ 0xD1B5_54A3_91E1_9E37),

            filled: vec![0; N],
            kind: vec![0; N],
            color: vec![0; N],
            doomed: vec![0; N],
            stress_target: vec![0.0; N],
            stress_shown: vec![0.0; N],
            instance_of_voxel: vec![-1; N],
            voxel_of_instance: vec![0; N],

            doom_timer: vec![0.0; N],
            support: vec![0; N],
            distance: vec![u16::MAX; N],
            load: vec![0.0; N],
            support_queue: vec![0; N],
            bfs_queue: vec![0; N],

            debris_pos: vec![0.0; 3 * cap],
            debris_quat: vec![0.0; 4 * cap],
            debris_scale: vec![0.0; 3 * cap],
            debris_rgb: vec![0; cap],
            debris_awake: vec![0; cap],

            debris_used: vec![0; cap],
            debris_vel: vec![0.0; 3 * cap],
            debris_ang_vel: vec![0.0; 3 * cap],
            debris_age: vec![0; cap],
            debris_recycle_cursor: 0,
            debris_count: 0,
            next_debris_age: 1,
            debris_capacity: cap,

            bounds: vec![0.0; STRUCTURE_COUNT * 6],
            stats: StatsBlock::default(),

            total: 0,
            standing: 0,
            doomed_count: 0,
            world_version: 0,

            gravity: -13.0,
            blast_radius: if blast_radius.is_finite() {
                blast_radius.max(0.5)
            } else {
                3.4
            },
            stress_capacity: if stress_capacity.is_finite() && stress_capacity > 0.01 {
                stress_capacity
            } else {
                390.0
            },
            restitution: 0.36,
            friction: 0.68,

            accumulator: 0.0,
        };

        blueprint::generate(
            seed,
            &mut world.filled,
            &mut world.kind,
            &mut world.color,
            &mut world.bounds,
        );

        world.total = world
            .filled
            .iter()
            .map(|&v| v as u32)
            .sum();

        world.rebuild_instances();

        // Restore exactly the same simulation RNG state on every fresh init.
        world.rng = Rng::new(seed as u64 ^ 0xD1B5_54A3_91E1_9E37);

        world.solve_and_schedule(false);
        world.stress_shown.copy_from_slice(&world.stress_target);

        world.world_version = 1;
        world.refresh_stats();
        world
    }

    pub fn restore(&mut self) {
        blueprint::generate(
            self.seed,
            &mut self.filled,
            &mut self.kind,
            &mut self.color,
            &mut self.bounds,
        );

        self.rng = Rng::new(self.seed as u64 ^ 0xD1B5_54A3_91E1_9E37);

        self.doomed.fill(0);
        self.doom_timer.fill(0.0);
        self.stress_target.fill(0.0);
        self.stress_shown.fill(0.0);

        self.clear_debris();

        self.total = self
            .filled
            .iter()
            .map(|&v| v as u32)
            .sum();

        self.doomed_count = 0;
        self.accumulator = 0.0;

        self.rebuild_instances();
        self.solve_and_schedule(false);
        self.stress_shown.copy_from_slice(&self.stress_target);

        self.world_version = self.world_version.wrapping_add(1).max(1);
        self.refresh_stats();
    }

    pub fn rebuild_instances(&mut self) {
        self.instance_of_voxel.fill(-1);

        let mut slot = 0usize;
        for i in 0..N {
            if self.filled[i] != 0 {
                self.instance_of_voxel[i] = slot as i32;
                self.voxel_of_instance[slot] = i as u32;
                slot += 1;
            }
        }

        self.standing = slot as u32;
    }

    fn clear_debris(&mut self) {
        self.debris_used.fill(0);
        self.debris_awake.fill(0);
        self.debris_count = 0;
        self.debris_recycle_cursor = 0;
        self.next_debris_age = 1;
    }

    pub fn refresh_stats(&mut self) {
        let mut peak = 0.0f32;
        let mut doomed = 0u32;

        for i in 0..N {
            if self.filled[i] != 0 {
                peak = peak.max(self.stress_target[i]);
                doomed += self.doomed[i] as u32;
            }
        }

        let mut awake = 0u32;
        for i in 0..self.debris_capacity {
            awake += self.debris_awake[i] as u32;
        }

        self.standing = self.standing.min(self.total);
        self.doomed_count = doomed;

        self.stats = StatsBlock {
            standing: self.standing,
            doomed,
            debris: self.debris_count,
            debris_awake: awake,
            peak_stress: peak,
            world_version: self.world_version,
        };
    }

    pub fn solve_and_schedule(&mut self, allow_breaks: bool) {
        crate::solvers::solve(self, allow_breaks);
    }

    pub fn advance_substep(&mut self, dt: f32) {
        crate::debris::integrate(self, dt);

        let mut ready = false;

        for i in 0..N {
            if self.doomed[i] != 0 {
                self.doom_timer[i] -= dt;
                if self.doom_timer[i] <= 0.0 {
                    ready = true;
                }
            }
        }

        if ready {
            let broken = crate::solvers::break_ready(self);

            if broken != 0 {
                self.world_version = self.world_version.wrapping_add(1).max(1);
                self.rebuild_instances();

                // Recompute support/load/failure immediately after actual removal.
                self.solve_and_schedule(true);
            }
        }

        self.refresh_stats();
    }

    #[inline(always)]
    pub fn voxel_center(&self, i: usize) -> (f32, f32, f32) {
        let (x, y, z) = coords::coords_of(i);
        (
            coords::world_x(x as i32),
            coords::world_y(y as i32),
            coords::world_z(z as i32),
        )
    }

    #[inline(always)]
    pub fn next_seeded_tumble(&mut self) -> (f32, f32, f32) {
        (
            self.rng.range(-2.8, 2.8),
            self.rng.range(-3.6, 3.6),
            self.rng.range(-2.8, 2.8),
        )
    }
}

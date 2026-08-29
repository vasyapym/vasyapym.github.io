//! Deterministic RNG threaded explicitly (no global entropy, no std::time).
//! splitmix64 mixes the incoming seed; a xorshift64* stream produces values.
//! Same seed + same call order => identical states across runs and machines.

pub struct Rng {
    state: u64,
}

impl Rng {
    /// splitmix64 finaliser turns any seed (even 0) into a well-mixed state.
    pub fn new(seed: u64) -> Self {
        let mut z = seed.wrapping_add(0x9E37_79B9_7F4A_7C15);
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^= z >> 31;
        // xorshift64* must never start at 0.
        Rng { state: if z == 0 { 0x9E37_79B9_7F4A_7C15 } else { z } }
    }

    #[inline(always)]
    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        x.wrapping_mul(0x2545_F491_4F6C_DD1D)
    }

    /// Uniform f32 in [0,1) using the top 24 bits (full mantissa precision).
    #[inline(always)]
    pub fn next_f32(&mut self) -> f32 {
        ((self.next_u64() >> 40) as f32) * (1.0 / 16_777_216.0)
    }

    #[inline(always)]
    pub fn range(&mut self, lo: f32, hi: f32) -> f32 {
        lo + (hi - lo) * self.next_f32()
    }

    #[inline(always)]
    pub fn chance(&mut self, p: f32) -> bool {
        self.next_f32() < p
    }
}

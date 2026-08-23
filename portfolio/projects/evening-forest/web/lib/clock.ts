// Shared shader clock. Every animated material (foliage wind, fireflies,
// light shafts, sky twinkle) reads this one uniform, and the WindClock
// component advances it exactly once per frame.
export const windUniform = { value: 0 };

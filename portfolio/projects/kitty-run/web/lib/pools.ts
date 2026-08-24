// Fixed-size object pool with round-robin acquisition. Everything the run
// spawns (obstacles, pickups, particles) lives in a pool, so gameplay
// allocates nothing per frame and the GC never interrupts a run.

export type PoolSlot<T> = {
  active: boolean;
  data: T;
};

export type Pool<T> = {
  slots: readonly PoolSlot<T>[];
  acquire: () => PoolSlot<T> | null;
  release: (slot: PoolSlot<T>) => void;
  releaseAll: () => void;
};

export function createPool<T>(size: number, make: (index: number) => T): Pool<T> {
  const slots: PoolSlot<T>[] = [];
  for (let i = 0; i < size; i += 1) {
    slots.push({ active: false, data: make(i) });
  }
  let cursor = 0;

  const acquire = (): PoolSlot<T> | null => {
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[(cursor + i) % slots.length];
      if (!slot.active) {
        cursor = (cursor + i + 1) % slots.length;
        slot.active = true;
        return slot;
      }
    }
    return null;
  };

  const release = (slot: PoolSlot<T>): void => {
    slot.active = false;
  };

  const releaseAll = (): void => {
    for (const slot of slots) slot.active = false;
  };

  return { slots, acquire, release, releaseAll };
}

export function activeCount<T>(pool: Pool<T>): number {
  let count = 0;
  for (const slot of pool.slots) {
    if (slot.active) count += 1;
  }
  return count;
}

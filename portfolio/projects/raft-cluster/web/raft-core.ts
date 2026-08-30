// web/raft-core.ts — WebAssembly loader + typed wrapper around the Raft C ABI (revision 1).

/** Decoded StatusReport (wire frame type 5), all fields as JS numbers. */
export type StatusReport = {
  role: "follower" | "candidate" | "leader";
  term: number;
  leaderId: number;
  commitIndex: number;
  lastApplied: number;
  logLen: number;
  votedFor: number;
};

/** One outbound message drained from a node's outbox. `frame` is a private copy. */
export type Outbound = { to: number; frame: Uint8Array };

/** One log entry from a log-slice batch. `data` is a private copy. */
export type LogEntry = { term: number; data: Uint8Array };

/** High-level, BigInt-free wrapper over the wasm core. All reads return copies. */
export type RaftCore = {
  /** ABI version reported by the core (expected: 1). */
  version(): number;
  /** Create a node; returns a handle > 0, or 0 on failure. */
  newNode(
    id: number,
    peers: number[],
    timing: { minMs: number; maxMs: number; heartbeatMs: number },
    seed: number,
    nowMs: number,
  ): number;
  /** Free a node handle (safe on 0). */
  freeNode(handle: number): void;
  /** Advance a node's clock; elections/heartbeats fire on timeout. */
  tick(handle: number, nowMs: number): void;
  /** Feed one wire frame; 0 ok / -1 bad handle / -2 decode failure. */
  step(handle: number, from: number, frame: Uint8Array, nowMs: number): number;
  /** Propose a command; `index` >= 1 on success, else 0 with a `leaderHint`, or -1 on bad handle. */
  propose(handle: number, data: Uint8Array): { index: number; leaderHint: number };
  /** Read the node's StatusReport (decodes the type-5 frame). */
  status(handle: number): StatusReport;
  /** Drain the node's outbox into a list of copies. */
  takeOutbound(handle: number): Outbound[];
  /** Read up to `max` log entries starting at 1-based `start` (clamped). */
  logSlice(handle: number, start: number, max: number): LogEntry[];
};

/** Raw wasm exports, typed exactly (u64 params/returns as BigInt; usize/u32 as number). */
interface RawExports {
  readonly memory: WebAssembly.Memory;
  raft_abi_version(): number;
  raft_abi_alloc(len: number): number;
  raft_abi_free(ptr: number, len: number): void;
  raft_node_new(
    id: bigint,
    peersPtr: number,
    peersLen: number,
    etMin: bigint,
    etMax: bigint,
    hb: bigint,
    seed: bigint,
    nowMs: bigint,
  ): number;
  raft_node_free(h: number): void;
  raft_node_tick(h: number, nowMs: bigint): void;
  raft_node_step(h: number, from: bigint, framePtr: number, frameLen: number, nowMs: bigint): number;
  raft_node_propose(h: number, dataPtr: number, dataLen: number, hintPtr: number): bigint;
  raft_node_status(h: number, outPtr: number, cap: number): number;
  raft_node_take_outbound(h: number, outPtr: number, cap: number): number;
  raft_node_log_slice(h: number, startIndex: bigint, max: number, outPtr: number, cap: number): number;
}

/**
 * Load `raft_core.wasm` (resolved relative to this module) and return a typed wrapper.
 * Uses `instantiateStreaming` with an ArrayBuffer fallback for bad MIME types.
 */
export async function loadRaftCore(): Promise<RaftCore> {
  if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly is not available in this environment");
  }
  const url = new URL("./raft_core.wasm", import.meta.url);
  const importObject: WebAssembly.Imports = {};

  let instance: WebAssembly.Instance;
  try {
    const result = await WebAssembly.instantiateStreaming(fetch(url), importObject);
    instance = result.instance;
  } catch {
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    const result = await WebAssembly.instantiate(bytes, importObject);
    instance = result.instance;
  }
  return new RaftCoreImpl(instance.exports as unknown as RawExports);
}

/** Concrete wrapper; owns buffer plumbing and BigInt↔number conversion. */
class RaftCoreImpl implements RaftCore {
  private readonly raw: RawExports;

  constructor(raw: RawExports) {
    this.raw = raw;
  }

  version(): number {
    return this.raw.raft_abi_version();
  }

  newNode(
    id: number,
    peers: number[],
    timing: { minMs: number; maxMs: number; heartbeatMs: number },
    seed: number,
    nowMs: number,
  ): number {
    const bytes = peers.length * 8;
    const call = (ptr: number): number =>
      this.raw.raft_node_new(
        BigInt(id),
        ptr,
        peers.length,
        BigInt(timing.minMs),
        BigInt(timing.maxMs),
        BigInt(timing.heartbeatMs),
        BigInt(seed),
        BigInt(nowMs),
      );

    if (bytes === 0) {
      return call(0);
    }

    const ptr = this.allocOrThrow(bytes);
    try {
      // Native-endian u64 array; wasm linear memory is little-endian.
      const view = new DataView(this.raw.memory.buffer, ptr, bytes);
      for (let i = 0; i < peers.length; i++) {
        view.setBigUint64(i * 8, BigInt(peers[i]), true);
      }
      return call(ptr);
    } finally {
      this.raw.raft_abi_free(ptr, bytes);
    }
  }

  freeNode(handle: number): void {
    this.raw.raft_node_free(handle);
  }

  tick(handle: number, nowMs: number): void {
    this.raw.raft_node_tick(handle, BigInt(nowMs));
  }

  step(handle: number, from: number, frame: Uint8Array, nowMs: number): number {
    return this.withInput(frame, (ptr, len) =>
      this.raw.raft_node_step(handle, BigInt(from), ptr, len, BigInt(nowMs)),
    );
  }

  propose(handle: number, data: Uint8Array): { index: number; leaderHint: number } {
    const hintPtr = this.allocOrThrow(8);
    try {
      // Zero the hint slot before the call.
      new Uint8Array(this.raw.memory.buffer, hintPtr, 8).fill(0);
      const result = this.withInput(data, (ptr, len) =>
        this.raw.raft_node_propose(handle, ptr, len, hintPtr),
      );
      if (result >= 1n) {
        return { index: Number(result), leaderHint: 0 };
      }
      if (result === 0n) {
        // Fresh view: the input alloc above may have detached the buffer.
        const view = new DataView(this.raw.memory.buffer, hintPtr, 8);
        return { index: 0, leaderHint: Number(view.getBigUint64(0, true)) };
      }
      // result === -1n (bad handle).
      return { index: Number(result), leaderHint: 0 };
    } finally {
      this.raw.raft_abi_free(hintPtr, 8);
    }
  }

  status(handle: number): StatusReport {
    const bytes = this.copyOut((ptr, cap) => this.raw.raft_node_status(handle, ptr, cap));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // Layout: [type=5][role u8][term][leaderId][commit][lastApplied][logLen][votedFor].
    const roleByte = view.getUint8(1);
    const role: StatusReport["role"] =
      roleByte === 2 ? "leader" : roleByte === 1 ? "candidate" : "follower";
    return {
      role,
      term: Number(view.getBigUint64(2, true)),
      leaderId: Number(view.getBigUint64(10, true)),
      commitIndex: Number(view.getBigUint64(18, true)),
      lastApplied: Number(view.getBigUint64(26, true)),
      logLen: Number(view.getBigUint64(34, true)),
      votedFor: Number(view.getBigUint64(42, true)),
    };
  }

  takeOutbound(handle: number): Outbound[] {
    const bytes = this.copyOut((ptr, cap) => this.raw.raft_node_take_outbound(handle, ptr, cap));
    if (bytes.byteLength < 4) return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(0, true);
    const out: Outbound[] = [];
    let off = 4;
    for (let i = 0; i < count; i++) {
      const to = Number(view.getBigUint64(off, true));
      off += 8;
      const frameLen = view.getUint32(off, true);
      off += 4;
      const frame = bytes.slice(off, off + frameLen);
      off += frameLen;
      out.push({ to, frame });
    }
    return out;
  }

  logSlice(handle: number, start: number, max: number): LogEntry[] {
    const bytes = this.copyOut((ptr, cap) =>
      this.raw.raft_node_log_slice(handle, BigInt(start), max, ptr, cap),
    );
    if (bytes.byteLength < 4) return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(0, true);
    const out: LogEntry[] = [];
    let off = 4;
    for (let i = 0; i < count; i++) {
      const term = Number(view.getBigUint64(off, true));
      off += 8;
      const dataLen = view.getUint32(off, true);
      off += 4;
      const data = bytes.slice(off, off + dataLen);
      off += dataLen;
      out.push({ term, data });
    }
    return out;
  }

  /** Allocate `len` bytes in wasm memory, throwing on null. */
  private allocOrThrow(len: number): number {
    const ptr = this.raw.raft_abi_alloc(len);
    if (ptr === 0) {
      throw new Error(`raft_abi_alloc returned null for ${len} bytes`);
    }
    return ptr;
  }

  /**
   * Copy an input buffer into wasm memory, invoke `fn(ptr, len)`, then free.
   * Views are created after allocation (the buffer detaches on growth).
   */
  private withInput<T>(bytes: Uint8Array, fn: (ptr: number, len: number) => T): T {
    const len = bytes.length;
    if (len === 0) {
      return fn(0, 0);
    }
    const ptr = this.allocOrThrow(len);
    try {
      new Uint8Array(this.raw.memory.buffer, ptr, len).set(bytes);
      return fn(ptr, len);
    } finally {
      this.raw.raft_abi_free(ptr, len);
    }
  }

  /**
   * Buffer protocol reader: probe with cap 0 → needed length → alloc → call →
   * copy the written bytes into a fresh JS array → free. Never retains a pointer.
   */
  private copyOut(call: (ptr: number, cap: number) => number): Uint8Array {
    const needed = call(0, 0);
    if (needed < 0) {
      throw new Error(`raft core reported error ${needed}`);
    }
    if (needed === 0) {
      return new Uint8Array(0);
    }
    const ptr = this.allocOrThrow(needed);
    try {
      const written = call(ptr, needed);
      if (written < 0) {
        throw new Error(`raft core reported error ${written}`);
      }
      // slice() copies into a detached-from-wasm ArrayBuffer.
      return new Uint8Array(this.raw.memory.buffer, ptr, written).slice();
    } finally {
      this.raw.raft_abi_free(ptr, needed);
    }
  }
}

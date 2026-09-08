// web/cluster.ts — framework-free simulated Raft cluster driven by the wasm core (revision 1).

import type { RaftCore, StatusReport } from "./raft-core";

/** A human-readable, timestamped thing that happened in the sim (for the event feed). */
export type SimEvent = {
  tMs: number;
  kind: "election" | "commit" | "crash" | "recover" | "link" | "propose";
  text: string;
};

/** Per-node render state pulled once per {@link ClusterSim.snapshot}. */
export type NodeView = {
  id: number;
  alive: boolean;
  status: StatusReport;
  /** Term of every log entry (committed + uncommitted). */
  logTerms: number[];
  /** Terms of the committed prefix only (length === commitIndex). */
  committedTerms: number[];
};

/** One message currently traversing the simulated network. */
export type InflightView = {
  from: number;
  to: number;
  kind: "rv" | "rvr" | "ae" | "aer";
  sentAt: number;
  deliverAt: number;
};

/** Immutable view of the whole cluster at one instant of sim time. */
export type Snapshot = {
  nowMs: number;
  nodes: NodeView[];
  inflight: InflightView[];
  cuts: string[];
  leaderId: number | null;
  events: SimEvent[];
};

/** Fixed simulation quantum in milliseconds. */
const QUANTUM_MS = 10;
/** Base one-way network latency before jitter. */
const LATENCY_BASE_MS = 40;
/** Upper bound (exclusive) of the added latency jitter. */
const LATENCY_JITTER_MS = 40;
/** Event ring-buffer capacity. */
const MAX_EVENTS = 40;
/** Safety valve: never process more quanta than this in a single advance() call. */
const MAX_QUANTA_PER_ADVANCE = 4000;

/** Election/heartbeat timing shared by every node (matches the Rust sim). */
const TIMING = { minMs: 900, maxMs: 1800, heartbeatMs: 250 } as const;

/** 64-bit mask for splitmix64 arithmetic in BigInt. */
const MASK64 = (1n << 64n) - 1n;

/**
 * splitmix64 — the same generator (and constants) the Rust core uses, so
 * latency draws are reproducible from the cluster seed alone.
 */
class SplitMix64 {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = seed & MASK64;
  }

  /** Next raw 64-bit value. */
  private next(): bigint {
    this.state = (this.state + 0x9e3779b97f4a7c15n) & MASK64;
    let z = this.state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    z = z ^ (z >> 31n);
    return z & MASK64;
  }

  /** Uniform integer in `[0, bound)`; `bound` must be a positive integer. */
  below(bound: number): number {
    return Number(this.next() % BigInt(bound));
  }
}

/** Internal per-node bookkeeping (the wasm handle plus delta-tracking state). */
type SimNode = {
  id: number;
  handle: number;
  alive: boolean;
  prev: { role: StatusReport["role"]; term: number };
};

/** An in-flight message, including the raw frame we still need to deliver. */
type Inflight = InflightView & { frame: Uint8Array };

/** Classify a wire frame by its leading type byte; `null` for unknown types. */
function frameKind(frame: Uint8Array): InflightView["kind"] | null {
  switch (frame.length > 0 ? frame[0] : -1) {
    case 1:
      return "rv";
    case 2:
      return "rvr";
    case 3:
      return "ae";
    case 4:
      return "aer";
    default:
      return null;
  }
}

/** Canonical, order-independent key for the link between two node ids. */
function linkKey(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}-${hi}`;
}

/**
 * A live Raft cluster: real consensus (every node is a wasm core handle),
 * simulated network. Drive it with {@link advance}; read it with {@link snapshot}.
 */
export class ClusterSim {
  private readonly core: RaftCore;
  private readonly nodes: SimNode[];
  private readonly rng: SplitMix64;
  private readonly cuts = new Set<string>();
  private readonly events: SimEvent[] = [];
  private readonly decoder = new TextDecoder();

  private inflight: Inflight[] = [];
  private nowMs = 0;
  private bucketMs = 0;
  private isPaused = false;
  private lastCommit = 0;
  private disposed = false;

  /**
   * Build a fresh cluster of `size` nodes (ids `1..size`, all-to-all peers)
   * from one cluster-wide `seed`. Throws if the core fails to create a node.
   */
  constructor(core: RaftCore, size: 3 | 5 | 7, seed: number) {
    this.core = core;
    this.rng = new SplitMix64(BigInt(seed));

    const ids: number[] = [];
    for (let id = 1; id <= size; id++) {
      ids.push(id);
    }

    // Build into a local first so a mid-construction failure can still free
    // every handle created so far (`this.nodes` is not assigned yet).
    const created: SimNode[] = [];
    for (const id of ids) {
      const peers = ids.filter((other) => other !== id);
      const handle = core.newNode(id, peers, TIMING, seed, 0);
      if (handle === 0) {
        for (const node of created) {
          core.freeNode(node.handle);
        }
        throw new Error(`raft_node_new failed for node ${id}`);
      }
      created.push({ id, handle, alive: true, prev: { role: "follower", term: 0 } });
    }
    this.nodes = created;
  }

  /**
   * Advance sim time. Accumulates `realDtMs * speedMult` and drains it in
   * fixed 10 ms quanta. No-op while paused or disposed.
   */
  advance(realDtMs: number, speedMult: number): void {
    if (this.disposed || this.isPaused) {
      return;
    }
    this.bucketMs += realDtMs * speedMult;
    let processed = 0;
    while (this.bucketMs >= QUANTUM_MS && processed < MAX_QUANTA_PER_ADVANCE) {
      this.bucketMs -= QUANTUM_MS;
      this.stepQuantum();
      processed++;
    }
    if (processed >= MAX_QUANTA_PER_ADVANCE) {
      // Fell too far behind (e.g. a long stall) — drop the backlog rather than freeze.
      this.bucketMs = 0;
    }
  }

  /** Toggle the paused flag. */
  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  /** Whether the sim is currently paused. */
  get paused(): boolean {
    return this.isPaused;
  }

  /** "Crash" a node: it stops ticking/stepping; its volatile state is preserved. */
  crash(id: number): void {
    const node = this.nodeById(id);
    if (!node || !node.alive) {
      return;
    }
    node.alive = false;
    this.pushEvent("crash", `n${id} crashed — votes and log kept in memory`);
  }

  /** Bring a crashed node back; it resumes from its preserved state. */
  recover(id: number): void {
    const node = this.nodeById(id);
    if (!node || node.alive) {
      return;
    }
    node.alive = true;
    this.pushEvent("recover", `n${id} recovered`);
  }

  /** Cut or re-join the link between two nodes. */
  toggleLink(a: number, b: number): void {
    if (a === b) {
      return;
    }
    const key = linkKey(a, b);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (this.cuts.has(key)) {
      this.cuts.delete(key);
      this.pushEvent("link", `link n${lo}–n${hi} restored`);
    } else {
      this.cuts.add(key);
      this.pushEvent("link", `link n${lo}–n${hi} cut`);
    }
  }

  /**
   * Propose a command to the current leader. Returns `false` when there is no
   * leader or the chosen node has since stepped down.
   */
  propose(data: Uint8Array): boolean {
    const leader = this.leaderNode();
    if (!leader) {
      return false;
    }
    const result = this.core.propose(leader.handle, data);
    if (result.index >= 1) {
      const text = this.decoder.decode(data);
      this.pushEvent("propose", `n${leader.id} proposes «${text}»`);
      return true;
    }
    return false;
  }

  /** Read the full cluster state (status + log per node) for rendering. */
  snapshot(): Snapshot {
    const nodes: NodeView[] = this.nodes.map((node) => {
      const status = this.core.status(node.handle);
      // Fetch the whole log so the UI can shade committed vs uncommitted entries.
      const entries = this.core.logSlice(node.handle, 1, status.logLen);
      const logTerms = entries.map((entry) => entry.term);
      const committedTerms = logTerms.slice(0, status.commitIndex);
      return { id: node.id, alive: node.alive, status, logTerms, committedTerms };
    });

    let leaderId: number | null = null;
    let bestTerm = -1;
    for (const view of nodes) {
      if (view.alive && view.status.role === "leader" && view.status.term > bestTerm) {
        leaderId = view.id;
        bestTerm = view.status.term;
      }
    }

    const inflight: InflightView[] = this.inflight.map((m) => ({
      from: m.from,
      to: m.to,
      kind: m.kind,
      sentAt: m.sentAt,
      deliverAt: m.deliverAt,
    }));

    return {
      nowMs: this.nowMs,
      nodes,
      inflight,
      cuts: Array.from(this.cuts),
      leaderId,
      events: this.events.slice(),
    };
  }

  /** Free every node handle. Safe to call once; further advance() is a no-op. */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const node of this.nodes) {
      this.core.freeNode(node.handle);
    }
    this.inflight = [];
  }

  // ---- internals -----------------------------------------------------------

  /** One 10 ms quantum: tick → drain → deliver → drain → deliver → record. */
  private stepQuantum(): void {
    this.nowMs += QUANTUM_MS;

    for (const node of this.nodes) {
      if (node.alive) {
        this.core.tick(node.handle, this.nowMs);
      }
    }

    // First round: election/heartbeat traffic from the ticks above.
    this.drainOutboxes();
    this.deliverDue();
    // Second round: replies the deliveries just produced (same-quantum, like Rust).
    this.drainOutboxes();
    this.deliverDue();

    this.recordEvents();
  }

  /**
   * Drain every node's outbox. Crashed nodes are still drained but their
   * output is discarded (so stale frames don't replay on recover).
   */
  private drainOutboxes(): void {
    for (const node of this.nodes) {
      const outbound = this.core.takeOutbound(node.handle);
      if (!node.alive) {
        continue; // discard
      }
      for (const msg of outbound) {
        this.enqueue(node.id, msg.to, msg.frame);
      }
    }
  }

  /** Enqueue one message as in-flight, dropping it if undeliverable. */
  private enqueue(from: number, to: number, frame: Uint8Array): void {
    const target = this.nodeById(to);
    if (!target || !target.alive) {
      return; // target unknown or crashed
    }
    if (this.cuts.has(linkKey(from, to))) {
      return; // link cut
    }
    const kind = frameKind(frame);
    if (kind === null) {
      return; // unrecognized frame type
    }
    const deliverAt = this.nowMs + LATENCY_BASE_MS + this.rng.below(LATENCY_JITTER_MS);
    this.inflight.push({ from, to, kind, frame, sentAt: this.nowMs, deliverAt });
  }

  /** Deliver (and remove) every in-flight message due at the current time. */
  private deliverDue(): void {
    const remaining: Inflight[] = [];
    for (const m of this.inflight) {
      if (m.deliverAt > this.nowMs) {
        remaining.push(m);
        continue;
      }
      const target = this.nodeById(m.to);
      if (target && target.alive) {
        this.core.step(target.handle, m.from, m.frame, this.nowMs);
      }
      // otherwise silently dropped (crashed since send)
    }
    this.inflight = remaining;
  }

  /** Derive feed events from this quantum's status deltas. */
  private recordEvents(): void {
    let maxCommit = this.lastCommit;
    for (const node of this.nodes) {
      if (!node.alive) {
        continue;
      }
      const status = this.core.status(node.handle);
      if (status.role !== node.prev.role) {
        const text =
          status.role === "leader"
            ? `n${node.id} → leader (term ${status.term})`
            : `n${node.id} → ${status.role}`;
        this.pushEvent("election", text);
      }
      if (status.commitIndex > maxCommit) {
        maxCommit = status.commitIndex;
      }
      node.prev = { role: status.role, term: status.term };
    }
    if (maxCommit > this.lastCommit) {
      this.pushEvent("commit", `commit → ${maxCommit}`);
      this.lastCommit = maxCommit;
    }
  }

  /** Append an event to the ring buffer (newest last, capped). */
  private pushEvent(kind: SimEvent["kind"], text: string): void {
    this.events.push({ tMs: this.nowMs, kind, text });
    if (this.events.length > MAX_EVENTS) {
      this.events.shift();
    }
  }

  /** The current leader (alive, highest term), or `null`. */
  private leaderNode(): SimNode | null {
    let leader: SimNode | null = null;
    let bestTerm = -1;
    for (const node of this.nodes) {
      if (!node.alive) {
        continue;
      }
      const status = this.core.status(node.handle);
      if (status.role === "leader" && status.term > bestTerm) {
        leader = node;
        bestTerm = status.term;
      }
    }
    return leader;
  }

  /** Look up a node by id. */
  private nodeById(id: number): SimNode | undefined {
    return this.nodes.find((node) => node.id === id);
  }
}

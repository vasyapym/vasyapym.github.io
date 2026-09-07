// web/cluster.ts — framework-free simulated Raft cluster driven by the wasm core (revision 2).
// Revision 2: frames are decoded once at enqueue (wire.ts `summarize`), message
// deaths are recorded as short-lived render records, the vote tally is derived
// from observed vote replies, the event feed gained tones and protocol moments,
// and a labelled synthetic client keeps the log alive between visitor actions.

import { summarize, type FrameKind, type FrameMeta } from "./wire";
import type { RaftCore, StatusReport } from "./raft-core";

/** Tone of a feed event, mapped to CSS colours by the page. */
export type EventTone = "amber" | "teal" | "danger" | "faint" | "text";

/** A human-readable, timestamped thing that happened in the sim (for the event feed). */
export type SimEvent = {
  tMs: number;
  kind: "election" | "commit" | "crash" | "recover" | "link" | "propose";
  tone: EventTone;
  text: string;
};

/** Derived, live vote tally for a candidate. Counted from observed replies —
 * the core's own `votes` set is private, so this mirrors it on the wire. */
export type Tally = { granted: number; needed: number };

/** Per-node render state pulled once per {@link ClusterSim.snapshot}. */
export type NodeView = {
  id: number;
  alive: boolean;
  status: StatusReport;
  /** Term of every log entry (committed + uncommitted). */
  logTerms: number[];
  /** Terms of the committed prefix only (length === commitIndex). */
  committedTerms: number[];
  /** Vote tally while the node is a candidate; null otherwise. */
  tally: Tally | null;
};

/** One message currently traversing the simulated network. */
export type InflightView = {
  from: number;
  to: number;
  /** Decoded once at enqueue; the renderer never touches raw frames. */
  meta: FrameMeta;
  sentAt: number;
  deliverAt: number;
};

/** Where a message died, as a fraction along the sender→target line. */
export type DropView = {
  from: number;
  to: number;
  /** 0 = at the sender, 1 = at the target. */
  fraction: number;
  atMs: number;
  reason: "cut" | "down";
  kind: FrameKind;
};

/** Short-lived canvas emphasis records (never in the feed). */
export type Fx =
  | { type: "arrival"; id: number; atMs: number; kind: FrameKind }
  | { type: "grant"; id: number; atMs: number }
  | { type: "quorum"; id: number; atMs: number }
  | { type: "term"; id: number; atMs: number };

/** Immutable view of the whole cluster at one instant of sim time. */
export type Snapshot = {
  nowMs: number;
  nodes: NodeView[];
  inflight: InflightView[];
  drops: DropView[];
  fx: Fx[];
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
/** Emphasis-record budget: older than the TTL is evicted, then oldest-first. */
const FX_TTL_MS = 400;
const MAX_FX = 48;
/** Drop-record budget: older than the TTL is evicted, then oldest-first. */
const DROP_TTL_MS = 300;
const MAX_DROPS = 24;
/** Safety valve: never process more quanta than this in a single advance() call. */
const MAX_QUANTA_PER_ADVANCE = 4000;
/** Max characters of a payload shown in feed text. */
const MAX_PROPOSE_CHARS = 24;

/** Election/heartbeat timing shared by every node (matches the Rust sim). */
const TIMING = { minMs: 900, maxMs: 1800, heartbeatMs: 250 } as const;

/** Synthetic client cadence (spec: 2.5 s first, then 4 s ± 1.5 s, seeded). */
const AUTO_FIRST_DELAY_MS = 2500;
const AUTO_RESUME_DELAY_MS = 1200;
const AUTO_PERIOD_MS = 4000;
const AUTO_JITTER_MS = 1500;
/** After any user proposal the client stays silent this long. */
const AUTO_SUPPRESS_MS = 12000;
/** Deterministic payload vocabulary, cycled by an incrementing counter. */
const AUTO_WORDS = ["amber", "teal", "ink", "slate", "ember", "quill", "moss", "rust"] as const;

/** Leading type byte → kind, for frames `summarize` cannot decode. */
const KIND_BY_BYTE: Record<number, FrameKind> = { 1: "rv", 2: "rvr", 3: "ae", 4: "aer" };

/** 64-bit mask for splitmix64 arithmetic in BigInt. */
const MASK64 = (1n << 64n) - 1n;

/**
 * splitmix64 — the same generator (and constants) the Rust core uses, so
 * latency draws and the synthetic client's jitter are reproducible from the
 * cluster seed alone.
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
  /** Cached log terms; refetched only when (logLen, commitIndex, term) moves. */
  logTerms: number[];
  logCacheKey: { logLen: number; commitIndex: number; term: number } | null;
};

/** Observed vote tally for one candidate (UI-side, derived from the wire). */
type ObservedTally = { term: number; granted: Set<number> };

/** An in-flight message, including the raw frame we still need to deliver. */
type Inflight = InflightView & { frame: Uint8Array };

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
  private readonly encoder = new TextEncoder();

  private inflight: Inflight[] = [];
  private drops: DropView[] = [];
  private fx: Fx[] = [];
  private nowMs = 0;
  private bucketMs = 0;
  private isPaused = false;
  private lastCommit = 0;
  private disposed = false;

  /** Observed tallies per candidate id, cleared when candidacy ends. */
  private readonly votes = new Map<number, ObservedTally>();

  // Synthetic client state (sim-time driven).
  private autoNextAtMs: number | null = null;
  private autoCounter = 0;
  private autoStarted = false;
  private suppressUntilMs = 0;

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
      created.push({
        id,
        handle,
        alive: true,
        prev: { role: "follower", term: 0 },
        logTerms: [],
        logCacheKey: null,
      });
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
    this.pushEvent("crash", `crash · n${id} down`, "danger");
  }

  /** Bring a crashed node back; it resumes from its preserved state. */
  recover(id: number): void {
    const node = this.nodeById(id);
    if (!node || node.alive) {
      return;
    }
    node.alive = true;
    this.pushEvent("recover", `recover · n${id} up`, "teal");
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
      this.pushEvent("link", `link · n${lo}–n${hi} restored`, "teal");
    } else {
      this.cuts.add(key);
      this.pushEvent("link", `link · n${lo}–n${hi} cut`, "danger");
    }
  }

  /**
   * Propose a command to the current leader. Returns `false` when there is no
   * leader or the chosen node has since stepped down. Any user proposal
   * silences the synthetic client for a while — the visitor stays the star.
   */
  propose(data: Uint8Array): boolean {
    this.suppressUntilMs = this.nowMs + AUTO_SUPPRESS_MS;
    const leader = this.leaderNode();
    if (!leader) {
      this.pushEvent("propose", "you · propose rejected · no leader", "danger");
      return false;
    }
    const result = this.core.propose(leader.handle, data);
    if (result.index >= 1) {
      const text = this.decodePayload(data);
      this.pushEvent("propose", `you · propose "${text}" → n${leader.id} · idx ${result.index}`, "text");
      return true;
    }
    this.pushEvent("propose", `you · propose rejected · n${leader.id} not leader`, "danger");
    return false;
  }

  /** Read the full cluster state (status + log per node) for rendering. */
  snapshot(): Snapshot {
    const nodes: NodeView[] = this.nodes.map((node) => {
      const status = this.core.status(node.handle);
      // Refetch the log only when something that shapes the bar moved
      // (length, commit boundary, or the node's term — a term bump is when a
      // conflicting rewrite can land). Otherwise reuse the cached terms.
      const key = { logLen: status.logLen, commitIndex: status.commitIndex, term: status.term };
      const cache = node.logCacheKey;
      if (
        !cache ||
        cache.logLen !== key.logLen ||
        cache.commitIndex !== key.commitIndex ||
        cache.term !== key.term
      ) {
        const entries = this.core.logSlice(node.handle, 1, status.logLen);
        node.logTerms = entries.map((entry) => entry.term);
        node.logCacheKey = key;
      }
      const logTerms = node.logTerms;
      const committedTerms = logTerms.slice(0, status.commitIndex);
      const tally: Tally | null =
        status.role === "candidate"
          ? { granted: this.votes.get(node.id)?.granted.size ?? 1, needed: this.majority() }
          : null;
      return { id: node.id, alive: node.alive, status, logTerms, committedTerms, tally };
    });

    let leaderId: number | null = null;
    let bestTerm = -1;
    for (const view of nodes) {
      if (view.alive && view.status.role === "leader" && view.status.term > bestTerm) {
        leaderId = view.id;
        bestTerm = view.status.term;
      }
    }

    this.pruneTransient(this.drops, DROP_TTL_MS, MAX_DROPS);
    this.pruneTransient(this.fx, FX_TTL_MS, MAX_FX);

    const inflight: InflightView[] = this.inflight.map((m) => ({
      from: m.from,
      to: m.to,
      meta: m.meta,
      sentAt: m.sentAt,
      deliverAt: m.deliverAt,
    }));

    return {
      nowMs: this.nowMs,
      nodes,
      inflight,
      drops: this.drops.slice(),
      fx: this.fx.slice(),
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
    this.drops = [];
    this.fx = [];
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

  /**
   * Enqueue one message as in-flight. Rejections (target down, link cut) are
   * recorded as drop records at 15% along the line — the message died leaving
   * the sender. A granted vote reply pulses the voter as it departs.
   */
  private enqueue(from: number, to: number, frame: Uint8Array): void {
    const meta = summarize(frame) ?? this.fallbackMeta(frame);
    if (meta === null) {
      return; // unrecognized frame type
    }
    const sender = this.nodeById(from);
    const target = this.nodeById(to);
    if (!sender || !target) {
      return; // unknown endpoint — nothing to draw on
    }
    if (!target.alive) {
      this.pushDrop(from, to, 0.15, "down", meta.kind);
      return;
    }
    if (this.cuts.has(linkKey(from, to))) {
      this.pushDrop(from, to, 0.15, "cut", meta.kind);
      return;
    }
    if (meta.kind === "rvr" && meta.ok === true) {
      this.pushFx({ type: "grant", id: from, atMs: this.nowMs });
    }
    const deliverAt = this.nowMs + LATENCY_BASE_MS + this.rng.below(LATENCY_JITTER_MS);
    this.inflight.push({ from, to, meta, frame, sentAt: this.nowMs, deliverAt });
  }

  /** Meta for a frame `summarize` rejected: classify by the leading byte only. */
  private fallbackMeta(frame: Uint8Array): FrameMeta | null {
    const kind = frame.length > 0 ? KIND_BY_BYTE[frame[0]] : undefined;
    return kind ? { kind, term: 0, entryCount: 0, ok: null } : null;
  }

  /**
   * Deliver (and remove) every in-flight message due at the current time.
   * Cuts and crashes are re-checked here: a link cut mid-flight kills the
   * message at the link midpoint; a target crashed mid-flight kills it at 82%.
   */
  private deliverDue(): void {
    const remaining: Inflight[] = [];
    for (const m of this.inflight) {
      if (m.deliverAt > this.nowMs) {
        remaining.push(m);
        continue;
      }
      const target = this.nodeById(m.to);
      if (!target || !target.alive) {
        this.pushDrop(m.from, m.to, 0.82, "down", m.meta.kind);
        continue;
      }
      if (this.cuts.has(linkKey(m.from, m.to))) {
        this.pushDrop(m.from, m.to, 0.5, "cut", m.meta.kind);
        continue;
      }
      // Read the target's role before stepping: a granted reply counts toward
      // the tally only if the target was still a candidate when it arrived.
      // Checking after step() would miss the quorum-making reply itself (the
      // core flips to leader inside step), and checking nothing would let a
      // post-quorum reply inflate the count past the majority.
      const grantCheck =
        m.meta.kind === "rvr" && m.meta.ok === true ? this.core.status(target.handle) : null;
      this.core.step(target.handle, m.from, m.frame, this.nowMs);
      this.pushFx({ type: "arrival", id: target.id, atMs: this.nowMs, kind: m.meta.kind });
      if (grantCheck && grantCheck.role === "candidate") {
        const tally = this.votes.get(m.to);
        // Derived tally: a stale reply must not inflate a re-stand — count it
        // only against the term the candidate stood for.
        if (tally && tally.term === m.meta.term) {
          tally.granted.add(m.from);
        }
      }
    }
    this.inflight = remaining;
  }

  /** Derive feed events and emphasis records from this quantum's deltas. */
  private recordEvents(): void {
    let maxCommit = this.lastCommit;
    let maxCommitNode: SimNode | null = null;
    let leaderId: number | null = null;
    let bestTerm = -1;

    for (const node of this.nodes) {
      if (!node.alive) {
        continue;
      }
      const status = this.core.status(node.handle);
      this.recordRoleTransition(node, status);
      if (status.commitIndex > maxCommit) {
        maxCommit = status.commitIndex;
        maxCommitNode = node;
      }
      if (status.role === "leader" && status.term > bestTerm) {
        leaderId = node.id;
        bestTerm = status.term;
      }
      node.prev = { role: status.role, term: status.term };
    }

    if (maxCommit > this.lastCommit) {
      this.lastCommit = maxCommit;
      this.pushEvent("commit", `commit → ${maxCommit}${this.commitPayload(maxCommitNode, maxCommit)}`, "teal");
    }

    this.driveAutoClient(leaderId);
  }

  /** Emit election/term events for one node's observed role/term change. */
  private recordRoleTransition(node: SimNode, status: StatusReport): void {
    const roleChanged = status.role !== node.prev.role;
    const termChanged = status.term !== node.prev.term;
    if (!roleChanged && !termChanged) {
      return;
    }
    if (termChanged) {
      this.pushFx({ type: "term", id: node.id, atMs: this.nowMs });
    }

    const n = `n${node.id}`;
    switch (status.role) {
      case "candidate": {
        // Entered candidacy (fresh or re-stand): restart the observed tally.
        this.votes.set(node.id, { term: status.term, granted: new Set([node.id]) });
        const reStand = node.prev.role === "candidate";
        this.pushEvent(
          "election",
          reStand
            ? `${n} → candidate · term ${status.term} · re-stand`
            : `${n} → candidate · term ${status.term}`,
          "amber",
        );
        break;
      }
      case "leader": {
        const granted = this.votes.get(node.id)?.granted.size ?? 1;
        this.pushEvent("election", `${n} → leader · term ${status.term} · votes ${granted}/${this.majority()}`, "amber");
        this.pushFx({ type: "quorum", id: node.id, atMs: this.nowMs });
        this.votes.delete(node.id);
        break;
      }
      case "follower": {
        // A step-down matters to the story only when a higher term forced it;
        // same-term adoption is narrated by the winner's quorum line instead.
        if ((node.prev.role === "leader" || node.prev.role === "candidate") && termChanged) {
          this.pushEvent("election", `${n} → follower · term ${status.term} · higher term`, "amber");
        }
        break;
      }
    }
    if (status.role !== "candidate") {
      this.votes.delete(node.id);
    }
  }

  /** ` · "payload"` suffix for a commit event, from the committing node's log. */
  private commitPayload(node: SimNode | null, index: number): string {
    if (!node) {
      return "";
    }
    const entry = this.core.logSlice(node.handle, index, 1)[0];
    if (!entry) {
      return "";
    }
    return ` · "${this.decodePayload(entry.data)}"`;
  }

  /** UTF-8 payload text, defensively truncated for the feed. */
  private decodePayload(data: Uint8Array): string {
    const text = this.decoder.decode(data);
    return text.length > MAX_PROPOSE_CHARS ? text.slice(0, MAX_PROPOSE_CHARS) : text;
  }

  /**
   * The synthetic client: idle until a leader exists, first proposal 2500 ms
   * later, then every 4 s ± 1.5 s (jitter from the seeded stream). It pauses
   * itself while leaderless, and for 12 s after any user proposal; after a
   * leader re-emerges it waits 1.2 s. Every line is labelled `auto ·`.
   */
  private driveAutoClient(leaderId: number | null): void {
    if (leaderId === null) {
      this.autoNextAtMs = null;
      return;
    }
    if (this.autoNextAtMs === null) {
      this.autoNextAtMs = this.nowMs + (this.autoStarted ? AUTO_RESUME_DELAY_MS : AUTO_FIRST_DELAY_MS);
      return;
    }
    if (this.nowMs < this.autoNextAtMs || this.nowMs < this.suppressUntilMs) {
      return;
    }
    this.fireAutoProposal();
  }

  /** One synthetic proposal; failures retry on the next tick, without spam. */
  private fireAutoProposal(): void {
    const leader = this.leaderNode();
    if (!leader) {
      this.autoNextAtMs = null;
      return;
    }
    const word = AUTO_WORDS[this.autoCounter % AUTO_WORDS.length];
    const value = `k${String(this.autoCounter + 1).padStart(2, "0")}=${word}`;
    const result = this.core.propose(leader.handle, this.encoder.encode(value));
    if (result.index >= 1) {
      this.autoCounter += 1;
      this.autoStarted = true;
      this.pushEvent("propose", `auto · propose "${value}" → n${leader.id} · idx ${result.index}`, "faint");
      this.autoNextAtMs = this.nowMs + AUTO_PERIOD_MS + this.rng.below(AUTO_JITTER_MS * 2 + 1) - AUTO_JITTER_MS;
    } else {
      // The "leader" stepped down between our check and the propose — retry soon.
      this.autoNextAtMs = this.nowMs + QUANTUM_MS;
    }
  }

  /** Majority of the cluster (self included): floor(n/2) + 1. */
  private majority(): number {
    return Math.floor(this.nodes.length / 2) + 1;
  }

  /** Evict transient render records by age, then cap by count. */
  private pruneTransient<T extends { atMs: number }>(list: T[], ttlMs: number, cap: number): void {
    const cutoff = this.nowMs - ttlMs;
    while (list.length > 0 && list[0].atMs < cutoff) {
      list.shift();
    }
    while (list.length > cap) {
      list.shift();
    }
  }

  private pushDrop(from: number, to: number, fraction: number, reason: "cut" | "down", kind: FrameKind): void {
    this.drops.push({ from, to, fraction, atMs: this.nowMs, reason, kind });
    this.pruneTransient(this.drops, DROP_TTL_MS, MAX_DROPS);
  }

  private pushFx(record: Fx): void {
    this.fx.push(record);
    this.pruneTransient(this.fx, FX_TTL_MS, MAX_FX);
  }

  /** Append an event to the ring buffer (newest last, capped). */
  private pushEvent(kind: SimEvent["kind"], text: string, tone: EventTone): void {
    this.events.push({ tMs: this.nowMs, kind, tone, text });
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

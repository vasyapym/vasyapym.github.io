// web/wire.ts — pure TypeScript decoder for the Raft wire protocol (revision 1).

/** Node role carried by a StatusReport frame. */
export type Role = "follower" | "candidate" | "leader";

/** One replicated log entry as it appears on the wire (`data` is a copied slice). */
export type WireEntry = { term: number; data: Uint8Array };

/** Type 1 — a candidate solicits a vote. */
export type RequestVoteFrame = {
  kind: "request-vote";
  term: number;
  candidate: number;
  lastLogIndex: number;
  lastLogTerm: number;
};

/** Type 2 — a peer answers a vote request. */
export type RequestVoteReplyFrame = {
  kind: "request-vote-reply";
  term: number;
  voteGranted: boolean;
};

/** Type 3 — a leader replicates entries (empty entries = heartbeat). */
export type AppendEntriesFrame = {
  kind: "append-entries";
  term: number;
  leader: number;
  prevLogIndex: number;
  prevLogTerm: number;
  leaderCommit: number;
  entries: WireEntry[];
};

/** Type 4 — a follower answers an AppendEntries. */
export type AppendEntriesReplyFrame = {
  kind: "append-entries-reply";
  term: number;
  success: boolean;
  matchIndex: number;
  conflictIndex: number;
};

/** Type 5 — a node's self-reported state. */
export type StatusReportFrame = {
  kind: "status-report";
  role: Role;
  term: number;
  leaderId: number;
  commitIndex: number;
  lastApplied: number;
  logLen: number;
  votedFor: number;
};

/** Discriminated union of every decodable wire frame. */
export type RaftFrame =
  | RequestVoteFrame
  | RequestVoteReplyFrame
  | AppendEntriesFrame
  | AppendEntriesReplyFrame
  | StatusReportFrame;

/** Sentinel thrown by the cursor on any bounds violation; caught locally, never leaks. */
class DecodeError extends Error {}

/**
 * Little-endian, bounds-checked reader over a `Uint8Array`. Every accessor
 * throws {@link DecodeError} rather than reading past the end, so `decodeFrame`
 * can treat truncation uniformly.
 */
class Cursor {
  private readonly bytes: Uint8Array;
  private readonly view: DataView;
  private off: number;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.off = 0;
  }

  /** Bytes not yet consumed. */
  get remaining(): number {
    return this.bytes.byteLength - this.off;
  }

  private require(n: number): number {
    const at = this.off;
    if (n < 0 || at + n > this.bytes.byteLength) {
      throw new DecodeError("out of bounds");
    }
    this.off = at + n;
    return at;
  }

  u8(): number {
    return this.view.getUint8(this.require(1));
  }

  u32(): number {
    return this.view.getUint32(this.require(4), true);
  }

  /** Read a u64 as a JS number (safe at demo scale; precision loss above 2^53). */
  u64(): number {
    return Number(this.view.getBigUint64(this.require(8), true));
  }

  /** Read `n` bytes as a fresh copy detached from the source buffer. */
  bytesCopy(n: number): Uint8Array {
    const at = this.require(n);
    return this.bytes.slice(at, at + n);
  }
}

/** Read a length-prefixed entry list (`count:u32`, then `{ term:u64, len:u32, data[len] }`). */
function decodeEntries(cur: Cursor): WireEntry[] {
  const count = cur.u32();
  const entries: WireEntry[] = [];
  for (let i = 0; i < count; i++) {
    const term = cur.u64();
    const len = cur.u32();
    const data = cur.bytesCopy(len);
    entries.push({ term, data });
  }
  return entries;
}

/**
 * Decode a single wire frame. Returns `null` on any malformed input —
 * unknown type byte, truncation, or trailing bytes after a complete frame.
 * Never throws.
 */
export function decodeFrame(bytes: Uint8Array): RaftFrame | null {
  try {
    const cur = new Cursor(bytes);
    const type = cur.u8();
    let frame: RaftFrame;

    switch (type) {
      case 1:
        frame = {
          kind: "request-vote",
          term: cur.u64(),
          candidate: cur.u64(),
          lastLogIndex: cur.u64(),
          lastLogTerm: cur.u64(),
        };
        break;
      case 2:
        frame = {
          kind: "request-vote-reply",
          term: cur.u64(),
          voteGranted: cur.u8() !== 0,
        };
        break;
      case 3: {
        const term = cur.u64();
        const leader = cur.u64();
        const prevLogIndex = cur.u64();
        const prevLogTerm = cur.u64();
        const leaderCommit = cur.u64();
        const entries = decodeEntries(cur);
        frame = {
          kind: "append-entries",
          term,
          leader,
          prevLogIndex,
          prevLogTerm,
          leaderCommit,
          entries,
        };
        break;
      }
      case 4:
        frame = {
          kind: "append-entries-reply",
          term: cur.u64(),
          success: cur.u8() !== 0,
          matchIndex: cur.u64(),
          conflictIndex: cur.u64(),
        };
        break;
      case 5: {
        const roleByte = cur.u8();
        if (roleByte > 2) {
          return null;
        }
        const role: Role = roleByte === 2 ? "leader" : roleByte === 1 ? "candidate" : "follower";
        frame = {
          kind: "status-report",
          role,
          term: cur.u64(),
          leaderId: cur.u64(),
          commitIndex: cur.u64(),
          lastApplied: cur.u64(),
          logLen: cur.u64(),
          votedFor: cur.u64(),
        };
        break;
      }
      default:
        return null;
    }

    // Strict trailing-byte check: a valid frame consumes the buffer exactly.
    if (cur.remaining !== 0) {
      return null;
    }
    return frame;
  } catch {
    return null;
  }
}

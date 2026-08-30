# `raft-core` C ABI (revision 1)

## 1. Overview

One core, two consumers. The **wasm32 browser page** (`cdylib`) and the
**Go/cgo daemon** (`staticlib`) drive the identical `raft_*` exports below.

| Concept | Contract |
|---|---|
| Handle | `usize` (pointer-sized: i32 on wasm32, i64 on 64-bit hosts). `raft_node_new` returns `> 0`; **0 is null/invalid** and is a safe sentinel (`Box::into_raw` of a non-ZST is never 0). |
| Handle liveness | Using a **freed** or **never-returned** handle is a host bug (UB). Exports validate everything *except* handle liveness; handle `0` is always checked. |
| Time | Caller-driven. The core never reads a clock; `now_ms` flows in via `raft_node_new`, `raft_node_tick`, `raft_node_step`. |
| Panic-freedom | No export panics. `panic = "abort"` in release means a panic would trap/abort the host — prevention is the contract, not recovery. No `catch_unwind`. |
| unsafe | Only `ffi.rs` uses `unsafe` (crate root is `#![deny(unsafe_code)]`). Exports are safe-to-call `extern "C"` fns. |

## 2. Exports

All are `#[no_mangle] pub extern "C" fn`. `H = usize` handle.

| Signature | Returns | Notes |
|---|---|---|
| `raft_abi_version() -> u32` | `1` | Bump on any breaking export change. |
| `raft_abi_alloc(len: usize) -> *mut u8` | ptr / null | Allocate `len` bytes (alignment 1) in **linear memory** for use as an export output buffer; release with `raft_abi_free`. Null when `len == 0` or allocation fails. Wasm hosts **must** use this for `out_ptr` (JS memory is not addressable); Go/cgo may pass its own memory instead. |
| `raft_abi_free(ptr: *mut u8, len: usize)` | — | Release an `raft_abi_alloc` buffer. Null `ptr` or zero `len` are ignored; `ptr`/`len` must match the allocation exactly. |
| `raft_node_new(id: u64, peers_ptr: *const u64, peers_len: usize, et_min_ms: u64, et_max_ms: u64, hb_ms: u64, seed: u64, now_ms: u64) -> usize` | handle `> 0`, or `0` | `0` on invalid config, null `peers_ptr` with `peers_len > 0`, or alloc failure. `peers` is a **native-endian** u64 array; dedup/sort/self-strip happen inside. The node's RNG is seeded `seed ^ id` — pass one cluster-wide `seed` for all nodes and the id differentiates their states. |
| `raft_node_free(H)` | — | Safe on `0`. Exactly one free per handle; no double-free. |
| `raft_node_tick(H, now_ms: u64)` | — | No-op on `0`. |
| `raft_node_step(H, from: u64, msg_ptr: *const u8, msg_len: usize, now_ms: u64) -> i32` | `0` accepted / `-1` bad handle / `-2` decode failure | One wire frame in. `-2` (incl. null `msg_ptr`) discards the frame; node untouched. |
| `raft_node_propose(H, data_ptr: *const u8, data_len: usize, leader_hint: *mut u64) -> i64` | index `>= 1` / `0` not leader / `-1` bad handle | On `0`, if `leader_hint` non-null it receives `NO_NODE` or a hint. Null `data_ptr` ⇒ empty payload. |
| `raft_node_status(H, out_ptr: *mut u8, out_cap: usize) -> i32` | buffer protocol / `-1` | Writes `Message::StatusReport(..).to_vec()` (type byte 5). |
| `raft_node_take_outbound(H, out_ptr: *mut u8, out_cap: usize) -> i32` | buffer protocol / `-1` | Drains outbox into one **outbox batch**. Drain commits **only when the batch fits**; a non-fitting probe caches the batch so the next call returns identical bytes. |
| `raft_node_log_slice(H, start_index: u64, max_entries: u32, out_ptr: *mut u8, out_cap: usize) -> i32` | buffer protocol / `-1` | Copies ≤ `max_entries` entries from 1-based `start_index` into a **log-slice batch**. `start_index` 0 or out-of-range ⇒ `count: 0` (clamped like `RaftLog::slice`). |

### Buffer protocol (status, take_outbound, log_slice — identical)

| Case | Behavior | Return |
|---|---|---|
| Fits (`needed <= out_cap`) | Write the batch. An empty batch still writes the `count: 0` header (4 bytes). | bytes written (positive; ≥ 4 for batches) |
| Does not fit | Write **nothing**, mutate **no** state. | needed length (positive, `> out_cap`) — caller reallocates and retries |
| Bad handle (`H == 0`) | — | `-1` |

The two calls are equivalent because nothing mutates between them without an
intervening `tick`/`step` (and `take_outbound`'s probe never drains).

### Outbox batch layout (`take_outbound`)

```text
count     : u32 (LE)
count × {
  to        : u64 (LE)
  frame_len : u32 (LE)
  frame     : u8[frame_len]   // full wire frame, leading type byte included
}
```

### Log-slice batch layout (`log_slice`)

```text
count     : u32 (LE)
count × {
  term     : u64 (LE)
  data_len : u32 (LE)
  data     : u8[data_len]
}
```

## 3. Wire frames

Frozen little-endian codec, one message per frame; the leading byte is the
type tag. Consumers decode these without touching Rust.

| Type | Message | Fields (in order) |
|---|---|---|
| 1 | `RequestVote` | `term:u64`, `candidate:u64`, `last_log_index:u64`, `last_log_term:u64` |
| 2 | `RequestVoteReply` | `term:u64`, `vote_granted:u8` (0 = false, nonzero = true) |
| 3 | `AppendEntries` | `term:u64`, `leader:u64`, `prev_log_index:u64`, `prev_log_term:u64`, `leader_commit:u64`, `entries_len:u32`, `entries_len × { term:u64, data_len:u32, data[data_len] }` |
| 4 | `AppendEntriesReply` | `term:u64`, `success:u8` (0 = false, nonzero = true), `match_index:u64`, `conflict_index:u64` |
| 5 | `StatusReport` | `role:u8` (0 = Follower, 1 = Candidate, 2 = Leader), `term:u64`, `leader_id:u64`, `commit_index:u64`, `last_applied:u64`, `log_len:u64`, `voted_for:u64` |

Role wire bytes: `0 = Follower`, `1 = Candidate`, `2 = Leader`.

## 4. Type mapping

| Rust | wasm32 / JS | Go / cgo |
|---|---|---|
| `u64` param/field | i64 param; JS passes **BigInt** (native in modern browsers) | `uint64` |
| `usize` handle | i32 | i64 (on 64-bit hosts) |
| `*const u8` / `*mut u8` | i32 — an **offset into linear memory**; output buffers come from `raft_abi_alloc` | `unsafe.Pointer` / `*C.uint8_t` — Go may pass its own memory |
| peers array | native-endian `u64[]` in linear memory | native-endian `[]uint64` |

The `peers` array is read in **native endianness** — build it in the
consumer's own memory; do not byte-swap. Wasm `Memory.buffer` can detach on
growth: re-create typed views after every `raft_abi_alloc`.

## 5. Build

| Consumer | Command | Artifact |
|---|---|---|
| wasm page (`cdylib`) | `cargo build --release --target wasm32-unknown-unknown` | `target/wasm32-unknown-unknown/release/raft_core.wasm` |
| Go daemon (`staticlib`) | `cargo build --release` | `target/release/libraft_core.a` |

## 6. Determinism

Same `seed` + same call sequence ⇒ same outputs. The only randomness is the
node-internal **splitmix64** generator, seeded by `seed ^ id`. There are no
clocks, threads, or global state: replaying the identical
`(new, tick, step, propose)` sequence reproduces every frame and status
byte-for-byte.

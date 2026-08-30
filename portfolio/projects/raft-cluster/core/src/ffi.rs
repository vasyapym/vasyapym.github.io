//! C-ABI (FFI) surface for `raft-core`.
//!
//! Nine `#[no_mangle] extern "C"` exports drive the core from both consumers
//! (the wasm32 browser page and the Go/cgo daemon) through the SAME symbols.
//! This module is the crate's single `unsafe` escape hatch: the root denies
//! `unsafe_code`, but a raw C ABI must dereference caller-provided pointers and
//! hand out `Box`-backed handles. Every `unsafe` block below is minimal and
//! commented; exports validate all inputs except handle liveness (using a freed
//! or never-returned handle is a documented host bug — see ABI.md).
#![allow(unsafe_code)]

use crate::wire::Message;
use crate::{Config, Entry, Node, Outbound, ProposeError};

/// Opaque handle payload: the node plus a cache holding a drained-but-not-yet-
/// delivered outbound batch, so `raft_node_take_outbound` can be probed without
/// losing messages (the frozen `Node` API only offers a draining `take_outbox`).
struct FfiNode {
    node: Node,
    pending_outbound: Option<Vec<u8>>,
}

// --- internal helpers -------------------------------------------------------

/// Resolve a handle to its `FfiNode`, or `None` when the handle is 0.
fn ffi<'a>(handle: usize) -> Option<&'a mut FfiNode> {
    if handle == 0 {
        return None;
    }
    // SAFETY: non-zero handles are `Box::into_raw(Box<FfiNode>)` values returned
    // by `raft_node_new` and not yet freed. Liveness is the caller's contract.
    Some(unsafe { &mut *(handle as *mut FfiNode) })
}

/// The 0-checking accessor the exports use to reach the wrapped `Node`.
fn node<'a>(handle: usize) -> Option<&'a mut Node> {
    ffi(handle).map(|w| &mut w.node)
}

fn push_u32(buf: &mut Vec<u8>, v: u32) {
    buf.extend_from_slice(&v.to_le_bytes());
}

fn push_u64(buf: &mut Vec<u8>, v: u64) {
    buf.extend_from_slice(&v.to_le_bytes());
}

/// Encode a drained outbox as: count:u32, then count × {to:u64, len:u32, frame}.
fn encode_outbound(outbox: Vec<Outbound>) -> Vec<u8> {
    let mut buf = Vec::new();
    push_u32(&mut buf, outbox.len() as u32);
    for ob in &outbox {
        push_u64(&mut buf, ob.to);
        let frame = ob.message.to_vec();
        push_u32(&mut buf, frame.len() as u32);
        buf.extend_from_slice(&frame);
    }
    buf
}

/// Encode a log slice as: count:u32, then count × {term:u64, len:u32, data}.
fn encode_log_slice(entries: Vec<Entry>) -> Vec<u8> {
    let mut buf = Vec::new();
    push_u32(&mut buf, entries.len() as u32);
    for e in &entries {
        push_u64(&mut buf, e.term);
        push_u32(&mut buf, e.data.len() as u32);
        buf.extend_from_slice(&e.data);
    }
    buf
}

/// Buffer protocol: if `bytes` fits `out_cap`, copy it and return its length;
/// otherwise write nothing and return the needed length (which the caller sees
/// as "greater than the capacity I passed").
fn copy_out(bytes: &[u8], out_ptr: *mut u8, out_cap: usize) -> i32 {
    let n = bytes.len();
    if n > out_cap {
        return n as i32;
    }
    if !out_ptr.is_null() && n > 0 {
        // SAFETY: caller guarantees `out_ptr` is writable for at least `out_cap`
        // bytes, and `n <= out_cap`; source and destination do not overlap.
        unsafe { std::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, n) };
    }
    n as i32
}

// --- exports ----------------------------------------------------------------

/// ABI revision number. Bump on any breaking change to the exports below.
#[no_mangle]
pub extern "C" fn raft_abi_version() -> u32 {
    1
}

/// Allocate `len` bytes (alignment 1) in linear memory for use as an export
/// output buffer; the caller must release it with [`raft_abi_free`]. Returns
/// null when `len` is 0 or the allocation fails. Wasm hosts need this because
/// JS memory is not addressable by `out_ptr` — only linear memory is.
#[no_mangle]
pub extern "C" fn raft_abi_alloc(len: usize) -> *mut u8 {
    if len == 0 {
        return std::ptr::null_mut();
    }
    // SAFETY: `from_size_align` is Ok for any `len` with align 1 below
    // `isize::MAX`; the pointer is handed to the caller unwritten.
    match std::alloc::Layout::from_size_align(len, 1) {
        Ok(layout) => unsafe { std::alloc::alloc(layout) },
        Err(_) => std::ptr::null_mut(),
    }
}

/// Release a buffer from [`raft_abi_alloc`]. Null pointers and zero lengths are
/// ignored; `ptr` and `len` must match the original allocation exactly.
#[no_mangle]
pub extern "C" fn raft_abi_free(ptr: *mut u8, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }
    // SAFETY: `ptr`/`len` come from a matching `raft_abi_alloc` call — the
    // documented alloc/free contract in ABI.md.
    if let Ok(layout) = std::alloc::Layout::from_size_align(len, 1) {
        unsafe { std::alloc::dealloc(ptr, layout) };
    }
}

/// Construct a node from a native-endian u64 peers array (dedup/sort/self-strip
/// happens inside). Returns a handle (>0), or 0 on invalid config, a null
/// `peers_ptr` with `peers_len > 0`, or allocation failure.
#[no_mangle]
pub extern "C" fn raft_node_new(
    id: u64,
    peers_ptr: *const u64,
    peers_len: usize,
    election_timeout_min_ms: u64,
    election_timeout_max_ms: u64,
    heartbeat_interval_ms: u64,
    seed: u64,
    now_ms: u64,
) -> usize {
    if peers_len > 0 && peers_ptr.is_null() {
        return 0;
    }
    let peers: Vec<u64> = if peers_len == 0 {
        Vec::new()
    } else {
        // SAFETY: non-null (checked) with `peers_len` valid u64 elements per the
        // caller contract; `to_vec` copies out immediately.
        unsafe { std::slice::from_raw_parts(peers_ptr, peers_len) }.to_vec()
    };
    let config = Config {
        election_timeout_min_ms,
        election_timeout_max_ms,
        heartbeat_interval_ms,
    };
    match Node::new(id, peers, config, seed, now_ms) {
        Ok(node) => Box::into_raw(Box::new(FfiNode {
            node,
            pending_outbound: None,
        })) as usize,
        Err(_) => 0,
    }
}

/// Free a node handle. Safe on handle 0; one free per handle (no double-free).
#[no_mangle]
pub extern "C" fn raft_node_free(handle: usize) {
    if handle == 0 {
        return;
    }
    // SAFETY: reconstitutes the `Box<FfiNode>` created in `raft_node_new`;
    // contract is exactly one free per live handle.
    unsafe { drop(Box::from_raw(handle as *mut FfiNode)) };
}

/// Advance the node's logical clock. No-op on handle 0.
#[no_mangle]
pub extern "C" fn raft_node_tick(handle: usize, now_ms: u64) {
    if let Some(n) = node(handle) {
        n.tick(now_ms);
    }
}

/// Decode `msg_len` bytes as one wire frame and feed it to the node. Returns
/// 0 = accepted, -1 = bad handle, -2 = decode failure (frame discarded).
#[no_mangle]
pub extern "C" fn raft_node_step(
    handle: usize,
    from: u64,
    msg_ptr: *const u8,
    msg_len: usize,
    now_ms: u64,
) -> i32 {
    let n = match node(handle) {
        Some(n) => n,
        None => return -1,
    };
    if msg_ptr.is_null() {
        return -2;
    }
    // SAFETY: non-null (checked) and valid for `msg_len` bytes per contract.
    let bytes = unsafe { std::slice::from_raw_parts(msg_ptr, msg_len) };
    match Message::decode(bytes) {
        Ok(msg) => {
            n.step(from, &msg, now_ms);
            0
        }
        Err(_) => -2,
    }
}

/// Propose data on the leader. Returns the assigned index (>=1); 0 when not
/// leader (then `leader_hint`, if non-null, receives NO_NODE or a hint);
/// -1 = bad handle.
#[no_mangle]
pub extern "C" fn raft_node_propose(
    handle: usize,
    data_ptr: *const u8,
    data_len: usize,
    leader_hint: *mut u64,
) -> i64 {
    let n = match node(handle) {
        Some(n) => n,
        None => return -1,
    };
    let data = if data_ptr.is_null() {
        Vec::new()
    } else {
        // SAFETY: non-null (checked), valid for `data_len` bytes per contract.
        unsafe { std::slice::from_raw_parts(data_ptr, data_len) }.to_vec()
    };
    match n.propose(data) {
        Ok(idx) => idx as i64,
        Err(ProposeError::NotLeader { leader_hint: hint }) => {
            if !leader_hint.is_null() {
                // SAFETY: caller-provided writable `*mut u64` (null-checked).
                unsafe { *leader_hint = hint };
            }
            0
        }
    }
}

/// Write the wire-encoded StatusReport frame (type 5) via the buffer protocol.
/// Returns bytes written / needed length; -1 = bad handle.
#[no_mangle]
pub extern "C" fn raft_node_status(handle: usize, out_ptr: *mut u8, out_cap: usize) -> i32 {
    let n = match node(handle) {
        Some(n) => n,
        None => return -1,
    };
    let frame = Message::StatusReport(n.status()).to_vec();
    copy_out(&frame, out_ptr, out_cap)
}

/// Drain the outbox into one batch (see ABI.md) via the buffer protocol. The
/// drain is only committed when the batch fits; a non-fitting call caches the
/// batch so the next call returns the identical bytes. Returns bytes written /
/// needed length; -1 = bad handle.
#[no_mangle]
pub extern "C" fn raft_node_take_outbound(handle: usize, out_ptr: *mut u8, out_cap: usize) -> i32 {
    let w = match ffi(handle) {
        Some(w) => w,
        None => return -1,
    };
    let bytes = match w.pending_outbound.take() {
        Some(b) => b,
        None => encode_outbound(w.node.take_outbox()),
    };
    if bytes.len() > out_cap {
        // Does not fit: retain the (already materialized) batch for the caller's
        // second, correctly sized call; no messages are lost.
        let needed = bytes.len() as i32;
        w.pending_outbound = Some(bytes);
        needed
    } else {
        copy_out(&bytes, out_ptr, out_cap)
    }
}

/// Copy up to `max_entries` log entries from 1-based `start_index` into a batch
/// (see ABI.md) via the buffer protocol; out-of-range/0 starts yield count 0.
/// Returns bytes written / needed length; -1 = bad handle.
#[no_mangle]
pub extern "C" fn raft_node_log_slice(
    handle: usize,
    start_index: u64,
    max_entries: u32,
    out_ptr: *mut u8,
    out_cap: usize,
) -> i32 {
    let n = match node(handle) {
        Some(n) => n,
        None => return -1,
    };
    let entries = n.log_slice(start_index, max_entries as usize);
    let bytes = encode_log_slice(entries);
    copy_out(&bytes, out_ptr, out_cap)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Role, StatusReport, NO_NODE};
    use std::convert::TryInto;
    use std::ptr;

    const MIN: u64 = 100;
    const MAX: u64 = 600;
    const HB: u64 = 30;
    // One cluster-wide seed. `Node::new` XOR-s the id into it, so every node
    // still gets a distinct RNG state; passing `id` here would collapse every
    // node to state 0 and perfectly synchronize their elections (the exact
    // livelock the Part 2 sim suite caught).
    const SEED: u64 = 0x5EED;

    fn new_node(id: u64, peers: &[u64], now: u64) -> usize {
        raft_node_new(id, peers.as_ptr(), peers.len(), MIN, MAX, HB, SEED, now)
    }

    fn read_status_frame(h: usize) -> Vec<u8> {
        let need = raft_node_status(h, ptr::null_mut(), 0);
        assert!(need > 0);
        let mut buf = vec![0u8; need as usize];
        let w = raft_node_status(h, buf.as_mut_ptr(), buf.len());
        assert_eq!(w, need);
        buf
    }

    fn status_of(h: usize) -> StatusReport {
        match Message::decode(&read_status_frame(h)).unwrap() {
            Message::StatusReport(s) => s,
            _ => panic!("expected StatusReport frame"),
        }
    }

    fn take_batch(h: usize) -> Vec<(u64, Vec<u8>)> {
        let need = raft_node_take_outbound(h, ptr::null_mut(), 0);
        assert!(need >= 4);
        let mut buf = vec![0u8; need as usize];
        let w = raft_node_take_outbound(h, buf.as_mut_ptr(), buf.len());
        assert_eq!(w, need);
        let count = u32::from_le_bytes(buf[0..4].try_into().unwrap()) as usize;
        let mut off = 4;
        let mut out = Vec::new();
        for _ in 0..count {
            let to = u64::from_le_bytes(buf[off..off + 8].try_into().unwrap());
            off += 8;
            let flen = u32::from_le_bytes(buf[off..off + 4].try_into().unwrap()) as usize;
            off += 4;
            let frame = buf[off..off + flen].to_vec();
            off += flen;
            out.push((to, frame));
        }
        out
    }

    fn read_log_slice(h: usize, start: u64, max: u32) -> Vec<(u64, Vec<u8>)> {
        let need = raft_node_log_slice(h, start, max, ptr::null_mut(), 0);
        assert!(need >= 4);
        let mut buf = vec![0u8; need as usize];
        let w = raft_node_log_slice(h, start, max, buf.as_mut_ptr(), buf.len());
        assert_eq!(w, need);
        let count = u32::from_le_bytes(buf[0..4].try_into().unwrap()) as usize;
        let mut off = 4;
        let mut out = Vec::new();
        for _ in 0..count {
            let term = u64::from_le_bytes(buf[off..off + 8].try_into().unwrap());
            off += 8;
            let dl = u32::from_le_bytes(buf[off..off + 4].try_into().unwrap()) as usize;
            off += 4;
            let data = buf[off..off + dl].to_vec();
            off += dl;
            out.push((term, data));
        }
        out
    }

    fn idx_of(ids: &[u64], id: u64) -> usize {
        ids.iter().position(|&x| x == id).unwrap()
    }

    /// Deliver every node's outbox to its targets; returns whether anything moved.
    fn relay(handles: &[usize], ids: &[u64], now: u64) -> bool {
        let mut moved = false;
        for i in 0..handles.len() {
            let from = ids[i];
            for (to, frame) in take_batch(handles[i]) {
                moved = true;
                let ti = idx_of(ids, to);
                let r = raft_node_step(handles[ti], from, frame.as_ptr(), frame.len(), now);
                assert_eq!(r, 0);
            }
        }
        moved
    }

    #[test]
    fn abi_version_is_one() {
        assert_eq!(raft_abi_version(), 1);
    }

    #[test]
    fn alloc_roundtrip_and_null_edge() {
        let p = raft_abi_alloc(16);
        assert!(!p.is_null());
        // The buffer is ours to write through before freeing.
        for i in 0..16 {
            unsafe { *p.add(i) = i as u8 };
        }
        raft_abi_free(p, 16);
        // Null and zero-length frees are ignored; zero-length allocs are null.
        raft_abi_free(ptr::null_mut(), 0);
        assert!(raft_abi_alloc(0).is_null());
    }

    #[test]
    fn full_cluster_through_abi() {
        let ids = [1u64, 2, 3];
        let handles = [
            new_node(1, &[2, 3], 0),
            new_node(2, &[1, 3], 0),
            new_node(3, &[1, 2], 0),
        ];
        for &h in &handles {
            assert!(h != 0);
        }

        // Drive ticks/steps until a leader emerges.
        let mut now = 0u64;
        let mut leader: Option<usize> = None;
        for _ in 0..400 {
            now += 10;
            for &h in &handles {
                raft_node_tick(h, now);
            }
            for _ in 0..8 {
                if !relay(&handles, &ids, now) {
                    break;
                }
            }
            for i in 0..3 {
                if matches!(status_of(handles[i]).role, Role::Leader) {
                    leader = Some(i);
                }
            }
            if leader.is_some() {
                break;
            }
        }
        let leader = leader.expect("a leader should emerge");
        let leader_h = handles[leader];

        // Propose on the leader → a real index.
        let mut hint: u64 = 0;
        let idx = raft_node_propose(leader_h, b"hello".as_ptr(), 5, &mut hint);
        assert!(idx >= 1);

        // The leader's next heartbeat batch decodes to AppendEntries for its peers.
        now += 100;
        raft_node_tick(leader_h, now);
        let batch = take_batch(leader_h);
        assert!(!batch.is_empty());
        let mut saw_append = false;
        for (to, frame) in &batch {
            if let Message::AppendEntries { leader: l, .. } = Message::decode(frame).unwrap() {
                assert_eq!(l, ids[leader]);
                assert!(*to == ids[(leader + 1) % 3] || *to == ids[(leader + 2) % 3]);
                saw_append = true;
            }
            let ti = idx_of(&ids, *to);
            assert_eq!(
                raft_node_step(handles[ti], ids[leader], frame.as_ptr(), frame.len(), now),
                0
            );
        }
        assert!(saw_append);

        // Let replication settle until the leader's commit index reaches `idx`.
        for _ in 0..40 {
            now += 40;
            for &h in &handles {
                raft_node_tick(h, now);
            }
            for _ in 0..8 {
                if !relay(&handles, &ids, now) {
                    break;
                }
            }
            if status_of(leader_h).commit_index >= idx as u64 {
                break;
            }
        }
        assert!(status_of(leader_h).commit_index >= idx as u64);

        // Buffer protocol — status: too-small buffer reports needed length and
        // writes nothing; exact buffer writes exactly that many bytes.
        let need = raft_node_status(leader_h, ptr::null_mut(), 0);
        assert!(need > 1);
        let mut small = vec![0xEEu8; (need - 1) as usize];
        assert_eq!(raft_node_status(leader_h, small.as_mut_ptr(), small.len()), need);
        assert!(small.iter().all(|&b| b == 0xEE)); // untouched
        let mut exact = vec![0u8; need as usize];
        assert_eq!(raft_node_status(leader_h, exact.as_mut_ptr(), exact.len()), need);
        assert!(matches!(
            Message::decode(&exact).unwrap(),
            Message::StatusReport(_)
        ));

        // Buffer protocol — take_outbound: two probes are equivalent (no drain on
        // the probe), then a fitting call yields exactly that batch.
        now += 100;
        raft_node_tick(leader_h, now);
        let need1 = raft_node_take_outbound(leader_h, ptr::null_mut(), 0);
        let need2 = raft_node_take_outbound(leader_h, ptr::null_mut(), 0);
        assert_eq!(need1, need2);
        assert!(need1 > 4);
        let mut ob = vec![0u8; need1 as usize];
        assert_eq!(
            raft_node_take_outbound(leader_h, ob.as_mut_ptr(), ob.len()),
            need1
        );

        // log_slice: count >= 1, our datum present; 0 and out-of-range clamp to 0.
        let entries = read_log_slice(leader_h, 1, 100);
        assert!(!entries.is_empty());
        assert!(entries.iter().any(|(_, d)| d == b"hello"));
        assert_eq!(read_log_slice(leader_h, 0, 10).len(), 0);
        assert_eq!(read_log_slice(leader_h, 9999, 10).len(), 0);

        for &h in &handles {
            raft_node_free(h);
        }
    }

    #[test]
    fn error_paths() {
        // Handle 0 → -1 everywhere it applies; tick/free are no-ops.
        assert_eq!(raft_node_step(0, 1, b"x".as_ptr(), 1, 0), -1);
        assert_eq!(raft_node_propose(0, b"x".as_ptr(), 1, ptr::null_mut()), -1);
        assert_eq!(raft_node_status(0, ptr::null_mut(), 0), -1);
        assert_eq!(raft_node_take_outbound(0, ptr::null_mut(), 0), -1);
        assert_eq!(raft_node_log_slice(0, 1, 1, ptr::null_mut(), 0), -1);
        raft_node_tick(0, 0);
        raft_node_free(0);

        // Invalid config → 0.
        assert_eq!(
            raft_node_new(1, ptr::null(), 0, 0, 200, 30, 1, 0),
            0
        );

        // Garbage step → -2, node untouched.
        let h = new_node(1, &[2, 3], 0);
        assert!(h != 0);
        let before = read_status_frame(h);
        let garbage = [0xFFu8, 0x00, 0x11, 0x22];
        assert_eq!(
            raft_node_step(h, 2, garbage.as_ptr(), garbage.len(), 0),
            -2
        );
        assert_eq!(read_status_frame(h), before);
        raft_node_free(h);

        // Propose on a follower → 0; hint written (NO_NODE or a peer), and the
        // null-pointer variant does not crash.
        let f = new_node(5, &[6, 7], 0);
        assert!(f != 0);
        let mut hint: u64 = 12345;
        assert_eq!(raft_node_propose(f, b"data".as_ptr(), 4, &mut hint), 0);
        assert!(hint == NO_NODE || hint == 6 || hint == 7);
        assert_eq!(raft_node_propose(f, b"data".as_ptr(), 4, ptr::null_mut()), 0);
        raft_node_free(f);
    }
}

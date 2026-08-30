// Node smoke test: load the built wasm artifact and drive a 3-node cluster
// through the raw C ABI exactly like the browser page does.
// Run: node tests/wasm-smoke.mjs (from portfolio/projects/raft-cluster)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bytes = readFileSync(join(root, "web", "raft_core.wasm"));
const { instance } = await WebAssembly.instantiate(bytes, {});
const e = instance.exports;

if (e.raft_abi_version() !== 1) throw new Error("bad ABI version");

const u64 = (v) => BigInt(v);
const seed = 0x5eedn;

function newNode(id, peers) {
  const buf = new BigInt64Array(peers.map((v) => BigInt(v)));
  const ptr = e.raft_abi_alloc(buf.byteLength);
  new Uint8Array(e.memory.buffer, ptr, buf.byteLength).set(new Uint8Array(buf.buffer));
  const h = e.raft_node_new(u64(id), ptr, peers.length, u64(900), u64(1800), u64(250), seed, 0n);
  e.raft_abi_free(ptr, buf.byteLength);
  if (h === 0) throw new Error(`node ${id} failed`);
  return h;
}

function readBatch(h, fn) {
  const need = fn(0, 0);
  if (need <= 0) return new Uint8Array(0);
  const ptr = e.raft_abi_alloc(need);
  const written = fn(ptr, need);
  const out = new Uint8Array(e.memory.buffer, ptr, written).slice();
  e.raft_abi_free(ptr, need);
  return out;
}

function status(h) {
  const frame = readBatch(h, (p, c) => e.raft_node_status(h, p, c));
  const v = new DataView(frame.buffer);
  return { role: v.getUint8(1), term: v.getBigUint64(2, true), commit: v.getBigUint64(18, true) };
}

function takeOutbound(h) {
  const batch = readBatch(h, (p, c) => e.raft_node_take_outbound(h, p, c));
  const v = new DataView(batch.buffer);
  const count = v.getUint32(0, true);
  const out = [];
  let off = 4;
  for (let i = 0; i < count; i++) {
    const to = v.getBigUint64(off, true); off += 8;
    const len = v.getUint32(off, true); off += 4;
    out.push({ to: Number(to), frame: batch.slice(off, off + len) });
    off += len;
  }
  return out;
}

function deliver(handles, now) {
  for (let round = 0; round < 8; round++) {
    let moved = false;
    for (const [from, h] of handles) {
      for (const msg of takeOutbound(h)) {
        moved = true;
        const p = e.raft_abi_alloc(msg.frame.length);
        new Uint8Array(e.memory.buffer, p, msg.frame.length).set(msg.frame);
        const rc = e.raft_node_step(handles.get(msg.to), u64(from), p, msg.frame.length, now);
        e.raft_abi_free(p, msg.frame.length);
        if (rc !== 0) throw new Error(`step rc=${rc}`);
      }
    }
    if (!moved) break;
  }
}

const ids = [1, 2, 3];
const handles = new Map(ids.map((id) => [id, newNode(id, ids.filter((x) => x !== id))]));

let now = 0n;
let leader = 0;
for (let step = 0; step < 400 && leader === 0; step++) {
  now += 10n;
  for (const h of handles.values()) e.raft_node_tick(h, now);
  deliver(handles, now);
  for (const [id, h] of handles) {
    if (status(h).role === 2) leader = id;
  }
}
if (leader === 0) throw new Error("no leader emerged in 4s of sim time");

const data = new TextEncoder().encode("hello raft");
const dp = e.raft_abi_alloc(data.length);
new Uint8Array(e.memory.buffer, dp, data.length).set(data);
const hint = e.raft_abi_alloc(8);
const idx = e.raft_node_propose(handles.get(leader), dp, data.length, hint);
e.raft_abi_free(hint, 8);
e.raft_abi_free(dp, data.length);
if (idx < 1n) throw new Error("propose rejected on leader");

let final = status(handles.get(leader));
for (let step = 0; step < 100 && final.commit < idx; step++) {
  now += 10n;
  for (const h of handles.values()) e.raft_node_tick(h, now);
  deliver(handles, now);
  final = status(handles.get(leader));
}
if (final.commit < idx) throw new Error(`entry ${idx} never committed (commit=${final.commit})`);

for (const h of handles.values()) e.raft_node_free(h);
console.log(`wasm-smoke OK: leader n${leader} term ${final.term}, proposed idx ${idx}, commit ${final.commit}`);

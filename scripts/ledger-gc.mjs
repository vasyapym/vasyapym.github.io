#!/usr/bin/env node
// GC for .agents/agent-ledger.json — a mailbox, not an archive.
// Removes entries older than ~14 days (acked or not); git history keeps the originals.
// Usage: node scripts/ledger-gc.mjs [--days N] [--dry-run]
import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const daysIdx = argv.indexOf("--days");
const DAYS = daysIdx !== -1 ? Number(argv[daysIdx + 1]) || 14 : 14;

const LEDGER = new URL("../.agents/agent-ledger.json", import.meta.url);
const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;

const keep = [];
const dropped = [];
for (const entry of ledger.entries ?? []) {
  const ts = Date.parse(entry.ts ?? "");
  if (Number.isFinite(ts) && ts < cutoff) dropped.push(entry);
  else keep.push(entry);
}

console.log(`ledger-gc: ${dropped.length} of ${ledger.entries?.length ?? 0} entries older than ${DAYS}d`);
for (const e of dropped) {
  console.log(`  drop ${e.id} (${e.kind}${e.ackBy ? ", acked" : ", unacked"})`);
}
if (dryRun || dropped.length === 0) {
  if (!dryRun) console.log("ledger-gc: nothing to remove");
  process.exit(0);
}

writeFileSync(
  LEDGER,
  JSON.stringify({ ...ledger, entries: keep }, null, 2) + "\n"
);
console.log(`ledger-gc: wrote ${keep.length} entries back`);

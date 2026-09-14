#!/usr/bin/env node
// Read-only hygiene report for the artifact conventions in CLAUDE.md ("Artifact hygiene").
// Usage: node scripts/janitor.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const problems = [];
const notes = [];

function ls(dir) {
  try {
    return readdirSync(join(ROOT, dir)).filter((f) => !f.startsWith("."));
  } catch {
    return [];
  }
}
function lsRaw(dir) {
  try {
    return readdirSync(join(ROOT, dir));
  } catch {
    return [];
  }
}

// 1. Briefs: files in docs/briefs with no ROUNDS.md row (live relay inputs or orphans?)
const rounds = readFileSync(join(ROOT, "docs/briefs/ROUNDS.md"), "utf8");
const briefFiles = ls("docs/briefs").filter((f) => f !== "ROUNDS.md");
const unindexed = briefFiles.filter((f) => !rounds.includes(f));
if (unindexed.length > 0) {
  notes.push(
    `docs/briefs/ files with no ROUNDS.md row (live relay inputs or orphans?):\n  ${unindexed.join("\n  ")}`
  );
}

// 2. Probe/scratch scripts left at portfolio root
const probeRe = /(probe|debug|shot)/i;
const strayProbes = ls("portfolio").filter((f) => f.endsWith(".mjs") && probeRe.test(f));
if (strayProbes.length > 0) {
  problems.push(`probe/shot scripts at portfolio root (move to portfolio/probes/): ${strayProbes.join(", ")}`);
}

// 3. .agent artifact rounds beyond the last 2 per project (by round number)
for (const project of ls("portfolio/projects")) {
  const artDirs = lsRaw(`portfolio/projects/${project}/.agent/iterations`);
  for (const task of artDirs) {
    const artDir = join(ROOT, "portfolio/projects", project, ".agent/iterations", task, "artifacts");
    const rounds = lsRaw(`portfolio/projects/${project}/.agent/iterations/${task}/artifacts`).sort();
    if (rounds.length <= 2) continue;
    problems.push(
      `${project}/${task}: ${rounds.length} artifact rounds (keep last 2): ${rounds.join(", ")}`
    );
  }
}

// 4. Untracked clutter at repo root (root keeps only open kitty-run inputs)
let porcelain = "";
try {
  porcelain = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  notes.push(`git status failed: ${e.message}`);
}
const rootClutter = porcelain
  .split("\n")
  .filter((l) => l.startsWith("?? ") && / (BRIEF|CONCEPT|HANDOFF|PROMPT|fable-)/.test(l))
  .map((l) => l.slice(3).trim());
if (rootClutter.length > 0) {
  notes.push(`untracked brief-like files at repo root:\n  ${rootClutter.join("\n  ")}`);
}

// 5. Stray graph store at repo root (routing: repo-level records nowhere)
if (existsSync(join(ROOT, ".project-history/graph.jsonl"))) {
  problems.push(
    "stray .project-history/graph.jsonl at repo root — repo-level work records nowhere; the owning session must move its node to the project's store and delete this one"
  );
}

// 6. Ledger entries older than 14 days (suggest GC)
const ledgerPath = join(ROOT, ".agents/agent-ledger.json");
if (existsSync(ledgerPath)) {
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const stale = (ledger.entries ?? []).filter(
    (e) => Number.isFinite(Date.parse(e.ts ?? "")) && Date.parse(e.ts) < cutoff
  );
  if (stale.length > 0) {
    notes.push(`${stale.length} ledger entries older than 14d — run \`node scripts/ledger-gc.mjs\``);
  }
}

console.log("== janitor ==");
for (const p of problems) console.log(`PROBLEM: ${p}`);
for (const n of notes) console.log(`note: ${n}`);
if (problems.length === 0 && notes.length === 0) console.log("clean");

#!/usr/bin/env node
// Fails the build when a Practice Map lesson payload file is untracked:
// web/lesson-data/*.ts chunks ship to the site only if committed, and a
// wired card without its committed chunk renders the reader's tabs fallback
// (the NQ01 sibling defect found with the 127–163 batch: 37 chunks were
// wired locally but never staged, the deployed loader had no registry entry
// for them). Run from the repo root or portfolio/: node scripts/check-lesson-chunks.mjs
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const lessonDataDir = path.join(
  root,
  "portfolio/projects/practice-map/web/lesson-data",
);

let raw = "";
try {
  raw = execFileSync("git", ["status", "--porcelain", "--", "portfolio/projects/practice-map/web/lesson-data"], {
    cwd: root,
    encoding: "utf8",
  });
} catch (e) {
  console.error(`check-lesson-chunks: git status failed: ${e.message}`);
  process.exit(1);
}

// `??` lines are the killers: a chunk file exists on disk but git has never
// seen it. A ` M` (modified committed chunk) would change live reader
// content without review — report it too, but as the same class of mistake.
const suspicious = raw
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("??") || l.startsWith("M"))
  .map((l) => l.replace(/^[?!MAD]+\s*/, ""));

if (suspicious.length > 0) {
  console.error(
    `check-lesson-chunks: ${suspicious.length} lesson-data file(s) not committed:\n` +
      suspicious.map((f) => `  ${f}`).join("\n") +
      `\nCommit them — otherwise the deployed loader misses their registry` +
      ` entries and deep readers fall back to the tabs view.`,
  );
  process.exit(1);
}

console.log("check-lesson-chunks: lesson-data tree fully committed");

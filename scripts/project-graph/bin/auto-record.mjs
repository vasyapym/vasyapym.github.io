#!/usr/bin/env node
// Auto-record: append one minimal iteration node per commit into the graph of
// the project (or main page) the commit touched. Designed to run from a
// post-commit hook; safe to re-run (idempotent per commit sha).
//
// Routing:
//   portfolio/projects/<id>/... -> portfolio/projects/<id>/.project-history/graph.jsonl
//   portfolio/...               -> portfolio/.project-history/graph.jsonl (main page / platform)
//   anything else               -> skipped (repo-level tooling/docs are not project iterations)
//
// Skipped commits: merges, subjects containing "[skip graph]", commits whose
// sha is already recorded as a git-commit artifact in the target graph.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fold, latestActiveNodeBy } from "../src/fold.mjs";
import {
  STORE_FILE,
  STORE_DIR,
  appendEvent,
  createStore,
  defaultStorePath,
  nextId,
  nowIso,
  readEvents,
} from "../src/store.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function git(args, cwd = REPO_ROOT) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

const headSha = () => ["rev-parse", "--short", "HEAD"];
const showSubject = (sha) => ["show", "-s", "--format=%s", sha];
const showFiles = (sha) => ["show", "--name-only", "--format=", sha];

function areasFor(paths) {
  const areas = new Set();
  for (const p of paths) {
    const project = /^portfolio\/projects\/([^/]+)\//.exec(p);
    if (project) {
      areas.add(join("portfolio", "projects", project[1]));
    } else if (p.startsWith("portfolio/")) {
      areas.add("portfolio");
    }
  }
  return [...areas];
}

function recordInto(areaDir, sha, subject) {
  const storePath = join(REPO_ROOT, areaDir, STORE_DIR, STORE_FILE);
  if (!existsSync(storePath)) {
    createStore(defaultStorePath(join(REPO_ROOT, areaDir)));
    appendEvent(storePath, {
      type: "node.added",
      id: "n1",
      ts: nowIso(),
      kind: "snapshot",
      actor: "user",
      title: `${areaDir} project start`,
    });
  }

  const events = readEvents(storePath);
  const state = fold(events);
  const already = [...state.nodes.values()].some((node) =>
    node.artifacts.some(
      (a) => a.kind === "git-commit" && (a.ref === sha || (typeof a.ref === "string" && a.ref.startsWith(sha))),
    ),
  );
  if (already) return `skipped ${areaDir} (${sha} already recorded)`;

  const id = nextId(events, "n");
  appendEvent(storePath, {
    type: "node.added",
    id,
    ts: nowIso(),
    kind: "iteration",
    actor: "user",
    title: subject,
    artifacts: [{ kind: "git-commit", ref: sha }],
    meta: { source: "auto" },
  });

  const tip = latestActiveNodeBy(state);
  if (tip && tip.id !== id) {
    appendEvent(storePath, {
      type: "edge.added",
      id: nextId(readEvents(storePath), "e"),
      ts: nowIso(),
      from: tip.id,
      to: id,
      rel: "continues",
    });
  }
  return `recorded ${sha} -> ${areaDir}/.project-history (${id}${tip ? `, continues ${tip.id}` : ""})`;
}

function main() {
  const shaArg = process.argv[2];
  const sha = shaArg ?? git(headSha());
  const subject = git(showSubject(sha));
  if (/^Merge /.test(subject)) {
    console.log(`auto-record: skipped merge commit ${sha}`);
    return;
  }
  if (subject.includes("[skip graph]")) {
    console.log(`auto-record: skipped ${sha} ([skip graph])`);
    return;
  }

  const files = git(showFiles(sha))
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f !== "" && !f.includes(`${STORE_DIR}/`));

  const areas = areasFor(files);
  if (areas.length === 0) {
    console.log(`auto-record: skipped ${sha} (no portfolio project files)`);
    return;
  }

  for (const area of areas) {
    console.log(`auto-record: ${recordInto(area, sha, subject)}`);
  }
}

main();

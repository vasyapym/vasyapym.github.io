import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CliError, defineSpec, parseArtifact, parseArgs, parseKeyValuePairs } from "../src/parse.mjs";
import { appendEvent, createStore, defaultStorePath, nextId, readEvents, resolveStorePath } from "../src/store.mjs";

test("parseArgs handles = values, space values and repeatable flags", () => {
  const spec = defineSpec({ string: ["actor", "title"], repeatable: ["artifact"], boolean: ["all"] });
  const { flags, positional } = parseArgs(
    ["--actor=design-iteration", "--artifact", "git-commit=abc", "--artifact=file=x.md", "--all", "extra", "--title", "Two words"],
    spec,
  );
  assert.equal(flags.actor, "design-iteration");
  assert.deepEqual(flags.artifact, ["git-commit=abc", "file=x.md"]);
  assert.equal(flags.all, true);
  assert.equal(flags.title, "Two words");
  assert.deepEqual(positional, ["extra"]);
});

test("parseArgs rejects unknown flags and missing values", () => {
  const spec = defineSpec({ string: ["actor"] });
  assert.throws(() => parseArgs(["--nope", "x"], spec), /Unknown flag --nope/);
  assert.throws(() => parseArgs(["--actor"], spec), /requires a value/);
});

test("parseKeyValuePairs keeps raw strings but parses JSON-looking values", () => {
  assert.deepEqual(parseKeyValuePairs(["gate=passed", "score=3", "tight=true"], "--meta"), [
    ["gate", "passed"],
    ["score", 3],
    ["tight", true],
  ]);
});

test("parseArtifact validates artifact kinds", () => {
  assert.deepEqual(parseArtifact(["doc-anchor=handoff.md#pass-10"]), [{ kind: "doc-anchor", ref: "handoff.md#pass-10" }]);
  assert.throws(() => parseArtifact(["screenshot=img.png"]), /Artifact kind must be one of/);
});

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), "project-graph-test-"));
}

test("resolveStorePath prefers --file then env then walks up from cwd", () => {
  const root = makeTempDir();
  try {
    const nested = join(root, "deeply", "nested");
    const storePath = createStore(join(root, ".project-history", "graph.jsonl"));
    mkdirSync(nested, { recursive: true });

    assert.equal(resolveStorePath({}, {}, nested), storePath);
    assert.equal(resolveStorePath({}, { PROJECT_GRAPH_FILE: "/tmp/env-store.jsonl" }, nested), "/tmp/env-store.jsonl");
    assert.equal(resolveStorePath({ file: "explicit.jsonl" }, { PROJECT_GRAPH_FILE: "/tmp/env-store.jsonl" }, nested), join(process.cwd(), "explicit.jsonl"));

    assert.throws(() => resolveStorePath({}, {}, makeTempDir()), /No project graph found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("createStore refuses to overwrite existing history", () => {
  const root = makeTempDir();
  try {
    const path = defaultStorePath(root);
    createStore(path);
    assert.throws(() => createStore(path), /already exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("appendEvent + readEvents roundtrip; malformed lines report their line number", () => {
  const root = makeTempDir();
  try {
    const path = join(root, "graph.jsonl");
    writeFileSync(path, "", "utf8");
    appendEvent(path, { type: "node.added", id: "n1", ts: "t1", kind: "snapshot", actor: "user", title: "root" });
    appendEvent(path, { type: "node.status", ts: "t2", id: "n1", status: "merged" });
    const entries = readEvents(path);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].line, 1);

    writeFileSync(path, "\n\n{\"type\":\"node.added\"\n", "utf8");
    assert.throws(() => readEvents(path), /line 3: invalid JSON/);

    writeFileSync(path, "\"just a string\"\n", "utf8");
    assert.throws(() => readEvents(path), /line 1: event must be a JSON object/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("nextId scans per-prefix maxima independently", () => {
  const events = [{ event: { id: "n1" } }, { event: { id: "n7" } }, { event: { id: "e2" } }];
  assert.equal(nextId(events, "n"), "n8");
  assert.equal(nextId(events, "e"), "e3");
  assert.equal(nextId([], "h"), "h1");
});

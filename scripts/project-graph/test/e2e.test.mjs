import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const bin = fileURLToPath(new URL("../bin/project-graph.js", import.meta.url));

function run(args, cwd) {
  return String(execFileSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" }));
}

function runFailing(args, cwd) {
  try {
    execFileSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });
  } catch (error) {
    const stderr = error.stderr?.toString() ?? "";
    assert.notEqual(error.status, 0, `expected failure, got success output: ${error.stdout}`);
    return stderr;
  }
  assert.fail(`expected command to fail: ${args.join(" ")}`);
}

test("end-to-end: init -> design pass -> handoff offer -> ack -> code closes handoff", () => {
  const root = makeTempDir();
  try {
    run(["init", "--title", "Portfolio redesign"], root);
    const storePath = join(root, ".project-history", "graph.jsonl");
    assert.equal(existsSync(storePath), true);

    const n2 = lastId(
      run(["add-node", "--actor", "design-iteration", "--kind", "decision", "--title", "Assembly field", "--summary", "spatial instruments", "--continues-from", "n1"], root),
    );
    const n3 = lastId(
      run(
        [
          "add-node",
          "--actor",
          "design-iteration",
          "--kind",
          "decision",
          "--title",
          "Quiet kinetic studio",
          "--artifact",
          "git-commit=abc1234",
          "--continues-from",
          n2,
        ],
        root,
      ),
    );
    const e1 = lastId(run(["add-edge", "--from", n2, "--to", n3, "--rel", "supersedes", "--rationale", "terminal-like / too much scene"], root));
    assert.match(e1, /^e\d+$/);

    const mermaid = run(["mermaid"], root);
    assert.match(mermaid, /```mermaid/);
    assert.match(mermaid, /Quiet kinetic studio/);
    assert.match(mermaid, /terminal-like \/ too much scene/);
    assert.match(mermaid, new RegExp(`style ${n2} stroke-dasharray`));

    const log = run(["log"], root);
    assert.match(log, /Portfolio redesign/);
    assert.match(log, new RegExp(`${n3}.*design-iteration`));

    const filteredLog = run(["log", "--actor", "user"], root);
    assert.match(filteredLog, /Portfolio redesign/);
    assert.doesNotMatch(filteredLog, /Assembly field/);

    const diffOutput = run(["diff", n2, n3], root);
    assert.match(diffOutput, /title/);
    assert.match(diffOutput, /- Assembly field/);
    assert.match(diffOutput, /\+ Quiet kinetic studio/);
    assert.doesNotMatch(diffOutput, /git artifacts/, "git range only when both nodes carry commits");

    const headBeforeHandoff = run(["head", "--actor", "design-iteration"], root);
    assert.match(headBeforeHandoff, new RegExp(`${n3}\\s+Quiet kinetic studio`));

    const offerOutput = run(
      [
        "handoff",
        "--to",
        "code-iteration",
        "--from-node",
        n3,
        "--rationale",
        "quality gate passed; implementation help needed",
        "--expect",
        "doc-anchor=docs/handoff.md#pass-11",
      ],
      root,
    );
    const h1 = lastHandoffId(storePath);
    assert.match(offerOutput, new RegExp(`Handoff ${h1} offered: design-iteration -> code-iteration`));

    const headWithOffer = run(["head"], root);
    assert.match(headWithOffer, /awaiting acknowledgement/);

    assert.match(runFailing(["ack", h1, "--actor", "design-iteration"], root), /addressed to "code-iteration"/);
    const ackOutput = run(["ack", h1, "--actor", "code-iteration", "--note", "continuing from the approved direction"], root);
    assert.match(ackOutput, new RegExp(`--via-handoff ${h1}`));
    assert.match(runFailing(["ack", h1, "--actor", "code-iteration"], root), /already acknowledged/);

    const closeOutput = run(
      ["add-node", "--actor", "code-iteration", "--kind", "iteration", "--title", "Wire hero copy changes", "--via-handoff", h1],
      root,
    );
    const n4 = closeOutput.split("\n")[0];
    assert.match(n4, /^n\d+$/);

    const logAfterHandoff = run(["log"], root);
    assert.match(logAfterHandoff, new RegExp(`${n4}.*code-iteration`), "chain crosses the handoff edge");

    const logFromMid = run(["log", "--from", n2], root);
    assert.doesNotMatch(logFromMid, /Portfolio redesign/, "--from starts mid-chain");
    assert.match(logFromMid, /Quiet kinetic studio/);

    assert.match(runFailing(["add-node", "--actor", "code-iteration", "--kind", "iteration", "--title", "x", "--via-handoff", h1], root), /already closed/);

    const headAfterClose = run(["head"], root);
    assert.match(headAfterClose, /\(none\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("end-to-end: validation failures exit non-zero with readable errors", () => {
  const root = makeTempDir();
  try {
    run(["init"], root);
    const n2 = lastId(run(["add-node", "--actor", "user", "--kind", "milestone", "--title", "Direction approved", "--continues-from", "n1"], root));

    assert.match(runFailing(["add-edge", "--from", n2, "--to", "n99", "--rel", "continues"], root), /Unknown node "n99"/);
    assert.match(runFailing(["add-edge", "--from", n2, "--to", n2, "--rel", "explodes"], root), /--rel must be one of/);
    assert.match(runFailing(["add-node", "--actor", "user", "--kind", "poem", "--title", "x"], root), /--kind must be one of/);
    assert.match(runFailing(["show"], root), /Usage: project-graph show/);
    assert.match(runFailing(["diff", "n1"], root), /Usage: project-graph diff/);
    assert.match(runFailing(["handoff", "--to", "code-iteration"], root), /--from-node is required/);
    assert.match(run(["log"], root), /Direction approved/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), "project-graph-e2e-"));
}

function lastId(output) {
  return output.trim().split("\n")[0];
}

function lastHandoffId(storePath) {
  const lines = readFileSync(storePath, "utf8").trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const event = JSON.parse(lines[i]);
    if (event.type === "handoff.offered") return event.id;
  }
  throw new Error("no handoff.offered event found");
}

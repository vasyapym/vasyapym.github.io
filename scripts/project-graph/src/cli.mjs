import { CliError } from "./parse.mjs";
import { defineSpec, parseArgs } from "./parse.mjs";
import { resolveStorePath } from "./store.mjs";

import { runInit } from "./commands/init.mjs";
import { runAddNode } from "./commands/add-node.mjs";
import { runAddEdge } from "./commands/add-edge.mjs";
import { runLog } from "./commands/log.mjs";
import { runShow } from "./commands/show.mjs";
import { runDiff } from "./commands/diff.mjs";
import { runMermaid } from "./commands/mermaid.mjs";
import { runHead } from "./commands/head.mjs";
import { runHandoff } from "./commands/handoff.mjs";
import { runAck } from "./commands/ack.mjs";

const commands = {
  init: {
    description: "create a new project graph with a root snapshot node",
    spec: defineSpec({ string: ["file", "title", "actor"] }),
    needsStore: false,
    run: runInit,
  },
  "add-node": {
    description: "append a node (iteration, milestone, decision, snapshot)",
    spec: defineSpec({
      string: ["actor", "kind", "title", "summary", "status", "via-handoff", "continues-from"],
      repeatable: ["artifact", "meta"],
    }),
    run: runAddNode,
  },
  "add-edge": {
    description: "append a typed edge between two existing nodes",
    spec: defineSpec({ string: ["from", "to", "rel", "rationale", "context-json"] }),
    run: runAddEdge,
  },
  log: {
    description: "traverse the linear history chain (--all for every node)",
    spec: defineSpec({ string: ["from", "actor"], boolean: ["all"] }),
    run: runLog,
  },
  show: {
    description: "show one node with its incident edges",
    spec: defineSpec({}),
    run: runShow,
  },
  diff: {
    description: "compare two nodes field by field (+ git range when both carry commits)",
    spec: defineSpec({}),
    run: runDiff,
  },
  mermaid: {
    description: "render the graph as a mermaid flowchart",
    spec: defineSpec({ string: ["status"] }),
    run: runMermaid,
  },
  head: {
    description: "current tip per actor and pending handoffs",
    spec: defineSpec({ string: ["actor"] }),
    run: runHead,
  },
  handoff: {
    description: "offer a handoff to the other iteration skill",
    spec: defineSpec({ string: ["to", "from-node", "rationale", "rel"], repeatable: ["expect"] }),
    run: runHandoff,
  },
  ack: {
    description: "acknowledge a handoff addressed to you",
    spec: defineSpec({ string: ["actor", "note"] }),
    run: runAck,
  },
};

function usage() {
  const rows = Object.entries(commands).map(([name, entry]) => `  ${name.padEnd(12)} ${entry.description}`);
  return [
    "project-graph — append-only project history graph",
    "",
    "Usage: project-graph <command> [flags]",
    "",
    ...rows,
    "",
    "Store resolution: --file > $PROJECT_GRAPH_FILE > nearest .project-history/graph.jsonl up from cwd.",
  ].join("\n");
}

export function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "-h" || command === "--help" || command === "help") {
    console.log(usage());
    return;
  }

  const entry = commands[command];
  if (!entry) {
    console.error(`Unknown command "${command}". Commands:\n${usage()}`);
    process.exitCode = 1;
    return;
  }

  try {
    const { flags, positional } = parseArgs(rest, entry.spec);
    const storePath = entry.needsStore === false ? null : resolveStorePath(flags);
    entry.run({ flags, positional, storePath, cwd: process.cwd() });
  } catch (error) {
    if (error instanceof CliError) {
      console.error(`error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

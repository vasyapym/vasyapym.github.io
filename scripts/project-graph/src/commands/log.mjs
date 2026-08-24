import { traceChain } from "../fold.mjs";
import { CliError } from "../parse.mjs";
import { loadState } from "../store.mjs";
import { formatNodeLine } from "../render.mjs";

export function runLog({ flags, storePath }) {
  const state = loadState(storePath);
  if (state.nodeOrder.length === 0) {
    console.log("(graph is empty)");
    return;
  }

  if (flags.all) {
    for (const id of state.nodeOrder) {
      console.log(formatNodeLine(state, id));
    }
    return;
  }

  if (flags.from !== undefined && !state.nodes.has(flags.from)) {
    throw new CliError(`Unknown node "${flags.from}". Known nodes: ${state.nodeOrder.join(", ")}`);
  }
  for (const entry of traceChain(state, flags.from)) {
    if (typeof entry === "string") {
      if (flags.actor === undefined || state.nodes.get(entry).actor === flags.actor) {
        console.log(formatNodeLine(state, entry));
      }
      continue;
    }
    console.log(`  ~ fork at ${entry.forkAt}: branches ${entry.branches.join(", ")} (--all for every node)`);
  }
}

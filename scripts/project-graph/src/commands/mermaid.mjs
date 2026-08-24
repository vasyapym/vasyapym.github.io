import { NODE_STATUSES } from "../fold.mjs";
import { CliError } from "../parse.mjs";
import { loadState } from "../store.mjs";
import { toMermaid } from "../render.mjs";

export function runMermaid({ flags, storePath }) {
  let statusFilter;
  if (flags.status !== undefined) {
    if (!NODE_STATUSES.includes(flags.status)) {
      throw new CliError(`--status must be one of ${NODE_STATUSES.join(", ")}, got "${flags.status}"`);
    }
    statusFilter = flags.status;
  }
  const state = loadState(storePath);
  if (state.nodeOrder.length === 0) {
    console.log("(graph is empty)");
    return;
  }
  console.log("```mermaid");
  console.log(toMermaid(state, { statusFilter }));
  console.log("```");
}

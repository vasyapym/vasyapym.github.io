import { CliError } from "../parse.mjs";
import { loadState } from "../store.mjs";
import { requireNode } from "../render.mjs";

export function runShow({ positional, storePath }) {
  const id = positional[0];
  if (id === undefined) throw new CliError("Usage: project-graph show <node-id>");

  const state = loadState(storePath);
  const node = requireNode(state, id);

  console.log(JSON.stringify(node, null, 2));
  const incoming = state.edgeOrder.map((e) => state.edges.get(e)).filter((edge) => edge.to === id);
  const outgoing = state.edgeOrder.map((e) => state.edges.get(e)).filter((edge) => edge.from === id);
  for (const label of ["in", "out"]) {
    const edges = label === "in" ? incoming : outgoing;
    if (edges.length === 0) continue;
    console.log(`${label}:`);
    for (const edge of edges) {
      console.log(`  ${edge.id}  ${edge.from} -> ${edge.to}  ${edge.rel}${edge.rationale ? ` — ${edge.rationale}` : ""}`);
    }
  }
}

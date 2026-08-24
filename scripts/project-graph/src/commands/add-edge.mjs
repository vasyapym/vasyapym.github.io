import { EDGE_RELS, HANDOFF_RELS, fold } from "../fold.mjs";
import { CliError, requireFlags } from "../parse.mjs";
import { appendEvent, appendEvents, nextId, nowIso, readEvents } from "../store.mjs";
import { requireNode } from "../render.mjs";

export function runAddEdge({ flags, storePath }) {
  requireFlags(flags, ["from", "to", "rel"]);
  if (!EDGE_RELS.includes(flags.rel)) {
    throw new CliError(`--rel must be one of ${EDGE_RELS.join(", ")}, got "${flags.rel}"`);
  }
  let context = {};
  if (flags["context-json"] !== undefined) {
    try {
      context = JSON.parse(flags["context-json"]);
    } catch (error) {
      throw new CliError(`--context-json is not valid JSON: ${error.message}`);
    }
    if (context === null || typeof context !== "object" || Array.isArray(context)) {
      throw new CliError("--context-json must be a JSON object");
    }
  }

  const events = readEvents(storePath);
  const state = fold(events);
  const sourceNode = requireNode(state, flags.from);
  requireNode(state, flags.to);

  const id = nextId(events, "e");
  const eventsToAppend = [
    {
      type: "edge.added",
      id,
      ts: nowIso(),
      from: flags.from,
      to: flags.to,
      rel: flags.rel,
      ...(flags.rationale !== undefined ? { rationale: flags.rationale } : {}),
      ...(Object.keys(context).length > 0 ? { context } : {}),
    },
  ];
  if (flags.rel === "supersedes" && sourceNode.status === "active") {
    eventsToAppend.push({
      type: "node.status",
      ts: nowIso(),
      id: flags.from,
      status: "superseded",
      reason: flags.rationale ?? "",
    });
  }
  appendEvents(storePath, eventsToAppend);
  console.log(id);
  if (HANDOFF_RELS.includes(flags.rel) && context.handoff === undefined) {
    console.error("note: prefer `project-graph handoff` + `ack` so the offer/acknowledgement pair is recorded.");
  }
}

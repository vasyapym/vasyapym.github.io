import { NODE_KINDS, NODE_STATUSES, fold } from "../fold.mjs";
import { CliError, parseArtifact, parseKeyValuePairs, requireFlags } from "../parse.mjs";
import { appendEvent, appendEvents, nextId, nowIso, readEvents } from "../store.mjs";

export function runAddNode({ flags, storePath }) {
  requireFlags(flags, ["actor", "kind", "title"]);
  if (!NODE_KINDS.includes(flags.kind)) {
    throw new CliError(`--kind must be one of ${NODE_KINDS.join(", ")}, got "${flags.kind}"`);
  }
  if (flags.status !== undefined && !NODE_STATUSES.includes(flags.status)) {
    throw new CliError(`--status must be one of ${NODE_STATUSES.join(", ")}`);
  }

  const events = readEvents(storePath);
  const state = fold(events);
  const id = nextId(events, "n");

  if (flags["continues-from"] !== undefined && flags["via-handoff"] !== undefined) {
    throw new CliError("Use either --continues-from or --via-handoff, not both");
  }
  let predecessor = null;
  if (flags["continues-from"] !== undefined) {
    predecessor = state.nodes.get(flags["continues-from"]);
    if (predecessor === undefined) {
      throw new CliError(`Unknown node "${flags["continues-from"]}". Known nodes: ${state.nodeOrder.join(", ") || "(none)"}`);
    }
  }

  const event = {
    type: "node.added",
    id,
    ts: nowIso(),
    kind: flags.kind,
    actor: flags.actor,
    title: flags.title,
  };
  if (flags.summary !== undefined) event.summary = flags.summary;
  if (flags.status !== undefined) event.status = flags.status;
  const artifacts = parseArtifact(flags.artifact);
  if (artifacts.length > 0) event.artifacts = artifacts;
  if (flags.meta.length > 0) event.meta = Object.fromEntries(parseKeyValuePairs(flags.meta, "--meta"));

  if (predecessor === null && flags["via-handoff"] === undefined) {
    appendEvent(storePath, event);
    console.log(id);
    return;
  }

  if (predecessor !== null) {
    const edgeId = nextId(events, "e");
    appendEvents(storePath, [event, { type: "edge.added", id: edgeId, ts: nowIso(), from: predecessor.id, to: id, rel: "continues" }]);
    console.log(id);
    console.log(`${edgeId} (${predecessor.id} -> ${id} continues)`);
    return;
  }

  closeHandoffWithNode(state, storePath, flags["via-handoff"], event, id);
}

function closeHandoffWithNode(state, storePath, handoffId, nodeEvent, nodeId) {
  const offer = state.offers.get(handoffId);
  if (offer === undefined) {
    throw new CliError(`Unknown handoff "${handoffId}". Known handoffs: ${state.offerOrder.join(", ") || "(none)"}`);
  }
  if (offer.ack === null) {
    throw new CliError(`Handoff "${handoffId}" has not been acknowledged yet. The receiver must run \`project-graph ack ${handoffId} --actor ${offer.toActor}\` first.`);
  }
  if (offer.ack.by !== nodeEvent.actor) {
    throw new CliError(`Handoff "${handoffId}" is addressed to "${offer.toActor}", but the new node's actor is "${nodeEvent.actor}"`);
  }
  if (offer.closedBy !== null) {
    throw new CliError(`Handoff "${handoffId}" was already closed by edge ${offer.closedBy}. Append further nodes with a plain \`continues\` edge.`);
  }

  const rel = offer.toActor === "code-iteration" ? "handoff:design-to-code" : "handoff:code-to-design";
  const edgeId = nextId(readEvents(storePath), "e");
  const edgeEvent = {
    type: "edge.added",
    id: edgeId,
    ts: nowIso(),
    from: offer.from,
    to: nodeId,
    rel,
    rationale: offer.rationale,
    context: { handoff: handoffId, ...(offer.expects.length > 0 ? { expects: offer.expects } : {}) },
  };
  appendEvents(storePath, [nodeEvent, edgeEvent]);
  console.log(nodeId);
  console.log(`${edgeId} (${rel} closes handoff ${handoffId})`);
}

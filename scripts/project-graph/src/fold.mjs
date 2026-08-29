import { CliError } from "./parse.mjs";

export const NODE_KINDS = ["iteration", "milestone", "decision", "snapshot"];
export const NODE_STATUSES = ["active", "superseded", "merged", "abandoned"];
export const EDGE_RELS = [
  "continues",
  "revision",
  "fork",
  "merge",
  "supersedes",
  "handoff:design-to-code",
  "handoff:code-to-design",
];
export const HANDOFF_RELS = ["handoff:design-to-code", "handoff:code-to-design"];
// "zcode" is a delegation agent that already recorded nodes in project
// histories; the validator must accept history exactly as it was written.
export const ACTORS = ["code-iteration", "design-iteration", "user", "zcode"];
export const HANDOFF_ACTORS = ["code-iteration", "design-iteration"];

function check(condition, line, message) {
  if (!condition) throw new CliError(`line ${line}: ${message}`);
}

function requireString(event, field, line) {
  check(typeof event[field] === "string" && event[field] !== "", line, `${field} must be a non-empty string`);
}

export function fold(entries) {
  const state = {
    nodes: new Map(),
    nodeOrder: [],
    edges: new Map(),
    edgeOrder: [],
    offers: new Map(),
    offerOrder: [],
  };

  for (const { line, event } of entries) {
    check(event !== null && typeof event === "object" && !Array.isArray(event), line, "event must be a JSON object");
    requireString(event, "type", line);
    requireString(event, "ts", line);

    switch (event.type) {
      case "node.added": {
        requireString(event, "id", line);
        requireString(event, "kind", line);
        requireString(event, "actor", line);
        requireString(event, "title", line);
        check(NODE_KINDS.includes(event.kind), line, `unknown node kind "${event.kind}" (${NODE_KINDS.join(", ")})`);
        check(ACTORS.includes(event.actor), line, `unknown actor "${event.actor}" (${ACTORS.join(", ")})`);
        check(!state.nodes.has(event.id), line, `duplicate node id "${event.id}"`);
        const status = event.status ?? "active";
        check(NODE_STATUSES.includes(status), line, `unknown status "${status}"`);
        state.nodes.set(event.id, {
          id: event.id,
          kind: event.kind,
          actor: event.actor,
          title: event.title,
          summary: event.summary ?? "",
          status,
          statusReason: "",
          artifacts: Array.isArray(event.artifacts) ? event.artifacts : [],
          meta: isPlainObject(event.meta) ? event.meta : {},
          ts: event.ts,
          addedLine: line,
        });
        state.nodeOrder.push(event.id);
        break;
      }
      case "node.status": {
        requireString(event, "id", line);
        requireString(event, "status", line);
        check(NODE_STATUSES.includes(event.status), line, `unknown status "${event.status}"`);
        const node = state.nodes.get(event.id);
        check(node !== undefined, line, `node.status for unknown node "${event.id}"`);
        node.status = event.status;
        node.statusReason = event.reason ?? "";
        break;
      }
      case "edge.added": {
        requireString(event, "id", line);
        requireString(event, "from", line);
        requireString(event, "to", line);
        requireString(event, "rel", line);
        check(EDGE_RELS.includes(event.rel), line, `unknown relation "${event.rel}"`);
        check(state.nodes.has(event.from), line, `edge ${event.id} references unknown source "${event.from}"`);
        check(state.nodes.has(event.to), line, `edge ${event.id} references unknown target "${event.to}"`);
        check(!state.edges.has(event.id), line, `duplicate edge id "${event.id}"`);
        const edge = {
          id: event.id,
          from: event.from,
          to: event.to,
          rel: event.rel,
          rationale: event.rationale ?? "",
          context: isPlainObject(event.context) ? event.context : {},
          ts: event.ts,
          addedLine: line,
        };
        state.edges.set(event.id, edge);
        state.edgeOrder.push(event.id);
        if (typeof edge.context.handoff === "string" && state.offers.has(edge.context.handoff)) {
          state.offers.get(edge.context.handoff).closedBy = edge.id;
        }
        break;
      }
      case "handoff.offered": {
        requireString(event, "id", line);
        requireString(event, "from", line);
        requireString(event, "toActor", line);
        check(HANDOFF_ACTORS.includes(event.toActor), line, `unknown handoff addressee "${event.toActor}"`);
        check(state.nodes.has(event.from), line, `handoff ${event.id} references unknown source "${event.from}"`);
        check(!state.offers.has(event.id), line, `duplicate handoff id "${event.id}"`);
        state.offers.set(event.id, {
          id: event.id,
          from: event.from,
          toActor: event.toActor,
          rationale: event.rationale ?? "",
          expects: Array.isArray(event.expects) ? event.expects : [],
          ack: null,
          closedBy: null,
          ts: event.ts,
          addedLine: line,
        });
        state.offerOrder.push(event.id);
        break;
      }
      case "handoff.acknowledged": {
        requireString(event, "handoff", line);
        requireString(event, "by", line);
        check(HANDOFF_ACTORS.includes(event.by), line, `unknown handoff receiver "${event.by}"`);
        const offer = state.offers.get(event.handoff);
        check(offer !== undefined, line, `acknowledgement for unknown handoff "${event.handoff}"`);
        check(offer.ack === null, line, `handoff "${event.handoff}" acknowledged twice (first at line ${offer.ack?.addedLine})`);
        check(offer.toActor === event.by, line, `handoff "${event.handoff}" is addressed to "${offer.toActor}", acknowledged by "${event.by}"`);
        offer.ack = { by: event.by, note: event.note ?? "", ts: event.ts, addedLine: line };
        break;
      }
      default:
        throw new CliError(`line ${line}: unknown event type "${event.type}"`);
    }
  }

  return state;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function openOffersFor(state, actor) {
  return state.offerOrder
    .map((id) => state.offers.get(id))
    .filter((offer) => offer.ack === null || offer.closedBy === null)
    .filter((offer) => actor === undefined || offer.toActor === actor);
}

export function latestActiveNodeBy(state, actor) {
  let found = null;
  for (const id of state.nodeOrder) {
    const node = state.nodes.get(id);
    if ((actor === undefined || node.actor === actor) && node.status === "active") found = node;
  }
  return found;
}

export function traceChain(state, fromId) {
  const start =
    fromId ??
    state.nodeOrder.find((id) => {
      return !state.edgeOrder.some((eid) => state.edges.get(eid).to === id);
    });
  if (start === undefined) return [];
  if (!state.nodes.has(start)) throw new CliError(`Unknown node "${start}"`);

  const chain = [start];
  const seen = new Set(chain);
  let cursor = start;

  while (true) {
    const outgoing = state.edgeOrder
      .map((id) => state.edges.get(id))
      .filter((edge) => edge.from === cursor && ["continues", "fork", ...HANDOFF_RELS].includes(edge.rel))
      .filter((edge) => !seen.has(edge.to));
    const uniqueTargets = [...new Set(outgoing.map((e) => e.to))];
    if (uniqueTargets.length !== 1) {
      if (uniqueTargets.length > 1) chain.push({ forkAt: cursor, branches: uniqueTargets });
      break;
    }
    cursor = uniqueTargets[0];
    seen.add(cursor);
    chain.push(cursor);
  }
  return chain;
}

import { CliError } from "./parse.mjs";

function escapeLabel(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/"/g, "'").replace(/\r?\n/g, "<br/>");
}

export function toMermaid(state, { statusFilter } = {}) {
  const visible = new Set();
  for (const id of state.nodeOrder) {
    const node = state.nodes.get(id);
    if (!statusFilter || node.status === statusFilter) visible.add(id);
  }
  const lines = ["flowchart LR"];
  for (const id of state.nodeOrder) {
    if (!visible.has(id)) continue;
    const node = state.nodes.get(id);
    lines.push(`  ${id}["${escapeLabel(node.title)}<br/><i>${escapeLabel(node.kind)}</i>"]`);
  }
  for (const eid of state.edgeOrder) {
    const edge = state.edges.get(eid);
    if (!visible.has(edge.from) || !visible.has(edge.to)) continue;
    const label = edge.rel === "continues" && !edge.rationale ? "" : edge.rationale || edge.rel;
    const labelPart = label ? `-->|"${escapeLabel(label)}"|` : "-->";
    lines.push(`  ${edge.from} ${labelPart} ${edge.to}`);
  }
  for (const id of visible) {
    if (state.nodes.get(id).status !== "active") {
      lines.push(`  style ${id} stroke-dasharray: 4 4, opacity:0.55`);
    }
  }
  return lines.join("\n");
}

export function formatNodeLine(state, entry) {
  if (typeof entry === "string") {
    const node = state.nodes.get(entry);
    const marker = node.status === "active" ? " " : node.status.slice(0, 1);
    return `${node.id.padEnd(6)} ${node.ts.slice(0, 10)}  ${node.kind.padEnd(10)} [${marker}] ${node.actor.padEnd(17)} ${node.title}`;
  }
  return `  ~ fork at ${entry.forkAt}: branches ${entry.branches.join(", ")} (--all for every node)`;
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(", ")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableValue(value[k])}`).join(", ")}}`;
  }
  return JSON.stringify(value);
}

export function diffNodes(a, b) {
  const fields = [
    ["title", a.title, b.title],
    ["kind", a.kind, b.kind],
    ["actor", a.actor, b.actor],
    ["status", `${a.status}${a.statusReason ? ` (${a.statusReason})` : ""}`, `${b.status}${b.statusReason ? ` (${b.statusReason})` : ""}`],
    ["summary", a.summary, b.summary],
    ["artifacts", stableValue(a.artifacts), stableValue(b.artifacts)],
    ["meta", stableValue(a.meta), stableValue(b.meta)],
  ];
  const changed = fields.filter(([, x, y]) => x !== y);
  const width = Math.max(...changed.map(([name]) => name.length), "field".length);
  const rows = [];
  if (changed.length === 0) {
    rows.push("Nodes are identical in all compared fields.");
    return rows.join("\n");
  }
  rows.push(`${"field".padEnd(width)}  ${a.id} -> ${b.id}`);
  rows.push("-".repeat(width + 2 + a.id.length + 4 + b.id.length));
  for (const [name, before, after] of changed) {
    rows.push(`${name.padEnd(width)}  - ${truncate(before)}`);
    rows.push(`${" ".repeat(width)}  + ${truncate(after)}`);
  }
  return rows.join("\n");
}

function truncate(value, max = 120) {
  const text = String(value);
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function gitRangeFor(nodeA, nodeB) {
  const refOf = (node) => node.artifacts.find((artifact) => artifact.kind === "git-commit")?.ref;
  const refA = refOf(nodeA);
  const refB = refOf(nodeB);
  if (!refA || !refB || refA === refB) return null;
  return `${refA}..${refB}`;
}

export function requireNode(state, id) {
  const node = state.nodes.get(id);
  if (node === undefined) {
    throw new CliError(
      `Unknown node "${id}". Known nodes: ${state.nodeOrder.join(", ") || "(none)"}`,
    );
  }
  return node;
}

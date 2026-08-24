import { HANDOFF_ACTORS, HANDOFF_RELS } from "../fold.mjs";
import { CliError, parseArtifact } from "../parse.mjs";
import { appendEvent, loadState, nextId, nowIso, readEvents } from "../store.mjs";
import { requireNode } from "../render.mjs";

const COUNTERPART = {
  "design-iteration": "code-iteration",
  "code-iteration": "design-iteration",
};

const REL_FOR_SENDER = {
  "design-iteration": "handoff:design-to-code",
  "code-iteration": "handoff:code-to-design",
};

export function runHandoff({ flags, storePath }) {
  if (flags.to === undefined) throw new CliError("--to is required: the receiving skill");
  if (!HANDOFF_ACTORS.includes(flags.to)) {
    throw new CliError(`--to must be one of ${HANDOFF_ACTORS.join(", ")}, got "${flags.to}"`);
  }
  if (flags["from-node"] === undefined) throw new CliError("--from-node is required: the node the work is handed off from");

  const events = readEvents(storePath);
  const state = loadState(storePath);
  const source = requireNode(state, flags["from-node"]);

  let rel;
  if (flags.rel !== undefined) {
    rel = flags.rel;
    if (!HANDOFF_RELS.includes(rel)) {
      throw new CliError(`--rel override must be one of ${HANDOFF_RELS.join(", ")}, got "${rel}"`);
    }
  } else if (REL_FOR_SENDER[source.actor] !== undefined) {
    rel = REL_FOR_SENDER[source.actor];
  } else {
    throw new CliError(`Cannot infer a handoff relation for actor "${source.actor}". Pass --rel explicitly.`);
  }
  if (COUNTERPART[source.actor] !== undefined && source.actor !== "user" && flags.to !== COUNTERPART[source.actor]) {
    throw new CliError(
      `Source node actor is "${source.actor}", so the counterpart is "${COUNTERPART[source.actor]}", but --to is "${flags.to}". Pass --rel explicitly to override.`,
    );
  }

  const expects = parseArtifact(flags.expect);
  const id = nextId(events, "h");
  appendEvent(storePath, {
    type: "handoff.offered",
    id,
    ts: nowIso(),
    from: source.id,
    toActor: flags.to,
    rationale: flags.rationale ?? "",
    expects,
  });

  console.log(`Handoff ${id} offered: ${source.actor} -> ${flags.to} (source ${source.id}, ${rel})`);
  if (flags.rationale) console.log(`Rationale: ${flags.rationale}`);
  if (expects.length > 0) console.log(`Expects: ${expects.map((e) => `${e.kind}=${e.ref}`).join(", ")}`);
  console.log("");
  console.log(`Receiver next session:`);
  console.log(`  project-graph head --actor ${flags.to}`);
  console.log(`  project-graph ack ${id} --actor ${flags.to} --note "<how you'll continue>"`);
}

import { ACTORS, latestActiveNodeBy, openOffersFor } from "../fold.mjs";
import { CliError } from "../parse.mjs";
import { loadState } from "../store.mjs";

export function runHead({ flags, storePath }) {
  if (flags.actor !== undefined && !ACTORS.includes(flags.actor)) {
    throw new CliError(`--actor must be one of ${ACTORS.join(", ")}, got "${flags.actor}"`);
  }
  const state = loadState(storePath);

  const actors = [...new Set(state.nodeOrder.map((id) => state.nodes.get(id).actor))];
  const shownActors = flags.actor !== undefined ? [flags.actor] : actors;

  console.log("tips:");
  for (const actor of shownActors) {
    const node = latestActiveNodeBy(state, actor);
    console.log(`  ${actor.padEnd(17)} ${node ? `${node.id}  ${node.title}` : "(none)"}`);
  }

  const pending = openOffersFor(state, flags.actor);
  console.log("pending handoffs:");
  if (pending.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const offer of pending) {
    const stage = offer.ack === null ? "awaiting acknowledgement" : "acknowledged, awaiting closing node";
    console.log(`  ${offer.id}  ${offer.from} -> ${offer.toActor}  [${stage}]`);
    if (offer.rationale) console.log(`      rationale: ${offer.rationale}`);
    if (offer.expects.length > 0) {
      console.log(`      expects: ${offer.expects.map((e) => `${e.kind}=${e.ref}`).join(", ")}`);
    }
  }
}

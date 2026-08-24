import { HANDOFF_ACTORS } from "../fold.mjs";
import { CliError } from "../parse.mjs";
import { appendEvent, loadState, nowIso } from "../store.mjs";

export function runAck({ positional, flags, storePath }) {
  const id = positional[0];
  if (id === undefined) throw new CliError("Usage: project-graph ack <handoff-id> --actor <skill> [--note \"...\"]");
  if (flags.actor === undefined) throw new CliError("--actor is required: who is acknowledging");
  if (!HANDOFF_ACTORS.includes(flags.actor)) {
    throw new CliError(`--actor must be one of ${HANDOFF_ACTORS.join(", ")}, got "${flags.actor}"`);
  }

  const state = loadState(storePath);
  const offer = state.offers.get(id);
  if (offer === undefined) {
    throw new CliError(`Unknown handoff "${id}". Known handoffs: ${state.offerOrder.join(", ") || "(none)"}`);
  }
  if (offer.ack !== null) {
    throw new CliError(`Handoff "${id}" was already acknowledged by ${offer.ack.by} at ${offer.ack.ts}`);
  }
  if (offer.closedBy !== null) {
    throw new CliError(`Handoff "${id}" was already closed by edge ${offer.closedBy}`);
  }
  if (offer.toActor !== flags.actor) {
    throw new CliError(`Handoff "${id}" is addressed to "${offer.toActor}", not "${flags.actor}"`);
  }

  appendEvent(storePath, {
    type: "handoff.acknowledged",
    ts: nowIso(),
    handoff: id,
    by: flags.actor,
    note: flags.note ?? "",
  });

  console.log(`Handoff ${id} acknowledged by ${flags.actor}.`);
  console.log(`Continue from the source node (${offer.from}): \`project-graph show ${offer.from}\``);
  console.log(`When your first node is ready, close the handoff: \`project-graph add-node ... --via-handoff ${id}\``);
}

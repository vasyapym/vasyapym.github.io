import { resolve } from "node:path";
import { ACTORS } from "../fold.mjs";
import { CliError } from "../parse.mjs";
import { appendEvent, createStore, defaultStorePath, nextId, nowIso, readEvents } from "../store.mjs";

export function runInit({ flags, cwd }) {
  const storePath = flags.file ? resolve(flags.file) : defaultStorePath(cwd);
  if (flags.actor !== undefined && !ACTORS.includes(flags.actor)) {
    throw new CliError(`--actor must be one of ${ACTORS.join(", ")}, got "${flags.actor}"`);
  }

  createStore(storePath);
  const events = readEvents(storePath);
  const id = nextId(events, "n");
  appendEvent(storePath, {
    type: "node.added",
    id,
    ts: nowIso(),
    kind: "snapshot",
    actor: flags.actor ?? "user",
    title: flags.title ?? "Project start",
  });
  console.log(`Created ${storePath}`);
  console.log(`${id} (root)`);
}

import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { basename } from "node:path";
import { CliError } from "./parse.mjs";
import { fold } from "./fold.mjs";

export const STORE_DIR = ".project-history";
export const STORE_FILE = "graph.jsonl";

export function nowIso() {
  return new Date().toISOString();
}

export function defaultStorePath(cwd = process.cwd()) {
  return join(cwd, STORE_DIR, STORE_FILE);
}

export function resolveStorePath(flags, env = process.env, cwd = process.cwd()) {
  if (flags.file) return resolve(flags.file);
  if (env.PROJECT_GRAPH_FILE) return resolve(env.PROJECT_GRAPH_FILE);

  let dir = resolve(cwd);
  while (true) {
    const candidate = join(dir, STORE_DIR, STORE_FILE);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new CliError(
    `No project graph found. Looked upward from ${cwd} for ${STORE_DIR}/${STORE_FILE}. Run \`project-graph init\` or pass --file.`,
  );
}

export function createStore(storePath) {
  const dir = dirname(storePath);
  if (basename(storePath) !== STORE_FILE) {
    throw new CliError(`Store file must be named ${STORE_FILE}, got ${basename(storePath)}`);
  }
  if (existsSync(storePath)) {
    throw new CliError(`Graph already exists at ${storePath}`);
  }
  mkdirSync(dir, { recursive: true });
  appendFileSync(storePath, "", "utf8");
  return storePath;
}

export function readEvents(storePath) {
  let raw;
  try {
    raw = readFileSync(storePath, "utf8");
  } catch {
    throw new CliError(`Cannot read graph at ${storePath}. Run \`project-graph init\` or pass --file.`);
  }
  return raw.split("\n").reduce((events, line, index) => {
    const trimmed = line.trim();
    if (trimmed === "") return events;
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw new CliError(`${storePath} line ${index + 1}: invalid JSON (${error.message})`);
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new CliError(`${storePath} line ${index + 1}: event must be a JSON object`);
    }
    events.push({ line: index + 1, event: parsed });
    return events;
  }, []);
}

export function appendEvent(storePath, event) {
  appendFileSync(storePath, `${JSON.stringify(event)}\n`, "utf8");
}

export function appendEvents(storePath, events) {
  for (const event of events) appendEvent(storePath, event);
}

export function loadState(storePath) {
  return fold(readEvents(storePath));
}

export function nextId(events, prefix) {
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const { event } of events) {
    if (typeof event?.id === "string") {
      const match = pattern.exec(event.id);
      if (match) max = Math.max(max, Number(match[1]));
    }
  }
  return `${prefix}${max + 1}`;
}

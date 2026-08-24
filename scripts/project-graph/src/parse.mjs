export class CliError extends Error {}

export function defineSpec({ string = [], repeatable = [], boolean = [] } = {}) {
  return { string, repeatable, boolean };
}

export function parseArgs(argv, spec) {
  const flags = {};
  for (const key of spec.repeatable) flags[key] = [];
  const positional = [];

  const isKnown = (key) =>
    spec.string.includes(key) || spec.repeatable.includes(key) || spec.boolean.includes(key);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (!arg.startsWith("--") || arg === "--") {
      positional.push(arg);
      continue;
    }
    let key = arg.slice(2);
    let value;
    const eq = key.indexOf("=");
    if (eq !== -1) {
      value = key.slice(eq + 1);
      key = key.slice(0, eq);
    }
    if (!isKnown(key)) {
      throw new CliError(`Unknown flag --${key}. Valid flags: ${[...spec.string, ...spec.repeatable, ...spec.boolean].map((k) => `--${k}`).join(", ")}`);
    }
    if (spec.boolean.includes(key)) {
      if (value !== undefined && value !== "true" && value !== "false") {
        throw new CliError(`Flag --${key} is boolean, got --${key}=${value}`);
      }
      flags[key] = value === undefined ? true : value === "true";
      continue;
    }
    if (value === undefined) {
      i += 1;
      if (i >= argv.length) throw new CliError(`Flag --${key} requires a value`);
      value = argv[i];
    }
    if (value === "") throw new CliError(`Flag --${key} requires a non-empty value`);
    if (spec.repeatable.includes(key)) {
      flags[key].push(value);
    } else {
      if (flags[key] !== undefined) throw new CliError(`Flag --${key} given more than once`);
      flags[key] = value;
    }
  }

  return { flags, positional };
}

export function requireFlags(flags, names) {
  const missing = names.filter((name) => {
    const value = flags[name];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === "";
  });
  if (missing.length > 0) {
    throw new CliError(`Missing required flag(s): ${missing.map((n) => `--${n}`).join(", ")}`);
  }
}

export function parseKeyValuePairs(pairs, label) {
  return pairs.map((pair) => {
    const eq = pair.indexOf("=");
    if (eq === -1) throw new CliError(`${label} entries must look like key=value, got "${pair}"`);
    const key = pair.slice(0, eq).trim();
    const raw = pair.slice(eq + 1).trim();
    if (key === "" || raw === "") throw new CliError(`${label} entries must look like key=value, got "${pair}"`);
    let value = raw;
    try {
      value = JSON.parse(raw);
    } catch {
      value = raw;
    }
    return [key, value];
  });
}

export function parseArtifact(pairs) {
  const allowedKinds = ["git-commit", "git-range", "file", "doc-anchor", "url"];
  return parseKeyValuePairs(pairs, "--artifact").map(([kind, ref]) => {
    if (!allowedKinds.includes(kind)) {
      throw new CliError(`Artifact kind must be one of ${allowedKinds.join(", ")}, got "${kind}"`);
    }
    if (typeof ref !== "string") throw new CliError(`Artifact reference must be a string`);
    return { kind, ref };
  });
}

import { execFileSync } from "node:child_process";
import { CliError } from "../parse.mjs";
import { loadState } from "../store.mjs";
import { diffNodes, gitRangeFor, requireNode } from "../render.mjs";

export function runDiff({ positional, storePath }) {
  const [aId, bId] = positional;
  if (aId === undefined || bId === undefined) throw new CliError("Usage: project-graph diff <node-a> <node-b>");

  const state = loadState(storePath);
  const a = requireNode(state, aId);
  const b = requireNode(state, bId);

  console.log(diffNodes(a, b));

  const range = gitRangeFor(a, b);
  if (range === null) return;
  console.log("");
  console.log(`git artifacts: ${range}`);
  try {
    const stat = execFileSync("git", ["diff", "--stat", ...range.split("..")], { encoding: "utf8" });
    process.stdout.write(stat.endsWith("\n") ? stat : `${stat}\n`);
  } catch {
    console.log(`(could not run git here; inspect with: git diff --stat ${range})`);
  }
}

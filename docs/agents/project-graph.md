# Project graph: iteration history and skill handoffs

Every project keeps an append-only **project graph** — a git-tracked JSONL event log that records iterations, milestones, design decisions, and the handoffs between `code-iteration` and `design-iteration`. Both skills read it to orient and append to it when a pass completes. The tool is `scripts/project-graph/` (zero dependencies; run `node scripts/project-graph/bin/project-graph.js <command>` or link the bin as `project-graph`).

## Storage

One file per project: `.project-history/graph.jsonl` at the project root. Resolution order for every command:

1. `--file <path>` flag
2. `$PROJECT_GRAPH_FILE`
3. nearest `.project-history/graph.jsonl` walking up from cwd

The file is **append-only**. Never rewrite or delete lines; corrections are new events (`node.status`, a superseding node). The current state is folded from the event stream, so the file is simultaneously the audit trail and the database.

Recording is **unconditional**: a missing store is never a reason to skip a record. When either iteration skill starts work in a project without `.project-history/graph.jsonl`, it runs `project-graph init` first, then appends as usual.

## Automatic recording

A `post-commit` hook (`scripts/project-graph/bin/auto-record.mjs`, wired via `git config core.hooksPath .githooks`) appends one minimal `iteration` node per commit automatically — no skill invocation required:

- **Routing** follows the files touched: `portfolio/projects/<id>/…` goes to that project's graph; any other `portfolio/…` goes to the main-page graph at `portfolio/.project-history/`; everything else (skills, docs, scripts) records nowhere.
- **Minimal by design**: title = commit subject, one `git-commit` artifact, `meta.source=auto`, chained to the current tip with a `continues` edge. That is enough for a future session to run `project-graph log`, see what changed and check out the diff.
- **Skipped**: merge commits, subjects containing `[skip graph]`, commits whose sha already appears as a `git-commit` artifact (idempotent), and paths inside `.project-history/`.
- **Fresh clones** need one command to re-arm the hook: `git config core.hooksPath .githooks`.

Skills append richer nodes (quality gates, handoffs, supersessions) on top of this baseline when they run; the hook guarantees history exists even when they don't.

## Schema

Each line is one JSON event. Events carry `type` and `ts`; everything else is per type.

| Event | Fields |
| --- | --- |
| `node.added` | `id`, `kind`, `actor`, `title`, optional `summary`, `status`, `artifacts`, `meta` |
| `node.status` | `id`, `status`, optional `reason` — folds into the node's status |
| `edge.added` | `id`, `from`, `to`, `rel`, optional `rationale`, `context` |
| `handoff.offered` | `id`, `from` (source node), `toActor`, optional `rationale`, `expects` |
| `handoff.acknowledged` | `handoff`, `by`, optional `note` |

Folded **nodes** represent project states (a pass, a milestone, a design direction, a snapshot):

- `kind`: `iteration` · `milestone` · `decision` · `snapshot`
- `actor`: `code-iteration` · `design-iteration` · `user`
- `status`: `active` · `superseded` · `merged` · `abandoned`
- `artifacts`: typed references — `{kind, ref}` where kind is `git-commit`, `git-range`, `file`, `doc-anchor`, or `url`. This is what makes diffing and continuation possible.
- `meta`: free-form key/values (quality-gate results, verified viewports, constraints)

Folded **edges** are typed transitions:

| `rel` | Meaning |
| --- | --- |
| `continues` | linear next pass (the default spine) |
| `revision` | rework of the same concern, not a new step |
| `fork` | branch: alternate candidate explored in parallel |
| `merge` | branches converging |
| `supersedes` | replaces a direction (adds `superseded` status to the source automatically) |
| `handoff:design-to-code` | design-iteration → code-iteration crossing |
| `handoff:code-to-design` | code-iteration → design-iteration crossing |

## Commands

```
project-graph init                                        create store + root snapshot
project-graph add-node --actor A --kind K --title T       append a node
                 [--summary S] [--status ST]
                 [--artifact kind=ref ...] [--meta k=v ...]
                 [--continues-from NODE]                  auto-appends a continues edge
                 [--via-handoff HID]                      closes an acknowledged handoff
project-graph add-edge --from N --to M --rel R            typed edge between existing nodes
project-graph log [--from N] [--actor A] [--all]          walk the spine; --all lists everything
project-graph show <node>                                 one node + incident edges
project-graph diff <a> <b>                                field diff + git range when both have commits
project-graph mermaid [--status active]                   render flowchart
project-graph head [--actor A]                            tips + pending handoffs
project-graph handoff --to SKILL --from-node N            offer a handoff
project-graph ack <hid> --actor SKILL [--note]            acknowledge a handoff addressed to you
```

Machine contract: when a write command prints multiple lines, the **first line is the primary new id**.

## Handoff protocol

The boundary between the two iteration skills is explicit in the graph. Three steps, one command each side.

1. **Sender offers.** After completing a pass, the sender appends its result node (with artifacts), then:
   ```
   project-graph handoff --to code-iteration --from-node n7 \
     --rationale "quality gate passed; needs implementation work" \
     --expect doc-anchor=docs/design-handoff.md#pass-11 --expect git-commit=abc1234
   ```
   This writes `handoff.offered h1`. Nothing else changes; the offer sits visible in `head`.
2. **Receiver acknowledges before working.** Every session of either skill starts with `project-graph head --actor <self>`. An unacknowledged handoff must be claimed first:
   ```
   project-graph ack h1 --actor code-iteration --note "continuing from the approved direction"
   ```
   Wrong addressee and double-acks are rejected by the CLI.
3. **Receiver closes with its first node.** The receiver's first appended node carries `--via-handoff h1`, which creates the typed edge (`handoff:design-to-code` / `handoff:code-to-design`) from the sender's node and marks the offer closed. Further nodes continue from it with `--continues-from`.

Rules:

- Handoffs exist only between `design-iteration` and `code-iteration`; the CLI infers the relation from the source node's actor and refuses mismatches unless `--rel` overrides.
- A handoff that is acknowledged but never closed stays visible in `head` as stale — chase it, don't fork around it.
- Context travels on the events themselves: rationale on the offer, expects as artifact descriptors, receiver's intent in the ack note. A receiving session should be able to orient from `show` + referenced artifacts without re-asking the user.

### Example workflow: design → code

```bash
project-graph add-node --actor design-iteration --kind decision --title "Refraction sea" \
  --artifact doc-anchor=docs/portfolio-redesign-handoff.md#pass-10 --continues-from n8
project-graph add-edge --from n9 --to n8 --rel supersedes --rationale "plate was static"
project-graph handoff --to code-iteration --from-node n9 \
  --rationale "shader needs perf work beyond a visual pass" --expect git-range=abc..def
# next session, code-iteration:
project-graph head --actor code-iteration
project-graph ack h3 --actor code-iteration --note "profiling shader first"
project-graph add-node --actor code-iteration --kind iteration --title "Pause shader off-screen" \
  --artifact git-commit=def5678 --meta gate=passed --via-handoff h3
```

### Example workflow: code → design

```bash
project-graph add-node --actor code-iteration --kind iteration --title "Extract hero component" \
  --continues-from n4 --artifact git-commit=aaa111
project-graph handoff --to design-iteration --from-node n5 \
  --rationale "refactor regressed hero at 390px" --expect url=https://review.example/shot.png
# next session, design-iteration:
project-graph ack h2 --actor design-iteration --note "mobile-first review round queued"
project-graph add-node --actor design-iteration --kind iteration --title "Mobile hero pass" --via-handoff h2
```

## Living example

`portfolio/.project-history/graph.jsonl` holds the backfilled main-page redesign history (nine superseded directions + active one). Each portfolio project keeps its **own** graph at `portfolio/projects/<id>/.project-history/graph.jsonl`, so no single file grows unbounded — resolution walks up from cwd, so work inside a project finds the project's graph first and the shell's only from the shell. `project-graph log` reconstructs an evolution chain; `project-graph mermaid` reproduces the decision graph from `docs/portfolio-redesign-handoff.md`.

## When a skill says "record this in the project graph"

Append the appropriate node via the CLI — never edit the JSONL by hand.

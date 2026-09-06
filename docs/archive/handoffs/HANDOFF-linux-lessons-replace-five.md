# Handoff — Practice Map: replace first five Linux lessons with the long-form md course

Follows the previous agent's handoff (pasted into chat 2026-08-29, saved at
`.openclaw-attachments/20260829-175509-31bc5132-73c-pasted_text_20260829-175509.txt`).
**User instruction: commit and push WITHOUT asking.** The user then said "finish previous
agent's beginning" — i.e. execute the plan below. Nothing has been mutated yet; repo is clean
except pre-existing untracked files (see "Repo state" — none of them are ours).

## Task

`linux-lesson-1.md` … `linux-lesson-5.md` sit at repo root (untracked, 165/120/212/210/167 lines,
Russian long-form lessons). Convert them into the first five cards of the Practice Map curriculum
and replace the existing first five cards. Keep the other 15 cards byte-identical. Then verify,
commit, push.

Route mapping (already validated against the custom-learning skill's intended order):

| md file | becomes lesson | replaces card id (line in curriculum.ts) |
| --- | --- | --- |
| linux-lesson-1.md | 1 · process lifecycle (fork/exec/wait/signals/jobs/ps//proc) | `linux-cli-terminal` (L90) |
| linux-lesson-2.md | 2 · file descriptors & I/O model (3-floor model, dup2, pipes, leaks) | `linux-filesystem-hierarchy` (L422) |
| linux-lesson-3.md | 3 · syscalls & user/kernel boundary (rings, ABI, errno, blocking, strace) | `linux-shell-fundamentals` (L783) |
| linux-lesson-4.md | 4 · shell as engineering interface (expansion, quoting, strict mode, traps) | `linux-file-operations` (L827) |
| linux-lesson-5.md | 5 · pipes & redirection (concurrency, backpressure, SIGPIPE, tee, fifo) | `linux-permissions` (L866) |

Splice boundaries in `portfolio/projects/practice-map/web/curriculum.ts` (1505 lines):
replace lines 90 through 905 exclusive — from the line `    id: "linux-cli-terminal",`
through the `},` that closes the `linux-permissions` card (the line just before
`    id: "linux-users-groups",` at L905). Card 6 `linux-users-groups` and everything after stays
untouched; the `const linuxTopics: readonly TopicCard[] = [` header and the trailing
`export const curriculum` stay untouched.

## Target format (curriculum.ts types, confirmed by reading the reader renderer)

- Card = `TopicCard`: `id`, `title`, `summary`, `concepts`, `objectives`, `lesson` (short
  theory: problem/model/mechanics/pitfalls/whenNot), `deepLesson` (the md content), top-level
  `examples`, `practicePrompt`, `checkPrompt`, `tier: 1`, `complexity`, `references`.
- `deepLesson.sections`: first section `heading: null` (renders as "intro" chip) = md preamble
  before the first `####`. Each `####` = one section (strip the `#### ` prefix). Section counts
  including intro: lesson 1 → 10, lesson 2 → 11, lesson 3 → 10, lesson 4 → 16, lesson 5 → 1
  (no `####` at all → single `heading: null` section).
- Paragraph text goes in `{ kind: "p", text: ... }` blocks; one md paragraph = one block. Keep
  paragraphs whole — do not split.
- Inline markup is hand-rolled (`lib/format.tsx`): `**bold**`, `*italic*`, `` `code` ``. The mds
  use bold and backticks heavily; they pass through as-is. No markdown links exist in the mds.
- Escaping: paragraph strings must escape backticks and `${`. Safest: emit TS template literals
  and escape `` ` `` → `` \` ``, `${` → `\${`; or emit double-quoted strings escaping `"` and
  backslashes. Lesson 4/5 contain `${PIPESTATUS[@]}`-style text — keep it out of raw template
  literals unescaped.
- Code fences (```c / ```sh / ```bash): each fence pair becomes a section-level
  `examples: [{ title, code, explanation }]` entry. `code` = fence body verbatim (trimmed),
  keep comment lines and `#include` lines (lesson 3 has them inside fences). `explanation` =
  one sentence drawn from the surrounding md text; `title` = short Russian label. Fence counts:
  L1: 14, L2: 0, L3: 14, L4: 10, L5: 8.
- `list` blocks: the five mds have no markdown bullet lists; do not invent any.
- `callout` blocks: none in the mds; add at most 1–2 per lesson ONLY where the md itself
  highlights a rule (e.g. lesson 1's escalation order paragraph "сначала SIGTERM…", lesson 5's
  pipefail/SIGPIPE warning). The check script asserts ≥2 callouts in the reader of card 1, so
  the new lesson 1 must carry at least two genuine ones (key or warning variants).
- Keep ids STABLE (`linux-cli-terminal`, `linux-filesystem-hierarchy`, `linux-shell-fundamentals`,
  `linux-file-operations`, `linux-permissions`) to preserve per-topic learner progress keyed by
  `topic.id` in `progress.ts`; change title/summary/content to match the new lessons. Fresh
  `lesson` (short theory), `objectives`, `concepts`, `practicePrompt`, `checkPrompt`,
  `references`, `complexity` must be written from the md content (old ones cover other topics).
- curriculum.ts will grow to roughly 2500–3000 lines; card 1 is already ~330 lines in this
  style. Expected, not a problem.

## Check script trap (found this session, NOT in the previous handoff)

`portfolio/projects/practice-map/tests/practice-map.check.mjs` "fragment fallback" block clicks
`cards[2]` and expects **fragment tabs** (`.practice-lesson-tabs` present, `.practice-reader`
absent). After this change card 3 is a deep lesson. Change that block to click `cards[5]`
(first remaining fragment card, `linux-users-groups`). All other assertions stay valid: 20
cards, ≥10 section chips on card 1 (lesson 1 has exactly 10), callouts ≥2, lists, inline
code/bold, mobile fit, copy button visibility.

## Verification (run from `portfolio/`)

1. Typecheck: `npx tsc --noEmit -p shell` (curriculum.ts is imported by
   `web/PracticeMapPage.tsx` and `web/progress.ts`).
2. `node projects/practice-map/tests/practice-map.check.mjs` — boots vite :5198 + headless
   Chrome; self-skips if Chrome absent — do NOT treat the skip as a pass; Chrome lives at
   /Applications/Google Chrome.app on this Mac.
3. Progress-state compatibility needs no migration (ids stable).

## Git convention (mandatory, observed from history)

- `core.hooksPath` = `.githooks`: `commit-msg` strips Codebuff trailers; `post-commit`
  `auto-record.mjs` appends a graph node and PRE-STAGES the touched
  `.project-history/graph.jsonl` — commit that staged graph file immediately after as
  `chore(graph): record <feat-sha>`. Pattern from history (two commits per change):
  1. `git add portfolio/projects/practice-map/web/curriculum.ts portfolio/projects/practice-map/tests/practice-map.check.mjs`
     → commit `feat(practice-map): replace first five Linux lessons with long-form md course`
  2. `git add` whichever `graph.jsonl` the hook staged (`portfolio/.project-history/` or
     `portfolio/projects/practice-map/.project-history/`) → commit `chore(graph): record <sha1>`
  3. `git push origin main`.
- Do NOT commit: `linux-lesson-*.md` (user hasn't decided whether sources belong in-repo; they
  stay untracked), dirty `portfolio/projects/explosion/physics/` files, `.openclaw-attachments/`,
  root-level agent docs (HANDOFF/HEARTBEAT/SOUL/USER/TOOLS/IDENTITY), `.opencode/`,
  `portfolio/typo-probe.mjs`, `portfolio/projects/explosion/physics/target/`.
- This handoff file itself (`HANDOFF-linux-lessons-replace-five.md`) also stays uncommitted.

## Repo state (verified 2026-08-29 ~18:00 MSK)

- Branch `main`, up to date with `origin/main`, HEAD `a65e494`.
- Untracked: `.githooks/commit-msg`, `.openclaw-attachments/`, `.opencode/`, agent docs,
  `linux-lesson-*.md`, `portfolio/projects/explosion/physics/part1-census.mjs`,
  `portfolio/projects/explosion/physics/target/`, `portfolio/typo-probe.mjs`.
- NO modified tracked files. The `world.rs` 280.0→390.0 tweak from the previous handoff is NOT
  present anymore (reverted or never landed) — re-verify with `git status` before committing.

## Why ZCode is not an option for the conversion

The previous agent already tried twice — empty model response, then progress timeout. The
payload (5 long-form lessons ≈ 150–200 KB of TS) is too large for ZCode this session. Do the
conversion NATIVELY via a deterministic Node conversion script (recommended: parse the md files,
emit the five TS card blocks, assert per-lesson section/fence counts 10/11/10/16/1 and
14/0/14/10/8 before splicing), then splice into curriculum.ts. Script is strongly preferred:
re-runnable and self-checking.

## Gotchas

- The check script spawns vite with cwd `portfolio/shell` itself; if running vite manually use
  that cwd, else 404.
- `curriculum.ts` uses `readonly` types; plain array literals are assignable, no special syntax
  needed.
- Reader chips/scrollspy need `data-section-index` — the renderer provides it automatically.
- Lesson 5's md contains a heredoc (`<<EOF`) inside a fence and `${PIPESTATUS[@]}` — all of it
  must land inside escaped `code` strings, never raw in template literals.
- Inline `code` spans in paragraphs use backticks — escape them per the escaping rule above.
- `npm run typecheck` at portfolio root routes to the shell workspace; equivalent to step 1.

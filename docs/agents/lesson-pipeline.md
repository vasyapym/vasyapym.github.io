# Lesson pipeline — Practice Map

Trigger: the owner says **"script lesson {topic}"** / «конвейерный урок {тема}», optionally with format, language, tier or model notes. The relay model is the owner's per-brief choice; nothing here depends on it.

Roles. The **author** is a chat model in a separate chat — no tools, no repo, no memory of prior rounds; it writes the lesson and its payload. The **owner** carries briefs and replies by hand. The **orchestrator** owns the disk and authors no lesson content: it briefs, salvages, converts, wires, checks, records.

Format: `docs/agents/lesson-format.md` — the owner's spec, pasted verbatim into every brief. A different format comes only from the owner, in the owner's words. The deep track (`lesson-iteration` skill and its skeleton) only when the owner asks for the full quality loop.

## Steps

1. **Sync.** `git pull --ff-only origin main`. Read `agent2/RELAY-kubernetes-lesson-log.md` (pipeline decisions) and the topic's log if one exists; create one beside it when a topic spans sessions. `NNN` = highest existing lesson number + 1, never reused. Slug = short English kebab-case for the topic; it becomes the topic id.
2. **Brief.** Compose per *The brief* below, save it in the briefs folder — for this repo the owner's vault, `TD Vault git\03-1_projects\briefs` (owner 2026-11-19) — and hand to the owner. Done when the reply is back.
3. **Salvage.** Cut the artifacts out between their markers (`sed`/`awk`, not by reading the essay) into `portfolio/projects/practice-map/lessons/NNN-<slug>.md`: payload comments first, lesson below; never overwrite. Light integration edits only: one `#` title present, obvious markdown damage, payload JSON mechanics (quotes, one line per comment), stray chat text dropped. The author's structure wins. Read the notes, the title, the first and last paragraphs; prose is neither edited nor fact-checked. Runnable claims (code, commands) are verified where an environment exists, else marked not executed; a sub-agent returns verdicts, never dumps. Check word count, language and payload validity against the format and the contract; a miss goes to a follow-up round, never to the orchestrator's pen.
4. **Convert.** `node scripts/convert-lesson.mjs lessons/NNN-<slug>.md` (`--json` to inspect; `--selftest` must pass). Done when block counts match the source, no unbalanced fence, fences (if any) titled via the `--titles` sidecar.
5. **Wire.** `node scripts/wire-lesson.mjs --lesson lessons/NNN-<slug>.md --sections <emitted.ts> --tier <tier>`; `--front` for an English lesson (EN-first: English areas lead a tier's list, Russian ones append). Tier: where the topic's siblings live, unless the owner names one. The script derives id (slug), title (H1), summary (first paragraph), complexity, references and the card/area fields; `--summary`, `--complexity`, `--references`, `--topic-id`, `--area-title`, `--area-description` are one-off rescues (e.g. a first paragraph that is not representative); `--dry` previews. Never author `concepts` — a dead field. Pre-flight rejects invalid payload JSON and a re-run against wired files. A tier with `volumes` hides what no volume lists: add the topic id to one volume in `tiers.ts` by hand in the same pass (slugs tech/film/music/literature/places/health/mind/science/society/language/games/career/orchestration; `orchestration` = how the agent is driven — model-runner/process-shell lessons, owner 2026-10-14 — never tech/film; folders appear from 8+ lessons; straddler candidates: the tier-volume pass record).
6. **Check.** Portfolio shell typecheck/build and `portfolio/projects/practice-map/tests/practice-map.check.mjs`; fix what the integration broke, touch nothing else. Lessons get no byte-exact verification: save and report.
7. **Record + deliver.** One project-graph node (kind `iteration`, actor `zcode`, artifact = lesson path); topic log (brief number, model as the owner names it, rounds, leftovers); commit and push without asking. Russian delivery note: lesson path, tier/area, checks run, the author's notes on what to verify, what was not verified, leftovers.

## The brief

Standing discipline: task stated briefly; *why, not what* wherever judgment is asked; facts, assumptions and open questions separated and labelled; context generous and verbatim, labelled current/superseded; the fixed opener («Answer as a chat model — no agentic operations…»); an output contract; a closing challenge line. A lesson brief carries, in this order:

- **Opener** — the fixed line.
- **Task** — a Practice Map lesson on the topic, in the owner's exact words.
- **Why** — what the owner said about this topic, verbatim, if anything. The format spec carries the standing why; it is not paraphrased.
- **Format** — `lesson-format.md` verbatim, labelled current; or the owner's format in the owner's words.
- **Honesty** — the block below, plus this topic's stakes (money, health, legal status) named as why.
- **Facts** — what the author cannot know: the site shows the H1 as the title and the first paragraph as the card summary, renders `##` sections as the lesson's parts, and feeds the payload into the lesson's practice and theory cards; sibling lessons (paths, titles; their openings verbatim where they would change the author's choices); the lesson's language if not English.
- **Assumptions / open questions** — labelled, real ones only (scope, the reader's situation). Nothing invented.
- **Output contract** — the block below, `<n>` (the brief's number in the relay sequence) and `<slug>` filled in.
- **Challenge** — the closing line.

Generous means everything that changes the author's judgment, verbatim; nothing that only shows effort. A read brief is a few KB.

### Honesty (standing block, pasted as is)

> The reader may act on this lesson. You write from memory, with a knowledge cutoff and no web. Date your knowledge where it bears on a decision; keep what changes slowly (mechanics, incentives, structure) apart from what changes by the year (numbers, fees, quotas, program names); invent no quotations, statistics or sources; where unsure, say so in the text rather than smoothing it over.

### Output contract (standing block, pasted as is; fill `<n>`, `<slug>`)

- First line: `reply <n>-<slug>`. Then a few lines of notes: choices made, what you are unsure of, what the reader should verify.
- `=== begin lesson ===` … `=== end lesson ===` — markdown: one `#` title, `##` sections of your choosing, prose. The format's word count counts the body only.
- `=== begin payload ===` … `=== end payload ===` — two HTML comments, one line each, valid JSON, in the lesson's language, no straight `"` inside strings (curly quotes or `\"`):
  - `<!-- lesson-meta: {"practicePrompt":"…","checkPrompt":"…"} -->` — an exercise the reader does with the lesson, 1–3 sentences; what the reader should be able to reproduce without looking, 1–3 sentences.
  - `<!-- lesson-theory: {"problem":"…","model":"…","mechanics":"…","pitfalls":["…"],"whenNot":"…"} -->` — the confusion the topic resolves, 1–2 sentences; the central model, 2–4; how it works, 3–6 concrete mechanisms in one string; 5–9 typical mistakes, one per item; where the lesson does not apply and what it does not claim — for a volatile topic, the date your knowledge is current to goes here.
- One reply, ~400 lines at most. Last line: `COMPLETE`.

## Follow-up rounds

- Thin, truncated, off-format, over-long, or payload missing or unrepairable: one follow-up brief carrying the lesson as salvaged verbatim (labelled current), the gap and why it matters, the same contract; the whole lesson again when it fits one reply, the missing part otherwise. The author revises; the orchestrator never writes prose and never pads. Length is the format's — no brief asks for "maximum length".
- Two rounds without a usable lesson: stop, report to the owner.
- Staging exists only for a format that cannot fit ~400 lines: the contract then asks the author to stop at a section boundary and end with `CONTINUES` instead of `COMPLETE`; the next brief carries the text verbatim and asks for the continuation; the payload comes with the last part. The default read is never staged.

## Operational notes

- `convert-lesson.mjs` derives `<base>Sections` from the filename (leading digits stripped); wire's regex requires the `Sections` suffix. Wire emits `web/lesson-data/<topic-id>.ts` (lazy chunk via `web/lessons-loader.ts`), splices `const <base>Topics`, updates `curriculum.ts` and the tier's areas in `tiers.ts`. The essay and the emitted TS never enter the orchestrator's context.
- Theory travels as the `lesson-theory` comment (preferred) or a legacy `--theory` TS object file (`problem: "…", … pitfalls: ["…"], whenNot: "…"`, one line per string, sinners-card style in `curriculum.ts`); `problem: >` scalars break the splice. A legacy lesson with every field explicit wires unchanged — explicit meta wins.
- New tier = a row added to `tiers.ts` by hand, in display order, `areas: []` (pre-filled areas fail with "already in tier"); wire cannot create tiers. If the position shifts rows, re-sync the check's positional gates (`.pg-tier-list button:nth-child(N)`, `nth-last-child(1)` = thinking tier) and run `portfolio/probes/tier-order-probe.mjs` from `portfolio/`.
- Full check, from `portfolio/`: `CHROME_PATH="$HOME/Library/Caches/ms-playwright/chromium-1134/chrome-mac/Chromium.app/Contents/MacOS/Chromium" node projects/practice-map/tests/practice-map.check.mjs`.
- Wire failed mid-way: `git restore curriculum.ts tiers.ts`, `rm web/lesson-data/<topic-id>.ts`, re-add the tier if new, re-run.
- Example titles/explanations are content: the converter carries them only from the `--titles` sidecar (1-based fence index → `{title, explanation}`).
- `agent2/` is untracked working space (logs, sidecars; briefs live in the owner's vault folder); nothing from it is staged. Bulky artifacts live under `/tmp` or `agent2/`, inspected with `grep`/`diff`/`sed -n` or by a sub-agent; a few KB at most enter the orchestrator's context.
- `lessons/NNN-<slug>.md` is the source of truth; never improve only the converted copy.

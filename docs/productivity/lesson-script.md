## What it does

`lesson-script` runs the fast pipeline that turns one relay round with a chat model into a published Practice Map lesson: a free-form Russian essay is drafted in a single round — together with its integration payload (practice prompt, check prompt, theory) — then salvaged into the lessons directory, converted, and wired into the curriculum through repository scripts.

Its defining constraint is a **context budget**: the essay never passes through the agent's window at all — the owner's reply is written straight to the lesson file, and the agent reads only converter diagnostics (counts, warning lines), editing by grep targets. The payload riding with the essay is what makes that possible: everything the curriculum card needs except the prose arrives in two HTML comments the chat model itself writes, and the wiring script derives the rest (id, title, summary, tier, complexity, references) mechanically.

## When to reach for it

You invoke this by typing `/lesson-script <topic>` — the agent won't reach for it on its own.

| Situation | Reach for |
| --- | --- |
| A topic needs a lesson now, from one relay round | `/lesson-script` |
| The chat model's essay is already drafted (with its payload) and just needs integrating | `/lesson-script` |
| A batch of drafted essays needs wiring into several model tiers | `/lesson-script` |
| A lesson deserves the full planned, depth-audited, consistency-audited loop | [lesson-iteration](https://aihero.dev/skills-lesson-iteration) |
| Interactive, one-subcard-at-a-time learning with proof projects | [custom-learning](https://aihero.dev/skills-custom-learning) |

## Prerequisites

The skill writes into the Practice Map workspace — `portfolio/projects/practice-map/lessons/`, `curriculum.ts`, and the tier registry — and drives the repo's converter and wiring scripts (`scripts/convert-lesson.mjs`, `scripts/wire-lesson.mjs`). The relay round needs a chat model the owner can paste a prompt into; the wiring needs the tier the lesson should land in (say it at invocation, e.g. `fable-5.1-high`).

## One round, then salvage

The prompt is deliberately minimal — length routes the chat model to a stronger tier — and the reply comes back as one free-form essay plus two trailing comment blocks: `lesson-meta` (the practice and check prompts) and `lesson-theory` (the card's five theory fields). Salvage is mechanical: place the file under its next number, move the comments to the top, fix what the converter's diagnostics flag. The agent authors **nothing**; the essay's structure wins as-is. Wiring is one script invocation — `--front` for English lessons (the EN-first rule: English areas lead a tier's lesson list), everything else derived, and `--summary` as the one-off rescue flag when a first paragraph turns out unrepresentative — so a batch of lessons costs little more than a single one.

## Common questions

**How is this different from `/lesson-iteration`?**

lesson-iteration is the deep track: coverage ledger, depth audit, consistency audit, and the full quality loop — for a topic that deserves a deliberately authored lesson. lesson-script spends one relay round and integrates the result; its quality bar is the salvage depth bar (mechanisms explain their why, no invented citations or benchmark numbers), not the audited loop.

**What stays manual?**

By the agent: nothing. The chat model writes the three authored blocks in the relay round (practice prompt, check prompt, theory — plus an optional one-line summary); ids, titles, summaries and tier metadata are derived by the wiring script from the filename, the H1 and the first paragraph.

**What if there's no environment to verify claims against?**

They get marked as not executed and the delivery note says so honestly. Verification is done by grepping primary sources — never by pulling whole files into the agent's window.

## It's working if

- The lesson lands as one new numbered file whose comment blocks parse, and the owner's essay structure survives untouched apart from recorded fact fixes.
- The wiring step is a single script invocation — no lesson text ever re-pasted into a hand edit; English lessons sit first in their tier's list.
- Typecheck and build pass; the check script's no-Chrome skip is the expected outcome.
- The delivery note names the lesson path, the area, the checks run, and anything not executed.

## Where it fits

A **standalone authoring tool** for the Practice Map — the fast sibling of [lesson-iteration](https://aihero.dev/skills-lesson-iteration), which shares the same destination through an audited loop. [minimize-iteration](https://aihero.dev/skills-minimize-iteration) is the vocabulary behind its relay prompt: length is routing, so the prompt pays only for what the chat model cannot infer. For choosing between the flows, ask [ask-matt](https://aihero.dev/skills-ask-matt).

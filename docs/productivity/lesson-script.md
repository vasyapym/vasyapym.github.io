## What it does

`lesson-script` runs the fast pipeline that turns one relay round with a chat model into a published Practice Map lesson: a free-form Russian essay is drafted in a single round, then salvaged into the lessons directory, converted, and wired into the curriculum through repository scripts.

Its defining constraint is a **context budget**: the essay passes through the agent's window exactly once — the owner's reply written straight to the lesson file — and every bulky artifact after that (emitted TS, configs, diffs) stays in files inspected by `grep` and `diff`, with the wiring itself done by a script.

## When to reach for it

You invoke this by typing `/lesson-script <topic>` — the agent won't reach for it on its own.

| Situation | Reach for |
| --- | --- |
| A topic needs a lesson now, from one relay round | `/lesson-script` |
| The chat model's essay is already drafted and just needs integrating | `/lesson-script` |
| A lesson deserves the full planned, depth-audited, consistency-audited loop | [lesson-iteration](https://aihero.dev/skills-lesson-iteration) |
| Interactive, one-subcard-at-a-time learning with proof projects | [custom-learning](https://aihero.dev/skills-custom-learning) |

## Prerequisites

The skill writes into the Practice Map workspace — `portfolio/projects/practice-map/lessons/`, `curriculum.ts`, and the tier registry — and drives the repo's converter and wiring scripts (`scripts/convert-lesson.mjs`, `scripts/wire-lesson.mjs`). The relay round needs a chat model the owner can paste a prompt into; the wiring needs the tier the lesson should land in (say it at invocation, e.g. `fable-5.1-high`).

## One round, then salvage

The prompt is deliberately minimal — length routes the chat model to a stronger tier — and the essay comes back as one free-form piece with no template imposed on it. The defining move is the **salvage**: the reply is raw material whose structure wins as-is, kept only from being damaged — title fixed, markdown repaired, checkable claims verified against primary sources with one-line greps. The agent authors exactly one thing itself: the ~1–2 KB theory snippet that becomes the curriculum card. Everything else mechanical — conversion and wiring — is a script, so the run's context stays flat no matter how long the essay is.

## Common questions

**How is this different from `/lesson-iteration`?**

lesson-iteration is the deep track: coverage ledger, depth audit, consistency audit, and the full quality loop — for a topic that deserves a deliberately authored lesson. lesson-script spends one relay round and integrates the result; its quality bar is the salvage depth bar (mechanisms explain their why, no invented citations or benchmark numbers), not the audited loop.

**What if there's no environment to verify claims against?**

They get marked as not executed and the delivery note says so honestly. Verification is done by grepping primary sources — never by pulling whole files into the agent's window.

## It's working if

- The lesson lands as one new numbered file with valid `lesson-meta`, and the owner's essay structure survives untouched apart from recorded fact fixes.
- The wiring step is a single script invocation — no lesson text ever re-pasted into a hand edit.
- Typecheck and build pass; the check script's no-Chrome skip is the expected outcome.
- The delivery note names the lesson path, the area, the checks run, and anything not executed.

## Where it fits

A **standalone authoring tool** for the Practice Map — the fast sibling of [lesson-iteration](https://aihero.dev/skills-lesson-iteration), which shares the same destination through an audited loop. [minimize-iteration](https://aihero.dev/skills-minimize-iteration) is the vocabulary behind its relay prompt: length is routing, so the prompt pays only for what the chat model cannot infer. For choosing between the flows, ask [ask-matt](https://aihero.dev/skills-ask-matt).

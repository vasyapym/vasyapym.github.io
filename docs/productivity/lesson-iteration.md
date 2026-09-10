## What it does

`lesson-iteration` turns a topic — usually a programming technology, but any subject works — into one full deep lesson for the Practice Map: a long-form Russian essay that is planned, drafted, audited for depth, audited for consistency, and then migrated into the map's curriculum data.

Its defining constraint is **depth by process, not hope**: the agent may not write prose until a coverage ledger exists, and may not call the loop done until both audits and the integration checks have actually passed.

## When to reach for it

You invoke this by typing `/lesson-iteration <topic>` — the agent won't reach for it on its own.

| Situation | Reach for |
| --- | --- |
| A topic needs a full authored lesson for the Practice Map ("add a Go lesson") | `/lesson-iteration` |
| An existing lesson needs a deliberate deepening pass | `/lesson-iteration` |
| Interactive, one-subcard-at-a-time learning with proof projects | [custom-learning](https://aihero.dev/skills-custom-learning) |
| A concept taught across sessions in a stateful workspace | [teach](https://aihero.dev/skills-teach) |
| A non-trivial code change rather than lesson content | [code-iteration](https://aihero.dev/skills-code-iteration) |

## Prerequisites

The skill writes into the Practice Map workspace: lessons live in `portfolio/projects/practice-map/lessons/` and the curriculum it migrates into is `portfolio/projects/practice-map/web/curriculum.ts`. Integration assumes the repository's usual checks (`typecheck`, `build`, project tests) are runnable from the checkout. If a lesson should land elsewhere, say so at invocation.

## The gates

The loop runs as ordered gates: intake and planning (topic boundaries, the part map, and a coverage ledger with one row per part — why-questions, mechanism, rule→consequence, trap, mental model, exercise), a complete draft, a depth audit that repairs every ledger row that fails, a consistency audit that checks the draft against the template skeleton, then migration into the curriculum with typecheck and build, and finally a delivery note that names which gates actually passed. Nothing is published from a failed gate — the draft stays the source of truth, and the migration ledger maps every heading, table row, callout, and code block to its target so nothing is silently lost.

## The template, not the exemplar

The structural source of truth is `LESSON-TEMPLATE.md` beside the SKILL.md — a topic-agnostic skeleton (why-it-exists part, progressive curriculum, misconceptions/traps/antipatterns summary, mental models, tiered exercises, resources, an eight-week plan). The repository-root exemplar (`fable-output.md`, a Go lesson) is read for depth, register, and explanatory technique — never as a fixed part count or a Go-shaped curriculum to copy. That separation is what keeps lessons on different topics structurally consistent without teaching Go every time.

## Common questions

**How is this different from `/custom-learning`?**

custom-learning runs the interactive learning loop: one active Subcard, explanations, a proof project, and review. lesson-iteration authors the deep written artifact itself — the essay that lives on the Practice Map as a deep lesson. One feeds reading; the other feeds practice.

**What language is the lesson in?**

The operating manual is English; everything the learner receives is Russian, with industry terms kept native (`mutex`, `goroutine`) and explained rather than translated.

**Does it work for non-programming subjects?**

Yes. The skeleton flexes by adaptation rules: setup becomes a reproducible experiment, syntax becomes notation, the "main force" part becomes the field's hardest central capability — with the same explanatory burden, using inspectable artifacts where code would be artificial.

**Does it commit the lesson?**

No. Delivery is explicit: the skill writes the essay and the curriculum migration and reports what was checked; committing and pushing happen only when you separately ask.

## It's working if

- Before any prose, there is a plan and a coverage ledger you can inspect — one row per planned part.
- The finished essay matches the template skeleton on any topic, not just the original Go exemplar.
- The migrated curriculum typechecks, builds, and renders in the deep reader with no lost sections, tables, or code blocks.
- The delivery note distinguishes real passes from unverified examples and blockers — and nothing was committed unasked.

## Where it fits

A **standalone authoring tool** for the Practice Map: reach for it whenever a topic deserves a full lesson. Its nearest neighbours are [custom-learning](https://aihero.dev/skills-custom-learning) (the interactive learning loop the lesson can serve as material for) and [code-iteration](https://aihero.dev/skills-code-iteration) (the same gate-and-verify discipline applied to code changes instead of lessons). For choosing between the flows, ask [ask-matt](https://aihero.dev/skills-ask-matt).

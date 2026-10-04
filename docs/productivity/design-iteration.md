## What it does

`design-iteration` refines an interface through visual feedback rounds: observe, change, render, inspect, present, record. Each round makes one focused change, inspects the actual rendered image rather than the source, and appends the result to an append-only ledger of explicit user verdicts.

Its defining constraint is that **explicit user feedback is the only authority for LIKED and REJECTED**. The agent's own aesthetic judgment never becomes a user preference; liked details are preserved until explicitly superseded, and every reversal is a new event that references the old IDs — the history is never rewritten.

## When to reach for it

You invoke this by typing `/design-iteration` — the agent won't reach for it on its own. Use it when an existing visual implementation needs another feedback round.

| Situation | Reach for |
| --- | --- |
| Layout, typography, styling, component, screenshot, or responsive work needs a round | `/design-iteration` |
| The design direction itself is still open | [design-planning](https://aihero.dev/skills-design-planning) |
| The choice needs a runnable visual comparison | [prototype](https://aihero.dev/skills-prototype) |
| The change is code-sized and needs executed checks | [code-iteration](https://aihero.dev/skills-code-iteration) |

## The round

The word the skill runs on is the **round**. A round states one focused hypothesis, names which liked details must survive and which rejected treatments it addresses, and compares before and after under matching viewport, scale, content, and interaction state. Preferences are scoped narrowly — element, property, viewport, interaction state — because rejecting one composition does not reject every technique it used.

When rendering or image inspection is unavailable, the round is reported `NOT VISUALLY VERIFIED` and the missing evidence is requested. The skill never invents visual observations — that is the one unforgivable failure.

## The ledger

State lives in the target project, not the skill: an append-only `ledger.md` plus per-round artifacts under `.agent/iterations/design/<task-slug>/`. Round blocks (`R001`…) and feedback blocks (`F001`…) are appended, never rewritten; a reversal, withdrawal, or supersession is a new event referencing the affected IDs, applied only within its stated scope. Silence, a passing test, and the agent's own review are not approval — only explicit user feedback is. Where the project also keeps a project graph, every completed round appends an `iteration` node, and the two iteration skills exchange typed handoff edges instead of loose notes.

## Common questions

**Does a green build or the agent's own review count as approval?**

No. Visual inspection, functional verification, and user approval are kept separate. Code checks establish that the code passes; only explicit user feedback produces LIKED or REJECTED records.

**Can a liked detail ever change?**

Only through explicit reconsideration. The historical record stays untouched; a reversal, correction, or withdrawal is appended as a new event with its scope and user source, and supersession applies only within its stated scope.

**What if there is no way to render or inspect images?**

The round is marked `NOT VISUALLY VERIFIED`, provisional work may still be useful, and the missing screenshot or access is requested. Provisional is honest; invented observation is not.

**How is this different from `design-planning`?**

`design-planning` settles which direction to take before implementation. `design-iteration` is the recurring loop around an existing surface: resume from the ledger, baseline, one focused change, fixed-evidence review, recorded verdict.

## It's working if

- The round can state what the user liked before proposing anything new.
- Rejected treatments stay rejected in their scope, and every change of heart is a new ledger event.
- Each round changes one focused design dimension rather than several at once.
- Before/after comparisons match viewport, scale, content, and interaction state, and inspect the actual image.
- The next session resumes from the ledger, not from anyone's memory.

## Where it fits

`design-iteration` is a **reach-for-it-anytime visual maintenance loop**. Its closest neighbour is [code-iteration](https://aihero.dev/skills-code-iteration), which handles the code-sized half of the same pass discipline and exchanges handoff edges with it wherever a project graph exists; [design-planning](https://aihero.dev/skills-design-planning) is the choice gate that precedes a new direction. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.

---
name: minimize-iteration3
description: Use when delegating to the randomized routing chat model or when a relay prompt failed — reframe the delegation as a question-form refinement, one question sentence then everything in one code block. Verified fallback shape for the relay (2026-10-04).
---

# Minimize iteration 3 — question-form refinement

Fallback relay shape for the randomized routing chat model: the instruction-style
minimal prompt (the `minimize-iteration` shape) can route badly. The question
form below worked on its first draw (2026-10-04, digital-card-api data-file
round: a schema-DSL prompt with a decisions menu failed to route well; question
+ one block produced a usable reply on the first try). Confirmed the same day on
a second task (C004 html-card round): a plain working draft as the whole payload
routed well, while the identical ask wrapped in comment-header briefs failed —
the router reacts to commentaries inside the block.

## The shape

One question sentence, then everything in one code block — nothing else.

```text
what will be the finished better version of the <artifact> below for the <source> inside it?

--- <artifact> ---
<bad/current artifact, verbatim — its shape is the output contract by example>
--- <source> ---
<source material, verbatim — it carries the facts>
```

- The question names the artifact and asks for refinement ("finished better
  version"), never the method: no schema description, no rails, no decisions
  menu, no acceptance criteria — instruction cargo is what failed to route.
  Name the artifact whose quality you want, not the carrier that displays it
  (Q3: "better version of the page" got the page restructured while the folder
  scheme inside it survived untouched).
- The block carries all material. `--- label ---` markers separate two
  coexisting materials; a single comment-free artifact needs none. Anything the
  reply must respect must be visible inside the block; facts that live only in
  the orchestrator's head get repaired at integration.
- For a rework ask, ship a working ugly draft — simple, functional,
  comment-free — instead of describing the target: the draft is the contract by
  example, and the model does the refining. The comment-header brief of the
  identical ask routed badly (Q2): commentaries inside the block read as
  documentation and steer the route like prose.
- The owner's `comprehensive code - ` opener composes on the question's front;
  verified draws so far ran without it.
- Integration is salvage, not compliance: call the Skill tool with
  "minimize-iteration" when its loop isn't already in context.

## Why it routes (hypothesis, three draws)

The question reads as "improve this given artifact" — implementation mode, not
generation mode — and the prompt is pure payload: the contract is carried by
example instead of prose, so the router has no instruction scaffolding to weigh.
Commentaries in the block break that purity (the Q2 comment-header variant
routed badly); a runnable draft keeps it. Kin to the spec-framing move in
`minimize-iteration`.

## It's working if

- The prompt is one question sentence plus one block, with no instruction prose
  outside the block.
- The reply lands as a near-final artifact: salvage repairs conventions, it
  doesn't rewrite.

## Rounds

Log one row per relay round in `results.md` (minimal-log rule, family practice
from `minimize-iteration2`); a row that changes practice edits this file in the
same pass.

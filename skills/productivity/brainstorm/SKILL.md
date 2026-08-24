---
name: brainstorm
description: Inspect the full diff and surrounding architecture, then propose high-leverage improvements without editing files.
disable-model-invocation: true
---

# Brainstorm

Inspect the full diff and surrounding architecture. Do not edit files.

Considering this whole change with fresh eyes, what new ideas for improvement, in overall design, in architecture, in simplification, cleanup, or behavior do you have? What would be a big change that could shake things up, in a good way? What has not been considered so far? What hint of an idea did you have before that could actually make a big difference?

Come up with a few recommendations if you can. Consider including evidence, expected impact, effort, and tradeoffs. Use `suggest_prompts` only for the best actionable follow-ups.

When the user picks or eliminates candidates in this session, record the settled direction as a `decision` node in the area's project graph — routing and shape in `docs/agents/project-graph.md`.

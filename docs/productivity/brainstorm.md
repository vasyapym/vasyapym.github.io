## What it does

`brainstorm` reads the **full diff** and the surrounding architecture with fresh eyes, then proposes a few high-leverage ways to improve the change. It can challenge the overall design, find a simpler shape, surface missing behavior, or suggest a larger move that would make the result more valuable.

It is deliberately read-only. The session produces ideas and tradeoffs, not edits, so you can choose what deserves a separate implementation pass.

## When to reach for it

Type `/brainstorm` when a change exists but you want to pressure-test it before committing to the current shape. It is useful after a prototype, during a review, or when a first implementation feels correct but too familiar.

It is not a replacement for a code review or architecture survey:

| What you need | Reach for |
| --- | --- |
| Standards and spec compliance | `code-review` |
| Deepening opportunities in a codebase | `improve-codebase-architecture` |
| Fresh alternatives around the current diff | `brainstorm` |
| A concrete implementation | `implement` |

## Project graph

When you pick or eliminate candidates during the session, the settled direction becomes a `decision` node in the area's project graph (`docs/agents/project-graph.md`), so future sessions inherit the choice instead of re-deriving it.

## Common questions

**Will it change files?**

No. It only inspects the diff and surrounding architecture and returns recommendations.

**Does it need a complete plan?**

No. A partial implementation is enough. The skill is most useful when the direction is plausible but still has room to improve.

**What should a good recommendation include?**

Evidence from the code, expected impact, effort, and tradeoffs. The strongest ideas are specific enough to act on but leave the design choice open until you select one.

**How is this different from asking for “any ideas”?**

The skill treats the whole change as the subject, not just the last file edited. It looks for architectural simplification, missing behavior, cleanup, and a larger idea that could change the result for the better.

## It's working if

- No files change during the session.
- Recommendations cite evidence from the diff or surrounding architecture.
- The ideas include impact, effort, and tradeoffs rather than generic praise.
- At least one recommendation questions an assumption or expands the possibility space.
- It stops at ideas and lets you choose what to implement next.

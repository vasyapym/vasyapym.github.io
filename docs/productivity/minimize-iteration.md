## What it does

`minimize-iteration` compresses a task you are delegating to a separate chat model into the shortest prompt that still carries it. The chat service routes prompts to models by token count, so prompt length is a bid: shorter prompts are more likely to land on a stronger model.

Its defining constraint is inference accounting — the prompt pays only for what the model cannot reconstruct. The chat model has no repo access and no memory of the session, but it arrives preloaded with conventions: a term that names a known format or genre (`SKILL.md`, a skill's own name) unpacks a whole instruction set inside it for free.

## When to reach for it

You invoke this by typing `/minimize-iteration` — the agent won't reach for it on its own. Use it whenever work is about to cross into a chat model that has no tools and no repo: the prompt that gets pasted there is the skill's product.

| Situation | Reach for |
| --- | --- |
| A task must be delegated to a separate chat model | `/minimize-iteration` |
| A whole conversation must move to another agent or harness | [handoff](https://aihero.dev/skills-handoff) |

## The method

Three things survive the compression, because the model cannot guess them: the task's non-inferable specifics (names, contracts, constraints unique to the work), the output contract (exactly what to reply with and in what shape), and the reasoning bar in two or three words. Everything else — politeness, background the names already carry, step-by-step method — is dropped on purpose, because you will reconcile it yourself when the reply comes back and gets integrated into the repo. The leading phrase to think with is **length is routing**: every token spent on something inferable is a bid against the quality of the model that receives the prompt.

The loop is short: write the minimal prompt, let the user paste it, integrate the pasted reply against the current repo state (repair frontmatter, restore fixed contracts the short prompt omitted, run the relevant checks), and if the reply comes back thin, move one level of detail back into the next prompt rather than rewriting the whole thing.

## Common questions

**Won't a shorter prompt make the output worse?**

Both directions are true and they trade against each other: less detail means more inference the model must do, while shorter prompts route to stronger models that infer better. The skill bets on the second effect and treats the first as recoverable at integration — repair is cheaper than routing.

**What if the reply comes back thin or generic?**

Shorten less next round. Move one level of detail — a contract, an example, a constraint — back into the prompt and resend, instead of padding the first prompt defensively.

**Is this just writing terse prompts?**

No. Abbreviation for its own sake loses information; inference accounting keeps exactly the information the model cannot reconstruct and drops the rest. A three-line prompt that names the right formats can outperform a page of context.

## It's working if

- The prompt fits in one or two lines and contains no fact a strong model could reconstruct.
- The reply is usable without a follow-up question.
- Integration restores everything routing variance dropped, and the checks pass.

## Where it fits

`minimize-iteration` is a **reach-for-it-anytime standalone** for one specific crossing: a task leaving this session for a chat model with a [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) and a token-based router. Its closest neighbour is [handoff](https://aihero.dev/skills-handoff), which compacts a whole conversation for portability — the skill here compresses a single delegation prompt for routing. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.

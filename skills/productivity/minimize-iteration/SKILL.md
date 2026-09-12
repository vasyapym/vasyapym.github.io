---
name: minimize-iteration
description: Compress a task into the shortest prompt that still delegates it to a chat model.
disable-model-invocation: true
---

# Minimize iteration

Delegate work to a separate chat model with the shortest prompt that still carries the task. The chat service routes prompts to models by token count: the shorter the prompt, the more likely it lands on a stronger model. **Length is routing** — every token spent on something the model could infer is a bid against quality.

## The method: spend only what can't be inferred

The chat model has no repo access, no tools, and no memory of this conversation. It also arrives preloaded with conventions: a term that names a known format, spec, or genre unpacks a whole instruction set inside it for free (`SKILL.md` implies frontmatter plus imperative markdown; a well-named skill implies its own loop). Write the prompt from that side:

- **Keep** the three things it cannot guess: the non-inferable specifics (names, contracts, constraints unique to this task), the output contract (exactly what to reply with and in what shape), and the reasoning bar in two or three words ("think hard, own all choices").
- **Drop** everything else: politeness, background the names already carry, step-by-step method, anything you will reconcile yourself when integrating.

Aim for one sentence, no markdown inside, delivered in a copy-pastable block.

## The loop

1. Extract the task to its core and write the minimal prompt.
2. Hand it to the user to paste; the reply comes back pasted into this session.
3. Integrate considering the current repo state: repair frontmatter, restore fixed contracts the short prompt omitted (manifests, shared field names, conventions), run the relevant checks.
4. If the reply comes back thin or generic, shorten less next round — move one level of detail (a contract, an example, a constraint) back into the prompt and resend.

## It's working if

- The prompt fits in one or two lines and contains no fact a strong model could reconstruct.
- The reply is usable without a follow-up question.
- Integration restores everything routing variance dropped, and the checks pass.

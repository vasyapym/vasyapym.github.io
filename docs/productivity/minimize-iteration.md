## What it does

`minimize-iteration` compresses a task you are delegating to a separate chat model into the shortest prompt that still carries it. The chat service routes prompts to models by token count, so prompt length is a bid: shorter prompts are more likely to land on a stronger model.

Its defining constraint is inference accounting — the prompt pays only for what the model cannot reconstruct. The chat model has no repo access and no memory of the session, but it arrives preloaded with conventions: a term that names a known format or genre (`SKILL.md`, a skill's own name) unpacks a whole instruction set inside it for free.

## When to reach for it

You can invoke it by typing `/minimize-iteration`, and it is model-invoked — the agent reaches for it on its own whenever a task is about to cross into a chat model that has no tools and no repo: the prompt that gets pasted there is the skill's product.

| Situation | Reach for |
| --- | --- |
| A task must be delegated to a separate chat model | `/minimize-iteration` |
| A whole conversation must move to another agent or harness | [handoff](https://aihero.dev/skills-handoff) |

## The method

Two things survive the compression, because the model cannot guess them: the task's non-inferable specifics (contracts, constraints unique to the work) and the output contract (exactly what to reply with and in what shape). Everything else is dropped on purpose, because you will reconcile it yourself when the reply comes back and gets integrated into the repo. The leading phrase to think with is **length is routing**: every token spent on something inferable is a bid against the quality of the model that receives the prompt.

Identity and history are the first candidates for the cut: the project's name, how it currently works, and autonomy reminders. A strong model owns its choices by default and doesn't need to be told so; a redesign ask can shrink to its tech stack plus the wanted behaviour — `react 19 + vite + typescript — free note-app editing: manually delete read text, type freely`. State the current mechanism only when diagnosing or changing that mechanism is the task itself. Reasoning nudges are not one of the keeps either — the routing tier is marked by the owner instead.

## Salvage integration

The owner reserves one opener for the **randomized routing chat model** (never for usual chat models): the prompt starts `comprehensive code - ` and the ask follows. That model may answer in a different direction than the one asked — at good or great quality. Integrating its reply is therefore salvage, not compliance: read for fragments of code that are fittable in the repo, lift those fragments (repaired to repo conventions, typechecked), wire them in, and leave the rest of the reply on the floor. Never paste the reply wholesale.

## Deepening rounds

Some asks cannot stay one sentence: settling a design, triaging reported bugs, diagnosing causes — their non-inferable part is evidence (the current code verbatim, symptoms, screenshot facts), and evidence doesn't compress. The proven shape is two tiers. First the randomized routing round: cheap, fast, direction-bent — its fittable fragments get salvaged into the repo. Then a **deepening round** against a longer-context chat model: a full, self-contained brief carrying the salvaged state (the code as it now stands, verbatim — that model must reason about what is really there), the symptoms verbatim, the reasoning bar, and the output contract. Spend length freely there — that model accepts it — but inference accounting still rules the brief: only what THAT model cannot reconstruct. Its reply integrates like any other: salvage, repair to conventions, run the checks.

The loop is short: write the minimal prompt, let the user paste it, salvage the pasted reply against the current repo state (mine the fitting fragments, repair frontmatter, restore fixed contracts the short prompt omitted, run the relevant checks), and if the reply comes back thin, move one level of detail back into the next prompt rather than rewriting the whole thing — escalating to a deepening round when the ask needs evidence, not more words.

## Common questions

**Won't a shorter prompt make the output worse?**

Both directions are true and they trade against each other: less detail means more inference the model must do, while shorter prompts route to stronger models that infer better. The skill bets on the second effect and treats the first as recoverable at integration — repair is cheaper than routing.

**What if the reply comes back thin or generic?**

Shorten less next round. Move one level of detail — a contract, an example, a constraint — back into the prompt and resend, instead of padding the first prompt defensively.

**Is this just writing terse prompts?**

No. Abbreviation for its own sake loses information; inference accounting keeps exactly the information the model cannot reconstruct and drops the rest. A three-line prompt that names the right formats can outperform a page of context.

**Doesn't the model need to know the project?**

Not for design and build asks. The name, the current state, and "own your choices" are the first things to cut — the model infers all three or never needed them. The exception is a task aimed at the current state itself: a bug report's symptoms, a migration's from-state, a fix's mechanism.

**The reply went in a different direction than asked — now what?**

Nothing is wasted. The randomized routing model trades direction for quality: what comes back is good or great, just possibly not what was ordered. Salvage it — lift the code fragments that fit the repo, repair them to its conventions, integrate, and leave the rest on the floor.

**When does the prompt get to be long?**

In a deepening round. Tasks that need the real evidence — a design to settle, bugs to triage, causes to diagnose — go first through the randomized routing tier (salvage its best fragments into the repo), then to a longer-context chat model as a full self-contained brief: the salvaged code verbatim, the symptoms, the reasoning bar, the output contract. Length is spent freely there, but only on what that model cannot reconstruct.

## It's working if

- The prompt fits in one or two lines and contains no fact a strong model could reconstruct.
- The prompt names no project and narrates no current state — unless diagnosing or changing that state is the task itself.
- The reply is usable without a follow-up question — or direction-bent but fittable: its best fragments land, the rest is discarded without regret.
- A deepening brief carries the salvaged state verbatim — the evidence, not the narration.
- Integration restores everything routing variance dropped, and the checks pass.

## Where it fits

`minimize-iteration` is a **reach-for-it-anytime standalone** for one specific crossing: a task leaving this session for a chat model with a [context window](https://www.aihero.dev/ai-coding-dictionary/context-window) and a token-based router. Its closest neighbour is [handoff](https://aihero.dev/skills-handoff), which compacts a whole conversation for portability — the skill here compresses a single delegation prompt for routing. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.

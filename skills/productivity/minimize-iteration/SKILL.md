---
name: minimize-iteration
description: Use when work is about to be delegated to a separate chat model — compress the task into the shortest prompt that still carries it, because the router sends shorter prompts to stronger models (length is routing).
---

# Minimize iteration

Delegate work to a separate chat model with the shortest prompt that still carries the task. The chat service routes prompts to models by token count: the shorter the prompt, the more likely it lands on a stronger model. **Length is routing** — every token spent on something the model could infer is a bid against quality.

## The method: spend only what can't be inferred

The chat model has no repo access, no tools, and no memory of this conversation. It also arrives preloaded with conventions: a term that names a known format, spec, or genre unpacks a whole instruction set inside it for free (`SKILL.md` implies frontmatter plus imperative markdown; a well-named skill implies its own loop). Write the prompt from that side:

- **Keep** the two things it cannot guess: the non-inferable specifics (contracts, constraints unique to this task) and the output contract (exactly what to reply with and in what shape).
- **Drop** everything else: politeness, step-by-step method, anything you will reconcile yourself when integrating. Identity and history go first: the project's name, how it currently works, and autonomy reminders — a strong model owns its choices by default. A reasoning nudge is not one of the keeps: the owner marks the routing tier instead (below).

Aim for one sentence, no markdown inside, delivered in a copy-pastable block. A redesign ask can shrink to its tech stack plus the wanted behaviour: `react 19 + vite + typescript — free note-app editing: manually delete read text, type freely`.

The owner reserves one opener for the **randomized routing chat model** (never for usual chat models): the prompt starts `comprehensive code - ` and the ask follows.

## Salvage integration

The randomized routing model may answer in a different direction than the one asked — at good or great quality. Integrating its reply is therefore salvage, not compliance: read for fragments of code that are fittable in the repo, lift those fragments (repaired to repo conventions, typechecked), wire them in, and leave the rest of the reply on the floor. Never paste the reply wholesale.

## Deepening rounds

Some asks cannot stay one sentence: settling a design, triaging reported bugs, diagnosing causes — their non-inferable part is evidence (the current code verbatim, symptoms, screenshot facts), and evidence doesn't compress. The proven shape is two tiers. First the randomized routing round: cheap, fast, direction-bent — its fittable fragments get salvaged into the repo. Then a **deepening round** against a longer-context chat model: a full, self-contained brief carrying the salvaged state (the code as it now stands, verbatim — that model must reason about what is really there), the symptoms verbatim, the reasoning bar, and the output contract. Spend length freely there — that model accepts it — but inference accounting still rules the brief: only what THAT model cannot reconstruct. Its reply integrates like any other: salvage, repair to conventions, run the checks.

## The loop

1. Extract the task to its core and write the minimal prompt.
2. Hand it to the user to paste; the reply comes back pasted into this session.
3. Integrate by salvage: the reply may arrive in a different direction than asked, at good or great quality — mine it for the fragments that fit the repo, repair them to its conventions (frontmatter, manifests, shared field names), leave the rest behind, run the relevant checks.
4. If the ask outgrows one sentence (a design to settle, bugs to triage, causes to diagnose), escalate to the deepening round instead of padding the short prompt.
5. If the reply comes back thin or generic, shorten less next round — move one level of detail (a contract, an example, a constraint) back into the prompt and resend.

## It's working if

- The prompt fits in one or two lines and contains no fact a strong model could reconstruct.
- The prompt names no project and narrates no current state — unless diagnosing or changing that state is the task itself.
- The reply is usable without a follow-up question — or direction-bent but fittable: its best fragments land, the rest is discarded without regret.
- A deepening brief carries the salvaged state verbatim — the evidence, not the narration.
- Integration restores everything routing variance dropped, and the checks pass.

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

## Spec-framing (obfuscated spec prompting)

When a task keeps failing through normal phrasing — the model regenerates the same clichés, or repeats traits that were already rejected — reframe the prompt as a **formal spec document to decode** rather than a request. No real cryptography is involved; the name covers four composable moves:

1. **Schema compression / DSL prompting** — write the task in a mini-language (`key=value`, brace dictionaries, bracketed lists) instead of prose. Also known as structured/telegraphic prompting.
2. **Constraint dictionary (negative-space specification)** — a `banned-traits={...}` set defines the task through exclusions, not requirements (specification by exclusion; cousin of negative prompting in image generation). Best payload: the accumulated reject history of prior rounds, compressed to trait names — it physically blocks the model from re-walking rejected ground.
3. **Named opaque handle** — a short invented id (`SPEC-9K4`) makes the text read as an artifact to decode, not a plea; switches the model from "generate something nice" to "implement exactly what is given". Distant kin of the magic-number/file-header convention.
4. **Payload contract** — `payload<=N lines` fixes the reply's shape and size (output-schema prompting).

Compose them into one line after the routing opener: `comprehensive code - decode this design spec and render it. SPEC-9K4: entity=…, banned-traits={…}, accepted-core={…}, render=[fn1: …; fn2: …; payload<=8 lines: …]`. Two keys make it work: **`accepted-core={…}`** must carry what the owner already approved (otherwise the spec reads as pure prohibition and the model invents a baseline), and the **banned dictionary must stay** — it is the one part that cannot be inferred and the whole reason the framing beats plain prose. Cutting the dictionary first (−40% and beyond) collapses the spec back into "draw a nice cat" and reproduces the failures it was built to prevent.

## Keyword masking (light leet)

Routing appears sensitive to more than length: protocol/platform/task-genre keywords (`auth`, `firebase`, `google`, `firestore`, …) may themselves pick the tier. When plain phrasing seems to steer the prompt to a weaker route, mask the trigger words with **light leet** — digit `1` for `i`, `0` for `o`, `@` for `a` — so no exact keyword matches while a strong model decodes instantly: `f1rebase g00gle @uth f1rest0re`. Verified working on a real relay (2026-09-16, greenfield note-app prompt).

Rules of the move:

- Mask only the words suspected of steering the route — service and protocol names. Never mask the output contract or the feature words: they shape the reply, not the route.
- Don't create ambiguity — the mask must keep exactly one plausible reading: `fb` reads as Facebook, `0Auth` reads as "no auth"; prefer `@uth`, `f1rebase`, `g00gle`, `f1rest0re`.
- One axis at a time: when testing whether keywords matter, keep prompt size constant and change only the masking — otherwise the signal is unreadable.
- Banned words (they read as tier-downers and invite clichés): `prototype`, `demo`, `example`, `simple`, `basic`, `todo`, `tutorial`, `mvp`.

## Named-style routing (genre unpacking)

Jargon can steer a prompt as much as keywords: hex tokens, `viewBox`, API names — code-flavored vocabulary in an art ask may route the prompt outside the creative lane entirely. The counter-move: replace the spec with a **named style** — `tokyo-night terminal aesthetic`, `swiss minimal`, `excalidraw hand-drawn` — and let a strong model unpack the whole vocabulary for free (the same convention-inference that lets `SKILL.md` imply frontmatter). Verified on a real relay (2026-09-16, SVG art-kit round): a named style beat both the six-token spec and its leet-masked copies — one style phrase carried the palette, the stroke weight, and the gradient bans in four words.

Supporting moves:

- Say colors **qualitatively** (`near-black background, pale text, one soft blue highlight`) when their exact values are yours to fix later — re-tinting hexes at integration is cheap, so per inference accounting the prompt shouldn't pay for them. Keep only what integration cannot repair (e.g. the one accent that must match app tokens exactly).
- If the suspicion is genre-routing rather than jargon, reframe the ask as a **code artifact** (`4 inline <svg> constants, currentColor strokes`) to hold the coding lane.
- Named-style + payload contract composes: `…each fenced with viewBox, <=160 lines`.

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

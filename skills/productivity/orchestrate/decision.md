# decision — the decision part of orchestrate

A decision brief asks a specialist how something should be shaped before anything is built on it: a choice of architecture, pattern, data model or concept that neither the repository nor the user has already settled. The specialist recommends, the user decides, and the decision is then a fact every later brief carries. Most tasks never need it: a clear task that fits the code as it stands skips this file. The core's "Write the brief", "Hand it over" and "Take the reply" apply unchanged — opener and closing lines, numbering, reply shape, code by command, salvage-integration. This file adds only what is decision-specific.

## When it runs

Usually right after the session opens, before the first implementing brief; also at any later point. On the user's word it runs regardless; otherwise run it when both hold:

- **Two credible shapes exist**, and neither an existing pattern in the repository nor a settled user decision chooses between them.
- **The choice is expensive to take back**: other code will be written against it, or part of it is one-way — a data model or stored format, a public address or API, an interface with many callers, a new dependency or framework, a pattern meant to be repeated, the name and meaning of a domain concept.

In practice: if the implementing brief would have to pick the shape silently, or leave it to its specialist, the decision comes first.

Skip it when a precedent in the repository answers the question — follow the precedent; when a size, a timing or a count would settle it — gather that fact first; when the choice is local and one commit undoes it — make it yourself and state it in a line of the report. In doubt, ask the user in one line whether it is worth a relay; do not brief by default. If the user declines the relay, or their consultation limit is spent, the choice is still theirs: put the options as you see them, labelled yours; the answer is a settled decision, per the core.

Later in a session the signals are: a reply assumes a structure the repository does not have, or brings one nobody chose; a fix keeps spreading into files the task never named; two briefs answer the same question differently; a review finding is deferred because it is structural. Then stop composing implementing briefs, bring the batch in hand to a verified state or set it aside, and tell the user why.

This file decides; it does not tidy. Restructuring code where no choice is pending is not its job; a decision that needs such work names it as a next step. Removing the cause of friction that has already recurred is `correction.md`'s; any choice that work uncovers comes back here.

## Frame the question

Write the decision as one question that admits different answers — "how should X be shaped so that Y", not "should we use Z". Put it in the restated task at session open, or in one line when it arises later, so the user can correct it before a relay is spent. One brief settles one question, or a few that cannot be settled apart; dependent decisions go in order, each settled one a fact in the next brief.

A candidate you or the user already hold is neither hidden nor favoured: quote it after the facts, as a candidate, with whose it is, and ask that it be judged like the rest. Default capacity is the Creative, a fresh chat; the user may name another.

## What the brief carries

The specialist designs from the brief alone, and a fact it lacks it will invent. Gather by sub-agent, copy by command, mark each item observed or inferred.

- **The task as stated**, and what raised the question — the symptom or the requirement, with its evidence, not your diagnosis.
- **What is settled** (facts): stack and versions, hosting, earlier decision records whole, what must not change — stored data, public addresses, formats, behaviour others rely on — and who will write and maintain the result: the user by hand, an agent, or both. That last fact sets what "simple" means.
- **A map of the area**: the relevant tree, by command; each module involved, with what its callers must know to use it — signatures, required order, invariants, errors, configuration — copied, not summarised; data shapes whole (schema, types, a configuration file); callers by count, a representative few quoted whole; what checks the area today — tests, gates — or that nothing does.
- **Precedents**: how the repository already solves a neighbouring problem — one instance quoted whole per way, with a count of each way. Where the code disagrees with itself, show the disagreement.
- **Real examples**: a few actual records, inputs or pages the decision must serve, by command; for a concept, the names the code, the data and the user each give the thing, verbatim.
- **What varies, and how much**: the variants that exist today, those the user has said are coming, sizes and timings where measured; the area's recent commits — subjects and files touched — as the best evidence of what changes next. An unknown is stated as unknown.
- **Your open questions**, labelled.

Thorough side, per the core: this is the largest kind of brief. What does not fit is cut by distance from the question, and the brief says what was left out.

## What to ask for

After the core's opener, the task:

> Below is a decision an existing codebase has to take, with the facts it rests on. The user decides; your part is to make the choice clear. About this codebase, reason only from what is quoted; where the answer depends on something not shown, say what you would need to see. What you know of libraries and platforms beyond it, mark as from memory — it will be checked. First check the question — a better question is a valid answer. Then give two or three designs that differ in shape, not in detail, each optimising for something different, which you name; one of them is the least change that could work, and keeping the current shape is always a candidate. Put each at its strongest before you compare them. Recommend one, and say what would make you choose otherwise. Simpler wins unless a quoted fact pays for the complexity.

Where the decision is about code structure, quote these three words into the brief, so every option is described in the same terms: **module** — anything with an interface and an implementation, at any scale; **interface** — everything a caller must know to use a module correctly, not only its signature; **seam** — a place where behaviour can be swapped without editing the callers.

And name the tests each option is put through; one that does not bear on the decision is said so in a word:

- **Deletion** — imagine the new module, layer, table or dependency gone. If nothing gets harder, it should not exist; if the same work reappears in every caller, it earns its place.
- **Variation** — anything made swappable or general needs two variants that exist or that the user has said are coming; a forecast is not a variant.
- **Surface** — list what a caller must know. Less to know for the same behaviour is better, and it should be testable through that same surface.
- **Fit** — which existing way in the repository it follows. A second way of doing one thing needs a reason, and says what becomes of the first.
- **Locality** — for the next changes the facts point to, name the files each would touch; fewer is better.
- **Way back** — what undoing it costs once code and data depend on it, and which parts are one-way.
- **Path** — the steps from the current tree to the design, each leaving the tree working and committable on its own; mark the step at which the task as stated is served.

Output contract, in this order: the recommendation in a paragraph, with what would change it — or the better question; what it rests on, numbered so each can be checked — assumptions about the code, claims from memory, facts it needed and did not have; the options, compact — what each optimises for, shape, interface, what moves where, main risk — and their comparison across the tests; then the recommended design between `=== begin design ===` and `=== end design ===`: file layout, interfaces and data shapes as code, no bodies, then the path as numbered steps; then the sentinel. Under pressure the rejected options shrink, not the design; a reply cut inside the design still carries the decision. Cap inside the capacity's budget and state its time limit.

Where the options alone would fill the reply, stage it: this brief stops at the comparison and the recommendation, and the adopted option is detailed by the next, after the user decides. The same detail brief follows when the user adopts an option the reply did not detail: it carries the record so far and asks only for the design and the path.

## Take the recommendation

A recommendation is input, not a decision. Before it reaches the user:

- **Confirm against disk** each numbered assumption and every other claim the design makes about the repository — callers it calls unaffected, a step it says leaves the tree working, an interface it says already exists. The specialist saw excerpts; record what held, what did not, and what you could not check.
- **Disprove cheaply**: where the choice rests on something unverified — a claim from memory, a size, a timing — run the cheapest check that could sink it, by sub-agent, in a scratch copy outside the tree.
- **Facts it asked for**: gather them. If they could change the answer, say so and offer a fresh brief carrying the options verbatim and the new facts.

Then put it to the user, short: the question; each option in a line; the recommendation and what would change it; what you confirmed, refuted and could not check; the one-way parts; your own view, labelled as yours. A reply that changes the question goes to the user as that. Where you and the specialist differ, or two specialists do, the difference reaches the user unresolved.

By default one brief. More is offered, not written, and runs on the user's word: a re-brief with new facts; a second specialist, given the same brief and not the first reply — independence is the point; a review pass over the design (`review.md`, material labelled proposed), offered first where part of the design is one-way. Nothing is built and no implementing brief is written until the user decides, in this conversation. "None of these" and "not now" are decisions.

## Record it

`round-<k>/DECISION-<n>.md`, `<n>` the number of the brief that opened the question; yours to write, compact; beside the briefs when there is no round folder. It holds: the question; the decision in a line, as the user gave it; the adopted design with its path — the harvest cut, placed by command, your corrections marked as yours; the rejected options, a line each with the reason; the one-way parts; what would reopen it; claims confirmed, refuted and unchecked; each brief and reply file with its hash. It is self-contained, because later briefs carry it whole. A decision to change nothing is recorded too: it stops the question returning.

Where the repository already keeps design notes, offer the record as a deliverable for the user to commit; do not start such a convention unasked.

## Build on it

From the user's word the decision is a fact: every later brief it bounds carries the record whole under settled decisions, and a reviewer is told it is not up for review. Implementation is ordinary rounds along the path — one step a batch, each closing at a tree that works and a commit the user can make. The decision does not widen the task: steps past the one that serves it become next steps.

Do not bend the design quietly during integration. A change inside the decision — a name, a signature detail — is yours: note it in the record as an amendment, marked as yours, and in the report. A change of shape, anything touching a one-way part, or the return of a rejected option is the user's. So when the repository contradicts a fact the decision rested on, a step cannot be made to hold, or a confirmed breaking finding traces to the decision itself: stop, show the evidence, and reopen on the user's word — with a fresh brief carrying the record and what contradicted it, if they want one. A superseded record is kept and marked superseded, never rewritten.

## Report

Into the round report: the question, the decision and who took it, the options rejected, claims confirmed and not, checks run, the record's path, amendments, steps done and outstanding, and anything reopened.

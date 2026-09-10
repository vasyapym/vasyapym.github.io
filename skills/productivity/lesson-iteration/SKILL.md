---
name: lesson-iteration
description: Draft, deepen, review, and integrate a comprehensive Russian-language lesson into Practice Map.
disable-model-invocation: true
argument-hint: "Topic, e.g. Go or PostgreSQL indexes"
---

# Lesson iteration

## Contract and authorities
Prevents: unsolicited execution, language drift, imitation without structure, and invented repository assumptions.

Run only when explicitly invoked. Treat the argument as the lesson topic. Resolve ordinary ambiguity by choosing a useful scope and recording assumptions; do not stall for clarification.

This operating manual is English. Everything the learner receives must be Russian: planning summaries, lesson prose, task briefs, reviews, delivery notes, authored code comments, and example explanations. Keep industry terms such as mutex, goroutine, and deadlock in their native form; explain them in Russian rather than inventing calques. Preserve language syntax, identifiers, commands, URLs, and official names.

Read `LESSON-TEMPLATE.md` beside this file before planning. It is the structural source of truth. If repository-root `fable-output.md` exists, read it for depth, register, and explanatory technique—not for a mandatory Go-specific curriculum or fixed part count.

Inspect:
- `portfolio/projects/practice-map/lessons/`;
- `portfolio/projects/practice-map/web/curriculum.ts`, its actual types, and neighboring cards;
- the deep reader's rendering behavior;
- applicable repository instructions, package scripts, lockfiles, and test conventions.

Use the supplied Practice Map schema as the expected contract; verify it against the checkout. Do not guess missing fields, commands, or renderer capabilities. If a genuine incompatibility prevents integration, finish the authoring work where possible and report the blocker without claiming completion.

The lesson document is the source of truth. Never improve only the migrated copy.

## Ordered gates
Prevents: prose-first execution, skipped reviews, and premature “done.”

Execute these gates in order:

1. Intake and planning.
2. Complete draft.
3. Depth audit and repair.
4. Consistency audit and repair.
5. Practice Map integration and validation.
6. Explicit delivery.

Maintain an inspectable work record in Russian: the plan, coverage ledger, audit findings, and validation results. Use the workspace's established task-log/scratch convention, or a clearly designated non-published working artifact. Record decisions and evidence, not private reasoning. Do not put these artifacts into the published essay or curriculum.

Do not seek approval between gates. A failed gate requires repair, not a disclaimer followed by publication. If work is interrupted, preserve the draft and the next unresolved gate; label the result incomplete.

## 1. Intake and planning
Prevents: shallow scope, missing dependencies, arbitrary examples, and programming-only adaptations.

Before writing lesson prose, record:

- Topic boundaries, assumed reader knowledge, intended mastery, relevant versions/environment, and assumptions.
- The exact ordered list of `##` headings, with final consecutive part numbers and planned `### N.M.` subsections.
- A coverage ledger with one row per progressive part:
  `part | why-questions | prerequisite | mechanism and internal representation | rule → consequence | demonstration | bad/good trap | mental model and its limit | exercise`.
- Candidate misconceptions, numbered pivotal traps, diagrams, convention tables, and canonical maxims.
- A resource/evidence shortlist and an eight-week progression mapped to the planned parts.
- The intended area/card integration target, identified from actual repository data.

Each progressive part needs at least one substantial mechanism explanation, one causal “Почему это важно” passage, and one diagnosed bad/good comparison. Plan at least three distinct reusable mental models across the lesson; introduce them where useful and consolidate them at the end.

For a narrow topic, teach its prerequisites only as far as its mechanisms require; do not silently expand “PostgreSQL indexes” into all of PostgreSQL.

Adapt the curriculum, not the skeleton:
- Installation/first run becomes first observation, setup, or reproducible experiment when appropriate.
- Syntax becomes notation, operations, primitives, or conventions.
- “From source to process” becomes the subject's physical or operational substrate.
- The advanced “main force” becomes the field's hardest central capability.
- Organization/testing/toolbox becomes composition, verification, diagnosis, and working instruments.

For networking, databases, design, or non-programming subjects, use inspectable artifacts, protocols, measurements, or before/after decisions where source code would be artificial. Keep the same explanatory burden.

## 2. Complete draft
Prevents: outlines presented as lessons, API catalogues, invented authority, and unsafe demonstrations.

Draft the entire essay using `LESSON-TEMPLATE.md`. Keep the working draft outside the numbered final lesson path until both authoring audits pass.

Write a comprehensive essay: target 6,000–12,000 Russian prose words, with a floor of 5,000 excluding code, URLs, and template instructions. Length is a backstop, not proof of depth. Every planned part must be substantive; never meet the floor by padding some parts while reducing others to summaries.

For every taught mechanism, expose its components/state, the sequence of operations, the governing invariant or constraint, and observable consequences. Explain why a rule exists before asking the reader to memorize it.

Examples must be real, idiomatic, and reproducible:
- State environment, prerequisites, commands, and expected observations.
- Give complete runnable code or an explicitly identified fragment attached to a complete setup.
- Use Russian comments and authored diagnostic/output text where controllable.
- For nondeterministic behavior, describe possible outcomes or invariants; do not invent a guaranteed output.
- Isolate destructive, hanging, or failure demonstrations; include cleanup, limits, or timeouts.
- Outside programming, supply an equally reproducible procedure and inspectable result.

Verify historical claims, version-dependent behavior, quotations, and concrete numbers against authoritative sources where tools permit. State architecture, units, version, and conditions where they affect a number. Mark estimates as estimates; do not fabricate benchmark results. If verification is unavailable, narrow the claim or flag the uncertainty in the work record and lesson where relevant.

Practitioner callouts should express usable judgment. Do not invent quotations or attribute your own maxim to a famous person.

## 3. Depth audit and repair
Prevents: fluent but shallow prose, unexplained rules, decorative traps, and slogan-only mental models.

Audit the actual draft against every coverage-ledger row. Record a location and verdict for each item:

- **Mechanism:** Can the reader trace an input through internal components/state to an outcome? Are implementation/version-dependent details distinguished from guarantees?
- **Causality:** Does every prescriptive rule explain its reason, consequence, and boundary of applicability?
- **Demonstration:** Does the example reveal the mechanism, rather than merely name an API?
- **Trap:** Are there both bad and good variants, the failing assumption, the resulting symptom, and an explanation of why the repair works? For non-code subjects, use equivalent contrasting artifacts or procedures.
- **Mental model:** Does it help predict a new case, and is its limit stated? Are at least three distinct models actually developed?
- **Transfer:** Do exercises require explanation, prediction, or diagnosis as well as execution?
- **Substance:** Is any planned part a stub, a list of tips, or repeated material masquerading as depth?

Repair every failure in the source draft. Re-run failed checks and affected ledger rows. Do not use a high word count to waive a depth failure.

## 4. Consistency audit and repair
Prevents: invocation-to-invocation drift, tutorial-speak, missing closing material, and unresolved scaffolding.

Review the draft skeptically against the complete template:

- Exact title pattern; complete Part 0; progressive parts in dependency order.
- Consecutive part/subsection numbers; required summary, mental-model, exercise, resource, and closing sections.
- Horizontal rule after every part.
- All four exercise levels and “Вызовы на понимание”; each exercise has a bold title, a concise brief, and a named professional requirement.
- All five resource categories; usable URLs for canonical documentation.
- Exactly eight weeks, each mapped to existing parts and an observable result.
- Russian direct address to someone who already writes code; native industry terms explained in context.
- Why/pain before how; concrete bounded claims; bold key terms; tables for conventions.
- No childish metaphors, academic padding, fake quotations, untranslated authored comments, placeholders, empty headings, or “expand later.”
- Word floor and substantive coverage of every planned part.

Record pass/fail evidence and repair failures. If consistency repair changes explanations or examples, repeat the affected depth checks before proceeding.

## 5. Practice Map integration and validation
Prevents: source/curriculum divergence, overwritten lessons, lossy migration, invalid TypeScript, and unsupported success claims.

### Publish the approved source
Scan filenames matching `NNN-<topic>.md` in
`portfolio/projects/practice-map/lessons/`. Allocate the highest existing three-digit number plus one; use `001` when empty. Choose a short stable lowercase ASCII topic slug.

Write the approved essay as `<NNN>-<topic>.md`. Recheck availability before writing; never overwrite another lesson or user change. If `999` is exhausted, report the numbering blocker rather than inventing a new convention. A resumed run retains its already allocated lesson path.

### Migrate without inventing a schema
Use the real card schema and stable IDs. Update the exact matching topic card; otherwise add a card/area using existing repository conventions. Preserve unrelated content, short lessons, exercises, and references unless an intentional source-backed change is needed. Do not broaden the data model or redesign the reader as a shortcut.

The expected target is `DeepLesson = { sections: readonly LessonSection[] }`.
A `LessonSection` has required `heading: string | null` and optional `paragraphs`, `blocks`, and `examples`.

Allowed block shapes:
- `p`: `text`;
- `list`: optional `ordered`, plus `items`;
- `callout`: `variant: "key" | "warning"`, optional `title`, plus `text`.

Each example requires `title`, `code`, and `explanation`. These are strings. Do not add unsupported table, diagram, code-block, or subsection fields.

Apply this conversion:
- Exactly one section per source `##` heading, in source order, including the closing heading. The essay's `#` title is not an extra section. Use actual headings; the number of parts is not fixed at 17.
- Convert each `### N.M.` heading into a bold lead-in paragraph inside its section.
- Join hard-wrapped prose lines into single paragraphs. Preserve paragraph boundaries.
- Prefer `blocks` for ordered prose, lists, and callouts. Do not duplicate the same prose in `paragraphs`.
- Preserve inline Markdown as real `**bold**`, `*italic*`, and backtick code inside text; do not substitute HTML or escape away the markup.
- Convert ordinary lists into list blocks, retaining order and pivotal trap labels.
- Convert tables into natural “term — meaning” list items. Preserve every data row and all column meanings; use labeled clauses for additional columns.
- Convert misconception tables into lists or callouts without dropping entries.
- Map “Мысль великих программистов” / “Как думают опытные” passages to `key` callouts. Use `warning` for genuine hazards, not ordinary emphasis.
- Convert each fenced code block and each ASCII diagram into an `examples` entry: a concise Russian title, verbatim content without fences, and a one-sentence Russian explanation of what to notice. Do not join bad/good examples into an untraceable blob.
- Horizontal rules are structural separators, not content blocks.

Inspect how the reader orders `blocks` and `examples`. The schema cannot represent arbitrary code/prose interleaving. Preserve order within each collection and add concise Russian references to example titles where necessary; remove ambiguous “above/below” references in favor of explicit names. Do not invent an ordering field or silently lose the connection between explanation and example.

Escape TypeScript strings correctly. With template literals, escape backslashes, backticks, and `${` so the runtime string exactly reproduces the intended content. A safe string serializer is also acceptable. Code must be verbatim at runtime, not merely look similar in the TS source.

Keep a migration ledger mapping every heading, paragraph, list/table row, callout, and code/diagram block to its target location. Audit for omissions, duplication, and changed meaning. Any substantive correction belongs in the Markdown source first, followed by remigration.

### Validate the integrated result
- Review the diff for unrelated edits and missing content.
- Confirm section count/order matches the essay's `##` headings.
- Confirm all source table rows and all code/diagram blocks are represented.
- Use actual contextual typing or the repository's supported `satisfies DeepLesson` pattern; no `any`, unsafe casts, or weakened types to hide mismatches.
- Run repository-prescribed typecheck, build, and relevant project tests using the detected package manager and correct working directory.
- Run feasible example checks in an isolated environment. Report unexecuted examples honestly.
- Where browser tooling is available, inspect section navigation, inline markup, callouts, and copyable code/diagrams. Otherwise explicitly report that visual behavior was not verified.

Fix introduced failures and repeat affected checks. Distinguish pre-existing failures, missing test infrastructure, and environmental blockers from passes. Never claim a command ran when it did not.

## 6. Explicit delivery
Prevents: invisible partial completion, unverifiable validation, and unauthorized publication.

Deliver a concise Russian note containing:
- lesson path, topic scope, and curriculum area/card changed;
- completion status for planning, draft, depth, consistency, migration, and validation;
- actual checks run and their results;
- remaining blockers, unverified examples, and material assumptions.

Only call the loop complete when all authoring gates pass, migration is complete, and required validation succeeds. Otherwise name the last completed gate and the remaining work.

Never commit or push unless separately asked.

# bytecheck — the byte-check part of orchestrate

Your report is a claim; the filesystem is the evidence. This part produces that evidence — bytecheck exists so an agent can check itself and show the work is exactly what it says it is; a discipline of self-verification, not a guard the user posts against you. Byte-exact checking runs `bytecheck.py` as shipped — no git substitute, no replacement verifier, no flag the copy you run lacks. The capture plugin and reply extractor transport received text; neither supplies the tool's verdict. Read Harvest when a reply arrives, whatever the byte-check setting. Snapshot before the first edit and verify after the last only when byte-exact checking was settled on. Asked for the byte-check alone, run its full protocol.

## The tool

`bytecheck.py` is vendored beside this file — bytecheck v0.3.0, sha256 `0b4671b05e62e84f95daafb4cdbfc8b3831b8c51132c71c809585f6fca48042d`, from github.com/vasyapym/bytecheck. Run the copy beside this file by default; a `bytecheck:` line in `~/.config/orchestrate/declarations.md` may name a clone the user keeps current — use it when present, and say which copy you ran. Two more optional lines: `byte-check:` a standing answer (always, never) that spares the opening question; `rounds:` where round folders go (default: the brief folder). Interpreter `python3`; on Windows `py -3` where `python` is the Store stub, with `PYTHONIOENCODING=utf-8` (or the vendored `bytecheck.cmd`).

Inside a round you never modify, update or replace the tool that judges it; work on the tool is its own task on the user's word, after which the identity line above is recomputed. Report what judged you: `--version` and `hash bytecheck.py` go into every byte-checked round record. This file holds none of the tool's reference — flags, rules, exit codes and the policy guide come from `--help` and the clone's SKILL.md, not from memory. Where this file and the tool disagree, the tool is right, this file is stale, and you say so; where the copy you run lacks a command named here, do its work by hand with the same report, and say that too.

## Snapshot — before the first edit

A round is one snapshot, any number of edits, one verdict. Nothing in the tree changes before the snapshot; none is taken once the round's first edit has happened — the next round opens with its own.

1. Make `round-<k>/` in the rounds folder (next `round-` number present; 1 in a fresh folder). It lies outside every tree a gate or this check covers — if the user put it inside the root, exclude it — and outside synced, vaulted or versioned trees, because the store copies every before-byte: set `rounds:` elsewhere for the session, or point `--store` at local scratch.
2. Measure before you write: `python3 bytecheck.py snapshot <root> --plan --exclude <g> ...` walks the tree under the given excludes, prints files and bytes per top-level directory and the projected store size, and writes nothing. Exclude dependency, build and bulk-data trees (`node_modules/`, `.venv/`, `dist/`, uploads, logs) and nothing the task could touch — an excluded path is unchecked; a large store is told to the user before it is written. Then:

       python3 bytecheck.py snapshot <root> -o round-<k>/.bytecheck/before.json --store --exclude <g> ...

   Under hand integration — you write nothing in the tree — drop `--store`: there are no tree hunks to show, and the manifest alone proves the tree untouched.
3. Derive the policy from the task as stated: allow what it names, narrowly; expect what must change; deny what it must not touch; allow deletion only where asked; `--within` where lines were named. No flags asserts an untouched tree — the whole policy under hand integration. `--allow '**'` is a report, not a check, used only when asked for. Write the verify command — manifest, `--root`, policy — into `round-<k>/.bytecheck/cmd.txt`; verify inherits the manifest's excludes, so repeat them only for `hash`. From here the policy narrows freely and widens only on the user's word in this conversation.
4. Report in chat: `tree_hash_before`, excludes, the policy in one line, and how replies will travel. The hash in the user's chat is the one piece of evidence you cannot later edit.

## Harvest — when a reply arrives

Acquire received text once; work from its file thereafter, byte-checking on or off. A capture proves the receiving application's stored text, not the specialist's original bytes: rendered copying may already have removed markup before any plugin or database saw it. Prefer the specialist's raw text or copy-as-Markdown when available; never describe a repaired or retyped reply as received byte-exactly.

An explicit reply-file path is already acquired input; use it without searching other sources. Otherwise use this ladder, stopping at the first unambiguous usable source. Check availability once per session and revisit only after a failure or a configuration change.

1. **Existing plugin capture**: when a capture plugin (`opencode-capture.ts`) is installed and captured this message, locate its file in `BYTECHECK_INBOX`, the project's `.bytecheck/inbox/`, or the home fallback. Match the message and part, not merely the newest filename; verify the `.sha256` sidecar. A missing part or mismatching digest is an acquisition failure, never something to repair in place; do not invent separators to assemble parts.
2. **Session database**: otherwise `extract-reply.py` beside this file reads the receiving session's stored text and writes it unretyped as UTF-8 with a receipt; read `extract-reply.md` on first use and follow its Harvest conventions — phrase, profile template, `--since` the hand-over time, `--out` the reply path. Prefer an exact message id when the relay event provides it. The receiving session is searched, not excluded; assistant messages and worker sessions are rejected; the full profile must pass, not a promising phrase. Ambiguity returns a candidate report, not a guessed file. A cut-off or collapsed reply may be preserved with `--capture-only`, its failed markers recorded; that is not acceptance.
3. **User-saved file**: when no stored capture resolves, ask the user to save the raw reply as a separate file, one reply per file — say that this adds a save step. An inbox with separators is usable when the exact range is unambiguous; keep its hash and cut mechanically. Saving a rendered copy does not undo its losses.
4. **Degraded transcription**: only when no source remains and the user declines the file step, treat text reconstructed from chat as your own edit, marked typed from chat and unverified in record and report; never file it as an acquired reply. Scope verification may still run; reply fidelity stays unverified.

Each acquired raw reply goes to `round-<k>/replies/<n>-<slug>.md`, by the brief's number and slug, in the existing round folder — or the next round number in the rounds folder, which with byte-checking off creates no snapshot and no byte-check round. Keep acquisition and repair files outside checked trees or under agreed exclusions; never widen a policy to house them.

Keep one compact receipt — source kind and locator, session/message/part or file range, byte length, SHA-256 of the bytes as received (no normalization of line endings, Unicode or the final newline), marker results, completeness, known transport loss — reusing the helper's receipt where it wrote one. A reply with nothing to place still gets a receipt. The raw file is never changed.

Transport: check for missing headings, bold, list and blockquote markers, inline backticks and fences only where the brief required them — their absence elsewhere is not damage. Pastes sometimes arrive with every newline collapsed and sometimes intact; prose tolerates it, byte-exact artifacts never travel by paste.

Capture and extraction spare you transcription; they restore nothing. The brief's marker lines are what survive: cut artifacts between them, never by a fence that may be gone. Cut mechanically, never through a model's rewritten text:

    python3 bytecheck.py cut <reply> --start "=== begin <name> ===" --end "=== end <name> ===" --body --to round-<k>/harvest/<n>-<slug>/<name>

`cut` writes the exact bytes between two marker lines — each a whole physical line that must occur exactly once, else it refuses with exit 2 and lists what it found; `--end` omitted runs to end of file — and prints the span, byte length and sha256. `--body` first drops blank edge lines and, when the remainder is exactly one fenced block, unwraps it, reporting what it removed — so one command serves a raw paste and a rendered one. `blocks <reply> --extract LABEL --to TARGET` still serves path-labelled fences that arrived intact.

With byte-checking on, `scan` the acquired file and every cut: inside an artifact a placeholder or elision is an unresolved gap, never filled from memory. Record each cut's source span and hash.

A bounded restoration — delimiters the transport ate — happens in a separate working copy: take the permitted line forms and literals from the brief's templates, require one unambiguous match with the expected count, insert only the named delimiters, assert that removing them reproduces the acquired text, and record rule, ranges and derived-file hash. Never change words, numbers, whitespace, line breaks or order; never prettify. A non-unique match or missing substantive content stops that artifact for clarification or a continuation. A reply that arrived fully collapsed — every line break eaten — may be line-restored whole, whitespace the only change: assert that restoration and acquired line, both whitespace-normalized, are equal to the character. Equality proves no token changed, nothing more — restored code must also compile and pass its behavior battery. Restoration is your integration edit, not proof of the original reply; what cannot be established is reported unverified, not guessed.

Stale-buffer law: disk is authoritative after an external write. Before placement, establish one writer per target and record its current hash or absence; compare again immediately before replacing or splicing; an unexpected change stops the write for a fresh read. Reload or discard an editor's old buffer after a command, sub-agent or other editor touched the file — never save it to synchronize. Read the placed result from disk. Where exclusive ownership cannot be established, stop rather than claim protection against the race.

Place by command from the cut: copy a whole file, or splice a fragment by reading its bytes from disk. With byte-checking on, prove a whole-file placement with `same`; for a fragment, cut the placed range back out and compare it with the harvest cut; `blocks <reply> --same <root>` proves path-labelled blocks together. Prove an acquired cut against the acquired source and a repaired cut against its labelled derived copy; do not conflate the two claims. Corrections follow the placement proof as your own edits; keep the acquired and derived evidence inspectable.

Under hand integration the target is `round-<k>/files/<path>`, a copy of the tree file edited there — never the tree.

With byte-checking off, keep acquisition, mechanical cutting and placement, and ordinary task checks; do not invoke `bytecheck.py` or manufacture its snapshot, verdict or book. The record is the receipt and any repair note.

When `cleanup-after-yourself` is yes, remove processed briefs and disposable scratch only after integration, required checks and delivery are complete. Never delete a pending continuation's inputs, user-owned source files, a manifest or store, or replies, harvests and books still cited by a retained ledger or report; retained evidence is machinery, kept in ignored storage or the agreed record folder. Do not sweep an inbox to clean up one reply.

## Verify — after the last edit

Read the final state from disk, not an editor buffer; the stale-buffer law holds at every hand-off. Any later save, external write or integration edit invalidates the affected placement proofs, task checks, verdict and delivery copies; repeat the affected checks and rebuild the record before claiming completion.

Run `cmd.txt` as written, twice, both read-only: once with `--json --report round-<k>/.bytecheck/verify.json`, once with `--format md --report round-<k>/CHANGES.md`; each leaves the verdict line on stdout and the book ends with it — quote it. A sub-agent may run both and return the verdict line and the paths. Read nothing else into your context; on FAIL read `violations` and `findings` — paths and lines — not the book. The exit code decides: 0 PASS; 1 FAIL; 2 ERROR — the check did not complete, report that and claim nothing.

On FAIL act by the violation: a path you were never to touch is restored from the store's before-bytes; an error finding is fixed in the tree; a change you cannot account for goes to the user verbatim, unexplained. Then rerun against the same manifest. A FAIL never disappears by re-snapshotting; the manifest and store are never edited, moved or deleted; `--strict` only when asked, warnings quoted for the user to weigh. Verify is repeatable: between sub-agent lanes, a run against the same manifest localizes a violation to its lane. A path PASS is not content proof: where the task implies a count — every occurrence of X replaced, nothing else names Y — count over the after-tree and record expected against actual.

Under hand integration the book comes from the deliverable instead: `python3 bytecheck.py delta <root>/<path> round-<k>/files/<path> --format md --report round-<k>/CHANGES.md` (one book per delivered file, suffixed by name when there are several), with the `--within` the task named; verify's no-flag run still proves the tree untouched.

## The round folder

`round-<k>/` is the round's record for three readers: the user, who reads it or carries the changes by hand into a tree you may not touch; the reviewer, whose brief quotes it; anyone recomputing the hashes.

    round-<k>/
      .bytecheck/   before.json, before.objects/, cmd.txt, verify.json
      replies/      each reply as received, with the extractor's receipts and profiles
      harvest/      artifacts cut from replies, by brief
      files/        after-state copies at root-relative paths: every delivered file under hand integration; else added or mostly rewritten files
      CHANGES.md    the review book — verify's, or delta's per delivered file
      FINDINGS.md   the review ledger (review.md)

Build `files/` after the verdict — rebuilt after any further edit — by command, each copy proved `same` as its source. The book is the tool's rendering, not yours: title and baseline, one `##` per changed file with its diff and findings, violations, findings, verdict line last. `verify.json` names each changed path with before and after hashes; the store holds the before-bytes as plain files named by sha256, flat under `before.objects/` (checked on bytecheck 0.2.0 — if the tool changes, this line is stale; say so). `hash --expect` confirms any of them.

## Report

Close the round's report with the verdict line and both tree hashes, verbatim, and how to recompute: `python3 bytecheck.py hash <root> --exclude <g> ...` must print `tree_hash_after`. Name the tool version and hash, the round folder, every item marked unverified, every check you could not run — a check the protocol cannot give is said, not improvised. Violations and findings appear as the tool printed them; "minor issues" is not a quote.

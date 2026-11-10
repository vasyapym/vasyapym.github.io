# bytecheck — the byte-check part of orchestrate

Your report is a claim; the filesystem is the evidence. This part produces that evidence — bytecheck exists so an agent can check itself and show the work is exactly what it says it is; it is a discipline of self-verification, not a guard the user posts against you. It runs `bytecheck.py` as shipped — no git, no second tool, no flag the tool lacks: what the protocol needs beyond its seven subcommands it takes from files, hashes and your own commands. The core calls for it at three moments: when byte-exact checking is settled on at session open (the snapshot is taken then, before the first edit), when a specialist's reply arrives, and at round close. Asked for the byte-check alone, run it as written.

## The tool

`bytecheck.py` is vendored beside this file — bytecheck v0.2.0, sha256 `03742ad77c6038ed6cdebc60855656df69b8245f72700171ca11854615c88606`, from github.com/vasyapym/bytecheck. Run the copy beside this file by default; a `bytecheck:` line in `~/.config/orchestrate/declarations.md` may name a different clone the user keeps current — use it when present, and say which copy you ran. Two more optional lines: `byte-check:` a standing answer (always, never) that spares the opening question; `rounds:` where round folders go (default: the brief folder). Interpreter `python3`; on Windows `py -3` where `python` is the Store stub, with `PYTHONIOENCODING=utf-8` (or run the vendored `bytecheck.cmd`).

You never modify, update or replace the tool — what judges your work is not yours to touch — but you report what judged it: `--version` and `hash bytecheck.py` go into every round record. This file holds none of the tool's reference: flags, rules, exit codes and the policy guide come from `--help` and the clone's SKILL.md when needed, not from memory. Where this file and the tool disagree, the tool is right, this file is stale, and you say so.

## Snapshot — before the first edit

A round is one snapshot, any number of edits, one verdict. Nothing in the tree changes before the snapshot; none is taken once the round's first edit has happened — the next round opens with its own.

1. Make `round-<k>/` in the rounds folder (next `round-` number present; 1 in a fresh folder). It lies outside every tree a gate or this check covers; if the user put it inside the root, exclude it.
2. Snapshot with the store:

       python3 bytecheck.py snapshot <root> -o round-<k>/.bytecheck/before.json --store --exclude <g> ...

   Exclude dependency and build trees (`node_modules/`, `.venv/`, `dist/`) and nothing the task could touch — an excluded path is unchecked. The store keeps every before-byte: on a large tree exclude generously or tell the user the size first.
3. Derive the policy from the task as stated: allow what it names, narrowly; expect what must change; deny what it must not touch; allow deletion only where asked; `--within` where lines were named. No flags asserts an untouched tree; `--allow '**'` is a report, not a check, and is used only when asked for. Write the complete verify command — manifest, root, excludes, policy — into `round-<k>/.bytecheck/cmd.txt`. From here it narrows freely and widens only on the user's word in this conversation; the same excludes serve snapshot, verify and hash, since differing excludes make false verdicts.
4. Report in chat: `tree_hash_before`, excludes, the policy in one line, and how replies will travel (next section). The hash in the user's chat is the one piece of evidence you cannot later edit.

## Harvest — when a reply arrives

What you keep verbatim from a reply comes from a file on disk, never from the chat. Every reply ends as `round-<k>/replies/<n>-<slug>.md` — the brief's number and slug — with its `hash` recorded. Three ways there:

- **Capture on** (`opencode-capture.ts` in `~/.config/opencode/plugins/`): the paste lies in `.bytecheck/inbox/` with a `.sha256` sidecar. `hash <capture> --expect $(cat <capture>.sha256)`, copy to `replies/`, `same` the two.
- **Capture off** (this host today): ask the user to save the reply at that path — one paste beyond the one into chat; say so in the snapshot report. You cannot make this file yourself: written from chat it would be the paraphrase this part exists to prevent. Installing the plugin (copy, restart) is the user's call and ends the extra step.
- **No file** (the user declines): nothing is kept verbatim. What you write is your own edit, marked `typed from chat, unverified` in record and report; `scan` each such file at once — elisions and markers are what re-typing produces. Verify still covers scope; nothing covers fidelity to the reply.

With a file: `scan` it — findings are facts about the reply; in prose, noise; inside an artifact you mean to place, a placeholder or elision is a gap for the next brief, never filled in by you. Cut each artifact you keep out of the file mechanically — a line range via `sed -n` or a Python slice, never typed — or, when the capture fences each artifact under a heading naming its target path, with `blocks CAPTURE --extract LABEL --to TARGET` (body bytes copied exactly, EOLs included; an index shifts when the document is edited, so record labels) — into `round-<k>/harvest/<n>-<slug>/<name>`, recording range or label and the `hash`. Place by command from that cut: a copy for a whole file, a splice reading from disk for a fragment. Prove it: `same <cut> <target>` for a whole file; for a fragment, cut the placed range back out and `same` it against the cut; with blocks, `blocks CAPTURE --same` proves every path-labelled block at once. Received code is never retyped when `blocks --extract` can copy it. Corrections come after the proof, as your own edits; the harvest copy stays, so what was delivered and what landed can be diffed by anyone. A reply with nothing to place is still filed with its hash.

## Verify — after the last edit

Run `cmd.txt` as written, twice, both read-only: as text into `round-<k>/.bytecheck/verify.txt`, whose last line is the verdict line you quote, and once more with `--json` added, into `verify.json`, from which the round folder is built. A sub-agent may run both and return the verdict line and the paths. Read nothing else into your context; on FAIL read `violations` and `findings` — paths and lines — not the document. The exit code decides: 0 PASS; 1 FAIL; 2 ERROR — the check did not complete, report that and claim nothing.

On FAIL act by the violation: a path you were never to touch is restored from the store's before-bytes; an error finding is fixed in the tree; a change you cannot account for goes to the user verbatim, unexplained. Then rerun against the same manifest. A FAIL never disappears by re-snapshotting; the manifest and store are never edited, moved or deleted; `--strict` only when asked, warnings quoted for the user to weigh. Verify is repeatable: between sub-agent lanes, a run against the same manifest localizes a violation to its lane. A path PASS is not content proof: where the task implies a count — every occurrence of X replaced, nothing else names Y — count over the after-tree and record expected against actual.

## The round folder

`round-<k>/` is the round's record for three readers: the user, who reads it or carries the changes by hand into a tree you may not touch; the reviewer, whose brief quotes it; anyone recomputing the hashes.

    round-<k>/
      .bytecheck/   before.json, before.objects/, cmd.txt, verify.txt, verify.json
      replies/      each reply as received
      harvest/      artifacts cut from replies, by brief
      files/        after-state copy of every added, modified or renamed file, at its root-relative path
      CHANGES.md    the diff book

Build `files/` after the verdict — rebuilt after any further edit — from disk and the store, with a script written once and kept beside the round folders (`tools/`); nothing in the book is typed by you. Render `CHANGES.md` from the same verdict: `python3 bytecheck.py verify <manifest> <policy as already written> --format md --report <round folder>/CHANGES.md` — bytecheck's review book: title with the verdict line, baseline line, one `##` per changed file with its fenced diff and findings, Violations, Findings, verdict line last. The round script copies it, with `files/`, into the round folder; it renders no diffs itself. `verify.json` names each changed path with its before and after hash; the store holds the before-bytes under the before hash — locate, `hash --expect` confirms; the store objects are plain bytes named by their sha256, flat under `<manifest stem>.objects/` (checked on bytecheck 0.2.0; if the tool changes, this line is stale — say so).

CHANGES.md is compact. Header: root, date, tool version and hash, `tree_hash_before -> tree_hash_after`, the verdict line verbatim, excludes, policy, the reply files with hashes, every item marked unverified. One section per changed file: path, kind, before -> after hash, lines added and removed. Deleted: that line. Added: content inline when short, else `see files/<path>`. Modified: one old/new pair per hunk with two or three lines of context — the old block with its old-file line range, then the new block, both fenced, both verbatim, so the reader finds the old text and pastes the new over it; a file mostly rewritten gets `replaced whole, see files/<path>` instead. Before you cite the book, check it: the new blocks applied over the old in the before-bytes reproduce the after-file (`same`), and each `files/` copy is `same` as the tree.

## Report

Close the round's report with the verdict line and both tree hashes, verbatim, and how to recompute: `python3 bytecheck.py hash <root> --exclude <g> ...` must print `tree_hash_after`. Name the tool version and hash, the round folder, every item marked unverified, every check you could not run — a check the protocol cannot give is said, not improvised. Violations and findings appear as the tool printed them; "minor issues" is not a quote.

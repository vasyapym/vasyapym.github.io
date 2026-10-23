---
name: bytecheck
description: Byte-exact verification of what you changed on disk. Snapshot a directory before editing, verify it after against a policy of allowed, expected and denied paths, quote the verdict. Use when asked to "verify my changes", "prove you only edited X", "snapshot before editing", "check nothing else changed", "did the agent actually change it", "byte-exact", "no placeholders", or whenever you edit files for a user who wants evidence rather than a report. Also the home of paste capture: material pasted into opencode lands in `.bytecheck/inbox/` and is harvested from files, never re-typed from chat context.
---

# bytecheck

Your report is a claim. The filesystem is the evidence. This skill produces the evidence.

`bytecheck.py` sits beside this file. Run it as `python3 <this directory>/bytecheck.py`
(`python` if `python3` is not on PATH); the commands below shorten that to
`python3 bytecheck.py`. One file, standard library only, Python 3.8+. It never modifies
the tree it checks. It writes only the manifest and the optional store, at the path
you choose.

`opencode-capture.ts` ships beside it too: a paste-capture plugin for opencode.
See [Capture](#capture-opencode-pastes-land-on-disk).

## Protocol

1. From the project root, before touching any file:

       python3 bytecheck.py snapshot . -o .bytecheck/before.json --store

   If the user or orchestrator gave you a manifest path or a policy file, use theirs.
   If `.bytecheck/before.json` already exists, do not overwrite it: ask, or use a new name.

2. Do the work.

3. Verify with a policy derived from the task:

       python3 bytecheck.py verify .bytecheck/before.json --json \
         --allow 'src/payments/**' \
         --expect 'src/payments/refund.py' \
         --deny '**/*.lock' --deny '.github/**'

   Or `--policy FILE` when one was supplied. Flags add to a policy file; they cannot
   loosen it.

4. Read `summary.verdict`.

   - `PASS` (exit 0): done.
   - `FAIL` (exit 1): fix the tree and rerun, or report `violations` and `findings` verbatim.
   - `ERROR` (exit 2): the check could not complete. Report that. Do not claim success.

5. End your completion message with the verdict line and `tree_hash_after`, e.g.
   `PASS 2 changes, 0 violations  a1b2c3d4e5f6 -> 0f9e8d7c6b5a`. The user can recompute
   the second hash with `python3 bytecheck.py hash .` (same excludes) and compare.

## Deriving a policy from the task

- `--allow`: the paths the task names. Narrow beats wide: `src/payments/**`, not `src/**`.
- `--expect`: the files the task says must change. Catches "I edited it" when you did not.
- `--deny`: lockfiles, CI config, tests, migrations, generated files, unless the task is
  about them. Deny wins over everything.
- `--allow-delete`: only when the task says to delete. `--allow` never covers deletions.
- `--within PATH:RANGES`: when told to change specific lines; old-file numbering, 1-based
  inclusive. Needs `--store` at snapshot time.
- No policy flags means nothing may change. Use it for read-only tasks.
- `--allow '**'` permits everything except deletions. That is a report, not a check. Use it
  only when the user asked for a report.

## Capture (opencode): pastes land on disk

`opencode-capture/` ships beside this file: an opencode V2 plugin. Installed, every
message the human types or pastes into the chat is written to `.bytecheck/inbox/` in
the project opencode runs in, one UTF-8 file per admitted prompt text plus a `.sha256`
sidecar, named `<timestamp>-<sessionTail>-p1.txt`. Assistant messages, synthetic parts
and subagent prompts are not captured. Set `BYTECHECK_INBOX` to capture somewhere else.

Install once (OpenCode V2): copy the directory into
`~/.config/opencode/plugins/bytecheck-capture/`, declare that directory in the global
`opencode.json(c)` `"plugins"` array (a configured local path must name a DIRECTORY — a
`.ts` file is skipped with a log warning; the V1 field name was `plugin`, V2 renames it
to `plugins`), and restart opencode — plugins load at startup only.

Diagnosis of record (observed 2026-10-24, opencode 2.1.2): the shipped file was a V1
plugin (an exported async function returning a `"chat.message"` hook, imported from
`@opencode-ai/plugin`). V1 implementations do not run in V2 — the hook never
registered, no inbox and no capture.log ever appeared anywhere, and the failure was
silent. A session started before the install also captures nothing; verify with one
typed message after the restart, then check the project's `.bytecheck/inbox/`.

## Harvest: received material comes from files

A specialist's reply, or any material pasted by the user, is processed from its
capture file, never from chat context. Re-typing or regenerating received content
produces a paraphrase with placeholders — prohibited. The transcript is a claim;
the file is the evidence.

1. `python3 bytecheck.py scan <capture>` — rules on the received text itself;
   findings here are facts about the paste, not violations by you.
2. `python3 bytecheck.py hash <capture> --expect $(cat <capture>.sha256)` — the file
   is intact since it landed.
3. Read the file. It is the source of truth for placement.
4. Write it where the task needs it, then
   `python3 bytecheck.py same <capture> <target>` must report identical.
5. When the harvest is verified and recorded, delete the inbox files
   (`--allow-delete '.bytecheck/inbox/**'`); the capture log stays.

## Delivery: outgoing briefs open in the editor

When you compose a brief or handoff the owner will paste into another tool (a relay
specialist chat, a web form), the file on disk is the paste source — the same law as
Harvest, in the outgoing direction: the transcript is a claim, the file is the evidence,
and a second copy in the chat is where a paraphrase gets pasted from.

1. Write the brief to its file (for example `docs/briefs/<slug>.md`).
2. Open it in a plain text editor immediately: `open -e docs/briefs/<slug>.md`
   (TextEdit). Do not use bare `open` — the owner's `.md` handler is VS Code, which
   loads slowly on the old Mac.
3. In the chat, give the file path and say to copy from the editor window — select
   all and copy there; the chat never carries a second copy of the text.
4. Stale-buffer law: open the file only when its content is final. Never edit the
   file after opening it — an editor holding the older buffer overwrites the newer
   disk bytes on its next save. If the file changed since it was opened (by you or
   anyone), close and reopen it yourself before telling the owner to copy, and state
   the file's current size (lines/bytes) in the chat so the window can be checked
   against the disk.

## Rules of conduct

- Never edit, regenerate, move or delete the manifest or the store.
- Received material — specialist replies, pasted code, user data — is worked from its
  capture file (see Harvest). Never re-type, regenerate or "fill in" received content
  from chat context; if no capture file exists, say so.
- Never widen `--allow`, add `--allow-delete`, add `--exclude`, or `--disable` a rule unless
  the user asked for it in this conversation. Narrowing is always fine.
- Never make a FAIL disappear by re-snapshotting. A FAIL is information for the user.
- Quote bytecheck output verbatim. Do not summarise violations into "minor issues".
- If a rule fires on content you believe is correct, say so and let the user decide.

## Cheat sheet

Commands

    snapshot [ROOT] [-o FILE|-] [--store [DIR]] [--exclude G]... [--exclude-from FILE] [--no-default-excludes]
    verify   [MANIFEST|-] [--root DIR] [--baseline DIR] [--policy FILE]
             [--allow G]... [--deny G]... [--expect G]... [--allow-delete G]...
             [--within PATH:RANGES]... [--exclude G]... [--disable RULE]... [--no-scan] [--strict]
    hash     PATH... [--expect HEX] [--exclude G]...   file sha256 and size; - is stdin; directory = tree hash
    same     A B [--exclude G]...                      two files or two trees, byte-identical or not
    delta    OLD NEW [--within RANGES] [--disable RULE]... [--strict]
                                                       hunks, EOL/BOM before and after, delta rules
    scan     PATH... [--strict] [--disable RULE]... [--exclude G]...   content rules, no baseline needed

Every command takes `--json` (one JSON document on stdout, nothing else) and `--quiet`.
Defaults: manifest `.bytecheck/before.json`; excludes `.git/` and `.bytecheck/`, nothing else.

Exit codes

    0  PASS
    1  FAIL   policy violation, error-severity finding, or warning under --strict
    2  ERROR  usage or environment problem; partial results still printed, incomplete: true

Result JSON (verify)

    ok, incomplete, tree_hash_before, tree_hash_after
    summary        verdict, changes, allowed, violations, expect_missing,
                   findings{error,warn,info}, untouched
    changes[]      path, kind (added|deleted|modified|renamed|attr), allowed, reason,
                   before, after, old_path (renamed only), binary,
                   hunks[{old_start,old_end,new_start,new_end,added,removed}],
                   added, removed, whitespace_only, eol_only, note, within_ok, findings
    violations[]   kind (change_not_allowed|outside_within|expect_missing), path, change, reason
    findings[]     path, rule, severity (error|warn|info), line, message
    errors[]       what could not be checked

Glob dialect: whole root-relative POSIX path; `*` stays in one segment, `**` crosses,
`?` is one character, trailing `/` means the directory and everything below. No implicit
any-depth matching.

Rules

    error  conflict-marker placeholder nul-in-text bidi-control bom-changed eol-changed
    warn   zero-width smart-quote nbsp mixed-eol shrunk trailing-newline-lost indent-flipped
    info   bom no-trailing-newline invalid-utf8

`error` fails, `warn` fails under `--strict`, `info` never fails. Rules run only on files
you added or modified; pre-existing debt cannot fail you. Delta rules need before-content
(`--store` or `--baseline`).

# extract-reply — on-demand reference

`extract-reply.py` acquires a specialist reply from the opencode session database over a read-only SQLite connection and writes it, byte-exact, to a destination file plus a provenance receipt. This page is the whole interface; read it on first use. There is no setup beyond having Python 3.

## CLI

```
python3 extract-reply.py <phrase> <profile.json> --session <receiving-session-id> --out <file>
                         [--db <path>] [--message <id>] [--since <bound>]
                         [--exclude-session <id>]... [--exclude-message <id>]... [--capture-only]
```

- `<phrase>` — identifying text searched in the **decoded** message text, never in the escaped JSON spelling. Exact codepoints and case; NFC/NFD variants do not match. Empty phrase → exit 2.
- `--session` (required) — the receiving session; the **only** session ever searched. It is never excluded: `--exclude-session` equal to `--session` is a scope contradiction (exit 2). Excluding the receiving session would reject the wanted human paste.
- `--out` (required) — destination reply file; the receipt is written beside it as `<out>.source.json`.
- `--db` — overrides the default database `~/.local/share/opencode/opencode.db`; the path is resolved through `HOME`/`USERPROFILE`, and paths containing `?` are refused (they cannot form the read-only URI).
- `--message` — narrow to one message id. The named row still undergoes role, session and profile checks; a named id earns no waiver. Guard refusals (absent id, foreign session, non-user role, excluded, out of bounds) are exit 1 naming the guard.
- `--since` — only messages at or after the bound: epoch seconds, epoch milliseconds (≥ 10¹¹), or ISO-8601 (naive = UTC). Inclusive. Unparsable → exit 2. The resolved bound is echoed in UTC in the report.
- `--exclude-session` / `--exclude-message` — repeatable. Ids other than the receiving session have no effect (the scope is the receiving session only). Excluded messages are dropped before any evaluation.
- `--capture-only` — requires `--message` (exit 2 otherwise). Preserves the named user message with every failed check recorded; the receipt says `capture-only` and makes no acceptance claim. Scope, role and structural (decode/UTF-8) guards still apply.

Reports (exit 0 and exit 1) go to stdout and are content-free: scope, resolved bounds, counts, and per-candidate session/message ids, UTC timestamps, byte lengths and per-check results — never message text. Exit-2 causes go to stderr. Candidate detail is capped at 20 with an explicit truncation note.

## Database access

- A single read-only connection: `file:` URI with `mode=ro`, a bounded busy timeout (5 s), one `BEGIN DEFERRED` read transaction; rows are fetched, the transaction is rolled back and the connection is closed before scoring and writing. No schema changes, no checkpointing, no journal-mode changes, no sidecar or main-file copies, no retry loop.
- The v2 layout is validated before use: tables `session_v2`, `session_message`, `session_part` with their expected columns and the `session_id` linkage. A missing table or column is exit 2 naming it. The presence of v1 tables (`session`, `message`, `part`) is normal and ignored; a database holding only v1 tables is a named failure (`v1-only`).
- `--session` must exist in `session_v2`. Found only in the legacy `session` table → exit 2 `legacy session unsupported`; found nowhere → exit 2 `unknown session` (never exit 1).
- Supported storage: `session_message.type = 'user'` with a JSON object at `data` holding a string at `data.text`. Assistant rows are never candidates; role labels alone prove nothing about origin. Child/spawn sessions are never searched (the scope is the receiving session only); the scoped session's parent linkage is recorded in the receipt.
- Direct text wins: when `data.text` exists, `session_part` rows are ignored entirely (never appended, never duplicated). When it does not and the message owns text parts, the failure is named `parts-only` (exit 2, message id); nothing is reconstructed. A later adapter would need observed fixtures and explicit assembly semantics.
- In-scope rows with invalid JSON, a missing or non-string `data.text`, or `data` bytes that are not UTF-8 fail closed: exit 2 naming the message id, no traceback — even when another candidate would pass — unless the row leaves the enumeration via `--message`, `--exclude-message` or `--since`.
- Text must be encodable as strict UTF-8; unencodable text (e.g. lone surrogates) in a phrase-hit row is exit 2 naming the id, with no replacement character. Rows without the phrase are unaffected. Nothing is re-decoded or normalised: the output is the stored text's UTF-8 bytes exactly, and byte length counts encoded bytes, not characters.
- Message timestamps come from `session_message.time_created` (epoch milliseconds).

## Profile schema (version 1)

Trusted declarative JSON; no executable expressions. Unknown or misspelt keys, an unsupported version, a wrong type, an invalid regex, malformed JSON, or a profile whose only check is the phrase are all exit 2 — a typo cannot weaken a profile.

```json
{
  "version": 1,
  "required_lines": ["<exact reply preflight>"],
  "line_counts": [{"pattern": "^<declared block-start pattern>$", "exact": 3}],
  "terminal_line": "COMPLETE",
  "forbidden_lines": ["TRUNCATED-HERE"]
}
```

- `required_lines` — each must appear as a whole physical line at least once (substring presence is not enough).
- `line_counts` — each pattern is matched against the whole line (anchored via full line match; `^`/`$` are redundant) and must match exactly `exact` physical lines.
- `terminal_line` — the final nonempty physical line must equal the sentinel exactly; recognition never rewrites the output.
- `forbidden_lines` — each must not appear as a whole physical line; inside a longer line it passes.
- Scoring never short-circuits: every check is evaluated and reported per candidate. Write happens only when exactly one scoped candidate passes the complete profile; ties (byte-identical duplicates included) are never broken by recency, size or score.

## Receipt `<out>.source.json`

Written 0600 beside the output; contains no reply text.

| field | meaning |
| --- | --- |
| `schema` | receipt schema version (1) |
| `mode` | `profile` or `capture-only` |
| `source` | storage field: `session_message.data.text` |
| `storage` | `v2-direct-text` |
| `db` | resolved database path |
| `session_id` / `session_parent_id` | scoped session and its parent linkage |
| `message_id` | selected message |
| `message_time` / `extracted_at` | UTC timestamps (message vs. extraction) |
| `byte_length` | UTF-8 byte length of `<out>` |
| `sha256` | SHA-256 of `<out>` |
| `profile_sha256` | SHA-256 of the profile file bytes |
| `checks` | per-check results (indices, observed counts, booleans) |
| `failed_checks` | names of failed checks; non-empty only for capture-only |

## Publication

No-clobber. The pair is written only when neither file exists: fresh files are created 0600 with exclusive opens, and a failed second write rolls the first back, so no partial or temporary files remain after any failure. An existing identical output with matching provenance (everything except `extracted_at`) is an exit 0 no-op with mtimes untouched. Any other conflict — different bytes, different message id, profile hash or mode, an incomplete output/receipt pair, an unreadable receipt — is exit 2 with existing files untouched. An earlier harvest is never overwritten to resolve ambiguity.

## Exit codes

- `0` — acquisition succeeded (including explicitly labelled capture-only); never a claim that the task passed.
- `1` — no unique fully matching candidate (zero passes, several passes, or a named guard refusal); nothing written.
- `2` — usage, schema, decoding, database or file failure, with a named cause on stderr; nothing written.

## Operational notes

A one-line extract is normal: relay pastes may arrive newline-collapsed upstream; bytes are preserved as stored. A collapsed paste fails the terminal-line profile check by design — take the message id from the candidate report and re-run with `--capture-only`.

Harvest should pass `--since <dispatch time>` and put the brief's round token in the profile. Acquisition proves database-to-file fidelity only; it says nothing about what the chat already changed before storage.

## Pins

Decided behaviours the adopted contract left open (the "(pin)" items from the test plan) plus ambiguities resolved while implementing. Each is one line; change code, tests and a pin together.

- F3 → whitespace-only trailing lines count as empty for the terminal check (the sentinel comparison itself stays exact, no trimming).
- F6 → physical lines end at LF or CRLF only; U+2028, U+0085, FF, VT and lone CR never split a line and are never normalised.
- F9 → an unresolvable `--session` is a usage failure: exit 2 (`legacy session unsupported` / `unknown session`), never exit 1.
- F11 → unevaluable in-scope rows fail closed: exit 2 naming the row even when another candidate would pass; resolved only by `--message` narrowing, `--exclude-message`, or falling outside `--since` bounds.
- G1 → naming an assistant row with `--message` — with or without `--capture-only` — is refused with exit 1 (`guard role`), nothing written.
- G3 → `--exclude-session` equal to `--session` is a scope contradiction: exit 2.
- G8 → unknown profile keys are rejected (a misspelt key cannot weaken a profile): exit 2.
- phrase-exactness → the phrase is one exact substring test on decoded text: case-, whitespace- and normalisation-sensitive; NFC/NFD variants and escaped-JSON spellings do not match; only a literally empty phrase is exit 2.
- since-format → `--since` accepts epoch seconds, epoch milliseconds (≥ 10¹¹), or ISO-8601 (naive = UTC); the bound is inclusive (`time_created >= bound`) and echoed in UTC.
- line-equality → required, forbidden and terminal comparisons are exact whole-line equality after removing the CRLF terminator; nothing is trimmed otherwise.
- profile-shape → `version` must be the integer 1; `line_counts` entries need exactly `{pattern, exact}` with a non-negative integer; patterns are whole-line matched so `^`/`$` are redundant; an empty `terminal_line` counts as no terminal check; a profile with no check beyond the phrase is exit 2.
- structural-fatal → invalid JSON, missing/non-string `data.text`, and non-UTF-8 `data` bytes are exit 2 naming the message id regardless of other candidates; `parts-only` is named whenever the message owns text parts (parts are not read for content).
- unencodable-timing → strict-UTF-8 encodability is enforced for phrase-hit rows and the selected row only; a non-hit row with unencodable text does not block a valid extraction.
- message-narrowing → `--message` narrows the enumeration to that id; other in-scope rows (including unevaluable ones) are not considered, and the named row still passes role, session and profile checks.
- exclude-session-noop → `--exclude-session` ids other than the receiving session have no effect because the scope is the receiving session only.
- child-sessions → child/spawn sessions are never searched; no parent traversal exists, and the scoped session's parent id is recorded in the receipt.
- message-time-source → candidate timestamps come from the `session_message.time_created` column; the `time` object inside `data` is ignored.
- provenance-compare → the no-op comparison covers the whole receipt except `extracted_at`; an unreadable or non-object existing receipt is a conflict (exit 2).
- db-uri-path → database paths containing `?` are refused (exit 2) because they cannot form an unambiguous read-only URI.
- stream-conventions → reports go to stdout, exit-2 causes and exit-1 reasons to stderr; the candidate report cap is 20 with an explicit truncation note.
- phrase-check-name → the phrase is reported as a per-check result named `phrase`; it gates candidacy in profile mode and may fail without blocking in capture-only mode.
- capture-only-structure → capture-only still enforces structural decoding and strict UTF-8 encodability (bytes that cannot be reproduced exactly cannot be preserved); failed marker checks are recorded, not waived.
- receipt-fields → receipt `checks` carry only indices, counts and booleans (no message content and no profile strings), so receipts stay content-free by construction.

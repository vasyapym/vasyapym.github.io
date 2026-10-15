# HANDOFF — second brain M2→M3 (supersedes HANDOFF-second-brain-m0m1.md for everything past its "Done")

Owner may hit the API token limit — this file carries the session state so ANY new session can resume.
Read this, then `docs/briefs/DESIGN-second-brain-v1.md` (verbatim accepted design), then the minimize-iteration7 results rows B1–B3.

## Where things live

- Work repo: `/Users/vasilij/Documents/quiet-index` (public; tags carry versions; push with `/usr/bin/git`).
- Vault repo: `/Users/vasilij/Documents/vasyapym-Vault` (private; the workflow lives at `.github/workflows/second-brain-index.yml`; tools ref currently **v1.0.8**).
- Relay chat format: `minimize-iteration7` shape (question + decided-facts + verbatim contract + "code at the end", ASCII-only, no repo references); evidence rows in `skills/in-progress/minimize-iteration7/results.md` (B1 shared layer, B2 parsing, B3 runner).
- This luna2 workspace: handoff + briefs (`docs/briefs/BRIEF-second-brain-m2a/m2b/m2c.md`) + `second-brain-index.workflow.yml` (the copy the owner pasted into the private vault).

## M2 DONE — full index GREEN (Oct 15, 2026)

- **Run #13 `38710820006`, ref v1.0.8 — success, 15m39s.** Summary: `mode=full changed=410 deleted=0 unchanged=1666 notes=410 chunks=4325 links=48 yaml_errors=0 skipped_utf8=0 ms=894092`.
- Neon state (verified by probes): **2076 notes / 12492 chunks / 162 links**; `brain_meta` has `embed_signature` + `chunker_version=1` (+ `debug_phase=done` telemetry key).
- The resumable path worked exactly as designed: run #9's 6 hours of banked notes (1666) were hash-skipped; only the remaining 410 embedded.
- Builds/tests: 165/165 green at v1.0.8 (`bc912c1`). Chain this session: `3b04587` v1.0.6 (stamp-at-start + per-25 progress lines), `7c56630` v1.0.7 (bounded DB calls, chunked hash-skip, `brain_meta.debug_phase` telemetry), `bc912c1` v1.0.8 (token-guard). Graph: `n312 -> n313` in `portfolio/.project-history/graph.jsonl`.
- Local creds for probes: `quiet-index/.env.local` (gitignored, mode 600; pooled Neon URL for brain_indexer). Probe scripts in `/private/var/folders/.../T/opencode/probe*.js` (recreate from the session log if gone).

## Lessons that shaped v1.0.6–v1.0.8 (do not re-derive)

1. **transformers.js tokenizer `encode()` is superlinear in input size.** Measured on the owner's Mac: 45KB→48s, 93KB→100s, while ≤8KB is milliseconds. The chunker calls the counter many times per large note, so a large note was minutes-to-hours — run #9 died there silently (ceiling), runs #10–#11 froze on cold DB wake / first big note.
2. **Guard the counter**: `token-guard.ts` — exact counts below 8KB, length/3 estimate above (and on throws); `SAFE_INPUT_CHARS=2500` feeds the pipeline. Whole-vault count went 4.8h → 3min.
3. **Bounded DB calls**: any DB op can wedge forever (Neon cold wake, flaky networks) — `db.ts` caps each attempt at 90s, retries on a FRESH client (3 attempts), phase markers written to `brain_meta.debug_phase` (counts only) are the LIVE telemetry: CI publishes step logs only after the step ends.
4. **Stamp the build signature at run START**, not only after success — see v1.0.6 commit note (never-completed full runs would have re-embedded everything forever).
5. Local probes against Neon die on large RESULT sets from the owner's flaky WiFi — countAll/tiny SELECTs pass, big ANY() reads hang. Retry mini probes; never rely on them for big reads.
6. `channel_binding=require` belongs to the pooled endpoint. CI secret assumed untouched and working (it carried run #9 and #13). Rotate owner+brain_indexer passwords calmly AFTER M3 (the new brain_indexer password `DCv6...` is already the working one).

## Owner actions pending

1. Fill `.second-brain/denylist.txt` with vault folder names (command: `ls -d */ | tr -d '/' | sort > .second-brain/denylist.txt` in the vault dir) — owner decided to index everything for now; denylist stays empty and the leak-guard tolerates it.
2. Verify the UptimeRobot monitor on `/` is green.
3. Later/hygiene: rotate the Neon owner password (it and the brain_indexer password appeared in chat), then update `DATABASE_URL`+`DIRECT_URL` on Render in one calm window; update the `BRAIN_DB_URL` secret in one go if rotated.

## Next: M3 (relay, same pipeline — briefs to the chat model, orchestrator integrates)

Scope per design §8–§10, split into small ASCII rounds like M2:
1. auth round: `session.service` (HMAC cookie), `session.guard`, `login-throttle`, `passphrase` verify (`@node-rs/argon2`), `hash-passphrase` CLI; specs per §13.
2. web round: `brain.controller` routes (all DB-free until auth passes; note-id 16-hex gate 404s before any query), `security-headers.ts`, `brain-exception.filter` (name/code only), views (layout/login/home/search/note, `h()` escape, no JS, CSP no-script).
3. search+reader round: `app.module` wiring behind `BRAIN_ENABLED` (transformers gate), `notes.repository` + link resolution/autores backlinks per §10.3, `markdown.ts` already landed (M2a), search SQL §9 with signature gate + P1001/P1017 retry.
M3 acceptance → tag bump; then M4 = memory gate (docker run --memory=512m, RSS ≤ 420 MB via one-off log) → `BRAIN_SEMANTIC=true`.
Optional polish queue (not blockers): batched-embed "blocking" store variant; "build your own" README quickstart; repo rename (after M3, if owner still wants; remember workflow `repository:` field + Render check).

## House rules (unchanged)

- Explanations to the owner in simple Russian; briefs in English; pure-ASCII briefs; every line self-contained (chat model has no repo access).
- Never put vault names/paths in the public repo, committed briefs or logs; indexer logs carry counts only.
- quiet-index: validated round → commit+push pre-approved; keep commits topical; never fold unrelated files.
- luna2: graph node once per session at real wrap-up (CLI from inside `portfolio/`).

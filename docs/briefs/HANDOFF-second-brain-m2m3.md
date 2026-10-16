# HANDOFF — second brain M2→M3 (supersedes HANDOFF-second-brain-m0m1.md for everything past its "Done")

Owner may hit the API token limit — this file carries the session state so ANY new session can resume.
Read this, then `docs/briefs/DESIGN-second-brain-v1.md` (verbatim accepted design), then the minimize-iteration7 results rows B1–B3.

## Where things live

- Work repo: `/Users/vasilij/Documents/quiet-index` (public; tags carry versions; push with `/usr/bin/git`).
- Vault repo: `/Users/vasilij/Documents/vasyapym-Vault` (private; the workflow lives at `.github/workflows/second-brain-index.yml`; tools ref currently **v1.0.9** — fine: the indexer is byte-identical since v1.0.8 (M3 rounds 1-2 touch only the web app side); bump to v1.0.10 happens naturally with the next indexer change).
- Relay chat format: normal orchestrate brief (task/constraints/context/acceptance/output contract, ASCII-only, no repo references) — owner moved M3 rounds off the `minimize-iteration7` shape; evidence rows B1–B3 stay in `skills/in-progress/minimize-iteration7/results.md` (historical).
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
6. `channel_binding=require` belongs to the pooled endpoint. CI secret assumed untouched and working (it carried run #9 and #13). Rotate owner+brain_indexer passwords calmly AFTER M3 (the new brain_indexer password is already the working one).
7. Push-triggered incremental runs are now cheap and safe: each md-push ≈ 1.5 min CI + ~0.02 CU-h on Neon (wake + burst + the fixed 5-min suspend floor). Obsidian auto-push can stay ON between M3 sessions. Neon suspends after 5 min idle — the floor is not configurable below 300s. Free-plan Neon allowance is **100 CU-hours/month (owner-corrected off the dashboard — re-check on the Usage page when billing matters)**; CI minutes remain the tighter budget (~1.5–2 min per push job).

## Owner actions pending

1. Fill `.second-brain/denylist.txt` with vault folder names (command: `ls -d */ | tr -d '/' | sort > .second-brain/denylist.txt` in the vault dir) — owner decided to index everything for now; denylist stays empty and the leak-guard tolerates it.
2. Verify the UptimeRobot monitor on `/` is green.
3. Later/hygiene: rotate the Neon owner password (it and the brain_indexer password appeared in chat), then update `DATABASE_URL`+`DIRECT_URL` on Render in one calm window; update the `BRAIN_DB_URL` secret in one go if rotated.

## M3 ROUND 1 DONE — backend auth (Oct 15, 2026)

- Tag `v1.0.9` (`3980642`): `src/second-brain/auth/` — `session.service` (HMAC `sb_session`, base64url `{iat,exp}`, `timingSafeEqual` with length pre-check, fails closed), `session.guard` (`SESSION_COOKIE`/`SESSION_MAX_AGE`, `sanitizeNext` (only `/brain`/`/brain/…`, rejects `//` and `\`), `UnauthenticatedException` 401 carrying next — round 2 filter turns it into 303), `login-throttle` (5/15/15 min, in-memory, Injectable Clock from `src/common/clock`), `passphrase.service` (argone2 verify wrapped: malformed PHC -> false, never throws), `hash-passphrase.ts` CLI (argon2id, m=65536 t=3 p=1; TTY raw read, Ctrl-C=130, empty=2, piped=EOF).
- 212/212 tests green (47 new), build clean, ASCII-checked; CLI exercised live end-to-end (piped + pty by the relay model).
- Nothing wired yet on purpose: no Nest module, no AppModule edit, no controller — the app's runtime behavior is unchanged until round 2.

## M3 ROUND 2 DONE — web shell (Oct 16, 2026)

- Tag `v1.0.10` (`8f7b894`, 18 files): `src/second-brain/web/` — `brain.controller` (GET login + POST login [origin CSRF gate -> throttle lockout -> missing-passphrase 400 -> argon2 verify -> 401/303 + `Set-Cookie`], POST logout, GET home with the one `brain_meta` freshness query), `brain-exception.filter` (scoped: guard-401 -> 303 to login carrying sanitized next; 404 plain page; generic HttpException pages; unknown errors -> one `brain: error name=… code=…` log line, message/stack/URL never logged), `security-headers` (the five from design 8.3), `meta.service` (`SELECT key, value FROM brain_meta WHERE key = ANY($1::text[])`, keys `last_indexed_at`/`notes_count`, fails closed to nulls, safe-integer bounded). `src/second-brain/views/` — `layout` (dark default + prefers-color-scheme light override, 42rem column, system font stack shared with the card, `escapeHtml` from `src/common/html.util`), `login.view` + `home.view` (fragments; NO search form this round by design). `second-brain.module.ts` registers the controller + 9 providers via 3 factories (`BRAIN_SESSION_SECRET`/`BRAIN_PASSPHRASE_HASH` via `getOrThrow`, `systemClock`); `app.module.ts` conditions the import on `process.env.BRAIN_ENABLED === 'true'`, spread AFTER `ConfigModule.forRoot` (left-to-right evaluation; with the flag off the DI graph is byte-identical to today).
- The auth round-1 edit: `readCookie` in `session.guard.ts` gained `export` (contract share with the controller).
- 270/270 tests green (58 new: 10 security-headers+meta, 7 layout, 17 login/home views, 7 filter, 15 controller unit + 2 RUNTIME probe). `brain.controller.integ.spec.ts` boots the real Nest app on 127.0.0.1:0 with fetch (`redirect: manual`): proves guard -> controller-scoped filter -> HTML 303 (NOT a JSON 401), full cycle CSRF-403 -> login -> cookie -> home -> login-shortcut -> logout, `getSetCookie()` handling, `app.close()` tidy.
- Splitting lesson (owner override for the 15-min chat timeout): the round went as SIX small relays (P1 headers+meta, P2 layout, P3 login/home partials, P4 filter, P5a controller source, P5b specs+probe, P6 module+wiring) with the orchestrator doing the cross-piece API integration; two model-side path fixes (view import roots, `systemClock` from `src/common/clock`).

## M3 ROUND 3 DONE — search + reader (Oct 16, 2026)

- Tag `v1.0.11` (`c41abe7`, 16 files): `src/second-brain/search/` — `search.sql.ts` (KEYWORD_SQL/HYBRID_SQL/`HEADLINE_OPTS` with `\uE000/\uE001` markers verbatim from design 9, re-parameterized `$1/$2/$3`), `search.service.ts` (the 3-way gate: BRAIN_SEMANTIC -> stored `embed_signature` vs shared `SIGNATURE` -> embedder via `QUERY_EMBEDDER` token; failures downgrade to KEYWORD_NOTICE, signature mismatch to PAUSED_NOTICE; retry-once on P1001/P1017 with a 500 ms sleep; rows narrowed string-by-string). `src/second-brain/notes/` — `notes.repository.ts` (design 10.3: note-by-id -> `renderMarkdown` via a per-key pre-filtered resolver [NOT the naive full-set resolveWinner — a [[B]] must not resolve to c.md], `keys && $1::text[]` forward pass, backlinks where `resolveWinner` sees THIS note plus every fetched linker claiming the key [with `src_id <> $2` the self-inclusion is what makes the rule satisfiable]) and `note.view.ts`. `search.view.ts` (escape-first -> marker->`<mark>` swap, notices as meta lines, `no matches`) + the `/.hit-title/.snippet/mark` CSS tokens. Controller: `GET /brain/search` (q trim + cap 200 + empty -> 303 `/brain`) and `GET /brain/n/:id` (`^[0-9a-f]{16}$` gate -> `NotFoundException` BEFORE any query), home form now live (`autofocus` per design 8.5). Module gains `SEARCH`+reader providers and the `QUERY_EMBEDDER` factory (lazy `TransformersEmbedder.embedPassages([text]) -> rows[0]`).
- Model-side catches that shaped the code (relay bots, both accepted): the backlink self-inclusion and the per-key scoped winner filtering.
- 321/321 tests green (51 new), build clean, ASCII-checked; runtime probe extended: search `no matches` -> 303-on-empty-q -> 404 bad-hex -> note page flows through the real guard->filter->HTML pipeline.
- **`BRAIN_SEMANTIC` stays `false`** — search serves keyword-only with the notice; the hybrid path is written and tested but M4's memory gate (docker `--memory=512m`, RSS <= 420 MB) comes first.

## Next: M4 — memory gate, then `BRAIN_SEMANTIC=true`

Open with the ritual (same rules as every session):
1. `git pull --ff-only origin main` in BOTH `quiet-index` and `vasyapym-Vault` (use `/usr/bin/git`); read this handoff, then the DESIGN sections listed below (verbatim contract — quote from them, don't restate).
2. Exact anchors in `DESIGN-second-brain-v1.md`: `§8.1` routes (L425), `§8.2` auth (L438) — `BRAIN_PASSPHRASE_HASH` argon2id PHC produced by `node dist/second-brain/auth/hash-passphrase.js` (stdin, no echo), `BRAIN_SESSION_SECRET` rotation signs out sessions; `§8.3` headers (L465), `§8.4` error filter (L480), `§8.5` views (L489), `§9` search / hybrid SQL+keyword fallback (L507), `§10` reader (L558; `markdown.ts` landed in M2a, `link-keys` in M2b; §10.3 three indexed queries), `§11` privacy (L609), `§13` tests (L644), `§16` acceptance (L700). Line numbers valid at the Oct 15 file state.

Round 1 (DONE, see above): auth backend only, no UI.

Round 2 (DONE, see above): web shell — controller/filter/headers/views/module.

Round 3 (DONE, see above): search + reader all landed at `v1.0.11`.

## Owner actions — M3 go-live checklist (ONE calm window after round 3, or now to smoke-test the shell)

Round 2 already shipped the shell under the flag; nothing user-visible until the three env vars are set on Render:
1. `openssl rand -base64 48` -> value to `BRAIN_SESSION_SECRET` on Render.
2. From a clean checkout of quiet-index at v1.0.10: `npm run build && node dist/second-brain/auth/hash-passphrase.js` (type the real passphrase; prints only the PHC line) -> value to `BRAIN_PASSPHRASE_HASH` on Render.
3. Set `BRAIN_ENABLED=true` on Render (strings: exactly `true`/`false`) — keep `BRAIN_SEMANTIC=false` (M4 gate comes later).
4. Redeploy, then smoke from the phone: open `/brain/login` (dark page, no JS), sign in -> home shows the logout button and "not indexed yet" (search lands in round 3), wrong passphrase -> 401 page, back to `/brain` without cookie -> 303 back to login. UptimeRobot `/` and `/graphql` must stay green (the card path is untouched).
5. Later hygiene (unchanged): rotate the Neon owner password calmly in the same window if desired.
Optional polish queue stays parked: batched-embed "blocking" store variant; README quickstart; repo rename (only after M3 — remember workflow `repository:` field + Render check).

## House rules (unchanged)

- Explanations to the owner in simple Russian; briefs in English; pure-ASCII briefs; every line self-contained (chat model has no repo access).
- Never put vault names/paths in the public repo, committed briefs or logs; indexer logs carry counts only.
- quiet-index: validated round → commit+push pre-approved; keep commits topical; never fold unrelated files.
- luna2: graph node once per session at real wrap-up (CLI from inside `portfolio/`).

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

## GO-LIVE DONE — the brain is live (Oct 16, 2026)

- Render deploy GREEN again at `v1.0.13` (`757823a`) — the jest cap fixed the OOM; prod runs the M3 code.
- Owner set the three env vars on Render and logged in from the browser: login + home + keyword-only search all working; the `KEYWORD_NOTICE` line shows as designed.
- `v1.0.14` (`e37c63d`): the owner's browser hit the CSRF origin-gate 403 while same-Mac CLI probes with a matching Origin passed (client-side header rewriting suspected: VPN/proxy/extension). The gate is now proxy-tolerant: the origin host may match `Host` OR `X-Forwarded-Host` (first entry of a comma chain); a literal `null` Origin is treated as no claim. Cross-origin 403 unchanged (probe-verified live: no-origin 401, matching-origin 401, evil-origin 403).
- `hash-passphrase` CLI prints a stderr `passphrase: ` prompt since v1.0.13 (the silent no-echo read looked hung; stdout stays hash-only).

## Build/Deploy watch: Render free OOM (Oct 16, 2026)

- Render's Docker build OOM'd ("Over Of memory (used over 8Gi)") on v1.0.10+; the prod card stayed on the last green image meanwhile (no user-facing break).
- Root cause theory (deploy-fix shipped as `v1.0.12`, `066274f`): the Dockerfile runs `npm test` INSIDE the build stage; jest forks one ts-jest worker per CPU core, every worker carries the full type graph (prisma + nest + argon2 + transformers typings), and the M3 web rounds grew both the suite count and the per-worker graph until N workers crossed 8Gi on the Render builder. Local/CI (fewer cores, more RAM) never saw it.
- Fix: `RUN npm test -- --maxWorkers=2 --workerIdleMemoryLimit=512MB` inside the Dockerfile only; local `npm test` keeps default workers. Validated locally: 321/321 green in ~15 s with the cap.
- IF the Render build OOMs again after v1.0.12: next levers in order: (1) skip the integ probe only inside Docker (`--testPathIgnorePatterns brain.controller.integ.spec.ts` - it still runs in the vault CI), (2) `NODE_OPTIONS=--max-old-space-size=1536` in the build stage, (3) move `npm test` out of the image build entirely (design 13 needs re-litigating first). Ask for the build-log STEP attribution before picking: the OOM line in the full log names the step that died.
- Reminder: v1.0.10/v1.0.11/v1.0.12 all ship code-only while `BRAIN_ENABLED=false` on Render; the card path is unaffected by any of this.

## M4 DONE — memory gate ran, FAIL (Oct 16)

- Telemetry shipped first: `v1.0.15` (`bd6b5ee`) — `search/query-embedder.provider.ts` wraps the shared embedder web-side; ONE-OFF `brain: embedder loaded rss=<n> mb` after the first SUCCESSFUL query embed (failed loads stay silent; a later success logs; Math.ceil). 7 specs, 331/331 green. The shared class stays logging-free (the CI indexer reuses it). The line is dormant in prod until semantic search ever runs.
- Gate run (per design 7.3, all steps honored): fresh colima VM (2 CPU/4GB RAM), image built 24/24 with the pinned model sha256-verified; `docker run --memory=512m --memory-swap=512m -p 3000:3000` with the REAL Render env (`DATABASE_URL`/`DIRECT_URL`/`BRAIN_SESSION_SECRET`/`BRAIN_PASSPHRASE_HASH`, `BRAIN_ENABLED=true`) and local `BRAIN_SEMANTIC=true`. CLI login (Origin=Host), 20 searches RU/EN over the live index: 20/20 HTTP 200, **0 notices** (every search ran the hybrid path), real hits returned.
- **Verdict: FAIL.** The line read `brain: embedder loaded rss=470 mb`; cgroup steady 486 MiB of 512 (95%). Bar is 420 MB (design 7.3). The container survived all 20 searches (no OOM kill), but ~26 MB headroom is far below the required ~90 MB.
- Arena probe (host, bare transformers.js, scratch): disabling the ORT CPU memory arena does NOT help (after load 531 vs 554 MB; after 10 embeds 586 vs 545). The footprint is ORT runtime + int8 weights + inference buffers + the 17 MB tokenizer.json parse. NOTE the discrepancy: design 7.2 says "CPU memory arena disabled" but `transformers-embedder.ts` never passes `enableCpuMemArena:false` — recorded, NOT churned, because the probe shows the fix would not flip the verdict.
- Decision (design 7.3 fail path): **`BRAIN_SEMANTIC` stays `false` on Render** — keyword-only fallback A stays live; prod never had the flag on, nothing to roll back. Fallback B (Gemini embeddings) remains a separate explicit decision (content would leave GitHub and Neon).
- Teardown: container removed (background job's exit 137 was our own `docker rm -f`, not an OOM); colima deleted — `colima delete` left a stray 4.4 GB in `~/.colima`, removed manually; host disk back to ~7.5 GB free. `.env.gate` (owner-written, mode 600, REAL Render env + the plain passphrase) was DELETED after the run — recreate from the Render dashboard if the gate is ever re-run.
- If M4 is ever revisited: the lever is a re-litigated memory budget (design 7.2/13), not config tweaks; a re-run needs colima plus a ~6-7 GB host disk peak and the v1.0.15 line does the measuring.

## Next: M4 — SETTLED (see "M4 DONE" above)

Open with the ritual: `git pull --ff-only origin main` in BOTH repos (`/usr/bin/git`); read this handoff, then the DESIGN anchors for THIS stage: `§7.1-7.3` (L388-417: model identity, the in-app embedder, the gate procedure), `§15.1` (OOM risk), `§14` (memory rows), `§17` runbook. Line numbers valid at the Oct 15 file state.

The one buildable item left BEFORE the gate: the ONE-OFF RSS log line after the first embedder load — `brain: embedder loaded rss=<n> mb` (counts only; the embedder has no logging yet). The gate reads that line.

Gate procedure (design 7.3 verbatim intent):
1. `colima start` — recreates an empty VM (colima was deleted for disk space). WATCH HOST DISK: ~9 GiB free on Oct 16, the image is ~2-3 GB; free space first if tight.
2. `docker build` the production image locally.
3. `docker run --memory=512m --memory-swap=512m -p 3000:3000` with the REAL env from Render (`DATABASE_URL`/`DIRECT_URL`, `BRAIN_ENABLED=true`, `BRAIN_SESSION_SECRET`, `BRAIN_PASSPHRASE_HASH`) and LOCALLY `BRAIN_SEMANTIC=true` — the flag under test stays OFF in production until the gate passes.
4. Log in, run ~20 searches over the real index, read the RSS line.
5. PASS (steady RSS <= 420 MB): set `BRAIN_SEMANTIC=true` on Render — hybrid search goes live. FAIL: stay keyword-only (fallback A; fallback B = Gemini embeddings is a separate, explicit decision — it sends content to a provider).
6. After M4: rotate the Neon owner + `brain_indexer` passwords calmly and update Render `DATABASE_URL`/`DIRECT_URL` (plus the vault workflow secret `BRAIN_DB_URL` if rotated) — both credentials appeared in chat during M2.

Rounds 1-3 are all DONE (see above); M3 is complete and live.

## Owner actions — go-live checklist (state after Oct 16)

1. DONE: `BRAIN_ENABLED=true` + `BRAIN_SESSION_SECRET` + `BRAIN_PASSPHRASE_HASH` are set on Render; login works from the browser; keyword-only search live.
2. STILL OPEN: verify the UptimeRobot monitor on `/` is green (the card path is untouched, but the check was never confirmed by the owner).
3. CLOSED by owner decision (Oct 16): do NOT rotate the Neon owner + `brain_indexer` passwords — the chat-exposure risk is accepted as standing. Both credentials stay as-is on Render and in the vault workflow secret. Revisit only if the AI-account/chat logs themselves are ever exposed.
4. Optional polish queue stays parked: batched-embed "blocking" store variant; README quickstart; repo rename (remember workflow `repository:` field + Render check).

## House rules (unchanged)

- Explanations to the owner in simple Russian; briefs in English; pure-ASCII briefs; every line self-contained (chat model has no repo access).
- Never put vault names/paths in the public repo, committed briefs or logs; indexer logs carry counts only.
- quiet-index: validated round → commit+push pre-approved; keep commits topical; never fold unrelated files.
- luna2: graph node once per session at real wrap-up (CLI from inside `portfolio/`).

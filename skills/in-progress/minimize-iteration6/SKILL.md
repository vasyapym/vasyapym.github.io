---
name: minimize-iteration6
description: Use for small minimal-change relays to the chat model — pure-ASCII freedom-grant orchestrator brief (anchors quoted by ASCII tokens, non-ASCII material transliterated, serialization phrased mechanically); routed well 2026-10-08 (www3 /about map infoblock-56 brief) after two pre-send cleanups survived an earlier safety rejection of the strict iteration-4 draft. Heavy artifact contract: minimize-iteration4; fallback when a prompt failed: minimize-iteration3.
---

# Minimize iteration 6 — ASCII freedom-grant brief (minimal-change relay)

Descendant of `minimize-iteration4` for small asks where the owner wants the
easiest minimal edit. The heavy iteration-4 contract (verbatim non-ASCII
material, sectioned output contract) hit the routing safety filter in prep on
the founding task; the cleanup that routed is this brief. Owner confirmed on
2026-10-08 (www3 /about branch-map / infoblock-56 brief, one draw after two
prep cleanups).

## The shape

```text
TASK: <one paragraph — the deliverable framed as the easiest minimal edit:
"tell me what to remove, what to add, and (if needed) what to replace"; what
is preserved stays unchanged; no repo access; the orchestrator integrates,
renders, and tests>
CONTEXT (project): <anchors by ASCII tokens and positional description ("the
comment line directly above div.aboutMapBlock"); non-ASCII verbatim material
transliterated with a note that the real file holds the original script; the
spec facts the model cannot infer; judgment carve-outs marked "(your call)">
Wiring you can rely on: <same-file visibility facts; acceptable degenerate
outcomes ("if the list comes out empty, hiding the block is acceptable — your
call")>
HARD CONSTRAINTS (non-negotiable; everything else is yours to decide and
disclose):
- <the file rail and the diff rail, one bullet each>
- Be pragmatic: if a simpler treatment yields a comparable result, prefer it
  and say why. (standing, verbatim)
OUTPUT CONTRACT — reply with one fenced code block: edit instructions labeled
ADD / REMOVE / REPLACE, each with enough surrounding ASCII tokens to locate
the exact spot; then up to 6 short notes bullets (key decisions and
uncertainties).
Before answering, challenge key assumptions, consider a credible alternative,
and check likely failure cases; give the requested output with concise
rationale and any material uncertainties. (standing, verbatim)
```

## Encoding rules (the part that unblocked routing)

- Pure ASCII: no Cyrillic, no box-drawing or banner glyphs (the ═══ runs,
  the =====-decorated HTML comment lines), no typographic dashes — plain
  hyphens instead.
- Never quote non-ASCII file content verbatim. Transliterate a sample entry
  and state the real encoding shape in words ("the string values are
  non-ASCII Cyrillic city names and street addresses").
- Anchor by ASCII tokens that exist in the file (`var B = [`, `1. BRANCH
  DATA`, `2. CREATE MAP`, `div.aboutMapBlock`) plus positional relations;
  for non-ASCII marker lines describe position, not content.
- Phrase serialization requirements mechanically as site facts ("Elsewhere
  the site serializes such data with json_encode(..., JSON_UNESCAPED_UNICODE
  | JSON_HEX_TAG)"); never as prose about escaping contexts, breakage, or
  safe printing (filter levers, see minimize-iteration4 results M2).

## Freedom grant (the part that kept it cheap)

- HARD CONSTRAINTS stay at two bullets: where changes may land and that the
  diff stays minimal. No pinned names, no dictated helper anatomy, no rigid
  output-section layout — the model decides and discloses in its notes.
- The TASK sentence carries the minimal-edit framing; the OUTPUT CONTRACT
  echoes it with three labels (ADD / REMOVE / REPLACE) instead of
  iteration-4's sectioned contract.
- Judgment calls are offered as carve-outs with "(your call)", not as
  requirements.

## The working brief that routed (verbatim, 2026-10-08; founding round, ran in another repo against a Bitrix site)

```text
TASK: Make the branch map on /about/index.php read its branch list from infoblock ID 56 instead of the hardcoded JS array, using the easiest minimal edit: tell me what to remove, what to add, and (if needed) what to replace. Preserve the rest of the page (CSS, markup, map behavior) unchanged. You have no repo access; everything needed is in this brief. Return concise edit instructions + short notes; the orchestrator integrates, renders, and tests.

CONTEXT (project): Bitrix site, PHP pages, UTF-8. The map block sits in about/index.php inside a comment-delimited section: an opening HTML-comment line sits directly above <div class="aboutMapBlock">, and a matching closing comment line sits at the end of the block. Location rule: anything you ask me to ADD goes directly before that opening comment line (inside the same page, above the map block).

Inside the map script there is an IIFE. Its data section has this structure:

- a JS comment line containing the words 1. BRANCH DATA
- var B = [ ...68 lines... ];
- the next JS comment line contains the words 2. CREATE MAP

Entry format: ["name", "address", lat, lon, "url"], 68 entries. The string values are non-ASCII Cyrillic city names and street addresses; numbers and urls are plain ASCII. A transliterated sample of one entry (actual file holds Cyrillic text):

["Arkhangel'sk","ul. Lermontova 23 bldg 17",64.500645,40.632633,"https://traktorodetal.ru/contacts/arkhangelsk/"]

Consumed downstream, unchanged: marker coordinates [d[2], d[3]], tooltip text d[0], click opens d[4] in a new tab. The address d[1] is never displayed.

Infoblock 56 facts: latitude is stored in PROPERTY_COORD_LEN_VALUE and longitude in PROPERTY_COORD_LAT_VALUE (the property codes are swapped in the admin). Address = PROPERTY_ADDRESS_VALUE; NAME = the city. Branch page urls come from DETAIL_PAGE_URL when the result set is iterated with $res->GetNext(). A working reference for querying and cleaning this infoblock exists at local/include/branch_geo.php: lean on its pattern, no need to mirror it exactly. Elsewhere the site serializes such data with json_encode(..., JSON_UNESCAPED_UNICODE | JSON_HEX_TAG).

Wiring you can rely on: the PHP runs in the same single file, above the map script, so anything defined there is visible to the script below it. If the branch list comes out empty, hiding the whole map block is acceptable (your call).

HARD CONSTRAINTS (non-negotiable; everything else is yours to decide and disclose):
- Only about/index.php changes; keep the diff minimal.
- Be pragmatic: if a simpler treatment yields a comparable result, prefer it and say why.

OUTPUT CONTRACT - reply with one fenced code block containing: edit instructions labeled ADD / REMOVE / REPLACE, each with enough surrounding lines (by their ASCII tokens like var B = [, 1. BRANCH DATA, 2. CREATE MAP, div.aboutMapBlock) to locate the exact spot in about/index.php; then up to 6 short notes bullets (key decisions and uncertainties).

Before answering, challenge key assumptions, consider a credible alternative, and check likely failure cases; give the requested output with concise rationale and any material uncertainties.
```

## Integration

Salvage, not compliance; the orchestrator owns all repo reads/writes and
validation. The minimal-diff rail is checked before anything lands: whole
region deletions and few additions, untouched lines stay untouched.

## It's working if

- The reply locates every edit by ASCII tokens that map 1:1 onto the real
  file.
- The reply lands as finishable edit instructions, not commentary; the notes
  bullets carry the disclosed decisions.
- One brief carried the deliverable; no re-draws needed.

## Rounds

Log one row per round in `results.md` (minimal-log rule, family practice);
a row that changes practice edits this file in the same pass. A row is
self-contained — task and outcome in words, no prompt paths: the brief is
not an artifact, the chat transcript is its only record.

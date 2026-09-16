# Task brief — Quicknotes (greenfield): architecture & data-model design round

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design choice in this task: do not ask for approval, do not offer option lists. Deliberate carefully, decide, and ship one coherent design. This round is **design only — no code yet**; code rounds follow in later briefs, so the quality of this document is what everything else builds on.

## 1. Context

A single-owner personal web app, built from scratch, for fast note-taking. The owner wants it to feel instant. It will be a static front-end app (no server code) that talks directly to Firebase. It must be deployable to any static host (GitHub Pages subdirectory, Firebase Hosting, or a plain nginx directory) — so all asset references must be relative, and the app must work from any base path.

## 2. The owner's asks (verbatim, then the working interpretation)

1. *"Firebase Google Sign-in. logged in across reloads."* → Google Sign-In; the session must survive reloads without re-prompting; sign-out available.
2. *"Fast note taking. for instance, i will use it to share texts across my devices without saving it in cloud."* → The real need: small text notes synced across the owner's devices with minimal cloud footprint — personal scratch/paste buffer, not a file-hosting product. Notes are markdown text stored in Firestore (not Cloud Storage); low-latency open-type-save dominates all other UX.
3. *"Markdown (similar to obsidian note taking app)."* → Obsidian-flavoured markdown where cheap: headings, lists, checkboxes, code blocks, tables, links, `[[wiki-links]]`; a live preview alongside or toggleable over the editor.
4. *"Virtual folders to organize, navigate, and download notes."* → Folders are not real directories: a path field on each note (e.g. `journal/2026`), with a derived sidebar tree to navigate, create, rename, move notes.
5. *"Can download all the files or specific folder with one button."* → One button downloads a zip of `.md` files mirroring the folder structure; scope = all notes or one folder.
6. *"Seamless design."* → One coherent visual language, no chrome noise; feels fast on desktop and phone.
7. *"Other useful features i might have missed."* → You pick **2–4** genuinely useful v1 extras (candidates you may weigh: instant full-text search, command palette, pinning, tags, note export as single md, dark/light, keyboard shortcuts, read-only share links, end-to-end encryption with a passphrase). Choose by value-per-complexity for a single-user paste-buffer+notes tool; each pick needs a one-line rationale and a cost estimate.

## 3. Fixed points (do not redesign)

- Static app, **no build step**: plain HTML + CSS + ES-module JS. Third-party code only via CDN (`<script type="module">` / import-map imports: Firebase JS SDK modular v10+, a markdown renderer, JSZip or equivalent, optionally a hashing/uuid helper). Pin exact versions.
- Firebase is already provisioned: Google sign-in enabled, project `vasyapym-85a64`. The web config (apiKey etc.) will be pasted into a config module in a code round — don't echo keys in this document.
- Single user in practice, but Firestore rules must still scope every document by the authenticated uid.
- Notes live in Firestore with **offline persistence enabled**; the app must open to a usable state immediately from local cache (local-first), then reconcile.
- Markdown is user-authored text — rendering must be XSS-safe (sanitise or configure the renderer correctly; say exactly how).
- Must degrade gracefully: offline writes queue locally; large notes are possible but Firestore caps a document at 1 MiB — the design must state the note-size guard.

## 4. What to deliver — a numbered design document

For every decision give: the choice, a one-line rationale, and the strongest alternative you rejected. Be concrete (names, shapes), not generic. Sections:

1. **Stack & file plan** — final file list (exact relative paths, e.g. `index.html`, `styles.css`, `js/*.js`) with a one-line purpose each; the CDN dependency list with pinned versions; how modules are loaded (import map vs URLs); how the app boots before auth resolves.
2. **Firestore data model** — collection/document shapes (field names, types, defaults), how ordering uses server timestamps, what happens on first write before the server timestamp round-trips, offline persistence config, any composite indexes the queries need, per-uid rule scoping implied by the shapes.
3. **Virtual folder model** — the folder-path convention (separator, casing, root), how the tree is derived and sorted, move/rename semantics for a note and for a folder (cascading rename across notes is client-side work — describe the operation and its failure points), what "empty folder" means when folders are derived.
4. **Markdown pipeline** — renderer choice + version, the exact Obsidian-ish feature set shipped in v1, checkbox/`[[link]]` behaviour (links jump to matching note titles — note where they resolve and what happens when nothing matches), sanitisation strategy, editor/preview interaction (side-by-side vs toggle; mobile behaviour).
5. **Download** — zip generation approach (library), `all notes` vs `single folder` flows, folder layout inside the zip, filename collisions and sanitisation, memory behaviour with many/large notes, where the button lives.
6. **Auth & persistence UX** — popup vs redirect (and mobile/fallback behaviour), what the user sees signed-out, cold-start sequence (cached data before auth resolves), sign-out, session persistence mechanism, error states (popup blocked, network down).
7. **Design language** — typography (two typefaces max), palette (dark default; exact colour roles), layout skeleton (sidebar + note list + editor; how it collapses on phone), keyboard shortcuts and the instant-search/command interaction, autosave debounce and its status affordance.
8. **Chosen extra features (2–4)** — with rationale and cost as in §2.7.
9. **Edge cases & failure modes** — a list you must walk through and handle by design: ~1 MiB note guard, hundreds of notes, offline edits colliding between two devices (last-write-wins? state it), two tabs of the same app, slow first auth, deleted-folder dangling paths, empty states (no notes / no folder / search with no hits), zipping 0 notes.
10. **Owner's one-time Firebase console setup** — exact steps: enable Google provider (if not already), create Firestore, paste security rules (include the rules text), note that authorised domains must include the final host.
11. **Code-round plan** — split the implementation into **2–3** later briefs so each response stays well under ~1000 lines of output. For each round: which files, in which order, and what must already exist for that round to be testable. Round 1 must produce a runnable signed-in shell with note CRUD; state exactly why your split is safe against truncation.

## 5. Reasoning protocol (do this before writing the document)

Work through in order: (a) restate the hardest constraint in one sentence; (b) enumerate what "fast" concretely means here (cold start, keystroke latency, save round-trip) and the single biggest technical risk to it; (c) weigh real alternatives for each numbered decision before committing; (d) walk §4.9 edge cases against your design and patch the design where it fails. The self-review at the end is the evidence this happened.

## 5b. Output format

- Markdown, sections numbered 1–11 as above, plus a final section `Self-review: assumptions & risks` (3–6 bullets: what could break this design, what you assumed without owner input).
- **≤ ~1000 words total.** No code blocks except the security rules. No restating this brief.

## 6. Fixed output conventions

- Field names, file names and folder-path rules you define here become the contract for all code rounds — choose them carefully and keep them ASCII.
- If you believe an owner ask is internally contradictory (e.g. §2.2 "without saving it in cloud" vs cross-device sync), resolve it in one line under the relevant section and move on — no meta-commentary.

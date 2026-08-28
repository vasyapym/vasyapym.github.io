# Handoff — grill session: hero "zeitgeist" direction settled + mobile reveal bug root-caused (Pass 31 pending)

Date: 2026-08-28 · Branch: `main` (Pass 30 committed and pushed) · Next session: chat model returns the Pass 31 response → integrate → verify → deliver.

## State in one paragraph

The owner rejected the Pass 30 curl-noise filings hero ("conceptually not it, no design taste, not in the zeitgeist") and ordered a replacement plus a fix for the card scroll-reveal on mobile. A `/grill-me` session (2 rounds, settled 2026-08-28) fixed the direction: **type-led hero** — giant display typography as the main object (kinetic entrance, ambient life, subtle pointer/scroll response), Canvas2D demoted to a quiet texture layer that must stay self-driven on mobile; font **Unbounded** (Google Fonts, variable 200–900) for the hero only; palette may gain 1–2 colors; texts' meaning + beneath catalog stay, CTA may be cut; **one final hero from the chat model** (no drafts route); curl-noise filings deleted outright. Taste bar in owner words: "bold feeling but minimalistic", "senior frontend designer page". Only reference: helloclaude.ru (muse-spark dropped — no VPN). A self-contained brief was written to **`C:\Users\v.argunov\Desktop\agent2\chat-model-brief.md`** (outside the repo; overwrites the previous brief by convention). Decision recorded as graph node **n68** (continues n67).

## Mobile reveal bug — root cause (do not re-derive)

Reproduced in headless Chromium mobile emulation (390×844 dpr3, `isMobile`): after an `instant` scroll jump of +1400px (touch-flick analogue), the card landing **straddling the viewport top** (`top: -2px`, ~380px visible) received **no IntersectionObserver entry whatsoever** — the wrapped-IO log shows entries for `explosion` only; the straddler sat in view >1s and never revealed (`visibility: hidden`), then a second flick pushed it above the viewport **permanently hidden**. Cards fully inside the viewport after the same jump (planck, practice-map) revealed fine. Conclusion: Chromium IO can miss crossing deliveries for jump-scrolled straddlers — IO alone is not a safe reveal mechanism on touch. **Fix requirement in the brief:** rAF-throttled scroll-position math as the source of truth (6 cards, cheap), IO optional as optimization; guarantee = no card invisible while any part is in view, any velocity/order/restoration/deep-link. Plus mobile tuning: earlier band (~94%vh on coarse pointers), shorter wipe (~520ms, stagger ~70ms).

Probe method (session temp, reusable idea): `evaluateOnNewDocument` wraps `window.IntersectionObserver`, logs every `observe/unobserve/entries` with `dataset.projectReveal`, `isIntersecting`, `boundingClientRect.top`; then two `scrollTo({behavior:"instant"})` jumps with card-state snapshots. Keep this trick for verifying the fix.

## Direction / graph pointers

- `n68` — the settled decision (this session, actor design-iteration).
- `n66` — Pass 30 iteration node (filings hero + plotter reveal), `n67` — its commit node.
- Ledger: Pass 30 summary lives in git history (`b9253ba feat(shell): plotter draw-in card reveal, self-driven curl-noise flow hero`); no portfolio-redesign-handoff entry was added for Pass 30 — add one when Pass 31 lands if the ledger convention resumes.

## Working tree

- Committed & pushed to `origin/main`: `b9253ba` (Pass 30) + `33f88c2` (`chore(graph): record b9253ba`, includes auto-recorded `n67`).
- Uncommitted (this session): `portfolio/.project-history/graph.jsonl` (n68 + e73) and this handoff file. Commit them with the Pass 31 integration or on the owner's next explicit delivery ask.
- Not mine, do not touch or commit: `portfolio/projects/explosion/tests/explosion.probe.mjs` (another agent's, untracked).

## Next session checklist (integration)

1. Take the chat model's response (answer to `chat-model-brief.md`) and apply it: new hero component file(s), `LandingPage.tsx` diffs (import, hero JSX, caption, replaced reveal effect), `index.html` fonts link (Unbounded), `styles.css` diffs. Delete `portfolio/shell/src/shell/HeroField.tsx`.
2. Watch for the known traps from the brief: variable-font axis animation on the giant headline (layout thrash — should be transform/opacity or stepped, small elements); split-text a11y (`aria-hidden` spans + accessible full text); `--hero-exit` must keep working; card hover systems (`::before` hairline z1, `::after` bloom z-1, `@property --card-wash`, `--mx/--my`) untouched; hidden states only under `no-preference` + `.signal-index-reveal-ready`.
3. Verify: `npm.cmd run typecheck` + `npm.cmd run build` in `portfolio/`; headless probe suite (desktop 1440×900, mobile 390×844 dpr3, 320×568, reduced-motion) — zero errors/overflow, hero alive with no input on both, `--hero-exit` fade, **fast-flick: no card left unrevealed while visible**, deep-link + beneath-row scroll targets revealed on arrival, reduced = static hero + fully visible cards.
4. Eyeball screenshots, then ask the owner before committing (delivery is explicit-only).

## How to run / verify on Windows

```powershell
# dev server (npm run dev swallows --port through the workspace call):
node node_modules\vite\bin\vite.js --port 5178 --strictPort   # cwd: portfolio/shell
npm.cmd run typecheck    # cwd: portfolio/
npm.cmd run build        # cwd: portfolio/ (npm.ps1 blocked by execution policy — use npm.cmd)
```

Probes: puppeteer-core (in `portfolio/node_modules`) + `msedge.exe` at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (chrome.exe also present). Launch headless, script in `portfolio/shell/*.tmp.mjs` so module resolution finds puppeteer-core, delete after. IO-logging wrapper via `evaluateOnNewDocument` (see above) is the tool for any reveal regression.

## Open threads / next steps

1. The chat-model brief is **not yet sent** — the owner pastes it to the chat model and brings the answer back.
2. Owner said their phone's hero is NOT static ("display is just small") — so no reduce-motion complication on their device; mobile liveness remains a hard requirement anyway.
3. If the type-led result still misses the bar, next escalation is a drafts route (3 concepts) — owner preferred one-final this round; re-offer drafts only if this pass fails.
4. `docs/portfolio-redesign-handoff.md` ledger: backfill Pass 30/31 entries if the owner wants the ledger continuity restored.

## Suggested skills

- `/code-iteration` — for the integration + verification pass.
- `/design-iteration` — for the owner's visual verdict round after integration.
- `/grill-me` — done for this pass (n68); re-run only if scope changes.

## House rules worth repeating

- Explain code/technical changes in simple Russian; the owner is learning (beginner-friendly depth).
- Append a graph node whenever a session settles something — portfolio shell work → `portfolio/.project-history/graph.jsonl`, CLI at repo-root `scripts/project-graph/bin/project-graph.js` (run from `portfolio/`, flags like `--artifact key=value`).
- Several agents share this working tree: check `git status`, stage only your own paths; delivery (commit/push) only on explicit owner request; `git config core.hooksPath .githooks` is armed — commits auto-record graph nodes.

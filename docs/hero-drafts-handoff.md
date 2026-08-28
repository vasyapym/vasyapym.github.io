# Handoff — Pass 31 verdict: owner says the type-led hero is "not it" → drafts route is the next hero attempt

Date: 2026-08-28 · Branch: `main` · Pass 31 committed as `ec6991d` (`feat(shell): type-led Unbounded hero, scroll-math card reveal (Pass 31)`) and pushed. Graph: `n69` (integration) → `n70` (auto commit node) → `n71` (the verdict below).

## The verdict

- The owner looked at the shipped Pass 31 hero and ruled: **"this is not it"**. The type-led Unbounded direction (giant three-line headline + breathing amp + quiet dot-field texture) does **not** meet the taste bar. That is two consecutive hero rejections: Pass 30 (curl-noise filings — "conceptually not it, no design taste, not in the zeitgeist") and now Pass 31.
- Per the escalation agreed in `n68`: **the next attempt is the drafts route — three distinct hero concepts** for the owner to choose from, not another single final.

## What survives regardless of the next hero

- **The mobile card-reveal fix is infrastructure, keep it.** The source of truth is now a rAF-throttled scroll/resize `getBoundingClientRect` sweep (band 94%vh coarse / 88% fine, stagger 70/90ms), IO demoted to a bonus trigger. Verified: fast-flick jumps, the straddler at `top:-2px`, a second flick past it, beneath-row clicks and `#project-explosion` deep links — nothing stays hidden. Any new hero must not regress this.
- `--hero-exit` scroll-fade machinery (JS listener + CSS `opacity: calc(1 - var(--hero-exit, 0))`) — keep the contract, retune at will.
- Card grid visuals + hover systems (`::before` hairline, `::after` bloom, `@property --card-wash`, `--mx/--my`) — owner liked them; untouched by hero work.
- Probe toolbox (below) is reusable as-is.

## What is rejected / open questions for the drafts

- The whole type-led composition is rejected. `HeroTexture.tsx` (dot-field canvas) and the Unbounded headline markup/styles are still in the tree as the current landing hero — they will be replaced by the drafts winner.
- Open: whether **Unbounded** (font `<link>`, `--unbounded` token) and `--ink-accent-deep` stay in the palette for the drafts, or get removed with the direction. Owner never approved them beyond that one attempt — decide per draft, flag in the drafts route.
- Standing constraints (unchanged, from `n68` / the brief): zero dependencies, Canvas2D only, no WebGL, no blur/fog, DOM motion = transform/opacity, reduce-motion + no-JS never hide content, beneath catalogue + identity header untouched, hero must be **alive with zero input on mobile**, no overflow at 320px+, copy top ≥ 84px at 320×568, catalogue rows ≥ 44px.

## Next session checklist (drafts route)

1. Build **3 hero concept drafts**, each self-contained, behind the design-directions route (pattern: `portfolio/shell/src/design-directions/*Drafts.tsx` + matching css, registered in `DesignDirections.tsx`). Distinct directions — not three variations of giant lowercase type, since that just failed twice in a row.
2. Screenshots of each draft (desktop 1440 + mobile 390), owner picks one, then implement it as the landing hero (replace `HeroTexture.tsx` + hero JSX + hero CSS blocks; keep the reveal fix).
3. `/design-planning` for comparing the alternatives before building; `/code-iteration` for the implementation pass.

## How to run / verify on Windows (updated)

```powershell
# dev server — NOTE: vite is hoisted to portfolio/node_modules (the old shell-relative
# path in the previous handoff fails with MODULE_NOT_FOUND):
node ..\node_modules\vite\bin\vite.js --port 5199 --strictPort   # cwd: portfolio/shell
npm.cmd run typecheck    # cwd: portfolio/
npm.cmd run build        # cwd: portfolio/ (npm.ps1 blocked — use npm.cmd)
```

- Probes: puppeteer-core (in `portfolio/node_modules`) + `msedge.exe` at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, script in `portfolio/shell/*.tmp.mjs`, delete after. Matrix used in Pass 31: desktop 1440×900, mobile 390×844 dpr3 `isMobile`, 320×568, `prefers-reduced-motion` via `emulateMediaFeatures`. Checks that caught real bugs: headline fit (`.signal-index-hero-line` inner `scrollWidth` vs `clientWidth` — grid tracks grow to min-content, so clip at the container hides overflow from `documentElement.scrollWidth`), canvas liveness via two `toDataURL` snaps, fast-flick + straddler geometry, deep-link load.
- Headline fit lesson for any drafts with big type: the ink-shell is `min(100% - 72px, 1280px)` but only **32px total on ≤560px** (`.signal-index-shell` mobile override at styles.css ~1530) — size display type from the real available width.

## Housekeeping

- Delivery was explicit this session: `ec6991d` + a `chore(graph)` follow-up, pushed to `origin/main`. The other agent's untracked `portfolio/projects/explosion/tests/explosion.probe.mjs` was left alone.
- `docs/portfolio-redesign-handoff.md` ledger still has no Pass 30/31 entries — backfill only if the owner wants ledger continuity restored.
- `docs/hero-zeitgeist-handoff.md` (Pass 31 setup) is now historical: its checklist is done except the outcome is rejection.

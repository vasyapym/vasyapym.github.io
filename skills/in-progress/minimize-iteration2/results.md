# Routing experiment log

One line per round: `date | axis | pair (A/B) | endpoint | rounds | verdict | evidence`.

Verdict definitions must be fixed before the first run of each axis (see SKILL.md protocol step 3).

| date | axis | pair | endpoint | rounds | verdict | evidence |
|------|------|------|----------|--------|---------|----------|

## Pre-registered: H1 on lesson task (2026-09-21)

Task: relay prompt for Practice Map lesson 015 «событийно-ориентированная архитектура» (pub/sub, message queues, event sourcing). Real task — winning reply becomes the lesson.

- A = human register (full sentences, first person), B = telegraphic (pipeline template style). Same facts, ±10% length, same opener `comprehensive code - `, same endpoint (randomized routing chat model).
- Per-round scoring, fixed now: (1) contract adherence — longform Russian essay, dual audience, mechanisms w/ internal state + causality + prediction + diagnostics, max length; (2) integration repair count — salvages/fixes needed; (3) weak-route markers — asks questions instead of deciding, drops contract, clichés.
- **H1 confirmed** if A wins ≥4/6 rounds on these proxies, or relay identity echo (when present) shows stronger model on A in ≥4/6.
- **Refuted** if B wins ≥4/6 or 6 rounds show no consistent difference. **Inconclusive** if 3/3 split with no echo.
- Order: A B A B A B (position bias killed). Confounder hold: length ±10%, endpoint fixed, output contract identical prose in both arms.
| 2026-09-21 | H1 | prose-vs-telegraphic | randomized router | 0 | blocked (pre-run) | human register inflates identical facts 427→638 words (+49%); ±10% unholdable on formula-dense briefs — axis needs a prose-native task |
| 2026-09-21 | H2 | armP vs bare | randomized router | 0 (bare arm ×2, P never run) | incomplete | same bare brief drew two different models across draws (owner-echoed "smartest", "good") — endpoint variance confirmed; run-1 class salvaged into R004 |

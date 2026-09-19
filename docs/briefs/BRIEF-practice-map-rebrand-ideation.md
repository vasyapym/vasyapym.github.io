# Task brief — Practice Map rebrand: name + illustration ideation (10 code directions)

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists back to the orchestrator. Deliberate in `## Reasoning` before writing any code — depth beats speed; the reasoning section is your workspace, work through §4 before building anything.

## 0. Where this comes from (context you cannot infer)

A live page in a dark-ink developer portfolio was built under the name **"Practice Map"**. It has since grown into three things the name no longer describes:

1. **An archive of AI outputs** — 29 lessons on engineering and film-studies subjects, each generated in collaboration with a named AI model. The information architecture is a **tier list by model**: `astra-6-max` (2 lessons), `fable-5.1-high` (4), `astra-6-medium` (2), `fable-5.1-low` (1), `opus-4.8-thinking` (20 lessons in five volumes: "vol 01 — first contact", "vol 02 — permissions & users", …). The owner reads what a model produced, judges it, and keeps what holds up. The archive *is* the product's substance — which model made what, at what band (max / high / medium / low / thinking).
2. **An experimental lesson space** — a deep-lesson reader: sectioned long-form lessons, scroll progress, per-lesson concept graphs (a curriculum rendered as a system of linked concepts), and a free-reading surface where the prose becomes an editable note space. Reading is active, not passive.
3. **An open-ended AI playground** — a ⌘K palette that jumps anywhere, search across lessons, tier/volume navigation.

Local-only: notes and progress persist in localStorage; no account, no backend.

Current naming shell you are replacing: title "Practice Map", tag "map", eyebrow "A working map for technical practice", hero copy "archive of ai outputs / teaching concepts.", landing-card artwork "terraced climb to a lit summit", note "Practice route".

The owner's verdicts driving this task: the name no longer represents the scope; the hero feels **inert** — no illustration, no energy; the rebranding must make the page land with intent.

## 1. Your deliverables (one message, two artifacts)

**(A) Names.** A shortlist of 5 replacement names. Lowercase, 1–2 words, real English words. They must truthfully cover the three identities — archive of model outputs, experimental lesson space, playground — or take a strong, arguable position on which identity dominates. The incumbent map/route/summit metaphor is not banned outright, but a direction that keeps it must argue why the metaphor survives the scope change; "a different kind of map" alone will not survive.

**(B) Ten illustration directions, as code.** Ten distinct visual/conceptual directions for the main page illustration. Each is delivered as a complete, runnable single-file HTML artifact the owner will open, look at, and pick from. The orchestrator owns everything after the pick: design-language adaptation, placement details, final polish. Your job is range and honesty — ten directions that are genuinely different from each other, each with a defensible thesis.

## 2. Code contract (every direction, no exceptions)

- **One self-contained `.html` file.** Zero dependencies, no CDN, no fetch, no external fonts (system font stack is fine). Runs by double-click from `file://`.
- **Near-black ink background** (`#0b1317` family). The owner judges each direction in context — the page it will live in is dark ink with warm paper text (`#eeeae0`), ochre accents (`#d39b61`, `#e8b57c`, `#b97f45`), hairline borders, lowercase mono chrome, IBM Plex display type. You do NOT need to match those tokens exactly — you own each direction's palette — but a direction that cannot live on near-black is wasted.
- **Default home is the hero band**: a full-width strip, roughly 1200×220–260 at desktop, one narrow column at 390. Compose so the direction survives that aspect. If a direction fundamentally needs full-bleed or a different placement, say so in its thesis line — the orchestrator adapts.
- **First frame must already read.** Motion is allowed (subtle), but a static screenshot of frame one must sell the direction on its own.
- **≤80 lines each** (hard cap 100). Terse code, no comments. Plain HTML/CSS/JS — TypeScript is not needed.
- Include `<meta viewport>`; must render correctly at both 1200×400 and 390×500.
- Ten genuinely distinct directions — no near-duplicates dressed as variety.

## 3. Bans and pressures (taste history the owner has already settled)

Rejected on this portfolio before, and they carry here: **photorealistic rendering** (geeky renders only — terminal, dither, pixel, flat schematic, vector are the accepted language), **try-hard conceptual imagery** that means nothing, **decorative subjects unconnected to the substance**. Generic "AI" garnish is dead on arrival: circuit brains, sparkles, purple gradients, robot heads. The substance is: models as tiers, outputs as artifacts, concepts as a system, reading as a practice. What the illustration must NOT do is decorate — it must make one of the three identities visible at a glance.

## 4. Method — deliberate before you build (required)

Produce `## Reasoning` first, in this order:

1. **Hold the product** — restate the three identities in your own words without copying the phrasing above, and the one sentence the name + illustration must make true.
2. **Tensions** — name the real tensions (archive vs playground; system-map vocabulary already owned by the concept graphs; "AI" is the substance, not the garnish; lowercase mono register; the inert-hero complaint is about energy, not just emptiness).
3. **Divergent sweep** — ≥30 raw one-line ideas, numbered, terse, no self-censoring.
4. **Prune** — name your criteria; cut to 10; one line per cut batch saying what died and why.
5. **Build** the 10 as code, then self-critique each in one line (what could read as cheap or fake?).

There is no approval gate and no option list to offer: pick, justify, ship.

## 5. Output contract (exactly this shape)

```
## Reasoning
<per §4: hold-the-product, tensions, ≥30-line sweep, prune log>

## Names
- <name> — <one-line rationale>
(5 entries; mark the strongest with ←)

## Directions
### 1. <direction-name> — <one-line thesis>
```html
<complete single-file code>
```
- carries: <one line — which product truth it makes visible>
- name pairing: <1–2 candidates from the Names section>
- avoids: <one line — the cliché or failure mode it specifically dodges>

### 2. … (×10)

## Self-review
<one line per direction: does it run standalone from file://, read at first frame, and hold at 390?>

## Notes
<optional, ≤5 lines: out-of-scope observations only>
```

Rules: no code outside the fenced `html` blocks; no approval-seeking language anywhere; every direction's code block is complete and runnable.

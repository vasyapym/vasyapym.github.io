# CONCEPT — "Gemstones" (project cards, round 3)

Received from the chat model against `BRIEF-card-concept-redesign.md`. Owner advanced it to implementation — verbatim record below.

---

## 1. Direction

"Gemstones" — Each project becomes a single luminous, chunky glyph resting in its own softly-lit gem-panel, like the glossy mascot-blobs of the GitHub hero brought down to catalogue scale. The cards trade the hero's flat dithered restraint for real mass, gloss, and saturated per-project colour — bold and cheerful, but small and disciplined in footprint. Six gems in a tidy two-up grid: confident objects, not diagrams.

## 2. Layout & sizing spec

Container: existing 1280px column, centred. 32px top padding off the beneath-rail.
Desktop (≥900w): CSS Grid, `grid-template-columns: repeat(2, 1fr)`, `gap: 24px`. 3 rows × 2 = six cards. Each card ~360px tall, ~624px wide.
Card interior: vertical split. Art stage on top: 200px fixed height, full card width, own gem background. Copy block below: ~160px, 24px padding.
Copy order (top→bottom): compact topline · title · description · footer.
Topline (mono, 12px, ochre `#d39b61`): `01 · distributed systems` — index + category only. Tech list is demoted to the footer as a single wrapping mono row at 11px, muted cream `#8c928e`, joined by `·`, capped visually to two lines (6 items fit). This removes the old right-aligned tech column entirely.
Title: IBM Plex Sans 700, `clamp(20px, 1.6vw, 24px)`, cream.
Description: Plex Sans 400, 14px/1.5, `#c9c5bb`, clamp to 2 lines.
Footer: tech row (left) + `open ↗` (right, mono, ochre).
Mobile (≤899w): single column, 16px side margins (card ~358px @390w; ~288px @320w — no overflow). Art stage 150px, copy auto. Card ~300px tall. `gap: 16px`.
Rhythm: 24px desktop / 16px mobile gutters everywhere; 8px between title/description; consistent 24px card padding. Six cards total ~1.2 viewports desktop — compact by design.

## 3. Illustration style guide

Family rules (all inline SVG, 260×160 viewBox, aria-hidden):
- Technique: 3–6 chunky rounded shapes per subject, thick (never thin lines). Fills use `<radialGradient>` for glossy top-light (light stop top-left → hue mid → darker hue bottom). One small elliptical highlight per subject.
- Glow (no blur filters): simulated by 1–2 concentric hue shapes at low opacity (0.25 → 0.12) sitting behind the subject — layered halos, not `feGaussianBlur`.
- Shape language: superellipse/rounded, high mass, generous negative space. Max 6 elements. No text inside art.
- Palette system: shared lifted panel ground `#0f1b20` (a touch brighter than the hero) with a per-project accent hue; subject sits in its hue, ochre `#e8b57c` used only as shared secondary pop.

| # | Project | Instant subject | Accent hue |
| --- | --------- | ----------------- | ----------- |
| 1 | Raft Cluster | 5 rounded nodes ringed around a crowned "leader" node, thick links radiating out (system topology) | electric coral `#ff6a5f` |
| 2 | Cat Runner | Chunky cat glyph mid-leap with 3 speed-streak bars | candy pink `#ff8fbf` |
| 3 | Evening Forest | 3 stacked rounded dusk-trees on a gentle path curve | forest teal-green `#4fd1a5` |
| 4 | Explosion | Split sphere throwing ~8 chunky shards outward | molten amber `#ffb347` |
| 5 | Planck to Now | Bright core orb + one arc timeline with a scrubber dot | cosmic violet `#a98cff` |
| 6 | Practice Map | Cluster of rounded map-pins over a 3×3 tile grid | sky blue `#5cc8ff` |

Raft's crowned-leader-plus-topology reads as system design at a glance — the standing requirement — and coral is a warm hue, honouring the ledger's rejection of all cool Raft identities.

## 4. Motion spec

- **Idle ("alive"):** subject group `transform: translateY` breathe, `@keyframes` ±3px over 4s ease-in-out; each card offset by index × 0.4s. Leader-node halo (Raft) and orb glow (Planck) pulse opacity 0.12→0.25 on the same clock. Pure transform/opacity — cheap, 60fps.
- **Hover/focus:** card `translateY(-6px)`, panel ground brightens 4%, accent halo opacity +0.1, `open ↗` shifts +3px right. Subject gains slight pointer-parallax via existing CSS-var tilt (max 6° — retained, since it's cheap and on-brand). `:focus-visible` = 2px ochre outline, 3px offset, same lift. 180ms ease-out.
- **Scroll reveal:** keep rAF scroll-position source of truth + reveal-band + stagger. Cards start `opacity:0; translateY(24px)`, animate to `opacity:1; translateY(0)` as they cross the band, staggered 60ms by index. No IntersectionObserver.
- **Reduced motion (`prefers-reduced-motion: reduce`):** all idle/reveal animation off; cards render fully visible at final state via CSS, independent of JS. Hover reduces to a colour shift only, no transform. Nothing ever hidden.

## 5. Deliberate deviations from the hero

- **Brighter, saturated colour** — the hero is monochrome ink/ochre; the gems are openly polychrome. Chosen because the brief demands "simple, bright, bold," and the ledger's lesson is that hero-matching hurt past attempts.
- **Gloss & mass over dither** — radial-gradient glossy solids replace ordered-dither flatness; the cards are the playful counterweight to the serious hero.
- **Panel ground lifted to `#0f1b20`** (vs `#0b1317`) so gems read as objects on a stage, not dissolved into the field.
- **Kept, to stay "at home":** IBM Plex Sans/Mono, ochre meta accent, film grain, mono topline, the ↗ affordance, 1280 column.

## 6. Alternates rejected

- **Full-bleed single-column redux with larger art** — resurrects the "oversized" footprint the owner explicitly killed; six tall rows bloat the page.
- **Three-column grid** — shrinks each gem below the mass threshold at 1440w, making the bold GitHub-style subjects read as tiny icons and cramping the six-item tech rows.

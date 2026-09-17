# Task brief — Quicknotes card mark: re-language the illustration to the house ink style

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design choice within the fixed points: do not ask for approval, do not offer option lists — deliberate, decide, and ship one coherent answer.

## 1. Context

A developer portfolio's landing page shows a catalogue of project cards. Each card carries a hand-drawn "ink mechanism" illustration (React SVG component, viewBox `0 0 260 160`, rendered ~213px wide on a `#0b1317` canvas). An eighth card was just added — "Quicknotes", a local-first markdown notes app. Its illustration reads fine in isolation but is written in a foreign style: it looks like a flat app-icon set pasted into an ink-drawn catalogue. The owner asks for one thing: **make it belong** — a stranger shown all eight cards must place quicknotes among them without reading its title.

## 2. Current illustration (verbatim, to be replaced)

```tsx
function QuicknotesCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      {/* scattered scratchpad tiles behind the open note */}
      <rect x="52" y="34" width="52" height="66" rx="4" fill="#16161e" stroke="#3b4261" strokeWidth="1.5" transform="rotate(-7 78 67)" />
      <rect x="158" y="40" width="52" height="66" rx="4" fill="#16161e" stroke="#3b4261" strokeWidth="1.5" transform="rotate(6 184 73)" />
      {/* the open note, dog-eared, with the accent fold */}
      <rect x="96" y="22" width="70" height="92" rx="5" fill="#16161e" stroke="#8b919c" strokeWidth="2" />
      <path d="M138 22v26h28" fill="none" stroke="#7aa2f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="108" y1="46" x2="136" y2="46" stroke="#3b4261" strokeWidth="2" />
      <line x1="108" y1="62" x2="152" y2="62" stroke="#3b4261" strokeWidth="2" opacity="0.7" />
      <line x1="108" y1="78" x2="146" y2="78" stroke="#3b4261" strokeWidth="2" opacity="0.7" />
      <line x1="108" y1="94" x2="120" y2="94" stroke="#7aa2f7" strokeWidth="2.5" />
      {/* the folder tray the note drops into */}
      <path d="M84 132h94l-7 16H91Z" fill="none" stroke="#3b4261" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
```

## 3. The house ink language (observed on the rendered catalogue)

- **The bed**: every illustration sits on a soft ellipse of halftone dots (dim, low-opacity `<pattern>` of small circles) that fades toward the edges — the "mechanism on a dotted bed" feel.
- **Filled, not hollow**: shapes are dark slate fills (`#26333b`, `#465059`, `#1c262d`) carrying pale bone or steel borders (`#b6ac95`, `#7b93b3`, `#7d7669`). Outlines-without-fills read as foreign.
- **Spot ink**: one or two shapes carry a dotted `<pattern>` fill of their own; some slots wait as **dashes** (`strokeDasharray="4 4"` or `1 4`) — absence and pending state are drawn, not implied.
- **One story**: each card depicts a mechanical state with a direction — a crowned element, a keyed replacement rotating into a dashed slot, a stage register being shifted. Registration ticks and small connector lines carry the story.
- **Accent discipline**: one accent per card, muted — steel blue `#7b93b3`, bone `#b6ac95`, coral for the red card. Strokes 1.5–2.5, rounded joins, occasional slight rotation (a few degrees) for hand-set feel.
- **Never**: neon saturated hues, uniform outline-only geometry, drop shadows, gradients.

## 4. Fixed points (do not redesign)

- The **motif must survive**: an open dog-eared note with a text-cursor line, dropping into a folder tray. The notes/folders story is the product.
- viewBox `0 0 260 160`; canvas transparent (the card supplies `#0b1317`); component is a plain React SVG with no props.
- The app's identity color is `#7aa2f7` — you may keep a whisper of it as the accent, or move to the house steel `#7b93b3`; either is acceptable, choose deliberately.
- It must read at ~213px wide: no strokes thinner than 1.5, no detail smaller than ~3px features.
- Text: none inside the SVG (existing cards carry no lettering).

## 5. Reasoning protocol (before writing the component)

(a) Re-state the gap in one sentence from §3; (b) enumerate which house devices you will adopt (bed, fills, dashes, spot ink, ticks) and how each maps onto the note/tray motif; (c) decide the accent question in §4 deliberately; (d) compose the one story the picture tells (what is settled, what is pending, where the eye lands); (e) self-check: does it read at small size, is there exactly one accent, does anything stay hollow/outlined?

## 6. Output contract

- One fenced `tsx` code block: the complete `function QuicknotesCenterMark() { … }` replacement, inline patterns/defs allowed, no imports, no CSS additions, no prose beyond one-line comments inside the JSX.
- **≤ ~45 lines of JSX.** No explanation outside the code block except a final line: `Self-review: <one sentence>`.

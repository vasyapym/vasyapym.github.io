# S2 round replies — verbatim evidence

## Round 1 — Arm A (agent telegraphic), 2026-09-22

Owner report on delivery: "this worked great". Echo: none shown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160">
  <!-- 01 · backbone: one curved main axis, items hanging off it as ribs -->
  <g fill="none" stroke="#111" stroke-linecap="round">
    <path d="M122 16 C165 45 95 115 138 144" stroke-width="18"/>
    <path d="M136 38 H200 M134 65 H60 M126 95 H176 M124 122 H84" stroke-width="14"/>
  </g>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160">
  <!-- 02 · flex-wrap: a single continuous stroke that wraps like text -->
  <path d="M30 36 H188 A22 22 0 0 1 188 80 H72 A22 22 0 0 0 72 124 H198"
        fill="none" stroke="#111" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="194,102 234,124 194,146" fill="#111"/>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160">
  <!-- 03 · hash: two grid lines crossing two grid lines, one cell claimed -->
  <path d="M100 16 V144 M160 16 V144 M40 56 H220 M40 104 H220"
        fill="none" stroke="#111" stroke-width="16" stroke-linecap="square"/>
  <rect x="108" y="64" width="44" height="32" fill="#111"/>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160">
  <!-- 04 · snap: a tilted element mid-drag, corner bracket waiting to catch it -->
  <path d="M36 56 V140 H128" fill="none" stroke="#111" stroke-width="16" stroke-linecap="square" stroke-linejoin="miter"/>
  <rect x="-32" y="-32" width="64" height="64" transform="translate(168 62) rotate(12)"
        fill="none" stroke="#111" stroke-width="14" stroke-linejoin="miter"/>
  <polygon points="0,0 0,44 12,34 20,54 29,50 21,31 36,31" transform="translate(170 60)" fill="#111"/>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160">
  <!-- 05 · grow: a solid block being pulled out from its corner -->
  <rect x="44" y="40" width="120" height="80" fill="#111"/>
  <line x1="140" y1="96" x2="208" y2="136" stroke="#111" stroke-width="16"/>
  <polygon points="232,150 199,151.5 217,120.5" fill="#111"/>
</svg>
```

Scoring: usable 5/5 (backbone, flex-wrap, hash, snap, grow — each one bold
gesture, no banned trait, salvageable); weak-route markers 0; banned
violations 0; contract exact (5 fenced svg, viewBox on all, <=15 lines each).

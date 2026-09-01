import { useRef, type CSSProperties, type PointerEvent, type ReactElement } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectCenter } from "../../../contracts/project-presentation";

type ProjectArtworkProps = { project: ProjectModule };

// Carry each gem-halo shape's true base opacity so the CSS hover-brighten
// (calc(var(--halo-opacity, 0.2) + 0.1)) is additive from that base, not 0.2.
const haloVar = (base: number): CSSProperties =>
  ({ "--halo-opacity": base } as unknown as CSSProperties);

export default function ProjectArtwork({ project }: ProjectArtworkProps) {
  const objectRef = useRef<HTMLDivElement>(null);
  const presentation = project.presentation;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !objectRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", `${y * -6}deg`);
    objectStyle.setProperty("--art-rotate-y", `${x * 6}deg`);
    objectStyle.setProperty("--art-shift-x", `${x * 8}px`);
    objectStyle.setProperty("--art-shift-y", `${y * 6}px`);
  };

  const resetPointer = () => {
    if (!objectRef.current) return;
    const objectStyle = objectRef.current.style;
    objectStyle.setProperty("--art-rotate-x", "0deg");
    objectStyle.setProperty("--art-rotate-y", "0deg");
    objectStyle.setProperty("--art-shift-x", "0px");
    objectStyle.setProperty("--art-shift-y", "0px");
  };

  return (
    <div
      className={`project-artwork ${presentation.className} artwork-motion-${presentation.motion}`}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <div ref={objectRef} className="project-artwork-object">
        <span className={`project-artwork-center center-${presentation.centerMark}`}>
          <CenterMark mark={presentation.centerMark} label={presentation.centerLabel} />
        </span>
      </div>
    </div>
  );
}

const CENTER_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  raft: RaftCenterMark,
  kitty: KittyCenterMark,
  fox: FoxCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  trail: TrailCenterMark,
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) return <>{label}</>;
  return <Component />;
}

/* ── 1 · Raft Cluster — electric coral #ff6a5f ── */
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-raft-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6a5f" />
          <stop offset="55%" stopColor="#ff6a5f" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff6a5f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-raft-node" cx="34%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffd0c2" />
          <stop offset="47%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#7d2723" />
        </radialGradient>
        <radialGradient id="gem-raft-leader" cx="34%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffe0d2" />
          <stop offset="47%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#8f2b28" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="130" cy="80" rx="104" ry="66" fill="url(#gem-raft-glow)" opacity="0.16" />
      <ellipse cx="130" cy="70" rx="60" ry="44" fill="url(#gem-raft-glow)" opacity="0.1" />
      <path d="M 130 30 L 176 63 L 158 117 L 102 117 L 84 63 Z" stroke="#ff9d8f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <circle cx="176" cy="63" r="14" fill="url(#gem-raft-node)" />
      <circle cx="158" cy="117" r="14" fill="url(#gem-raft-node)" />
      <circle cx="102" cy="117" r="14" fill="url(#gem-raft-node)" />
      <circle cx="84" cy="63" r="14" fill="url(#gem-raft-node)" />
      <circle cx="130" cy="30" r="20" fill="none" stroke="#ffb1a6" strokeWidth="4" opacity="0.9" />
      <circle cx="130" cy="30" r="15" fill="url(#gem-raft-leader)" />
      <g fill="#e8b57c">
        <rect x="169" y="52" width="3" height="7" rx="1.5" />
        <rect x="176" y="52" width="3" height="7" rx="1.5" />
      </g>
      <circle cx="153" cy="46" r="4.5" fill="#4bb3a7" />
      <ellipse cx="125" cy="25" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
      <ellipse cx="79" cy="59" rx="4" ry="2.6" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/* ── 2 · Cat Runner — candy pink #ff8fbf ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-cat-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8fbf" />
          <stop offset="55%" stopColor="#ff8fbf" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff8fbf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-cat-body" cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe1ef" />
          <stop offset="47%" stopColor="#ff8fbf" />
          <stop offset="100%" stopColor="#a33a72" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="140" cy="80" rx="104" ry="62" fill="url(#gem-cat-glow)" opacity="0.15" />
      <ellipse cx="150" cy="74" rx="58" ry="40" fill="url(#gem-cat-glow)" opacity="0.1" />
      <path d="M 34 122 Q 96 104 150 116 Q 196 124 232 110" stroke="#e8b57c" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
      <g stroke="#ff8fbf" strokeWidth="6" strokeLinecap="round" opacity="0.55">
        <line x1="40" y1="66" x2="78" y2="66" />
        <line x1="32" y1="80" x2="80" y2="80" />
        <line x1="44" y1="94" x2="76" y2="94" />
      </g>
      <g opacity="0.2">
        <path d="M 118 92 Q 96 78 106 62 Q 122 54 138 64 Q 150 74 144 90 Q 130 98 118 92 Z" fill="#ff8fbf" />
        <circle cx="152" cy="66" r="13" fill="#ff8fbf" />
      </g>
      <path d="M 96 84 Q 74 84 82 58" stroke="#ff8fbf" strokeWidth="10" strokeLinecap="round" fill="none" />
      <g stroke="#e173a6" strokeWidth="8" strokeLinecap="round">
        <line x1="150" y1="92" x2="158" y2="112" />
        <line x1="122" y1="92" x2="112" y2="110" />
      </g>
      <path d="M 150 92 Q 124 76 134 60 Q 152 52 170 62 Q 186 72 180 90 Q 166 100 150 92 Z" fill="url(#gem-cat-body)" />
      <circle cx="186" cy="66" r="15" fill="url(#gem-cat-body)" />
      <polygon points="176,54 180,40 190,54" fill="#ff8fbf" />
      <polygon points="192,54 200,40 202,56" fill="#ff8fbf" />
      <path d="M 150 40 Q 146 34 142 39 Q 138 34 134 40 Q 138 46 146 50 Q 152 46 150 40 Z" fill="#e8b57c" opacity="0.9" />
      <ellipse cx="181" cy="60" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
      <ellipse cx="148" cy="66" rx="6" ry="4" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

/* ── 3 · Evening Forest — teal-green #4fd1a5 ── */
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-fox-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4fd1a5" />
          <stop offset="55%" stopColor="#4fd1a5" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#4fd1a5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-fox-tree" cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#c9f7e6" />
          <stop offset="47%" stopColor="#4fd1a5" />
          <stop offset="100%" stopColor="#1c6e57" />
        </radialGradient>
        <radialGradient id="gem-fox-moon" cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#ffe6c4" />
          <stop offset="100%" stopColor="#e8b57c" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="130" cy="80" rx="104" ry="62" fill="url(#gem-fox-glow)" opacity="0.15" />
      <ellipse cx="130" cy="72" rx="58" ry="40" fill="url(#gem-fox-glow)" opacity="0.1" />
      <circle cx="202" cy="46" r="15" fill="url(#gem-fox-moon)" />
      <g fill="#1c6e57" opacity="0.55">
        <path d="M 66 112 L 78 82 L 90 112 Z" />
        <path d="M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z" />
        <path d="M 150 112 L 162 84 L 174 112 Z" />
      </g>
      <path d="M 30 128 Q 130 112 230 128" stroke="#164f3f" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z" fill="url(#gem-fox-tree)" />
      <path d="M 130 60 L 156 124 Q 130 116 104 124 Z" fill="url(#gem-fox-tree)" />
      <path d="M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z" fill="url(#gem-fox-tree)" />
      <circle cx="118" cy="66" r="2.6" fill="#e8b57c" />
      <circle cx="168" cy="80" r="2.4" fill="#e8b57c" />
      <circle cx="92" cy="82" r="2.2" fill="#e8b57c" />
      <ellipse cx="124" cy="76" rx="6" ry="9" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

/* ── 4 · Explosion — molten amber #ffb347 ── */
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-blast-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb347" />
          <stop offset="55%" stopColor="#ffb347" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-blast-core" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fff0cf" />
          <stop offset="47%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#8a4712" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="128" cy="80" rx="104" ry="64" fill="url(#gem-blast-glow)" opacity="0.16" />
      <ellipse cx="128" cy="80" rx="56" ry="44" fill="url(#gem-blast-glow)" opacity="0.1" />
      <g strokeLinejoin="round">
        <polygon points="120,44 130,28 140,46 128,50" fill="#ffcf87" />
        <polygon points="164,50 184,40 180,58 166,60" fill="#e8b57c" />
        <polygon points="172,74 198,72 192,88 174,86" fill="#ffb347" />
        <polygon points="160,106 182,116 166,124 154,112" fill="#ffcf87" />
        <polygon points="96,106 82,120 100,124 108,110" fill="#e8b57c" />
        <polygon points="84,74 58,70 64,86 88,84" fill="#ffb347" />
        <polygon points="96,50 78,40 82,58 102,60" fill="#ffcf87" />
      </g>
      <path d="M 120 50 A 30 30 0 0 0 120 110 Z" fill="url(#gem-blast-core)" />
      <path d="M 136 50 A 30 30 0 0 1 136 110 Z" fill="url(#gem-blast-core)" />
      <g stroke="#8a4712" strokeWidth="2.4" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M 120 52 Q 102 80 120 108" />
        <path d="M 136 52 Q 154 80 136 108" />
      </g>
      <circle cx="150" cy="40" r="2.6" fill="#e8b57c" />
      <circle cx="182" cy="98" r="2.4" fill="#ffcf87" />
      <circle cx="84" cy="98" r="2.4" fill="#e8b57c" />
      <ellipse cx="106" cy="64" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
      <ellipse cx="146" cy="64" rx="4" ry="2.6" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/* ── 5 · Planck to Now — cosmic violet #a98cff ── */
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-spiral-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a98cff" />
          <stop offset="55%" stopColor="#a98cff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a98cff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-spiral-core" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#efe7ff" />
          <stop offset="47%" stopColor="#a98cff" />
          <stop offset="100%" stopColor="#4b3a8c" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="118" cy="82" rx="104" ry="62" fill="url(#gem-spiral-glow)" opacity="0.16" />
      <ellipse cx="112" cy="80" rx="56" ry="42" fill="url(#gem-spiral-glow)" opacity="0.1" />
      <path d="M 44 118 Q 130 22 224 78" stroke="#7c63d6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />
      <circle cx="54" cy="110" r="10" fill="url(#gem-spiral-glow)" opacity="0.5" />
      <circle cx="54" cy="110" r="5" fill="#c6b4ff" />
      <circle cx="108" cy="82" r="28" fill="url(#gem-spiral-core)" />
      <polygon points="168,38 172,48 182,50 172,52 168,62 164,52 154,50 164,48" fill="#c6b4ff" opacity="0.9" />
      <g fill="#a98cff">
        <circle cx="204" cy="66" r="3" />
        <circle cx="214" cy="72" r="2.4" />
        <circle cx="208" cy="76" r="2.2" />
      </g>
      <circle cx="224" cy="78" r="9" fill="#e8b57c" />
      <ellipse cx="99" cy="73" rx="8" ry="5" fill="#ffffff" opacity="0.6" />
      <ellipse cx="116" cy="90" rx="3.5" ry="2.4" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

/* ── 6 · Practice Map — sky blue #5cc8ff ── */
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-trail-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5cc8ff" />
          <stop offset="55%" stopColor="#5cc8ff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5cc8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gem-trail-pin" cx="34%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#d6f2ff" />
          <stop offset="47%" stopColor="#5cc8ff" />
          <stop offset="100%" stopColor="#1d6f9e" />
        </radialGradient>
        <radialGradient id="gem-trail-here" cx="34%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#ffe6c4" />
          <stop offset="52%" stopColor="#e8b57c" />
          <stop offset="100%" stopColor="#9c6a34" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="130" cy="82" rx="104" ry="62" fill="url(#gem-trail-glow)" opacity="0.15" />
      <ellipse cx="130" cy="82" rx="56" ry="40" fill="url(#gem-trail-glow)" opacity="0.1" />
      <g stroke="#274a5c" strokeWidth="2" opacity="0.35">
        <line x1="70" y1="40" x2="70" y2="132" />
        <line x1="110" y1="40" x2="110" y2="132" />
        <line x1="150" y1="40" x2="150" y2="132" />
        <line x1="190" y1="40" x2="190" y2="132" />
        <line x1="50" y1="64" x2="210" y2="64" />
        <line x1="50" y1="98" x2="210" y2="98" />
      </g>
      <path d="M 64 118 Q 100 66 138 90 Q 176 110 198 62" stroke="#5cc8ff" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 12" fill="none" opacity="0.9" />
      <path d="M 64 118 C 50 100 50 82 64 82 C 78 82 78 100 64 118 Z" fill="url(#gem-trail-pin)" />
      <circle cx="64" cy="94" r="5" fill="#0f1b20" opacity="0.55" />
      <path d="M 138 90 C 124 72 124 54 138 54 C 152 54 152 72 138 90 Z" fill="url(#gem-trail-pin)" />
      <circle cx="138" cy="66" r="5" fill="#0f1b20" opacity="0.55" />
      <circle cx="198" cy="62" r="15" fill="none" stroke="#e8b57c" strokeWidth="2.4" opacity="0.5" />
      <circle cx="198" cy="62" r="9" fill="url(#gem-trail-here)" />
      <ellipse cx="60" cy="88" rx="4.5" ry="3" fill="#ffffff" opacity="0.6" />
      <ellipse cx="134" cy="60" rx="4.5" ry="3" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

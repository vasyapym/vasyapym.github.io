import { useRef, type PointerEvent, type ReactElement } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectCenter } from "../../../contracts/project-presentation";

type ProjectArtworkProps = { project: ProjectModule };

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
        <radialGradient id="gem-raft-leader" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffd7c2" />
          <stop offset="45%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#8f2b28" />
        </radialGradient>
        <radialGradient id="gem-raft-node" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffc7b8" />
          <stop offset="50%" stopColor="#ff6a5f" />
          <stop offset="100%" stopColor="#7d2723" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="80" rx="96" ry="66" fill="#ff6a5f" opacity="0.25" />
      <ellipse className="gem-halo" cx="130" cy="80" rx="64" ry="46" fill="#ff8f86" opacity="0.12" />
      <g stroke="#ff9d8f" strokeWidth="7" strokeLinecap="round" opacity="0.85">
        <line x1="130" y1="80" x2="130" y2="32" />
        <line x1="130" y1="80" x2="201" y2="65" />
        <line x1="130" y1="80" x2="174" y2="119" />
        <line x1="130" y1="80" x2="86" y2="119" />
        <line x1="130" y1="80" x2="59" y2="65" />
      </g>
      <circle cx="130" cy="32" r="14" fill="url(#gem-raft-node)" />
      <circle cx="201" cy="65" r="14" fill="url(#gem-raft-node)" />
      <circle cx="174" cy="119" r="14" fill="url(#gem-raft-node)" />
      <circle cx="86" cy="119" r="14" fill="url(#gem-raft-node)" />
      <circle cx="59" cy="65" r="14" fill="url(#gem-raft-node)" />
      <circle cx="130" cy="80" r="20" fill="url(#gem-raft-leader)" />
      <polygon points="116,64 122,52 130,62 138,52 144,64" fill="#e8b57c" />
      <ellipse cx="123" cy="72" rx="6" ry="4" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

/* ── 2 · Cat Runner — candy pink #ff8fbf ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-cat-body" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe1ef" />
          <stop offset="45%" stopColor="#ff8fbf" />
          <stop offset="100%" stopColor="#a33a72" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="132" cy="82" rx="94" ry="60" fill="#ff8fbf" opacity="0.24" />
      <ellipse className="gem-halo" cx="132" cy="82" rx="58" ry="40" fill="#ffb3d4" opacity="0.12" />
      <rect x="24" y="70" width="52" height="9" rx="4.5" fill="#e8b57c" opacity="0.9" />
      <rect x="30" y="88" width="40" height="9" rx="4.5" fill="#ff8fbf" opacity="0.8" />
      <rect x="20" y="106" width="34" height="9" rx="4.5" fill="#ff8fbf" opacity="0.55" />
      <g transform="rotate(-16 150 92)">
        <path d="M 110 96 Q 84 96 92 70" stroke="#ff8fbf" strokeWidth="11" strokeLinecap="round" fill="none" />
        <ellipse cx="150" cy="92" rx="46" ry="27" fill="url(#gem-cat-body)" />
        <rect x="150" y="108" width="12" height="22" rx="6" fill="#e173a6" />
        <rect x="176" y="102" width="12" height="22" rx="6" fill="#e173a6" />
      </g>
      <circle cx="196" cy="70" r="22" fill="url(#gem-cat-body)" />
      <polygon points="180,54 184,38 196,52" fill="#ff8fbf" />
      <polygon points="212,54 208,38 196,52" fill="#ff8fbf" />
      <ellipse cx="188" cy="62" rx="7" ry="5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ── 3 · Evening Forest — teal-green #4fd1a5 ── */
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-fox-tree" cx="38%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#c9f7e6" />
          <stop offset="48%" stopColor="#4fd1a5" />
          <stop offset="100%" stopColor="#1c6e57" />
        </radialGradient>
        <radialGradient id="gem-fox-moon" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe6c4" />
          <stop offset="100%" stopColor="#e8b57c" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="78" rx="96" ry="60" fill="#4fd1a5" opacity="0.22" />
      <ellipse className="gem-halo" cx="130" cy="72" rx="56" ry="40" fill="#7ee3c2" opacity="0.12" />
      <circle cx="206" cy="44" r="15" fill="url(#gem-fox-moon)" />
      <path d="M 34 140 Q 130 108 226 140" stroke="#1c6e57" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M 78 118 Q 66 74 92 60 Q 118 74 106 118 Z" fill="url(#gem-fox-tree)" />
      <path d="M 128 122 Q 114 64 146 46 Q 178 64 164 122 Z" fill="url(#gem-fox-tree)" />
      <path d="M 176 118 Q 166 78 190 64 Q 214 78 204 118 Z" fill="url(#gem-fox-tree)" />
      <ellipse cx="138" cy="72" rx="6" ry="9" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

/* ── 4 · Explosion — molten amber #ffb347 ── */
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-blast-core" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#fff0cf" />
          <stop offset="45%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#8a4712" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="80" rx="98" ry="64" fill="#ffb347" opacity="0.25" />
      <ellipse className="gem-halo" cx="130" cy="80" rx="60" ry="44" fill="#ffcf87" opacity="0.13" />
      <g>
        <polygon points="130,80 150,30 158,58" fill="#ffcf87" />
        <polygon points="130,80 196,44 182,72" fill="#ffb347" />
        <polygon points="130,80 214,92 184,102" fill="#e8b57c" />
        <polygon points="130,80 176,132 154,116" fill="#ffb347" />
        <polygon points="130,80 108,136 128,116" fill="#ffcf87" />
        <polygon points="130,80 60,120 92,104" fill="#e8b57c" />
        <polygon points="130,80 44,74 78,72" fill="#ffb347" />
        <polygon points="130,80 82,34 104,58" fill="#ffcf87" />
      </g>
      <path d="M 130 54 A 26 26 0 0 0 130 106 Z" fill="url(#gem-blast-core)" />
      <path d="M 138 54 A 26 26 0 0 1 138 106 Z" fill="url(#gem-blast-core)" />
      <ellipse cx="120" cy="68" rx="6" ry="4" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ── 5 · Planck to Now — cosmic violet #a98cff ── */
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-spiral-core" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#efe7ff" />
          <stop offset="45%" stopColor="#a98cff" />
          <stop offset="100%" stopColor="#4b3a8c" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="118" cy="82" rx="96" ry="62" fill="#a98cff" opacity="0.25" />
      <ellipse className="gem-halo" cx="118" cy="82" rx="58" ry="42" fill="#c6b4ff" opacity="0.13" />
      <path d="M 46 120 Q 130 20 224 78" stroke="#7c63d6" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.85" />
      <circle cx="118" cy="82" r="30" fill="url(#gem-spiral-core)" />
      <circle cx="224" cy="78" r="10" fill="#e8b57c" />
      <ellipse cx="108" cy="72" rx="8" ry="5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/* ── 6 · Practice Map — sky blue #5cc8ff ── */
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <radialGradient id="gem-trail-pin" cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#d6f2ff" />
          <stop offset="46%" stopColor="#5cc8ff" />
          <stop offset="100%" stopColor="#1d6f9e" />
        </radialGradient>
        <radialGradient id="gem-trail-pin-alt" cx="36%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe6c4" />
          <stop offset="55%" stopColor="#e8b57c" />
          <stop offset="100%" stopColor="#9c6a34" />
        </radialGradient>
      </defs>
      <ellipse className="gem-halo" cx="130" cy="82" rx="96" ry="60" fill="#5cc8ff" opacity="0.22" />
      <ellipse className="gem-halo" cx="130" cy="82" rx="56" ry="40" fill="#8fdaff" opacity="0.12" />
      <g fill="#274a5c" opacity="0.55">
        <rect x="86" y="52" width="24" height="24" rx="6" />
        <rect x="118" y="52" width="24" height="24" rx="6" />
        <rect x="150" y="52" width="24" height="24" rx="6" />
        <rect x="86" y="84" width="24" height="24" rx="6" />
        <rect x="118" y="84" width="24" height="24" rx="6" />
        <rect x="150" y="84" width="24" height="24" rx="6" />
        <rect x="86" y="116" width="24" height="24" rx="6" />
        <rect x="118" y="116" width="24" height="24" rx="6" />
        <rect x="150" y="116" width="24" height="24" rx="6" />
      </g>
      <path d="M 108 44 Q 92 44 92 62 Q 92 78 108 92 Q 124 78 124 62 Q 124 44 108 44 Z" fill="url(#gem-trail-pin)" />
      <path d="M 168 60 Q 154 60 154 76 Q 154 90 168 102 Q 182 90 182 76 Q 182 60 168 60 Z" fill="url(#gem-trail-pin-alt)" />
      <circle cx="108" cy="62" r="6" fill="#0f1b20" opacity="0.6" />
      <ellipse cx="102" cy="54" rx="5" ry="4" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

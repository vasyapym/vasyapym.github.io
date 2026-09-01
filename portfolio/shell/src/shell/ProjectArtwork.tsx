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
        <pattern id="gem-raft-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-lead"><circle cx="104" cy="58" r="17" /></clipPath>
        <clipPath id="gem-raft-n1"><circle cx="176" cy="48" r="12" /></clipPath>
        <clipPath id="gem-raft-n2"><circle cx="200" cy="92" r="12" /></clipPath>
        <clipPath id="gem-raft-n3"><circle cx="150" cy="120" r="13" /></clipPath>
        <clipPath id="gem-raft-n4"><circle cx="66" cy="108" r="12" /></clipPath>
      </defs>

      <ellipse cx="130" cy="80" rx="104" ry="66" fill="url(#gem-raft-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="128" cy="82" rx="64" ry="42" fill="url(#gem-raft-dense)" opacity="0.16" />
      <ellipse cx="104" cy="58" rx="26" ry="20" fill="url(#gem-raft-dense)" opacity="0.14" />

      {/* interconnect topology: leader fan */}
      <g stroke="#465059" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6">
        <line x1="104" y1="58" x2="176" y2="48" />
        <line x1="104" y1="58" x2="200" y2="92" />
        <line x1="104" y1="58" x2="150" y2="120" />
        <line x1="104" y1="58" x2="66" y2="108" />
      </g>
      {/* follower mesh edges */}
      <g stroke="#7d7669" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45">
        <line x1="176" y1="48" x2="200" y2="92" />
        <line x1="200" y1="92" x2="150" y2="120" />
        <line x1="150" y1="120" x2="66" y2="108" />
      </g>

      {/* log entries riding leader→follower links */}
      <g fill="#e8b57c">
        <rect x="138" y="50" width="4.5" height="4.5" rx="1" transform="rotate(-8 140 52)" />
        <rect x="150" y="73" width="4.5" height="4.5" rx="1" transform="rotate(20 152 75)" />
        <rect x="126" y="87" width="4.5" height="4.5" rx="1" transform="rotate(40 128 89)" />
        <rect x="83" y="81" width="4.5" height="4.5" rx="1" transform="rotate(28 85 83)" />
      </g>

      {/* followers */}
      <circle cx="176" cy="48" r="12" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n1)"><circle cx="172" cy="44" r="9.5" fill="#ff6a5f" /><circle cx="170" cy="42" r="5" fill="#ffd0c2" /></g>
      <circle cx="200" cy="92" r="12" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n2)"><circle cx="196" cy="88" r="9.5" fill="#ff6a5f" /><circle cx="194" cy="86" r="5" fill="#ffd0c2" /></g>
      <circle cx="150" cy="120" r="13" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n3)"><circle cx="146" cy="116" r="10" fill="#ff6a5f" /><circle cx="144" cy="114" r="5" fill="#ffd0c2" /></g>
      <circle cx="66" cy="108" r="12" fill="#7d2723" />
      <g clipPath="url(#gem-raft-n4)"><circle cx="62" cy="104" r="9.5" fill="#ff6a5f" /><circle cx="60" cy="102" r="5" fill="#ffd0c2" /></g>

      {/* leader: authority ring + subtle ticks */}
      <circle cx="104" cy="58" r="23" fill="none" stroke="#ffb1a6" strokeWidth="4" opacity="0.9" />
      <circle cx="104" cy="58" r="17" fill="#8f2b28" />
      <g clipPath="url(#gem-raft-lead)"><circle cx="99" cy="52" r="13" fill="#ff6a5f" /><circle cx="96" cy="49" r="7" fill="#ffe0d2" /></g>
      <g fill="#e8b57c">
        <rect x="97" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="104" y="32" width="3.5" height="7" rx="1.5" />
        <rect x="111" y="32" width="3.5" height="7" rx="1.5" />
      </g>

      {/* speculars */}
      <rect x="95" y="48" width="3.6" height="3.6" fill="#ffffff" opacity="0.65" />
      <rect x="169" y="43" width="3" height="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/* ── 2 · Cat Runner — candy pink #ff8fbf ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff8fbf" />
        </pattern>
        <pattern id="gem-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#ff8fbf" />
        </pattern>
        <clipPath id="gem-cat-head"><ellipse cx="150" cy="70" rx="34" ry="28" /></clipPath>
        <clipPath id="gem-cat-body"><ellipse cx="150" cy="112" rx="22" ry="15" /></clipPath>
      </defs>

      <ellipse cx="140" cy="80" rx="104" ry="62" fill="url(#gem-cat-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="150" cy="80" rx="62" ry="40" fill="url(#gem-cat-dense)" opacity="0.15" />

      {/* best-run ghost echo, offset up-left */}
      <g opacity="0.16" fill="#ff8fbf" transform="translate(-70 -20) scale(0.82)">
        <ellipse cx="150" cy="70" rx="34" ry="28" />
        <polygon points="130,49 122,26 142,45" />
        <polygon points="160,48 178,26 176,54" />
        <ellipse cx="150" cy="112" rx="22" ry="15" />
      </g>

      {/* dust kicks trailing back-left (pink lives here) */}
      <g stroke="#ff8fbf" strokeWidth="6" strokeLinecap="round" opacity="0.5">
        <line x1="86" y1="108" x2="114" y2="108" />
        <line x1="76" y1="118" x2="110" y2="118" />
        <line x1="90" y1="128" x2="112" y2="128" />
      </g>
      <path d="M 60 138 Q 150 128 240 136" stroke="#465059" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* body — cream base, faint pink rim only */}
      <ellipse cx="150" cy="112" rx="22" ry="15" fill="#ffe9f2" />
      <g clipPath="url(#gem-cat-body)">
        <ellipse cx="148" cy="110" rx="19" ry="12" fill="#fff4ec" />
        <ellipse cx="144" cy="107" rx="9" ry="6" fill="#fffaf5" />
      </g>

      {/* ears — buried-base polygons, cream */}
      <polygon points="130,49 122,26 142,45" fill="#fff4ec" />
      <polygon points="160,48 178,26 176,54" fill="#fff4ec" />

      {/* head — cream base, faint pink rim only */}
      <ellipse cx="150" cy="70" rx="34" ry="28" fill="#ffe9f2" />
      <g clipPath="url(#gem-cat-head)">
        <ellipse cx="148" cy="68" rx="31" ry="25" fill="#fff4ec" />
        <ellipse cx="142" cy="62" rx="16" ry="12" fill="#fffaf5" />
      </g>

      {/* neutral ink details — inner-ear liners + forepaws */}
      <polygon points="131,46 126,33 138,44" fill="#26333b" opacity="0.85" />
      <polygon points="163,47 173,34 171,50" fill="#26333b" opacity="0.85" />
      <ellipse cx="143" cy="124" rx="4" ry="2.4" fill="#26333b" />
      <ellipse cx="157" cy="124" rx="4" ry="2.4" fill="#26333b" />

      {/* eyes (ink), ochre nose, no mouth */}
      <ellipse cx="138" cy="72" rx="3.4" ry="5" fill="#26333b" />
      <ellipse cx="162" cy="72" rx="3.4" ry="5" fill="#26333b" />
      <ellipse cx="150" cy="82" rx="4" ry="3" fill="#e8b57c" />

      {/* three straight neutral whiskers per side */}
      <g stroke="#26333b" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
        <line x1="124" y1="74" x2="104" y2="70" />
        <line x1="124" y1="79" x2="102" y2="80" />
        <line x1="124" y1="84" x2="106" y2="90" />
        <line x1="176" y1="74" x2="196" y2="70" />
        <line x1="176" y1="79" x2="198" y2="80" />
        <line x1="176" y1="84" x2="194" y2="90" />
      </g>

      {/* speculars */}
      <rect x="140" y="60" width="3.4" height="3.4" fill="#ffffff" opacity="0.6" />
      <rect x="140" y="104" width="2.8" height="2.8" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/* ── 3 · Evening Forest — teal-green #4fd1a5 ── */
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-fox-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#4fd1a5" />
        </pattern>
        <pattern id="gem-fox-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#4fd1a5" />
        </pattern>
        <clipPath id="gem-fox-tree"><path d="M 130 60 L 156 124 Q 130 116 104 124 Z" /></clipPath>
        <clipPath id="gem-fox-moon"><circle cx="202" cy="46" r="15" /></clipPath>
      </defs>
      <ellipse cx="130" cy="80" rx="104" ry="62" fill="url(#gem-fox-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="130" cy="80" rx="60" ry="40" fill="url(#gem-fox-dense)" opacity="0.15" />
      <circle cx="202" cy="46" r="15" fill="#9c6a34" />
      <g clipPath="url(#gem-fox-moon)"><circle cx="199" cy="43" r="12" fill="#e8b57c" /><circle cx="197" cy="41" r="6" fill="#ffe6c4" /></g>
      <g opacity="0.5">
        <path d="M 66 112 L 78 82 L 90 112 Z" fill="#465059" />
        <path d="M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z" fill="#26333b" />
        <path d="M 150 112 L 162 84 L 174 112 Z" fill="#465059" />
      </g>
      <path d="M 30 128 Q 130 112 230 128" stroke="#26333b" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z" fill="#26333b" opacity="0.6" />
      <path d="M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z" fill="#26333b" opacity="0.6" />
      <path d="M 130 60 L 156 124 Q 130 116 104 124 Z" fill="#1c6e57" />
      <g clipPath="url(#gem-fox-tree)">
        <polygon points="130,60 104,124 130,124" fill="#4fd1a5" />
        <polygon points="130,60 116,108 126,108" fill="#c9f7e6" />
        <rect x="118" y="96" width="26" height="20" fill="url(#gem-fox-dense)" opacity="0.5" />
      </g>
      <circle cx="118" cy="66" r="2.6" fill="#e8b57c" />
      <circle cx="168" cy="80" r="2.4" fill="#e8b57c" />
      <circle cx="92" cy="82" r="2.2" fill="#e8b57c" />
      <rect x="122" y="76" width="3.2" height="3.2" fill="#ffffff" opacity="0.55" />
      <rect x="124" y="96" width="2.8" height="2.8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

/* ── 4 · Explosion — molten amber #ffb347 ── */
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-blast-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ffb347" />
        </pattern>
        <pattern id="gem-blast-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#ffb347" />
        </pattern>
        <pattern id="gem-blast-heat" patternUnits="userSpaceOnUse" width="6" height="6">
          <circle cx="3" cy="3" r="2" fill="#ffcf87" />
        </pattern>
        <clipPath id="gem-blast-left"><path d="M 120 50 A 30 30 0 0 0 120 110 Z" /></clipPath>
        <clipPath id="gem-blast-right"><path d="M 136 50 A 30 30 0 0 1 136 110 Z" /></clipPath>
      </defs>
      <ellipse cx="128" cy="80" rx="104" ry="64" fill="url(#gem-blast-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="128" cy="80" rx="60" ry="42" fill="url(#gem-blast-dense)" opacity="0.16" />
      <g strokeLinejoin="round">
        <polygon points="120,44 130,28 140,46 128,50" fill="#ffcf87" />
        <polygon points="164,50 184,40 180,58 166,60" fill="#e8b57c" />
        <polygon points="172,74 198,72 192,88 174,86" fill="#ffb347" />
        <polygon points="160,106 182,116 166,124 154,112" fill="#7d7669" />
        <polygon points="96,106 82,120 100,124 108,110" fill="#465059" />
        <polygon points="84,74 58,70 64,86 88,84" fill="#e8b57c" />
        <polygon points="96,50 78,40 82,58 102,60" fill="#b6ac95" />
      </g>
      <path d="M 120 50 A 30 30 0 0 0 120 110 Z" fill="#8a4712" />
      <g clipPath="url(#gem-blast-left)"><circle cx="116" cy="66" r="26" fill="#ffb347" /><circle cx="110" cy="60" r="10" fill="#fff0cf" /></g>
      <path d="M 136 50 A 30 30 0 0 1 136 110 Z" fill="#8a4712" />
      <g clipPath="url(#gem-blast-right)"><circle cx="140" cy="66" r="24" fill="#ffb347" /><rect x="128" y="46" width="34" height="68" fill="url(#gem-blast-heat)" opacity="0.55" /></g>
      <g stroke="#9c6a34" strokeWidth="2.4" fill="none" opacity="0.6" strokeLinecap="round">
        <path d="M 120 52 Q 102 80 120 108" />
        <path d="M 136 52 Q 154 80 136 108" />
      </g>
      <circle cx="150" cy="40" r="2.6" fill="#e8b57c" />
      <circle cx="182" cy="98" r="2.4" fill="#7d7669" />
      <circle cx="84" cy="98" r="2.4" fill="#b6ac95" />
      <rect x="104" y="62" width="3.4" height="3.4" fill="#ffffff" opacity="0.65" />
      <rect x="144" y="62" width="3" height="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}

/* ── 5 · Planck to Now — cosmic violet #a98cff ── */
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-spiral-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#a98cff" />
        </pattern>
        <pattern id="gem-spiral-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#a98cff" />
        </pattern>
        <clipPath id="gem-spiral-core"><circle cx="108" cy="82" r="24" /></clipPath>
      </defs>

      <ellipse cx="118" cy="82" rx="104" ry="62" fill="url(#gem-spiral-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.16)} cx="108" cy="82" rx="58" ry="40" fill="url(#gem-spiral-dense)" opacity="0.16" />

      {/* subordinate epoch timeline arc + ochre scrubber riding the arc */}
      <path d="M 30 120 Q 130 30 236 74" stroke="#7d7669" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 6" fill="none" opacity="0.5" />
      <circle cx="207" cy="66" r="4.5" fill="#e8b57c" />
      <circle cx="205" cy="64" r="2" fill="#ffe6c4" />

      {/* tilted spiral galaxy arms */}
      <g transform="rotate(-18 108 82)" fill="none" strokeLinecap="round">
        <path d="M 108 82 Q 158 66 182 88" stroke="#a98cff" strokeWidth="8" opacity="0.85" />
        <path d="M 108 82 Q 58 98 36 76" stroke="#a98cff" strokeWidth="8" opacity="0.7" />
        <path d="M 108 82 Q 138 116 168 116" stroke="#8f78e0" strokeWidth="6" opacity="0.55" />
      </g>

      {/* galaxy core, stepped tones */}
      <circle cx="108" cy="82" r="24" fill="#4b3a8c" />
      <g clipPath="url(#gem-spiral-core)">
        <circle cx="102" cy="76" r="18" fill="#a98cff" />
        <circle cx="98" cy="72" r="9" fill="#efe7ff" />
      </g>

      {/* star field */}
      <polygon points="196,42 200,52 210,54 200,56 196,66 192,56 182,54 192,52" fill="#b6ac95" opacity="0.9" />
      <polygon points="150,112 152,118 158,120 152,122 150,128 148,122 142,120 148,118" fill="#a98cff" opacity="0.8" />
      <circle cx="214" cy="98" r="2.6" fill="#e8b57c" />
      <circle cx="222" cy="60" r="2" fill="#efe7ff" />
      <circle cx="60" cy="40" r="2.4" fill="#a98cff" />
      <circle cx="42" cy="118" r="1.8" fill="#b6ac95" />
      <circle cx="188" cy="120" r="2.2" fill="#efe7ff" />

      {/* distant ringed planet (ink neutrals) */}
      <circle cx="212" cy="118" r="6" fill="#465059" />
      <ellipse cx="212" cy="118" rx="11" ry="4" fill="none" stroke="#7d7669" strokeWidth="2" opacity="0.8" />

      {/* speculars */}
      <rect x="97" y="71" width="3.6" height="3.6" fill="#ffffff" opacity="0.65" />
      <rect x="118" y="88" width="2.8" height="2.8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

/* ── 6 · Practice Map — sky blue #5cc8ff ── */
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-trail-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <pattern id="gem-trail-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#5cc8ff" />
        </pattern>
        <clipPath id="gem-trail-pin1"><path d="M 64 118 C 50 100 50 82 64 82 C 78 82 78 100 64 118 Z" /></clipPath>
        <clipPath id="gem-trail-pin2"><path d="M 138 90 C 124 72 124 54 138 54 C 152 54 152 72 138 90 Z" /></clipPath>
        <clipPath id="gem-trail-here"><circle cx="198" cy="62" r="9" /></clipPath>
      </defs>
      <ellipse cx="130" cy="82" rx="104" ry="62" fill="url(#gem-trail-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.15)} cx="130" cy="82" rx="60" ry="40" fill="url(#gem-trail-dense)" opacity="0.15" />
      <g stroke="#274a5c" strokeWidth="2" opacity="0.35">
        <line x1="70" y1="40" x2="70" y2="132" />
        <line x1="110" y1="40" x2="110" y2="132" />
        <line x1="150" y1="40" x2="150" y2="132" />
        <line x1="190" y1="40" x2="190" y2="132" />
        <line x1="50" y1="64" x2="210" y2="64" />
        <line x1="50" y1="98" x2="210" y2="98" />
      </g>
      <path d="M 64 118 Q 100 66 138 90 Q 176 110 198 62" stroke="#465059" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 12" fill="none" opacity="0.85" />
      <path d="M 64 118 C 50 100 50 82 64 82 C 78 82 78 100 64 118 Z" fill="#1d6f9e" />
      <g clipPath="url(#gem-trail-pin1)"><circle cx="61" cy="92" r="13" fill="#5cc8ff" /><circle cx="58" cy="87" r="6" fill="#d6f2ff" /></g>
      <circle cx="64" cy="94" r="5" fill="#0b1317" opacity="0.55" />
      <path d="M 138 90 C 124 72 124 54 138 54 C 152 54 152 72 138 90 Z" fill="#1d6f9e" />
      <g clipPath="url(#gem-trail-pin2)"><circle cx="135" cy="64" r="12" fill="#5cc8ff" /><circle cx="132" cy="59" r="6" fill="#d6f2ff" /></g>
      <circle cx="138" cy="66" r="5" fill="#0b1317" opacity="0.55" />
      <circle cx="198" cy="62" r="15" fill="none" stroke="#e8b57c" strokeWidth="2.4" opacity="0.5" />
      <circle cx="198" cy="62" r="9" fill="#9c6a34" />
      <g clipPath="url(#gem-trail-here)"><circle cx="195" cy="59" r="5" fill="#e8b57c" /><circle cx="194" cy="58" r="2.4" fill="#ffe6c4" /></g>
      <rect x="58" y="86" width="3.2" height="3.2" fill="#ffffff" opacity="0.6" />
      <rect x="132" y="58" width="3" height="3" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

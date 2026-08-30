import { useRef, type CSSProperties, type PointerEvent, type ReactElement } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectCenter, ProjectPresentationPart } from "../../../contracts/project-presentation";

type ProjectArtworkProps = {
  project: ProjectModule;
};

export default function ProjectArtwork({ project }: ProjectArtworkProps) {
  const objectRef = useRef<HTMLDivElement>(null);
  const presentation = project.presentation;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !objectRef.current) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const objectStyle = objectRef.current.style;

    objectStyle.setProperty("--art-rotate-x", `${y * -5}deg`);
    objectStyle.setProperty("--art-rotate-y", `${x * 7}deg`);
    objectStyle.setProperty("--art-shift-x", `${x * 8}px`);
    objectStyle.setProperty("--art-shift-y", `${y * 6}px`);
  };

  const resetPointer = () => {
    const objectStyle = objectRef.current?.style;
    objectStyle?.setProperty("--art-rotate-x", "0deg");
    objectStyle?.setProperty("--art-rotate-y", "0deg");
    objectStyle?.setProperty("--art-shift-x", "0px");
    objectStyle?.setProperty("--art-shift-y", "0px");
  };

  return (
    <div
      className={`project-artwork ${presentation.className} artwork-motion-${presentation.motion}`}
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <div ref={objectRef} className="project-artwork-object">
        {presentation.parts.map((part) => (
          <span
            className={`project-artwork-part ${part.className}`}
            key={part.id}
            style={partStyle(part)}
          >
            <PartMark part={part} />
          </span>
        ))}
        <span className={`project-artwork-center center-${presentation.centerMark}`}>
          <CenterMark mark={presentation.centerMark} label={presentation.centerLabel} />
        </span>
      </div>
      <span className="project-artwork-note">{presentation.note}</span>
    </div>
  );
}

const CENTER_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  kitty: KittyCenterMark,
  filetree: FiletreeCenterMark,
  fox: FoxCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  trail: TrailCenterMark,
  raft: RaftCenterMark,
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) {
    return <>{label}</>;
  }
  return <Component />;
}

// Code Layout: one translucent drafting sheet with a column of code bars
// and two linked graph nodes off the margin — structure before decoration.
function FiletreeCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <rect x="22" y="8" width="58" height="74" rx="4" fill="#141f29" stroke="#86aed4" strokeWidth="1.2" />
      {[0, 1, 2].map((row) => (
        <circle key={`ln${row}`} cx="30" cy={22 + row * 11} r="1.4" fill="#4c6a83" />
      ))}
      <rect x="38" y="19" width="30" height="5" rx="2.5" fill="#86aed4" opacity="0.9" />
      <rect x="38" y="30" width="20" height="5" rx="2.5" fill="#6f93b5" opacity="0.55" />
      <rect x="44" y="41" width="26" height="5" rx="2.5" fill="#86aed4" opacity="0.75" />
      <rect x="38" y="52" width="14" height="5" rx="2.5" fill="#6f93b5" opacity="0.45" />
      <rect x="38" y="63" width="34" height="5" rx="2.5" fill="#86aed4" opacity="0.95" />
      <path d="M 80 22 H 92 V 30" stroke="#4c6a83" strokeWidth="1.3" fill="none" />
      <path d="M 80 43 H 96 V 62" stroke="#4c6a83" strokeWidth="1.3" fill="none" />
      <circle cx="92" cy="30" r="4.4" fill="#141f29" stroke="#86aed4" strokeWidth="1.3" />
      <circle cx="92" cy="30" r="1.5" fill="#86aed4" />
      <circle cx="96" cy="66" r="4.4" fill="#141f29" stroke="#6f93b5" strokeWidth="1.3" />
      <circle cx="96" cy="66" r="1.5" fill="#6f93b5" />
    </svg>
  );
}

// Evening Forest: an 8-bit fox — chunky crisp cells echoing the project's
// own Bayer-dithered 8-bit render — seated between two dusk pines, with a
// white-tipped tail, on the violet→amber wash.
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 120 96" shapeRendering="crispEdges" aria-hidden="true">
      {/* dusk ground line */}
      <rect x="8" y="80" width="104" height="8" fill="#3a2740" />
      {/* pines */}
      <g fill="#2e2140">
        <rect x="8" y="16" width="8" height="8" />
        <rect x="0" y="24" width="16" height="8" />
        <rect x="0" y="32" width="16" height="8" />
        <rect x="8" y="40" width="8" height="40" />
        <rect x="104" y="16" width="8" height="8" />
        <rect x="104" y="24" width="16" height="8" />
        <rect x="104" y="32" width="16" height="8" />
        <rect x="104" y="40" width="8" height="40" />
      </g>
      {/* fox — amber body/head/ears/tail */}
      <g fill="#e29b62">
        <rect x="40" y="8" width="16" height="8" />
        <rect x="64" y="8" width="16" height="8" />
        <rect x="40" y="16" width="40" height="8" />
        <rect x="40" y="24" width="8" height="8" />
        <rect x="56" y="24" width="8" height="8" />
        <rect x="72" y="24" width="8" height="8" />
        <rect x="40" y="32" width="8" height="8" />
        <rect x="72" y="32" width="8" height="8" />
        <rect x="48" y="40" width="8" height="8" />
        <rect x="64" y="40" width="8" height="8" />
        <rect x="40" y="48" width="16" height="8" />
        <rect x="64" y="48" width="32" height="8" />
        <rect x="40" y="56" width="8" height="8" />
        <rect x="72" y="56" width="24" height="8" />
        <rect x="40" y="64" width="48" height="8" />
        <rect x="56" y="72" width="8" height="8" />
      </g>
      {/* fox — cream muzzle, chest, tail tip */}
      <g fill="#f2e4d4">
        <rect x="48" y="32" width="24" height="8" />
        <rect x="56" y="48" width="8" height="8" />
        <rect x="48" y="56" width="24" height="8" />
        <rect x="88" y="64" width="16" height="8" />
        <rect x="88" y="72" width="16" height="8" />
      </g>
      {/* fox — ink ear tips, eyes, nose, paws */}
      <g fill="#241420">
        <rect x="40" y="0" width="8" height="8" />
        <rect x="72" y="0" width="8" height="8" />
        <rect x="48" y="24" width="8" height="8" />
        <rect x="64" y="24" width="8" height="8" />
        <rect x="56" y="40" width="8" height="8" />
        <rect x="48" y="72" width="8" height="8" />
        <rect x="64" y="72" width="8" height="8" />
      </g>
      {/* firefly accents */}
      <g fill="#ffb45e">
        <rect x="24" y="40" width="8" height="8" />
        <rect x="88" y="16" width="8" height="8" />
      </g>
    </svg>
  );
}

// Explosion: a glowing paper-lantern moon caught tearing open — exposed ember
// core, a fan of solid cream/ember/rust shards detonating toward the upper right.
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <defs>
        <radialGradient id="lunaGlow" cx="40%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffe8bf" />
          <stop offset="45%" stopColor="#ff9a48" />
          <stop offset="100%" stopColor="#7e2f22" />
        </radialGradient>
      </defs>
      {/* intact glowing body of the paper-lantern moon */}
      <circle cx="46" cy="60" r="30" fill="url(#lunaGlow)" />
      {/* a darker folded-paper facet across the sphere */}
      <path d="M 46 30 Q 30 48 34 78 Q 52 74 60 52 Z" fill="#c95a2c" opacity="0.5" />
      {/* bright limb highlight */}
      <path d="M 30 44 Q 38 32 52 34" fill="none" stroke="#ffe8bf" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      {/* ember core exposed where the shell tears open */}
      <circle cx="60" cy="46" r="6" fill="#ffd27a" />
      {/* solid shards detonating toward the upper right */}
      <polygon points="60,40 76,30 70,48" fill="#ffd9a0" />
      <polygon points="70,26 88,20 80,38" fill="#ff8a3c" />
      <polygon points="80,40 100,40 86,54" fill="#c65a2a" />
      <polygon points="66,18 76,7 80,22" fill="#ffcf95" />
      <polygon points="90,30 106,26 96,44" fill="#ff8a3c" />
      <polygon points="84,54 102,60 88,66" fill="#d0632c" />
      <polygon points="98,16 108,14 103,26" fill="#ffd9a0" />
      <polygon points="56,28 63,17 68,31" fill="#ff8a3c" />
    </svg>
  );
}

// Planck to Now: a galaxy spiral whose dots grow from quantum speck to now.
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <polyline
        points="65.0,50.0 65.8,51.9 65.4,54.1 63.7,56.3 60.6,58.0 56.7,58.5 52.3,57.7 48.4,55.3 45.7,51.6 44.8,46.9 46.3,42.0 50.2,37.6 56.2,34.6 63.6,33.5 71.3,34.9 78.2,38.8 83.1,44.8 85.0,52.2 83.3,60.1 77.9,67.1 69.4,72.2 58.7,74.5 47.4,73.3 37.0,68.5 29.2,60.7 25.4,50.7 26.4,39.9 32.4,29.8 42.8,22.1 56.4,17.9 71.4,18.1 85.6,23.0 96.9,32.1 103.5,44.3 104.2,58.0"
        fill="none"
        stroke="#9fc2ef"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="65" cy="50" r="1.7" fill="#ffffff" />
      <circle cx="44.8" cy="46.9" r="5" fill="#ffcf6e" />
      <circle cx="78.2" cy="38.8" r="5.8" fill="#ffd98f" />
      <circle cx="32.4" cy="29.8" r="6.6" fill="#ffcf6e" />
      <circle cx="103.5" cy="44.3" r="9" fill="#ffcf6e" />
      <circle cx="103.5" cy="44.3" r="13" fill="none" stroke="#ffcf6e" strokeWidth="1.6" opacity="0.32" />
    </svg>
  );
}

// Practice Map: one contour hint and a dashed trail ending in an ochre
// waypoint ring — the scattered card parts supply the pin and compass rose.
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <path
        d="M 2 76 Q 34 56 62 72 T 118 68"
        fill="none"
        stroke="#f2ebde"
        strokeWidth="1.3"
        opacity="0.16"
      />
      <path
        d="M 12 88 C 30 84 38 64 56 58 C 70 53 76 40 86 28"
        fill="none"
        stroke="#f2ebde"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="90" cy="24" r="7" fill="none" stroke="#cf9d63" strokeWidth="1.7" opacity="0.85" />
      <circle cx="90" cy="24" r="3" fill="none" stroke="#cf9d63" strokeWidth="1.7" />
    </svg>
  );
}

// Raft Cluster: the moment of election — one bright teal leader disc wearing a
// beacon crown, fed by directed vote wedges from deep-teal follower masses,
// seated on a chunky replicated-log ribbon (committed cells glowing, tail dark).
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      {/* directed vote wedges from followers to the elected leader */}
      <polygon points="24,50 33,35 53,31" fill="#4bb5b0" opacity="0.9" />
      <polygon points="96,50 87,35 67,31" fill="#4bb5b0" opacity="0.9" />
      {/* spine linking leader to the replicated log */}
      <rect x="56" y="36" width="8" height="24" rx="3" fill="#39928e" />
      {/* two follower nodes — solid deep-teal masses */}
      <circle cx="22" cy="46" r="11" fill="#2f7d79" />
      <circle cx="98" cy="46" r="11" fill="#2f7d79" />
      <circle cx="18" cy="42" r="3.4" fill="#7fd6d1" opacity="0.7" />
      <circle cx="94" cy="42" r="3.4" fill="#7fd6d1" opacity="0.7" />
      {/* elected leader — bright disc with beacon crown */}
      <polygon points="52,13 60,1 68,13" fill="#a7ede9" />
      <circle cx="60" cy="25" r="15" fill="#7ad9d4" />
      <circle cx="54" cy="19" r="3.6" fill="#d6f6f4" opacity="0.85" />
      <circle cx="60" cy="25" r="5" fill="#0e1a19" opacity="0.85" />
      {/* replicated log — solid base plate + committed / tail cells */}
      <rect x="14" y="60" width="92" height="24" rx="6" fill="#123e3c" />
      <rect x="18" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="32" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="46" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="60" y="64" width="12" height="16" rx="3" fill="#66d0cb" />
      <rect x="74" y="64" width="12" height="16" rx="3" fill="#2a6a67" />
      <rect x="88" y="64" width="12" height="16" rx="3" fill="#2a6a67" />
    </svg>
  );
}

function partStyle(part: ProjectPresentationPart) {
  return {
    "--anchor-x": `${part.anchorX}px`,
    "--anchor-y": `${part.anchorY}px`,
    "--scatter-x": `${part.scatterX}px`,
    "--scatter-y": `${part.scatterY}px`,
    "--scatter-z": `${part.scatterZ}px`,
    "--base-z": `${part.baseZ}px`,
    "--part-rotation": `${part.rotation}deg`,
  } as CSSProperties;
}

// The runner herself, redrawn flat and quiet: three values — cream fur,
// ink features, one rose bow — so she reads inside the ink card the way she
// does in-game.
function KittyCenterMark() {
  return (
    <svg viewBox="-1.35 -1.2 2.7 2.2" aria-hidden="true">
      {/* ears */}
      {[-1, 1].map((side) => (
        <path
          key={`ear${side}`}
          d="M -0.28 0 Q -0.36 -0.3 -0.12 -0.47 Q 0 -0.54 0.12 -0.47 Q 0.36 -0.3 0.28 0 Z"
          fill="#f2ede4"
          stroke="#3a3142"
          strokeWidth="0.03"
          transform={`translate(${side * 0.58} -0.52)`}
        />
      ))}
      {/* head */}
      <ellipse rx="1" ry="0.84" fill="#f2ede4" stroke="#3a3142" strokeWidth="0.03" />
      {/* face */}
      <ellipse cx="-0.4" cy="-0.06" rx="0.085" ry="0.135" fill="#3a3142" />
      <ellipse cx="0.4" cy="-0.06" rx="0.085" ry="0.135" fill="#3a3142" />
      <ellipse cx="0" cy="0.16" rx="0.13" ry="0.1" fill="#ffd44d" />
      {/* whiskers: three per side, fanned */}
      {[-1, 1].map((side) =>
        [0.18, 0.02, -0.14].map((y, i) => (
          <rect
            key={`w${side}${i}`}
            x={side === -1 ? -1.06 : 0.7}
            y={-y - 0.016}
            width="0.36"
            height="0.032"
            fill="#3a3142"
            transform={`rotate(${side * (0.08 - i * 0.08) * -57.3} ${side * 0.88} ${-y})`}
          />
        )),
      )}
      {/* bow: single rose pair, no underlay shadows */}
      <g transform="translate(0.52 -0.66)">
        <ellipse
          cx="-0.3"
          cy="0"
          rx="0.34"
          ry="0.24"
          fill="#e94f64"
          transform="rotate(-25.8 -0.3 0)"
        />
        <ellipse
          cx="0.3"
          cy="0"
          rx="0.34"
          ry="0.24"
          fill="#e94f64"
          transform="rotate(25.8 0.3 0)"
        />
        <circle r="0.16" fill="#d13a50" />
      </g>
    </svg>
  );
}

function PartMark({ part }: { part: ProjectPresentationPart }) {
  if (part.mark === "nodes") {
    return (
      <span className="project-mark project-mark-nodes">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (part.mark === "branches") {
    return (
      <span className="project-mark project-mark-branches">
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (part.mark === "stack") {
    return (
      <span className="project-mark project-mark-stack">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (part.mark === "route") {
    return (
      <span className="project-mark project-mark-route">
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (part.mark === "pin") {
    return <span className="project-mark project-mark-pin" />;
  }

  if (part.mark === "contours") {
    return (
      <span className="project-mark project-mark-contours">
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (part.mark === "compass") {
    return <span className="project-mark project-mark-compass" />;
  }

  return <span className="project-mark project-mark-type">{part.markLabel ?? "P / I"}</span>;
}

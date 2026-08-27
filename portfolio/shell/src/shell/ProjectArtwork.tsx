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
};

function CenterMark({ mark, label }: { mark: ProjectCenter; label: string }) {
  const Component = CENTER_MARKS[mark];
  if (!Component) {
    return <>{label}</>;
  }
  return <Component />;
}

// Code Layout: two drafting sheets, a column of code bars, and linked graph
// nodes floating off the margin — structure before decoration.
function FiletreeCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <rect x="16" y="16" width="56" height="68" rx="4" fill="#253a4b" opacity="0.3" transform="rotate(-7 44 50)" />
      <rect x="22" y="8" width="58" height="74" rx="4" fill="#f6f7f3" stroke="#253a4b" strokeWidth="1.5" />
      {[0, 1, 2].map((row) => (
        <circle key={`ln${row}`} cx="30" cy={22 + row * 11} r="1.6" fill="#8aa7b8" />
      ))}
      <rect x="38" y="19" width="30" height="5" rx="2.5" fill="#245d93" />
      <rect x="38" y="30" width="20" height="5" rx="2.5" fill="#8aa7b8" />
      <rect x="44" y="41" width="26" height="5" rx="2.5" fill="#245d93" />
      <rect x="38" y="52" width="14" height="5" rx="2.5" fill="#8aa7b8" />
      <rect x="38" y="63" width="34" height="5" rx="2.5" fill="#17436d" />
      <path d="M 80 22 H 92 V 30" stroke="#17436d" strokeWidth="1.4" fill="none" />
      <path d="M 80 43 H 96 V 62" stroke="#17436d" strokeWidth="1.4" fill="none" />
      <circle cx="92" cy="30" r="4.6" fill="#fff" stroke="#245d93" strokeWidth="1.5" />
      <circle cx="92" cy="30" r="1.7" fill="#245d93" />
      <circle cx="96" cy="66" r="4.6" fill="#fff" stroke="#245d93" strokeWidth="1.5" />
      <circle cx="96" cy="66" r="1.7" fill="#17436d" />
    </svg>
  );
}

// Evening Forest: the doe-eyed resident between two dusk pines.
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true">
      <polygon points="22,8 36,56 8,56" fill="#2b1c3f" opacity="0.75" />
      <polygon points="30,20 41,56 19,56" fill="#3d2a55" opacity="0.65" />
      <polygon points="98,10 112,58 84,58" fill="#2b1c3f" opacity="0.75" />
      <polygon points="90,22 101,58 79,58" fill="#3d2a55" opacity="0.65" />
      <ellipse cx="60" cy="88" rx="27" ry="5" fill="#2b1c3f" opacity="0.4" />
      <g transform="translate(60 51) scale(1.05)">
        <path d="M -17 -10 L -26 -45 L -3 -28 Z" fill="#e8804a" />
        <path d="M 17 -10 L 26 -45 L 3 -28 Z" fill="#e8804a" />
        <path d="M -15.5 -14 L -21.5 -37.5 L -7.5 -26 Z" fill="#402a38" />
        <path d="M 15.5 -14 L 21.5 -37.5 L 7.5 -26 Z" fill="#402a38" />
        <ellipse rx="24" ry="22.5" fill="#e8804a" />
        <ellipse cx="-10" cy="-2" rx="3" ry="3.6" fill="#33202c" />
        <ellipse cx="10" cy="-2" rx="3" ry="3.6" fill="#33202c" />
        <circle cx="-9" cy="-3.2" r="1" fill="#fff" />
        <circle cx="11" cy="-3.2" r="1" fill="#fff" />
        <ellipse cx="-16.5" cy="6.5" rx="3.4" ry="2" fill="#ff8c78" opacity="0.55" />
        <ellipse cx="16.5" cy="6.5" rx="3.4" ry="2" fill="#ff8c78" opacity="0.55" />
        <ellipse cy="11" rx="12.5" ry="9" fill="#f6f1e6" />
        <path d="M -3.4 7.5 L 3.4 7.5 L 0 12 Z" fill="#33202c" />
        <path d="M 0 12 V 15.5" stroke="#33202c" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Explosion: ember core sending shards across shock rings.
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <circle cx="55" cy="55" r="46" fill="none" stroke="#ffbd6f" strokeWidth="2" opacity="0.2" />
      <circle cx="55" cy="55" r="36" fill="none" stroke="#ffbd6f" strokeWidth="2.4" opacity="0.34" />
      <circle cx="55" cy="55" r="26" fill="none" stroke="#ffd98f" strokeWidth="3" opacity="0.62" />
      {(
        [
          [-58, 10, 3, "#ff8a3c"],
          [-16, 13, 3.4, "#ffbd6f"],
          [28, 9, 2.7, "#ffd98f"],
          [118, 12, 3.2, "#ff8a3c"],
          [163, 10, 2.7, "#ffd98f"],
        ] as const
      ).map(([angle, len, width, color], i) => (
        <g transform={`rotate(${angle} 55 55)`} key={`shard${i}`}>
          <polygon points={`${31 - len},${55 - width} 31,55 ${31 - len},${55 + width}`} fill={color} />
        </g>
      ))}
      <circle cx="55" cy="55" r="13" fill="#ffbd6f" />
      <circle cx="55" cy="55" r="7" fill="#ffe2a8" />
      <circle cx="53" cy="52" r="3.4" fill="#fff7e2" />
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
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="65" cy="50" r="1.7" fill="#ffffff" />
      <circle cx="44.8" cy="46.9" r="5" fill="#ffcf6e" />
      <circle cx="78.2" cy="38.8" r="5.8" fill="#ffd98f" />
      <circle cx="32.4" cy="29.8" r="6.6" fill="#ffcf6e" />
      <circle cx="103.5" cy="44.3" r="9" fill="#ffcf6e" />
      <circle cx="103.5" cy="44.3" r="13" fill="none" stroke="#ffcf6e" strokeWidth="1.6" opacity="0.4" />
    </svg>
  );
}

// Practice Map: contour hills and a dashed trail ending in a waypoint ring —
// the scattered card parts supply the actual pin and compass rose.
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <path
        d="M 6 62 Q 30 40 56 58 T 114 52"
        fill="none"
        stroke="#43382d"
        strokeWidth="1.3"
        opacity="0.32"
      />
      <path
        d="M 2 76 Q 34 56 62 72 T 118 68"
        fill="none"
        stroke="#43382d"
        strokeWidth="1.3"
        opacity="0.22"
      />
      <path
        d="M 12 88 C 30 84 38 64 56 58 C 70 53 76 40 86 28"
        fill="none"
        stroke="#43382d"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      <circle cx="90" cy="24" r="7" fill="none" stroke="#a8652d" strokeWidth="1.8" opacity="0.85" />
      <circle cx="90" cy="24" r="3" fill="none" stroke="#a8652d" strokeWidth="1.8" />
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

// The runner herself, redrawn as flat SVG with the game's exact palette and
// proportions (head ellipse, ear curves, bow placement), so the landing
// card and the in-game character read as the same illustration system.
function KittyCenterMark() {
  return (
    <svg viewBox="-1.35 -1.2 2.7 2.2" aria-hidden="true">
      {/* ears: ink copy grown behind the white fill */}
      {[-1, 1].map((side) => (
        <g transform={`translate(${side * 0.58} -0.52)`} key={`ear${side}`}>
          <path
            d="M -0.28 0 Q -0.36 -0.3 -0.12 -0.47 Q 0 -0.54 0.12 -0.47 Q 0.36 -0.3 0.28 0 Z"
            fill="#3a3142"
            transform="scale(1.12)"
          />
          <path
            d="M -0.28 0 Q -0.36 -0.3 -0.12 -0.47 Q 0 -0.54 0.12 -0.47 Q 0.36 -0.3 0.28 0 Z"
            fill="#ffffff"
          />
        </g>
      ))}
      {/* head */}
      <ellipse rx="1.045" ry="0.878" fill="#3a3142" />
      <ellipse rx="1" ry="0.84" fill="#ffffff" />
      {/* face */}
      <ellipse cx="-0.4" cy="-0.06" rx="0.085" ry="0.135" fill="#3a3142" />
      <ellipse cx="0.4" cy="-0.06" rx="0.085" ry="0.135" fill="#3a3142" />
      <ellipse cx="0" cy="0.16" rx="0.13" ry="0.1" fill="#ffd44d" />
      <ellipse cx="-0.68" cy="0.22" rx="0.14" ry="0.09" fill="#ffc9d8" />
      <ellipse cx="0.68" cy="0.22" rx="0.14" ry="0.09" fill="#ffc9d8" />
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
      {/* bow */}
      <g transform="translate(0.52 -0.66)">
        <ellipse
          cx="-0.3"
          cy="0"
          rx="0.381"
          ry="0.269"
          fill="#3a3142"
          transform="rotate(-25.8 -0.3 0)"
        />
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
          rx="0.381"
          ry="0.269"
          fill="#3a3142"
          transform="rotate(25.8 0.3 0)"
        />
        <ellipse
          cx="0.3"
          cy="0"
          rx="0.34"
          ry="0.24"
          fill="#e94f64"
          transform="rotate(25.8 0.3 0)"
        />
        <circle r="0.189" fill="#3a3142" />
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

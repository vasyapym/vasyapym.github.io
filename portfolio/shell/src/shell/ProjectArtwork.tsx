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

// Evening Forest: the resident between two dusk pines, flattened to one
// amber tone over ink lines.
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true">
      <polygon points="24,12 37,56 11,56" fill="#241420" opacity="0.85" />
      <polygon points="96,14 109,58 83,58" fill="#241420" opacity="0.85" />
      <ellipse cx="60" cy="90" rx="26" ry="4" fill="#241420" opacity="0.3" />
      <g>
        <path d="M 43 38 L 36 16 L 53 29 Z" fill="#e29b62" />
        <path d="M 77 38 L 84 16 L 67 29 Z" fill="#e29b62" />
        <circle cx="60" cy="50" r="21" fill="#e29b62" />
        <ellipse cx="51.5" cy="47" rx="2.5" ry="3.2" fill="#241420" />
        <ellipse cx="68.5" cy="47" rx="2.5" ry="3.2" fill="#241420" />
        <ellipse cx="60" cy="57.5" rx="10" ry="7" fill="#f2e4d4" />
        <path d="M 57.2 54.6 L 62.8 54.6 L 60 58.6 Z" fill="#241420" />
      </g>
    </svg>
  );
}

// Explosion: ember core with two shock rings and three drifting shards —
// quieter than the old five-shard burst.
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <circle cx="55" cy="55" r="40" fill="none" stroke="#ffbd6f" strokeWidth="1.5" opacity="0.22" />
      <circle cx="55" cy="55" r="27" fill="none" stroke="#ffd98f" strokeWidth="1.8" opacity="0.42" />
      {(
        [
          [-150, "#ff9d52"],
          [-35, "#ffd98f"],
          [100, "#ff9d52"],
        ] as const
      ).map(([angle, color], i) => (
        <g transform={`rotate(${angle} 55 55)`} key={`shard${i}`}>
          <polygon points="18,51 31,55 18,59" fill={color} />
        </g>
      ))}
      <circle cx="55" cy="55" r="12" fill="#ff8a3c" />
      <circle cx="55" cy="55" r="6.5" fill="#ffd98f" />
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

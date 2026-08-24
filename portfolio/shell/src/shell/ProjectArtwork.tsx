import { useRef, type CSSProperties, type PointerEvent } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import type { ProjectPresentationPart } from "../../../contracts/project-presentation";

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
          {presentation.centerMark === "kitty" ? (
            <KittyCenterMark />
          ) : (
            presentation.centerLabel
          )}
        </span>
      </div>
      <span className="project-artwork-note">{presentation.note}</span>
    </div>
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

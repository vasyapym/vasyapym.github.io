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
          {presentation.centerLabel}
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

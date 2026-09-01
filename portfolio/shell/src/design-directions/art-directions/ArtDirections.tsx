import type { PointerEvent, ReactElement } from "react";
import { useRef } from "react";
import type { ProjectModule } from "../../../../contracts/project-module";
import { INCUMBENT_MARKS } from "../../shell/ProjectArtwork";
import { FoxMark as FoxA, KittyMark as KittyA, RaftMark as RaftA } from "./variantA";
import { FoxMark as FoxB, KittyMark as KittyB, RaftMark as RaftB } from "./variantB";
import { FoxMark as FoxC, KittyMark as KittyC, RaftMark as RaftC } from "./variantC";
import { RaftCandidateA, RaftCandidateB } from "./raftCybernetic";
import { TrailCandidateA, TrailCandidateB } from "./practiceMapRethink";
import "./art-directions.css";

type ArtDirectionsProps = {
  projects: readonly ProjectModule[];
};

type VariantDraft = {
  id: string;
  label: string;
  name: string;
  thesis: string;
  marks: { raft: () => ReactElement; kitty: () => ReactElement; fox: () => ReactElement };
};

const DRAFTS: readonly VariantDraft[] = [
  {
    id: "a",
    label: "variant a",
    name: "Two-Ink Plate",
    thesis:
      "Every card in the hero's own two inks — neutral ramp + one ochre signal element. Identity moves into subject and composition.",
    marks: { raft: RaftA, kitty: KittyA, fox: FoxA },
  },
  {
    id: "b",
    label: "variant b",
    name: "Spot-Colour Overprint",
    thesis:
      "Each card keeps its identity hue as a confined second ink (~10–15% coverage): halftone overprint + one focal element, neutrals dominate.",
    marks: { raft: RaftB, kitty: KittyB, fox: FoxB },
  },
  {
    id: "c",
    label: "variant c",
    name: "Blueprint on Ink",
    thesis:
      "Drafting grammar: thin measured strokes, dashed guides, crosshairs, dimension ticks. Hue drops to a single ochre accent per card.",
    marks: { raft: RaftC, kitty: KittyC, fox: FoxC },
  },
];

// Hero dither ramp — the reference ink set every variant is judged against.
const HERO_RAMP = ["#26333b", "#465059", "#7d7669", "#b6ac95", "#d49a5f", "#ecba7f"];

const VARIANT_MARK_IDS: Record<string, "raft" | "kitty" | "fox"> = {
  "raft-cluster": "raft",
  "kitty-run": "kitty",
  "evening-forest": "fox",
};

// Raft cybernetic reconcept round: incumbent vs two candidates from the
// delegated brief (BRIEF-card-art-raft-cybernetic.md). Owner picks A or B;
// cards render left to right with their name as the topline.
const RAFT_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "current · control loop (candidate b, adopted)",
    Mark: INCUMBENT_MARKS.raft,
  },
  {
    id: "a",
    topline: "candidate a · broadcast mesh",
    Mark: RaftCandidateA,
  },
  {
    id: "b",
    topline: "candidate b · control loop",
    Mark: RaftCandidateB,
  },
];

// Practice Map rethink round: incumbent vs two candidates from the delegated
// brief (BRIEF-card-art-practicemap-rethink.md). Owner picks A or B.
const TRAIL_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "current · terraced climb (candidate a, adopted)",
    Mark: INCUMBENT_MARKS.trail,
  },
  {
    id: "a",
    topline: "candidate a · terraced climb",
    Mark: TrailCandidateA,
  },
  {
    id: "b",
    topline: "candidate b · constellation index",
    Mark: TrailCandidateB,
  },
];

type RoundEntry = { id: string; topline: string; Mark?: () => ReactElement };

// One comparison round: shared head + the project's card rendered per entry.
function RoundSection({
  label,
  name,
  projectId,
  thesis,
  round,
  projects,
}: {
  label: string;
  name: string;
  projectId: string;
  thesis: string;
  round: readonly RoundEntry[];
  projects: readonly ProjectModule[];
}) {
  return (
    <section className="art-variant-section" aria-label={label}>
      <div className="art-variant-head">
        <p className="art-variant-label">{label}</p>
        <h2 className="art-variant-name">{name}</h2>
        <p className="art-variant-thesis">{thesis}</p>
      </div>
      <div className="signal-index-grid">
        {(() => {
          const project = projects.find((entry) => entry.id === projectId);
          if (!project) return null;
          return round.map(({ id, topline, Mark }) => {
            if (!Mark) return null;
            return <DraftCard key={id} project={project} index={0} Mark={Mark} topline={topline} />;
          });
        })()}
      </div>
    </section>
  );
}

// Mirror of ProjectArtwork's pointer tilt so draft cards behave like landing cards.
function useTilt() {
  const objectRef = useRef<HTMLDivElement>(null);

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

  return { objectRef, handlePointerMove, resetPointer };
}

function DraftCard({
  project,
  index,
  Mark,
  topline,
}: {
  project: ProjectModule;
  index: number;
  Mark: () => ReactElement;
  topline?: string;
}) {
  const { objectRef, handlePointerMove, resetPointer } = useTilt();

  return (
    <a
      className="signal-index-card"
      id={`art-${project.id}`}
      href={`/projects/${project.id}/`}
      onClick={(event) => event.preventDefault()}
      aria-label={`${project.title} (draft card, not navigable)`}
    >
      <div className="project-artwork" aria-hidden="true">
        <div ref={objectRef} className="project-artwork-object">
          <span className="project-artwork-center">
            <Mark />
          </span>
        </div>
      </div>
      <div className="gem-card-copy">
        <p className="gem-card-topline">
          {topline ?? `${String(index + 1).padStart(2, "0")}${project.tag ? ` · ${project.tag}` : ""}`}
        </p>
        <h3 className="gem-card-title">{project.title}</h3>
        <p className="gem-card-desc">{project.description}</p>
        <div className="gem-card-footer">
          <span className="gem-card-tech">{project.technologies.join(" · ")}</span>
          <span className="gem-card-open">
            open <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </a>
  );
}

export default function ArtDirections({ projects }: ArtDirectionsProps) {
  return (
    <main className="signal-index art-directions">
      <div className="signal-index-shell">
        <header className="art-directions-head">
          <p className="art-directions-kicker">card artwork · consistency round</p>
          <h1 className="art-directions-title">three illustration languages</h1>
          <p className="art-directions-note">
            Raft Cluster, Cat Runner and Evening Forest are redrawn per variant; the other
            three cards show the current marks as reference. Hover a card for the lift,
            tilt and halo response.
          </p>
          <div className="art-directions-ramp" aria-hidden="true">
            {HERO_RAMP.map((ink) => (
              <span key={ink} className="art-directions-swatch" style={{ background: ink }} />
            ))}
            <span className="art-directions-ramp-label">hero dither ramp · the two inks</span>
          </div>
        </header>

        {DRAFTS.map((draft) => (
          <section
            className="art-variant-section"
            key={draft.id}
            aria-label={`Variant ${draft.id.toUpperCase()} — ${draft.name}`}
          >
            <div className="art-variant-head">
              <p className="art-variant-label">{draft.label}</p>
              <h2 className="art-variant-name">{draft.name}</h2>
              <p className="art-variant-thesis">{draft.thesis}</p>
            </div>
            <div className="signal-index-grid">
              {projects.map((project, index) => {
                const draftId = VARIANT_MARK_IDS[project.id];
                const Mark = draftId ? draft.marks[draftId] : INCUMBENT_MARKS[project.presentation.centerMark];
                if (!Mark) return null;
                return <DraftCard project={project} index={index} Mark={Mark} key={project.id} />;
              })}
            </div>
          </section>
        ))}

        <RoundSection
          label="raft reconcept"
          name="cybernetic round"
          projectId="raft-cluster"
          thesis="The columns mark reads as a clay model — both candidates redraw Raft as a networked, self-regulating system: nodes, message flow, a visible feedback loop. Hover a card for the lift, tilt and halo response."
          round={RAFT_ROUND}
          projects={projects}
        />

        <RoundSection
          label="practice map rethink"
          name="a map that feels alive"
          projectId="practice-map"
          thesis="The survey grid + pins read as boring — both candidates keep the purpose (territory, here, next) but add a focal drama: a lit summit being climbed, or one blazing star in a personal constellation."
          round={TRAIL_ROUND}
          projects={projects}
        />
      </div>
    </main>
  );
}

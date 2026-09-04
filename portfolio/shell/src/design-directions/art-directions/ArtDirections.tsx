import type { PointerEvent, ReactElement } from "react";
import { useRef } from "react";
import type { ProjectModule } from "../../../../contracts/project-module";
import { INCUMBENT_MARKS } from "../../shell/ProjectArtwork";
import { FoxMark as FoxA, KittyMark as KittyA, RaftMark as RaftA } from "./variantA";
import { FoxMark as FoxB, KittyMark as KittyB, RaftMark as RaftB } from "./variantB";
import { FoxMark as FoxC, KittyMark as KittyC, RaftMark as RaftC } from "./variantC";
import { RaftCandidateA, RaftCandidateB } from "./raftCybernetic";
import { TrailCandidateA, TrailCandidateB } from "./practiceMapRethink";
import { RaftCandidateA as RaftRethinkA, RaftCandidateB as RaftRethinkB } from "./raftRethink";
import { RaftCandidateA as RaftRethink2A, RaftCandidateB as RaftRethink2B } from "./raftRethink2";
import { RaftCandidateA as RaftRethink3A, RaftCandidateB as RaftRethink3B } from "./raftRethink3";
import { RaftCandidateA as RaftRethink4A, RaftCandidateB as RaftRethink4B } from "./raftRethink4";
import {
  RaftCandidateA as RaftTenA,
  RaftCandidateB as RaftTenB,
  RaftCandidateC as RaftTenC,
  RaftCandidateD as RaftTenD,
  RaftCandidateE as RaftTenE,
  RaftCandidateF as RaftTenF,
  RaftCandidateG as RaftTenG,
  RaftCandidateH as RaftTenH,
  RaftCandidateI as RaftTenI,
  RaftCandidateJ as RaftTenJ,
} from "./raftRethink5";
import {
  RaftVaultA,
  RaftVaultB,
  RaftVaultC,
  RaftVaultD,
  RaftVaultE,
  RaftVaultF,
  RaftVaultG,
  RaftVaultH,
  RaftVaultI,
  RaftVaultJ,
} from "./raftRethink6";
import {
  RaftCyberA,
  RaftCyberB,
  RaftCyberC,
  RaftCyberD,
  RaftCyberE,
  RaftCyberF,
  RaftCyberG,
  RaftCyberH,
  RaftCyberI,
} from "./raftRethink7";
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
    topline: "then-current · control loop (candidate b, adopted)",
    Mark: RaftCandidateB,
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

// Raft visual-interest rethink round: incumbent vs two candidates from the
// delegated brief (BRIEF-card-art-raft-rethink.md). Owner picks A or B.
const RAFT_RETHINK_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "then-current · control loop (adopted, reads boring)",
    Mark: RaftCandidateB,
  },
  {
    id: "a",
    topline: "candidate a · succession",
    Mark: RaftRethinkA,
  },
  {
    id: "b",
    topline: "candidate b · the log raft",
    Mark: RaftRethinkB,
  },
];

// Raft visual-interest rethink, round 2: both round-1 scene candidates were
// rejected ("these are not it") — these two keep the architecture-diagram
// vocabulary and get interest from composition only. Owner picks A or B.
const RAFT_RETHINK2_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "then-current · control loop (adopted, reads boring)",
    Mark: RaftCandidateB,
  },
  {
    id: "a",
    topline: "candidate a · replication stream",
    Mark: RaftRethink2A,
  },
  {
    id: "b",
    topline: "candidate b · write frontier",
    Mark: RaftRethink2B,
  },
];

// Raft visual-interest rethink, round 3: round 2's write frontier had the
// right idea but played it safe ("conservative/safe") — these two fill the
// plate at Practice-Map boldness while keeping the diagram vocabulary.
// Owner picks A or B.
const RAFT_RETHINK3_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "then-current · control loop (adopted, reads boring)",
    Mark: RaftCandidateB,
  },
  {
    id: "a",
    topline: "candidate a · ledger span",
    Mark: RaftRethink3A,
  },
  {
    id: "b",
    topline: "candidate b · two-tier consensus",
    Mark: RaftRethink3B,
  },
];

// Raft visual-interest rethink, round 4: the grammar break. Rounds 1–3 all
// reused one micro-grammar (stepped-cap discs, hairline links, tick rows) —
// these two abandon it entirely while keeping the family technique. Owner
// picks A or B.
const RAFT_RETHINK4_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "then-current · control loop (adopted, reads boring)",
    Mark: RaftCandidateB,
  },
  {
    id: "a",
    topline: "candidate a · quorum overprint",
    Mark: RaftRethink4A,
  },
  {
    id: "b",
    topline: "candidate b · copper trace",
    Mark: RaftRethink4B,
  },
];

// Raft visual-interest rethink, round 5: the owner calls the incumbent
// "good but boring" and asked for a fresh concept — ten candidates from the
// delegated brief (BRIEF-card-art-raft-rethink-5.md), each a different
// graphic language inside the family print technique. Owner picks one.
const RAFT_TEN_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "current",
    topline: "then-current · control loop (good, boring)",
    Mark: RaftCandidateB,
  },
  { id: "a", topline: "candidate a · metro line", Mark: RaftTenA },
  { id: "b", topline: "candidate b · gear train", Mark: RaftTenB },
  { id: "c", topline: "candidate c · punched tape", Mark: RaftTenC },
  { id: "d", topline: "candidate d · orrery", Mark: RaftTenD },
  { id: "e", topline: "candidate e · printing press", Mark: RaftTenE },
  { id: "f", topline: "candidate f · dish array", Mark: RaftTenF },
  { id: "g", topline: "candidate g · honeycomb", Mark: RaftTenG },
  { id: "h", topline: "candidate h · suspension bridge", Mark: RaftTenH },
  { id: "i", topline: "candidate i · vault quorum", Mark: RaftTenI },
  { id: "j", topline: "candidate j · beacon chain", Mark: RaftTenJ },
];

// Raft vault round: the owner picked candidate I "vault quorum" from round 5
// and asked for more nodes — ten evolutions of the locked vault identity
// (BRIEF-card-art-raft-rethink-6.md), 5-7 keyholes each with a legible turned
// majority, one added mechanism per variant. Owner picks one.
const RAFT_VAULT_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "base",
    topline: "base · vault quorum (round-5 pick)",
    Mark: RaftTenI,
  },
  { id: "a", topline: "candidate a · seven-key majority", Mark: RaftVaultA },
  { id: "b", topline: "candidate b · combination dial", Mark: RaftVaultB },
  { id: "c", topline: "candidate c · time-lock sweep", Mark: RaftVaultC },
  { id: "d", topline: "candidate d · door ajar", Mark: RaftVaultD },
  { id: "e", topline: "candidate e · safe-deposit wall", Mark: RaftVaultE },
  { id: "f", topline: "candidate f · turning wave", Mark: RaftVaultF },
  { id: "g", topline: "candidate g · bolt-work ring", Mark: RaftVaultG },
  { id: "h", topline: "candidate h · tumbler stack", Mark: RaftVaultH },
  { id: "i", topline: "candidate i · deposit slot", Mark: RaftVaultI },
  { id: "j", topline: "candidate j · quorum bell", Mark: RaftVaultJ },
];

// Raft cybernetic round: the adopted vault reads as good but boring and the
// owner pointed at a circuit-organism reference (reference-images/
// cybernetics.jpg) — ten cybernetic variants brainstormed by the chat model
// (BRIEF-card-art-raft-rethink-7.md). The model timed out after candidate I,
// so the round ships nine candidates A-I. Owner picks one.
const RAFT_CYBER_ROUND: readonly {
  id: string;
  topline: string;
  Mark?: () => ReactElement;
}[] = [
  {
    id: "base",
    topline: "base · vault seven-key majority (incumbent)",
    Mark: RaftVaultA,
  },
  { id: "a", topline: "candidate a · ganglion", Mark: RaftCyberA },
  { id: "b", topline: "candidate b · bus arbiter", Mark: RaftCyberB },
  { id: "c", topline: "candidate c · write frontier column", Mark: RaftCyberC },
  { id: "d", topline: "candidate d · repeater chain", Mark: RaftCyberD },
  { id: "e", topline: "candidate e · clock tree", Mark: RaftCyberE },
  { id: "f", topline: "candidate f · token ring", Mark: RaftCyberF },
  { id: "g", topline: "candidate g · sensor bus", Mark: RaftCyberG },
  { id: "h", topline: "candidate h · shift-register ripple", Mark: RaftCyberH },
  { id: "i", topline: "candidate i · transceiver broadcast", Mark: RaftCyberI },
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

        <RoundSection
          label="raft visual-interest rethink"
          name="a scene, not a schematic"
          projectId="raft-cluster"
          thesis="The control loop is correct but static — both candidates stage a moment instead: the election the tagline describes (a crashed leader, a crowned successor, a vote in flight), or the metaphor made literal (the replicated log as a lashed raft carrying the cluster). Hover a card for the lift, tilt and halo response."
          round={RAFT_RETHINK_ROUND}
          projects={projects}
        />

        <RoundSection
          label="raft rethink · round 2"
          name="system design, instantly"
          projectId="raft-cluster"
          thesis="Both scene candidates were rejected — the mark must read as system design in under a second. These two keep the architecture-diagram vocabulary (nodes, rails, signals, logs) and take their interest from composition: a dominant leader fanning live traffic, or a shared log bus with a bright write frontier. Hover a card for the lift, tilt and halo response."
          round={RAFT_RETHINK2_ROUND}
          projects={projects}
        />

        <RoundSection
          label="raft rethink · round 3"
          name="bold: fill the plate"
          projectId="raft-cluster"
          thesis="Round 2's write frontier had the right idea but played it safe — these two keep the concept and fill the plate like the Practice Map climb: a monumental log structure edge to edge, a coral halftone committed band, a beacon frontier, and fuller instrumentation. Hover a card for the lift, tilt and halo response."
          round={RAFT_RETHINK3_ROUND}
          projects={projects}
        />

        <RoundSection
          label="raft rethink · round 4"
          name="the grammar break"
          projectId="raft-cluster"
          thesis="Rounds 1–3 all drew the same language — small discs, hairline links, tick rows. These two abandon it entirely: consensus as three giant halftone discs whose coral triple-overlap IS the quorum, or the log as a heavy copper trace with vias and a crowned write-head pad. Hover a card for the lift, tilt and halo response."
          round={RAFT_RETHINK4_ROUND}
          projects={projects}
        />

        <RoundSection
          label="raft rethink · round 5"
          name="ten concepts"
          projectId="raft-cluster"
          thesis="The control loop is good but boring — ten fresh concepts, ten different graphic languages inside the family print technique: metro line, gear train, punched tape, orrery, printing press, dish array, honeycomb, suspension bridge, vault quorum, beacon chain. Every mark keeps the system-design read: three nodes, crowned leader, committed vs future, one coral protagonist, a laggard's deficiency. Hover a card for the lift, tilt and halo response."
          round={RAFT_TEN_ROUND}
          projects={projects}
        />

        <RoundSection
          label="raft vault round"
          name="evolving the vault quorum"
          projectId="raft-cluster"
          thesis="The vault quorum won round 5 — the owner asked for more nodes. Ten evolutions of the locked vault identity, 5-7 keyholes each with a legible turned majority, each adding one mechanism: quorum span, combination dial, time-lock sweep, open leaf, door wall, turn-wave, bolt-work ring, tumbler stack, deposit slot, alarm bell. Hover a card for the lift, tilt and halo response."
          round={RAFT_VAULT_ROUND}
          projects={projects}
        />

        <RoundSection
          label="raft rethink · round 7"
          name="cybernetic directions"
          projectId="raft-cluster"
          thesis="The adopted vault is good but boring — the owner pointed at a circuit-organism reference and asked for the cybernetic theme translated into the card grammar. Nine concepts brainstormed by the chat model: processor soma with dendrites, bus arbiter, write-frontier column, repeater chain, clock tree, token ring, sensor bus into a controller, shift-register ripple, transceiver broadcast. Every mark keeps the system-design read: crowned leader, committed vs future, one coral protagonist, a laggard's deficiency. Hover a card for the lift, tilt and halo response."
          round={RAFT_CYBER_ROUND}
          projects={projects}
        />
      </div>
    </main>
  );
}

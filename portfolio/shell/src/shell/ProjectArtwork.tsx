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

// Current marks, exported for the /art-directions comparison page so the
// draft sections can render them next to the round's variants.
export const INCUMBENT_MARKS: Partial<Record<ProjectCenter, () => ReactElement>> = {
  raft: RaftCenterMark,
  blast: BlastCenterMark,
  spiral: SpiralCenterMark,
  trail: TrailCenterMark,
};

/* ── 1 · Raft Cluster — coral spot ink, the cluster as one cybernetic feedback ring ── */
function RaftCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-raft-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <pattern id="gem-raft-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-raft-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff6a5f" />
        </pattern>
        <clipPath id="gem-raft-leader"><circle cx="130" cy="38" r="12" /></clipPath>
        <clipPath id="gem-raft-fdr"><circle cx="174" cy="106" r="10.5" /></clipPath>
        <clipPath id="gem-raft-fll"><circle cx="86" cy="106" r="10.5" /></clipPath>
      </defs>

      {/* backdrop + halo (only elements allowed past safe area) */}
      <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-raft-sparse)" opacity="0.09" />
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="82" rx="60" ry="42" fill="url(#gem-raft-halo)" opacity="0.12" />

      {/* the feedback loop */}
      <circle cx="130" cy="82" r="50" fill="none" stroke="#465059" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 6" opacity="0.65" />

      {/* feedback accent (election answer travelling back, ~10 o'clock) */}
      <path d="M83 64.9 A50 50 0 0 1 91.7 49.85" fill="none" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M-3 -3 L0 0 L-3 3" fill="none" stroke="#b6ac95" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(86 55) rotate(-100)" />

      {/* lagging node's missed-signal gap just before lower-left node */}
      <path d="M92.85 115.45 A50 50 0 0 1 86.7 107" fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />

      {/* clockwise direction chevrons at 11, 5, 7 o'clock */}
      <g fill="none" stroke="#7d7669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(105 38.7) rotate(330)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(155 125.3) rotate(150)" />
        <path d="M-3 -3 L0 0 L-3 3" transform="translate(105 125.3) rotate(210)" />
      </g>

      {/* lower-right follower */}
      <g clipPath="url(#gem-raft-fdr)">
        <circle cx="174" cy="106" r="10.5" fill="#26333b" />
        <circle cx="174" cy="104" r="7.5" fill="#465059" />
        <circle cx="174" cy="102" r="4.5" fill="#7d7669" />
      </g>
      <circle cx="174" cy="106" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />

      {/* lower-left follower (laggard, de-saturated) */}
      <g clipPath="url(#gem-raft-fll)">
        <circle cx="86" cy="106" r="10.5" fill="#26333b" />
        <circle cx="86" cy="104" r="7.5" fill="#465059" />
      </g>
      <circle cx="86" cy="106" r="12" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />

      {/* leader (top) */}
      <g clipPath="url(#gem-raft-leader)">
        <circle cx="130" cy="38" r="12" fill="#26333b" />
        <circle cx="130" cy="36" r="9" fill="#465059" />
        <circle cx="130" cy="34" r="5.5" fill="#7d7669" />
        <circle cx="130" cy="34" r="8" fill="url(#gem-raft-dense)" opacity="0.75" />
      </g>
      <circle cx="130" cy="38" r="16.5" fill="none" stroke="#7d2723" strokeWidth="3.5" opacity="0.9" />
      <g stroke="#ff6a5f" strokeWidth="1.5" strokeLinecap="round">
        <line x1="134.3" y1="22.06" x2="135.57" y2="17.23" />
        <line x1="125.73" y1="22.06" x2="124.43" y2="17.23" />
      </g>

      {/* committed shared state at loop centre (settled memory) */}
      <circle cx="130" cy="82" r="13" fill="none" stroke="#465059" strokeWidth="1" opacity="0.5" />
      <rect x="122" y="74.5" width="16" height="3.5" fill="#465059" />
      <rect x="122" y="80.5" width="16" height="3.5" fill="#7d7669" />
      <rect x="122" y="86.5" width="16" height="3.5" fill="#b6ac95" />

      {/* signals in flight */}
      <circle cx="92" cy="108" r="6" fill="url(#gem-raft-dense)" opacity="0.8" />
      <rect x="156.5" y="47.5" width="13" height="7" rx="3.5" fill="#ff6a5f" transform="rotate(55 163 51)" />

      {/* white glints (3 max) */}
      <circle cx="126" cy="34" r="1.5" fill="#f4efe4" />
      <rect x="123" y="75" width="1.5" height="1.5" fill="#f4efe4" />
      <rect x="161.5" y="49" width="1.5" height="1.5" fill="#f4efe4" transform="rotate(55 163 51)" />
    </svg>
  );
}

/* ── 2 · Cat Runner — pink spot ink, Hello-Kitty head mark in motion ── */
function KittyCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-cat-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ff8fbf" />
        </pattern>
        <pattern id="gem-cat-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-cat-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#7d7669" />
        </pattern>
        <clipPath id="gem-cat-head-clip">
          <ellipse cx="136" cy="76" rx="40" ry="30" />
        </clipPath>
      </defs>
      {/* wide sparse neutral backdrop field */}
      <ellipse cx="136" cy="78" rx="104" ry="62" fill="url(#gem-cat-sparse)" opacity="0.09" />
      {/* single neutral halo */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="136" cy="78" rx="62" ry="40" fill="url(#gem-cat-halo)" opacity="0.12" />
      {/* ordered horizontal speed dashes */}
      <rect x="26" y="72" width="40" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      <rect x="26" y="84" width="30" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      <rect x="26" y="96" width="20" height="6" rx="3" fill="#7d7669" opacity="0.4" />
      {/* one clean ground curve */}
      <path d="M 46 120 Q 140 112 236 118" stroke="#465059" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* bullet-time dash trail on the ground */}
      <rect x="100" y="114" width="60" height="5" rx="2.5" fill="url(#gem-cat-dense)" opacity="0.45" />
      {/* pink halftone ghost echo — head-only, close behind-left */}
      <g transform="translate(-40 4) scale(0.94)" opacity="0.14">
        <ellipse cx="136" cy="76" rx="40" ry="30" fill="url(#gem-cat-dense)" />
        <polygon points="106,62 94,38 122,54" fill="url(#gem-cat-dense)" />
        <polygon points="166,62 178,38 150,54" fill="url(#gem-cat-dense)" />
      </g>
      {/* ears (bases buried, painted before head) */}
      <polygon points="106,62 94,38 122,54" fill="#f4efe4" />
      <polygon points="166,62 178,38 150,54" fill="#f4efe4" />
      {/* head dominates — the whole mark */}
      <ellipse cx="136" cy="76" rx="40" ry="30" fill="#eeeae0" />
      <g clipPath="url(#gem-cat-head-clip)">
        <ellipse cx="136" cy="90" rx="40" ry="30" fill="#b6ac95" />
      </g>
      {/* whisker spikes — paper, punching past the head edge */}
      <path d="M 100 68 L 78 64" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 76 L 76 76" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 100 84 L 78 88" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 68 L 194 64" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 76 L 196 76" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 172 84 L 194 88" stroke="#eeeae0" strokeWidth="2.2" strokeLinecap="round" />
      {/* negative-space eyes, wide-set on one line */}
      <ellipse cx="118" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      <ellipse cx="154" cy="78" rx="2.8" ry="4.2" fill="#0b1317" />
      {/* bow — the single pink signifier, overlapping right ear base */}
      <ellipse cx="164" cy="54" rx="6" ry="5" fill="#ff8fbf" />
      <ellipse cx="176" cy="54" rx="6" ry="5" fill="#ff8fbf" />
      <circle cx="170" cy="55" r="3.2" fill="#a33a72" />
      {/* single tiny glint */}
      <rect x="122" y="58" width="2.6" height="2.6" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}

/* ── 3 · Evening Forest — teal spot ink on neutral dusk ── */
function FoxCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-fox-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#4fd1a5" />
        </pattern>
        <pattern id="gem-fox-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <clipPath id="gem-fox-tree"><path d="M 130 60 L 156 124 Q 130 116 104 124 Z" /></clipPath>
        <clipPath id="gem-fox-canopy"><rect x="40" y="78" width="180" height="20" /></clipPath>
      </defs>
      {/* wide sparse neutral backdrop */}
      <ellipse cx="130" cy="80" rx="104" ry="62" fill="url(#gem-fox-sparse)" opacity="0.09" />
      {/* halo — TEAL dots at low opacity, cold-dusk hover glow */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="80" rx="60" ry="40" fill="url(#gem-fox-dense)" opacity="0.12" />
      {/* moon: cold paper disc + neutral cap + hairline teal rim */}
      <circle cx="202" cy="46" r="15" fill="#eeeae0" />
      <circle cx="199" cy="43" r="8" fill="#b6ac95" />
      <circle cx="202" cy="46" r="15" fill="none" stroke="#4fd1a5" strokeWidth="1.2" />
      {/* back layer — lighter neutral (far reads lighter) */}
      <g opacity="0.5">
        <path d="M 66 112 L 78 82 L 90 112 Z" fill="#7d7669" />
        <path d="M 150 112 L 162 84 L 174 112 Z" fill="#7d7669" />
        <path d="M 108 112 Q 96 88 120 84 Q 132 92 128 112 Z" fill="#465059" />
      </g>
      {/* ground hairline */}
      <path d="M 30 128 Q 130 112 230 128" stroke="#26333b" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* mid-layer bushes — medium neutral */}
      <path d="M 62 124 Q 46 92 82 90 Q 100 98 96 124 Z" fill="#465059" opacity="0.7" />
      <path d="M 178 124 Q 166 96 198 92 Q 214 100 210 124 Z" fill="#465059" opacity="0.7" />
      {/* teal canopy halftone band across the mid-layer */}
      <g clipPath="url(#gem-fox-canopy)">
        <rect x="40" y="78" width="180" height="20" fill="url(#gem-fox-dense)" opacity="0.5" />
      </g>
      {/* front center tree — darkest neutral, stepped caps */}
      <path d="M 130 60 L 156 124 Q 130 116 104 124 Z" fill="#26333b" />
      <g clipPath="url(#gem-fox-tree)">
        <polygon points="130,60 104,124 130,124" fill="#465059" />
        <polygon points="130,60 116,108 126,108" fill="#7d7669" />
      </g>
      {/* neutral fireflies */}
      <circle cx="118" cy="66" r="2.6" fill="#b6ac95" />
      <circle cx="168" cy="80" r="2.4" fill="#b6ac95" />
      <circle cx="92" cy="82" r="2.2" fill="#b6ac95" />
      {/* white square glints */}
      <rect x="122" y="76" width="3.2" height="3.2" fill="#ffffff" opacity="0.55" />
      <rect x="124" y="96" width="2.8" height="2.8" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

/* ── 4 · Explosion — amber spot ink, ordered radial shatter ── */
function BlastCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-blast-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ffb347" />
        </pattern>
        <pattern id="gem-blast-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-blast-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#ffb347" />
        </pattern>
        <clipPath id="gem-blast-disc-clip">
          <circle cx="130" cy="80" r="26" />
        </clipPath>
        <clipPath id="gem-blast-shard45-clip">
          <polygon points="154,104 164,120 170,114" />
        </clipPath>
        <clipPath id="gem-blast-shard225-clip">
          <polygon points="106,56 96,40 90,46" />
        </clipPath>
      </defs>
      {/* wide sparse backdrop */}
      <ellipse cx="130" cy="80" rx="104" ry="64" fill="url(#gem-blast-sparse)" opacity="0.09" />
      {/* amber halo */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="130" cy="80" rx="60" ry="42" fill="url(#gem-blast-halo)" opacity="0.12" />
      {/* eight radial seam lines (the cracks) */}
      <path d="M160,80 L170,80 M151,101 L158,108 M130,110 L130,120 M109,101 L102,108 M100,80 L90,80 M109,59 L102,52 M130,50 L130,40 M151,59 L158,52" stroke="#7d7669" strokeWidth="1.5" opacity="0.45" fill="none" />
      {/* eight shards on exact radial angles */}
      <polygon points="164,80 190,85 190,75" fill="#b6ac95" />
      <polygon points="154,104 164,120 170,114" fill="#7d7669" />
      <polygon points="130,114 135,140 125,140" fill="#465059" />
      <polygon points="106,104 90,114 96,120" fill="#b6ac95" />
      <polygon points="96,80 70,75 70,85" fill="#7d7669" />
      <polygon points="106,56 96,40 90,46" fill="#465059" />
      <polygon points="130,46 135,20 125,20" fill="#b6ac95" />
      <polygon points="154,56 170,46 164,40" fill="#eeeae0" />
      {/* amber halftone overprint caps on the two opposite shards */}
      <rect x="150" y="100" width="26" height="26" fill="url(#gem-blast-dense)" opacity="0.7" clipPath="url(#gem-blast-shard45-clip)" />
      <rect x="86" y="36" width="26" height="26" fill="url(#gem-blast-dense)" opacity="0.7" clipPath="url(#gem-blast-shard225-clip)" />
      {/* central lantern disc + stepped inner cap + hairline rim */}
      <circle cx="130" cy="80" r="26" fill="#26333b" />
      <circle cx="127" cy="77" r="20" fill="#465059" clipPath="url(#gem-blast-disc-clip)" />
      <circle cx="130" cy="80" r="26" fill="none" stroke="#465059" strokeWidth="1" opacity="0.6" />
      {/* amber ignition core (three stacked fills) */}
      <circle cx="127" cy="77" r="9" fill="#ffb347" />
      <circle cx="125.5" cy="75.5" r="4" fill="#ffcf87" />
      <circle cx="124" cy="74" r="1.8" fill="#fff0cf" />
      {/* three embers on radial lines */}
      <circle cx="194" cy="103" r="2.2" fill="#b6ac95" />
      <circle cx="66" cy="57" r="2.2" fill="#b6ac95" />
      <circle cx="194" cy="57" r="2.2" fill="#b6ac95" />
      {/* white glint */}
      <rect x="123.3" y="73.3" width="1.4" height="1.4" fill="#ffffff" />
    </svg>
  );
}

/* ── 5 · Planck to Now — violet spot ink, Big Bang epoch ripples ── */
function SpiralCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-spiral-dense" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#a98cff" />
        </pattern>
        <pattern id="gem-spiral-sparse" patternUnits="userSpaceOnUse" width="11" height="11">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-spiral-halo" patternUnits="userSpaceOnUse" width="7" height="7">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#a98cff" />
        </pattern>
      </defs>
      {/* scaled composition group: smaller ripples, seated right of centre so
          the convergence (perceived epicentre) balances the right-hand fan */}
      <g transform="translate(54 24.6) scale(0.66)">
        {/* wide sparse backdrop */}
        <ellipse cx="130" cy="84" rx="104" ry="64" fill="url(#gem-spiral-sparse)" opacity="0.09" />
        {/* violet halo (CSS pulse hooks here) */}
        <ellipse className="gem-halo" style={haloVar(0.12)} cx="52" cy="84" rx="60" ry="42" fill="url(#gem-spiral-halo)" opacity="0.12" />
        {/* four nested right-opening epoch ripple bands (outer → inner) */}
        <path d="M 52 10 A 165 74 0 0 1 52 158" fill="none" stroke="#b6ac95" strokeWidth="9" strokeLinecap="round" opacity="0.5" />
        <path d="M 52 26 A 130 58 0 0 1 52 142" fill="none" stroke="#7d7669" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <path d="M 52 42 A 95 42 0 0 1 52 126" fill="none" stroke="#465059" strokeWidth="9" strokeLinecap="round" opacity="0.75" />
        <path d="M 52 58 A 60 26 0 0 1 52 110" fill="none" stroke="#26333b" strokeWidth="9" strokeLinecap="round" opacity="0.9" />
        {/* singularity (stacked fills + deep containment ring) */}
        <circle cx="52" cy="84" r="11" fill="none" stroke="#4b3a8c" strokeWidth="1.5" opacity="0.8" />
        <circle cx="52" cy="84" r="7" fill="#a98cff" />
        <circle cx="52" cy="84" r="3" fill="#efe7ff" />
        {/* violet "now" frontier: rightmost segment of band 4 overdrawn */}
        <path d="M 210 62 A 165 74 0 0 1 210 106" fill="none" stroke="#a98cff" strokeWidth="10" strokeLinecap="round" opacity="0.9" />
        <circle cx="217" cy="84" r="3" fill="#a98cff" />
        <circle cx="217" cy="84" r="1.4" fill="#efe7ff" />
        {/* star field between bands (increasing outward) */}
        <circle cx="100" cy="84" r="1.6" fill="#b6ac95" />
        <circle cx="124" cy="62" r="1.8" fill="#7d7669" />
        <circle cx="150" cy="102" r="2.0" fill="#b6ac95" />
        <circle cx="176" cy="48" r="2.2" fill="#7d7669" />
        <circle cx="192" cy="110" r="2.4" fill="#b6ac95" />
        <circle cx="206" cy="66" r="2.6" fill="#7d7669" />
        {/* hero four-point star */}
        <polygon points="168,79 169.6,82.4 173,84 169.6,85.6 168,89 166.4,85.6 163,84 166.4,82.4" fill="#eeeae0" opacity="0.9" />
        {/* white glint */}
        <rect x="215.4" y="82.4" width="1.3" height="1.3" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* ── 6 · Practice Map — sky spot ink, terraced climb to a lit summit ── */
function TrailCenterMark() {
  return (
    <svg viewBox="0 0 260 160" aria-hidden="true">
      <defs>
        <pattern id="gem-trail-dense" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <pattern id="gem-trail-sparse" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="5.5" cy="5.5" r="1.6" fill="#7d7669" />
        </pattern>
        <pattern id="gem-trail-halo" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#5cc8ff" />
        </pattern>
        <clipPath id="gem-trail-summit">
          <circle cx="148" cy="84" r="8" />
        </clipPath>
      </defs>

      {/* sparse printed backdrop (may exceed safe area) */}
      <ellipse cx="130" cy="82" rx="104" ry="64" fill="url(#gem-trail-sparse)" opacity="0.09" />
      {/* halo — pulse binds to class */}
      <ellipse className="gem-halo" style={haloVar(0.12)} cx="148" cy="84" rx="60" ry="42" fill="url(#gem-trail-halo)" opacity="0.12" />

      {/* FOUR nested contour loops (wobbled ellipses = terrain) */}
      <path d="M 220 78 C 224 108 186 140 148 140 C 110 142 78 112 76 84 C 74 56 112 30 150 28 C 188 26 218 50 220 78 Z" fill="none" stroke="#b6ac95" strokeWidth="1" opacity="0.3" />
      <path d="M 204 76 C 208 102 178 132 148 132 C 118 134 92 108 92 84 C 90 60 120 38 148 36 C 176 34 202 52 204 76 Z" fill="none" stroke="#7d7669" strokeWidth="1" opacity="0.4" />
      <path d="M 188 80 C 192 100 170 118 148 118 C 126 120 108 102 108 84 C 106 66 128 50 148 50 C 168 48 186 62 188 80 Z" fill="none" stroke="#7d7669" strokeWidth="1.2" opacity="0.55" />
      <path d="M 170 82 C 172 94 158 104 148 104 C 138 106 126 94 126 84 C 124 74 138 64 148 64 C 158 62 168 72 170 82 Z" fill="none" stroke="#465059" strokeWidth="1.5" opacity="0.7" />

      {/* CLIMBED BAND — partial lower arc overprint (halftone) */}
      <path d="M 188 80 C 192 100 170 118 148 118 C 126 120 108 102 108 84" fill="none" stroke="url(#gem-trail-dense)" strokeWidth="14" strokeLinecap="round" opacity="0.45" />

      {/* TRAIL from base camp up to summit base */}
      <path d="M 46 126 C 70 122 84 108 96 104 C 116 96 122 100 140 92" fill="none" stroke="#b6ac95" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" opacity="0.9" />
      <path d="M 68 117 L 73 112 L 76 116" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 114 100 L 119 95 L 122 99" fill="none" stroke="#7d7669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* BASE CAMP */}
      <line x1="38" y1="129" x2="56" y2="129" stroke="#7d7669" strokeWidth="1" opacity="0.7" />
      <path d="M 40 128 L 43.5 122 L 47 128 Z" fill="#465059" />
      <path d="M 47 128 L 50.5 122 L 54 128 Z" fill="#26333b" />

      {/* YOU ARE HERE pulse on the trail */}
      <circle cx="96" cy="104" r="6.5" fill="none" stroke="#5cc8ff" strokeWidth="1" opacity="0.5" />
      <circle cx="96" cy="104" r="3.5" fill="#5cc8ff" />

      {/* COMPASS ROSE (top-left) */}
      <g stroke="#7d7669" opacity="0.5">
        <line x1="34" y1="36" x2="34" y2="28" strokeWidth="1.2" />
        <line x1="34" y1="36" x2="34" y2="42" strokeWidth="1" />
        <line x1="34" y1="36" x2="40" y2="36" strokeWidth="1" />
        <line x1="34" y1="36" x2="28" y2="36" strokeWidth="1" />
        <line x1="30" y1="32" x2="38" y2="40" strokeWidth="0.75" />
        <line x1="38" y1="32" x2="30" y2="40" strokeWidth="0.75" />
      </g>

      {/* FLAG on the summit */}
      <line x1="148" y1="76" x2="148" y2="65" stroke="#b6ac95" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="148,64 161,68 148,72" fill="#5cc8ff" />

      {/* SUMMIT + HERE — dominant stepped-cap beacon */}
      <g clipPath="url(#gem-trail-summit)">
        <circle cx="148" cy="84" r="8" fill="#26333b" />
        <circle cx="148" cy="84" r="6" fill="#465059" />
        <circle cx="148" cy="84" r="4" fill="#7d7669" />
        <circle cx="147" cy="83" r="4.5" fill="#5cc8ff" />
        <circle cx="146.5" cy="82.5" r="1.5" fill="#d6f2ff" />
        <circle cx="145" cy="81" r="1" fill="#ffffff" />
      </g>
    </svg>
  );
}

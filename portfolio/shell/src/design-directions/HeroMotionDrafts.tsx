import type { ProjectModule } from "../../../contracts/project-module";
import referencePhoto from "../../../../reference-images/reference-1.jpg";
import liquidGlassPhoto from "../../../../reference-images/young-korean-artists-liquid-glass-sea.png";
import "./hero-motion-drafts.css";

type HeroMotionDraftsProps = {
  projects: readonly ProjectModule[];
};

type MotionDraft = {
  id: string;
  number: string;
  name: string;
  format: string;
  kicker: string;
  headline: string;
  subheadline: string;
  cta: string;
  looks: string;
  moves: string;
  fits: string;
  tone: string;
};

const MOTION_DRAFTS: readonly MotionDraft[] = [
  {
    id: "pixel-assembly",
    number: "01",
    name: "Pixel assembly",
    format: "bitmap type / portrait field",
    kicker: "Working prototypes",
    headline: "Ideas you can open and run.",
    subheadline:
      "Small software built to test what an idea actually does — before it hardens into a decision.",
    cta: "Open the experiments",
    looks:
      "Headline set in chunky bitmap glyphs over the portrait reference, like the poster's pixel letterforms printed across the figure.",
    moves:
      "Glyph cells scatter, then snap-settle into place on load. Hovering a word re-rasterizes its pixels; every few seconds a sweep re-sets one line.",
    fits:
      "The pixel grid says 'built from small parts' — the portfolio's whole argument, stated in the type itself.",
    tone: "Print-born, precise, tactile",
  },
  {
    id: "refraction-sea",
    number: "02",
    name: "Refraction sea",
    format: "shader field / full bleed",
    kicker: "Prototypes, not promises",
    headline: "See the mechanics before you commit.",
    subheadline:
      "Every project is a working model that shows how an idea behaves under real use.",
    cta: "Run the models",
    looks:
      "A full-bleed WebGL caustic surface — the liquid-glass reference rendered as slow-moving light on a dark sea, with project titles floating beneath it.",
    moves:
      "Bright caustic ridges act as a lens that warps whatever passes under them. The cursor drags the lens center; idle drift keeps the surface alive.",
    fits:
      "The distortion is the pitch: look through the surface and the mechanics underneath become visible.",
    tone: "Cinematic, fluid, technical",
  },
  {
    id: "pebble-physics",
    number: "03",
    name: "Pebble physics",
    format: "playful objects / black field",
    kicker: "Selected experiments",
    headline: "Built to be poked.",
    subheadline:
      "Working tools with nothing hidden. Open one and start pushing on it.",
    cta: "Push something",
    looks:
      "Flat pebbles, ellipses, and four-point stars in the poster's palette — pink, blue, green, tan — scattered across a black field behind oversized type.",
    moves:
      "A 2D physics field: objects tumble gently at rest, the pointer sweeps them with real impulse, and clicking the headline bursts the stars and re-scatters the field.",
    fits:
      "The hero itself invites the behavior the projects promise: nothing is precious, everything responds when touched.",
    tone: "Loud, playful, graphic",
  },
  {
    id: "specimen-turntable",
    number: "04",
    name: "Specimen turntable",
    format: "interactive 3D / dark plate",
    kicker: "Catalogue / 2026",
    headline: "Evidence of working ideas.",
    subheadline:
      "Specimen sheets from every build, arranged so you can lift one and read it.",
    cta: "Lift a sheet",
    looks:
      "The current catalogue plate rebuilt in shallow 3D: two paper sheets and the stitch marker as physical objects on a dark archival field.",
    moves:
      "Drag rotates the stack ±15° with inertia; a slow light sweep passes at idle; hovering tilts one sheet toward the camera for reading.",
    fits:
      "Carries forward the liked dark-catalogue direction and gives its plate the inspection depth a flat mock can't.",
    tone: "Archival, tactile, composed",
  },
  {
    id: "plotter-bench",
    number: "05",
    name: "Plotter bench",
    format: "generative drawing / paper field",
    kicker: "Drawn from the work",
    headline: "Every project starts as a line.",
    subheadline:
      "A plotting arm redraws the structure of each tool while you choose which to open.",
    cta: "Watch it draw",
    looks:
      "A simulated pen plotter on warm paper, drawing vector schematics of Code Layout and Practice Map stroke by stroke, tray of finished sheets at the side.",
    moves:
      "The arm traces each drawing from a per-visit seed; finished sheets slide to the tray; the occasional misdraw gets crossed out and redrawn — the only joke. Pointer speed modulates pace.",
    fits:
      "Shows process as spectacle: the site demonstrates how its own artifacts are constructed while you watch.",
    tone: "Crafted, wry, hands-on",
  },
  {
    id: "vertical-rails",
    number: "06",
    name: "Vertical rails",
    format: "portrait / streaming rails",
    kicker: "One builder, end to end",
    headline: "Designed, built, shipped by one pair of hands.",
    subheadline:
      "Independent tools taken from sketch to working browser software.",
    cta: "Meet the work",
    looks:
      "The portrait reference centered as a cut-out figure, flanked by vertical mono type rails like the poster's side columns.",
    moves:
      "Rails stream upward at slow, different speeds and decelerate to readable on hover; headline lines slide in behind masks; the figure's cut edge carries a subtle paper-lift shadow that follows the pointer.",
    fits:
      "The streaming rails read as ongoing work in progress around a person who ships alone.",
    tone: "Human, editorial, assured",
  },
  {
    id: "scroll-morph",
    number: "07",
    name: "Scroll morph",
    format: "pinned narrative / sketch to UI",
    kicker: "From question to interface",
    headline: "Questions become interfaces here.",
    subheadline:
      "Scroll and watch a rough thought resolve into the real surface of a working tool.",
    cta: "Scroll to resolve",
    looks:
      "A pinned viewport where a hand-drawn sketch sits on one side and the actual wireframe of Code Layout on the other.",
    moves:
      "Scroll drives an SVG path morph and layout animation: the scribble straightens into the real interface while struck-out annotations fall away; at the end the hero releases into page flow at the first project.",
    fits:
      "Makes the value proposition literal — the transformation from idea to usable tool happens in front of you.",
    tone: "Narrative, purposeful, editorial",
  },
  {
    id: "inspection-lens",
    number: "08",
    name: "Inspection lens",
    format: "material study / worktable",
    kicker: "Look closer",
    headline: "Details are the product.",
    subheadline:
      "Tools built so the structure holds up when you lean in.",
    cta: "Take the lens",
    looks:
      "A flat worktable of the two project sheets with a circular glass lens resting on top, refracting whatever slides beneath it.",
    moves:
      "A WebGL lens follows the cursor with true refraction, displacement, and chromatic fringe; hidden annotations appear only under the glass; on touch the lens snaps between two anchors.",
    fits:
      "The glass reference becomes an instrument instead of decoration — inspection as interaction.",
    tone: "Material, curious, precise",
  },
  {
    id: "flow-routes",
    number: "09",
    name: "Flow routes",
    format: "flow field / wayfinding",
    kicker: "Routes through the work",
    headline: "Follow a line into the work.",
    subheadline:
      "Each route shows how a tool is meant to be walked through — pick one and go.",
    cta: "Pick a route",
    looks:
      "A calm field of thin ink streamlines flowing left to right, with waypoint nodes marking stops and one bright traveler running a route.",
    moves:
      "A canvas flow field bends around the cursor's charge; the traveler completes a route, then switches; clicking a node opens that project directly.",
    fits:
      "Extends the Practice Map idea into the hero: the collection is navigable as routes, not just a list.",
    tone: "Calm, legible, systemic",
  },
  {
    id: "darkroom-develop",
    number: "10",
    name: "Darkroom develop",
    format: "reveal field / dark paper",
    kicker: "Fixed in the browser",
    headline: "Work leaves evidence.",
    subheadline:
      "Each build leaves a trace you can open and inspect — one pass, one record.",
    cta: "Inspect the traces",
    looks:
      "The hero as a sheet of photographic paper in a near-black room: headline and two contact-strip diagrams barely ghosted into the surface.",
    moves:
      "The cursor acts as developer light — a soft radial reveal develops the copy and contact strips where it passes; idle areas fade back to ghost; reduced motion shows the fully developed sheet.",
    fits:
      "Sharpens the liked dark-catalogue mood into one mechanic: evidence appears because you looked.",
    tone: "Moody, experimental, archival",
  },
];

export default function HeroMotionDrafts({ projects }: HeroMotionDraftsProps) {
  const projectCount = projects.length.toString().padStart(2, "0");

  return (
    <main className="motion-page">
      <div className="motion-shell">
        <header className="motion-header">
          <a className="motion-home" href="/">
            <span aria-hidden="true">&lt;-</span>
            Selected Experiments
          </a>
          <span className="motion-header-center">Hero drafts / motion round</span>
          <span className="motion-header-status">Concept board / {projectCount} projects</span>
        </header>

        <section className="motion-intro" aria-labelledby="motion-title">
          <div>
            <p className="motion-eyebrow">10 animated focal points / draft level</p>
            <h1 id="motion-title">
              Give the hero
              <span>one moving idea.</span>
            </h1>
          </div>
          <div className="motion-intro-aside">
            <p>
              Each draft pairs tighter copy with one advanced animated element as the focal point. Scenes are static approximations; the motion column describes what the finished element would do.
            </p>
            <span className="motion-rule" aria-hidden="true" />
            <p className="motion-intro-small">
              Nothing functional yet. Choose by concept and tone; the winning mechanic gets a working prototype next.
            </p>
          </div>
        </section>

        <div className="motion-index" aria-hidden="true">
          <span>01-10</span>
          <span>Motion-led hero drafts</span>
          <span>2 references + original geometry</span>
        </div>

        <section className="motion-grid" aria-label="Ten motion-led hero drafts">
          {MOTION_DRAFTS.map((draft) => (
            <MotionDraftCard draft={draft} key={draft.id} />
          ))}
        </section>

        <footer className="motion-footer">
          <span>Draft board / production homepage unchanged</span>
          <span>Next step after selection: prototype the chosen mechanic</span>
        </footer>
      </div>
    </main>
  );
}

function MotionDraftCard({ draft }: { draft: MotionDraft }) {
  return (
    <article className={`motion-draft motion-draft-${draft.id}`}>
      <div className="motion-draft-topline">
        <span>{draft.number}</span>
        <span>{draft.format}</span>
      </div>

      <div className="motion-draft-canvas">
        <div className="motion-draft-nav">
          <span>Selected Experiments</span>
          <span>Draft hero</span>
        </div>
        <DraftScene id={draft.id} />
        <div className="motion-draft-copy">
          <p className="motion-draft-kicker">{draft.kicker}</p>
          <h2>{draft.headline}</h2>
          <p className="motion-draft-subheadline">{draft.subheadline}</p>
          <span className="motion-draft-cta">{draft.cta} <b aria-hidden="true">-&gt;</b></span>
        </div>
      </div>

      <div className="motion-draft-motion">
        <div className="motion-row">
          <span>Looks</span>
          <p>{draft.looks}</p>
        </div>
        <div className="motion-row">
          <span>Moves</span>
          <p>{draft.moves}</p>
        </div>
        <div className="motion-row">
          <span>Fits</span>
          <p>{draft.fits}</p>
        </div>
      </div>

      <div className="motion-draft-caption">
        <h3>{draft.name}</h3>
        <span>{draft.tone}</span>
      </div>
    </article>
  );
}

function DraftScene({ id }: { id: string }) {
  switch (id) {
    case "pixel-assembly":
      return (
        <div className="scene scene-pixel" aria-hidden="true">
          <img className="scene-photo scene-photo-right" src={referencePhoto} alt="" />
          <i className="px px-1" /><i className="px px-2" /><i className="px px-3" />
          <i className="px px-4" /><i className="px px-5" /><i className="px px-6" />
          <i className="px px-7" /><i className="px px-8" />
        </div>
      );
    case "refraction-sea":
      return (
        <div className="scene scene-sea" aria-hidden="true">
          <img className="scene-glass-ghost" src={liquidGlassPhoto} alt="" />
          <div className="caustics" />
          <div className="caustic-band" />
        </div>
      );
    case "pebble-physics":
      return (
        <div className="scene scene-pebbles" aria-hidden="true">
          <i className="pebble pebble-1" /><i className="pebble pebble-2" />
          <i className="pebble pebble-3" /><i className="pebble pebble-4" />
          <i className="pebble pebble-5" /><i className="pebble pebble-6" />
          <i className="pebble pebble-7" /><i className="pebble pebble-8" />
          <i className="star star-1" /><i className="star star-2" /><i className="star star-3" />
        </div>
      );
    case "specimen-turntable":
      return (
        <div className="scene scene-turntable" aria-hidden="true">
          <div className="tt-sheet tt-sheet-a">
            <span>01 / tool</span>
            <em />
            <em />
            <em />
          </div>
          <div className="tt-sheet tt-sheet-b">
            <span>02 / map</span>
            <em />
            <em />
          </div>
          <span className="tt-stitch" />
        </div>
      );
    case "plotter-bench":
      return (
        <div className="scene scene-plotter" aria-hidden="true">
          <svg viewBox="0 0 360 240" className="plotter-svg">
            <path
              className="plotter-draw"
              d="M40 200 L40 70 L150 70 L150 130 L95 130 L95 200 Z M150 70 L250 40 L250 110 L150 130 M250 40 L320 70 L320 150 L250 110"
              fill="none"
            />
            <path className="plotter-guide" d="M40 200 L320 150" fill="none" />
            <circle className="plotter-head" cx="320" cy="150" r="7" />
            <path className="plotter-cross" d="M313 150 L327 150 M320 143 L320 157" />
          </svg>
          <div className="plotter-tray">
            <em /><em />
          </div>
        </div>
      );
    case "vertical-rails":
      return (
        <div className="scene scene-rails" aria-hidden="true">
          <img className="scene-photo scene-photo-center" src={referencePhoto} alt="" />
          <span className="rail rail-left">I AM THE BUILDER / SELECTED EXPERIMENTS</span>
          <span className="rail rail-right">WORKING PROTOTYPES / 2026</span>
        </div>
      );
    case "scroll-morph":
      return (
        <div className="scene scene-morph" aria-hidden="true">
          <svg viewBox="0 0 200 140" className="morph-sketch">
            <path
              d="M20 100 C30 40, 70 30, 80 70 C90 110, 50 120, 60 80 C70 40, 130 20, 150 60 C170 100, 120 120, 140 90"
              fill="none"
            />
          </svg>
          <span className="morph-arrow">-&gt;</span>
          <div className="morph-wire">
            <em className="mw-top" />
            <em className="mw-side" />
            <em className="mw-row mw-row-a" />
            <em className="mw-row mw-row-b" />
            <em className="mw-row mw-row-c" />
          </div>
        </div>
      );
    case "inspection-lens":
      return (
        <div className="scene scene-lens" aria-hidden="true">
          <div className="lens-sheet lens-sheet-a">
            <span>01 / tool</span>
            <em /><em /><em />
          </div>
          <div className="lens-sheet lens-sheet-b">
            <span>02 / map</span>
            <em /><em />
          </div>
          <div className="lens-object">
            <span className="lens-note">stitch: load-bearing</span>
          </div>
        </div>
      );
    case "flow-routes":
      return (
        <div className="scene scene-routes" aria-hidden="true">
          <svg viewBox="0 0 400 240" className="routes-svg">
            <path className="route route-a" d="M0 60 C90 40, 140 90, 220 70 S 340 30, 400 60" fill="none" />
            <path className="route route-b" d="M0 130 C80 150, 160 110, 240 140 S 350 170, 400 140" fill="none" />
            <path className="route route-c" d="M0 200 C100 220, 180 180, 260 200 S 350 220, 400 190" fill="none" />
            <circle className="route-node" cx="90" cy="49" r="5" />
            <circle className="route-node" cx="220" cy="70" r="5" />
            <circle className="route-node route-node-active" cx="240" cy="140" r="6" />
            <circle className="route-node" cx="330" cy="207" r="5" />
            <circle className="route-traveler" cx="150" cy="128" r="4" />
          </svg>
        </div>
      );
    case "darkroom-develop":
      return (
        <div className="scene scene-darkroom" aria-hidden="true">
          <div className="darkroom-ghost">
            <span className="dg-line dg-line-a" />
            <span className="dg-line dg-line-b" />
            <span className="dg-line dg-line-c" />
            <div className="dg-strip">
              <em /><em /><em /><em /><em /><em />
            </div>
          </div>
          <div className="darkroom-developed">
            <span className="dg-line dg-line-a" />
            <span className="dg-line dg-line-b" />
            <span className="dg-line dg-line-c" />
            <div className="dg-strip">
              <em /><em /><em /><em /><em /><em />
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

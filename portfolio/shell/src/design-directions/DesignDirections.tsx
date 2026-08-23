import type { ReactNode } from "react";
import referencePhoto from "../../../../reference-images/reference-1.jpg";
import liquidGlassPhoto from "../../../../reference-images/young-korean-artists-liquid-glass-sea.png";
import type { ProjectModule } from "../../../contracts/project-module";
import "./design-directions.css";

type DesignDirectionsProps = {
  projects: readonly ProjectModule[];
};

type DraftVariant = {
  id: string;
  number: string;
  name: string;
  format: string;
  kicker: string;
  headline: string;
  subheadline: string;
  cta: string;
  tone: string;
  note: string;
  media: "photo" | "glass" | "both";
};

const DRAFTS: readonly DraftVariant[] = [
  {
    id: "image-as-place",
    number: "01",
    name: "Image as place",
    format: "photo-led / right field",
    kicker: "Experiments for real use",
    headline: "Make an idea somewhere you can go.",
    subheadline: "Working interfaces, maps, and simulations for seeing what a thought becomes in the world.",
    cta: "See the work",
    tone: "Open, spatial, inviting",
    note: "The image becomes the environment; the copy stays grounded and direct.",
    media: "photo",
  },
  {
    id: "liquid-threshold",
    number: "02",
    name: "Liquid threshold",
    format: "glass reference / full bleed",
    kicker: "Prototypes for uncertainty",
    headline: "Make the next version visible.",
    subheadline: "Small software for testing an idea before it hardens into a decision.",
    cta: "Enter the experiments",
    tone: "Immersive, fluid, cinematic",
    note: "The translucent reference image carries the focal weight while the text names the promise.",
    media: "glass",
  },
  {
    id: "editorial-crop",
    number: "03",
    name: "Editorial crop",
    format: "photo-led / type over edge",
    kicker: "Code / maps / models",
    headline: "Give a question a shape you can work with.",
    subheadline: "I build clear tools that expose structure, behavior, and the next useful move.",
    cta: "Inspect the projects",
    tone: "Precise, editorial, assured",
    note: "A narrow crop interrupts the type like a printed image pulled into the page.",
    media: "photo",
  },
  {
    id: "contact-sheet",
    number: "04",
    name: "Contact sheet",
    format: "two references / image sequence",
    kicker: "Selected experiments",
    headline: "Try the thought from more than one angle.",
    subheadline: "A collection of focused tools for looking closer, changing position, and learning by use.",
    cta: "Browse the set",
    tone: "Observational, curious, cultured",
    note: "Two image crops behave like evidence sheets rather than a single hero illustration.",
    media: "both",
  },
  {
    id: "portrait-column",
    number: "05",
    name: "Portrait column",
    format: "photo-led / left image rail",
    kicker: "A working collection",
    headline: "Build the way into the question.",
    subheadline: "Interfaces and simulations that make difficult ideas easier to enter and easier to test.",
    cta: "Open a project",
    tone: "Human, calm, considered",
    note: "The portrait crop anchors the page like a magazine opener, with the promise carried by type.",
    media: "photo",
  },
  {
    id: "glass-window",
    number: "06",
    name: "Glass window",
    format: "glass reference / centered object",
    kicker: "Tools for looking twice",
    headline: "See what changes when you can touch it.",
    subheadline: "Interactive work for turning an abstract question into something observable and useful.",
    cta: "Look closer",
    tone: "Tactile, quiet, exploratory",
    note: "The image is treated as a material window rather than a background or decoration.",
    media: "glass",
  },
  {
    id: "dark-catalogue",
    number: "07",
    name: "Dark catalogue",
    format: "photo-led / night field",
    kicker: "Working prototypes",
    headline: "Ideas should leave a trace.",
    subheadline: "A record of tools made to test assumptions, reveal mechanics, and move a project forward.",
    cta: "Read the traces",
    tone: "Moody, tactile, confident",
    note: "A dark treatment makes the image feel archival and gives the copy a sharper contrast.",
    media: "photo",
  },
  {
    id: "overscale-caption",
    number: "08",
    name: "Overscale caption",
    format: "photo-led / type as image",
    kicker: "Experiments in the open",
    headline: "Try it in the open.",
    subheadline: "The browser is the lab: a place to test interfaces, models, and ways of thinking.",
    cta: "Enter the lab",
    tone: "Bold, public, immediate",
    note: "Large type shares the frame with the photograph and becomes part of the visual object.",
    media: "photo",
  },
  {
    id: "layered-evidence",
    number: "09",
    name: "Layered evidence",
    format: "two references / offset stack",
    kicker: "Questions in / next moves out",
    headline: "Turn uncertainty into something you can move through.",
    subheadline: "Focused systems for finding a route, testing a rule, and making the result legible.",
    cta: "Find the route",
    tone: "Layered, intelligent, exploratory",
    note: "The photo and glass image overlap as two kinds of evidence: place and possibility.",
    media: "both",
  },
  {
    id: "quiet-artifact",
    number: "10",
    name: "Quiet artifact",
    format: "photo-led / generous field",
    kicker: "Small systems, plainly made",
    headline: "Useful things begin as experiments.",
    subheadline: "A small collection of software for making ideas concrete and seeing what happens next.",
    cta: "View selected work",
    tone: "Quiet, material, assured",
    note: "The smallest image treatment leaves room for the work and lets the copy do the explaining.",
    media: "photo",
  },
];

export default function DesignDirections({ projects }: DesignDirectionsProps) {
  const projectCount = projects.length.toString().padStart(2, "0");

  return (
    <main className="photo-drafts-page">
      <div className="photo-drafts-shell">
        <header className="photo-drafts-header">
          <a className="photo-drafts-home" href="/">
            <span aria-hidden="true">&lt;-</span>
            Selected Experiments
          </a>
          <span className="photo-drafts-header-center">Hero drafts / image reference round</span>
          <span className="photo-drafts-header-status">Static board / {projectCount} projects</span>
        </header>

        <section className="photo-drafts-intro" aria-labelledby="photo-drafts-title">
          <div>
            <p className="photo-drafts-eyebrow">10 image-led routes / draft level</p>
            <h1 id="photo-drafts-title">
              Start with the image,
              <span>then find the words.</span>
            </h1>
          </div>
          <div className="photo-drafts-intro-aside">
            <p>
              These are fast art-direction drafts using the supplied reference images. They compare crop, scale, atmosphere, and type placement before any animation or interaction is designed.
            </p>
            <span className="photo-drafts-rule" aria-hidden="true" />
            <p className="photo-drafts-intro-small">No working controls yet. Choose by number or by the visual treatment you want to develop.</p>
          </div>
        </section>

        <div className="photo-drafts-index" aria-hidden="true">
          <span>01-10</span>
          <span>Photo-led hero drafts</span>
          <span>2 supplied references</span>
        </div>

        <section className="photo-draft-grid" aria-label="Ten static photo-led hero drafts">
          {DRAFTS.map((draft) => (
            <DraftCard draft={draft} key={draft.id} />
          ))}
        </section>

        <footer className="photo-drafts-footer">
          <span>Draft board / production homepage unchanged</span>
          <span>Next step after selection: refine one composition</span>
        </footer>
      </div>
    </main>
  );
}

function DraftCard({ draft }: { draft: DraftVariant }) {
  return (
    <article className={`photo-draft photo-draft-${draft.id}`}>
      <div className="photo-draft-topline">
        <span>{draft.number}</span>
        <span>{draft.format}</span>
      </div>

      <div className="photo-draft-canvas">
        <div className="photo-draft-nav">
          <span>Selected Experiments</span>
          <span>Draft hero</span>
        </div>
        <div className="photo-draft-copy">
          <p className="photo-draft-kicker">{draft.kicker}</p>
          <h2>{draft.headline}</h2>
          <p className="photo-draft-subheadline">{draft.subheadline}</p>
          <span className="photo-draft-cta">{draft.cta} <b aria-hidden="true">-&gt;</b></span>
        </div>
        <DraftMedia media={draft.media} />
      </div>

      <div className="photo-draft-caption">
        <div>
          <h3>{draft.name}</h3>
          <p>{draft.note}</p>
        </div>
        <span>{draft.tone}</span>
      </div>
    </article>
  );
}

function DraftMedia({ media }: { media: DraftVariant["media"] }): ReactNode {
  if (media === "glass") {
    return <img className="draft-image draft-image-glass" src={liquidGlassPhoto} alt="" />;
  }

  if (media === "both") {
    return (
      <div className="draft-image-pair" aria-hidden="true">
        <img className="draft-image draft-image-photo" src={referencePhoto} alt="" />
        <img className="draft-image draft-image-glass" src={liquidGlassPhoto} alt="" />
      </div>
    );
  }

  return <img className="draft-image draft-image-photo" src={referencePhoto} alt="" />;
}

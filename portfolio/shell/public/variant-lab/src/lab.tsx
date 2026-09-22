// Variant lab — five presentation variants for the main-page project cards.
// Relay code (ProjectPresentation) is verbatim; the lab chrome and the six
// fake static cards are lab-only stand-ins for the real shell cards.

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

export type ProjectEntry = {
  id: string;
  title: string;
  card: ReactNode; // Your existing, unchanged card JSX.
};

export type PresentationVariant =
  | "focus"
  | "ledger"
  | "dossiers"
  | "chapters"
  | "archive"
  | "dossier"
  | "marginalia"
  | "spines";

type ViewProps = {
  projects: readonly ProjectEntry[];
};

const pad = (value: number) => String(value).padStart(2, "0");

function CardStage({ project }: { project: ProjectEntry }) {
  return (
    <div className="wp-stage" key={project.id}>
      {project.card}
    </div>
  );
}

function TextIndex({
  projects,
  active,
  onSelect,
  opensDialog = false,
}: ViewProps & {
  active: number | null;
  onSelect: (index: number) => void;
  opensDialog?: boolean;
}) {
  return (
    <nav className="wp-index" aria-label="Project index">
      {projects.map((project, index) => (
        <button
          type="button"
          className="wp-row"
          key={project.id}
          aria-current={active === index ? "true" : undefined}
          aria-haspopup={opensDialog ? "dialog" : undefined}
          onClick={() => onSelect(index)}
        >
          <span className="wp-number">{pad(index + 1)}</span>
          <span>{project.title}</span>
          <span className="wp-mark" aria-hidden="true">
            {opensDialog ? "↗" : active === index ? "—" : "→"}
          </span>
        </button>
      ))}
    </nav>
  );
}

/* 1. A single, deliberately spacious plate. */
function FocusFolio({ projects }: ViewProps) {
  const [active, setActive] = useState(0);
  const project = projects[active]!;

  return (
    <div className="wp-focus">
      <header className="wp-topline">
        <span className="wp-caption" aria-live="polite">
          {pad(active + 1)} / {pad(projects.length)} — {project.title}
        </span>

        <div className="wp-controls">
          <button
            type="button"
            className="wp-control"
            disabled={active === 0}
            onClick={() => setActive((index) => index - 1)}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="wp-control"
            disabled={active === projects.length - 1}
            onClick={() => setActive((index) => index + 1)}
          >
            Next →
          </button>
        </div>
      </header>

      <CardStage project={project} />
    </div>
  );
}

/* 2. Typography leads; the illustration becomes an inspector. */
function TextLedger({ projects }: ViewProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="wp-ledger">
      <div>
        <p className="wp-caption">Selected work / project index</p>
        <TextIndex
          projects={projects}
          active={active}
          onSelect={setActive}
        />
      </div>

      <aside className="wp-inspector" aria-label="Selected project">
        <p className="wp-caption">Inspection / {pad(active + 1)}</p>
        <CardStage project={projects[active]!} />
      </aside>
    </div>
  );
}

/* 3. Exclusive disclosure: never two expanded cards. */
function InlineDossiers({ projects }: ViewProps) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="wp-dossiers">
      {projects.map((project, index) => {
        const expanded = open === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <section key={project.id}>
            <h3 className="wp-dossier-heading">
              <button
                type="button"
                className="wp-row"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
              >
                <span className="wp-number">{pad(index + 1)}</span>
                <span>{project.title}</span>
                <span className="wp-mark" aria-hidden="true">
                  {expanded ? "−" : "+"}
                </span>
              </button>
            </h3>

            <div
              className="wp-dossier-panel"
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
            >
              {expanded && <CardStage project={project} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* 4. Native page scrolling selects one pinned card. */
function ScrollChapters({ projects }: ViewProps) {
  const [active, setActive] = useState(0);
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 56rem)").matches,
  );
  const chapterRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 56rem)");
    const sync = () => setDesktop(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!desktop) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const chapters =
        chapterRail.current?.querySelectorAll<HTMLElement>("[data-chapter]");
      if (!chapters?.length) return;

      const viewportCenter = window.innerHeight / 2;
      let nearest = 0;
      let shortestDistance = Infinity;

      chapters.forEach((chapter, index) => {
        const rect = chapter.getBoundingClientRect();
        const distance = Math.abs(
          (rect.top + rect.bottom) / 2 - viewportCenter,
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearest = index;
        }
      });

      setActive(nearest);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [desktop, projects.length]);

  // Avoid a cramped or excessively tall sticky composition on phones.
  if (!desktop) return <FocusFolio projects={projects} />;

  return (
    <div className="wp-chapters">
      <div ref={chapterRail}>
        {projects.map((project, index) => (
          <section
            className="wp-chapter"
            data-chapter={index}
            key={project.id}
          >
            <p className="wp-caption">
              Chapter {pad(index + 1)} / {pad(projects.length)}
            </p>
            <h3 className="wp-chapter-title">{project.title}</h3>
          </section>
        ))}
      </div>

      <aside
        className="wp-pinned"
        aria-label="Current chapter project"
        tabIndex={0}
      >
        <CardStage project={projects[active]!} />
      </aside>
    </div>
  );
}

/* 5. No artwork on the landing until explicitly requested. */
function ArchiveDrawer({ projects }: ViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const project = selected === null ? null : projects[selected];

  useEffect(() => {
    if (selected !== null && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [selected]);

  return (
    <>
      <p className="wp-caption">Selected work / open a project</p>

      <TextIndex
        projects={projects}
        active={null}
        onSelect={setSelected}
        opensDialog
      />

      <dialog
        ref={dialog}
        className="wp-drawer"
        aria-labelledby={titleId}
        onClose={() => setSelected(null)}
      >
        <header className="wp-topline">
          <h3 className="wp-caption" id={titleId}>
            {project?.title ?? "Project"}
          </h3>
          <form method="dialog">
            <button type="submit" className="wp-control">
              Close ×
            </button>
          </form>
        </header>

        {project && <CardStage project={project} />}
      </dialog>
    </>
  );
}

const views = {
  focus: FocusFolio,
  ledger: TextLedger,
  dossiers: InlineDossiers,
  chapters: ScrollChapters,
  archive: ArchiveDrawer,
  dossier: DossierStack,
  marginalia: Marginalia,
  spines: Spines,
};

export function ProjectPresentation({
  projects,
  variant = "ledger",
}: ViewProps & { variant?: PresentationVariant }) {
  if (projects.length === 0) return null;

  const View = views[variant];

  return (
    <section
      className={`wp wp--${variant}`}
      aria-label="Selected projects"
    >
      <View projects={projects} />
    </section>
  );
}

/* ---- Second relay run: three genuinely new mechanisms ---- */

/* Run-2 V3 — Dossier stack (folders in a drawer, tabs bring forward). */
function DossierStack({ projects }: ViewProps) {
  const [top, setTop] = useState(0);
  const n = projects.length;
  const order = useMemo(() => projects.map((_, i) => (i - top + n) % n), [top, n]); // 0 = front
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") setTop(t => (t + 1) % n);
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setTop(t => (t - 1 + n) % n);
  };
  return (
    <div className="ds" tabIndex={0} onKeyDown={onKey} role="region" aria-roledescription="stack" aria-label="Projects">
      {projects.map((p, i) => {
        const depth = order[i];
        return (
          <div key={p.id} className="ds__folder" style={{ "--d": depth } as CSSProperties} data-front={depth === 0}>
            <button className="ds__tab" onClick={() => setTop(i)} aria-label={`Bring ${p.title} to front`}>
              <span>{String(i + 1).padStart(2, "0")}</span><span>{p.title}</span>
            </button>
            {depth === 0 && <div className="ds__body"><CardStage project={p} /></div>}
          </div>
        );
      })}
    </div>
  );
}

/* Run-2 V4 — Marginalia (projects as footnotes in prose, card in a side
   sheet). Prose below is lab placeholder copy — the owner rewrites it. */
function Marginalia({ projects }: ViewProps) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<ProjectEntry | null>(null);
  const openP = (p: ProjectEntry) => { setOpen(p); dlg.current?.showModal(); };
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  const Ref = ({ id }: { id: string }) => {
    const p = byId[id] as ProjectEntry;
    return (
      <button className="mg__ref" onClick={() => openP(p)} aria-haspopup="dialog">
        {p.title}
        <sup>{String(projects.indexOf(p) + 1)}</sup>
      </button>
    );
  };
  const tags: Record<string, string> = {
    quicknotes: "notes",
    spine: "layout engine",
    "waste-of-tokens": "playground",
    "cat-runner": "game",
    "practice-map": "learning map",
    "raft-cluster": "systems",
  };
  return (
    <article className="mg">
      <p>
        I build tooling that stays out of the way — most recently{" "}
        <Ref id="quicknotes" /> for offline-first notes and{" "}
        <Ref id="spine" />, a drag-and-drop layout engine that runs on
        WebAssembly.
      </p>
      <p>
        Side quests keep the hands busy: <Ref id="waste-of-tokens" /> burns
        prompts into pixel grids, <Ref id="cat-runner" /> is an endless runner
        with a hand-inked cat, <Ref id="practice-map" /> wires deep lessons
        into a map, and <Ref id="raft-cluster" /> draws a consensus cluster as
        living tide lines.
      </p>
      <ol className="mg__notes">
        {projects.map((p, i) => (
          <li key={p.id} id={`fn-${i + 1}`}>
            <button onClick={() => openP(p)}>
              {String(i + 1).padStart(2, "0")} {p.title}
            </button>{" "}
            — {tags[p.id]}
          </li>
        ))}
      </ol>
      <dialog
        ref={dlg}
        className="mg__sheet"
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dlg.current && dlg.current.close()}
      >
        {open && (
          <div className="mg__sheetBody">
            <CardStage project={open} />
            <button autoFocus onClick={() => dlg.current?.close()}>
              close ×
            </button>
          </div>
        )}
      </dialog>
    </article>
  );
}

/* Run-2 V5 — Spines (a shelf of book spines, one open). */
function Spines({ projects }: ViewProps) {
  const [open, setOpen] = useState(0);
  return (
    <div className="sp" role="tablist" aria-orientation="horizontal">
      {projects.map((p, i) => {
        const isOpen = i === open;
        return (
          <div key={p.id} className="sp__spine" data-open={isOpen}>
            <button
              role="tab"
              aria-selected={isOpen}
              className="sp__label"
              onClick={() => setOpen(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setOpen((i + 1) % projects.length);
                if (e.key === "ArrowLeft") setOpen((i - 1 + projects.length) % projects.length);
              }}
            >
              <span className="sp__no">{String(i + 1).padStart(2, "0")}</span>
              <span className="sp__title">{p.title}</span>
            </button>
            {isOpen && (
              <div role="tabpanel" className="sp__panel">
                <CardStage project={p} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- Lab-only: six fake static stand-ins for the real shell cards ---- */

const S = { stroke: "rgba(238,234,224,0.75)", fill: "none", strokeWidth: 1.1 };
const S2 = { stroke: "rgba(238,234,224,0.4)", fill: "none", strokeWidth: 1 };
const A = "#d39b61";
const P = { fill: "rgba(238,234,224,0.07)", stroke: "none" };

function MarkQuicknotes() {
  return (
    <svg viewBox="0 0 260 160" role="img" aria-label="Quicknotes mark">
      <ellipse cx="128" cy="108" rx="86" ry="26" {...P} />
      <rect x="58" y="78" width="24" height="24" rx="7" {...S} />
      <rect x="90" y="78" width="24" height="24" rx="7" {...S2} />
      <rect x="122" y="78" width="24" height="24" rx="7" {...S} />
      <rect x="154" y="78" width="24" height="24" rx="7" fill={A} opacity="0.85" />
      <rect x="196" y="76" width="26" height="26" rx="7" {...S} strokeDasharray="4 4" />
      <circle cx="192" cy="70" r="3" fill={A} />
      <line x1="52" y1="110" x2="228" y2="110" {...S2} />
    </svg>
  );
}

function MarkSpine() {
  return (
    <svg viewBox="0 0 260 160" role="img" aria-label="Spine mark">
      <path d="M96 44 v52 h40" {...S} />
      <path d="M104 52 v36 h24" {...S2} />
      <g transform="rotate(9 168 66)">
        <rect x="146" y="44" width="42" height="42" fill="rgba(238,234,224,0.06)" {...S} />
      </g>
      <path d="M170 56 l14 22 -9 -2 -3 9 z" fill={A} />
    </svg>
  );
}

function MarkTokens() {
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={72 + c * 15}
          y={44 + r * 15}
          width="10"
          height="10"
          fill={r === 1 && c === 5 ? A : "rgba(238,234,224,0.35)"}
          opacity={r === 1 && c === 5 ? 0.9 : 0.5 - r * 0.08}
        />,
      );
    }
  }
  return (
    <svg viewBox="0 0 260 160" role="img" aria-label="Waste of tokens mark">
      <rect x="64" y="36" width="132" height="76" {...S} />
      {cells}
      <rect x="141" y="55" width="22" height="22" {...S} strokeDasharray="3 3" />
      <line x1="64" y1="126" x2="196" y2="126" {...S2} />
    </svg>
  );
}

function MarkCat() {
  return (
    <svg viewBox="0 0 260 160" role="img" aria-label="Cat Runner mark">
      <ellipse cx="130" cy="96" rx="78" ry="24" {...P} />
      <path d="M104 62 l8 -18 10 12 z" fill="rgba(238,234,224,0.8)" />
      <path d="M156 62 l-8 -18 -10 12 z" fill="rgba(238,234,224,0.8)" />
      <ellipse cx="130" cy="82" rx="34" ry="26" fill="rgba(238,234,224,0.82)" />
      <circle cx="119" cy="80" r="2.6" fill="#0b1317" />
      <circle cx="141" cy="80" r="2.6" fill="#0b1317" />
      <line x1="86" y1="86" x2="108" y2="88" {...S2} />
      <line x1="86" y1="94" x2="108" y2="92" {...S2} />
      <line x1="174" y1="86" x2="152" y2="88" {...S2} />
      <line x1="174" y1="94" x2="152" y2="92" {...S2} />
      <line x1="70" y1="118" x2="196" y2="118" {...S2} />
      <line x1="104" y1="126" x2="160" y2="126" {...S} strokeDasharray="2 6" stroke={A} />
    </svg>
  );
}

function MarkPracticeMap() {
  return (
    <svg viewBox="0 0 260 160" role="img" aria-label="Practice Map mark">
      <line x1="78" y1="104" x2="118" y2="62" {...S2} />
      <line x1="118" y1="62" x2="168" y2="84" {...S2} />
      <line x1="168" y1="84" x2="204" y2="52" {...S2} />
      <line x1="118" y1="62" x2="140" y2="116" {...S2} />
      <circle cx="78" cy="104" r="5" {...S} />
      <circle cx="118" cy="62" r="7" fill={A} opacity="0.9" />
      <circle cx="168" cy="84" r="5" {...S} />
      <circle cx="204" cy="52" r="4" {...S2} />
      <circle cx="140" cy="116" r="4" {...S2} />
    </svg>
  );
}

function MarkRaft() {
  return (
    <svg viewBox="0 0 260 160" role="img" aria-label="Raft Cluster mark">
      <rect x="84" y="52" width="92" height="12" rx="6" {...S} />
      <rect x="72" y="70" width="116" height="12" rx="6" fill="rgba(238,234,224,0.07)" {...S} />
      <rect x="92" y="88" width="76" height="12" rx="6" {...S2} />
      <path d="M56 122 q18 -8 36 0 t36 0 t36 0 t36 0" {...S2} />
      <path d="M64 134 q18 -8 36 0 t36 0 t36 0" {...S2} />
      <circle cx="130" cy="58" r="3" fill={A} />
    </svg>
  );
}

function LabCard({
  n,
  tag,
  title,
  desc,
  tech,
  children,
}: {
  n: string;
  tag: string;
  title: string;
  desc: string;
  tech: string;
  children: ReactNode;
}) {
  return (
    <article className="lab-card">
      <div className="lab-card-stage">{children}</div>
      <div className="lab-card-copy">
        <p className="lab-card-topline">
          {n} · {tag}
        </p>
        <h3 className="lab-card-title">{title}</h3>
        <p className="lab-card-desc">{desc}</p>
        <div className="lab-card-footer">
          <span className="lab-card-tech">{tech}</span>
          <span className="lab-card-open">
            open <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </article>
  );
}

const entries: ProjectEntry[] = [
  {
    id: "quicknotes",
    title: "Quicknotes",
    card: (
      <LabCard
        n="01"
        tag="notes"
        title="Quicknotes"
        desc="Fast markdown notes that live on-device and sync through Firebase — [[wiki-links]], live preview, command palette, one-button zip export."
        tech="Firebase · Firestore · Vanilla ES modules · Static hosting"
      >
        <MarkQuicknotes />
      </LabCard>
    ),
  },
  {
    id: "spine",
    title: "Spine",
    card: (
      <LabCard
        n="02"
        tag="layout engine"
        title="Spine"
        desc="Drag, nest and retune Flexbox and Grid containers in real time — a Go-to-WebAssembly engine with undo/redo and clean HTML/CSS export."
        tech="Go · WebAssembly · Flexbox & Grid · syscall/js"
      >
        <MarkSpine />
      </LabCard>
    ),
  },
  {
    id: "waste-of-tokens",
    title: "Waste of tokens",
    card: (
      <LabCard
        n="03"
        tag="playground"
        title="Waste of tokens"
        desc="A dense pixel-grid playground where prompts burn down into geometry — every token spent leaves a mark on the plate."
        tech="Canvas · Generative grid · TypeScript"
      >
        <MarkTokens />
      </LabCard>
    ),
  },
  {
    id: "cat-runner",
    title: "Cat Runner",
    card: (
      <LabCard
        n="04"
        tag="game"
        title="Cat Runner"
        desc="An endless runner with a hand-inked cat — procedural obstacles, simple physics, and a leaderboard that survives refreshes."
        tech="TypeScript · Canvas · Firebase"
      >
        <MarkCat />
      </LabCard>
    ),
  },
  {
    id: "practice-map",
    title: "Practice Map",
    card: (
      <LabCard
        n="05"
        tag="learning map"
        title="Practice Map"
        desc="Interactive practice-map reader: deep lessons wired as areas, sections and blocks, with shadow-typing drills."
        tech="React · Markdown pipeline · Vite"
      >
        <MarkPracticeMap />
      </LabCard>
    ),
  },
  {
    id: "raft-cluster",
    title: "Raft Cluster",
    card: (
      <LabCard
        n="06"
        tag="systems"
        title="Raft Cluster"
        desc="A visualization of a Raft consensus cluster — elections, log replication and failovers, drawn as living tide lines."
        tech="Go · WebSockets · SVG"
      >
        <MarkRaft />
      </LabCard>
    ),
  },
];

const mounts: Array<[string, PresentationVariant]> = [
  ["mount-focus", "focus"],
  ["mount-ledger", "ledger"],
  ["mount-dossiers", "dossiers"],
  ["mount-chapters", "chapters"],
  ["mount-archive", "archive"],
  ["mount-dossier", "dossier"],
  ["mount-marginalia", "marginalia"],
  ["mount-spines", "spines"],
];

for (const [id, variant] of mounts) {
  const node = document.getElementById(id);
  if (node) {
    createRoot(node).render(
      <ProjectPresentation projects={entries} variant={variant} />,
    );
  }
}

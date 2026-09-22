// Variant lab — Tufte-restraint presentations (relay output, verbatim
// mechanisms; the six fake static cards are lab stand-ins recolored for paper).

import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

/* ---- data: six fake static stand-ins ---- */

/* Mark ink comes from CSS vars so one mark set serves both palettes:
   :root = Tufte paper, html[data-mode="measure"] = dark ink. */
const S = { stroke: "var(--mk-ink)", fill: "none", strokeWidth: 1.1, strokeOpacity: 0.75 };
const S2 = { stroke: "var(--mk-ink)", fill: "none", strokeWidth: 1, strokeOpacity: 0.4 };
const A = "var(--mk-accent)";
const P = { fill: "var(--mk-soft)", stroke: "none" };

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
        <rect x="146" y="44" width="42" height="42" fill="var(--mk-soft)" {...S} />
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
          fill={r === 1 && c === 5 ? A : "var(--mk-mid)"}
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
      <path d="M104 62 l8 -18 10 12 z" fill="var(--mk-strong)" />
      <path d="M156 62 l-8 -18 -10 12 z" fill="var(--mk-strong)" />
      <ellipse cx="130" cy="82" rx="34" ry="26" fill="var(--mk-strong)" />
      <circle cx="119" cy="80" r="2.6" fill="var(--mk-void)" />
      <circle cx="141" cy="80" r="2.6" fill="var(--mk-void)" />
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
      <rect x="72" y="70" width="116" height="12" rx="6" fill="var(--mk-soft)" {...S} />
      <rect x="92" y="88" width="76" height="12" rx="6" {...S2} />
      <path d="M56 122 q18 -8 36 0 t36 0 t36 0 t36 0" {...S2} />
      <path d="M64 134 q18 -8 36 0 t36 0 t36 0" {...S2} />
      <circle cx="130" cy="58" r="3" fill={A} />
    </svg>
  );
}

type Meta = {
  id: string;
  tag: string;
  title: string;
  desc: string;
  tech: string[];
  Mark: () => ReactNode;
};

const META: Meta[] = [
  {
    id: "quicknotes", tag: "notes", title: "Quicknotes",
    desc: "Fast markdown notes that live on-device and sync through Firebase — [[wiki-links]], live preview, command palette, one-button zip export.",
    tech: ["Firebase", "Firestore", "Vanilla ES modules", "Static hosting"],
    Mark: MarkQuicknotes,
  },
  {
    id: "spine", tag: "layout engine", title: "Spine",
    desc: "Drag, nest and retune Flexbox and Grid containers in real time — a Go-to-WebAssembly engine with undo/redo and clean HTML/CSS export.",
    tech: ["Go", "WebAssembly", "Flexbox & Grid", "syscall/js"],
    Mark: MarkSpine,
  },
  {
    id: "waste-of-tokens", tag: "playground", title: "Waste of tokens",
    desc: "A dense pixel-grid playground where prompts burn down into geometry — every token spent leaves a mark on the plate.",
    tech: ["Canvas", "Generative grid", "TypeScript"],
    Mark: MarkTokens,
  },
  {
    id: "cat-runner", tag: "game", title: "Cat Runner",
    desc: "An endless runner with a hand-inked cat — procedural obstacles, simple physics, and a leaderboard that survives refreshes.",
    tech: ["TypeScript", "Canvas", "Firebase"],
    Mark: MarkCat,
  },
  {
    id: "practice-map", tag: "learning map", title: "Practice Map",
    desc: "Interactive practice-map reader: deep lessons wired as areas, sections and blocks, with shadow-typing drills.",
    tech: ["React", "Markdown pipeline", "Vite"],
    Mark: MarkPracticeMap,
  },
  {
    id: "raft-cluster", tag: "systems", title: "Raft Cluster",
    desc: "A visualization of a Raft consensus cluster — elections, log replication and failovers, drawn as living tide lines.",
    tech: ["Go", "WebSockets", "SVG"],
    Mark: MarkRaft,
  },
];

const projects = META.map((m) => ({ ...m, stage: <m.Mark /> }));

/* ---- relay Card primitives (unchanged surface) ---- */

function Stage({ children }: { children: ReactNode }) {
  return <figure className="stage">{children}</figure>;
}

function Text({ p }: { p: (typeof projects)[number] }) {
  return (
    <>
      <h2 className="title">{p.title}</h2>
      <p className="desc">{p.desc}</p>
      <p className="tech">{p.tech.join(" · ")}</p>
    </>
  );
}

/* ---- 1 Ledger — figure above, numbered caption below ---- */

function Ledger({ projects }: { projects: Meta[] }) {
  return (
    <main className="ledger">
      {projects.map((p, i) => (
        <section className="project" key={p.id}>
          <Stage>{p.stage}</Stage>
          <div className="caption">
            <span className="no">{i + 1}.</span>
            <div><Text p={p} /></div>
          </div>
        </section>
      ))}
    </main>
  );
}

/* ---- 2 Sidenote — text lives in the margin, sticky within its section ---- */

function Sidenote({ projects }: { projects: Meta[] }) {
  return (
    <main className="sidenote">
      {projects.map((p, i) => (
        <section className="project" key={p.id}>
          <Stage>{p.stage}</Stage>
          <aside><span className="no">{i + 1}</span><Text p={p} /></aside>
        </section>
      ))}
    </main>
  );
}

/* ---- 3 Folio — verso text / recto plate, vertically centred spread ---- */

function Folio({ projects }: { projects: Meta[] }) {
  return (
    <main className="folio">
      {projects.map((p, i) => (
        <section className="project" key={p.id}>
          <div><span className="no">{String(i + 1).padStart(2, "0")}</span><hr className="rule" /><Text p={p} /></div>
          <Stage>{p.stage}</Stage>
        </section>
      ))}
    </main>
  );
}

/* ---- 4 Plate — running head, plate, two-column footnote ---- */

function Plate({ projects, name = "Portfolio" }: { projects: Meta[]; name?: string }) {
  return (
    <main className="plate">
      {projects.map((p, i) => (
        <section className="project" key={p.id}>
          <header><span>{name}</span><span className="no">Plate {i + 1} of {projects.length}</span></header>
          <Stage>{p.stage}</Stage>
          <footer>
            <div><h2 className="title">{p.title}</h2><p className="desc">{p.desc}</p></div>
            <p className="tech">{p.tech.join(" · ")}</p>
          </footer>
        </section>
      ))}
    </main>
  );
}

/* ---- 5 Index — fixed table of contents; observer marks current ---- */

function Index({ projects }: { projects: Meta[] }) {
  const [cur, setCur] = useState(projects[0]?.id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("section.project").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <main className="index">
      <nav className="rail" aria-label="Projects">
        {projects.map((p, i) => (
          <a key={p.id} href={`#${p.id}`} aria-current={cur === p.id ? "true" : undefined}>
            <span className="no">{i + 1}</span>&nbsp; {p.title}
          </a>
        ))}
      </nav>
      <div>
        {projects.map((p) => (
          <section className="project" id={p.id} key={p.id}>
            <Stage>{p.stage}</Stage>
            <div><Text p={p} /></div>
          </section>
        ))}
      </div>
    </main>
  );
}


/* ---- measure mode: dark mimic of the real landing (real class names),
   used to preview the chat-model's measure patch before it ships ---- */

function MeasurePage() {
  return (
    <main className="signal-index">
      <div className="signal-index-shell">
        <section className="signal-index-hero signal-index-hero-fluid">
          <header className="signal-index-header">
            <div className="signal-index-identity">
              <a className="signal-index-wordmark" href="/variant-lab/index.html">
                <span className="signal-index-mark" aria-hidden="true" />
                Vasily Argounov
              </a>
              <span className="signal-index-identity-divider" aria-hidden="true">|</span>
              <a className="signal-index-contact" href="mailto:vasyapym@gmail.com">vasyapym@gmail.com</a>
            </div>
            <span className="signal-index-count">06</span>
          </header>
          <div className="signal-index-hero-fluid-canvas mim" aria-hidden="true" />
          <div className="signal-index-hero-copy">
            <p className="signal-index-hero-kicker">currents</p>
            <h1 className="signal-index-hero-headline" aria-label="prototypes & small machines">
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">prototypes</span>
              </span>
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">
                  <span className="signal-index-hero-amp">&amp;</span> small
                </span>
              </span>
              <span className="signal-index-hero-line" aria-hidden="true">
                <span className="signal-index-hero-line-in">machines</span>
              </span>
            </h1>
            <p className="signal-index-hero-note">a developer portfolio — six small machines, drawn in ink</p>
          </div>
          <div className="signal-index-beneath">
            <p className="signal-index-beneath-label">beneath the surface</p>
            {META.map((m, i) => (
              <a className="signal-index-beneath-row" key={m.id} href="#projects">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{m.title}</strong>
                <span>{m.tag}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="realm-threshold rt-f" aria-labelledby="realm-threshold-title">
          <div className="rt-f-inner">
            <h2 id="realm-threshold-title">
              <span className="rt-f-line">
                <span className="rt-f-phrase">the same work,</span>
                <span className="rt-f-register">
                  <span className="rt-f-count">08</span>
                  <span className="rt-f-noun rt-f-doors">works</span>
                </span>
              </span>
              <span className="rt-f-line rt-f-below">
                <span className="rt-f-phrase">beneath the surface.</span>
                <span className="rt-f-register">
                  <span className="rt-f-count">08</span>
                  <span className="rt-f-noun rt-f-doors">doors</span>
                </span>
              </span>
            </h2>
            <button className="realm-threshold-enter" type="button">
              <span className="rt-f-entry-copy">enter the deep</span>
            </button>
          </div>
        </section>

        <section className="signal-index-projects" id="projects" aria-label="Projects">
          <div className="signal-index-grid">
            {META.map((m) => (
              <article className="lab-card" key={m.id}>
                <div className="lab-card-stage">{<m.Mark />}</div>
                <div className="lab-card-copy">
                  <p className="lab-card-topline">{m.tag}</p>
                  <h3 className="lab-card-title">{m.title}</h3>
                  <p className="lab-card-desc">{m.desc}</p>
                  <div className="lab-card-footer">
                    <span className="lab-card-tech">{m.tech.join(" · ")}</span>
                    <span className="lab-card-open">open ↗</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---- App — ?v= switch ---- */

const V = { ledger: Ledger, sidenote: Sidenote, folio: Folio, plate: Plate, index: Index } as const;
type Key = keyof typeof V | "measure";

function App() {
  const key = (new URLSearchParams(location.search).get("v") ?? "ledger") as Key;
  useEffect(() => {
    document.documentElement.dataset.mode = key === "measure" ? "measure" : "tufte";
  }, [key]);
  if (key === "measure") return <MeasurePage />;
  const Variant = V[key as keyof typeof V] ?? V.ledger;
  return <Variant projects={projects} />;
}

createRoot(document.getElementById("root")!).render(<App />);

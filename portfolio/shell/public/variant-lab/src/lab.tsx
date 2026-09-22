// Variant lab — scroll-driven presentations.
// Shared scroll engine + five structurally different presentations (relay
// output, mechanisms verbatim; lab chrome and fake static cards are lab-only).

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

/* ---- shared engine ---- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const enterOf = (t: number) => smooth(clamp01(t / 0.3));
const exitOf = (t: number) => smooth(clamp01((t - 0.7) / 0.3));
const pad = (v: number) => String(v).padStart(2, "0");

function useTrack(count: number, vhPerCard = 1.2) {
  const ref = useRef<HTMLElement>(null);
  const [s, set] = useState({ index: 0, t: 0, p: 0 }); // t = 0..1 inside current card

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = r.height - vh;
      const p = Math.min(1, Math.max(0, -r.top / scrollable));
      const f = p * count;
      const index = Math.min(count - 1, Math.floor(f));
      set(prev => (prev.p === p ? prev : { index, t: f - index, p }));
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(read); };
    read();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [count]);

  return { ref, ...s, trackHeight: `${count * vhPerCard * 100}vh` };
}

function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const s = () => setM(mq.matches);
    s();
    mq.addEventListener("change", s);
    return () => mq.removeEventListener("change", s);
  }, [query]);
  return m;
}

type ViewProps = { projects: readonly ProjectEntry[] };

function Track({
  trackRef,
  height,
  children,
}: {
  trackRef: React.RefObject<HTMLElement>;
  height: string;
  children: ReactNode;
}) {
  return (
    <section className="track" ref={trackRef} style={{ height }}>
      <div className="stage">{children}</div>
    </section>
  );
}

function PlainStack({ projects }: ViewProps) {
  return (
    <div className="lab-stack">
      {projects.map((p) => (
        <div key={p.id} className="lab-stack__item">{p.card}</div>
      ))}
    </div>
  );
}

/* Cards whose SVG shapes are tagged with pathLength draw via --draw. */
function usePathLength(ref: React.RefObject<HTMLElement>, dep: unknown) {
  useEffect(() => {
    ref.current
      ?.querySelectorAll<SVGGraphicsElement>(
        "path,line,rect,circle,polyline,ellipse",
      )
      .forEach((el) => el.setAttribute("pathLength", "1"));
  }, [dep]);
}

/* ---- 1. Plotter — draw-off / draw-on ---- */

function Plotter({ projects }: ViewProps) {
  const count = projects.length;
  const { ref, index, t, trackHeight } = useTrack(count);
  const desktop = useMedia("(min-width: 1024px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const sheetRef = useRef<HTMLDivElement>(null);
  usePathLength(sheetRef, index);
  if (!desktop) return <PlainStack projects={projects} />;

  const exit = exitOf(t);
  const nextI = Math.min(count - 1, index + 1);
  const cur = projects[index];
  const nxt = projects[nextI];
  const drawCur =
    index === 0
      ? enterOf(t) * (1 - exit)
      : Math.min(1, 0.4 + 0.65 * enterOf(t)) * (1 - exit);
  const textCur = enterOf(t) * (1 - exit);
  const nextPre = t > 0.7 ? smooth(clamp01((t - 0.7) / 0.3)) : 0;
  const drawNext = nextPre * 0.4;

  if (reduced) {
    return (
      <Track trackRef={ref} height={trackHeight}>
        <div className="pt"><div className="pt__sheet"><div className="pt__card">{cur.card}</div></div></div>
      </Track>
    );
  }

  return (
    <Track trackRef={ref} height={trackHeight}>
      <div className="pt">
        <div className="pt__rail" aria-hidden>
          {projects.map((_, i) => (
            <span key={i} className="pt__tick" />
          ))}
          <span
            className="pt__caret"
            style={{ transform: `translateY(${index * 28}px)` }}
          />
        </div>
        <div className="pt__sheet" ref={sheetRef}>
          <div
            className="pt__card"
            key={cur.id}
            style={{ "--draw": drawCur, "--reveal": textCur } as CSSProperties}
          >
            {cur.card}
          </div>
          {nextI !== index && (
            <div
              className="pt__card pt__card--next"
              key={nxt.id}
              style={{ "--draw": drawNext, "--reveal": 0 } as CSSProperties}
            >
              {nxt.card}
            </div>
          )}
        </div>
      </div>
    </Track>
  );
}

/* ---- 2. Cut — hairline guillotine wipe ---- */

function Cut({ projects }: ViewProps) {
  const count = projects.length;
  const { ref, index, t, trackHeight } = useTrack(count);
  const desktop = useMedia("(min-width: 1024px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  if (!desktop) return <PlainStack projects={projects} />;

  const nextI = Math.min(count - 1, index + 1);
  const cur = projects[index];
  const nxt = projects[nextI];
  const cut = reduced ? 0 : exitOf(t);
  const down = index % 2 === 0;

  const curClip = down
    ? `inset(${cut * 100}% 0 0 0)`
    : `inset(0 0 ${cut * 100}% 0)`;
  const nextClip = down
    ? `inset(0 0 ${(1 - cut) * 100}% 0)`
    : `inset(${(1 - cut) * 100}% 0 0 0)`;
  const ruleTop = down ? `${cut * 100}%` : `${(1 - cut) * 100}%`;
  const moving = cut > 0 && cut < 1;

  return (
    <Track trackRef={ref} height={trackHeight}>
      <div className="ct">
        {nextI !== index && (
          <div className="ct__layer" style={{ clipPath: nextClip }}>
            <div className="ct__card" key={nxt.id}>{nxt.card}</div>
          </div>
        )}
        <div className="ct__layer" style={{ clipPath: curClip }}>
          <div className="ct__card" key={cur.id}>{cur.card}</div>
        </div>
        <div
          className="ct__rule"
          style={{ top: ruleTop, opacity: moving ? 1 : 0 }}
        />
        <div
          className="ct__rule ct__rule--ghost"
          style={{
            top: `calc(${ruleTop} + ${down ? 12 : -12}px)`,
            opacity: moving ? 0.4 : 0,
          }}
        />
      </div>
    </Track>
  );
}

/* ---- 3. Approach — z-travel through frames ---- */

function Approach({ projects }: ViewProps) {
  const count = projects.length;
  const { ref, index, t, trackHeight } = useTrack(count);
  const desktop = useMedia("(min-width: 1024px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  if (!desktop) return <PlainStack projects={projects} />;

  const nextI = Math.min(count - 1, index + 1);
  const cur = projects[index];
  const nxt = projects[nextI];
  const exit = reduced ? 0 : exitOf(t);
  const pre = reduced ? 0 : t > 0.7 ? smooth(clamp01((t - 0.7) / 0.3)) : 0;
  const real = pre >= 0.78;

  return (
    <Track trackRef={ref} height={trackHeight}>
      <div className="ap">
        {nextI !== index && (
          <div
            className="ap__frame ap__frame--next"
            style={{
              transform: `translateZ(${-900 + pre * 900}px)`,
              opacity: real ? 0.35 + 0.65 * ((pre - 0.78) / 0.22) : 0.18,
            }}
          >
            <div className="ap__inner" style={{ visibility: real ? "visible" : "hidden" }}>
              <div key={nxt.id}>{nxt.card}</div>
            </div>
          </div>
        )}
        <div
          className="ap__frame ap__frame--current"
          style={{
            transform: `translateZ(${exit * 600}px)`,
            opacity: 1 - exit,
          }}
        >
          <div key={cur.id}>{cur.card}</div>
        </div>
      </div>
    </Track>
  );
}

/* ---- 4. Lens — zoom into a detail, out into the next ---- */

function Lens({ projects }: ViewProps) {
  const count = projects.length;
  const { ref, index, t, trackHeight } = useTrack(count);
  const desktop = useMedia("(min-width: 1024px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  if (!desktop) return <PlainStack projects={projects} />;

  const nextI = Math.min(count - 1, index + 1);
  const cur = projects[index];
  const nxt = projects[nextI];
  const curMeta = META[index];
  const grid = reduced ? 0 : t > 0.6 ? smooth(clamp01((t - 0.6) / 0.25)) : 0;

  let scale = 1;
  let opacity = 1;
  if (!reduced) {
    if (t < 0.15 && index > 0) {
      const k = smooth(clamp01(0.5 + (t / 0.15) * 0.5));
      scale = 6 - 5 * k;
      opacity = k;
    } else if (t > 0.85) {
      scale = 6;
      opacity = 0;
    } else if (t > 0.6) {
      scale = 1 + 5 * smooth(clamp01((t - 0.6) / 0.25));
      opacity = t < 0.78 ? 1 : 1 - smooth(clamp01((t - 0.78) / 0.07));
    }
  }

  // next card mounts at current t > 0.85 and pulls out toward the reader
  let nScale = 6;
  let nOpacity = 0;
  if (!reduced && t > 0.85) {
    const k = smooth(clamp01(((t - 0.85) / 0.15) * 0.5));
    nScale = 6 - 5 * k;
    nOpacity = k;
  }

  return (
    <Track trackRef={ref} height={trackHeight}>
      <div className="ln">
        <div className="ln__grid" style={{ opacity: grid }} aria-hidden />
        {t > 0.85 && nextI !== index && (
          <div
            className={`ln__card${nScale > 1.2 ? " is-far" : ""}`}
            key={nxt.id}
            style={{
              transform: `scale(${nScale})`,
              transformOrigin: `${META[nextI].focal.x * 100}% ${META[nextI].focal.y * 100}%`,
              opacity: nOpacity,
            }}
          >
            {nxt.card}
          </div>
        )}
        <div
          className={`ln__card${scale > 1.2 ? " is-far" : ""}`}
          key={cur.id}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${curMeta.focal.x * 100}% ${curMeta.focal.y * 100}%`,
            opacity,
          }}
        >
          {cur.card}
        </div>
      </div>
    </Track>
  );
}

/* ---- 5. Margin notes — pinned illustration, free-scrolling text ---- */

function MarginNotes({ projects }: ViewProps) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const plateRef = useRef<HTMLElement>(null);
  const [tickTop, setTickTop] = useState(0);
  const desktop = useMedia("(min-width: 1024px)");
  usePathLength(plateRef, active);

  useEffect(() => {
    if (!desktop) return;
    const lis = listRef.current?.querySelectorAll<HTMLElement>("li[data-i]");
    if (!lis?.length) return;
    const io = new IntersectionObserver(
      (es) => {
        const best = es
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive(Number((best.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01] },
    );
    lis.forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, [desktop, projects.length]);

  useEffect(() => {
    const li = listRef.current?.querySelector<HTMLElement>(
      `li[data-i="${active}"]`,
    );
    if (li) setTickTop(li.offsetTop + 12);
  }, [active]);

  if (!desktop) return <PlainStack projects={projects} />;

  const cur = projects[active];

  return (
    <div className="mn">
      <aside className="mn__plate" ref={plateRef}>
        <div className="mn__plateCard" key={cur.id}>{cur.card}</div>
      </aside>
      <div className="mn__rule" aria-hidden>
        <span className="mn__tick" style={{ top: tickTop }} />
      </div>
      <ol className="mn__blocks" ref={listRef}>
        {projects.map((p, i) => (
          <li key={p.id} data-i={i}>
            <p className="mn__no">
              {pad(i + 1)} · {META[i].tag}
            </p>
            <h3 className="mn__title">{p.title}</h3>
            <p className="mn__desc">{META[i].desc}</p>
            <p className="mn__tech">{META[i].tech}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---- lab-only: fake static stand-ins for the real shell cards ---- */

type Meta = {
  id: string;
  n: string;
  tag: string;
  title: string;
  desc: string;
  tech: string;
  focal: { x: number; y: number };
  Mark: () => ReactNode;
};

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

const META: Meta[] = [
  {
    id: "quicknotes", n: "01", tag: "notes", title: "Quicknotes",
    desc: "Fast markdown notes that live on-device and sync through Firebase — [[wiki-links]], live preview, command palette, one-button zip export.",
    tech: "Firebase · Firestore · Vanilla ES modules · Static hosting",
    focal: { x: 0.5, y: 0.5 }, Mark: MarkQuicknotes,
  },
  {
    id: "spine", n: "02", tag: "layout engine", title: "Spine",
    desc: "Drag, nest and retune Flexbox and Grid containers in real time — a Go-to-WebAssembly engine with undo/redo and clean HTML/CSS export.",
    tech: "Go · WebAssembly · Flexbox & Grid · syscall/js",
    focal: { x: 0.62, y: 0.4 }, Mark: MarkSpine,
  },
  {
    id: "waste-of-tokens", n: "03", tag: "playground", title: "Waste of tokens",
    desc: "A dense pixel-grid playground where prompts burn down into geometry — every token spent leaves a mark on the plate.",
    tech: "Canvas · Generative grid · TypeScript",
    focal: { x: 0.4, y: 0.55 }, Mark: MarkTokens,
  },
  {
    id: "cat-runner", n: "04", tag: "game", title: "Cat Runner",
    desc: "An endless runner with a hand-inked cat — procedural obstacles, simple physics, and a leaderboard that survives refreshes.",
    tech: "TypeScript · Canvas · Firebase",
    focal: { x: 0.5, y: 0.42 }, Mark: MarkCat,
  },
  {
    id: "practice-map", n: "05", tag: "learning map", title: "Practice Map",
    desc: "Interactive practice-map reader: deep lessons wired as areas, sections and blocks, with shadow-typing drills.",
    tech: "React · Markdown pipeline · Vite",
    focal: { x: 0.55, y: 0.5 }, Mark: MarkPracticeMap,
  },
  {
    id: "raft-cluster", n: "06", tag: "systems", title: "Raft Cluster",
    desc: "A visualization of a Raft consensus cluster — elections, log replication and failovers, drawn as living tide lines.",
    tech: "Go · WebSockets · SVG",
    focal: { x: 0.45, y: 0.5 }, Mark: MarkRaft,
  },
];

export type ProjectEntry = {
  id: string;
  title: string;
  card: ReactNode; // Your existing, unchanged card JSX.
};

function LabCard({ m }: { m: Meta }) {
  return (
    <article className="lab-card">
      <div className="lab-card-stage">{<m.Mark />}</div>
      <div className="lab-card-copy">
        <p className="lab-card-topline">
          {m.n} · {m.tag}
        </p>
        <h3 className="lab-card-title">{m.title}</h3>
        <p className="lab-card-desc">{m.desc}</p>
        <div className="lab-card-footer">
          <span className="lab-card-tech">{m.tech}</span>
          <span className="lab-card-open">
            open <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </article>
  );
}

const entries: ProjectEntry[] = META.map((m) => ({
  id: m.id,
  title: m.title,
  card: <LabCard m={m} />,
}));

/* ---- mounts ---- */

const mounts: Array<[string, (p: ViewProps) => ReactNode]> = [
  ["mount-plotter", Plotter],
  ["mount-cut", Cut],
  ["mount-approach", Approach],
  ["mount-lens", Lens],
  ["mount-margin", MarginNotes],
];

for (const [id, V] of mounts) {
  const node = document.getElementById(id);
  if (node) {
    createRoot(node).render(<V projects={entries} />);
  }
}

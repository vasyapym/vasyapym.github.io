import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  curriculum,
  type LessonExample,
  type LessonSection,
  type TopicCard as TopicCardDefinition,
  type TopicStatus,
} from "./curriculum";
import {
  createInitialState,
  loadPracticeState,
  savePracticeState,
  setTopicStatus,
  summarizePractice,
  type PracticeState,
} from "./progress";
import "./practice-map.css";
import { TIERS, orderedTopicsForTier, plural } from "./lib/tiers/tiers";
import { TierList } from "./lib/tiers/TierList";
import { TierPanel } from "./lib/tiers/TierPanel";
import { Palette, type PaletteItem } from "./lib/tiers/Palette";
import "./lib/tiers/tiers.css";
import { Blocks, InlineText } from "./lib/format";
import { FreeReadingControls } from "./lib/freeReading/FreeReadingControls";
import { FreeReadingText } from "./lib/freeReading/FreeReadingText";
import {
  freeSectionKey,
  useFreeSettings,
  writeFreeSettings,
} from "./lib/freeReading/storage";
import { useFreeReading } from "./lib/freeReading/useFreeReading";
import {
  readScrollProgress,
  removeScrollProgress,
  writeScrollProgress,
} from "./lib/scrollProgress/storage";

const STATUS_LABELS: Readonly<Record<TopicStatus, string>> = {
  queued: "queued",
  "in-progress": "in progress",
  revisit: "revisit",
  applied: "applied",
};

const LESSON_TABS = [
  { key: "problem", label: "problem" },
  { key: "model", label: "model" },
  { key: "mechanics", label: "mechanics" },
  { key: "pitfalls", label: "pitfalls" },
  { key: "whenNot", label: "when not" },
] as const;

type LessonTabKey = (typeof LESSON_TABS)[number]["key"];

export default function PracticeMapPage() {
  const [activeTierId, setActiveTierId] = useState(TIERS[0]?.id ?? "");
  const [state, setState] = useState<PracticeState>(() => loadPracticeState(curriculum));
  const [query, setQuery] = useState("");
  const [activeVolume, setActiveVolume] = useState<string | null>(null);
  const [flashTopicId, setFlashTopicId] = useState<string | null>(null);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [graphTopic, setGraphTopic] = useState<TopicCardDefinition | null>(null);

  const summary = summarizePractice(curriculum, state);

  useEffect(() => {
    savePracticeState(state);
  }, [state]);

  const topicsById = useMemo(() => {
    const map: Record<string, TopicCardDefinition> = {};
    for (const area of curriculum) {
      for (const topic of area.topics) map[topic.id] = topic;
    }
    return map;
  }, []);

  const activeTier = TIERS.find((tier) => tier.id === activeTierId) ?? TIERS[0];
  const tierTopics = useMemo(
    () => (activeTier ? orderedTopicsForTier(activeTier, topicsById).map(({ topic, index }) => ({ ...topic, index })) : []),
    [activeTier, topicsById],
  );

  const lessonCount = useCallback((tierId: string) => {
    const tier = TIERS.find((t) => t.id === tierId);
    return tier ? orderedTopicsForTier(tier, topicsById).length : 0;
  }, [topicsById]);

  const sampleTitle = useCallback((tierId: string) => {
    const tier = TIERS.find((t) => t.id === tierId);
    return tier ? (orderedTopicsForTier(tier, topicsById)[0]?.topic.title ?? "") : "";
  }, [topicsById]);

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];
    for (const tier of TIERS) {
      const ordered = orderedTopicsForTier(tier, topicsById);
      items.push({
        kind: "tier",
        title: tier.name,
        sub: tier.band + " · " + plural(ordered.length, "lesson"),
        tierId: tier.id,
        topicId: null,
        hay: tier.name + " " + tier.band,
      });
      for (const { topic } of ordered) {
        items.push({
          kind: "lesson",
          title: topic.title,
          sub: tier.name,
          tierId: tier.id,
          topicId: topic.id,
          hay: topic.title + " " + topic.summary + " " + tier.name,
        });
      }
    }
    return items;
  }, [topicsById]);

  const flashTimerRef = useRef<number | undefined>(undefined);
  const flashThenClear = (topicId: string | null) => {
    if (!topicId) return;
    window.clearTimeout(flashTimerRef.current);
    setFlashTopicId(topicId);
    flashTimerRef.current = window.setTimeout(() => setFlashTopicId(null), 1400);
  };

  // Global chrome: cmd/ctrl+K toggles the palette; Esc leaves the volume view
  // when the palette is closed (the palette owns its own Esc while open).
  // While a lesson or graph overlay is up, the overlay owns every key — the
  // palette stays out of its way and Esc does not exit the volume beneath.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (openLessonId || graphTopic) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (event.key === "Escape" && !paletteOpen && activeVolume) {
        setActiveVolume(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, activeVolume, openLessonId, graphTopic]);

  const jump = useCallback((tierId: string, topicId: string | null) => {
    setActiveTierId(tierId);
    const tier = TIERS.find((t) => t.id === tierId);
    if (topicId && tier?.volumes) {
      const vol = tier.volumes.find((v) => v.topicIds.includes(topicId));
      setActiveVolume(vol ? vol.name : null);
    } else {
      setActiveVolume(null);
    }
    setQuery("");
    flashThenClear(topicId);
  }, []);

  const openTopic = openLessonId ? topicsById[openLessonId] : null;
  const openTopicIndex = openTopic
    ? tierTopics.findIndex((entry) => entry.id === openTopic.id)
    : -1;

  return (
    <div className="practice-map-field">
      <section className="practice-map-page section-shell" aria-labelledby="practice-map-title">
        <p className="pg-kicker">
          playground · {TIERS.length} models · {curriculum.reduce((n, area) => n + area.topics.length, 0)} lessons
        </p>

        <header className="practice-map-hero">
          <h1 id="practice-map-title">
            archive of ai outputs
            <span>teaching concepts.</span>
          </h1>
        </header>

        <div className="pg-layout">
          <TierList
            tiers={TIERS}
            activeTierId={activeTier?.id ?? ""}
            onSelect={(tierId) => {
              setActiveTierId(tierId);
              setActiveVolume(null);
            }}
            lessonCount={lessonCount}
            sampleTitle={sampleTitle}
          />
          {activeTier && (
            <TierPanel
              tier={activeTier}
              topics={tierTopics}
              query={query}
              onQueryChange={setQuery}
              activeVolume={activeVolume}
              onEnterVolume={setActiveVolume}
              onExitVolume={() => setActiveVolume(null)}
              onOpenLesson={setOpenLessonId}
              onOpenGraph={(topic) => setGraphTopic(topic)}
              flashTopicId={flashTopicId}
              onOpenPalette={() => setPaletteOpen(true)}
            />
          )}
        </div>

        {graphTopic && <ConceptGraph topic={graphTopic} onClose={() => setGraphTopic(null)} />}

        {paletteOpen && (
          <Palette
            open
            onClose={() => setPaletteOpen(false)}
            onJump={jump}
            items={paletteItems}
          />
        )}

        {openTopic && openTopic.lesson && (
          <LessonOverlay
            index={openTopicIndex}
            topic={openTopic}
            status={state.topics[openTopic.id].status}
            onStatusChange={(status) => setState(setTopicStatus(state, openTopic.id, status))}
            onClose={() => setOpenLessonId(null)}
          />
        )}

        <footer className="practice-map-footer">
          <span>local notes · no account</span>
          <span className="practice-map-footer-meta">
            <span>{summary.queued} queued</span>
            <button
              className="practice-map-reset"
              type="button"
              onClick={() => {
                if (window.confirm("Reset all statuses, feedback, and notes?")) {
                  setState(createInitialState(curriculum));
                }
              }}
            >
              reset progress
            </button>
          </span>
        </footer>
      </section>
    </div>
  );
}

const clampPct = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Layout parameters by canvas width. Margins must exceed half the widest
// chip (mobile chips cap at 88px wide), or centers near the clamp edge let
// labels clip past the canvas frame; node count yields to the same pressure —
// pixel spacing that cannot hold buries chips under their neighbors.
type GraphLayoutParams = {
  count: number;
  marginX: number;
  marginY: number;
  minDist: number;
};

function layoutParams(width: number): GraphLayoutParams {
  const minDist = Math.min(90, Math.max(56, width / 4));
  if (width >= 620) {
    return { count: 28, marginX: 32, marginY: 20, minDist };
  }
  if (width >= 400) {
    return { count: 20, marginX: 40, marginY: 22, minDist };
  }
  return { count: width >= 330 ? 12 : 10, marginX: 44, marginY: 24, minDist };
}

// Deterministic seed layout: golden-angle spiral on an ellipse, then
// relaxation passes in PIXEL space (chip sizes are pixel-constant, so the
// minimum spacing must be too — % space packed 45px apart on phones and
// buried chips under neighbors). No random, no rAF.
function seedLayout(
  names: readonly string[],
  width: number,
  height: number,
  params: GraphLayoutParams,
): Record<string, { x: number; y: number }> {
  const n = names.length;
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const points = names.map((_, i) => {
    const angle = i * 2.39996;
    const rf = Math.sqrt((i + 0.5) / Math.max(1, n)); // 0..~1, even fill
    const rx = 24 + 16 * rf; // 24–40%
    const ry = 26 + 14 * rf; // 26–40%
    return { x: 50 + Math.cos(angle) * rx, y: 50 + Math.sin(angle) * ry };
  });

  const minDistSq = params.minDist * params.minDist;
  const px = points.map((p) => ({ x: (p.x / 100) * w, y: (p.y / 100) * h }));
  for (let pass = 0; pass < 80; pass += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = px[j].x - px[i].x;
        const dy = px[j].y - px[i].y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          const d = Math.max(0.0001, Math.sqrt(dSq));
          const push = (params.minDist - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          px[i].x -= ux * push;
          px[i].y -= uy * push;
          px[j].x += ux * push;
          px[j].y += uy * push;
        }
      }
    }
    for (let i = 0; i < n; i += 1) {
      px[i].x = clampPct(px[i].x, params.marginX, w - params.marginX);
      px[i].y = clampPct(px[i].y, params.marginY, h - params.marginY);
    }
  }

  const out: Record<string, { x: number; y: number }> = {};
  names.forEach((name, i) => {
    out[name] = { x: (px[i].x / w) * 100, y: (px[i].y / h) * 100 };
  });
  return out;
}

function ConceptGraph({ topic, onClose }: { topic: TopicCardDefinition | null; onClose: () => void }) {
  // Full adjacency model, built once from the real curriculum: every concept
  // is ranked by unique co-occurrence neighbors; the map shows the top slice.
  const graphAll = useMemo(() => {
    const allTopics = curriculum.flatMap((area) => area.topics);
    const topicsByConcept = new Map<string, string[]>();
    const edges = new Map<string, Map<string, number>>();
    let maxWeight = 1;

    for (const topic of allTopics) {
      const unique = Array.from(new Set(topic.concepts));
      for (const c of unique) {
        const list = topicsByConcept.get(c);
        if (list) list.push(topic.title);
        else topicsByConcept.set(c, [topic.title]);
      }
      for (let i = 0; i < unique.length; i += 1) {
        for (let j = i + 1; j < unique.length; j += 1) {
          const a = unique[i];
          const b = unique[j];
          const am = edges.get(a) ?? new Map<string, number>();
          const bm = edges.get(b) ?? new Map<string, number>();
          const w = (am.get(b) ?? 0) + 1;
          am.set(b, w);
          bm.set(a, w);
          edges.set(a, am);
          edges.set(b, bm);
          if (w > maxWeight) maxWeight = w;
        }
      }
    }

    // Rank by topic span — how many distinct topics a concept appears in —
    // so the map shows the ideas that connect the curriculum across topics.
    // A single lesson's internal vocabulary (many concepts co-occurring in
    // one card) cannot outrank that; ties: weighted degree, then neighbor
    // count, then alphabetical.
    const ranked = Array.from(topicsByConcept.keys())
      .map((name) => {
        const neighborMap = edges.get(name) ?? new Map<string, number>();
        let weight = 0;
        for (const w of neighborMap.values()) weight += w;
        return {
          name,
          topics: topicsByConcept.get(name)?.length ?? 0,
          weight,
          degree: neighborMap.size,
        };
      })
      .sort((a, b) =>
        b.topics - a.topics || b.weight - a.weight || a.name.localeCompare(b.name),
      )
      .map((d) => d.name);

    return { topicsByConcept, edges, maxWeight, ranked };
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const finePointer = useRef(false);
  const movedRef = useRef(false);
  const prevActiveRef = useRef<string | null>(null);
  const dragRef = useRef<
    | {
        id: string;
        pointerId: number;
        startX: number;
        startY: number;
        originX: number;
        originY: number;
      }
    | null
  >(null);

  const layout = layoutParams(dims?.w ?? 834);

  // Focus set. Global scope (no topic): today's top-slice behavior. Lesson
  // scope: seeds = this lesson's concepts present in the graph; focus = seeds
  // + up to 2 strongest neighbors per seed (neighbor strength = summed edge
  // weight), deduplicated; then a hard node cap keeps the overlay quiet —
  // seeds win first (by strength), neighbors fill the remainder.
  const focus = useMemo(() => {
    const strengthOf = (name: string): number => {
      const m = graphAll.edges.get(name);
      if (!m) return 0;
      let s = 0;
      for (const w of m.values()) s += w;
      return s;
    };

    if (!topic) {
      const nodeCount = dims ? layout.count : 28;
      const names = graphAll.ranked.slice(0, nodeCount);
      return { names, seedCount: names.length, neighborCount: 0, lessonScope: false };
    }

    const seeds = Array.from(new Set(topic.concepts)).filter((c) => graphAll.topicsByConcept.has(c));
    const seedSet = new Set(seeds);
    const picked = new Set<string>(seeds);
    for (const seed of seeds) {
      const m = graphAll.edges.get(seed);
      if (!m) continue;
      const strongest = Array.from(m.entries())
        .filter(([n]) => !seedSet.has(n))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 2)
        .map(([n]) => n);
      for (const n of strongest) picked.add(n);
    }

    const byStrength = (a: string, b: string) =>
      strengthOf(b) - strengthOf(a) || a.localeCompare(b);
    // Hard node cap: seeds win first, neighbors fill the remainder. Ceiling is
    // tied to the responsive layout count so phone scopes stay legible.
    const cap = Math.min(14, layout.count);
    const rankedSeeds = seeds.slice().sort(byStrength);
    const rankedNeighbors = Array.from(picked)
      .filter((n) => !seedSet.has(n))
      .sort(byStrength);
    const names = [...rankedSeeds, ...rankedNeighbors].slice(0, cap);
    const survivingSeeds = names.filter((n) => seedSet.has(n)).length;
    return {
      names,
      seedCount: survivingSeeds,
      neighborCount: names.length - survivingSeeds,
      lessonScope: true,
    };
  }, [topic, graphAll, dims, layout.count]);

  // Subgraph over the focus set: edges only where both ends are in focus.
  const graphModel = useMemo(() => {
    const focusSet = new Set(focus.names);
    const nodes = focus.names.map((name) => {
      const neighborMap = graphAll.edges.get(name) ?? new Map<string, number>();
      const sorted = Array.from(neighborMap.entries())
        .map(([n, w]) => ({ name: n, weight: w }))
        .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
      const titles = graphAll.topicsByConcept.get(name) ?? [];
      const sideAll = sorted.filter((e) => !focusSet.has(e.name));
      const mapLinks = sorted.filter((e) => focusSet.has(e.name));
      let strength = 0;
      for (const e of sorted) strength += e.weight;
      return {
        name,
        topicCount: titles.length,
        strength,
        mapLinks,
        sideLinks: sideAll.slice(0, 4),
        sideLinkCount: sideAll.length,
        topicTitles: Array.from(new Set(titles)).slice(0, 3),
      };
    });
    const linkCount = nodes.reduce((n, node) => n + node.mapLinks.length, 0) / 2;
    return { nodes, nodeByName: new Map(nodes.map((n) => [n.name, n])), linkCount };
  }, [graphAll, focus]);

  // Re-seed whenever the measured canvas or the node set settles.
  useLayoutEffect(() => {
    if (!dims) return;
    setPositions(
      seedLayout(graphModel.nodes.map((n) => n.name), dims.w, dims.h, layoutParams(dims.w)),
    );
  }, [dims, graphModel]);

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDims({ w: rect.width, h: rect.height });
    finePointer.current = window.matchMedia("(pointer: fine)").matches;
    closeRef.current?.focus();
  }, []);

  // Escape closes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll (mirrors the lesson overlay).
  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      // Instant restore: the shell styles html { scroll-behavior: smooth }, and
      // an animated restore keeps the page moving under the next tap after the
      // overlay closes (the touch point outruns the glide and lands elsewhere).
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, []);

  const activeNode = activeId ? graphModel.nodeByName.get(activeId) ?? null : null;

  const neighborSet = useMemo(() => {
    if (!activeNode) return new Set<string>();
    return new Set(activeNode.mapLinks.map((e) => e.name));
  }, [activeNode]);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    name: string,
  ) => {
    const p = positions[name];
    if (!p) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    prevActiveRef.current = activeId;
    movedRef.current = false;
    dragRef.current = {
      id: name,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: p.x,
      originY: p.y,
    };
    setDraggingId(name);
    setActiveId(name);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxRaw = event.clientX - drag.startX;
    const dyRaw = event.clientY - drag.startY;
    if (Math.abs(dxRaw) > 4 || Math.abs(dyRaw) > 4) movedRef.current = true;
    const nx = clampPct(
      drag.originX + (dxRaw / rect.width) * 100,
      (layout.marginX / rect.width) * 100,
      100 - (layout.marginX / rect.width) * 100,
    );
    const ny = clampPct(
      drag.originY + (dyRaw / rect.height) * 100,
      (layout.marginY / rect.height) * 100,
      100 - (layout.marginY / rect.height) * 100,
    );
    setPositions((prev) => ({ ...prev, [drag.id]: { x: nx, y: ny } }));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDraggingId(null);
  };

  const handleClick = (name: string) => {
    if (movedRef.current) {
      movedRef.current = false;
      return; // a drag never toggles selection
    }
    // Toggle: tapping the already-active node clears it.
    if (prevActiveRef.current === name) setActiveId(null);
    else setActiveId(name);
  };

  const handleMouseEnter = (name: string) => {
    if (finePointer.current) setActiveId(name);
  };

  return createPortal(
    <div
      className="practice-graph-overlay"
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="practice-graph-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Concept graph"
      >
        <header className="practice-graph-header">
          <div>
            <span className="practice-lesson-kicker">system map</span>
            <h2>{focus.lessonScope && topic ? topic.title : "Concept constellation"}</h2>
          </div>
          <button
            ref={closeRef}
            className="practice-lesson-close"
            type="button"
            aria-label="Close concept graph"
            onClick={onClose}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div
          ref={canvasRef}
          className="practice-graph-canvas"
          aria-label="Interactive concept graph"
        >
          <span className="practice-graph-orbit orbit-one" />
          <span className="practice-graph-orbit orbit-two" />
          {activeNode && (
            <svg className="practice-graph-edges" aria-hidden="true">
              {activeNode.mapLinks.map((edge) => {
                const from = positions[activeNode.name];
                const to = positions[edge.name];
                if (!from || !to) return null;
                const opacity = Math.min(
                  0.9,
                  0.35 + 0.55 * (edge.weight / graphAll.maxWeight),
                );
                return (
                  <line
                    key={edge.name}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    strokeWidth={1.5}
                    opacity={opacity}
                    style={{ stroke: "var(--ink-accent-bright)" }}
                  />
                );
              })}
            </svg>
          )}
          {graphModel.nodes.map((node, index) => {
            const p = positions[node.name];
            if (!p) return null;
            const isActive = activeId === node.name;
            const isNeighbor = neighborSet.has(node.name);
            const isDimmed = activeId != null && !isActive && !isNeighbor;
            const className = [
              "practice-graph-node",
              isActive && "is-active",
              isNeighbor && "is-neighbor",
              isDimmed && "is-dimmed",
              draggingId === node.name && "is-dragging",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={node.name}
                className={className}
                type="button"
                aria-pressed={isActive}
                style={
                  {
                    "--node-x": `${p.x}%`,
                    "--node-y": `${p.y}%`,
                    "--node-delay": `${index * 35}ms`,
                  } as CSSProperties
                }
                onPointerDown={(event) => handlePointerDown(event, node.name)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => handleClick(node.name)}
                onMouseEnter={() => handleMouseEnter(node.name)}
                onFocus={() => setActiveId(node.name)}
              >
                {node.name}
              </button>
            );
          })}
          <span className="practice-graph-core">
            practice
            <br />
            map
          </span>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function LessonOverlay({
  index,
  topic,
  status,
  onStatusChange,
  onClose,
}: {
  index: number;
  topic: TopicCardDefinition;
  status: TopicStatus;
  onStatusChange: (status: TopicStatus) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<LessonTabKey>("problem");
  const [sectionIndex, setSectionIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const sectionIndexRef = useRef(0);
  const spyEnabledRef = useRef(true);
  const settleTimerRef = useRef<number>(undefined);
  const saveTimerRef = useRef<number>(undefined);
  const pendingScrollTopRef = useRef<number | null>(null);
  const lesson = topic.lesson;
  const deep = topic.deepLesson;
  const free = useFreeSettings(topic.id);
  const freeEnabled = free.value?.enabled ?? false;

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(event.target.value as TopicStatus);
  };

  const updateProgress = () => {
    const scroller = scrollRef.current;
    const bar = progressRef.current;
    if (!scroller || !bar) {
      return;
    }
    const max = scroller.scrollHeight - scroller.clientHeight;
    bar.style.opacity = max <= 4 ? "0" : "1";
    bar.style.transform = `scaleX(${max <= 4 ? 0 : Math.min(scroller.scrollTop / max, 1)})`;
  };

  const flushScrollSave = () => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = undefined;
    const pending = pendingScrollTopRef.current;
    if (pending === null) return;
    pendingScrollTopRef.current = null;
    if (pending < 1) {
      removeScrollProgress(topic.id);
    } else {
      writeScrollProgress(topic.id, pending);
    }
  };

  const scheduleScrollSave = () => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 4) return;
    pendingScrollTopRef.current = scroller.scrollTop;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(flushScrollSave, 300);
  };

  const handleScroll = () => {
    updateProgress();
    scheduleScrollSave();
  };

  const goToSection = (target: number, scroll = true) => {
    const total = deep?.sections.length ?? 0;
    const next = Math.max(0, Math.min(target, total - 1));
    sectionIndexRef.current = next;
    setSectionIndex(next);
    const scroller = scrollRef.current;
    if (!scroll || !scroller) {
      return;
    }
    // Suppress the scrollspy while the programmatic flight is in progress:
    // its last event otherwise fires before the smooth scroll settles and
    // names whichever section happened to cross the probe line last.
    spyEnabledRef.current = false;
    scroller
      .querySelector(`[data-section-index="${next}"]`)
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    window.clearTimeout(settleTimerRef.current);
    const settle = () => {
      spyEnabledRef.current = true;
      updateActiveFromScroll();
    };
    scroller.addEventListener("scrollend", settle, { once: true });
    settleTimerRef.current = window.setTimeout(() => {
      scroller.removeEventListener("scrollend", settle);
      settle();
    }, 1200);
  };

  const moveSection = (delta: number) => {
    goToSection(sectionIndexRef.current + delta);
  };

  const sectionTargetsRef = useRef<HTMLElement[]>([]);

  const updateActiveFromScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller || !spyEnabledRef.current) {
      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    if (scrollerRect.height === 0) {
      return;
    }
    const probeY = scrollerRect.top + Math.min(scrollerRect.height * 0.25, 260);
    let current = -1;
    sectionTargetsRef.current.forEach((element, elementId) => {
      const rect = element.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom > probeY) {
        current = elementId;
      }
    });
    if (current >= 0 && current !== sectionIndexRef.current) {
      sectionIndexRef.current = current;
      setSectionIndex(current);
    }
  };

  const moveTab = (delta: number) => {
    setTab((current) => {
      const activeIndex = LESSON_TABS.findIndex(({ key }) => key === current);
      return LESSON_TABS[(activeIndex + delta + LESSON_TABS.length) % LESSON_TABS.length].key;
    });
  };

  useEffect(() => {
    if (!deep || !scrollRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }
    const scroller = scrollRef.current;
    sectionTargetsRef.current = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-section-index]"),
    );
    const observer = new IntersectionObserver(
      () => updateActiveFromScroll(),
      { root: scroller, threshold: [0, 0.25] },
    );
    sectionTargetsRef.current.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      window.clearTimeout(settleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deep]);

  useEffect(() => {
    if (!lesson && !deep) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Editable targets own their keys: the shadow-typing input types digits
      // and uses Escape/Backspace, the search field filters — none of that
      // may drive section navigation.
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        if (deep) {
          moveSection(1);
        } else {
          moveTab(1);
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        if (deep) {
          moveSection(-1);
        } else {
          moveTab(-1);
        }
        return;
      }
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 1) {
        return;
      }
      if (deep) {
        if (digit <= deep.sections.length) {
          goToSection(digit - 1);
        }
      } else if (digit <= LESSON_TABS.length) {
        setTab(LESSON_TABS[digit - 1].key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    // iOS Safari ignores overflow:hidden on body, so the map keeps
    // scrolling behind the overlay. Freezing the body in place is the
    // reliable lock; the saved offset is restored on teardown.
    const lockedScrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      window.scrollTo({ top: lockedScrollY, behavior: "instant" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deep, lesson, onClose]);

  useEffect(() => {
    updateProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore saved scroll position before the browser's first paint.
  useLayoutEffect(() => {
    const saved = readScrollProgress(topic.id);
    if (!saved) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max <= 4) return;
    const pos = Math.min(saved.scrollTop, max);
    if (pos < 1) return;
    scroller.scrollTop = pos;
    const bar = progressRef.current;
    if (bar) {
      bar.style.opacity = "1";
      bar.style.transform = `scaleX(${Math.min(pos / max, 1)})`;
    }
    // The IntersectionObserver effect hasn't populated sectionTargetsRef
    // yet, so query section elements directly to sync the active chip.
    if (deep) {
      const scrollerRect = scroller.getBoundingClientRect();
      const probeY = scrollerRect.top + Math.min(scrollerRect.height * 0.25, 260);
      let active = -1;
      scroller.querySelectorAll<HTMLElement>("[data-section-index]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const idx = Number(el.dataset.sectionIndex);
        if (rect.top <= probeY && rect.bottom > probeY && idx >= 0) {
          active = idx;
        }
      });
      if (active >= 0) {
        sectionIndexRef.current = active;
        setSectionIndex(active);
      }
    }
  }, []);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushScrollSave();
    };
    const onUnload = () => flushScrollSave();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      flushScrollSave();
      window.clearTimeout(saveTimerRef.current);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  if (!lesson && !deep) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Portaled to <body>: the overlay is position:fixed, and any transformed
  // ancestor (the card hover lift) would otherwise capture it as its
  // containing block and displace it out of the viewport.
  return createPortal(
    <div className="practice-lesson-overlay" onClick={handleBackdropClick} role="presentation">
      {/* Stationary frame + keyed inner scroll body (the realm deep-reader
          repair): the panel itself never scrolls, so the header close button
          keeps its geometry on iOS Safari — content cannot run under it and
          safe-area overflow cannot drag it out of place. */}
      <section
        aria-label={`Lesson: ${topic.title}`}
        className="practice-lesson-panel"
        role="dialog"
      >
        <header className="practice-lesson-header">
          <div>
            <p className="practice-lesson-kicker">
              lesson {String(index + 1).padStart(2, "0")}
              {typeof topic.complexity === "number" && ` · ${topic.complexity}/5`}
            </p>
            <h2>{topic.title}</h2>
          </div>
          <div className="practice-lesson-tools">
            {free.hydrated && (
              <FreeReadingControls
                enabled={freeEnabled}
                hydrated={free.hydrated}
                onToggle={(next) => writeFreeSettings(topic.id, next)}
              />
            )}
            <button
              aria-label="Close lesson"
              className="practice-lesson-close"
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div
          className="practice-lesson-scroll"
          key={topic.id}
          onScroll={handleScroll}
          ref={scrollRef}
        >
          <div aria-hidden="true" className="practice-lesson-progress">
            <span ref={progressRef} />
          </div>

          <div className="practice-lesson-statusrow">
            <span>status</span>
            <select
              aria-label={`Status for ${topic.title}`}
              className="practice-lesson-status"
              value={status}
              onChange={handleStatusChange}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {topic.objectives && topic.objectives.length > 0 && (
            <div className="practice-lesson-objectives">
              <span>objectives</span>
              <ul>
                {topic.objectives.map((objective, objectiveId) => (
                  <li key={objectiveId}><InlineText text={objective} /></li>
                ))}
              </ul>
            </div>
          )}

          {deep ? (
            <>
              <nav aria-label="Lesson sections" className="practice-reader-nav">
                {deep.sections.map((section, navId) => (
                  <button
                    aria-current={sectionIndex === navId ? "true" : undefined}
                    className={sectionIndex === navId ? "is-active" : ""}
                    key={navId}
                    type="button"
                    onClick={() => goToSection(navId)}
                  >
                    <kbd>{navId + 1}</kbd>
                    {section.heading ?? "intro"}
                  </button>
                ))}
              </nav>

              <div className="practice-reader">
                {deep.sections.map((section, sectionId) => (
                  <InteractiveSection
                    key={sectionId}
                    sectionIndex={sectionId}
                    section={section}
                    topicId={topic.id}
                    settings={{ enabled: freeEnabled }}
                  />
                ))}
              </div>
            </>
          ) : lesson ? (
            <>
              <div aria-label="Lesson sections" className="practice-lesson-tabs">
                {LESSON_TABS.map(({ key, label }, tabIndex) => (
                  <button
                    className={tab === key ? "is-active" : ""}
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                  >
                    <kbd>{tabIndex + 1}</kbd>
                    {label}
                  </button>
                ))}
              </div>

              <div className="practice-lesson-body">
                {tab === "pitfalls"
                  ? <ul>{lesson.pitfalls.map((pitfall, pitfallId) => <li key={pitfallId}><InlineText text={pitfall} /></li>)}</ul>
                  : <p><InlineText text={lesson[tab]} /></p>}
              </div>

              {topic.examples && topic.examples.length > 0 && (
                <div className="practice-lesson-examples">
                  <h3>examples</h3>
                  {topic.examples.map((example) => (
                    <ExampleFigure example={example} key={example.title} />
                  ))}
                </div>
              )}
            </>
          ) : null}

          {topic.references && topic.references.length > 0 && (
            <footer className="practice-lesson-footer">
              <span>sources: {topic.references.join(" · ")}</span>
              <span className="practice-lesson-hint">
                <kbd>←</kbd> <kbd>→</kbd> {deep ? "sections" : "tabs"} · <kbd>esc</kbd> closes
              </span>
            </footer>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

// A section's typeable stream: every prose block flattened to plain text
// (inline markup stripped, list items joined, blocks separated by blank
// lines). Headings stay chrome; examples stay rendered below the stream.
const INLINE_MARKUP = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

const plainText = (text: string) =>
  text.replace(INLINE_MARKUP, (mark) =>
    mark.startsWith("**") ? mark.slice(2, -2) : mark.slice(1, -1),
  );

function sectionProse(section: LessonSection): string {
  const blocks =
    section.blocks ??
    (section.paragraphs ?? []).map((text) => ({ kind: "p" as const, text }));
  const parts = blocks.map((block) => {
    switch (block.kind) {
      case "list":
        return plainText(block.items.join("; "));
      case "callout":
        return plainText(block.text);
      default:
        return plainText(block.text);
    }
  });
  return parts.filter(Boolean).join("\n\n");
}

function InteractiveSection({
  sectionIndex,
  section,
  topicId,
  settings,
}: {
  sectionIndex: number;
  section: LessonSection;
  topicId: string;
  settings: { enabled: boolean };
}) {
  const prose = sectionProse(section);
  const fr = useFreeReading({
    sectionKey: freeSectionKey(topicId, sectionIndex),
    original: prose,
    enabled: settings.enabled,
  });

  return (
    <section
      className="practice-reader-section"
      data-section-index={sectionIndex}
    >
      {section.heading && (
        <h3>
          <span aria-hidden="true">{String(sectionIndex + 1).padStart(2, "0")}</span>
          {section.heading}
        </h3>
      )}
      {settings.enabled && prose ? (
        <>
          <div className="fr-row">
            <span className="fr-count">
              {fr.consumedWords}/{fr.totalWords}
            </span>
            <progress
              aria-label={`Words read in section ${sectionIndex + 1}`}
              className="fr-progress"
              max={fr.totalWords}
              value={fr.consumedWords}
            />
            <button className="fr-mini" disabled={fr.pristine} type="button" onClick={fr.reset}>
              reset section
            </button>
          </div>
          <FreeReadingText
            fr={fr}
            label={`Section ${sectionIndex + 1} text — delete what you have read, type your notes freely`}
          />
          {fr.stale && (
            <p className="fr-note" role="note">
              the lesson text changed since this note was last edited, so the saved text was reset
            </p>
          )}
          {fr.consumedWords >= fr.totalWords && fr.totalWords > 0 && (
            <p className="fr-done">✓ read through — what you keep here is yours</p>
          )}
        </>
      ) : (
        <>
          {section.blocks ? (
            <Blocks blocks={section.blocks} />
          ) : (
            section.paragraphs?.map((paragraph, paragraphId) => (
              <p key={paragraphId}>
                <InlineText text={paragraph} />
              </p>
            ))
          )}
        </>
      )}
      {section.examples && section.examples.length > 0 && (
        <div className="practice-reader-examples">
          {section.examples.map((example) => (
            <ExampleFigure example={example} key={example.title} />
          ))}
        </div>
      )}
    </section>
  );
}

function ExampleFigure({ example }: { example: LessonExample }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useLayoutEffect(() => {
    const element = codeRef.current;
    if (!element) {
      return;
    }
    const check = () => setScrollable(element.scrollWidth > element.clientWidth + 1);
    check();
    document.fonts?.ready.then(check).catch(() => {});
  }, [example.code]);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(example.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className="practice-example">
      <figcaption>{example.title}</figcaption>
      <div className={`practice-example-code${scrollable ? " is-scrollable" : ""}`}>
        <button
          aria-label="Copy code"
          className={`practice-example-copy${copied ? " is-copied" : ""}`}
          type="button"
          onClick={handleCopy}
        >
          {copied ? "copied" : "copy"}
        </button>
        <pre ref={codeRef}><code>{example.code}</code></pre>
      </div>
      <p><InlineText text={example.explanation} /></p>
    </figure>
  );
}

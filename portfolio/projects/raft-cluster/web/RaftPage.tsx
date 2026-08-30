// web/RaftPage.tsx — React page: a live, interactive Raft cluster on canvas (revision 1).

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { loadRaftCore, type RaftCore } from "./raft-core";
import { ClusterSim, type Snapshot } from "./cluster";
import "./raft.css";

/** Cluster sizes offered in the UI. */
type Size = 3 | 5 | 7;
/** Speed multipliers offered by the segmented control. */
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
/** Pointer interaction modes over the canvas. */
type Mode = "select" | "link";
/** Max UTF-8 bytes accepted by the propose input. */
const MAX_PROPOSE_BYTES = 24;

/** Shared UTF-8 encoder for proposal payloads. */
const ENCODER = new TextEncoder();

/** Resolved canvas colours, read from the scoped CSS custom properties. */
type Palette = {
  text: string;
  accent: string;
  line: string;
  node: string;
  teal: string;
  bg: string;
  /** Resolved mono font stack — canvas `ctx.font` cannot use `var()`. */
  fontMono: string;
};

/** Cached node geometry from the last draw, used for click hit-testing. */
type Layout = { positions: Map<number, { x: number; y: number }>; nodeRadius: number };

/** Generate a fresh 32-bit cluster seed (UI concern only — never used inside the sim's RNG path). */
function freshSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/** Read the scoped ink palette from an element's computed style, with shell-token fallbacks. */
function readPalette(el: HTMLElement | null): Palette {
  const cs = el ? getComputedStyle(el) : null;
  const get = (name: string, fallback: string): string => {
    const v = cs?.getPropertyValue(name).trim();
    return v && v.length > 0 ? v : fallback;
  };
  return {
    text: get("--ink-text", "#eeeae0"),
    accent: get("--ink-accent", "#d39b61"),
    line: get("--ink-line", "rgba(238,234,224,.14)"),
    node: get("--raft-node", "rgba(238,234,224,.55)"),
    teal: get("--raft-msg-vote", "#4bb3a7"),
    bg: get("--ink-bg", "#0b1317"),
    fontMono: get("--mono", "ui-monospace, SFMono-Regular, Menlo, monospace"),
  };
}

/** Stable term → colour map (committed entries full opacity, uncommitted dimmed). */
function termColor(term: number, alpha: number): string {
  const hue = (term * 47) % 360;
  return `hsla(${hue}, 55%, 58%, ${alpha})`;
}

/** Ring position for node index `i` of `count`, starting at the top and going clockwise. */
function ringPosition(i: number, count: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

/**
 * The Raft cluster page. Default-exported so the shell can lazy-load it.
 * Renders an inline explanation instead of throwing when the core can't load.
 */
export default function RaftPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<ClusterSim | null>(null);
  const layoutRef = useRef<Layout | null>(null);

  const [core, setCore] = useState<RaftCore | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [size, setSize] = useState<Size>(5);
  const [seed, setSeed] = useState<number>(freshSeed);
  const [speed, setSpeed] = useState<number>(1);
  const [paused, setPaused] = useState(false);

  const [mode, setMode] = useState<Mode>("select");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [linkFirst, setLinkFirst] = useState<number | null>(null);
  const [proposeText, setProposeText] = useState("");

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const [onscreen, setOnscreen] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Refs mirroring state that the rAF loop / draw function read without re-subscribing.
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const snapshotRef = useRef<Snapshot | null>(snapshot);
  snapshotRef.current = snapshot;
  const selectedRef = useRef<number | null>(selectedId);
  selectedRef.current = selectedId;
  const linkFirstRef = useRef<number | null>(linkFirst);
  linkFirstRef.current = linkFirst;
  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  // ---- core load -----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    loadRaftCore().then(
      (c) => {
        if (!cancelled) setCore(c);
      },
      (err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- sim lifecycle -------------------------------------------------------

  useEffect(() => {
    if (!core) return;
    const sim = new ClusterSim(core, size, seed);
    simRef.current = sim;
    setSnapshot(sim.snapshot());
    setSelectedId(null);
    setLinkFirst(null);
    return () => {
      sim.dispose();
      simRef.current = null;
    };
  }, [core, size, seed]);

  // ---- visibility + intersection + reduced motion --------------------------

  useEffect(() => {
    const onVis = (): void => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setOnscreen(e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [core]);

  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = (): void => setReducedMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // ---- rAF loop (runs only when active) ------------------------------------

  const active = Boolean(core) && !loadError && !paused && tabVisible && onscreen;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const frame = (t: number): void => {
      const dt = Math.min(t - last, 250); // clamp long gaps; the sim also caps its backlog
      last = t;
      const sim = simRef.current;
      if (sim) {
        sim.advance(dt, speedRef.current);
        setSnapshot(sim.snapshot());
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  // ---- canvas drawing ------------------------------------------------------

  const draw = useCallback((): void => {
    const canvas = canvasRef.current;
    const snap = snapshotRef.current;
    if (!canvas || !snap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const pw = Math.floor(w * dpr);
    const ph = Math.floor(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const palette = readPalette(rootRef.current);
    const reduced = reducedRef.current;
    const count = snap.nodes.length;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.33;
    const nodeRadius = Math.max(14, Math.min(28, Math.min(w, h) * 0.08));

    const positions = new Map<number, { x: number; y: number }>();
    snap.nodes.forEach((node, i) => positions.set(node.id, ringPosition(i, count, cx, cy, R)));
    layoutRef.current = { positions, nodeRadius };

    const cutSet = new Set(snap.cuts);

    // Links (behind everything).
    ctx.lineWidth = 1;
    for (let a = 0; a < snap.nodes.length; a++) {
      for (let b = a + 1; b < snap.nodes.length; b++) {
        const idA = snap.nodes[a].id;
        const idB = snap.nodes[b].id;
        const pa = positions.get(idA);
        const pb = positions.get(idB);
        if (!pa || !pb) continue;
        const cut = cutSet.has(`${Math.min(idA, idB)}-${Math.max(idA, idB)}`);
        ctx.strokeStyle = palette.line;
        if (cut) {
          // Dashed line with a visible break in the middle.
          const mx = (pa.x + pb.x) / 2;
          const my = (pa.y + pb.y) / 2;
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const gap = 12;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(mx - ux * gap, my - uy * gap);
          ctx.moveTo(mx + ux * gap, my + uy * gap);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    }

    // In-flight message dots.
    if (!reduced) {
      for (const m of snap.inflight) {
        const from = positions.get(m.from);
        const to = positions.get(m.to);
        if (!from || !to) continue;
        const span = m.deliverAt - m.sentAt;
        const p = span > 0 ? Math.min(1, Math.max(0, (snap.nowMs - m.sentAt) / span)) : 1;
        const x = from.x + (to.x - from.x) * p;
        const y = from.y + (to.y - from.y) * p;
        const isVote = m.kind === "rv" || m.kind === "rvr";
        ctx.fillStyle = isVote ? palette.teal : palette.accent;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Nodes + badges + log bars.
    for (const node of snap.nodes) {
      const p = positions.get(node.id);
      if (!p) continue;
      const alive = node.alive;
      const role = node.status.role;

      ctx.save();
      if (!alive) ctx.globalAlpha = 0.4;

      // Disc.
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
      if (role === "leader") {
        ctx.fillStyle = palette.accent;
        ctx.fill();
      } else {
        ctx.fillStyle = palette.bg;
        ctx.fill();
        ctx.lineWidth = 1.5;
        if (role === "candidate") {
          ctx.strokeStyle = palette.accent;
          ctx.setLineDash([5, 4]);
          ctx.lineDashOffset = reduced ? 0 : -((snap.nowMs / 16) % 1000);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        } else {
          ctx.strokeStyle = palette.node;
          ctx.stroke();
        }
      }

      // Id label.
      ctx.fillStyle = role === "leader" ? palette.bg : palette.text;
      ctx.font = `600 13px ${palette.fontMono}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`n${node.id}`, p.x, p.y);

      // Term badge (top-right).
      const bx = p.x + nodeRadius * 0.72;
      const by = p.y - nodeRadius * 0.72;
      ctx.beginPath();
      ctx.arc(bx, by, nodeRadius * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = palette.bg;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = palette.node;
      ctx.stroke();
      ctx.fillStyle = palette.text;
      ctx.font = `600 9px ${palette.fontMono}`;
      ctx.fillText(String(node.status.term), bx, by);

      // Crashed marker (X).
      if (!alive) {
        ctx.strokeStyle = "#c85a54";
        ctx.lineWidth = 2;
        const d = nodeRadius * 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x - d, p.y - d);
        ctx.lineTo(p.x + d, p.y + d);
        ctx.moveTo(p.x + d, p.y - d);
        ctx.lineTo(p.x - d, p.y + d);
        ctx.stroke();
      }

      // Log bar under the node.
      const barW = nodeRadius * 2.8;
      const barH = 7;
      const barX = p.x - barW / 2;
      const barY = p.y + nodeRadius + 9;
      ctx.fillStyle = palette.line;
      ctx.fillRect(barX, barY, barW, barH);
      const n = node.logTerms.length;
      if (n > 0) {
        const committed = node.committedTerms.length;
        const segW = barW / n;
        for (let i = 0; i < n; i++) {
          const isCommitted = i < committed;
          ctx.fillStyle = termColor(node.logTerms[i], isCommitted ? 1 : 0.35);
          ctx.fillRect(barX + i * segW, barY, Math.max(1, segW - 0.5), barH);
        }
        // Commit marker notch at the committed / uncommitted boundary.
        if (committed > 0 && committed < n) {
          ctx.strokeStyle = palette.text;
          ctx.lineWidth = 1;
          const nx = barX + committed * segW;
          ctx.beginPath();
          ctx.moveTo(nx, barY - 2);
          ctx.lineTo(nx, barY + barH + 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Selection / link-pending highlight.
      const selected = selectedRef.current;
      const pending = linkFirstRef.current;
      if (node.id === selected || node.id === pending) {
        ctx.strokeStyle = node.id === pending ? palette.teal : palette.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, []);

  // Redraw on any visual state change.
  useEffect(() => {
    draw();
  }, [draw, snapshot, selectedId, linkFirst, mode, reducedMotion]);

  // Redraw on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw, core]);

  // ---- interactions --------------------------------------------------------

  const onCanvasClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      const layout = layoutRef.current;
      const canvas = canvasRef.current;
      const sim = simRef.current;
      if (!layout || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let hit: number | null = null;
      for (const [id, pos] of layout.positions) {
        if (Math.hypot(pos.x - x, pos.y - y) <= layout.nodeRadius) {
          hit = id;
          break;
        }
      }
      if (hit === null) return;

      if (modeRef.current === "select") {
        setSelectedId(hit);
        return;
      }
      // Link mode: pick two distinct nodes to toggle their link.
      if (linkFirst === null) {
        setLinkFirst(hit);
      } else if (linkFirst === hit) {
        setLinkFirst(null);
      } else {
        sim?.toggleLink(linkFirst, hit);
        setLinkFirst(null);
        if (sim) setSnapshot(sim.snapshot());
      }
    },
    [linkFirst],
  );

  const rebuild = useCallback((): void => {
    setSeed(freshSeed());
    setSelectedId(null);
    setLinkFirst(null);
  }, []);

  const changeSize = useCallback((next: Size): void => {
    setSize(next);
    setSeed(freshSeed());
  }, []);

  const doCrash = useCallback((id: number): void => {
    const sim = simRef.current;
    if (!sim) return;
    sim.crash(id);
    setSnapshot(sim.snapshot());
  }, []);

  const doRecover = useCallback((id: number): void => {
    const sim = simRef.current;
    if (!sim) return;
    sim.recover(id);
    setSnapshot(sim.snapshot());
  }, []);

  // ---- derived UI values ---------------------------------------------------

  const leaderId = snapshot?.leaderId ?? null;
  const proposeBytes = ENCODER.encode(proposeText);
  const tooLong = proposeBytes.length > MAX_PROPOSE_BYTES;
  const proposeReason =
    leaderId === null
      ? "no leader"
      : proposeText.length === 0
        ? "type a value"
        : tooLong
          ? "> 24 bytes"
          : "";
  const proposeDisabled = proposeReason !== "";

  const submitPropose = useCallback((): void => {
    const sim = simRef.current;
    if (!sim || proposeDisabled) return;
    if (sim.propose(ENCODER.encode(proposeText))) {
      setProposeText("");
      setSnapshot(sim.snapshot());
    }
  }, [proposeDisabled, proposeText]);

  const selectedNode = snapshot?.nodes.find((n) => n.id === selectedId) ?? null;
  const aliveCount = snapshot ? snapshot.nodes.filter((n) => n.alive).length : 0;
  const totalCount = snapshot ? snapshot.nodes.length : 0;
  const cutCount = snapshot ? snapshot.cuts.length : 0;
  const clockText = snapshot ? (snapshot.nowMs / 1000).toFixed(1) : "0.0";
  const feed = snapshot ? snapshot.events.slice(-9).reverse() : [];

  // ---- error / loading states ----------------------------------------------

  if (loadError) {
    return (
      <div className="raft-field" ref={rootRef}>
        <div className="raft-panel raft-error" role="alert">
          <h2>Couldn’t start the cluster</h2>
          <p>
            The WebAssembly consensus core failed to load, so the live demo can’t run in this
            browser.
          </p>
          <p className="raft-mono">{loadError}</p>
        </div>
      </div>
    );
  }

  // ---- page ----------------------------------------------------------------

  return (
    <div className="raft-field" ref={rootRef}>
      <header className="raft-head">
        <div className="raft-head-text">
          <h1>Raft — a live cluster in your browser</h1>
          <p className="raft-thesis">
            Every node runs the same Rust consensus core, compiled to WebAssembly. The network
            between them is simulated — the consensus is not.
          </p>
        </div>
        <div className="raft-head-controls">
          <label className="raft-ctl">
            <span>Cluster</span>
            <select
              value={size}
              onChange={(e) => changeSize(Number(e.target.value) as Size)}
              aria-label="Cluster size"
            >
              <option value={3}>3 nodes</option>
              <option value={5}>5 nodes</option>
              <option value={7}>7 nodes</option>
            </select>
          </label>
          <span className="raft-seed raft-mono">seed 0x{seed.toString(16).padStart(8, "0")}</span>
          <button type="button" onClick={rebuild}>
            Reset cluster
          </button>
        </div>
      </header>

      <div className="raft-grid">
        <section className="raft-stage" aria-label="Cluster visualization">
          <canvas
            ref={canvasRef}
            className="raft-canvas"
            onClick={onCanvasClick}
            aria-label="Raft cluster diagram (click nodes to select or link)"
          />
          <div className="raft-strip raft-mono">
            <span>{clockText}s</span>
            <span>{speed}×</span>
            <span>
              {leaderId !== null
                ? `leader: n${leaderId}`
                : "no leader — a majority must be reachable"}
            </span>
            <span>
              {aliveCount}/{totalCount} up
            </span>
            <span>{cutCount} links cut</span>
          </div>
        </section>

        <aside className="raft-side">
          <div className="raft-panel">
            <div className="raft-row">
              <span className="raft-label">Speed</span>
              <div className="raft-seg" role="group" aria-label="Speed">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={s === speed ? "raft-on" : ""}
                    aria-pressed={s === speed}
                    onClick={() => setSpeed(s)}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            <div className="raft-row">
              <span className="raft-label">Clock</span>
              <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
                {paused ? "Resume" : "Pause"}
              </button>
            </div>

            <div className="raft-row">
              <span className="raft-label">Mode</span>
              <div className="raft-seg" role="group" aria-label="Interaction mode">
                <button
                  type="button"
                  className={mode === "select" ? "raft-on" : ""}
                  aria-pressed={mode === "select"}
                  onClick={() => {
                    setMode("select");
                    setLinkFirst(null);
                  }}
                >
                  Select
                </button>
                <button
                  type="button"
                  className={mode === "link" ? "raft-on" : ""}
                  aria-pressed={mode === "link"}
                  onClick={() => {
                    setMode("link");
                    setSelectedId(null);
                  }}
                >
                  Link
                </button>
              </div>
            </div>

            {mode === "link" && (
              <p className="raft-hint">
                {linkFirst === null
                  ? "Click two nodes to cut or re-join their link."
                  : `n${linkFirst} chosen — click another node.`}
              </p>
            )}

            {mode === "select" && (
              <div className="raft-row">
                <span className="raft-label">Node</span>
                {selectedNode ? (
                  <div className="raft-node-ctl">
                    <span className="raft-mono">n{selectedNode.id}</span>
                    {selectedNode.alive ? (
                      <button type="button" onClick={() => doCrash(selectedNode.id)}>
                        Crash
                      </button>
                    ) : (
                      <button type="button" onClick={() => doRecover(selectedNode.id)}>
                        Resume (recover)
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="raft-hint">Click a node to select it.</span>
                )}
              </div>
            )}

            <div className="raft-propose">
              <label className="raft-label" htmlFor="raft-propose-input">
                Propose value
              </label>
              <div className="raft-node-ctl">
                <input
                  id="raft-propose-input"
                  type="text"
                  value={proposeText}
                  maxLength={24}
                  placeholder="value…"
                  onChange={(e) => setProposeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitPropose();
                  }}
                />
                <button type="button" onClick={submitPropose} disabled={proposeDisabled}>
                  Propose
                </button>
              </div>
              {proposeDisabled && <p className="raft-hint">Disabled — {proposeReason}.</p>}
            </div>
          </div>

          <div className="raft-panel raft-feed" aria-label="Event feed">
            <h2 className="raft-label">Events</h2>
            <ul className="raft-mono">
              {feed.length === 0 ? (
                <li className="raft-hint">nothing yet…</li>
              ) : (
                feed.map((ev, i) => (
                  <li key={`${ev.tMs}-${i}`}>
                    <span className="raft-t">{(ev.tMs / 1000).toFixed(1)}s</span> {ev.text}
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

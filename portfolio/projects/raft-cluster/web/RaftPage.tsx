// web/RaftPage.tsx — React page: a live, interactive Raft cluster on canvas (revision 2).

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
/** Most recent events kept in the feed. */
const FEED_CAP = 14;

const ENCODER = new TextEncoder();

/** Resolved canvas colours + metrics, read from the scoped CSS custom properties each frame. */
type Palette = {
  bg: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  lineSoft: string;
  accent: string;
  danger: string;
  /** Resolved mono font stack — canvas `ctx.font` cannot use `var()`. */
  fontMono: string;
  /** Root rem in CSS px, so canvas type sizes track the page's type steps. */
  rem: number;
};

/** Cached node geometry from the last draw, used for click hit-testing. */
type Layout = { positions: Map<number, { x: number; y: number }>; nodeRadius: number };

function freshSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

function readPalette(el: HTMLElement | null): Palette {
  const cs = el ? getComputedStyle(el) : null;
  const get = (name: string, fallback: string): string => {
    const v = cs?.getPropertyValue(name).trim();
    return v && v.length > 0 ? v : fallback;
  };
  const remRaw =
    typeof document !== "undefined" ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 16;
  return {
    bg: get("--raft-bg", "#0b1317"),
    text: get("--raft-text", "#eeeae0"),
    muted: get("--raft-muted", "rgba(238,234,224,.68)"),
    faint: get("--raft-faint", "rgba(238,234,224,.48)"),
    line: get("--raft-line", "rgba(238,234,224,.26)"),
    lineSoft: get("--raft-line-soft", "rgba(238,234,224,.13)"),
    accent: get("--raft-accent", "#d39b61"),
    danger: get("--raft-danger", "#c85a54"),
    fontMono: get("--mono", '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'),
    rem: Number.isFinite(remRaw) && remRaw > 0 ? remRaw : 16,
  };
}

/** Ring position for node index `i` of `count`, starting at the top and going clockwise. */
function ringPosition(i: number, count: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

function linkKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

/**
 * Set of node ids the leader can message directly (itself plus un-cut, alive peers).
 * The sim delivers frames only between directly linked nodes — there is no routing —
 * so this one-hop projection, not a multi-hop BFS, is what an honest majority counts.
 */
function reachableFrom(snap: Snapshot, start: number): Set<number> {
  const seen = new Set<number>([start]);
  for (const n of snap.nodes) {
    if (n.alive && n.id !== start && !snap.cuts.includes(linkKey(start, n.id))) {
      seen.add(n.id);
    }
  }
  return seen;
}

/** Everything the readout, legend and canvas agree on, derived once per snapshot. */
function derive(snap: Snapshot | null) {
  if (!snap) {
    return { term: 0, leaderId: null as number | null, commit: 0, applied: 0, reach: 0, total: 0, majority: 0, hasMajority: false, electing: false, reachable: new Set<number>() };
  }
  const total = snap.nodes.length;
  const majority = Math.floor(total / 2) + 1;
  const leaderId = snap.leaderId;
  const leader = leaderId !== null ? snap.nodes.find((n) => n.id === leaderId) ?? null : null;
  const term = snap.nodes.reduce((m, n) => Math.max(m, n.status.term), 0);
  const commit = leader ? leader.status.commitIndex : snap.nodes.reduce((m, n) => Math.max(m, n.status.commitIndex), 0);
  const applied = leader ? leader.status.lastApplied : snap.nodes.reduce((m, n) => Math.max(m, n.status.lastApplied), 0);
  const reachable = leaderId !== null ? reachableFrom(snap, leaderId) : new Set<number>();
  const reach = leaderId !== null ? reachable.size : snap.nodes.filter((n) => n.alive).length;
  const electing = snap.nodes.some((n) => n.alive && n.status.role === "candidate");
  return { term, leaderId, commit, applied, reach, total, majority, hasMajority: reach >= majority, electing, reachable };
}

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
  const [proposedTo, setProposedTo] = useState<number | null>(null);

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [tabVisible, setTabVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [onscreen, setOnscreen] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

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
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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
    setProposedTo(null);
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
      const dt = Math.min(t - last, 250);
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

    const pal = readPalette(rootRef.current);
    const d = derive(snap);
    const count = snap.nodes.length;

    // Type steps on canvas: 0.875rem (ids) and 0.75rem (meta), same as the page.
    const idPx = Math.round(pal.rem * 0.875);
    const metaPx = Math.round(pal.rem * 0.75);
    const fontId = `500 ${idPx}px ${pal.fontMono}`;
    const fontMeta = `400 ${metaPx}px ${pal.fontMono}`;

    // Composition: the ring fills the stage, leaving room for the log lane under each node.
    const nodeRadius = Math.max(16, Math.min(26, Math.min(w, h) * 0.075));
    const lane = nodeRadius + 40; // disc edge -> bottom of log lane + margin
    const R = Math.max(40, Math.min(w / 2 - nodeRadius - 44, h / 2 - lane));
    const cx = w / 2;
    const cy = h / 2 + 4;

    const positions = new Map<number, { x: number; y: number }>();
    snap.nodes.forEach((node, i) => positions.set(node.id, ringPosition(i, count, cx, cy, R)));
    layoutRef.current = { positions, nodeRadius };

    const cutSet = new Set(snap.cuts);

    // Links.
    ctx.lineWidth = 1;
    for (let a = 0; a < count; a++) {
      for (let b = a + 1; b < count; b++) {
        const idA = snap.nodes[a].id;
        const idB = snap.nodes[b].id;
        const pa = positions.get(idA);
        const pb = positions.get(idB);
        if (!pa || !pb) continue;
        if (cutSet.has(linkKey(idA, idB))) {
          const mx = (pa.x + pb.x) / 2;
          const my = (pa.y + pb.y) / 2;
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const gap = 14;
          ctx.strokeStyle = pal.faint;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(mx - ux * gap, my - uy * gap);
          ctx.moveTo(mx + ux * gap, my + uy * gap);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
          ctx.setLineDash([]);
          // Break marks at the gap.
          ctx.strokeStyle = pal.danger;
          ctx.beginPath();
          ctx.moveTo(mx - ux * gap - uy * 4, my - uy * gap + ux * 4);
          ctx.lineTo(mx - ux * gap + uy * 4, my - uy * gap - ux * 4);
          ctx.moveTo(mx + ux * gap - uy * 4, my + uy * gap + ux * 4);
          ctx.lineTo(mx + ux * gap + uy * 4, my + uy * gap - ux * 4);
          ctx.stroke();
        } else {
          ctx.strokeStyle = pal.lineSoft;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    }

    // In-flight messages: chevrons pointing along travel. Append = accent, vote = ink;
    // request = filled, reply = hollow. Positions come from the sim clock, so they are
    // honest under reduced motion too (the only motion is the protocol's own).
    for (const m of snap.inflight) {
      const from = positions.get(m.from);
      const to = positions.get(m.to);
      if (!from || !to) continue;
      const span = m.deliverAt - m.sentAt;
      const p = span > 0 ? Math.min(1, Math.max(0, (snap.nowMs - m.sentAt) / span)) : 1;
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      const ux = (to.x - from.x) / len;
      const uy = (to.y - from.y) / len;
      const isVote = m.kind === "rv" || m.kind === "rvr";
      const isReply = m.kind === "rvr" || m.kind === "aer";
      const colour = isVote ? pal.text : pal.accent;
      ctx.beginPath();
      ctx.moveTo(x + ux * 5, y + uy * 5);
      ctx.lineTo(x - ux * 3 - uy * 3.5, y - uy * 3 + ux * 3.5);
      ctx.lineTo(x - ux * 3 + uy * 3.5, y - uy * 3 - ux * 3.5);
      ctx.closePath();
      if (isReply) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      } else {
        ctx.fillStyle = colour;
        ctx.fill();
      }
    }

    // Nodes.
    for (const node of snap.nodes) {
      const p = positions.get(node.id);
      if (!p) continue;
      const alive = node.alive;
      const role = node.status.role;
      const isolated = alive && d.leaderId !== null && !d.reachable.has(node.id);

      ctx.save();
      if (!alive || isolated) ctx.globalAlpha = 0.45;

      // Disc.
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = pal.bg;
      ctx.fill();
      if (!alive) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = pal.line;
        ctx.stroke();
      } else if (role === "leader") {
        ctx.fillStyle = pal.accent;
        ctx.fill();
      } else if (role === "candidate") {
        ctx.lineWidth = 2;
        ctx.strokeStyle = pal.accent;
        ctx.stroke();
        // Vote spread: one arc segment per node, lit for each vote received this term.
        const votes = snap.nodes.filter(
          (n) => n.status.votedFor === node.id && n.status.term === node.status.term,
        ).length;
        const seg = (Math.PI * 2) / count;
        const gapA = 0.18;
        ctx.lineWidth = 2;
        for (let i = 0; i < count; i++) {
          const a0 = -Math.PI / 2 + i * seg + gapA / 2;
          const a1 = a0 + seg - gapA;
          ctx.strokeStyle = i < votes ? pal.accent : pal.lineSoft;
          ctx.beginPath();
          ctx.arc(p.x, p.y, nodeRadius + 7, a0, a1);
          ctx.stroke();
        }
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = pal.muted;
        ctx.stroke();
      }

      // Id.
      ctx.font = fontId;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = alive && role === "leader" ? pal.bg : pal.text;
      ctx.fillText(`n${node.id}`, p.x, p.y);

      // Term, quiet, beside the disc.
      ctx.font = fontMeta;
      ctx.textAlign = "left";
      ctx.fillStyle = pal.muted;
      ctx.fillText(`t${node.status.term}`, p.x + nodeRadius + 6, p.y - nodeRadius * 0.55);

      // Crash mark.
      if (!alive) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pal.danger;
        ctx.lineWidth = 1.5;
        const k = nodeRadius * 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x - k, p.y - k);
        ctx.lineTo(p.x + k, p.y + k);
        ctx.moveTo(p.x + k, p.y - k);
        ctx.lineTo(p.x - k, p.y + k);
        ctx.stroke();
        ctx.globalAlpha = 0.45;
      }

      // Log lane: fixed cells; wider gap at each term boundary; applied = solid accent,
      // committed = half accent, uncommitted = outline; tick at the commit boundary.
      const n = node.logTerms.length;
      const committed = node.committedTerms.length;
      const applied = Math.min(committed, Math.max(0, node.status.lastApplied));
      const maxW = nodeRadius * 3.4;
      const barH = 8;
      const baseY = p.y + nodeRadius + 12 + barH;
      const termBreaks = n > 0 ? node.logTerms.filter((t, i) => i > 0 && t !== node.logTerms[i - 1]).length : 0;
      const cellGap = 1;
      const termGap = 3;
      const cellW = n > 0 ? Math.max(2, Math.min(6, (maxW - (n - 1) * cellGap - termBreaks * termGap) / n)) : 6;
      const totalW = n > 0 ? n * cellW + (n - 1) * cellGap + termBreaks * termGap : 0;
      const startX = p.x - Math.max(totalW, maxW) / 2;

      ctx.lineWidth = 1;
      ctx.strokeStyle = pal.lineSoft;
      ctx.beginPath();
      ctx.moveTo(startX, baseY + 1.5);
      ctx.lineTo(startX + Math.max(totalW, maxW), baseY + 1.5);
      ctx.stroke();

      let x = startX;
      let commitX: number | null = null;
      for (let i = 0; i < n; i++) {
        if (i > 0) x += cellGap + (node.logTerms[i] !== node.logTerms[i - 1] ? termGap : 0);
        if (i === committed) commitX = x - (cellGap + 1) / 2;
        const y = baseY - barH;
        if (i < applied) {
          ctx.fillStyle = pal.accent;
          ctx.fillRect(x, y, cellW, barH);
        } else if (i < committed) {
          const a = ctx.globalAlpha;
          ctx.globalAlpha = a * 0.5;
          ctx.fillStyle = pal.accent;
          ctx.fillRect(x, y, cellW, barH);
          ctx.globalAlpha = a;
        } else {
          ctx.strokeStyle = pal.muted;
          ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, cellW - 1), barH - 1);
        }
        x += cellW;
      }
      if (commitX !== null && committed > 0) {
        ctx.strokeStyle = pal.text;
        ctx.beginPath();
        ctx.moveTo(commitX, baseY - barH - 3);
        ctx.lineTo(commitX, baseY + 3);
        ctx.stroke();
      }
      ctx.restore();

      // Selection (solid accent) / link-pending (dashed ink) rings — distinct glyphs.
      const selected = selectedRef.current;
      const pending = linkFirstRef.current;
      if (node.id === pending) {
        ctx.strokeStyle = pal.text;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (node.id === selected) {
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Paused: the clock is frozen — say so on the stage itself.
    if (pausedRef.current) {
      ctx.font = fontMeta;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = pal.muted;
      ctx.fillText(`paused · ${(snap.nowMs / 1000).toFixed(1)} s`, w - 8, 8);
    }
  }, []);

  useEffect(() => {
    draw();
  }, [draw, snapshot, selectedId, linkFirst, mode, reducedMotion, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw, core]);

  // ---- interactions --------------------------------------------------------

  const actOnNode = useCallback((hit: number): void => {
    const sim = simRef.current;
    if (modeRef.current === "select") {
      setSelectedId(hit);
      return;
    }
    const first = linkFirstRef.current;
    if (first === null) {
      setLinkFirst(hit);
    } else if (first === hit) {
      setLinkFirst(null);
    } else {
      sim?.toggleLink(first, hit);
      setLinkFirst(null);
      if (sim) setSnapshot(sim.snapshot());
    }
  }, []);

  const onCanvasClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      const layout = layoutRef.current;
      const canvas = canvasRef.current;
      if (!layout || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const [id, pos] of layout.positions) {
        if (Math.hypot(pos.x - x, pos.y - y) <= layout.nodeRadius + 4) {
          actOnNode(id);
          return;
        }
      }
    },
    [actOnNode],
  );

  // Keyboard path for the canvas affordance: digit keys address nodes by id.
  const onCanvasKey = useCallback(
    (e: ReactKeyboardEvent<HTMLCanvasElement>): void => {
      const n = Number(e.key);
      const snap = snapshotRef.current;
      if (!snap || !Number.isInteger(n) || n < 1 || n > snap.nodes.length) return;
      e.preventDefault();
      actOnNode(n);
    },
    [actOnNode],
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

  const d = derive(snapshot);
  const leaderId = d.leaderId;
  const proposeBytes = ENCODER.encode(proposeText);
  const tooLong = proposeBytes.length > MAX_PROPOSE_BYTES;
  const proposeReason =
    leaderId === null ? "no leader" : proposeText.length === 0 ? "type a value" : tooLong ? "> 24 bytes" : "";
  const proposeDisabled = proposeReason !== "";
  // Helper policy: only speak after the visitor typed; "type a value" is never printed.
  const proposeHelp = proposeText.length > 0 && proposeDisabled ? proposeReason : "";

  const submitPropose = useCallback((): void => {
    const sim = simRef.current;
    if (!sim || proposeDisabled) return;
    if (sim.propose(ENCODER.encode(proposeText))) {
      setProposeText("");
      setProposedTo(leaderId);
      setSnapshot(sim.snapshot());
    }
  }, [proposeDisabled, proposeText, leaderId]);

  const selectedNode = snapshot?.nodes.find((n) => n.id === selectedId) ?? null;
  const feed = snapshot ? snapshot.events.slice(-FEED_CAP).reverse() : [];
  const clockText = snapshot ? (snapshot.nowMs / 1000).toFixed(1) : "0.0";
  const seedHex = seed.toString(16).padStart(8, "0");

  const leaderText = leaderId !== null ? `n${leaderId}` : d.electing ? "electing" : "—";
  const quorumNote =
    leaderId !== null && !d.hasMajority ? "majority unreachable" : leaderId === null && d.electing ? "election" : "";

  // ---- whole-page error state ---------------------------------------------

  if (loadError) {
    return (
      <div className="raft-field" ref={rootRef}>
        <header className="raft-head">
          <h1 className="raft-sr-title">Raft cluster</h1>
        </header>
        <section className="raft-panel raft-error" role="alert">
          <h2>Couldn’t start the cluster</h2>
          <p>The WebAssembly consensus core failed to load, so the live cluster can’t run in this browser.</p>
          <p className="raft-mono raft-error-detail">{loadError}</p>
        </section>
      </div>
    );
  }

  // ---- page ----------------------------------------------------------------

  return (
    <div className="raft-field" ref={rootRef}>
      <header className="raft-head">
        <h1 className="raft-sr-title">Raft cluster</h1>
        <div className="raft-readout raft-mono" aria-live="polite" aria-atomic="true">
          <span className="raft-stat">
            <span className="raft-label">term</span>
            <span className="raft-value">{d.term}</span>
          </span>
          <span className="raft-stat">
            <span className="raft-label">leader</span>
            <span className={leaderId !== null ? "raft-value raft-value-accent" : "raft-value"}>{leaderText}</span>
          </span>
          <span className="raft-stat">
            <span className="raft-label">commit</span>
            <span className="raft-value">{d.commit}</span>
          </span>
          <span className="raft-stat">
            <span className="raft-label">applied</span>
            <span className="raft-value">{d.applied}</span>
          </span>
          <span className="raft-stat">
            <span className="raft-label">quorum</span>
            <span className="raft-value">
              {d.reach}/{d.total}
            </span>
            {quorumNote && <span className="raft-note">{quorumNote}</span>}
          </span>
        </div>
        <div className="raft-head-controls">
          <label className="raft-select">
            <span className="raft-label">cluster</span>
            <select value={size} onChange={(e) => changeSize(Number(e.target.value) as Size)} aria-label="Cluster size">
              <option value={3}>3 nodes</option>
              <option value={5}>5 nodes</option>
              <option value={7}>7 nodes</option>
            </select>
          </label>
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
            tabIndex={0}
            onClick={onCanvasClick}
            onKeyDown={onCanvasKey}
            aria-label="Raft cluster diagram (click nodes to select or link)"
          />

          <ul className="raft-legend raft-mono" aria-label="Legend">
            <li>
              <i className="raft-g raft-g-leader" />leader
            </li>
            <li>
              <i className="raft-g raft-g-follower" />follower
            </li>
            <li>
              <i className="raft-g raft-g-candidate" />candidate
            </li>
            <li>
              <i className="raft-g raft-g-down" />down
            </li>
            <li>
              <i className="raft-g raft-g-applied" />applied
            </li>
            <li>
              <i className="raft-g raft-g-committed" />committed
            </li>
            <li>
              <i className="raft-g raft-g-open" />uncommitted
            </li>
          </ul>
        </section>

        <aside className="raft-side">
          <div className="raft-panel raft-controls">
            <div className="raft-row">
              <span className="raft-label">speed</span>
              <div className="raft-row-end">
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
                <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
                  {paused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>

            <div className="raft-row">
              <span className="raft-label">mode</span>
              <div className="raft-row-end">
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
                {mode === "link" && linkFirst !== null && (
                  <span className="raft-note raft-mono">n{linkFirst} chosen — click another node</span>
                )}
              </div>
            </div>

            {mode === "select" && selectedNode && (
              <div className="raft-row">
                <span className="raft-label">node</span>
                <div className="raft-row-end">
                  <span className="raft-mono raft-value">
                    n{selectedNode.id} · {selectedNode.alive ? selectedNode.status.role : "down"} · t
                    {selectedNode.status.term}
                  </span>
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
              </div>
            )}

            <div className="raft-row">
              <label className="raft-label" htmlFor="raft-propose-input">
                propose
              </label>
              <div className="raft-row-end raft-propose">
                <input
                  id="raft-propose-input"
                  className="raft-mono"
                  type="text"
                  value={proposeText}
                  maxLength={24}
                  placeholder="value"
                  onChange={(e) => {
                    setProposeText(e.target.value);
                    setProposedTo(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitPropose();
                  }}
                  aria-label="Value to propose"
                />
                <button
                  type="button"
                  onClick={submitPropose}
                  disabled={proposeDisabled}
                  title={proposeDisabled ? proposeReason : undefined}
                >
                  Propose
                </button>
                {proposeHelp && <span className="raft-note raft-mono">{proposeHelp}</span>}
                {!proposeHelp && proposedTo !== null && proposeText.length === 0 && (
                  <span className="raft-note raft-mono raft-note-accent">appended on n{proposedTo}</span>
                )}
              </div>
            </div>
          </div>

          <section className="raft-feed" aria-label="Event feed">
            <h2 className="raft-label">events</h2>
            <ul className="raft-mono">
              {feed.length === 0 ? (
                <li className="raft-feed-empty">no events yet</li>
              ) : (
                feed.map((ev, i) => (
                  <li key={`${ev.tMs}-${i}`} data-kind={ev.kind}>
                    <span className="raft-dot" aria-hidden="true" />
                    <span className="raft-t">{(ev.tMs / 1000).toFixed(1)}</span>
                    <span className="raft-ev">{ev.text}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>
      </div>

      <footer className="raft-foot raft-mono">
        seed {seedHex} · {clockText} s{paused ? " · paused" : ""}
      </footer>
    </div>
  );
}

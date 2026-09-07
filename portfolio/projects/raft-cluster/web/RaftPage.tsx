// web/RaftPage.tsx — React page: a live, interactive Raft cluster on canvas (revision 2).
// Revision 2: decoded frame glyphs (comets / chevrons / pips), arrival rings,
// drop fizzles, candidate tally arcs, quorum + term + grant marks, log bars
// that read "empty, ready", hover inspection in the DOM panel, a legend, and
// a reduced-motion policy that keeps information and drops decoration.

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { loadRaftCore, type RaftCore } from "./raft-core";
import { ClusterSim, type NodeView, type Snapshot } from "./cluster";
import {
  clamp,
  clamp01,
  drawArcFraction,
  drawChevron,
  drawComet,
  drawCross,
  drawDashedBaseline,
  easeOut,
  fillCircle,
  ink,
  lerp,
  strokeCircle,
} from "./glyphs";
import "./raft.css";

/** Cluster sizes offered in the UI. */
type Size = 3 | 5 | 7;
/** Speed multipliers offered by the segmented control. */
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
/** Pointer interaction modes over the canvas. */
type Mode = "select" | "link";
/** Max UTF-8 bytes accepted by the propose input. */
const MAX_PROPOSE_BYTES = 24;

/** Lifespan of each transient canvas mark, in sim-time ms (sim TTLs match). */
const ARRIVAL_MS = 180;
const GRANT_MS = 250;
const QUORUM_RING_MS = 320;
const LINK_BRIGHTEN_MS = 400;
const TERM_FLASH_MS = 300;
const COMMIT_FADE_MS = 220;
const FIZZLE_MS = 220;
const DROP_TTL_MS = 300;

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
  danger: string;
  /** Resolved mono font stack — canvas `ctx.font` cannot use `var()`. */
  fontMono: string;
};

/** Cached node geometry from the last draw, used for click hit-testing. */
type Layout = { positions: Map<number, { x: number; y: number }>; nodeRadius: number };

/** Renderer-side memory of a node's last commit advance, for the fade-in. */
type CommitFade = { prevCommitted: number; fadeFrom: number; fadeTo: number; fadeAt: number };

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
    danger: get("--raft-danger", "#c85a54"),
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

/** Three mono lines describing a node's live (or frozen) state. */
function formatReadout(node: NodeView): { l1: string; l2: string; l3: string } {
  const s = node.status;
  const l1 = node.alive
    ? `n${node.id} · ${s.role} · term ${s.term}`
    : `n${node.id} · down · term ${s.term} (last seen)`;
  const l2 = `commit ${s.commitIndex} / log ${s.logLen} · applied ${s.lastApplied}`;
  const voted = s.votedFor > 0 ? `n${s.votedFor}` : "—";
  const leader = s.leaderId > 0 ? `n${s.leaderId}` : "—";
  const l3 = `voted ${voted} · leader ${leader}`;
  return { l1, l2, l3 };
}

/** The DOM readout for the hovered-or-selected node (11px mono, faint). */
function NodeReadoutView({ node }: { node: NodeView }) {
  const { l1, l2, l3 } = formatReadout(node);
  const dim = node.alive ? undefined : "is-dim";
  return (
    <div className="raft-node-readout raft-mono">
      <div>{l1}</div>
      <div className={dim}>{l2}</div>
      <div className={dim}>{l3}</div>
    </div>
  );
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
  const paletteRef = useRef<Palette>(readPalette(null));
  const commitFadesRef = useRef<Map<number, CommitFade>>(new Map());

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
  const hoveredRef = useRef<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
    commitFadesRef.current.clear();
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

  const refreshPalette = useCallback((): void => {
    paletteRef.current = readPalette(rootRef.current);
  }, []);

  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = (): void => {
      setReducedMotion(mq.matches);
      refreshPalette();
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [refreshPalette]);

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

    const palette = paletteRef.current;
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
    const hovered = hoveredRef.current;
    const now = snap.nowMs;

    // Bucket the transient emphasis records once per frame.
    const arrivals: Snapshot["fx"] = [];
    const grants = new Map<number, number>();
    const quorums: Snapshot["fx"] = [];
    const terms = new Map<number, number>();
    for (const f of snap.fx) {
      const age = now - f.atMs;
      if (f.type === "arrival") {
        if (age <= ARRIVAL_MS) arrivals.push(f);
      } else if (f.type === "grant") {
        if (age <= GRANT_MS && (grants.get(f.id) ?? Infinity) > age) grants.set(f.id, age);
      } else if (f.type === "quorum") {
        if (age <= LINK_BRIGHTEN_MS) quorums.push(f);
      } else if (age <= TERM_FLASH_MS && (terms.get(f.id) ?? Infinity) > age) {
        terms.set(f.id, age);
      }
    }

    // Quorum link-brighten: an overlay stroke on the new leader's links.
    // Peak overlay ≈ 0.12 lifts the resolved base line (≈ .26 alpha) to ≈ .35.
    const brighten = new Map<number, number>();
    if (!reduced) {
      for (const f of quorums) {
        const t = (now - f.atMs) / LINK_BRIGHTEN_MS;
        const a = 0.12 * (t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3);
        brighten.set(f.id, Math.max(brighten.get(f.id) ?? 0, a));
      }
    }

    // Commit fades: track each node's committed-boundary advance.
    const fades = commitFadesRef.current;
    for (const node of snap.nodes) {
      const c1 = node.committedTerms.length;
      const rec = fades.get(node.id);
      if (!rec) {
        fades.set(node.id, { prevCommitted: c1, fadeFrom: 0, fadeTo: 0, fadeAt: 0 });
      } else if (c1 > rec.prevCommitted) {
        rec.fadeFrom = rec.prevCommitted;
        rec.fadeTo = c1;
        rec.fadeAt = now;
        rec.prevCommitted = c1;
      } else if (c1 < rec.prevCommitted) {
        rec.prevCommitted = c1;
        rec.fadeFrom = 0;
        rec.fadeTo = 0;
        rec.fadeAt = 0;
      }
    }

    // Links (behind everything), with quorum brighten overlays.
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
          const boost = brighten.get(idA) ?? brighten.get(idB);
          if (boost !== undefined && boost > 0.001) {
            ctx.strokeStyle = ink(boost);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }
    }

    // Candidate tally arcs: "2 of 3 votes in" at a glance.
    for (const node of snap.nodes) {
      if (node.status.role !== "candidate" || !node.tally) continue;
      const p = positions.get(node.id);
      if (!p) continue;
      const frac = node.tally.needed > 0 ? clamp01(node.tally.granted / node.tally.needed) : 0;
      strokeCircle(ctx, p.x, p.y, nodeRadius + 7, 1, palette.line);
      if (frac > 0) {
        drawArcFraction(ctx, p.x, p.y, nodeRadius + 7, frac, palette.teal, 1.5);
      }
    }

    // In-flight message glyphs. Reduced motion keeps every glyph (they are
    // information) but replaces trails with plain dots.
    for (const m of snap.inflight) {
      const from = positions.get(m.from);
      const to = positions.get(m.to);
      if (!from || !to) continue;
      const span = m.deliverAt - m.sentAt;
      const p = span > 0 ? clamp01((now - m.sentAt) / span) : 1;
      const x = lerp(from.x, to.x, p);
      const y = lerp(from.y, to.y, p);
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const linkLen = Math.hypot(to.x - from.x, to.y - from.y);
      const meta = m.meta;
      const isVote = meta.kind === "rv" || meta.kind === "rvr";
      const color = isVote ? palette.teal : palette.accent;

      if (meta.kind === "rvr" || meta.kind === "aer") {
        if (meta.ok === false) {
          fillCircle(ctx, x, y, 2.5, palette.danger, 0.8);
        } else {
          drawChevron(ctx, x, y, angle, reduced ? 3.5 : 5, color, 0.9);
        }
      } else if (reduced) {
        fillCircle(ctx, x, y, 2.5, color, meta.kind === "ae" && meta.entryCount === 0 ? 0.45 : 0.9);
      } else if (meta.kind === "ae" && meta.entryCount === 0) {
        // Heartbeat: idle traffic recedes.
        drawComet(ctx, x, y, angle, clamp(linkLen * 0.06, 4, 8), 1.4, color, 0.45, false);
      } else {
        // Request-vote or replicating AppendEntries: full comet; entries get a head.
        drawComet(ctx, x, y, angle, clamp(linkLen * 0.06, 6, 14), 2.4, color, 0.95, meta.kind === "ae");
      }
    }

    // Drop fizzles: where a message died, a brief ×-cross.
    for (const d of snap.drops) {
      const age = now - d.atMs;
      if (age > FIZZLE_MS) continue;
      const f = positions.get(d.from);
      const t = positions.get(d.to);
      if (!f || !t) continue;
      const x = lerp(f.x, t.x, d.fraction);
      const y = lerp(f.y, t.y, d.fraction);
      const linkAngle = Math.atan2(t.y - f.y, t.x - f.x);
      const alpha = reduced ? 1 : 0.7 * (1 - age / FIZZLE_MS);
      drawCross(ctx, x, y, 4, 1.2, palette.danger, alpha, linkAngle + Math.PI / 4);
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
          ctx.lineDashOffset = reduced ? 0 : -((now / 16) % 1000);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        } else {
          // Follower outline; a just-granted vote flashes it brighter.
          const grantAge = !reduced ? grants.get(node.id) : undefined;
          const extra = grantAge !== undefined ? 0.45 * (1 - grantAge / GRANT_MS) : 0;
          ctx.strokeStyle = ink(0.55 + extra);
          ctx.stroke();
        }
      }

      // Id label.
      ctx.fillStyle = role === "leader" ? palette.bg : palette.text;
      ctx.font = `600 13px ${palette.fontMono}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`n${node.id}`, p.x, p.y);

      // Term badge (top-right); amber + underline for 300 ms on term change.
      const termAge = !reduced ? terms.get(node.id) : undefined;
      const termFlashing = termAge !== undefined;
      const bx = p.x + nodeRadius * 0.72;
      const by = p.y - nodeRadius * 0.72;
      const br = nodeRadius * 0.46;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = palette.bg;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = termFlashing ? palette.accent : palette.node;
      ctx.stroke();
      ctx.fillStyle = palette.text;
      ctx.font = `600 9px ${palette.fontMono}`;
      ctx.fillText(String(node.status.term), bx, by);
      if (termFlashing) {
        ctx.strokeStyle = palette.accent;
        ctx.beginPath();
        ctx.moveTo(bx - br * 0.5, by + br * 0.55);
        ctx.lineTo(bx + br * 0.5, by + br * 0.55);
        ctx.stroke();
      }

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

      // Log bar under the node: dashed "empty, ready" baseline until entries land.
      const barW = nodeRadius * 2.8;
      const barH = 7;
      const barX = p.x - barW / 2;
      const barY = p.y + nodeRadius + 9;
      const n = node.logTerms.length;
      if (n === 0) {
        drawDashedBaseline(ctx, barX, barY + barH / 2, barW, palette.line);
      } else {
        const committed = node.committedTerms.length;
        const segW = barW / n;
        const fade = fades.get(node.id);
        for (let i = 0; i < n; i++) {
          let alpha: number;
          if (i < committed) {
            alpha = 1;
            if (!reduced && fade && i >= fade.fadeFrom && i < fade.fadeTo) {
              alpha = 0.35 + 0.65 * easeOut((now - fade.fadeAt) / COMMIT_FADE_MS);
            }
          } else {
            alpha = 0.35;
          }
          ctx.fillStyle = termColor(node.logTerms[i], alpha);
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

      // Hover halo.
      if (node.id === hovered) {
        strokeCircle(ctx, p.x, p.y, nodeRadius + 4, 1, palette.node);
      }
    }

    // Arrival rings (delivery feedback), then the quorum flash.
    if (!reduced) {
      for (const f of arrivals) {
        const p = positions.get(f.id);
        if (!p || f.type !== "arrival") continue;
        const t = clamp01((now - f.atMs) / ARRIVAL_MS);
        const color = f.kind === "rv" || f.kind === "rvr" ? palette.teal : palette.accent;
        strokeCircle(ctx, p.x, p.y, nodeRadius + 6 * easeOut(t), 1, color, 0.5 * (1 - t));
      }
      for (const f of quorums) {
        const age = now - f.atMs;
        if (age > QUORUM_RING_MS) continue;
        const p = positions.get(f.id);
        if (!p) continue;
        const t = age / QUORUM_RING_MS;
        strokeCircle(ctx, p.x, p.y, nodeRadius + 7 + 9 * easeOut(t), 1.5, palette.accent, 0.6 * (1 - t));
      }
    }
  }, []);

  // Redraw on any visual state change.
  useEffect(() => {
    draw();
  }, [draw, snapshot, selectedId, linkFirst, mode, reducedMotion, hoveredId]);

  // Redraw on resize (and re-resolve the palette — the CSS box may have moved).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      refreshPalette();
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw, refreshPalette, core]);

  // Resolve the palette once the page (and its CSS) is actually mounted.
  useEffect(() => {
    refreshPalette();
  }, [refreshPalette, core]);

  // ---- interactions --------------------------------------------------------

  const hitTest = useCallback((clientX: number, clientY: number): number | null => {
    const layout = layoutRef.current;
    const canvas = canvasRef.current;
    if (!layout || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let hit: number | null = null;
    for (const [id, pos] of layout.positions) {
      if (Math.hypot(pos.x - x, pos.y - y) <= layout.nodeRadius) {
        hit = id;
        break;
      }
    }
    return hit;
  }, []);

  const onCanvasMove = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      const hit = hitTest(e.clientX, e.clientY);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = hit !== null ? "pointer" : "auto";
      setHoveredId(hit);
    },
    [hitTest],
  );

  const onCanvasLeave = useCallback((): void => {
    setHoveredId(null);
  }, []);

  const onCanvasClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      const hit = hitTest(e.clientX, e.clientY);
      const sim = simRef.current;
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
    [linkFirst, hitTest],
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
  const hoveredNode = snapshot?.nodes.find((n) => n.id === hoveredId) ?? null;
  const readoutNode = hoveredNode ?? selectedNode;
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
            onMouseMove={onCanvasMove}
            onMouseLeave={onCanvasLeave}
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
          <div className="raft-legend raft-mono">
            <p>
              teal = votes · amber = replication (dim = heartbeat) · red = rejected or dropped ·
              bar = log, solid = committed
            </p>
            <p>
              a synthetic client proposes a value every few seconds. the network is simulated; the
              consensus is not.
            </p>
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
                {readoutNode ? (
                  <div className="raft-node-col">
                    <NodeReadoutView node={readoutNode} />
                    {selectedNode && (
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
                    )}
                  </div>
                ) : (
                  <span className="raft-hint">Hover or click a node to inspect it.</span>
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
                  <li key={`${ev.tMs}-${i}`} className={`raft-tone-${ev.tone}`}>
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

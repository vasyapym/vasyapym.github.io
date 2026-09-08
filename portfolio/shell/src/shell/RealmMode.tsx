// RealmMode — the thin react shell over the framework-free realm engine.
//
// owns: the transition phase machine (entering → active), the overlaid door
// <button>s (the a11y path AND the game affordance, one object), the
// open-project panel dialog, the minimal hud (leave + mute + captions),
// touch controls (left stick + enter), and a webaudio bed gated on the enter
// gesture. all heavy per-frame work lives in realm-scene.ts; this file only
// pushes an input vector in and reads the active-door id out.
//
// restorability: this is a sibling overlay — the landing is never touched. we
// lock body scroll on mount and restore it on unmount, so the landing's scroll
// position survives intact. esc steps back (panel → realm), and onExit returns
// focus to the entry chip.

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { ProjectModule } from "../../../contracts/project-module";
import { createRealmScene, type DoorRect, type RealmScene } from "./realm-scene";

type RealmModeProps = {
  projects: readonly ProjectModule[];
  onOpenProject: (id: string) => void;
  onExit: () => void;
};

// one identity hue per door, keyed off the approved card-era palette.
const DOOR_HUES: Record<string, string> = {
  "raft-cluster": "#86aed4",
  "kitty-run": "#dc7f95",
  explosion: "#ff8a3c",
  spine: "#9fb0bd",
  "evening-forest": "#ffb45e",
  "planck-to-now": "#ffd9a0",
  "practice-map": "#7fa8c9",
};

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// tiny webaudio bed — synthesis only, no assets, started on the enter gesture.
function createAudio(): {
  doorOpen: () => void;
  setMuted: (m: boolean) => void;
  close: () => void;
} {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return { doorOpen: () => {}, setMuted: () => {}, close: () => {} };
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.4); // fade the bed in

  // low detuned drone through a lowpass with a slow gain lfo — a cold hall.
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 240;
  lp.connect(master);
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.5;
  droneGain.connect(lp);
  for (const f of [55, 55.4, 82.5]) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(droneGain);
    o.start();
  }
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.18;
  lfo.connect(lfoGain);
  lfoGain.connect(droneGain.gain);
  lfo.start();

  // arrival tone.
  const arr = ctx.createOscillator();
  const arrGain = ctx.createGain();
  arr.type = "sine";
  arr.frequency.value = 174;
  arrGain.gain.value = 0.0001;
  arr.connect(arrGain);
  arrGain.connect(master);
  arr.start();
  arrGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.4);
  arrGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 2.2);

  let crackleTimer = 0;
  const crackle = (): void => {
    const dur = 0.05 + Math.random() * 0.05;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.connect(hp);
    hp.connect(g);
    g.connect(master);
    src.start();
    crackleTimer = window.setTimeout(crackle, 700 + Math.random() * 2600);
  };
  crackleTimer = window.setTimeout(crackle, 900);

  return {
    doorOpen(): void {
      // a low swept whoomph as the gate wakes.
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(120, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + 0.65);
    },
    setMuted(m: boolean): void {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(m ? 0.0001 : 0.5, ctx.currentTime + 0.15);
    },
    close(): void {
      window.clearTimeout(crackleTimer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      window.setTimeout(() => void ctx.close(), 500);
    },
  };
}

export default function RealmMode({ projects, onOpenProject, onExit }: RealmModeProps) {
  const reduced = useMemo(prefersReducedMotion, []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<RealmScene | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const panelCloseRef = useRef<HTMLButtonElement | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);
  const keys = useRef<Set<string>>(new Set());
  const stick = useRef<{ id: number; cx: number; cy: number } | null>(null);

  const [phase, setPhase] = useState<"entering" | "active">(reduced ? "active" : "entering");
  const [rects, setRects] = useState<readonly DoorRect[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const byId = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const openProject = openId ? byId.get(openId) ?? null : null;

  // lock body scroll while open; restore on unmount so landing scroll survives.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // spin up the engine once; own its full lifecycle here.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const doors = projects.slice(0, 7).map((p) => ({ id: p.id, hue: DOOR_HUES[p.id] ?? "#d39b61" }));
    const scene = createRealmScene(canvas, {
      doors,
      reducedMotion: reduced,
      onActiveDoorChange: setActiveId,
      onLayout: setRects,
    });
    sceneRef.current = scene;
    scene.start();
    const onResize = (): void => scene.resize();
    window.addEventListener("resize", onResize);
    audioRef.current = createAudio();
    return () => {
      window.removeEventListener("resize", onResize);
      scene.destroy();
      sceneRef.current = null;
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, [projects, reduced]);

  // entry beat: hold the title, then resolve to the active scene.
  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setPhase("active"), 2000);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const doOpen = useCallback(
    (id: string) => {
      setOpenId(id);
      audioRef.current?.doorOpen();
    },
    [],
  );

  // merge keyboard into the engine's input vector (also used by e/space).
  const pushVector = useCallback(() => {
    const k = keys.current;
    let x = 0;
    let y = 0;
    if (k.has("a") || k.has("arrowleft")) x -= 1;
    if (k.has("d") || k.has("arrowright")) x += 1;
    if (k.has("w") || k.has("arrowup")) y -= 1;
    if (k.has("s") || k.has("arrowdown")) y += 1;
    sceneRef.current?.setMoveVector(x, y);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const key = typeof e.key === "string" ? e.key.toLowerCase() : "";
      if (key === "escape") {
        e.preventDefault();
        if (openId) setOpenId(null);
        else onExit();
        return;
      }
      if (key === "e" || key === " ") {
        // interact with the nearest woken gate.
        const id = sceneRef.current?.getActiveDoorId() ?? null;
        if (id && !openId) {
          e.preventDefault();
          doOpen(id);
        }
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        keys.current.add(key);
        pushVector();
      }
    };
    const up = (e: KeyboardEvent): void => {
      const key = typeof e.key === "string" ? e.key.toLowerCase() : "";
      if (keys.current.delete(key)) pushVector();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [openId, onExit, doOpen, pushVector]);

  // move focus into the realm on mount.
  useEffect(() => {
    const t = window.setTimeout(() => layerRef.current?.focus(), reduced ? 50 : 2050);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // a panel is a modal dialog: focus lands on its close control, ready to esc.
  useEffect(() => {
    if (openId) {
      panelCloseRef.current?.focus();
    }
  }, [openId]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      audioRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  // virtual stick — a left pad whose drag delta becomes the input vector.
  const onStickStart = useCallback((e: PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    stick.current = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onStickMove = useCallback((e: PointerEvent) => {
    const s = stick.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = (e.clientX - s.cx) / 44;
    const dy = (e.clientY - s.cy) / 44;
    sceneRef.current?.setMoveVector(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy)));
  }, []);
  const onStickEnd = useCallback((e: PointerEvent) => {
    if (stick.current?.id === e.pointerId) {
      stick.current = null;
      sceneRef.current?.setMoveVector(0, 0);
    }
  }, []);

  const showTitle = phase === "entering" && !reduced;

  return (
    <div
      ref={layerRef}
      className={`realm-layer${reduced ? " realm-reduced" : ""}${phase === "entering" ? " realm-entering" : " realm-active"}`}
      role="dialog"
      aria-modal="true"
      aria-label="the realm — immersive project navigator"
      tabIndex={-1}
    >
      <canvas ref={canvasRef} className="realm-canvas" aria-hidden="true" />

      {showTitle ? (
        <div className="realm-veil" aria-hidden="true">
          <p className="realm-title">YOU ENTER</p>
          <p className="realm-subtitle">the realm · rest at the fire · approach a gate</p>
        </div>
      ) : null}

      {/* each door is a real button — the game affordance and the a11y path in one. */}
      <div className="realm-doors">
        {rects.map((r) => {
          const p = byId.get(r.id);
          if (!p) return null;
          const woken = activeId === r.id;
          return (
            <button
              key={r.id}
              type="button"
              className={`realm-door${woken ? " realm-door-woken" : ""}`}
              style={{ left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` }}
              onClick={() => doOpen(r.id)}
              aria-label={`door — ${p.title}`}
            >
              <span className="realm-door-label">{p.title}</span>
            </button>
          );
        })}
      </div>

      {/* minimal hud: leave + mute + honest technique caption + one control hint. */}
      <div className="realm-hud">
        <div className="realm-hud-cluster">
          <button type="button" className="realm-btn" onClick={onExit}>← leave</button>
          <button type="button" className="realm-btn" onClick={toggleMute} aria-pressed={muted}>
            <span className="realm-mute-glyph" aria-hidden="true">{muted ? "▫▫" : "▪▪"}</span>
            sound {muted ? "off" : "on"}
          </button>
        </div>
        <p className="realm-caption">realm-wander · ordered-dither · canvas2d · no webgl</p>
        <p className="realm-hint">wasd / arrows to move · e to enter a gate · esc to leave</p>
      </div>

      {/* touch controls — rendered for coarse pointers / small viewports via css. */}
      <div className="realm-touch">
        <div
          className="realm-stick"
          aria-hidden="true"
          onPointerDown={onStickStart}
          onPointerMove={onStickMove}
          onPointerUp={onStickEnd}
          onPointerCancel={onStickEnd}
        >
          <span className="realm-stick-knob" />
        </div>
        <button
          type="button"
          className="realm-touch-enter"
          aria-label="enter the nearest gate"
          onClick={() => {
            const id = sceneRef.current?.getActiveDoorId() ?? null;
            if (id && !openId) doOpen(id);
          }}
        >
          enter
        </button>
      </div>

      {openProject ? (
        <div className="realm-panel" role="dialog" aria-modal="true" aria-labelledby="realm-panel-title">
          <button
            type="button"
            ref={panelCloseRef}
            className="realm-panel-close"
            onClick={() => setOpenId(null)}
            aria-label="close gate"
          >
            ×
          </button>
          <p className="realm-panel-eyebrow">{openProject.eyebrow}</p>
          <h2 id="realm-panel-title" className="realm-panel-title">{openProject.title}</h2>
          <p className="realm-panel-desc">{openProject.description}</p>
          <ul className="realm-panel-tech">
            {openProject.technologies.map((t) => (
              <li key={t} className="realm-panel-chip">{t}</li>
            ))}
          </ul>
          <div className="realm-panel-actions">
            {(openProject.links ?? []).map((l) => (
              <a
                key={l.href}
                className="realm-panel-link"
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noreferrer" : undefined}
              >
                {l.label}
              </a>
            ))}
            <button type="button" className="realm-panel-open" onClick={() => onOpenProject(openProject.id)}>
              open project →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

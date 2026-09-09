// RealmMode.tsx — thin React shell for "the deep". this component is a WIRING
// HARNESS, not a game loop: realm-scene owns rAF / resize / visibility. we own
// the DOM (two stacked canvases, hud, legend, panel, iris, aria-live), forward
// pointer/key gestures into the scene's imperative setters, pull audioSnapshot()
// at ~10 Hz and push it into realm-audio, and drive the phase choreography
// (enter → active → panel → dive → SPA handoff; leave → surface). HARD RULES:
// no per-frame React state; scene/audio live in one strict-safe useEffect that
// never re-runs on prop identity (callbacks read latest via refs); the esc chain,
// legend keyboard access and full cleanup are non-negotiable.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createRealmScene } from "./realm-scene";
import type { RealmScene } from "./realm-scene";
import { createRealmAudio } from "./realm-audio";
import type { RealmAudio } from "./realm-audio";

interface ProjectLink { readonly label: string; readonly href: string; readonly external?: boolean }
interface ProjectModule {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly status: string;
  readonly accent: string;
  readonly links?: readonly ProjectLink[];
}

interface RealmModeProps {
  readonly projects: readonly ProjectModule[];
  readonly onOpenProject: (id: string) => void;
  readonly onExit: () => void;
  readonly entry: { readonly x: number; readonly y: number };
}

type Phase = "entering" | "active" | "leaving" | "diving";

// door hues, catalogue order (index-aligned to the seven ids)
const DOOR_HUES = ["#86aed4", "#dc7f95", "#ff8a3c", "#9fb0bd", "#ffb45e", "#ffd9a0", "#7fa8c9"] as const;

// wasd / arrows → unit thrust vector
const DIR: Record<string, readonly [number, number]> = {
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0],
};

export default function RealmMode({ projects, onOpenProject, onExit, entry }: RealmModeProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const panelCloseRef = useRef<HTMLButtonElement | null>(null);
  const sceneRef = useRef<RealmScene | null>(null);
  const audioRef = useRef<RealmAudio | null>(null);
  const ariaRef = useRef<HTMLDivElement | null>(null);

  // chrome state (changes a handful of times per session — never per frame)
  const [phase, setPhase] = useState<Phase>("entering");
  const [openId, setOpenId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [degraded, setDegraded] = useState(false);

  // latest-value refs so the scene effect can stay empty-deps + strict-safe
  const onOpenRef = useRef(onOpenProject);
  const onExitRef = useRef(onExit);
  const entryRef = useRef(entry);
  const phaseRef = useRef<Phase>("entering");
  const openIdRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const lastAria = useRef<string>("");
  onOpenRef.current = onOpenProject;
  onExitRef.current = onExit;
  entryRef.current = entry;
  phaseRef.current = phase;
  openIdRef.current = openId;
  mutedRef.current = muted;

  // door descriptors, catalogue order → hue by index
  const doors = useMemo(
    () => projects.map((p, i) => ({ id: p.id, hue: DOOR_HUES[i] ?? "#9fb0bd" })),
    [projects],
  );
  const names = useMemo(() => projects.map((p) => p.title), [projects]);
  const hueOf = useCallback(
    (id: string) => doors.find((d) => d.id === id)?.hue ?? "#9fb0bd",
    [doors],
  );
  const projectOf = useCallback(
    (id: string) => projects.find((p) => p.id === id) ?? null,
    [projects],
  );

  // open a creature's panel from anywhere (pointer, key, or legend) — a11y core
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
  }, []);
  // latest-value ref so the empty-deps input effect can select without re-binding
  const openPanelRef = useRef(openProjectPanel);
  openPanelRef.current = openProjectPanel;

  const closePanel = useCallback(() => {
    setOpenId(null);
    layerRef.current?.focus(); // esc-chain step one returns focus to the layer
  }, []);

  const doLeave = useCallback(() => {
    if (phaseRef.current === "leaving" || phaseRef.current === "diving") return;
    setOpenId(null);
    setPhase("leaving");
    const e = entryRef.current;
    sceneRef.current?.startLeave(e.x, e.y); // reuse entry as the chip-equivalent
  }, []);

  const confirmDive = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    setPhase("diving");
    sceneRef.current?.startDive(id);
    audioRef.current?.dive();
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  // ONE effect owns scene + audio + listeners + body-lock; empty deps, strict-safe
  useEffect(() => {
    const gl = glRef.current;
    const overlay = overlayRef.current;
    if (!gl || !overlay) return;

    let alive = true;
    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
    const smallScreen = typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse), (max-width: 520px)").matches
      : false;

    const audio = createRealmAudio();
    audioRef.current = audio;

    // scene callbacks read latest React setters through the stable closures above
    const scene = createRealmScene(gl, overlay, {
      doors,
      names,
      reducedMotion,
      smallScreen,
      onPhaseDone: (p) => {
        if (!alive) return;
        if (p === "entering") {
          setPhase("active");
          layerRef.current?.focus(); // focus the layer once we're swimming
        } else if (p === "leaving") {
          onExitRef.current();       // unmount + chip refocus is LandingPage's job
        }
      },
      onDiveCommit: (id) => {
        if (!alive) return;
        onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
      },
      onNearest: (id) => {
        if (!alive || !ariaRef.current) return;
        // throttle: announce only when the nearest actually changes
        const msg = id ? `${projectOf(id)?.title ?? id} — press enter to open` : "";
        if (msg !== lastAria.current) {
          lastAria.current = msg;
          ariaRef.current.textContent = msg;
        }
      },
    });
    sceneRef.current = scene;
    setDegraded(scene.qualityLevel() === -1);

    const e = entryRef.current;
    scene.startEnter(e.x, e.y);

    // ---- body scroll lock (preserve landing scroll position) ----
    const scrollY = window.scrollY;
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    // ---- input plumbing ----
    // resume() is idempotent and cheap; call it from every gesture so a
    // rejected first resume never strands the context (no latch).
    const tryResume = (): void => {
      audio.resume();
    };

    const isTouch = (ev: PointerEvent) => ev.pointerType === "touch";
    const CHROME_SEL = ".realm-hud, .realm-legend, .realm-panel";
    // pointer over HUD / legend / panel (or their children): scene must not be driven
    const overChrome = (ev: PointerEvent) => {
      const t = ev.target;
      return t instanceof Element && t.closest(CHROME_SEL) !== null;
    };
    const lifted = (ev: PointerEvent) => (isTouch(ev) ? ev.clientY - 60 : ev.clientY);

    // deliberate-gesture state (plain locals — no React state, no rAF)
    const SELECT_MOVE = 8;      // px of total movement allowed for a select
    const SELECT_MS = 350;      // max press duration for a select
    let downId = -1;            // active primary pointer id, -1 = none
    let downX = 0, downY = 0, downT = 0;
    let moved = false;          // exceeded SELECT_MOVE during this press
    let holding = false;        // press promoted to travel+call
    let holdTimer: number | undefined;

    const promoteToHold = () => {
      if (holding || downId < 0) return;
      holding = true;
      scene.setCalling(true);
    };
    const clearHold = () => {
      if (holdTimer !== undefined) { window.clearTimeout(holdTimer); holdTimer = undefined; }
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;
      if (overChrome(ev)) {
        // release: lantern coasts to rest via the existing else-branch drag
        scene.setPointer(ev.clientX, lifted(ev), false);
        if (downId === ev.pointerId) { clearHold(); scene.setCalling(false); downId = -1; holding = false; }
        return;
      }
      if (downId === ev.pointerId && !moved) {
        if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > SELECT_MOVE) {
          moved = true;
          clearHold();
          promoteToHold(); // dragging = travelling; call engages
        }
      }
      scene.setPointer(ev.clientX, lifted(ev), true);
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (!ev.isPrimary || overChrome(ev)) return; // chrome keeps native click/focus
      tryResume();
      if (phaseRef.current !== "active") return;
      downId = ev.pointerId;
      downX = ev.clientX; downY = ev.clientY; downT = ev.timeStamp;
      moved = false; holding = false;
      clearHold();
      scene.setPointer(ev.clientX, lifted(ev), true);
      // not calling yet: a quick release is a select; a held press becomes a call
      holdTimer = window.setTimeout(promoteToHold, SELECT_MS);
    };

    const endPointer = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;
      const wasPress = downId === ev.pointerId;
      clearHold();
      scene.setCalling(false);
      if (wasPress) {
        const quick = !moved && !holding && ev.type === "pointerup"
          && ev.timeStamp - downT < SELECT_MS && !overChrome(ev);
        downId = -1; holding = false;
        if (quick && phaseRef.current === "active") {
          // pick against the TAP POINT (same-tick geometry, no rAF dependency)
          const id = scene.pickAt(downX, downY, isTouch(ev));
          if (id) openPanelRef.current(id);
        }
      }
      if (isTouch(ev)) scene.setPointer(ev.clientX, ev.clientY - 60, false);
    };
    const onMouseLeave = () => { clearHold(); scene.setCalling(false); downId = -1; holding = false; scene.setPointer(0, 0, false); };
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      scene.breatheLight(ev.deltaY > 0 ? -1 : 1);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return; // never hijack shortcuts
      const k = ev.key.toLowerCase();

      if (k === "escape") {
        ev.preventDefault();
        if (phaseRef.current === "diving") return; // the dive owns the screen now
        if (openIdRef.current) closePanel(); // esc-chain: panel first…
        else doLeave();                      // …then surface
        return;
      }

      // don't drive the world while a panel is focused, except esc (handled above)
      if (openIdRef.current) return;

      if (k in DIR) {
        ev.preventDefault();
        tryResume();
        const [x, y] = DIR[k];
        scene.setThrust(x, y);
        return;
      }
      if (k >= "1" && k <= "7") {
        ev.preventDefault();
        tryResume();
        const idx = Number(k) - 1;
        scene.warpTo(idx);
        scene.setPointer(0, 0, false); // stop the mouse yanking the camera back
        return;
      }
      if (k === "e" || k === "enter" || k === " " || ev.key === " ") {
        // a focused button/link owns its own Enter/Space — the native click on a
        // legend button must open THAT project, never the nearest creature.
        const t = ev.target;
        if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
        ev.preventDefault();
        tryResume();
        const id = scene.nearestId();
        if (id) openProjectPanel(id);
        return;
      }
      if (k === "m") {
        ev.preventDefault();
        toggleMute();
        return;
      }
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k in DIR) { ev.preventDefault(); scene.setThrust(0, 0); } // release thrust
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      alive = false;
      clearHold();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      // restore scroll + body style; instant — the global smooth scroll-behavior
      // must not animate the visitor back to where they were.
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      window.scrollTo({ top: scrollY, behavior: "instant" });
      scene.destroy();
      audio.dispose();
      sceneRef.current = null;
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ~10 Hz audio mixing, active phase only
  useEffect(() => {
    if (phase !== "active") return;
    const id = window.setInterval(() => {
      const scene = sceneRef.current;
      const audio = audioRef.current;
      if (scene && audio) audio.update(scene.audioSnapshot());
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  // focus the panel's close button when a creature opens
  useEffect(() => {
    if (openId) panelCloseRef.current?.focus();
  }, [openId]);

  const opened = openId ? projectOf(openId) : null;
  const glMode = !degraded; // fade + gpu caption only when GL actually owns pixels

  return (
    <div
      ref={layerRef}
      className={
        "realm-layer" +
        (degraded ? " realm-layer--degraded" : "") +
        (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? " realm-reduced" : "")
      }
      role="dialog"
      aria-modal="true"
      aria-label="the deep — immersive project navigator"
      tabIndex={-1}
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={glRef}
        className={"realm-gl" + (phase === "leaving" && glMode ? " realm-gl--fade" : "")}
      />
      <canvas ref={overlayRef} className="realm-overlay" aria-hidden="true" />

      {phase === "diving" && openId ? (
        <div
          className="realm-iris"
          aria-hidden="true"
          style={{ ["--iris-hue" as string]: hueOf(openId) } as CSSProperties}
        />
      ) : null}

      <div className="realm-hud">
        <button type="button" className="realm-btn realm-btn--leave" onClick={doLeave}>
          ← surface
        </button>
        <button
          type="button"
          className="realm-btn realm-btn--mute"
          aria-pressed={muted}
          aria-label={muted ? "sound off" : "sound on"}
          onClick={toggleMute}
        >
          {muted ? "sound off" : "sound on"}
        </button>
      </div>

      <p className="realm-caption">
        {degraded ? "the deep · shallow water · canvas2d" : "the deep · gpu fluid · webgl + canvas2d"}
      </p>

      <nav className="realm-legend" aria-label="creatures">
        {projects.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className="realm-legend-btn"
            onClick={() => openProjectPanel(p.id)}
          >
            <span
              className="realm-legend-dot"
              aria-hidden="true"
              style={{ background: DOOR_HUES[i] ?? "#9fb0bd" }}
            />
            door — {p.title}
          </button>
        ))}
      </nav>

      {opened ? (
        <div className="realm-panel" role="document">
          <button
            ref={panelCloseRef}
            type="button"
            className="realm-panel-close"
            aria-label="close"
            onClick={closePanel}
          >
            ×
          </button>
          <p className="realm-panel-eyebrow">{opened.eyebrow}</p>
          <h2 className="realm-panel-title">{opened.title}</h2>
          <p className="realm-panel-desc">{opened.description}</p>
          <ul className="realm-panel-tech">
            {opened.technologies.map((t) => (
              <li key={t} className="realm-panel-chip">{t}</li>
            ))}
          </ul>
          {opened.links && opened.links.length > 0 ? (
            <div className="realm-panel-links">
              {opened.links.map((l) =>
                l.external ? (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="realm-panel-link">
                    {l.label}
                  </a>
                ) : (
                  <a key={l.href} href={l.href} className="realm-panel-link">{l.label}</a>
                ),
              )}
            </div>
          ) : null}
          <button
            type="button"
            className="realm-panel-dive"
            onClick={() => confirmDive(opened.id)}
          >
            dive in →
          </button>
        </div>
      ) : null}

      <div ref={ariaRef} className="realm-aria" aria-live="polite" />
    </div>
  );
}

// RealmMode.tsx — thin React shell for "the deep". this component is a WIRING
// HARNESS, not a game loop: realm-scene owns rAF / resize / visibility. we own
// the DOM (two stacked canvases, hud, legend, panel, iris, aria-live), forward
// pointer/key gestures into the scene's imperative setters, pull audioSnapshot()
// at ~10 Hz and push it into realm-audio, and drive the phase choreography
// (enter → active → panel → dive → SPA handoff; leave → surface). HARD RULES:
// no per-frame React state; scene/audio live in one strict-safe useEffect that
// never re-runs on prop identity (callbacks read latest via refs); the esc chain,
// legend keyboard access and full cleanup are non-negotiable.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  readonly onEntered?: () => void;
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

// computed opacity-transition duration in ms (transitionend fallback timing)
function opacityTransitionMs(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const properties = style.transitionProperty.split(",").map((s) => s.trim());
  const durations = style.transitionDuration.split(",").map(cssTimeMs);
  const delays = style.transitionDelay.split(",").map(cssTimeMs);

  let result = 0;

  properties.forEach((property, index) => {
    if (property !== "opacity" && property !== "all") return;

    const duration = durations[index % durations.length] ?? 0;
    const delay = delays[index % delays.length] ?? 0;
    result = Math.max(result, duration + delay);
  });

  return Math.max(0, result);
}

function cssTimeMs(value: string): number {
  const text = value.trim();
  const number = Number.parseFloat(text);
  if (!Number.isFinite(number)) return 0;
  return text.endsWith("ms") ? number : number * 1000;
}

export default function RealmMode({ projects, onOpenProject, onExit, onEntered, entry }: RealmModeProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const panelCloseRef = useRef<HTMLButtonElement | null>(null);
  const sceneRef = useRef<RealmScene | null>(null);
  const audioRef = useRef<RealmAudio | null>(null);
  const ariaRef = useRef<HTMLDivElement | null>(null);
  const leaveGateRef = useRef<{
    begin(): void;
    sceneDone(): void;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelStopRef = useRef<(() => void) | null>(null);
  const cancelRealmGestureRef = useRef<(() => void) | null>(null);

  // chrome state (changes a handful of times per session — never per frame)
  const [phase, setPhase] = useState<Phase>("entering");
  const [openId, setOpenId] = useState<string | null>(null);
  const [divingId, setDivingId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [degraded, setDegraded] = useState(false);
  // r13: which edge the sheet anchors to for the open creature (null = closed)
  const [side, setSide] = useState<"left" | "right" | null>(null);
  // cancels a pending close-fade side clear so it cannot fire on the NEXT
  // panel's open transition (stale-listener guard)
  const sideClearRef = useRef<(() => void) | null>(null);

  // latest-value refs so the scene effect can stay empty-deps + strict-safe
  const onOpenRef = useRef(onOpenProject);
  const onExitRef = useRef(onExit);
  const entryRef = useRef(entry);
  const phaseRef = useRef<Phase>("entering");
  // one-shot: App's route swap must observe the settled "active" phase exactly
  // once, immune to Strict Mode effect replays and later phase churn.
  const enteredNotifiedRef = useRef(false);
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

  const resetDirectInputRef = useRef<(() => void) | null>(null);

  // open a creature's panel from anywhere (pointer, key, or legend) — a11y core
  const openProjectPanel = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    sceneRef.current?.setLanternHold(true);
    setOpenId(id);
    sceneRef.current?.startGreeting(id);
    audioRef.current?.greeting(id);
    // r13: recompose the view + pick the sheet side before the first paint
    sideClearRef.current?.();
    sideClearRef.current = null;
    setSide(sceneRef.current?.pickSide(id) ?? "right");
    sceneRef.current?.frameSelection(id);
  }, []);
  // latest-value ref so the empty-deps input effect can select without re-binding
  const openPanelRef = useRef(openProjectPanel);
  openPanelRef.current = openProjectPanel;

  const closePanel = useCallback(() => {
    resetDirectInputRef.current?.();
    sceneRef.current?.setLanternHold(false);
    sceneRef.current?.frameSelection(null); // camY stays where the frame left it
    panelStopRef.current?.(); // cancels entrance frames + delayed focus, hides now
    setOpenId(null);
    // clear the side attribute when the fade finishes (fallback timer covers a
    // missing transitionend); the wrapper itself is stationary — r9 law. The
    // whole teardown is cancellable so a rapid re-open cannot inherit it.
    const el = panelRef.current;
    if (el) {
      const cleanup = () => {
        window.clearTimeout(tid);
        el.removeEventListener("transitionend", onEnd);
        if (sideClearRef.current === cancel) sideClearRef.current = null;
        setSide(null);
      };
      const cancel = () => {
        window.clearTimeout(tid);
        el.removeEventListener("transitionend", onEnd);
        if (sideClearRef.current === cancel) sideClearRef.current = null;
      };
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName === "opacity" && !el.classList.contains("is-open")) {
          cleanup();
        }
      };
      const tid = setTimeout(cleanup, 300);
      el.addEventListener("transitionend", onEnd);
      sideClearRef.current = cancel;
    } else {
      setSide(null);
    }
    layerRef.current?.focus({ preventScroll: true }); // esc-chain step one returns focus to the layer
  }, []);

  const doLeave = useCallback(() => {
    if (
      phaseRef.current === "leaving" ||
      phaseRef.current === "diving"
    ) return;

    phaseRef.current = "leaving";
    cancelRealmGestureRef.current?.(); // an in-flight gesture must not survive departure
    setOpenId(null);
    setPhase("leaving");

    leaveGateRef.current?.begin();

    const entry = entryRef.current;
    const scene = sceneRef.current;
    if (scene) {
      scene.startLeave(entry.x, entry.y); // reuse entry as the chip-equivalent
    } else {
      leaveGateRef.current?.sceneDone();
    }
  }, []);

  const confirmDive = useCallback((id: string) => {
    if (phaseRef.current !== "active") return;
    resetDirectInputRef.current?.();
    cancelRealmGestureRef.current?.(); // an in-flight hold must not survive the dive
    phaseRef.current = "diving";
    setSide(null);
    setDivingId(id);
    setPhase("diving");
    sceneRef.current?.startDive(id);
    audioRef.current?.dive();
  }, []);

  const confirmDiveRef = useRef(confirmDive);
  confirmDiveRef.current = confirmDive;

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
    const layer = layerRef.current;
    if (!gl || !overlay || !layer) return;

    let alive = true;
    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
    const smallScreen = typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse), (max-width: 520px)").matches
      : false;

    const audio = createRealmAudio();
    audioRef.current = audio;

    // Normal exit:
    //   unlock the body at begin(), beneath the fully opaque layer.
    //   At opacity zero, retire canvas layers, then wait one beat for
    //   release eligibility alongside the existing 150 ms settlement floor.
    // Watchdog:
    //   explicitly hide at 1,500 ms, then use the same staged handoff.
    const EXIT_SETTLE_MS = 150;
    const EXIT_WATCHDOG_MS = 1500;
    const EXIT_BEAT_FALLBACK_MS = 64;

    let leaveStarted = false;
    let leaveSceneDone = false;
    let leaveVisualDone = false;
    let teardownStarted = false;
    let settleDone = false;
    let stagesDone = false;
    let landingScrollRestored = false;
    let exitSent = false;

    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelExitBeat: (() => void) | null = null;
    let leaveLayer: HTMLDivElement | null = null;

    const hiddenCanvases: Array<{
      node: HTMLCanvasElement;
      display: string;
      priority: string;
    }> = [];

    // This remains the sole body/scroll restoration implementation.
    // Normal surface exit calls it between rendering stages.
    // Effect cleanup calls it as the fallback for every other teardown.
    const restoreLandingScroll = (): void => {
      if (landingScrollRestored) return;
      landingScrollRestored = true;

      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };

    // A bounded rendering opportunity, not a GPU-commit assertion.
    // Two nested callbacks leave an opportunity to paint between stages.
    // The timer prevents a stopped/throttled rAF stream from stranding exit.
    const afterExitBeat = (next: () => void): (() => void) => {
      let finished = false;
      let firstFrame: number | null = null;
      let secondFrame: number | null = null;
      let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

      const cancel = (): void => {
        finished = true;

        if (firstFrame !== null) {
          cancelAnimationFrame(firstFrame);
          firstFrame = null;
        }

        if (secondFrame !== null) {
          cancelAnimationFrame(secondFrame);
          secondFrame = null;
        }

        if (fallbackTimer !== null) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
      };

      const finish = (): void => {
        if (finished) return;
        cancel();
        if (alive) next();
      };

      firstFrame = requestAnimationFrame(() => {
        firstFrame = null;
        if (finished) return;

        secondFrame = requestAnimationFrame(() => {
          secondFrame = null;
          finish();
        });
      });

      fallbackTimer = setTimeout(finish, EXIT_BEAT_FALLBACK_MS);

      return cancel;
    };

    const clearWatchdog = (): void => {
      if (watchdogTimer !== null) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    };

    const sendExitIfReady = (): void => {
      if (
        !alive || exitSent || !teardownStarted ||
        !settleDone || !stagesDone
      ) return;

      exitSent = true;

      if (leaveLayer) {
        leaveLayer.dataset.realmExitStage = "release";
      }

      onExitRef.current();
    };

    const maybeFinishLeave = (): void => {
      if (
        !alive || !leaveStarted || !leaveSceneDone || !leaveVisualDone ||
        teardownStarted || exitSent
      ) return;

      // Do not accept a stale or synthetic transition completion while
      // the layer still has a visible opacity.
      if (
        leaveLayer &&
        Number.parseFloat(getComputedStyle(leaveLayer).opacity) !== 0
      ) return;

      teardownStarted = true;
      clearWatchdog();

      // Settlement runs in parallel with staging, not after it.
      exitTimer = setTimeout(() => {
        exitTimer = null;
        if (!alive) return;
        settleDone = true;
        sendExitIfReady();
      }, EXIT_SETTLE_MS);

      // Stage 1: retire render layers only at opacity zero.
      // The body is already unlocked; shell inertness remains unchanged.
      // Keep React ownership of all DOM nodes.
      if (leaveLayer) {
        leaveLayer.querySelectorAll("canvas").forEach((node) => {
          hiddenCanvases.push({
            node,
            display: node.style.getPropertyValue("display"),
            priority: node.style.getPropertyPriority("display"),
          });

          node.style.setProperty("display", "none", "important");
        });
      }

      // Idempotent scene destruction stops resize/render work and disposes
      // GL resources. It must continue to avoid WEBGL_lose_context.
      // Continue the handoff even if a driver-facing disposal call throws.
      try {
        scene.destroy();
      } catch (error) {
        console.error("realm scene retirement failed", error);
      }

      if (leaveLayer) {
        leaveLayer.dataset.realmExitStage = "retired";
      }

      cancelExitBeat = afterExitBeat(() => {
        cancelExitBeat = null;
        if (!alive || exitSent) return;

        // Stage 2: release becomes eligible after one retirement beat.
        // Parent release still waits for the original settlement floor.
        stagesDone = true;
        sendExitIfReady();
      });
    };

    const onLeaveTransitionEnd = (event: TransitionEvent): void => {
      if (
        !alive || !leaveStarted ||
        event.target !== leaveLayer ||
        event.propertyName !== "opacity"
      ) return;

      if (
        leaveLayer &&
        Number.parseFloat(getComputedStyle(leaveLayer).opacity) !== 0
      ) return;

      leaveVisualDone = true;
      maybeFinishLeave();
    };

    const leaveGate = {
      begin(): void {
        if (!alive || leaveStarted) return;
        leaveStarted = true;

        // First rendering-relevant exit action: restore once, instantly,
        // while the reveal layer is still fully opaque. The scrollbar-gutter
        // reflow (the Windows-Edge lateral shift) lands in the fade's first
        // frame, and wheel/touch input works from frame one.
        restoreLandingScroll();

        // Self-contained audio exit; does not depend on the active mixer effect.
        audio.surface();

        leaveLayer = layerRef.current;
        if (leaveLayer) {
          leaveLayer.addEventListener("transitionend", onLeaveTransitionEnd);
          leaveLayer.classList.add("realm--surfacing");
        } else {
          // No DOM layer exists to animate.
          leaveVisualDone = true;
        }

        watchdogTimer = setTimeout(() => {
          watchdogTimer = null;
          if (!alive || exitSent || teardownStarted) return;

          // Establish an invisible layer before entering any teardown stage.
          if (leaveLayer) {
            leaveLayer.style.transition = "none";
            leaveLayer.style.opacity = "0";
            leaveLayer.style.visibility = "hidden";
          }

          leaveVisualDone = true;
          leaveSceneDone = true;
          maybeFinishLeave();
        }, EXIT_WATCHDOG_MS);
      },

      sceneDone(): void {
        if (!alive || !leaveStarted) return;
        leaveSceneDone = true;
        maybeFinishLeave();
      },
    };

    leaveGateRef.current = leaveGate;

    const cleanupLeaveGate = (): void => {
      clearWatchdog();

      if (exitTimer !== null) {
        clearTimeout(exitTimer);
        exitTimer = null;
      }

      if (cancelExitBeat !== null) {
        cancelExitBeat();
        cancelExitBeat = null;
      }

      // Restore effect-owned inline declarations for reusable DOM nodes.
      // During normal unmount these restorations and React's DOM removal
      // occur in the same synchronous cleanup/commit, without a paint.
      for (const saved of hiddenCanvases) {
        if (saved.display === "") {
          saved.node.style.removeProperty("display");
        } else {
          saved.node.style.setProperty(
            "display",
            saved.display,
            saved.priority,
          );
        }
      }
      hiddenCanvases.length = 0;

      if (leaveLayer) {
        leaveLayer.removeEventListener(
          "transitionend",
          onLeaveTransitionEnd,
        );
        leaveLayer.classList.remove("realm--surfacing");
        leaveLayer.style.removeProperty("transition");
        leaveLayer.style.removeProperty("opacity");
        leaveLayer.style.removeProperty("visibility");
        delete leaveLayer.dataset.realmExitStage;
      }

      if (leaveGateRef.current === leaveGate) {
        leaveGateRef.current = null;
      }

      leaveLayer = null;
    };

    // scene callbacks read latest React setters through the stable closures above
    const scene = createRealmScene(gl, overlay, {
      doors,
      names,
      reducedMotion,
      smallScreen,
      onPhaseDone: (p) => {
        if (!alive) return;

        if (p === "entering") {
          // Ignore a stale entering completion if leave began during entry.
          if (
            phaseRef.current === "leaving" ||
            phaseRef.current === "diving"
          ) return;

          setPhase("active");
          phaseRef.current = "active";
          layerRef.current?.focus(); // focus the layer once we're swimming
        } else if (p === "leaving") {
          leaveGate.sceneDone();
        }
      },
      onDiveCommit: (id) => {
        if (!alive) return;
        onOpenRef.current(id);       // SPA handoff; the realm unmounts naturally
      },
      onNearest: (id) => {
        if (!alive || !ariaRef.current) return;
        // throttle: announce only when the nearest actually changes
        const desktopFine = window.matchMedia(
          "(any-hover: hover) and (any-pointer: fine)",
        ).matches;
        const instruction = desktopFine
          ? "on the scene, press enter to dive in; press e or space for details; double-click a creature to dive in"
          : "press enter for details";
        const msg = id
          ? `${projectOf(id)?.title ?? id} — ${instruction}`
          : "";
        if (msg !== lastAria.current) {
          lastAria.current = msg;
          ariaRef.current.textContent = msg;
        }
      },
    });
    sceneRef.current = scene;
    if (import.meta.env.DEV) {
      (window as Window & { __realmScene?: typeof scene }).__realmScene = scene;
      (window as Window & { __r13?: unknown }).__r13 = {
        getDepthSnapshot: () => scene.getDepthSnapshot(),
        getFrameSnapshot: () => scene.getFrameSnapshot(),
      };
    }
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

    const overChrome = (ev: PointerEvent) => {
      const target = ev.target;
      return target instanceof Element && target.closest(CHROME_SEL) !== null;
    };

    const lifted = (ev: PointerEvent) =>
      isTouch(ev)
        ? ev.clientY -
          Math.min(64, Math.max(24, 1.6 * (sceneRef.current?.lightRadius() ?? 48)))
        : ev.clientY;

    // deliberate-gesture state (plain locals — no React state, no rAF)
    const SELECT_MOVE = 8;      // px of total movement allowed for a select
    const SELECT_MS = 350;      // max press duration for a select
    const TARGET_TOUCH_MOVE = 18; // creature-origin press: forgiving wobble allowance
    const TARGET_MOUSE_MOVE = 10;
    let downId = -1;            // active primary pointer id, -1 = none
    let downX = 0, downY = 0, downT = 0;
    let downTouch = false;
    let moved = false;          // exceeded the allowance during this press
    let holding = false;        // press promoted to travel+call
    let downPick: string | null = null; // creature reserved at pointer-down
    let holdTimer: number | undefined;
    let lastX = 0;
    let lastY = 0;

    const desktopFine = window.matchMedia(
      "(any-hover: hover) and (any-pointer: fine)",
    );
    const DOUBLE_MS = 320;
    const DOUBLE_MOVE = 8;

    type QuickPick = {
      id: string;
      x: number;
      y: number;
      releasedAt: number;
    };

    let lastQuickPick: QuickPick | null = null;
    let secondQuickPick: QuickPick | null = null;
    let downMouseFine = false;
    let consumeSecondClick = false;

    const resetDirectInput = () => {
      lastQuickPick = null;
      secondQuickPick = null;
    };

    const overPanelOnly = (ev: PointerEvent) => {
      const target = ev.target;
      return (
        target instanceof Element &&
        target.closest(".realm-panel") !== null &&
        target.closest(".realm-hud, .realm-legend") === null
      );
    };

    const onDirectClickCapture = (ev: MouseEvent) => {
      if (!consumeSecondClick || ev.button !== 0 || ev.detail === 0) return;
      consumeSecondClick = false;
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };

    const clearHold = () => {
      if (holdTimer !== undefined) {
        window.clearTimeout(holdTimer);
        holdTimer = undefined;
      }
    };

    const cancelGesture = () => {
      clearHold();

      // Opening a panel cancels the idle world gesture after the first release.
      // Preserve that first release, but never preserve an in-flight pair.
      if (downId !== -1) lastQuickPick = null;
      secondQuickPick = null;

      downId = -1;
      downPick = null;
      downMouseFine = false;
      moved = false;
      holding = false;
      scene.setCalling(false);
      scene.setPointer(lastX, lastY, false);
    };

    const promoteToHold = () => {
      if (holding || downId < 0 || phaseRef.current !== "active") return;
      holding = true;
      scene.setCalling(true);
    };

    const observeMovement = (x: number, y: number) => {
      if (downId < 0 || moved) return;

      const allowance = downPick
        ? downTouch
          ? TARGET_TOUCH_MOVE
          : TARGET_MOUSE_MOVE
        : SELECT_MOVE;

      if (Math.hypot(x - downX, y - downY) > allowance) {
        moved = true; // sticky: moving back does not turn a drag into a tap
        downPick = null;
        resetDirectInput();
        clearHold();
        promoteToHold();
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (!ev.isPrimary || downId !== -1) return;

      // A new primary press owns any following compatibility click.
      consumeSecondClick = false;

      if (ev.pointerType === "mouse" && ev.button !== 0) {
        resetDirectInput();
        return;
      }

      tryResume();
      if (phaseRef.current !== "active") {
        resetDirectInput();
        return;
      }

      const mouseFine =
        ev.pointerType === "mouse" &&
        ev.button === 0 &&
        desktopFine.matches;

      const previous = lastQuickPick;
      const elapsed = previous
        ? ev.timeStamp - previous.releasedAt
        : -1;

      const candidate =
        mouseFine &&
        previous !== null &&
        elapsed >= 0 &&
        elapsed <= DOUBLE_MS &&
        Math.hypot(
          ev.clientX - previous.x,
          ev.clientY - previous.y,
        ) <= DOUBLE_MOVE
          ? previous
          : null;

      resetDirectInput();

      const chrome = overChrome(ev);

      // Ordinary chrome remains native. Only a spatially and temporally
      // matching second mouse press may inspect the scene behind the sheet.
      if (chrome && !(candidate && overPanelOnly(ev))) return;

      const touch = isTouch(ev);

      // Consume exactly one snapshot at pointer-down.
      scene.markPickAnchor(touch);
      const picked = scene.pickAt(ev.clientX, ev.clientY, touch);
      const matchingPair =
        candidate !== null && picked === candidate.id
          ? candidate
          : null;

      if (chrome && matchingPair === null) return;

      clearHold();

      downId = ev.pointerId;
      downX = ev.clientX;
      downY = ev.clientY;
      downT = ev.timeStamp;
      downTouch = touch;
      downMouseFine = mouseFine;
      downPick = picked;
      secondQuickPick = matchingPair;
      moved = false;
      holding = false;

      if (matchingPair) {
        // Prevent sheet focus on this press. Its subsequent native click is
        // consumed separately, including when the paired press later expires.
        consumeSecondClick = true;
        ev.preventDefault();
        ev.stopPropagation();
      }

      lastX = ev.clientX;
      lastY = lifted(ev);
      scene.setCalling(false);
      scene.setPointer(lastX, lastY, true);

      // A target-origin press is reserved until release or an intentional drag.
      // Empty-space holds retain the original calling deadline.
      if (!downPick) {
        holdTimer = window.setTimeout(() => {
          holdTimer = undefined;
          promoteToHold();
        }, SELECT_MS);
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;

      // Do not let another pointer type steer an existing primary gesture.
      if (downId !== -1 && downId !== ev.pointerId) return;

      lastX = ev.clientX;
      lastY = lifted(ev);

      if (phaseRef.current !== "active") {
        resetDirectInput();
        cancelGesture();
        return;
      }

      const pairedPanelMove =
        downId === ev.pointerId &&
        secondQuickPick !== null &&
        overPanelOnly(ev);

      if (overChrome(ev) && !pairedPanelMove) {
        cancelGesture();
        return;
      }

      if (downId === ev.pointerId) {
        // Preserve excursions reported in coalesced samples where supported.
        const samples = ev.getCoalescedEvents?.() ?? [];
        for (const sample of samples) {
          observeMovement(sample.clientX, sample.clientY);
        }
        observeMovement(ev.clientX, ev.clientY);
      }

      scene.setPointer(lastX, lastY, true);
    };

    const endPointer = (ev: PointerEvent) => {
      if (!ev.isPrimary || downId !== ev.pointerId) return;

      lastX = ev.clientX;
      lastY = lifted(ev);

      const pairedPanelRelease =
        secondQuickPick !== null && overPanelOnly(ev);

      const validRelease =
        ev.type === "pointerup" &&
        phaseRef.current === "active" &&
        (!overChrome(ev) || pairedPanelRelease);

      // Some devices deliver a final displacement only with pointerup.
      if (validRelease) observeMovement(ev.clientX, ev.clientY);

      const quick =
        !moved &&
        !holding &&
        ev.timeStamp - downT < SELECT_MS;

      // Preserve the shipped creature-origin selection behavior, including
      // unmoved reserved presses that last longer than SELECT_MS.
      const id =
        validRelease && !moved && !holding && (downPick !== null || quick)
          ? downPick
          : null;

      const releaseTouch = downTouch;
      const releaseMouseFine = downMouseFine;
      const releaseX = downX;
      const releaseY = downY;
      const paired = secondQuickPick;

      const direct =
        id !== null &&
        quick &&
        releaseMouseFine &&
        desktopFine.matches &&
        ev.pointerType === "mouse" &&
        paired !== null &&
        paired.id === id &&
        ev.timeStamp - paired.releasedAt >= 0 &&
        ev.timeStamp - paired.releasedAt <= DOUBLE_MS;

      clearHold();
      downId = -1;
      downPick = null;
      downMouseFine = false;
      secondQuickPick = null;
      moved = false;
      holding = false;
      scene.setCalling(false);

      scene.setPointer(
        lastX,
        lastY,
        !releaseTouch && validRelease,
      );

      lastQuickPick = null;

      if (direct && id !== null) {
        confirmDiveRef.current(id);
        return;
      }

      if (id !== null) {
        if (
          quick &&
          releaseMouseFine &&
          desktopFine.matches &&
          ev.pointerType === "mouse"
        ) {
          lastQuickPick = {
            id,
            x: releaseX,
            y: releaseY,
            releasedAt: ev.timeStamp,
          };
        }

        openPanelRef.current(id);
      }
    };

    const onPointerLeave = (ev: PointerEvent) => {
      if (ev.isPrimary) resetDirectInput();
      if (ev.pointerId === downId) cancelGesture();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        resetDirectInput();
        cancelGesture();
      }
    };

    const onDirectBlur = () => {
      resetDirectInput();
    };

    resetDirectInputRef.current = resetDirectInput;
    cancelRealmGestureRef.current = cancelGesture;

    const previousLayerTitle = layer.getAttribute("title");
    layer.setAttribute(
      "title",
      "mouse: double-click a creature to dive in; desktop scene: enter to dive in, e or space for details",
    );

    // No pointer capture: ordinary chrome retains native click and focus.
    // Only a qualified second mouse press consumes its compatibility click.
    layer.addEventListener("pointerdown", onPointerDown);
    layer.addEventListener("pointerleave", onPointerLeave);
    layer.addEventListener("click", onDirectClickCapture, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    window.addEventListener("blur", cancelGesture);
    window.addEventListener("blur", onDirectBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const stopDirectInput = () => {
      layer.removeEventListener("click", onDirectClickCapture, true);
      window.removeEventListener("blur", onDirectBlur);
      resetDirectInput();
      consumeSecondClick = false;

      if (resetDirectInputRef.current === resetDirectInput) {
        resetDirectInputRef.current = null;
      }

      if (previousLayerTitle === null) {
        layer.removeAttribute("title");
      } else {
        layer.setAttribute("title", previousLayerTitle);
      }
    };

    const cleanupGestures = () => {
      layer.removeEventListener("pointerdown", onPointerDown);
      layer.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("blur", cancelGesture);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      cancelGesture();

      if (cancelRealmGestureRef.current === cancelGesture) {
        cancelRealmGestureRef.current = null;
      }
    };
    const onWheel = (ev: WheelEvent) => {
      if (leaveStarted || phaseRef.current !== "active") return;
      ev.preventDefault();
      scene.breatheLight(ev.deltaY > 0 ? -1 : 1);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return; // never hijack shortcuts
      const k = ev.key.toLowerCase();

      // Keyboard interaction ends any pending mouse double-click opportunity.
      resetDirectInput();

      // Exact bare-layer targeting leaves buttons, links, and other focused
      // controls entirely native, including legend Enter/Space activation.
      if (
        k === "enter" &&
        ev.target === layer &&
        desktopFine.matches
      ) {
        ev.preventDefault();
        if (ev.repeat || phaseRef.current !== "active") return;

        tryResume();
        const id = openIdRef.current ?? scene.nearestId();
        if (id) confirmDiveRef.current(id);
        return;
      }

      // escape is owned by the layer's onKeyDown (esc-chain with focus order);
      // don't drive the world while a panel is focused, except escape
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
        if (id) openPanelRef.current(id);
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

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // visible-viewport tracking moved to a paint-safe useLayoutEffect below:
    // the custom properties are scoped to the layer element and must exist
    // before the first paint so the mobile bottom sheet can never resolve
    // through the 100vh/100dvh fallback cascade.

    return () => {
      alive = false;
      stopDirectInput();
      cleanupLeaveGate();
      cleanupGestures();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      sideClearRef.current?.(); // r13: release any pending side-clear teardown

      // chromium/macos: removing cursor:none under a stationary pointer keeps it
      // hidden — one-frame body cursor override forces compositor re-eval
      document.body.style.cursor = "default";
      requestAnimationFrame(() => { document.body.style.cursor = ""; });

      // Already completed during a normal staged surface exit.
      // Still required for Strict Mode replay and other unmount paths.
      restoreLandingScroll();

      if (import.meta.env.DEV) {
        const realmWindow = window as Window & { __realmScene?: typeof scene; __r13?: unknown };
        if (realmWindow.__realmScene === scene) {
          delete realmWindow.__realmScene;
        }
        delete realmWindow.__r13;
      }
      scene.setLanternHold(false);

      try {
        // Idempotent: normally destroyed during invisible retirement.
        scene.destroy();
      } finally {
        try {
          audio.dispose();
        } finally {
          sceneRef.current = null;
          audioRef.current = null;
        }
      }
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

  // expose the scene's existing settled boundary ("active" = opaque abyss on
  // screen) without touching scene timing; App uses it to swap the route
  // beneath the cover.
  useEffect(() => {
    if (phase !== "active" || enteredNotifiedRef.current) return;
    enteredNotifiedRef.current = true;
    onEntered?.();
  }, [onEntered, phase]);

  const opened = openId ? projectOf(openId) : null;
  const glMode = !degraded; // fade + gpu caption only when GL actually owns pixels
  const requestedPanelId = opened?.id ?? null;
  const panelRequested = requestedPanelId !== null && phase !== "leaving";

  // paint-safe visible-viewport tracking: iOS toolbars/keyboard make the fixed
  // layer's inset:0 taller than what the user can see, so the mobile bottom
  // sheet anchored to layer-bottom lands behind the chrome (reads "mid-screen").
  // layout effect: the properties exist BEFORE the first paint, scoped to the
  // layer element itself (no global-document ownership or restore races).
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const viewport = window.visualViewport;

    const syncViewport = () => {
      layer.style.setProperty(
        "--realm-visible-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      layer.style.setProperty(
        "--realm-visible-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
    };

    syncViewport();

    window.addEventListener("resize", syncViewport);
    viewport?.addEventListener("resize", syncViewport);
    viewport?.addEventListener("scroll", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);

      layer.style.removeProperty("--realm-visible-height");
      layer.style.removeProperty("--realm-visible-top");
    };
  }, []);

  // persistent-panel entrance: the wrapper is always mounted with final
  // geometry; the static CSS is hidden/transparent/unanimated, so the first
  // painted frame can never show a misplaced sheet (the Safari flash bug).
  // the open class is added after two animation frames, and the close button
  // is focused only once the opacity transition has finished.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    let stopped = false;
    let focused = false;
    let firstFrame: number | undefined;
    let secondFrame: number | undefined;
    let focusTimer: number | undefined;

    const clearFocusTimer = () => {
      if (focusTimer !== undefined) {
        window.clearTimeout(focusTimer);
        focusTimer = undefined;
      }
    };

    const focusWhenFinished = () => {
      clearFocusTimer();

      if (
        stopped ||
        focused ||
        document.hidden ||
        !panel.isConnected ||
        !panel.classList.contains("is-open")
      ) {
        return;
      }

      // a delayed/backgrounded transition must not cause premature focus.
      const opacity = Number.parseFloat(window.getComputedStyle(panel).opacity);
      if (!Number.isFinite(opacity) || opacity < 0.999) {
        focusTimer = window.setTimeout(focusWhenFinished, 50);
        return;
      }

      const closeButton = panelCloseRef.current;
      if (!closeButton?.isConnected) return;

      focused = true;
      closeButton.focus({ preventScroll: true });
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === panel && event.propertyName === "opacity") {
        focusWhenFinished();
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) focusWhenFinished();
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;

      if (firstFrame !== undefined) window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);
      clearFocusTimer();

      panel.removeEventListener("transitionend", onTransitionEnd);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      // removing is-open also removes the transition: closing is immediate.
      panel.classList.remove("is-open");
      panel.setAttribute("inert", "");
      panel.setAttribute("aria-hidden", "true");
    };

    panelStopRef.current = stop;

    // reset before this commit can paint, including when changing creature ids.
    panel.classList.remove("is-open");
    panel.setAttribute("inert", "");
    panel.setAttribute("aria-hidden", "true");

    if (panelRequested) {
      cancelRealmGestureRef.current?.();

      panel.addEventListener("transitionend", onTransitionEnd);
      document.addEventListener("visibilitychange", onVisibilityChange);

      firstFrame = window.requestAnimationFrame(() => {
        firstFrame = undefined;
        if (stopped) return;

        secondFrame = window.requestAnimationFrame(() => {
          secondFrame = undefined;
          if (stopped || phaseRef.current !== "active") return;

          panel.removeAttribute("inert");
          panel.removeAttribute("aria-hidden");
          panel.classList.add("is-open");

          // reading computed timing also resolves the newly applied transition.
          const duration = opacityTransitionMs(panel);

          if (duration === 0) {
            focusWhenFinished();
          } else {
            // transitionend is primary; this covers missing/cancelled events.
            focusTimer = window.setTimeout(focusWhenFinished, duration + 80);
          }
        });
      });
    }

    return () => {
      stop();
      if (panelStopRef.current === stop) panelStopRef.current = null;
    };
  }, [panelRequested, requestedPanelId]);

  return (
    <div
      ref={layerRef}
      data-panel-side={side ?? undefined}
      className={
        "realm-layer realm-exit-layer" +
        (degraded ? " realm-layer--degraded" : "") +
        (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? " realm-reduced" : "")
      }
      role="dialog"
      aria-modal="true"
      aria-label="the deep — immersive project navigator"
      tabIndex={-1}
      data-realm-leaving={phase === "leaving" ? "true" : "false"}
      style={{ touchAction: "none" }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation(); // the window keydown must not double-fire

          if (phaseRef.current === "diving" || phase === "leaving") return;

          if (openId) {
            closePanel();
          } else {
            doLeave(); // surface
          }
          return;
        }

        if (event.key !== "Tab" || phase === "leaving") return;

        const layer = event.currentTarget;
        const controls = Array.from(
          layer.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
          ),
        ).filter((element) => {
          if (
            element.tabIndex < 0 ||
            element.matches(":disabled") ||
            element.closest('[inert], [aria-hidden="true"]')
          ) {
            return false;
          }

          const style = window.getComputedStyle(element);
          return (
            style.visibility === "visible" &&
            style.display !== "none" &&
            element.getClientRects().length > 0
          );
        });

        if (controls.length === 0) {
          event.preventDefault();
          layer.focus({ preventScroll: true });
          return;
        }

        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first || !last) return;

        const active = document.activeElement;
        const activeIsControl = controls.some((element) => element === active);

        if (event.shiftKey && (active === first || !activeIsControl)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && (active === last || !activeIsControl)) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }}
    >
      <canvas
        ref={glRef}
        className={"realm-gl" + (phase === "leaving" && glMode ? " realm-gl--fade" : "")}
      />
      <canvas ref={overlayRef} className="realm-overlay" aria-hidden="true" />

      {/* the dive iris covers the commit regardless of the path that requested
          it (panel dive button, double-click pair, bare-layer enter): the hue
          comes from the dived creature — openId when the panel drove the dive,
          divingId for the direct paths. */}
      {phase === "diving" && (openId ?? divingId) ? (
        <div
          className="realm-iris"
          aria-hidden="true"
          style={{ ["--iris-hue" as string]: hueOf((openId ?? divingId) as string) } as CSSProperties}
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

      {/* persistent panel: wrapper always mounted with pinned geometry;
          content is conditional; inert/aria-hidden/is-open are owned by the
          entrance layout effect, never by React state on this wrapper. */}
      <div ref={panelRef} className="realm-panel" role="document" data-side={side ?? undefined}>
        {opened && phase !== "leaving" ? (
          <button
            ref={panelCloseRef}
            type="button"
            className="realm-panel-close"
            aria-label="close"
            onClick={closePanel}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="butt"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>
        ) : null}
        {opened ? (
          <div key={opened.id} className="realm-panel-body">
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
      </div>

      <div ref={ariaRef} className="realm-aria" aria-live="polite" />
    </div>
  );
}

import type { FateMode } from "./fates";

// DOM-only overlay for the fate engine: no three.js imports, no WebGL
// state, no side effects beyond its own elements. The panel stays
// collapsed until opened, so the past-history view is unchanged by default.

export type EngineCommand =
  | { type: "pause" }
  | { type: "play" }
  | { type: "speed"; value: number }
  | { type: "restart" };

export interface FatesUiCallbacks {
  onEnter(mode: FateMode): void;
  onLeave(): void;
  /** Fired continuously while dragging — intentionally cheap, no engine seek. */
  onScrub(progress: number): void;
  /** Fired on release — the deterministic reset+seek happens here. */
  onScrubEnd(progress: number): void;
  onEngineCommand(cmd: EngineCommand): void;
}

export interface FatesUiHandle {
  setHud(s: { tau: number; a: number; progress: number; mode: FateMode }): void;
  setTerminal(terminal: boolean): void;
  setActive(mode: FateMode | null): void;
  flashRebirth(): void;
  dispose(): void;
}

const MODE_LABELS: ReadonlyArray<readonly [FateMode, string]> = [
  ["heatDeath", "heat death"],
  ["bigRip", "big rip"],
  ["bigCrunchClosed", "big crunch (closed)"],
  ["bigCrunchLambda", "big crunch (Λ)"],
  ["vacuumDecay", "vacuum decay"],
];

const CSS = `
.fates-root{position:fixed;top:26px;right:30px;z-index:1000;font:12px/1.4 ui-monospace,monospace;
  color:#cfd8e3;text-align:left;user-select:none}
.fates-toggle{display:block;margin-left:auto;padding:4px 10px;font:inherit;color:#cfd8e3;
  background:rgba(8,10,16,.82);border:1px solid #2a3242;border-radius:4px;cursor:pointer}
.fates-toggle:hover{background:#1d2636}
.fates-panel{display:none;margin-top:6px;background:rgba(8,10,16,.85);border:1px solid #2a3242;
  border-radius:8px;padding:10px;width:230px}
.fates-root.fates-open .fates-panel{display:block}
.fates-panel button{display:block;width:100%;margin:2px 0;padding:4px 6px;font:inherit;text-align:left;
  color:#cfd8e3;background:#141a26;border:1px solid #2a3242;border-radius:4px;cursor:pointer}
.fates-panel button:hover{background:#1d2636}
.fates-panel button.fates-active{background:#2b3b5c;border-color:#5b7db1}
.fates-hud{margin-top:8px;white-space:pre;color:#9fb4d0}
.fates-hud .fates-term{color:#e8b34b}
.fates-scrub{width:100%;margin-top:6px}
.fates-flash{position:fixed;inset:0;z-index:1001;background:#fff;opacity:0;pointer-events:none}
.fates-msg{position:fixed;left:50%;top:38%;transform:translateX(-50%);z-index:1002;opacity:0;
  pointer-events:none;font:20px/1.2 ui-monospace,monospace;color:#fff;
  text-shadow:0 0 12px rgba(255,255,255,.8);transition:opacity 600ms ease}
`;

export function mountFatesUi(cb: FatesUiCallbacks): FatesUiHandle {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.className = "fates-root";

  const toggle = document.createElement("button");
  toggle.className = "fates-toggle";
  toggle.textContent = "fates ▾";
  toggle.addEventListener("click", () => {
    const open = root.classList.toggle("fates-open");
    toggle.textContent = open ? "fates ▴" : "fates ▾";
  });
  root.appendChild(toggle);

  const panel = document.createElement("div");
  panel.className = "fates-panel";

  const modeButtons = new Map<FateMode, HTMLButtonElement>();
  for (const [mode, label] of MODE_LABELS) {
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", () => cb.onEnter(mode));
    modeButtons.set(mode, b);
    panel.appendChild(b);
  }

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "exit fate ↩";
  exitBtn.addEventListener("click", () => cb.onLeave());
  panel.appendChild(exitBtn);

  const playBtn = document.createElement("button");
  playBtn.textContent = "⏸ pause";
  let paused = false;
  playBtn.addEventListener("click", () => {
    paused = !paused;
    playBtn.textContent = paused ? "▶ play" : "⏸ pause";
    cb.onEngineCommand(paused ? { type: "pause" } : { type: "play" });
  });
  const restartBtn = document.createElement("button");
  restartBtn.textContent = "↺ restart";
  restartBtn.addEventListener("click", () => cb.onEngineCommand({ type: "restart" }));
  panel.appendChild(playBtn);
  panel.appendChild(restartBtn);

  // Drag fires `input` (cheap preview only); release fires `change`, where
  // the deterministic reset+seek runs. Writing scrub.value is suppressed
  // while dragging so the HUD can never fight the user's hand.
  const scrub = document.createElement("input");
  scrub.type = "range";
  scrub.min = "0";
  scrub.max = "1000";
  scrub.value = "0";
  scrub.className = "fates-scrub";
  scrub.setAttribute("aria-label", "Fate timeline");
  let dragging = false;
  scrub.addEventListener("pointerdown", () => {
    dragging = true;
  });
  scrub.addEventListener("input", () => cb.onScrub(Number(scrub.value) / 1000));
  scrub.addEventListener("change", () => {
    dragging = false;
    cb.onScrubEnd(Number(scrub.value) / 1000);
  });
  panel.appendChild(scrub);

  const hud = document.createElement("div");
  hud.className = "fates-hud";
  hud.textContent = "fate: off";
  panel.appendChild(hud);

  root.appendChild(panel);

  const flash = document.createElement("div");
  flash.className = "fates-flash";
  const msg = document.createElement("div");
  msg.className = "fates-msg";

  document.body.appendChild(root);
  document.body.appendChild(flash);
  document.body.appendChild(msg);

  let msgTimer = 0;
  let isTerminal = false;

  const handle: FatesUiHandle = {
    setHud(s): void {
      hud.textContent =
        `τ = ${s.tau.toFixed(3)} tH\n` +
        `a = ${s.a.toExponential(3)}\n` +
        `${(s.progress * 100).toFixed(1)}% · ${MODE_LABELS.find(([m]) => m === s.mode)?.[1] ?? s.mode}`;
      if (isTerminal) {
        const t = document.createElement("span");
        t.className = "fates-term";
        t.textContent = "\n∎ terminal";
        hud.appendChild(t);
      }
      if (!dragging) scrub.value = String(Math.round(s.progress * 1000));
    },
    setTerminal(terminal: boolean): void {
      isTerminal = terminal;
    },
    setActive(mode: FateMode | null): void {
      for (const [m, b] of modeButtons) b.classList.toggle("fates-active", m === mode);
      if (mode === null) {
        hud.textContent = "fate: off";
        scrub.value = "0";
        isTerminal = false;
      } else {
        root.classList.add("fates-open");
        toggle.textContent = "fates ▴";
      }
    },
    flashRebirth(): void {
      flash.style.transition = "none";
      flash.style.opacity = "1";
      msg.textContent = "the universe is born again";
      msg.style.opacity = "1";
      requestAnimationFrame(() => {
        flash.style.transition = "opacity 1200ms ease-out";
        flash.style.opacity = "0";
      });
      window.clearTimeout(msgTimer);
      msgTimer = window.setTimeout(() => {
        msg.style.opacity = "0";
      }, 2400);
    },
    dispose(): void {
      window.clearTimeout(msgTimer);
      root.remove();
      flash.remove();
      msg.remove();
      style.remove();
    },
  };
  return handle;
}

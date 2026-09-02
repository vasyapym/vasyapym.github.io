import {
  EPOCHS,
  fmtSci,
  fmtTemp,
  fmtTime,
  fractionToLogt,
  logtToFraction,
} from "./cosmology";
import type { SimState } from "./cosmology";

export interface UiRefs {
  epoch: HTMLElement;
  epochdesc: HTMLElement;
  stats: HTMLElement;
  paused: HTMLElement;
  cursor: HTMLElement;
  ticks: HTMLElement;
  speedlabel: HTMLElement;
  flash: HTMLElement;
  techline: HTMLElement;
  fps: HTMLElement;
}

export function grabUi(): UiRefs {
  const need = (id: string): HTMLElement => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`missing #${id}`);
    return el;
  };
  return {
    epoch: need("epoch"),
    epochdesc: need("epochdesc"),
    stats: need("stats"),
    paused: need("paused"),
    cursor: need("cursor"),
    ticks: need("ticks"),
    speedlabel: need("speedlabel"),
    flash: need("flash"),
    techline: need("techline"),
    fps: need("fps"),
  };
}

function pct(logt: number): string {
  return `${(logtToFraction(logt) * 100).toFixed(2)}%`;
}

export function buildTicks(ui: UiRefs): void {
  for (const e of EPOCHS) {
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = pct(e.t0);
    tick.title = e.name;
    ui.ticks.appendChild(tick);
  }
}

export function attachTimelineScrub(onScrub: (logt: number) => void): void {
  const timeline = document.getElementById("timeline");
  if (!timeline) throw new Error("missing #timeline");

  const scrubTo = (event: PointerEvent): void => {
    const rect = timeline.getBoundingClientRect();
    onScrub(fractionToLogt((event.clientX - rect.left) / Math.max(1, rect.width)));
  };

  let scrubbing = false;
  timeline.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    scrubbing = true;
    timeline.setPointerCapture(event.pointerId);
    scrubTo(event);
  });
  timeline.addEventListener("pointermove", (event) => {
    if (scrubbing) scrubTo(event);
  });
  const endScrub = (event: PointerEvent) => {
    if (!scrubbing) return;
    scrubbing = false;
    if (timeline.hasPointerCapture(event.pointerId)) {
      timeline.releasePointerCapture(event.pointerId);
    }
  };
  timeline.addEventListener("pointerup", endScrub);
  timeline.addEventListener("pointercancel", endScrub);
}

let lastEpochIdx = -1;
let lastSpeedText = "";
let lastStatsHtml = "";

export interface UiExtras {
  playing: boolean;
  dps: number;
  flash: number;
}

export function updateUi(ui: UiRefs, st: SimState, x: UiExtras): void {
  if (st.epochIdx !== lastEpochIdx) {
    lastEpochIdx = st.epochIdx;
    const e = EPOCHS[st.epochIdx];
    ui.epoch.textContent = e.name;
    ui.epochdesc.textContent = e.desc;
  }
  const z = Math.max(0, 1 / st.aPhys - 1);
  const statsHtml =
    `t = <b>${fmtTime(st.tSec)}</b>\n` +
    `T = <b>${fmtTemp(st.tempK)}</b>\n` +
    `a = <b>${fmtSci(st.aPhys)}</b>   z = <b>${fmtSci(z)}</b>`;
  if (statsHtml !== lastStatsHtml) {
    lastStatsHtml = statsHtml;
    ui.stats.innerHTML = statsHtml;
  }
  ui.cursor.style.left = pct(st.logt);
  ui.paused.style.display = x.playing ? "none" : "block";
  const speedText = `speed \u00d7${x.dps.toFixed(1)}`;
  if (speedText !== lastSpeedText) {
    lastSpeedText = speedText;
    ui.speedlabel.textContent = speedText;
  }
  ui.flash.style.opacity = String(Math.min(0.55, x.flash));
}

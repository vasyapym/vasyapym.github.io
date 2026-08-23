import { EPOCHS, LOG_END, LOG_START, fmtSci, fmtTemp, fmtTime } from "./cosmology";
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
  };
}

const SPAN = LOG_END - LOG_START;

function pct(logt: number): string {
  return `${(Math.min(1, Math.max(0, (logt - LOG_START) / SPAN)) * 100).toFixed(2)}%`;
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

let lastEpochIdx = -1;
let lastSpeedText = "";

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
  ui.stats.innerHTML =
    `t = <b>${fmtTime(st.tSec)}</b>\n` +
    `T = <b>${fmtTemp(st.tempK)}</b>\n` +
    `a = <b>${fmtSci(st.aPhys)}</b>   z = <b>${fmtSci(z)}</b>`;
  ui.cursor.style.left = pct(st.logt);
  ui.paused.style.display = x.playing ? "none" : "block";
  const speedText = `speed \u00d7${x.dps.toFixed(1)}`;
  if (speedText !== lastSpeedText) {
    lastSpeedText = speedText;
    ui.speedlabel.textContent = speedText;
  }
  ui.flash.style.opacity = String(Math.min(0.92, x.flash));
}

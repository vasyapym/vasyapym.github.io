import { useEffect, useRef, useState } from "react";
import { timeOfDay } from "../lib/clock";
import { phaseName } from "../lib/daylight";

const SYNC_MS = 250;

// The themed track paints its amber fill from --ef-dial-fill; keep it glued
// to the value everywhere the value moves.
function applyFill(input: HTMLInputElement, value: number): void {
  input.style.setProperty("--ef-dial-fill", `${(value * 100).toFixed(1)}%`);
}

// The dusk dial: an uncontrolled range input wired straight into the shared
// timeOfDay value. A slow poll keeps the knob and caption honest even when
// the value moves from outside (the [ / ] keys while playing) — four cheap
// reads a second instead of threading callbacks through the scene tree.
export function DuskDial() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(() => phaseName(timeOfDay.value));

  useEffect(() => {
    if (inputRef.current) applyFill(inputRef.current, timeOfDay.value);
    const id = window.setInterval(() => {
      setLabel(phaseName(timeOfDay.value));
      const el = inputRef.current;
      // Don't fight the thumb/finger mid-drag.
      if (el && document.activeElement !== el) {
        el.value = String(timeOfDay.value);
      }
      if (el) applyFill(el, timeOfDay.value);
    }, SYNC_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="evening-forest-dial">
      <label className="evening-forest-dial-label" htmlFor="ef-dusk-dial">
        Time of day · <span data-phase>{label}</span>
      </label>
      <input
        id="ef-dusk-dial"
        ref={inputRef}
        type="range"
        min={0}
        max={1}
        step={0.001}
        defaultValue={timeOfDay.value}
        onChange={(event) => {
          timeOfDay.value = Number(event.target.value);
          applyFill(event.target, timeOfDay.value);
          setLabel(phaseName(timeOfDay.value));
        }}
      />
      <div className="evening-forest-dial-ends" aria-hidden="true">
        <span>Golden hour</span>
        <span>Sunrise</span>
      </div>
    </div>
  );
}

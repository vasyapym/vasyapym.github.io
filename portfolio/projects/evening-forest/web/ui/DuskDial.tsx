import { useEffect, useRef, useState } from "react";
import { timeOfDay } from "../lib/clock";
import { phaseName } from "../lib/daylight";

const SYNC_MS = 250;

// The dusk dial: an uncontrolled range input wired straight into the shared
// timeOfDay value. A slow poll keeps the knob and caption honest even when
// the value moves from outside (the [ / ] keys while playing) — four cheap
// reads a second instead of threading callbacks through the scene tree.
export function DuskDial() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(() => phaseName(timeOfDay.value));

  useEffect(() => {
    const id = window.setInterval(() => {
      setLabel(phaseName(timeOfDay.value));
      const el = inputRef.current;
      // Don't fight the thumb/finger mid-drag.
      if (el && document.activeElement !== el) {
        el.value = String(timeOfDay.value);
      }
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

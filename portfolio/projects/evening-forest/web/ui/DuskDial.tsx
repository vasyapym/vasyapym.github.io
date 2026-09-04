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
// reads a second instead of threading callbacks through the scene tree. While
// a finger/pointer is dragging the slider, a draggingRef gate suppresses the
// poll's value/fill writes so programmatic mid-gesture writes can't stall the
// native iOS/WebKit drag; onChange keeps fill and label live in the meantime.
export function DuskDial() {
  const inputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const [label, setLabel] = useState(() => phaseName(timeOfDay.value));

  useEffect(() => {
    if (inputRef.current) applyFill(inputRef.current, timeOfDay.value);
    const id = window.setInterval(() => {
      // The label is safe to refresh every tick — it never touches the input.
      setLabel(phaseName(timeOfDay.value));
      const el = inputRef.current;
      // Don't write into the input mid-drag: a programmatic value/fill write
      // during a native gesture stalls the iOS/WebKit thumb.
      if (el && !draggingRef.current) {
        el.value = String(timeOfDay.value);
        applyFill(el, timeOfDay.value);
      }
    }, SYNC_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Pointer capture means the release may not fire on the input itself, so
    // listen at the window for both a clean release and a cancelled gesture.
    const endDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
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
        onPointerDown={() => {
          draggingRef.current = true;
        }}
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

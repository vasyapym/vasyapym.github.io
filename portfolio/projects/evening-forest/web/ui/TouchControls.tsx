import { useCallback, useRef, useState } from "react";
import {
  joystickKnobOffset,
  joystickVector,
  lookDelta,
  type TouchInputState,
} from "../lib/touch-input";

type StickVisual = {
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
};

export type TouchControlsProps = {
  inputRef: React.RefObject<TouchInputState | null>;
  onPause: () => void;
  muted: boolean;
  onToggleSound: () => void;
};

// On-screen controls for phones: the left part of the stage is a
// dynamic-origin joystick (the base appears wherever the thumb lands), the
// rest is drag-to-look. Zones track one pointer each, so walking and
// looking work simultaneously. All numbers go through lib/touch-input and
// land in the shared state the walking rig drains every frame.
export function TouchControls({
  inputRef,
  onPause,
  muted,
  onToggleSound,
}: TouchControlsProps) {
  const [stick, setStick] = useState<StickVisual | null>(null);
  const [walkUsed, setWalkUsed] = useState(false);
  const [lookUsed, setLookUsed] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const walkPointer = useRef<number | null>(null);
  const walkOrigin = useRef({ x: 0, y: 0 });
  const lookPointer = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  // Touch pointers are implicitly captured to their down-target, so moves
  // keep arriving even if the finger drifts off the zone — no explicit
  // capture needed. Some browsers (and automation stacks) throw
  // InvalidStateError on an explicit request anyway, so this is best-effort.
  const captureSafely = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* implicit capture is enough */
    }
  };

  const onWalkDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (walkPointer.current !== null) return;
      // Record state first so a failed capture can't leave the joystick
      // dead — moves still arrive via implicit touch capture.
      walkPointer.current = event.pointerId;
      walkOrigin.current = { x: event.clientX, y: event.clientY };
      captureSafely(event);
      // clientX/Y are viewport coordinates; the stick visuals live inside
      // this container, so shift them into stage-local space.
      const rect = containerRef.current?.getBoundingClientRect();
      setStick({
        baseX: event.clientX - (rect?.left ?? 0),
        baseY: event.clientY - (rect?.top ?? 0),
        knobX: 0,
        knobY: 0,
      });
    },
    [],
  );

  const onWalkMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (walkPointer.current !== event.pointerId) return;
      const dx = event.clientX - walkOrigin.current.x;
      const dy = event.clientY - walkOrigin.current.y;
      const input = inputRef.current;
      if (input) {
        const v = joystickVector(dx, dy);
        input.moveX = v.x;
        input.moveZ = v.z;
      }
      const knob = joystickKnobOffset(dx, dy);
      setStick((prev) =>
        prev ? { ...prev, knobX: knob.x, knobY: knob.y } : prev,
      );
    },
    [inputRef],
  );

  const endWalk = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (walkPointer.current !== event.pointerId) return;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* capture already gone */
      }
      walkPointer.current = null;
      const input = inputRef.current;
      if (input) {
        input.moveX = 0;
        input.moveZ = 0;
      }
      setStick(null);
    },
    [inputRef],
  );

  const onLookDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (lookPointer.current !== null) return;
      lookPointer.current = event.pointerId;
      lookLast.current = { x: event.clientX, y: event.clientY };
      captureSafely(event);
    },
    [],
  );

  const onLookMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (lookPointer.current !== event.pointerId) return;
      const dx = event.clientX - lookLast.current.x;
      const dy = event.clientY - lookLast.current.y;
      lookLast.current = { x: event.clientX, y: event.clientY };
      const input = inputRef.current;
      if (!input) return;
      const delta = lookDelta(dx, dy);
      input.yaw += delta.yaw;
      input.pitch += delta.pitch;
      setLookUsed(true);
    },
    [inputRef],
  );

  const endLook = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (lookPointer.current !== event.pointerId) return;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* capture already gone */
      }
      lookPointer.current = null;
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="ef-touch"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="ef-touch-zone ef-touch-zone-walk"
        onPointerDown={onWalkDown}
        onPointerMove={onWalkMove}
        onPointerUp={endWalk}
        onPointerCancel={endWalk}
      />
      {!walkUsed && (
        <div className="ef-touch-hint ef-touch-hint-walk" aria-hidden="true">
          hold &amp; drag to walk
        </div>
      )}
      <div
        className="ef-touch-zone ef-touch-zone-look"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={endLook}
        onPointerCancel={endLook}
      />
      {!lookUsed && (
        <div className="ef-touch-hint ef-touch-hint-look" aria-hidden="true">
          drag to look
        </div>
      )}
      {stick && (
        <div
          className="ef-touch-stick-base"
          style={{ left: stick.baseX, top: stick.baseY }}
          aria-hidden="true"
        >
          <div
            className="ef-touch-stick-knob"
            style={{ transform: `translate(${stick.knobX}px, ${stick.knobY}px)` }}
          />
        </div>
      )}
      <div className="ef-touch-buttons">
        <button
          type="button"
          className="ef-touch-button"
          onClick={onToggleSound}
          aria-pressed={muted}
        >
          {muted ? "Sound off" : "Sound on"}
        </button>
        <button type="button" className="ef-touch-button" onClick={onPause}>
          Rest
        </button>
      </div>
    </div>
  );
}

// Light haptic accents for touch play. navigator.vibrate is Android-only
// today; iOS Safari ignores it, so callers stay unconditional and every
// unsupported platform quietly feels nothing.

export function buzz(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  // Some DOM libs type vibrate narrowly (Iterable<number>); cast to the
  // runtime truth, which accepts a single count too.
  const vibrate = navigator.vibrate as
    | ((pattern: number | number[]) => boolean)
    | undefined;
  if (typeof vibrate !== "function") return;
  try {
    vibrate.call(navigator, pattern);
  } catch {
    // Some browsers throw without user gesture; haptics are optional.
  }
}

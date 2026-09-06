// web/loader.ts — loads the Go wasm module once per session and re-binds it
// to the page DOM on every mount of SpinePage.

import "./wasm_exec.js";

declare global {
  interface Window {
    /** Set to true by the Go side once wiring + first render finished. */
    spineReady?: boolean;
    /** Go-side hook: re-wire listeners and re-render into the current DOM. */
    spineRebind?: () => void;
  }
}

let bootPromise: Promise<void> | null = null;
let mountSeq = 0;

/**
 * Call from SpinePage's effect. The first call boots the wasm runtime; every
 * call (including re-entries after SPA navigation) schedules a rebind so the
 * engine always targets the DOM React most recently rendered.
 */
export function mountSpine(): void {
  const seq = ++mountSeq;
  if (!bootPromise) {
    bootPromise = boot();
  }
  bootPromise.then(() => {
    if (seq === mountSeq) {
      window.spineRebind?.();
    }
  });
}

async function boot(): Promise<void> {
  if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly is not available in this browser");
  }
  const go = new window.Go();
  const url = new URL("./spine.wasm", import.meta.url);

  let instance: WebAssembly.Instance;
  try {
    const result = await WebAssembly.instantiateStreaming(fetch(url), go.importObject);
    instance = result.instance;
  } catch {
    // Some hosts serve wasm with a wrong MIME type; fall back to buffered
    // instantiation (same fallback raft-core.ts uses).
    const bytes = await fetch(url).then((r) => r.arrayBuffer());
    const result = await WebAssembly.instantiate(bytes, go.importObject);
    instance = result.instance;
  }

  // go.run resolves only when the Go program exits — for a long-lived engine
  // that is never, so it is intentionally not awaited.
  void go.run(instance);
  await waitReady();
}

/** Poll for the Go side's ready flag (set before its main loop blocks). */
function waitReady(): Promise<void> {
  return new Promise((resolve) => {
    const check = (): void => {
      if (window.spineReady) {
        resolve();
      } else {
        setTimeout(check, 30);
      }
    };
    check();
  });
}

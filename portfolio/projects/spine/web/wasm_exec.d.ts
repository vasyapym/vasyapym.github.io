// Type declarations for the vendored Go wasm_exec.js runtime shim
// (copied from $(GOROOT)/lib/wasm). The real file is a plain script with no
// exports: it only defines globalThis.Go.

export {};

declare global {
  interface Window {
    Go: new () => {
      importObject: WebAssembly.Imports;
      run(instance: WebAssembly.Instance): Promise<void>;
    };
  }
}

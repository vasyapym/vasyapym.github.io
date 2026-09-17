import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type OutputAsset, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const shellRoot = dirname(fileURLToPath(import.meta.url));
const planckToNowRoot = resolve(shellRoot, "../projects/planck-to-now");
const planckToNowIndex = resolve(planckToNowRoot, "index.html");
const planckToNowBundle = resolve(planckToNowRoot, "dist/main.js");
const quicknotesRoot = resolve(shellRoot, "../../quicknotes");
const raftCoreRoot = resolve(shellRoot, "../projects/raft-cluster/core");
const raftCoreWasm = resolve(shellRoot, "../projects/raft-cluster/web/raft_core.wasm");
const spineRoot = resolve(shellRoot, "../projects/spine");
const spineWasm = resolve(spineRoot, "web/spine.wasm");

function createPlanckToNowBuild(): void {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm, ["run", "build"], {
    cwd: planckToNowRoot,
    stdio: "inherit",
    // Node >= 18.20 refuses to spawn .cmd shims without a shell
    // (CVE-2024-27980 hardening), so Windows needs this flag.
    shell: process.platform === "win32",
  });
}

function createRaftCoreWasm(): void {
  try {
    execFileSync("rustup", ["target", "add", "wasm32-unknown-unknown"], {
      cwd: raftCoreRoot,
      stdio: "inherit",
    });
  } catch (err) {
    // Toolchains managed outside rustup already carry the target; only a
    // missing binary should fall through to the cargo error below.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  try {
    execFileSync("cargo", ["build", "--release", "--target", "wasm32-unknown-unknown"], {
      cwd: raftCoreRoot,
      stdio: "inherit",
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("wasm-artifacts: cargo not found — install Rust to build raft_core.wasm");
    }
    throw err;
  }
  copyFileSync(
    resolve(raftCoreRoot, "target/wasm32-unknown-unknown/release/raft_core.wasm"),
    raftCoreWasm,
  );
}

function createSpineWasm(): void {
  try {
    execFileSync("go", ["build", "-o", "web/spine.wasm", "."], {
      cwd: spineRoot,
      stdio: "inherit",
      env: { ...process.env, GOOS: "js", GOARCH: "wasm" },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("wasm-artifacts: go not found — install Go to build spine.wasm");
    }
    throw err;
  }
}

/**
 * The wasm binaries are reproducible build outputs (never committed), so any
 * fresh checkout starts without them. Regenerate the missing ones before the
 * bundle runs, then refuse to ship a bundle whose pages would 404 at runtime.
 */
function wasmArtifactsPlugin(): Plugin {
  return {
    name: "wasm-artifacts",
    config() {
      if (!existsSync(raftCoreWasm)) createRaftCoreWasm();
      if (!existsSync(spineWasm)) createSpineWasm();
    },
    generateBundle(_options, bundle) {
      const wasmAssets = Object.values(bundle)
        .filter((entry): entry is OutputAsset => entry.type === "asset" && entry.fileName.endsWith(".wasm"))
        .map((entry) => entry.fileName);
      for (const stem of ["raft_core", "spine"]) {
        if (!wasmAssets.some((name) => name.includes(stem))) {
          throw new Error(`wasm-artifacts: no ${stem}*.wasm asset in the bundle — the page would 404 at runtime`);
        }
      }
    },
  };
}

function spaFallbackPlugin(): Plugin {
  return {
    name: "spa-fallback",
    enforce: "post",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (request.method === "GET" && /^\/projects\/[^/]+\/?$/.test(pathname) && !pathname.includes(".")) {
          request.url = "/";
        }
        next();
      });
    },
    generateBundle(_options, bundle) {
      const htmlAsset = bundle["index.html"];
      if (!htmlAsset || htmlAsset.type !== "asset") {
        throw new Error("spa-fallback: built index.html missing from the bundle");
      }
      this.emitFile({ type: "asset", fileName: "404.html", source: String(htmlAsset.source) });
    },
  };
}

function planckToNowStaticPlugin(): Plugin {
  let built = false;
  const ensureBuild = () => {
    if (!built || !existsSync(planckToNowBundle)) {
      createPlanckToNowBuild();
      built = true;
    }
  };
  const getStaticFile = (pathname: string): string | undefined => {
    if (pathname === "/planck-to-now" || pathname === "/planck-to-now/") return planckToNowIndex;
    if (pathname === "/planck-to-now/dist/main.js") return planckToNowBundle;
    return undefined;
  };
  return {
    name: "planck-to-now-static",
    config() { ensureBuild(); },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (pathname === "/planck-to-now") {
          response.statusCode = 301;
          response.setHeader("Location", "/planck-to-now/");
          response.end();
          return;
        }
        const file = getStaticFile(pathname);
        if (!file) { next(); return; }
        ensureBuild();
        response.statusCode = 200;
        response.setHeader("Content-Type", file.endsWith(".js") ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8");
        response.end(readFileSync(file));
      });
    },
    generateBundle() {
      ensureBuild();
      this.emitFile({ type: "asset", fileName: "planck-to-now/index.html", source: readFileSync(planckToNowIndex) });
      this.emitFile({ type: "asset", fileName: "planck-to-now/dist/main.js", source: readFileSync(planckToNowBundle) });
    },
  };
}

const QUICKNOTES_MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
  ".rules": "text/plain; charset=utf-8",
};

/**
 * Quicknotes is a static no-build ES-module app living at ../quicknotes.
 * Served verbatim in dev and emitted verbatim into the bundle, so the
 * catalogue page and the standalone /quicknotes/ URL stay one artifact.
 */
function quicknotesStaticPlugin(): Plugin {
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else out.push(full);
    }
    return out;
  };
  const mimeFor = (file: string): string =>
    QUICKNOTES_MIME[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream";
  return {
    name: "quicknotes-static",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        const pathname = decodeURIComponent(url.pathname);
        if (!pathname.startsWith("/quicknotes")) { next(); return; }
        if (pathname === "/quicknotes" || pathname === "/quicknotes/") {
          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(readFileSync(join(quicknotesRoot, "index.html")));
          return;
        }
        const rel = relative("/quicknotes", pathname);
        const file = resolve(quicknotesRoot, rel);
        if (!file.startsWith(quicknotesRoot + "/") || !existsSync(file) || !statSync(file).isFile()) {
          next();
          return;
        }
        response.statusCode = 200;
        response.setHeader("Content-Type", mimeFor(file));
        response.end(readFileSync(file));
      });
    },
    generateBundle() {
      for (const file of walk(quicknotesRoot)) {
        this.emitFile({
          type: "asset",
          fileName: `quicknotes/${relative(quicknotesRoot, file).split("\\").join("/")}`,
          source: readFileSync(file),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [wasmArtifactsPlugin(), planckToNowStaticPlugin(), quicknotesStaticPlugin(), spaFallbackPlugin(), react()],
  esbuild: { target: "es2020" },
  optimizeDeps: { esbuildOptions: { target: "es2020" } },
  build: { target: "es2020" },
  server: { port: 5173 },
});

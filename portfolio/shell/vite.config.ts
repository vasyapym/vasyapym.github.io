import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const shellRoot = dirname(fileURLToPath(import.meta.url));
const planckToNowRoot = resolve(shellRoot, "../projects/planck-to-now");
const planckToNowIndex = resolve(planckToNowRoot, "index.html");
const planckToNowBundle = resolve(planckToNowRoot, "dist/main.js");

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

export default defineConfig({
  plugins: [planckToNowStaticPlugin(), spaFallbackPlugin(), react()],
  esbuild: { target: "es2020" },
  optimizeDeps: { esbuildOptions: { target: "es2020" } },
  build: { target: "es2020" },
  server: { port: 5173 },
});

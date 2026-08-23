import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const shellRoot = dirname(fileURLToPath(import.meta.url));
const bigBangRoot = resolve(shellRoot, "../projects/bigbang-ts");
const bigBangIndex = resolve(bigBangRoot, "index.html");
const bigBangBundle = resolve(bigBangRoot, "dist/main.js");

function createBigBangBuild(): void {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm, ["run", "build"], {
    cwd: bigBangRoot,
    stdio: "inherit",
  });
}

function bigBangStaticPlugin(): Plugin {
  let built = false;

  const ensureBuild = () => {
    if (!built || !existsSync(bigBangBundle)) {
      createBigBangBuild();
      built = true;
    }
  };

  const getStaticFile = (pathname: string): string | undefined => {
    if (pathname === "/bigbang-ts" || pathname === "/bigbang-ts/") {
      return bigBangIndex;
    }

    if (pathname === "/bigbang-ts/dist/main.js") {
      return bigBangBundle;
    }

    return undefined;
  };

  return {
    name: "bigbang-ts-static",
    config() {
      ensureBuild();
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (pathname === "/bigbang-ts") {
          response.statusCode = 301;
          response.setHeader("Location", "/bigbang-ts/");
          response.end();
          return;
        }

        const file = getStaticFile(pathname);

        if (!file) {
          next();
          return;
        }

        ensureBuild();
        response.statusCode = 200;
        response.setHeader(
          "Content-Type",
          file.endsWith(".js") ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8",
        );
        response.end(readFileSync(file));
      });
    },
    generateBundle() {
      ensureBuild();
      this.emitFile({
        type: "asset",
        fileName: "bigbang-ts/index.html",
        source: readFileSync(bigBangIndex),
      });
      this.emitFile({
        type: "asset",
        fileName: "bigbang-ts/dist/main.js",
        source: readFileSync(bigBangBundle),
      });
    },
  };
}

export default defineConfig({
  plugins: [bigBangStaticPlugin(), react()],
  server: {
    port: 5173,
  },
});

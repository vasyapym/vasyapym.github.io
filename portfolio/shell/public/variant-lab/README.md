# Variant lab

Static showcase of five relay-generated presentation variants for the main-page
project cards. Served at `/variant-lab/` (vite copies this folder into dist
verbatim; no build step runs here — `lab.js` is the committed payload).

Rebuild after editing `src/lab.tsx`, from `portfolio/`:

```
node_modules/.bin/esbuild shell/public/variant-lab/src/lab.tsx --bundle --format=iife --jsx=automatic --define:process.env.NODE_ENV='"development"' --outfile=shell/public/variant-lab/lab.js
```

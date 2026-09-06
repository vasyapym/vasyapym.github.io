# Spine — a draggable Flexbox/Grid layout engine in Go → WebAssembly

Spine is an interactive layout builder: drag, nest and retune Flexbox and Grid
containers in real time, then export the clean HTML/CSS or share the exact
layout as a URL. The engine itself — the layout tree, the command history, the
code generator and the serializer — is written in Go and compiled to
WebAssembly; the browser only projects the tree onto real DOM nodes, so the
browser's native flex/grid engine does the actual positioning.

## Features

- Drag-and-drop reparenting and reordering (HTML5 drag events, handled in Go)
- Live-editable Flexbox properties: `flex-direction`, `flex-wrap`,
  `justify-content`, `align-items`, `gap`
- Live-editable Grid properties: `grid-template-columns/rows`, `grid-auto-flow`,
  with a Flex ⇄ Grid mode toggle
- Real-time HTML/CSS preview with copy-to-clipboard
- Undo/redo (command pattern — every mutation is a reversible command)
- Serializable layout state, shareable via the URL hash (base64 JSON)

## Architecture

The layering keeps the interesting logic browser-agnostic and unit-testable:

| Layer | Package | Responsibility |
|-------|---------|----------------|
| Domain model | `internal/model` | Pure tree of nodes; no DOM knowledge |
| Command layer | `internal/command` | The only way to mutate the tree; undo/redo stacks |
| Code generation | `internal/codegen` | Pure `tree → (HTML, CSS)` function |
| Serialization | `internal/serialize` | base64(JSON) ⇄ tree for shareable URLs |
| Browser glue | `main.go` (`js,wasm`) | DOM projection + interaction via `syscall/js` |

Key decisions:

- **DOM projection, not a custom solver.** Layout is expressed by applying real
  `display: flex`/`grid` styles to DOM nodes; the browser's engine does the
  positioning. Go owns state, interaction, history and codegen.
- **Event delegation** on the canvas root: click/drag listeners are registered
  once, so full re-renders never leak `js.Func` handlers.
- **One mutation path.** Add, delete, move, drag-drop and inspector edits all
  go through the same command layer, which is what makes undo/redo and the
  shareable URL fall out for free.
- **React hosts the static panes, Go owns the state.** `web/SpinePage.tsx`
  renders the three-pane shell once (uncontrolled inputs); the Go module binds
  to it by id and re-binds via a `spineRebind` hook when the shell's SPA
  navigation remounts the page.

## Layout of this directory

```text
spine/
├── go.mod
├── main.go              browser glue (GOOS=js GOARCH=wasm)
├── project.ts           portfolio shell descriptor
├── internal/            pure, tested Go packages
│   ├── model/
│   ├── command/
│   ├── codegen/
│   └── serialize/
└── web/
    ├── SpinePage.tsx    React page (static three-pane shell)
    ├── loader.ts        wasm loading + rebind plumbing
    ├── spine.css        scoped page styles
    ├── wasm_exec.js     vendored Go runtime shim
    └── spine.wasm       committed build artifact
```

The compiled `spine.wasm` is committed next to the page (the same convention
raft-cluster uses), so the shell's single Vite build picks it up as a static
asset with no extra pipeline.

## Develop

```bash
# Go tests + vet (standard toolchain, no browser needed)
cd portfolio/projects/spine
go vet ./... && go test ./...

# Rebuild the wasm artifact after changing Go code
GOOS=js GOARCH=wasm go build -o web/spine.wasm .

# Run the portfolio shell and open http://localhost:5173/projects/spine/
npm --prefix portfolio install
npm --prefix portfolio run dev
```

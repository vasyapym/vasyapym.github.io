# Task brief — Quicknotes iOS round: iframe host band, keyboard band, header auto-hide, editor type, folder labels

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists — deliberate, decide, and ship one coherent answer. The fixed points are §4 and the verbatim current code in §6; everything else is yours.

## 1. Context

Two codebases, one bug family.

**App** (`quicknotes/`): a single-owner, static, no-build note app — plain HTML + CSS + vanilla ES modules, Firebase v10.12.2 via gstatic CDN (auth popup→redirect fallback, Firestore persistent cache + multi-tab manager), localStorage local-first layer, last-write-wins sync, soft deletes. It works: Google sign-in, markdown editor with live preview, virtual folders from a `path` field, zip export, command palette, instant search, keyboard shortcuts, mobile drawer (JS drag-close + edge swipe), visual-viewport keyboard compensation. Full current code is pasted verbatim in §6.

**Catalogue** (the app's host, separate repo area): a React + Vite site. The quicknotes project page embeds the app in an iframe: `main.project-frame` (min-height:100vh) contains a topbar (`.project-frame-topbar` → `.project-frame-nav`, `min-height:60px`; at ≤560px it becomes a column with 1rem paddings — real height ~78–92px, not 60px) and `.quicknotes-host { height: calc(100vh - 60px) }` wrapping `.quicknotes-frame` (an iframe, width/height 100%). The same app also runs standalone at `/quicknotes/` (no host). Standalone deploy: `https://vasyapym.github.io/quicknotes/`.

## 2. Diagnosis already done (verified with numbers, WebKit, iPhone-390×664 emulation)

The scroll symptom ("inner lists don't reveal the last element; scrolling engages only once the header has scrolled off the screen") is **geometry in the host page, not the app**:

- Host arithmetic: topbar (~60px desktop, ~78–92px mobile) + `calc(100vh - 60px)` iframe = `100vh` (or more). On iPhone, `100vh` = the large viewport, so the host document is scrollable by the URL-bar delta (~60–85px) **plus** the topbar's extra height. Measured in a faithful replica host page: `document.documentElement.scrollHeight − innerHeight = 33px`, iframe `getBoundingClientRect().bottom − innerHeight = +33px`. On a real iPhone the band is larger (~90–110px).
- Consequence 1: the bottom of the app — footer + last list rows — sits below the fold whenever the host page is at scrollTop 0. Scrolling `#tree` to its very end (verified: `scrollTop` reaches max 1233/1233) still leaves the last `.note-item` below the fold. Panning further routes to the host page; the host topbar and the app header slide off-screen; only then is the last row revealed. This is the reported symptom, reproduced.
- Consequence 2 (keyboard, item 3): in the card, the post-keyboard "black band" can also come from the host level — the iframe is taller than the visible box, so a visual-viewport pan shows host background below the app. The in-app `pinViewport()` (`window.scrollTo(0,0)` inside the iframe) cannot reset the host page.
- Cleared suspects: `#sidebar` `touch-action:pan-y` + drawer drag JS (vertical pans are never `preventDefault`ed in `js/drawer.js` — dir is classified at 8px, only `dir==="h"` acts); safe-area occlusion (mobile `#sidebar` already has `padding-bottom:env(safe-area-inset-bottom)`); standalone geometry (verified clean: tree bottom == viewport bottom, last item reachable at max scroll).

Screenshots (for the integrator, not you): `quicknotes/.agent/iterations/code/fast-notes-app/artifacts/n013/01–05*.png` — card at host-top with the last row cut by the fold; card with host scrolled and the row visible; current editor and folder typography.

## 3. The owner's asks (then the working interpretation)

1. **Iframe host band** — make the quicknotes card page exactly the dynamic viewport height so it has zero scrollable overflow: topbar + host = `100dvh`, host = `100dvh − actual topbar height`. `:has()` is acceptable (the catalogue targets current browsers); a JS-measured `--qn-topbar` var (ResizeObserver on `.project-frame-topbar`) is the fallback if you judge it more robust. Other project pages must be untouched (`:has(.quicknotes-frame)` scoping or equivalent). Desktop look unchanged (100dvh == 100vh there).
2. **"Sticky header" (app header)** — the owner reports the quicknotes header feels sticky/pinned ("not enough space for a notes app"). There is **no `position:sticky` anywhere** (repo and deploy verified); the header is grid row 1 of a fixed `overflow:hidden` body, so it never leaves. Working interpretation: on mobile (≤760px) the app header must **auto-hide** — slide up out of view when an inner list (`#tree`, `#body`, `.preview`) scrolls down, slide back on scroll-up (and when the keyboard focuses a header field). The drawer must stay reachable while the header is hidden: the fixed `#drawer-edge` (24px strip, `touch-action:pan-y`) already opens the drawer by edge swipe — keep that working, and treat it as the fallback path. Desktop: header never hides.
3. **Keyboard black-band regression** — after opening and dismissing the keyboard, a black empty space can remain below the app (regression of the N011 fix that the owner had confirmed fixed). Harden the visual-viewport pin: the current `pinViewport()` runs `window.scrollTo(0,0)` on every vv scroll event when `vv.offsetTop > 0`; WebKit fires those events only when the gesture ends, and re-pans can land after. Make the settle robust (rAF-debounce / settle-after-gesture re-assert is the known next lever; also re-run `fitViewport()` on `focusout`/keyboard close). Belt-and-braces: when running inside an iframe (same-origin), also re-pin the top window (`window.parent.scrollTo(0,0)`) guarded by try/catch. Keep desktop behavior unchanged.
4. **Mobile edit-mode type** — owner: editor font/size feels big / "not clean" on iOS. Current measured state: `#title` 20px/30px, `#path` 16px mono, `#body` 13px/19.5px mono (coarse-pointer floor was deliberately lowered to 13px for `#body`/`#search` — the owner accepts the focus-zoom regression those two fields trigger; `#path` stays ≥16px), view toggle 14px. Make the mobile editor chrome calmer and denser (your call on the exact scale — e.g. title ~17px, path ~13px, tighter meta padding) with these hard constraints: ≥40px touch targets for buttons stay; the zoom acceptance for `#search`/`#body` stands; desktop type unchanged.
5. **Folder labels too prominent (iOS)** — current: `.folder > summary` is 10px uppercase, letter-spacing .5px, muted color, while `.note-item` is 14px. The owner reads it as too prominent and wants it **consistent with the surrounding text**. Note the size is already the smallest on the page — the prominence comes from the uppercase + tracking treatment. Rework it to read as secondary list text (your call: normal case, ~12px, lighter tracking, keep the ▸/▾ affordance and the toggle behavior). Desktop tree may keep its current look or adopt the same treatment — your call, but desktop layout must not reflow.

## 4. Fixed points (do not break or redesign)

- App: static no-build; ES modules; relative paths; no new dependencies, no framework. Design tokens (`:root` block in §6) unchanged; art SVGs unchanged.
- App storage contract: note fields exactly `id,title,path,body,createdAt,updatedAt,deleted` (+ client-only `_dirty`); `updatedAt` = `Date.now()`; `_dirty` cleared only when no edit happened during the push round-trip. Do not touch: `js/markdown.js`, `js/zip.js`, `js/config.js`, `js/store.js`, `js/firebase.js` (unless the iframe pin needs it — it doesn't), `firestore.rules`, `README.md`.
- App layout contract: `body` grid `auto 1fr auto`, `html,body overflow:hidden`, `--app-h` sizing + `pinViewport()`/`fitViewport()`/`fitPalette()` machinery (§6) keep working — evolve it, don't delete it. The drawer (`initDrawer`) and its edge-swipe stay. Safe-area padding rules stay.
- Host: other catalogue pages untouched — scope every CSS change to the quicknotes page; the topbar, realm and landing stay as they are. `QuicknotesPage.tsx` is the only React file you may change.
- Desktop >760px app look unchanged except nothing (items 2/4 are mobile-scoped in the `@media (max-width:760px)` / coarse-pointer blocks).

## 5. Acceptance criteria (observable)

1. Card: with the app's tree scrolled to its very end, the last `.note-item` is fully visible with the app header still on screen; the host document has zero scrollable overflow (`document.documentElement.scrollHeight === innerHeight` in a catalogue-like check at any viewport ≥320px, topbar included).
2. Keyboard: focus `#body`, dismiss — no dark band below the app in either standalone or card; header returns; `--app-h` tracks the real visible box within one frame after the gesture settles.
3. ≤760px: scrolling `#tree`/`#body` down slides `#top` out of view; scrolling up (or focusing `#search`-class fields) slides it back; `#drawer-edge` swipe still opens the drawer while the header is hidden; >760px: header always visible.
4. Edit mode on mobile: tightened chrome per your design; `#body` remains the workhorse (13px floor kept, zoom accepted); nothing wraps; ✕ and the view toggle stay on meta row 1.
5. Folder labels read as secondary list text; `.note-item` rows unchanged in size.
6. All existing behavior intact: sign-in (+ iframe handoff), sync, palette (with keyboard-fit), zip export, search, keyboard map, drawer drag-close + velocity, folder context menus, offline states.

## 6. Current state verbatim (the only source of truth)

### `quicknotes/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>notes</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 64 64%22%3E%3Crect width%3D%2264%22 height%3D%2264%22 rx%3D%227%22 fill%3D%22%2316161e%22%2F%3E%3Crect x%3D%22.5%22 y%3D%22.5%22 width%3D%2263%22 height%3D%2263%22 rx%3D%226.5%22 fill%3D%22none%22 stroke%3D%22%231f2335%22%2F%3E%3Cg fill%3D%22none%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpath d%3D%22M18 18h29v19L36 48H18Z%22 stroke%3D%22%233b4261%22 stroke-width%3D%221.25%22%2F%3E%3Cpath d%3D%22M47 37H36v11%22 stroke%3D%22%237aa2f7%22 stroke-width%3D%221.5%22%2F%3E%3Cpath d%3D%22M13 21v-8h8%22 stroke%3D%22%237aa2f7%22 stroke-width%3D%221.5%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<header id="top">
  <button id="drawer-toggle" class="btn" aria-label="Menu" aria-controls="sidebar" aria-expanded="false">☰</button>
  <span class="brand">
    <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 18h29v19L36 48H18Z" fill="none" stroke="#3b4261" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M47 37H36v11" fill="none" stroke="#7aa2f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 21v-8h8" fill="none" stroke="#7aa2f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>notes</span>
  <input id="search" type="search" placeholder="Search (Ctrl+K)  ·  Palette (Ctrl+P)" autocomplete="off" enterkeyhint="search">
  <span id="sync" class="sync" title="Sync status">local</span>
  <span id="user"></span>
  <button id="auth-btn" class="btn">Sign in</button>
</header>

<div id="layout">
  <aside id="sidebar">
    <div class="side-head">
      <button id="new-btn" class="btn" title="New note (Ctrl+N)">+ New</button>
      <button id="export-btn" class="btn" title="Export (Ctrl+Shift+E)">↓ Zip</button>
    </div>
    <div class="side-sort">
      <label for="sort" class="sort-label">Sort</label>
      <select id="sort" title="Sort notes" aria-label="Sort notes">
        <option value="updated">Last edited</option>
        <option value="created">Date created</option>
        <option value="title">Title (A–Z)</option>
      </select>
    </div>
    <div id="tree"></div>
  </aside>

  <main id="main">
    <div id="empty" class="empty">
      <svg class="art art-scratch" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect x="11" y="13" width="42" height="38" rx="2.5" stroke="#3b4261" stroke-width="1.25"/>
          <path d="M11 23h42" stroke="#3b4261" stroke-width="1.25"/>
          <path d="M22 34h24M22 42h16" stroke="#3b4261" stroke-width="1.25" opacity=".7"/>
          <circle cx="16.5" cy="18" r="1" fill="#3b4261" stroke="none"/>
          <circle cx="21.5" cy="18" r="1" fill="#3b4261" stroke="none"/>
          <path d="M17 31v6" stroke="#7aa2f7" stroke-width="1.5"/>
          <rect x="17" y="31" width="4.5" height="6" stroke="#7aa2f7" stroke-width="1.5"/>
        </g>
      </svg>
      <svg class="art art-offline" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="#3b4261" stroke-width="1.25">
          <path d="M26.3 38.3a8 8 0 0 1 11.4 0"/>
          <path d="M21.4 33.4a15 15 0 0 1 21.2 0"/>
          <path d="M16.4 28.4a22 22 0 0 1 31.2 0" opacity=".7"/>
        </g>
        <path d="M18 52 46 24" fill="none" stroke="#7aa2f7" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="32" cy="44" r="1.8" fill="#7aa2f7"/>
      </svg>
      <span>No note selected — <kbd>Ctrl</kbd>+<kbd>N</kbd> to create one.</span>
    </div>
    <div id="editor" hidden>
      <div class="meta">
        <input id="title" placeholder="Title" autocomplete="off" spellcheck="false" enterkeyhint="next">
        <button id="view-toggle" class="btn" title="Toggle edit / preview" aria-label="Toggle preview">Preview</button>
        <input id="path" placeholder="folder/subfolder" autocomplete="off" spellcheck="false" title="Virtual folder path" enterkeyhint="done">
        <button id="delete-btn" class="btn danger" title="Delete (Ctrl+D)">✕</button>
      </div>
      <div id="panes" class="panes split">
        <textarea id="body" placeholder="Write markdown… [[wiki-links]] supported" spellcheck="true"></textarea>
        <article id="preview" class="preview"></article>
      </div>
    </div>
  </main>
</div>

<footer id="status">
  <span class="shortcuts"><kbd>Ctrl+N</kbd> new · <kbd>Ctrl+P</kbd> palette · <kbd>Ctrl+E</kbd> view · <kbd>Ctrl+S</kbd> sync · <kbd>Ctrl+D</kbd> delete · <kbd>Esc</kbd> back</span>
  <span id="count"></span>
</footer>

<dialog id="palette">
  <input id="pal-input" placeholder="Type to open a note, or > for commands" autocomplete="off" enterkeyhint="go">
  <ul id="pal-list"></ul>
</dialog>

<dialog id="export-dlg">
  <form method="dialog">
    <h3>Export as .md in a zip</h3>
    <label>Scope
      <select id="export-scope"></select>
    </label>
    <menu>
      <button value="cancel" class="btn">Cancel</button>
      <button value="ok" class="btn primary">Download</button>
    </menu>
  </form>
</dialog>

<script type="module" src="js/app.js"></script>
<div id="backdrop" aria-hidden="true"></div>
<div id="drawer-edge" aria-hidden="true"></div>
</body>
</html>
```

### `quicknotes/css/style.css`

```css
:root{
  --bg:#0f1115;--bg2:#161920;--bg3:#1e222b;--fg:#d7dae0;--fg2:#8b919c;
  --acc:#7aa2f7;--danger:#f7768e;--ok:#9ece6a;--warn:#e0af68;--border:#2a2f3a;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --sans:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
}
*{box-sizing:border-box}
/* overflow:hidden + overscroll-behavior:none clamp the page to ONE scroll
   layer: the app is a fixed grid whose inner regions (#tree, #body, .preview)
   scroll on their own; chaining a nested scroller's overscroll out to the
   page is what read as "a second layout level" on touch.
   text-size-adjust:100% disables Mobile Safari's block-inflation heuristic —
   the root cause of "fonts too large" (editor + folder names) and the mode-
   dependent widening that pushed ✕ off meta row 1. It does NOT shrink text
   below authored size, so the coarse-pointer 16px zoom floor is untouched. */
html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 var(--sans);overflow:hidden;overscroll-behavior:none;-webkit-text-size-adjust:100%;text-size-adjust:100%}
button,input,select,textarea{font:inherit;color:inherit}
kbd{font:11px var(--mono);background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:0 4px}
a{color:var(--acc)}
[hidden]{display:none!important}

/* height:100dvh tracks iOS Safari's collapsing URL bar so the footer/editor
   bottom never clip; the plain 100vh line above is the pre-15.4 fallback. */
body{display:grid;grid-template-rows:auto 1fr auto;height:100vh;height:100dvh}
/* flex-wrap:wrap — the header row's min-content (~454px) pinned body width
   and overflowed narrow viewports; wrapping lets chrome reflow instead */
#top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;letter-spacing:.5px;color:var(--acc)}
.brand-mark{width:20px;height:20px}

.empty{margin:auto;color:var(--fg2);display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.empty .art{width:180px;height:180px;opacity:.9}
.empty .art-offline{display:none;width:140px;height:140px}
body.offline .empty .art-scratch{display:none}
body.offline .empty .art-offline{display:block}
/* min-width:0 lets the search shrink below its intrinsic width; max-width
   caps it so the sync cluster can claim the right-hand header zone. */
#search{flex:1;min-width:0;max-width:480px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 10px;outline:none}
#search:focus{border-color:var(--acc)}
.sync{font:12px var(--mono);color:var(--fg2)}
.sync.ok{color:var(--ok)}.sync.busy{color:var(--warn)}.sync.err{color:var(--danger)}
/* Right-anchored status cluster (sync + user + auth): the auto margin eats
   whatever the capped search leaves free. */
#sync{margin-left:auto}
#user{font-size:12px;color:var(--fg2)}
#user img{width:22px;height:22px;border-radius:50%;vertical-align:middle;margin-right:6px}

.btn{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:5px 10px;cursor:pointer}
.btn:hover{border-color:var(--acc)}
.btn.primary{background:var(--acc);color:#0b0d12;border-color:var(--acc)}
.btn.danger:hover{border-color:var(--danger);color:var(--danger)}
/* mobile-only Write/Preview switch — hidden on desktop, Ctrl+E still cycles */
#view-toggle{display:none}

#drawer-toggle{display:none}
#backdrop{position:fixed;inset:0;z-index:29;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .28s cubic-bezier(.2,.8,.2,1)}
#backdrop.show{opacity:1;pointer-events:auto}
#drawer-edge{display:none}
body.drawer-lock{overflow:hidden}

#layout{display:grid;grid-template-columns:260px 1fr;min-height:0}
#sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0}
.side-head{display:flex;gap:6px;padding:8px}
.side-head .btn{flex:1}
.side-sort{display:flex;align-items:center;gap:8px;padding:0 8px 8px}
.side-sort .sort-label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--fg2)}
#sort{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:5px 8px;outline:none;cursor:pointer}
#sort:focus{border-color:var(--acc)}
#tree{overflow:auto;overscroll-behavior:contain;padding:0 4px 8px}
.tree-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 8px;color:var(--fg2);font-size:12px;text-align:center}
.tree-empty svg{width:120px;height:120px;opacity:.85}
.folder{margin-top:6px}
.folder>summary{cursor:pointer;color:var(--fg2);font-size:12px;text-transform:uppercase;letter-spacing:.5px;padding:4px 8px;list-style:none;user-select:none}
.folder>summary::before{content:"▸ "}
.folder[open]>summary::before{content:"▾ "}
.note-item{display:block;width:100%;text-align:left;background:none;border:0;border-radius:5px;padding:5px 10px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note-item:hover{background:var(--bg3)}
.note-item.active{background:var(--bg3);color:var(--acc)}
.note-item .dirty{color:var(--warn)}

#main{display:flex;flex-direction:column;min-height:0}
.empty{margin:auto;color:var(--fg2)}
#editor{display:flex;flex-direction:column;height:100%;min-height:0}
.meta{display:flex;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border)}
#title{flex:2;background:none;border:0;font-size:18px;font-weight:600;outline:none}
#path{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-family:var(--mono);font-size:12px;outline:none}
#path:focus{border-color:var(--acc)}

.panes{flex:1;display:grid;min-height:0}
.panes.split{grid-template-columns:1fr 1fr}
.panes.edit #preview{display:none}
.panes.view #body{display:none}
/* contain on every nested scroller: reaching an end must not chain the pan
   outward into the page — the "different layout context" feeling. */
#body{resize:none;border:0;outline:none;background:var(--bg);padding:16px;font:14px/1.6 var(--mono);border-right:1px solid var(--border);overscroll-behavior:contain}
.preview{overflow:auto;overscroll-behavior:contain;padding:16px 24px}
.preview h1,.preview h2,.preview h3{margin:.8em 0 .4em;line-height:1.25}
.preview h1{font-size:1.7em;border-bottom:1px solid var(--border)}
.preview p{margin:.5em 0}
.preview code{font-family:var(--mono);background:var(--bg3);padding:1px 4px;border-radius:3px;font-size:.92em}
.preview pre{background:var(--bg3);padding:12px;border-radius:6px;overflow:auto}
.preview pre code{background:none;padding:0}
.preview blockquote{margin:.5em 0;padding:2px 12px;border-left:3px solid var(--acc);color:var(--fg2)}
.preview hr{border:0;border-top:1px solid var(--border)}
.preview img{max-width:100%}
.preview a.wiki{text-decoration:none;border-bottom:1px dashed var(--acc)}
.preview a.wiki.missing{color:var(--danger);border-color:var(--danger)}
.preview li.task{list-style:none;margin-left:-1.2em}

#status{display:flex;justify-content:space-between;padding:4px 12px;background:var(--bg2);border-top:1px solid var(--border);font-size:12px;color:var(--fg2)}

dialog{background:var(--bg2);color:var(--fg);border:1px solid var(--border);border-radius:10px;padding:0;min-width:480px;max-width:90vw}
dialog::backdrop{background:rgba(0,0,0,.55)}
#palette{top:12vh;margin-top:0}
#pal-input{width:100%;background:none;border:0;border-bottom:1px solid var(--border);padding:12px 14px;font-size:16px;outline:none}
#pal-list{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto;overscroll-behavior:contain}
#pal-list li{padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between}
#pal-list li.sel{background:var(--bg3);color:var(--acc)}
#pal-list li small{color:var(--fg2);font-family:var(--mono)}
#export-dlg form{padding:16px}
#export-dlg label{display:flex;flex-direction:column;gap:6px;margin:12px 0}
#export-dlg select{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px}
#export-dlg menu{display:flex;justify-content:flex-end;gap:8px;margin:0;padding:0}

@media (max-width:760px){
  #layout{grid-template-columns:1fr}

  /* single-row header on mobile: keep only drawer + search + status + auth.
     Brand (icon + "notes") and the user avatar/name are dropped; the signed-
     out "local (…)" label is hidden, while the signed-in "synced" indicator
     survives (body.signed-out toggled by switchUser in app.js). Desktop rules
     above are untouched, so brand + name still show >760px. */
  .brand{display:none}
  #user{display:none}
  body.signed-out #sync{display:none}
  /* signed-out fallback: #sync carries the right-zone auto margin, so when it
     is hidden the auth button takes the anchor instead. */
  body.signed-out #auth-btn{margin-left:auto}

  /* Compact search: it no longer needs to grab the whole row (D5) — the
     freed width becomes the right-hand status zone around #sync. */
  #search{flex:0 1 auto;width:min(44vw,260px)}

  #drawer-toggle{display:inline-flex}
  #sidebar{
    position:fixed;inset:0 auto 0 0;z-index:30;width:min(300px,85vw);
    padding-left:env(safe-area-inset-left);
    padding-bottom:env(safe-area-inset-bottom);
    transform:translateX(-100%);
    transition:transform .28s cubic-bezier(.2,.8,.2,1);
    box-shadow:0 0 0 1px rgba(0,0,0,.06),8px 0 24px rgba(0,0,0,.18);
    touch-action:pan-y;
  }
  #sidebar.open{transform:none}
  #sidebar.dragging,#backdrop.dragging{transition:none}
  #drawer-edge{display:block;position:fixed;inset:0 auto 0 0;width:24px;z-index:28;touch-action:pan-y}
  .panes.split{grid-template-columns:1fr}
  .panes.split #preview{display:none}

  /* notch/home-indicator safe areas on the fixed chrome */
  #top{padding-top:calc(6px + env(safe-area-inset-top));padding-left:calc(12px + env(safe-area-inset-left));padding-right:calc(12px + env(safe-area-inset-right))}
  .side-head,.side-sort{padding-left:calc(8px + env(safe-area-inset-left))}

  /* ≥40px touch targets */
  .btn{min-height:40px;padding:8px 12px}
  #drawer-toggle{min-width:40px;justify-content:center}
  .note-item{padding:11px 12px}
  .folder>summary{padding:10px 8px;font-size:10px}
  #sort{min-height:40px}

  /* meta: mobile-first — title+toggle+delete on row 1, path reflows below.
     flex:1 1 0 + min-width:0 give the title a ZERO basis and override the
     input's implicit min-width:auto, so it absorbs 100% of the row's shrink.
     Result: the ✕ delete button and the toggle keep fixed size and can never
     be pushed to a new row regardless of the "Edit"/"Preview" label length
     or any residual autosizing (was flex:1 1 auto → intrinsic-width fragile,
     which wrapped ✕ in preview mode). */
  .meta{flex-wrap:wrap}
  #title{flex:1 1 0;min-width:0;font-size:20px}
  #view-toggle{display:inline-flex;align-items:center;gap:4px;flex:0 0 auto}
  #delete-btn{flex:0 0 auto}
  #path{order:3;flex:1 0 100%}

  /* dialogs fit 320px */
  dialog{min-width:0;width:min(94vw,480px)}
  /* palette list fallback cap in dvh when visualViewport is unavailable;
     app.js overrides max-height inline to fit above the software keyboard */
  #pal-list{max-height:60dvh}

  /* footer: drop keyboard cheat-sheet, keep count, clear home indicator */
  #status{padding:6px 12px calc(6px + env(safe-area-inset-bottom))}
  #status .shortcuts{display:none}

  /* editor/preview bottom safe area + tighter preview gutters.
     line-height:1.5 (was 1.6) is the honest "smaller editor" lever: the font
     stays at the 16px coarse-pointer floor (no focus auto-zoom) while the
     de-boosted text now sets tighter, so it reads smaller/denser. */
  #body{padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));line-height:1.5}
  .preview{padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom))}

  /* Keyboard-proof app box: dvh ignores the software keyboard, so iOS pans
     the visual viewport to lift the caret (the tap-shift). app.js writes the
     real visible height into --app-h (visualViewport.height); this fallback
     keeps the dvh sizing if JS never runs. */
  body{height:var(--app-h,100dvh)}
}
@media (prefers-reduced-motion:reduce){#sidebar,#backdrop{transition:none}}

/* iOS Safari auto-zooms when a focused field is <16px, so this block used to
   hold every field at the 16px floor. Owner device feedback (N012) asked for
   ~20% smaller mobile text on the search bar and editor and explicitly
   accepted the focus-zoom regression, so those two drop to 13px; everything
   else (e.g. #path) stays at the no-zoom floor. */
@media (hover:none) and (pointer:coarse){
  input,select,textarea{font-size:16px}
  #path{font-size:16px}
  #search,#body{font-size:13px}
}

.ctx{position:fixed;z-index:100;min-width:180px;margin:0;padding:4px;list-style:none;background:var(--bg2);color:var(--fg);border:1px solid var(--border);border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,.3),0 8px 28px rgba(0,0,0,.35);font:14px/1.3 var(--sans);outline:none;user-select:none}
.ctx [role=menuitem]{padding:7px 12px;border-radius:6px;cursor:default}
.ctx [role=menuitem]:hover,.ctx [role=menuitem]:focus{background:var(--bg3);color:var(--acc);outline:none}
.ctx [role=menuitem].danger{color:var(--danger)}
.ctx [role=menuitem].danger:hover,.ctx [role=menuitem].danger:focus{background:var(--danger);color:#0b0d12}
.ctx [aria-disabled=true]{opacity:.4;pointer-events:none}
.ctx-sep{height:1px;margin:4px 8px;background:var(--border)}

#tree [data-folder],#tree [data-id]{-webkit-touch-callout:none;user-select:none}
#tree .drop-target{outline:2px solid var(--acc);outline-offset:-2px;border-radius:6px}
#tree .rename{font:inherit;width:100%;padding:1px 4px;background:var(--bg);border:1px solid var(--acc);border-radius:4px;outline:none}
```

### `portfolio/projects/quicknotes/web/QuicknotesPage.tsx`

```tsx
// web/QuicknotesPage.tsx — React page hosting the static quicknotes app.
//
// Quicknotes is a plain ES-module app served as-is from /quicknotes/ (vite
// plugin in dev, bundle assets in build), so the page is a full-bleed frame
// around it: the app owns its own header, drawer and dialogs, and React only
// supplies the catalogue chrome around the embed.

export default function QuicknotesPage() {
  return (
    <div className="quicknotes-host">
      <iframe
        src="/quicknotes/"
        title="Quicknotes"
        className="quicknotes-frame"
      />
    </div>
  );
}
```

### Host CSS excerpt (`portfolio/shell/src/styles.css`, only these rules may change)

```css
/* [keep] Shared project frame */
.project-frame {
  min-height: 100vh;
  color: var(--ink-text);
  background: var(--ink-bg);
  --focus-ring: var(--ink-accent-bright);
  font-family: var(--sans);}

.project-frame-topbar {
  background: var(--ink-bg);
  border-bottom: 1px solid var(--ink-line-soft);
  --focus-ring: var(--ink-accent-bright);}

.project-frame-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100% - 72px, 1200px);
  min-height: 60px;
  gap: 2rem;}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0;
  color: var(--ink-muted);
  background: transparent;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.74rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: none;
  transition: color 180ms ease, gap 180ms ease;}

.back-link:hover {
  gap: 0.8rem;
  color: var(--ink-accent-bright);}

.project-frame-label {
  max-width: 52%;
  overflow: hidden;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-overflow: ellipsis;
  text-transform: lowercase;
  white-space: nowrap;}

.project-loading {
  padding-top: 5rem;
  color: var(--ink-muted);
  font-family: var(--sans);
  font-size: 0.78rem;}

.project-crash {
  padding-top: 5rem;
  max-width: 40rem;
  color: var(--ink-muted);
  font-family: var(--sans);}

.project-crash-title {
  color: var(--ink-text);
  font-size: 1.3rem;}

.project-crash-copy {
  margin: 0.6rem 0 1rem;
  font-size: 0.85rem;
  line-height: 1.55;}

.project-crash-detail {
  margin: 0 0 1.4rem;
  padding: 0.8rem 1rem;
  overflow-x: auto;
  color: var(--ink-muted);
  background: rgba(238, 234, 224, 0.05);
  border: 1px solid var(--ink-line-soft);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 0.72rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;}


/* Quiet index */
.signal-index-header {
  min-height: 64px;}


/* Responsive — the body is now a single flex column at every width, so no
   grid-template / order rules are needed; only the artwork floor changes. */


@media (max-width: 560px) {
  .section-shell,                              /* [keep] */
  .signal-index-shell,                         /* [keep] */
  .project-frame-nav { width: min(100% - 32px, 1280px); }  /* [keep] */

  .signal-index-header {                       /* [keep] */
    align-items: flex-start;
    flex-direction: column;
  }

  .signal-index-header { gap: 0.65rem; }       /* [keep] */

  .project-frame-nav {                         /* [keep] */
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    gap: 0.7rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .project-frame-label { max-width: 100%; }}   /* [keep] */


@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  .project-artwork-object, .signal-index-card { transform: none !important; }}


@media (max-width: 560px) {
  .signal-index-header {
    align-items: center;
    flex-direction: row;
    gap: 1rem;
  }

  .signal-index-identity {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .signal-index-identity-divider {
    display: none;
  }

  .signal-index-wordmark {
    font-size: 0.76rem;
  }

  .signal-index-contact {
    font-size: 0.7rem;
  }

  .signal-index-count {
    font-size: 0.68rem;
  }

  .signal-index-projects {
    padding-top: 0.25rem;
  }}




/* Planck to Now */
.planck-field {
  min-height: max(480px, calc(100vh - 61px));
  color: var(--ink-text);
  background: var(--ink-bg);
  color-scheme: dark;
  --focus-ring: var(--ink-accent-bright);}


.planck-page {
  width: min(100% - 72px, 1200px);
  margin: 0 auto;
  padding: clamp(3rem, 5vw, 4.5rem) 0 6rem;}


.planck-hero {
  padding-bottom: clamp(2.5rem, 4vw, 3.5rem);}


.planck-hero h1 {
  max-width: 560px;
  margin: 0;
  font-family: var(--display);
  font-size: clamp(2rem, 3.3vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 0.97;}


.planck-hero h1 span {
  display: block;
  color: var(--ink-accent);}


.planck-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1.6rem;
  margin-top: 1.4rem;}


.planck-actions a {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--ink-text);
  font-family: var(--mono);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 180ms ease, gap 180ms ease;}


.planck-actions a:hover,
.planck-actions a:focus-visible {
  gap: 0.85rem;
  color: var(--ink-accent-bright);}


.planck-simulation {
  border-top: 1px solid var(--ink-line);
  padding-top: 1.1rem;}


.planck-simulation-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 1rem;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.05em;}


.planck-simulation-meta a {
  color: var(--ink-muted);
  text-decoration: none;
  transition: color 180ms ease;}


.planck-simulation-meta a:hover,
.planck-simulation-meta a:focus-visible {
  color: var(--ink-accent-bright);}


.planck-frame {
  display: block;
  width: 100%;
  height: 680px;
  border: 1px solid var(--ink-line);
  background: #000;
  /* the sim owns every gesture that starts on it; the page scrolls from
     everywhere else — without this, phones pan the parent instead of orbiting */
  touch-action: none;}


.planck-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 2.5rem;
  margin: clamp(2.5rem, 4vw, 3.5rem) 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--ink-line);}


.planck-facts li {
  padding: 0.85rem 0.2rem;
  border-bottom: 1px solid var(--ink-line-soft);
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.05em;}


.planck-facts li span {
  color: var(--ink-accent);}


@media (max-width: 900px) {
  .planck-frame {
    height: 600px;
  }}


@media (max-width: 640px) {
  .planck-page {
    width: min(100% - 32px, 1200px);
    padding-top: 3rem;
  }

  .planck-facts {
    grid-template-columns: 1fr;
  }

  .planck-simulation-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }

  .planck-frame {
    height: 540px;
  }}


/* Planck embed boot state: the ignition motif shown while the iframe's
   simulation bundle loads; faded out once the iframe reports load. */
.planck-frame-stage {
  position: relative;}


.planck-frame-wait {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: #000;
  pointer-events: none;
  opacity: 1;
  transition: opacity 600ms ease 300ms, visibility 0s linear 900ms;}


.planck-frame-wait.is-done {
  opacity: 0;
  visibility: hidden;}


.planck-frame-ember {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff6e8 0%, #f4c891 40%, rgba(211, 155, 97, 0.5) 62%, rgba(211, 155, 97, 0) 76%);
  box-shadow: 0 0 22px 5px rgba(211, 155, 97, 0.25);
  animation: planck-ember-pulse 1.6s ease-in-out infinite;}


.planck-frame-note {
  margin: 0;
  color: var(--ink-faint);
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.05em;}


@keyframes planck-ember-pulse {
  0%, 100% { transform: scale(1); opacity: 0.75; }
  50% { transform: scale(1.18); opacity: 1; }}


@media (prefers-reduced-motion: reduce) {
  .planck-frame-ember { animation: none; }}


@media (max-width: 560px) {
  /* Hero hugs content (no 100svh floor). Copy top clears the 64px absolute
     header (≥84px at 320×568). The catalogue lists 6 rows in one column with
     the "more ↓" affordance pointing at the cards below, rows ≥44px, zero
     horizontal overflow at 320px. The fluid canvas fills the content-hugged
     height and is self-driven, so it lives without input. */
  .signal-index-hero-fluid {
    grid-template-rows: auto auto auto;
    min-height: auto;
    padding-top: calc(64px + 1.25rem);
    padding-bottom: 2.4rem;
    gap: 1.5rem;
  }

  .signal-index-hero-fluid .signal-index-hero-copy {
    grid-row: auto;
    justify-self: stretch;
    max-width: none;
    align-self: start;
    padding: 1rem 1rem 1.1rem;
  }

  .signal-index-hero-kicker {
    margin-bottom: 0.7rem;
    font-size: 0.62rem;
    letter-spacing: 0.3em;
  }

  .signal-index-hero-headline {
    font-size: clamp(1.6rem, calc((100vw - 32px) / 10.5), 2.48rem);
    line-height: 0.98;
    letter-spacing: -0.02em;
  }

  .signal-index-hero-note {
    margin-top: 1rem;
    font-size: 0.62rem;
  }

  .signal-index-hero-fluid .signal-index-beneath {
    grid-row: auto;
    align-self: start;
    grid-template-columns: 1fr;
  }}


@media (prefers-reduced-motion: reduce) {
  /* The canvas paints one intentional warm static frame from JS (matchMedia
     gate); here we only neutralise the DOM entrance animations. Copy stays
     visible — nothing hidden. */
  .signal-index-hero-fluid-canvas {
    animation: none;
    opacity: 1;
  }

  .signal-index-hero-line-in,
  .signal-index-hero-kicker,
  .signal-index-hero-note {
    animation: none;
  }

  .signal-index-hero-line-in {
    transform: none;
  }

  .signal-index-hero-kicker,
  .signal-index-hero-note {
    opacity: 1;
  }}



.explosion-overlay {
  position: fixed;
  z-index: 2147483000;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.explosion-overlay-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}


/* ===== Gemstones cards ===== */

/* -- section + grid -- */
.signal-index-projects {
  padding: 32px 0 clamp(4.5rem, 8vw, 6.5rem);}

.signal-index-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;}


/* -- card panel -- */
.signal-index-card {
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--panel-radius);
  background: #0b1317;
  color: var(--ink-text);
  text-decoration: none;
  scroll-margin-top: 1.5rem;
  border: 1px solid var(--ink-line-soft);
  transition:
    transform 180ms ease-out,
    box-shadow 180ms ease-out;}

.signal-index-card:focus {
  outline: none;}


/* -- art stage -- */
.project-artwork {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #0b1317;
  transition: background-color 180ms ease-out;}

.project-artwork-object {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform-style: preserve-3d;
  transform:
    perspective(600px)
    rotateX(var(--art-rotate-x, 0deg))
    rotateY(var(--art-rotate-y, 0deg))
    translate3d(var(--art-shift-x, 0px), var(--art-shift-y, 0px), 0);
  transition: transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);}

.project-artwork-center {
  display: block;
  width: 82%;
  max-width: 260px;
  aspect-ratio: 260 / 160;}

.project-artwork-center svg {
  display: block;
  width: 100%;
  height: 100%;}

.gem-halo {
  transition: opacity 180ms ease-out;}

/* quicknotes page host — the static app owns its own chrome.
   Owner verdict (F002): full-bleed on purpose — the app is more useful
   without the site's gutter cap; alignment applies to the other pages. */
.quicknotes-host {
  height: calc(100vh - 60px);
  background: var(--ink-bg);}

.quicknotes-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #0f1115;}


```

### `quicknotes/js/app.js`

```js
import { configured, watchAuth, login, logout, watchNotes, pushNote } from "./firebase.js";
import { loadLocal, saveLocal, makeNote, mergeRemote, normPath, safeName } from "./store.js";
import { render } from "./markdown.js";
import { makeZip, download } from "./zip.js";
import { initDrawer } from "./drawer.js";
import { initTreeActions } from "./tree-actions.js";

const $ = s => document.querySelector(s);
const el = {
  search: $("#search"), sync: $("#sync"), user: $("#user"), authBtn: $("#auth-btn"),
  newBtn: $("#new-btn"), exportBtn: $("#export-btn"), tree: $("#tree"), sort: $("#sort"),
  empty: $("#empty"), editor: $("#editor"), title: $("#title"), path: $("#path"),
  delBtn: $("#delete-btn"), viewToggle: $("#view-toggle"),
  panes: $("#panes"), body: $("#body"), preview: $("#preview"),
  count: $("#count"), palette: $("#palette"), palInput: $("#pal-input"), palList: $("#pal-list"),
  exportDlg: $("#export-dlg"), exportScope: $("#export-scope"),
  hamburger: $("#drawer-toggle"), backdrop: $("#backdrop"), edge: $("#drawer-edge"), main: $("#main")
};

const drawer = initDrawer({
  drawer: $("#sidebar"), backdrop: el.backdrop, edge: el.edge,
  toggle: el.hamburger, main: el.main
});

const VIEWS = new Set(["edit", "split", "view"]);
const savedView = localStorage.getItem("view");
const SORTS = new Set(["updated", "created", "title"]);
const savedSort = localStorage.getItem("sort");
const state = {
  uid: "local", user: null, notes: {}, activeId: null, filter: "",
  view: VIEWS.has(savedView) ? savedView : "split",
  sort: SORTS.has(savedSort) ? savedSort : "updated",
  unsubNotes: null, openFolders: new Set()
};

// max-width:760px is the single source of truth for "mobile" in JS too
// (placeholder text + palette keyboard-fit gate).
const narrow = matchMedia("(max-width:760px)");

// ---------- helpers ----------
// Every programmatic focus goes through here: a bare .focus() makes WebKit
// scroll ancestors to "reveal" the target — the tap-shift glitch. For users
// who just tapped a note/field the element is already on screen, so the
// reveal-scroll is pure jitter; preventScroll removes it.
const focusEl = elm => elm?.focus({ preventScroll: true });
const live = () => Object.values(state.notes).filter(n => !n.deleted);
const active = () => state.notes[state.activeId] || null;
const byTitle = t => live().find(n => n.title.trim().toLowerCase() === t.trim().toLowerCase());
const setSync = (txt, cls = "") => { el.sync.textContent = txt; el.sync.className = "sync " + cls; };
const persist = () => saveLocal(state.uid, state.notes);

// Alphabetical = case/locale-insensitive, natural-numeric; empty → "Untitled";
// ties fall back to most-recently-edited so order stays stable and useful.
const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
function cmpNotes() {
  if (state.sort === "created") return (a, b) => b.createdAt - a.createdAt;
  if (state.sort === "title")
    return (a, b) => collator.compare(a.title || "Untitled", b.title || "Untitled") || b.updatedAt - a.updatedAt;
  return (a, b) => b.updatedAt - a.updatedAt;
}

// ---------- sync ----------
const pending = new Map();
function schedulePush(id) {
  if (!state.user) return;
  clearTimeout(pending.get(id));
  pending.set(id, setTimeout(() => flushPush(id), 800));
}
async function flushPush(id) {
  pending.delete(id);
  const n = state.notes[id];
  if (!n || !state.user) return;
  setSync("syncing…", "busy");
  const stamp = n.updatedAt;
  try {
    await pushNote(state.uid, n);
    // Only clear the dirty flag if no local edit happened during the round-trip.
    if (n.updatedAt === stamp) { n._dirty = false; persist(); }
    setSync("synced", "ok"); renderTree();
  } catch (e) { console.error(e); setSync("sync error", "err"); }
}
async function pushAllDirty() {
  for (const n of Object.values(state.notes)) if (n._dirty) await flushPush(n.id);
}

function switchUser(user) {
  state.user = user;
  state.unsubNotes?.(); state.unsubNotes = null;
  const uid = user ? user.uid : "local";

  // First sign-in: carry local-only notes into the account.
  const orphan = uid !== "local" ? loadLocal("local") : {};
  state.uid = uid;
  state.notes = loadLocal(uid);
  for (const n of Object.values(orphan)) if (!state.notes[n.id]) state.notes[n.id] = { ...n, _dirty: true };
  if (Object.keys(orphan).length) { persist(); localStorage.removeItem("notes:local"); }

  el.user.innerHTML = user
    ? `<img src="${escapeHtml(user.photoURL || "")}" alt="">${escapeHtml(user.displayName || user.email || "")}`
    : "";
  el.authBtn.textContent = user ? "Sign out" : "Sign in";
  // CSS hook: on mobile the signed-out "local (…)" status is hidden, while the
  // signed-in "synced" indicator stays. (see css @media max-width:760px)
  document.body.classList.toggle("signed-out", !user);
  state.activeId = null;
  renderAll();

  if (user) {
    setSync("connecting…", "busy");
    state.unsubNotes = watchNotes(uid, remote => {
      const { notes, changed } = mergeRemote(state.notes, remote);
      state.notes = notes;
      if (changed) { persist(); renderAll(); }
      setSync("synced", "ok");
    }, e => { console.error(e); setSync("offline", "err"); });
    pushAllDirty();
  } else setSync(configured ? "local (signed out)" : "local only");
}

// ---------- rendering ----------
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function renderTree() {
  const q = state.filter.toLowerCase();
  const notes = live().filter(n => !q || (n.title + " " + n.path + " " + n.body).toLowerCase().includes(q))
    .sort(cmpNotes());
  const groups = new Map();
  for (const n of notes) { const p = n.path || ""; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(n); }
  const paths = [...groups.keys()].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));

  el.tree.innerHTML = "";
  if (!notes.length) {
    el.tree.innerHTML =
      '<div class="tree-empty">' +
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M11 47V19h14l4 5h24v23Z" stroke="#3b4261" stroke-width="1.25"/>' +
      '<path d="M11 30h42" stroke="#7aa2f7" stroke-width="1.5"/>' +
      '<circle cx="32" cy="30" r="2" fill="#16161e" stroke="#7aa2f7" stroke-width="1.5"/>' +
      "</g></svg><span>No notes yet — Ctrl+N to create the first one.</span></div>";
    el.count.textContent = "0 notes · 0 folders";
    return;
  }
  for (const p of paths) {
    const d = document.createElement("details");
    d.className = "folder";
    d.dataset.folder = p;
    d.open = q ? true : !state.openFolders.has("closed:" + p);
    d.addEventListener("toggle", () => d.open ? state.openFolders.delete("closed:" + p) : state.openFolders.add("closed:" + p));
    const s = document.createElement("summary");
    s.innerHTML = `<span class="label">${escapeHtml(p || "(root)")}</span>`;
    d.appendChild(s);
    for (const n of groups.get(p)) {
      const b = document.createElement("button");
      b.className = "note-item" + (n.id === state.activeId ? " active" : "");
      b.dataset.id = n.id;
      b.dataset.path = n.path || "";
      b.innerHTML = (n._dirty && state.user ? '<span class="dirty">● </span>' : "") + escapeHtml(n.title || "Untitled");
      b.onclick = () => { openNote(n.id); drawer.close(); };
      d.appendChild(b);
    }
    el.tree.appendChild(d);
  }
  el.count.textContent = `${live().length} notes · ${paths.filter(Boolean).length} folders`;
}

function renderEditor() {
  const n = active();
  el.empty.hidden = !!n; el.editor.hidden = !n;
  if (!n) return;
  if (document.activeElement !== el.title) el.title.value = n.title;
  if (document.activeElement !== el.path) el.path.value = n.path;
  if (document.activeElement !== el.body) el.body.value = n.body;
  renderPreview();
  el.panes.className = "panes " + state.view;
  // Plain text labels — eye/pencil emoji removed (Decision Log).
  el.viewToggle.textContent = state.view === "view" ? "Edit" : "Preview";
}
function renderPreview() {
  const n = active(); if (!n) return;
  el.preview.innerHTML = render(n.body, { exists: t => !!byTitle(t) });
}
function renderAll() { renderTree(); renderEditor(); }

// ---------- note ops ----------
function openNote(id) {
  state.activeId = id; renderAll();
  if (state.view === "view") focusEl(el.preview); else focusEl(el.body);
}
function createNote(partial = {}) {
  const cur = active();
  const n = makeNote({ path: cur ? cur.path : "", ...partial });
  state.notes[n.id] = n; persist(); schedulePush(n.id);
  openNote(n.id); focusEl(el.title);
  return n;
}
function updateActive(patch) {
  const n = active(); if (!n) return;
  Object.assign(n, patch, { updatedAt: Date.now(), _dirty: true });
  persist(); schedulePush(n.id);
}
function deleteActive() {
  const n = active(); if (!n) return;
  if (!confirm(`Delete "${n.title || "Untitled"}"?`)) return;
  n.deleted = true; n.updatedAt = Date.now(); n._dirty = true;
  persist(); schedulePush(n.id);
  state.activeId = null; renderAll(); focusEl(el.search);
}
function softDeleteNote(id) {
  const n = state.notes[id]; if (!n || n.deleted) return;
  if (!confirm(`Delete "${n.title || "Untitled"}"?`)) return;
  n.deleted = true; n.updatedAt = Date.now(); n._dirty = true;
  persist(); schedulePush(id);
  if (state.activeId === id) state.activeId = null;
  renderAll(); focusEl(el.search);
}

// ---------- tree actions (context menus, long-press, drag&drop) ----------
const commit = ids => { persist(); for (const id of ids) schedulePush(id); renderTree(); };
initTreeActions({
  tree: el.tree,
  getNotes: () => state.notes,
  commit,
  onOpen: id => { openNote(id); drawer.close(); },
  onDelete: id => softDeleteNote(id),
  createNote: path => { const n = createNote({ path }); drawer.close(); return n; },
  notify: m => alert(m)
});
function followWiki(title) {
  const n = byTitle(title);
  openNote(n ? n.id : createNote({ title }).id);
}

// ---------- export ----------
function folderList() {
  const set = new Set(); for (const n of live()) if (n.path) set.add(n.path);
  return [...set].sort();
}
function noteToMd(n) {
  const front = `---\ntitle: ${JSON.stringify(n.title)}\npath: ${JSON.stringify(n.path)}\ncreated: ${new Date(n.createdAt).toISOString()}\nupdated: ${new Date(n.updatedAt).toISOString()}\n---\n\n`;
  return front + n.body + (n.body.endsWith("\n") ? "" : "\n");
}
function exportZip(scope) {
  const notes = live().filter(n => scope === "*" || n.path === scope || n.path.startsWith(scope + "/"));
  if (!notes.length) return alert("Nothing to export.");
  const used = new Set();
  const files = notes.map(n => {
    let base = (n.path ? n.path.split("/").map(s => safeName(s)).join("/") + "/" : "") + safeName(n.title);
    let name = base, i = 2; while (used.has(name)) name = `${base} (${i++})`; used.add(name);
    return { name: name + ".md", data: noteToMd(n) };
  });
  const stamp = new Date().toISOString().slice(0, 10);
  download(makeZip(files), `notes-${scope === "*" ? "all" : safeName(scope.replace(/\//g, "_"))}-${stamp}.zip`);
}
function openExport() {
  el.exportScope.innerHTML = `<option value="*">All notes</option>` +
    folderList().map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join("");
  const cur = active(); if (cur?.path) el.exportScope.value = cur.path;
  el.exportDlg.showModal();
}
el.exportDlg.addEventListener("close", () => { if (el.exportDlg.returnValue === "ok") exportZip(el.exportScope.value); });

// ---------- palette ----------
let palItems = [], palSel = 0;
const commands = [
  { label: "New note", run: () => createNote() },
  { label: "Toggle view (edit / split / preview)", run: cycleView },
  { label: "Export all as zip", run: () => exportZip("*") },
  { label: "Export current folder as zip", run: () => exportZip(active()?.path || "") },
  { label: "Export… (choose folder)", run: openExport },
  { label: "Sync now", run: pushAllDirty },
  { label: "Delete current note", run: deleteActive },
  { label: "Sign in / out", run: () => state.user ? logout() : login() }
];
function openPalette(prefix = "") {
  el.palInput.value = prefix; el.palette.showModal(); focusEl(el.palInput); renderPalette(); fitPalette();
}
// The palette used top:12vh + #pal-list max-height:50vh, both computed against
// the LAYOUT viewport, which does not shrink for the iOS software keyboard —
// so the list's lower rows sat behind the keyboard and the last item could
// never be scrolled into view. visualViewport gives the real visible box; we
// pin the dialog to its top and cap the list to what fits above the keyboard.
// Gated to mobile; on desktop we clear the inline styles and the CSS wins.
// NOTE (H3 interplay): pinViewport() now drives vv.offsetTop → 0 whenever iOS
// tries to pan, so the `top` term below settles to `pad` (visible-box top).
// The onViewport() handler always runs pin BEFORE this, so we read a settled
// offsetTop, never a mid-pan value.
function fitPalette() {
  if (!el.palette.open) return;
  if (!narrow.matches) { el.palette.style.top = ""; el.palList.style.maxHeight = ""; return; }
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  const top = vv ? vv.offsetTop : 0;
  const pad = 8;
  el.palette.style.top = (top + pad) + "px";
  const inputH = el.palInput.offsetHeight || 48;
  el.palList.style.maxHeight = Math.max(120, h - inputH - pad * 3) + "px";
}
function renderPalette() {
  const q = el.palInput.value;
  if (q.startsWith(">")) {
    const t = q.slice(1).trim().toLowerCase();
    palItems = commands.filter(c => c.label.toLowerCase().includes(t)).map(c => ({ label: c.label, hint: "cmd", run: c.run }));
  } else {
    // Palette keeps its own recency ordering (a quick-switcher wants "recent",
    // not whatever the sidebar sort is) — see Decision Log.
    const t = q.trim().toLowerCase();
    palItems = live().filter(n => !t || (n.title + " " + n.path).toLowerCase().includes(t))
      .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50)
      .map(n => ({ label: n.title || "Untitled", hint: n.path || "/", run: () => openNote(n.id) }));
    if (t && !byTitle(t)) palItems.push({ label: `Create "${q.trim()}"`, hint: "new", run: () => createNote({ title: q.trim() }) });
  }
  palSel = 0;
  el.palList.innerHTML = palItems.map((it, i) =>
    `<li class="${i === palSel ? "sel" : ""}" data-i="${i}"><span>${escapeHtml(it.label)}</span><small>${escapeHtml(it.hint)}</small></li>`).join("");
}
function palMove(d) {
  if (!palItems.length) return;
  palSel = (palSel + d + palItems.length) % palItems.length;
  [...el.palList.children].forEach((li, i) => li.classList.toggle("sel", i === palSel));
  el.palList.children[palSel]?.scrollIntoView({ block: "nearest" });
}
function palRun(i = palSel) { const it = palItems[i]; el.palette.close(); it?.run(); }
el.palInput.addEventListener("input", renderPalette);
el.palInput.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
  else if (e.key === "Enter") { e.preventDefault(); palRun(); }
});
el.palList.addEventListener("click", e => { const li = e.target.closest("li"); if (li) palRun(+li.dataset.i); });
// Clear the keyboard-fit overrides so a later desktop open uses the CSS geometry.
el.palette.addEventListener("close", () => { el.palette.style.top = ""; el.palList.style.maxHeight = ""; });
// (visualViewport re-fit is now driven by the single onViewport() handler in
// the keyboard-proof section, which calls fitPalette after pin + fitViewport.)

// ---------- view ----------
function cycleView() {
  state.view = { edit: "split", split: "view", view: "edit" }[state.view];
  localStorage.setItem("view", state.view); renderEditor();
}
// Mobile switcher: split collapses to the editor on phones, so a binary
// Write⇄Preview toggle is unambiguous where the 3-way cycle would dead-tap.
function toggleMobileView() {
  state.view = state.view === "view" ? "edit" : "view";
  localStorage.setItem("view", state.view); renderEditor();
}

// ---------- events ----------
el.authBtn.onclick = () => state.user ? logout() : login().catch(e => alert(e.message));
el.newBtn.onclick = () => createNote();
el.exportBtn.onclick = openExport;
el.delBtn.onclick = deleteActive;
el.viewToggle.onclick = toggleMobileView;
el.sort.onchange = () => {
  state.sort = SORTS.has(el.sort.value) ? el.sort.value : "updated";
  localStorage.setItem("sort", state.sort);
  renderTree();
};
el.title.oninput = () => { updateActive({ title: el.title.value }); renderTree(); };
el.path.oninput = () => updateActive({ path: el.path.value });
el.path.onchange = el.path.onblur = () => {
  const clean = normPath(el.path.value);
  if (clean !== el.path.value) { updateActive({ path: clean }); el.path.value = clean; }
  renderTree();
};
el.body.oninput = () => { updateActive({ body: el.body.value }); renderPreview(); };
el.search.oninput = () => { state.filter = el.search.value; renderTree(); };
el.preview.addEventListener("click", e => {
  const a = e.target.closest("a[data-wiki]");
  if (a) { e.preventDefault(); followWiki(a.dataset.wiki); }
});
el.title.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); focusEl(el.body); } });
el.body.addEventListener("keydown", e => {
  if (e.key === "Tab") { // insert two spaces
    e.preventDefault();
    const { selectionStart: s, selectionEnd: en, value } = el.body;
    el.body.value = value.slice(0, s) + "  " + value.slice(en);
    el.body.selectionStart = el.body.selectionEnd = s + 2;
    el.body.dispatchEvent(new Event("input"));
  }
});
el.search.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); focusEl(el.tree.querySelector(".note-item")); }
});
el.tree.addEventListener("keydown", e => {
  const items = [...el.tree.querySelectorAll(".note-item")];
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); focusEl(items[Math.min(i + 1, items.length - 1)]); }
  if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); if (i <= 0) focusEl(el.search); else focusEl(items[i - 1]); }
});

document.addEventListener("keydown", e => {
  const mod = e.ctrlKey || e.metaKey;
  const inText = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (mod && e.key.toLowerCase() === "n") { e.preventDefault(); createNote(); }
  else if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); openPalette(e.shiftKey ? ">" : ""); }
  else if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); focusEl(el.search); el.search.select(); }
  else if (mod && e.key.toLowerCase() === "e" && e.shiftKey) { e.preventDefault(); openExport(); }
  else if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); cycleView(); }
  else if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); persist(); pushAllDirty(); }
  else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); deleteActive(); }
  else if (e.key === "Escape") {
    if (el.palette.open) el.palette.close();
    else if (drawer.isOpen()) { e.preventDefault(); drawer.close(); }
    else if (inText && document.activeElement !== el.search) { focusEl(el.search); }
  }
  else if (e.key === "/" && !inText) { e.preventDefault(); focusEl(el.search); }
});

window.addEventListener("beforeunload", () => persist());
const syncNet = () => document.body.classList.toggle("offline", !navigator.onLine);
syncNet();
window.addEventListener("online", () => { syncNet(); pushAllDirty(); });
window.addEventListener("offline", () => { syncNet(); setSync("offline", "err"); });

// ---------- keyboard-proof app box + visual-viewport pin ----------
// dvh ignores the software keyboard: when the caret would sit under it, iOS
// pans the visual viewport (the tap-shift + "second layout level" feel).
// Sizing the app grid to the real visible box (visualViewport.height) keeps
// the caret above the keyboard so there is nothing to pan. Mobile-only; the
// CSS fallback stays 100dvh. Pairs with fitPalette (same mechanism).
function fitViewport() {
  if (!narrow.matches) { document.documentElement.style.removeProperty("--app-h"); return; }
  const vv = window.visualViewport;
  document.documentElement.style.setProperty("--app-h", (vv ? vv.height : window.innerHeight) + "px");
}
// H3: fitViewport sizes to vv.height but iOS can leave the visual viewport
// PANNED (offsetTop > 0) after the keyboard opens/closes. Since the grid is
// anchored at layout-top (y=0) but the visible box is shifted down, the header
// slides above the box, the last list row hides in the offset region below it
// ("scrolls only once the header is gone" / last element unreachable), and on
// dismiss a dark band (layout-viewport bg) shows under the app. The grid is
// already sized to the visible box, so RE-PINNING that box to the layout top
// is always the correct resolution — one line clears symptoms 3 and 4b.
function pinViewport() {
  const vv = window.visualViewport;
  if (vv && vv.offsetTop > 0) window.scrollTo(0, 0);
}
// One settle point (D6): re-pin the visual viewport, size the app box to the
// visible height, then re-fit the palette — the palette must read a settled
// offsetTop, so pin always runs first.
function onViewport() {
  pinViewport();
  fitViewport();
  fitPalette();
}
window.visualViewport?.addEventListener("resize", onViewport);
window.visualViewport?.addEventListener("scroll", onViewport);
narrow.addEventListener?.("change", onViewport);

// ---------- boot ----------
switchUser(null);
el.sort.value = state.sort;
onViewport();
// Narrow viewports hide the shortcut cheat-sheet, so the search placeholder
// shouldn't advertise keyboard shortcuts there either (Decision Log).
const setSearchPlaceholder = () =>
  el.search.placeholder = narrow.matches ? "Search" : "Search (Ctrl+K)  ·  Palette (Ctrl+P)";
setSearchPlaceholder();
narrow.addEventListener?.("change", setSearchPlaceholder);
if (!configured) setSync("local only — set js/config.js", "err");
watchAuth(user => switchUser(user));
```

### `quicknotes/js/drawer.js`

```js
export function initDrawer({ drawer, backdrop, edge, toggle, main, mq = "(max-width: 760px)" }) {
  const media = matchMedia(mq);
  let opened = false, lastFocus = null, drag = null;
  const width = () => drawer.getBoundingClientRect().width;

  function set(open) {
    opened = open && media.matches;
    drawer.classList.toggle("open", opened);
    backdrop.classList.toggle("show", opened);
    drawer.classList.remove("dragging"); backdrop.classList.remove("dragging");
    drawer.style.transform = ""; backdrop.style.opacity = "";
    toggle.setAttribute("aria-expanded", String(opened));
    main?.toggleAttribute("inert", opened);
    document.body.classList.toggle("drawer-lock", opened);
    if (opened) {
      lastFocus = document.activeElement;
      (drawer.querySelector("a,button,input,[tabindex]:not([tabindex=\"-1\"])") ?? drawer).focus({ preventScroll: true });
    } else if (lastFocus && media.matches) { lastFocus.focus?.({ preventScroll: true }); lastFocus = null; }
  }
  const open = () => set(true), close = () => set(false), toggleFn = () => set(!opened);

  toggle.addEventListener("click", toggleFn);
  backdrop.addEventListener("click", close);
  media.addEventListener("change", () => set(false));

  /* swipe: edge-open, drawer/backdrop-close */
  const onDown = e => {
    if (!media.matches || e.pointerType === "mouse") return;
    const from = opened ? (drawer.contains(e.target) || e.target === backdrop) : e.target === edge;
    if (!from) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dir: null };
  };
  const onMove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.dir) { if (Math.hypot(dx, dy) < 8) return; drag.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v"; }
    if (drag.dir !== "h") return;
    e.preventDefault();
    const w = width();
    const x = opened ? Math.min(0, dx) : Math.min(0, dx - w);
    drawer.classList.add("dragging"); backdrop.classList.add("dragging", "show");
    drawer.style.transform = `translateX(${x}px)`;
    backdrop.style.opacity = String(1 + x / w);
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.dir !== "h") return set(opened);
    const dx = e.clientX - d.x, v = dx / Math.max(1, performance.now() - d.t), w = width();
    set(opened ? !(dx < -w / 3 || v < -0.5) : (dx > w / 3 || v > 0.5));
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", () => { drag = null; set(opened); });

  return { open, close, toggle: toggleFn, get isOpen() { return opened; } };
}
```

## 7. Output contract

- Reply with **complete files only for the files you changed**, each in one fenced code block headed by its exact relative path (`quicknotes/…` or `portfolio/shell/…`). Unchanged files: send nothing.
- Expected changed set: `quicknotes/css/style.css`, `quicknotes/js/app.js`, `quicknotes/index.html` (only if ids/classes change — prefer keeping it unchanged), `portfolio/projects/quicknotes/web/QuicknotesPage.tsx`, `portfolio/shell/src/styles.css`.
- **≤ ~1300 lines total.** No prose beyond one-line notes per file (what changed and why, one line each).
- If you decide a JS-measured `--qn-topbar` is unnecessary and a pure-CSS `:has()` fix suffices, say so in the one-line note and skip the TSX change.
- Keep every behavior in §4 working; the drawer, its drag-close, and the palette keyboard-fit are load-bearing — do not simplify them away.

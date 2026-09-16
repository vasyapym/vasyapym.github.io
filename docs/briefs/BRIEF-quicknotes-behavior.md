# Task brief — Quicknotes: mobile drawer, folder operations, sign-in fallback

You have **no repository access, no tools, no prior conversation** — everything you need is below. You own every design and code choice in this task: do not ask for approval, do not offer option lists — deliberate, decide, and ship one coherent answer. The fixed points are §3 and the verbatim current code in §5; everything else is yours.

## 1. Context

A single-owner, static, no-build note app (plain HTML + CSS + ES modules, Firebase v10.12.2 via gstatic CDN, Firestore persistent cache + multi-tab manager, localStorage as the local-first layer, last-write-wins sync, soft deletes). It already works: Google sign-in, markdown editor with live preview, virtual folders derived from a `path` field on each note, zip export, command palette, instant search, keyboard shortcuts, offline art states. Full current code is pasted verbatim in §5 — build on it exactly; it includes integration fixes you have never seen (Firestore offline persistence, a sync race fix via `updatedAt` stamp, path-input normalization on change/blur, empty-tree state, offline art toggle).

## 2. The owner's asks (then the working interpretation)

1. *"Mobile drawer"* — at ≤760px the sidebar (`#sidebar`) is currently `display:none`: on a phone there is no way to navigate folders at all. Make it a slide-in drawer: a toggle button in the header, backdrop click and `Esc` close it, tapping a note or running a folder action closes it. Desktop layout unchanged.
2. *"Folder operations"* — folders are derived from note `path` values, so today you can only edit the path text field of the active note. Add per-folder actions in the sidebar tree: **rename folder** (cascades: rewrites the path prefix of every note in that subtree, normal client-side bulk update — each rewritten note goes through the normal dirty/`schedulePush` flow), **move folder** under another existing parent (same cascade, prompt for the new parent), **delete folder** (moves its notes to the root, with confirm). A folder with zero notes simply doesn't exist in the derived model — do not invent empty-folder persistence; say so in one line if you considered it.
3. *"Sign-in fallback"* — `signInWithPopup` can be blocked (notably iOS Safari). In `js/firebase.js`: catch popup-specific error codes and fall back to `signInWithRedirect` + `getRedirectResult` at boot; keep the current popup flow as the default path; surface a clear status for `auth/operation-not-supported-in-this-environment`.
4. Everything already working must keep working — see §3.

## 3. Fixed points (do not break or redesign)

- Static no-build app; ES modules; relative paths; no new dependencies, no CDN additions, no framework.
- CSS design tokens unchanged (§5 verbatim); art SVGs (brand, empty states, offline toggle, empty-tree folder motif) unchanged.
- Storage contract: note fields exactly `id,title,path,body,createdAt,updatedAt,deleted` (plus client-only `_dirty`); soft delete via `deleted:true`; `updatedAt` = `Date.now()` client stamp; `_dirty` cleared only when no edit happened during the push round-trip (keep the stamp check).
- `normPath` (split/trim/filter/join) is the single path normalizer; folder paths are `/`-separated, no leading/trailing slashes.
- Do not touch: `js/markdown.js`, `js/zip.js`, `js/config.js`, `firestore.rules`, `README.md`.
- Keyboard map, palette, zip export, search behavior stay as they are (adding new palette commands is fine).

## 4. Acceptance criteria (observable)

1. ≤760px: hamburger in header opens the drawer over the content with a dimmed backdrop; clicking a note closes it; backdrop click / `Esc` close it; ≥761px: identical to today.
2. Sidebar tree: each folder row offers rename / move / delete; rename of `a/b` rewrites every descendant note's path prefix atomically in one pass, updates local persistence, and schedules pushes; notes keep their `updatedAt` bump; no duplicate or orphaned paths; root (`(root)`) has no rename affordance.
3. Folder delete moves its notes to root after a confirm; no data loss.
4. Popup-blocked sign-in falls back to redirect and lands signed-in; redirect result is consumed at boot; existing popup flow unchanged when not blocked.
5. All previous behaviors intact: create/edit/delete note, live preview, search filter, palette (notes + `>` commands), zip export (all/folder), offline queueing via dirty flags, offline art swap, empty states.

## 5. Current state verbatim (the only source of truth)

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>notes</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 64 64%22%3E%3Crect width%3D%2264%22 height%3D%2264%22 rx%3D%227%22 fill%3D%22%2316161e%22%2F%3E%3Crect x%3D%22.5%22 y%3D%22.5%22 width%3D%2263%22 height%3D%2263%22 rx%3D%226.5%22 fill%3D%22none%22 stroke%3D%22%231f2335%22%2F%3E%3Cg fill%3D%22none%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpath d%3D%22M18 18h29v19L36 48H18Z%22 stroke%3D%22%233b4261%22 stroke-width%3D%221.25%22%2F%3E%3Cpath d%3D%22M47 37H36v11%22 stroke%3D%22%237aa2f7%22 stroke-width%3D%221.5%22%2F%3E%3Cpath d%3D%22M13 21v-8h8%22 stroke%3D%22%237aa2f7%22 stroke-width%3D%221.5%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<header id="top">
  <span class="brand">
    <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 18h29v19L36 48H18Z" fill="none" stroke="#3b4261" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M47 37H36v11" fill="none" stroke="#7aa2f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 21v-8h8" fill="none" stroke="#7aa2f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>notes</span>
  <input id="search" type="search" placeholder="Search (Ctrl+K)  ·  Palette (Ctrl+P)" autocomplete="off">
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
        <input id="title" placeholder="Title" autocomplete="off" spellcheck="false">
        <input id="path" placeholder="folder/subfolder" autocomplete="off" spellcheck="false" title="Virtual folder path">
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
  <span><kbd>Ctrl+N</kbd> new · <kbd>Ctrl+P</kbd> palette · <kbd>Ctrl+E</kbd> view · <kbd>Ctrl+S</kbd> sync · <kbd>Ctrl+D</kbd> delete · <kbd>Esc</kbd> back</span>
  <span id="count"></span>
</footer>

<dialog id="palette">
  <input id="pal-input" placeholder="Type to open a note, or > for commands" autocomplete="off">
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
</body>
</html>
```

### `css/style.css`

```css
:root{
  --bg:#0f1115;--bg2:#161920;--bg3:#1e222b;--fg:#d7dae0;--fg2:#8b919c;
  --acc:#7aa2f7;--danger:#f7768e;--ok:#9ece6a;--warn:#e0af68;--border:#2a2f3a;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --sans:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 var(--sans)}
button,input,select,textarea{font:inherit;color:inherit}
kbd{font:11px var(--mono);background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:0 4px}
a{color:var(--acc)}
[hidden]{display:none!important}

body{display:grid;grid-template-rows:auto 1fr auto;height:100vh}
#top{display:flex;align-items:center;gap:10px;padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;letter-spacing:.5px;color:var(--acc)}
.brand-mark{width:20px;height:20px}

.empty{margin:auto;color:var(--fg2);display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.empty .art{width:180px;height:180px;opacity:.9}
.empty .art-offline{display:none;width:140px;height:140px}
body.offline .empty .art-scratch{display:none}
body.offline .empty .art-offline{display:block}
#search{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 10px;outline:none}
#search:focus{border-color:var(--acc)}
.sync{font:12px var(--mono);color:var(--fg2)}
.sync.ok{color:var(--ok)}.sync.busy{color:var(--warn)}.sync.err{color:var(--danger)}
#user{font-size:12px;color:var(--fg2)}
#user img{width:22px;height:22px;border-radius:50%;vertical-align:middle;margin-right:6px}

.btn{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:5px 10px;cursor:pointer}
.btn:hover{border-color:var(--acc)}
.btn.primary{background:var(--acc);color:#0b0d12;border-color:var(--acc)}
.btn.danger:hover{border-color:var(--danger);color:var(--danger)}

#layout{display:grid;grid-template-columns:260px 1fr;min-height:0}
#sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0}
.side-head{display:flex;gap:6px;padding:8px}
.side-head .btn{flex:1}
#tree{overflow:auto;padding:0 4px 8px}
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
#body{resize:none;border:0;outline:none;background:var(--bg);padding:16px;font:14px/1.6 var(--mono);border-right:1px solid var(--border)}
.preview{overflow:auto;padding:16px 24px}
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
#pal-list{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}
#pal-list li{padding:6px 10px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between}
#pal-list li.sel{background:var(--bg3);color:var(--acc)}
#pal-list li small{color:var(--fg2);font-family:var(--mono)}
#export-dlg form{padding:16px}
#export-dlg label{display:flex;flex-direction:column;gap:6px;margin:12px 0}
#export-dlg select{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px}
#export-dlg menu{display:flex;justify-content:flex-end;gap:8px;margin:0;padding:0}

@media (max-width:760px){
  #layout{grid-template-columns:1fr}
  #sidebar{display:none}
  .panes.split{grid-template-columns:1fr}
  .panes.split #preview{display:none}
}
```

### `js/firebase.js`

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

export const configured = !/YOUR_/.test(JSON.stringify(firebaseConfig));

let auth = null, db = null;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Persistent IndexedDB cache: reads serve from disk when offline, writes queue
  // until connectivity returns; multi-tab manager keeps all tabs on one cache.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  // Session survives reload/tab close.
  setPersistence(auth, browserLocalPersistence).catch(console.warn);
}

export function watchAuth(cb) {
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

export async function login() {
  if (!auth) { alert("Firebase not configured — edit js/config.js"); return; }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export function logout() { return auth ? signOut(auth) : Promise.resolve(); }

const notesCol = uid => collection(db, "users", uid, "notes");

/** Subscribe to remote notes; cb receives array of note objects. */
export function watchNotes(uid, cb, onErr) {
  if (!db) return () => {};
  return onSnapshot(notesCol(uid), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onErr);
}

/** Upsert a note (soft deletes are notes with deleted:true). */
export function pushNote(uid, note) {
  if (!db) return Promise.resolve();
  const { _dirty, ...clean } = note;
  return setDoc(doc(notesCol(uid), note.id), clean);
}
```

### `js/store.js`

```js
// Local-first storage: everything lives in localStorage keyed by uid ("local" when signed out).
const KEY = uid => `notes:${uid}`;

export function loadLocal(uid) {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || "{}"); }
  catch { return {}; }
}

export function saveLocal(uid, notes) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(notes)); }
  catch (e) { console.warn("localStorage full?", e); }
}

export function newId() {
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

export function makeNote(partial = {}) {
  const now = Date.now();
  return {
    id: newId(), title: "", path: "", body: "",
    createdAt: now, updatedAt: now, deleted: false, _dirty: true, ...partial
  };
}

/** Merge remote into local (last-write-wins). Returns {notes, changed}. */
export function mergeRemote(local, remote) {
  let changed = false;
  const out = { ...local };
  for (const r of remote) {
    const l = out[r.id];
    if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) {
      out[r.id] = { ...r, _dirty: false };
      changed = true;
    } else if (l && !l._dirty && (r.updatedAt || 0) === (l.updatedAt || 0)) {
      // in sync, nothing to do
    }
  }
  return { notes: out, changed };
}

/** Normalize a path: "a//b/ " -> "a/b" */
export function normPath(p) {
  return (p || "").split("/").map(s => s.trim()).filter(Boolean).join("/");
}

/** Safe filename for export. */
export function safeName(s, fallback = "untitled") {
  const n = (s || "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
  return n || fallback;
}
```

### `js/app.js`

```js
import { configured, watchAuth, login, logout, watchNotes, pushNote } from "./firebase.js";
import { loadLocal, saveLocal, makeNote, mergeRemote, normPath, safeName } from "./store.js";
import { render } from "./markdown.js";
import { makeZip, download } from "./zip.js";

const $ = s => document.querySelector(s);
const el = {
  search: $("#search"), sync: $("#sync"), user: $("#user"), authBtn: $("#auth-btn"),
  newBtn: $("#new-btn"), exportBtn: $("#export-btn"), tree: $("#tree"),
  empty: $("#empty"), editor: $("#editor"), title: $("#title"), path: $("#path"),
  delBtn: $("#delete-btn"), panes: $("#panes"), body: $("#body"), preview: $("#preview"),
  count: $("#count"), palette: $("#palette"), palInput: $("#pal-input"), palList: $("#pal-list"),
  exportDlg: $("#export-dlg"), exportScope: $("#export-scope")
};

const VIEWS = new Set(["edit", "split", "view"]);
const savedView = localStorage.getItem("view");
const state = {
  uid: "local", user: null, notes: {}, activeId: null, filter: "",
  view: VIEWS.has(savedView) ? savedView : "split", unsubNotes: null, openFolders: new Set()
};

// ---------- helpers ----------
const live = () => Object.values(state.notes).filter(n => !n.deleted);
const active = () => state.notes[state.activeId] || null;
const byTitle = t => live().find(n => n.title.trim().toLowerCase() === t.trim().toLowerCase());
const setSync = (txt, cls = "") => { el.sync.textContent = txt; el.sync.className = "sync " + cls; };
const persist = () => saveLocal(state.uid, state.notes);

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
    .sort((a, b) => b.updatedAt - a.updatedAt);
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
    d.open = q ? true : !state.openFolders.has("closed:" + p);
    d.addEventListener("toggle", () => d.open ? state.openFolders.delete("closed:" + p) : state.openFolders.add("closed:" + p));
    const s = document.createElement("summary"); s.textContent = p || "(root)"; d.appendChild(s);
    for (const n of groups.get(p)) {
      const b = document.createElement("button");
      b.className = "note-item" + (n.id === state.activeId ? " active" : "");
      b.dataset.id = n.id;
      b.innerHTML = (n._dirty && state.user ? '<span class="dirty">● </span>' : "") + escapeHtml(n.title || "Untitled");
      b.onclick = () => openNote(n.id);
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
}
function renderPreview() {
  const n = active(); if (!n) return;
  el.preview.innerHTML = render(n.body, { exists: t => !!byTitle(t) });
}
function renderAll() { renderTree(); renderEditor(); }

// ---------- note ops ----------
function openNote(id) {
  state.activeId = id; renderAll();
  if (state.view === "view") el.preview.focus(); else el.body.focus();
}
function createNote(partial = {}) {
  const cur = active();
  const n = makeNote({ path: cur ? cur.path : "", ...partial });
  state.notes[n.id] = n; persist(); schedulePush(n.id);
  openNote(n.id); el.title.focus();
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
  state.activeId = null; renderAll(); el.search.focus();
}
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
  el.palInput.value = prefix; el.palette.showModal(); el.palInput.focus(); renderPalette();
}
function renderPalette() {
  const q = el.palInput.value;
  if (q.startsWith(">")) {
    const t = q.slice(1).trim().toLowerCase();
    palItems = commands.filter(c => c.label.toLowerCase().includes(t)).map(c => ({ label: c.label, hint: "cmd", run: c.run }));
  } else {
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

// ---------- view ----------
function cycleView() {
  state.view = { edit: "split", split: "view", view: "edit" }[state.view];
  localStorage.setItem("view", state.view); renderEditor();
}

// ---------- events ----------
el.authBtn.onclick = () => state.user ? logout() : login().catch(e => alert(e.message));
el.newBtn.onclick = () => createNote();
el.exportBtn.onclick = openExport;
el.delBtn.onclick = deleteActive;
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
el.title.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.body.focus(); } });
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
  if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); el.tree.querySelector(".note-item")?.focus(); }
});
el.tree.addEventListener("keydown", e => {
  const items = [...el.tree.querySelectorAll(".note-item")];
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); items[Math.min(i + 1, items.length - 1)]?.focus(); }
  if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); if (i <= 0) el.search.focus(); else items[i - 1].focus(); }
});

document.addEventListener("keydown", e => {
  const mod = e.ctrlKey || e.metaKey;
  const inText = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (mod && e.key.toLowerCase() === "n") { e.preventDefault(); createNote(); }
  else if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); openPalette(e.shiftKey ? ">" : ""); }
  else if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); el.search.focus(); el.search.select(); }
  else if (mod && e.key.toLowerCase() === "e" && e.shiftKey) { e.preventDefault(); openExport(); }
  else if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); cycleView(); }
  else if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); persist(); pushAllDirty(); }
  else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); deleteActive(); }
  else if (e.key === "Escape") {
    if (el.palette.open) el.palette.close();
    else if (inText && document.activeElement !== el.search) { el.search.focus(); }
  }
  else if (e.key === "/" && !inText) { e.preventDefault(); el.search.focus(); }
});

window.addEventListener("beforeunload", () => persist());
const syncNet = () => document.body.classList.toggle("offline", !navigator.onLine);
syncNet();
window.addEventListener("online", () => { syncNet(); pushAllDirty(); });
window.addEventListener("offline", () => { syncNet(); setSync("offline", "err"); });

// ---------- boot ----------
switchUser(null);
if (!configured) setSync("local only — set js/config.js", "err");
watchAuth(user => switchUser(user));
```

## 6. Output contract

- Reply with **complete files only for the files you changed** (likely `index.html`, `css/style.css`, `js/firebase.js`, `js/app.js` — anything you change, send whole), each in one fenced code block headed by its exact relative path. Unchanged files: send nothing.
- **≤ ~1100 lines total.** No prose beyond one-line notes per file (what changed and why, one line each).
- Keep every existing behavior listed in §3 working; add palette commands where a new action needs a home.

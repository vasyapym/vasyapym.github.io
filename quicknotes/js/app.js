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
  delBtn: $("#delete-btn"), viewToggle: $("#view-toggle"), copyBtn: $("#copy-btn"),
  panes: $("#panes"), body: $("#body"), preview: $("#preview"),
  count: $("#count"), palette: $("#palette"), palInput: $("#pal-input"), palList: $("#pal-list"),
  exportDlg: $("#export-dlg"), exportScope: $("#export-scope"),
  hamburger: $("#drawer-toggle"), backdrop: $("#backdrop"), edge: $("#drawer-edge"), main: $("#main"),
  top: $("#top"), status: $("#status")
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
  el.panes.className = "panes " + state.view;
  // N021: pane class FIRST, then render — the gated renderPreview skips a
  // hidden pane, so it must run AFTER the toggle has made it visible.
  renderPreview();
  // Plain text labels — eye/pencil emoji removed (Decision Log).
  el.viewToggle.textContent = state.view === "view" ? "Edit" : "Preview";
}
// N021 (S3): the preview pane is display:none in mobile edit mode — a full
// markdown innerHTML rebuild per keystroke there is pure waste (paste stall).
const previewVisible = () => el.preview.offsetParent !== null;
let previewQueued = false;
function schedulePreview() {
  if (previewQueued || !previewVisible()) return; // never queue work for a hidden pane
  previewQueued = true;
  requestAnimationFrame(() => { previewQueued = false; renderPreview(); });
}
function renderPreview() {
  if (!previewVisible()) return; // full-markdown rebuild only when shown
  const n = active(); if (!n) return;
  el.preview.innerHTML = render(n.body, { exists: t => !!byTitle(t) });
}
function renderAll() { renderTree(); renderEditor(); }

// ---------- note ops ----------
function openNote(id) {
  state.activeId = id; renderAll();
  if (state.view === "view") focusEl(el.preview);
  else {
    // N022: deterministic caret — engines differ on programmatic-focus caret
    // (Chromium: END → the old "page pans on note-open" / new: auto-scroll to
    // bottom). Opening a note must land at its START with a calm keyboard.
    el.body.selectionStart = el.body.selectionEnd = 0;
    focusEl(el.body);
  }
}
function createNote(partial = {}) {
  const cur = active();
  const n = makeNote({ path: cur ? cur.path : "", ...partial });
  state.notes[n.id] = n; persist(); schedulePush(n.id);
  openNote(n.id); focusEl(el.title);
  return n;
}
// N021 (S3): persist used to run synchronously on EVERY keystroke (a paste
// stalls the main thread on a whole-store localStorage write). It is now
// debounced 300ms off the keystroke path and flushed on blur / hide.
let persistTimer = 0;
function schedulePersist() { clearTimeout(persistTimer); persistTimer = setTimeout(flushPersist, 300); }
function flushPersist() {
  clearTimeout(persistTimer); persistTimer = 0;
  persist(); // synchronous full-notes localStorage write, now OFF the keystroke path
}
addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushPersist(); });
addEventListener("pagehide", flushPersist);

function updateActive(patch) {
  const n = active(); if (!n) return;
  Object.assign(n, patch, { updatedAt: Date.now(), _dirty: true });
  schedulePersist();  // was: persist() synchronously every keystroke
  schedulePush(n.id); // Firebase push already debounced at 800ms (unchanged)
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
// N021: offsetTop is no longer forced to 0 by any pin — the layout viewport is
// stable (resizes-visual), so the `top` term below reads the live offsetTop
// (≈0 in the plain-website model) via the shared onVV → readViewport path.
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
// (visualViewport re-fit is driven by the single onVV() handler in the
// plain-website keyboard section, which calls fitPalette last.)

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

// ---------- copy note content ----------
// Copies the active note's markdown body (the .md file content). The button
// flashes "Copied ✓" for a beat; the execCommand fallback covers non-secure
// contexts (plain http) where navigator.clipboard is unavailable.
let copyTimer = 0;
async function copyActive() {
  const n = active(); if (!n) return;
  let ok = false;
  try {
    await navigator.clipboard.writeText(n.body);
    ok = true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = n.body;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    focusEl(ta); ta.select();
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
  }
  el.copyBtn.textContent = ok ? "Copied ✓" : "Copy failed";
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { el.copyBtn.textContent = "Copy"; }, 1200);
}

// ---------- events ----------
el.authBtn.onclick = () => state.user ? logout() : login().catch(e => alert(e.message));
el.newBtn.onclick = () => createNote();
el.exportBtn.onclick = openExport;
el.delBtn.onclick = deleteActive;
el.viewToggle.onclick = toggleMobileView;
el.copyBtn.onclick = copyActive;
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
el.body.oninput = () => { updateActive({ body: el.body.value }); schedulePreview(); };
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

// ================= N021: plain-website keyboard model =================
// No body resize, no vv pin, no body translate, no settle loop. The layout
// viewport is STABLE (viewport meta interactive-widget=resizes-visual); the
// keyboard just OVERLAPS the page. The <textarea> is the only internal
// scroller; while a field is focused we give the body keyboard-height bottom
// padding (--kb-h), so iOS reveals the caret by scrolling the TEXTAREA —
// offsetTop stays 0 and header/footer never move. Dismiss = padding off =
// exact return. Robust to unknown Safari resize timing: the padding only
// changes scroll range, never geometry; a focusin estimate covers a late or
// absent resize. Replaces the deleted N010–N020 fit/pin/align/settle/tuck
// cluster (five rounds of guards were the smell — the band was intrinsic to
// sizing layout from vv.height, which Safari reports at animation START).
// (narrow/focusEl are declared near the top of this file and reused here.)
const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;
const fieldFocused = () => FIELD.test(document.activeElement?.tagName || "");

// pointerDown kept: the header auto-hide logic below still consumes it.
let pointerDown = false;
addEventListener("pointerdown", () => { pointerDown = true; }, { passive: true });
addEventListener("pointerup", () => { pointerDown = false; }, { passive: true });
addEventListener("pointercancel", () => { pointerDown = false; }, { passive: true });

// N027: height sources. Under interactive-widget=resizes-visual the LAYOUT
// viewport is stable across keyboard show/hide; documentElement.clientHeight
// tracks it. window.innerHeight on this build follows the VISUAL viewport
// (shrinks with the keyboard — the N024 stale-gap mechanism) — never use it
// for geometry.
function layoutHeight() {
  return document.documentElement.clientHeight || window.innerHeight;
}

// ================= N030: viewport source unification =================
// In the same-origin card the keyboard is only visible on the TOP window's
// visualViewport — the iframe's own vv can stay silent (N028). Same-origin
// by design; try/catch future-proofs a cross-origin host.
function vvWin() {
  try { if (window.top !== window && window.top.visualViewport) return window.top; }
  catch (_) {}
  return window;
}
function currentKbHeight() {
  const w = vvWin(), vv = w.visualViewport;
  if (!vv) return 0;
  const lh = w.document.documentElement.clientHeight || w.innerHeight;
  // iframe bottom == page bottom (host: 100dvh column, iframe flex:1),
  // so the top-window keyboard delta IS the app's keyboard overlap.
  return Math.max(0, Math.round(lh - vv.height));
}
function setKbHeight(px) {
  document.documentElement.style.setProperty("--kb-h", (px || 0) + "px");
}

// ---- N030: remembered keyboard height (exact after the first ever open;
// keyed to layout height so rotation can't poison it) ----
const KB_KEY = "qn.kbmemo";
function rememberKb(kb) {
  if (kb < 120) return;
  try { localStorage.setItem(KB_KEY, JSON.stringify({ h: layoutHeight(), kb })); } catch (_) {}
}
function estimateKb() {
  const real = currentKbHeight();
  if (real > 120) return real;
  try {
    const m = JSON.parse(localStorage.getItem(KB_KEY) || "null");
    if (m && Math.abs(m.h - layoutHeight()) <= 2) return m.kb;
  } catch (_) {}
  return Math.round(layoutHeight() * 0.45); // first-ever tap: OVERestimate = caret never under the keyboard
}

// ---- N024: rigid container height ("make it just static" — Obsidian ask) ----
// Freeze while focused (no URL-bar micro-reflows mid-type); the keyboard-
// independent source means dismiss timing can no longer capture a shrunken
// value — the P1 dark-gap mechanism is gone.
function pinBodyHeight() {
  if (!narrow.matches) { document.documentElement.style.removeProperty("--app-v"); return; }
  if (fieldFocused()) return; // frozen mid-focus: the shell cannot flex while typing
  document.documentElement.style.setProperty("--app-v", layoutHeight() + "px");
}

// ---- N027/N031: touch-scroll gate — an external scrollTop write during iOS
// momentum cancels the momentum (the "rapid and chaotic" feel). revealCaret
// must never write scrollTop while the user is panning OR coasting. N031:
// the tail is a QUIET window, not the old fixed 400ms guess — a real iOS
// fling coasts longer than 400ms; every scroll event of the coast pushes the
// quiet timer, so the flag survives until the coast truly ends.
let userScrolling = false, scrollIdle = 0;
function beginUserScroll() { userScrolling = true; clearTimeout(scrollIdle); }
function endUserScroll() { clearTimeout(scrollIdle); scrollIdle = setTimeout(coastSettled, 140); }
// N031: after the coast settles, one deferred reveal re-aims a caret that
// moved (typed / loupe-dropped) while the coast was in progress.
function coastSettled() {
  userScrolling = false;
  if (narrow.matches && document.activeElement === el.body) revealCaret();
}
document.addEventListener("touchmove", beginUserScroll, { passive: true, capture: true });
document.addEventListener("touchend", endUserScroll, { passive: true, capture: true });
document.addEventListener("touchcancel", endUserScroll, { passive: true, capture: true });
el.body.addEventListener("scroll", () => { if (userScrolling) endUserScroll(); }, { passive: true });

// N025 (S2 closed by owner): the in-app Done bar is REMOVED — iOS always
// shows the standard keyboard accessory bar with Done on this device (owner
// verdict; the N021 "no Done" report did not reproduce). blur stays wired to
// the normal dismiss paths.

// ---- single rAF-throttled vv reader: NO page movement, only palette -------
let lastKb = 0;
function readViewport() {
  pinBodyHeight();
  if (narrow.matches && fieldFocused()) {
    const kb = currentKbHeight();
    rememberKb(kb); // N030: memo the real height for the next first-ever open
    setKbHeight(kb);
    // N027 (P2): one-shot re-aim only when the keyboard first lands (0 → up);
    // never per-frame, never during an active pan/momentum — a per-frame
    // revealCaret fought native scrolling (the chaotic feel).
    if (kb - lastKb > 80 && !userScrolling) revealCaret();
    lastKb = kb;
  } else {
    lastKb = 0;
  }
  fitPalette(); // keep: command-palette dialog placement
}
let vvQueued = false;
function onVV() {
  if (vvQueued) return;
  vvQueued = true;
  requestAnimationFrame(() => { vvQueued = false; readViewport(); });
}
window.visualViewport?.addEventListener("resize", onVV);
window.visualViewport?.addEventListener("scroll", onVV);
// N030: listen where the keyboard is actually reported — in the card that is
// the TOP window's visualViewport (the iframe's own vv can stay silent).
try {
  const tw = vvWin();
  if (tw !== window) {
    tw.visualViewport.addEventListener("resize", onVV);
    tw.visualViewport.addEventListener("scroll", onVV);
  }
} catch (_) {}
narrow.addEventListener?.("change", onVV);

// ---- N022: pre-reveal the caret INSIDE the textarea ----
// Device video verdict on N021: iOS still PANS the visual viewport for LOW
// taps (page slides up ~150px, the title row exits view) — its caret reveal
// runs on the caret's position regardless of the scroll room we added. The
// only way to leave iOS nothing to reveal is to put the caret above the
// keyboard zone BEFORE its animation completes: measure the caret's content
// Y with a style-mirror of the textarea, then tween the textarea's scrollTop
// so the caret bottom rests ~20px above the keyboard line. The --kb-h bottom
// padding guarantees the scroll range reaches that position. Only-scroll-down
// (never scroll back up), so high taps stay perfectly still (the asymmetry).
const caretMirror = document.createElement("div");
function caretContentY() {
  const ta = el.body, cs = getComputedStyle(ta), m = caretMirror;
  m.style.cssText = "position:absolute;visibility:hidden;top:0;left:0;z-index:-1;box-sizing:border-box;"
    + `width:${ta.clientWidth}px;padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};`
    + `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};`
    + `line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};white-space:pre-wrap;`
    + `overflow-wrap:${cs.overflowWrap};word-break:${cs.wordBreak};tab-size:${cs.tabSize}`;
  m.textContent = ta.value.slice(0, ta.selectionStart ?? ta.value.length);
  const dot = document.createElement("span");
  dot.textContent = "\u200b"; // zero-width: keeps an empty last line measurable
  m.appendChild(dot);
  if (!m.parentNode) document.body.appendChild(m);
  return dot.offsetTop + dot.offsetHeight; // caret BOTTOM in content coords
}
let tweenRaf = 0;
function tweenScrollTo(elm, to) {
  cancelAnimationFrame(tweenRaf);
  const from = elm.scrollTop, dist = to - from, t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / 200), e = 1 - (1 - p) ** 3;
    elm.scrollTop = from + dist * e;
    if (p < 1) tweenRaf = requestAnimationFrame(step);
  };
  tweenRaf = requestAnimationFrame(step);
}
// ---- N031: gated caret room (relay-salvaged policy on our machinery) ----
// Default ON. ?noscroll=1 reverts to the legacy always-void focus padding
// (?noscroll=0 re-enables) — the off state is exactly the N030-approved
// behavior, implemented with the SAME CSS pair (legacy = room always armed).
{
  const q = new URLSearchParams(location.search);
  if (q.has("noscroll")) {
    try { localStorage.setItem("qn.noscroll", q.get("noscroll") === "0" ? "" : "1"); } catch (_) {}
  }
}
const roomGated = () => {
  try { return localStorage.getItem("qn.noscroll") !== "1"; }
  catch (_) { return true; }
};

// Shared target math for BOTH reveal paths (instant pipeline + tweened).
// The room is armed only when the desired position exceeds the NORMAL extent
// (the void appears exactly when the caret needs it); arming never clamps
// (the extent only grows) and de-arming happens only when the resting
// scrollTop survives it (no visible jump).
function caretScrollTarget(kb) {
  const ta = el.body;
  const visible = ta.clientHeight - kb;
  if (visible <= 0) return null;
  const desired = Math.round(caretContentY() - visible + 20);
  const room = ta.classList.contains("caret-room");
  let needs = true, normalMax = Infinity; // Infinity: de-arm guard can't block when legacy
  if (roomGated()) {
    normalMax = Math.max(0, ta.scrollHeight - (room ? kb : 0) - ta.clientHeight);
    needs = desired > normalMax + 1;
  }
  if (needs !== room && (needs || ta.scrollTop <= normalMax))
    ta.classList.toggle("caret-room", needs); // de-arm only without a clamp
  const max = Math.max(0, ta.scrollHeight - ta.clientHeight); // re-reads the (maybe) armed extent
  return { to: Math.max(0, Math.min(desired, max)) };
}
function revealCaret() {
  if (!narrow.matches || document.activeElement !== el.body) return;
  const ta = el.body;
  const kb = currentKbHeight() || estimateKb();
  const target = caretScrollTarget(kb);
  if (!target) return;
  if (target.to > ta.scrollTop + 2) tweenScrollTo(ta, target.to); // only-scroll-down: high taps no-op
}
let caretQueued = false;
document.addEventListener("selectionchange", () => {
  if (document.activeElement !== el.body) return;
  if (userScrolling) return; // N027: never fight native scroll / momentum
  if (caretQueued) return;
  caretQueued = true;
  requestAnimationFrame(() => {
    caretQueued = false;
    if (!userScrolling) revealCaret();
  });
});

// ================= N030: pre-focus tap pipeline for #body =================
// N022/N024 evidence: iOS computes the tap-point reveal AT TAP TIME and it
// cannot be cancelled afterwards (adding scroll room and post-tap pre-reveal
// both failed on device). So for clean single taps we never let iOS compute
// it: preventDefault the touchend (no native focus → no queued reveal),
// place the caret ourselves, scroll the TEXTAREA so the caret already sits
// ~20px above the keyboard line, then focus({preventScroll:true})
// synchronously inside the gesture so the keyboard still opens. Nothing is
// left to reveal — in BOTH contexts, because the caret is above the keyboard
// in absolute screen coordinates too (the iframe bottom == the page bottom).
// Kill switch: ?notap=1 disables (persisted), ?notap=0 re-enables — the
// disabled state is exactly the N027 shipped behavior.
{
  const q = new URLSearchParams(location.search);
  if (q.has("notap")) {
    try { localStorage.setItem("qn.notap", q.get("notap") === "0" ? "" : "1"); } catch (_) {}
  }
}
const interceptOn = () => {
  try { return narrow.matches && localStorage.getItem("qn.notap") !== "1"; }
  catch (_) { return narrow.matches; }
};

// ================= N032: geometric tap→caret resolver =================
// Device verdict on the old mapping (overlay mirror + caretRangeFromPoint):
// on iOS Safari the returned range is evidently never inside the mirror (the
// hit-tester resolves the textarea underneath / skips the non-hittable
// overlay), so the fallback fired on EVERY tap → caret at value.length → the
// view jumped to the note end. The fix drops hit-testing entirely:
// Range.getClientRects() works on visibility:hidden content (layout exists,
// paint doesn't), so a per-character binary search over the synced mirror
// gives true closestPosition(toPoint:) semantics — explicit MISS (−1) instead
// of whatever the hit-tester feels like. Never depends on the mirror being
// paintable or hit-testable.
function charRectAt(node, i) { // rect of character i (widest of split rects at wraps)
  const rng = document.createRange();
  rng.setStart(node, i); rng.setEnd(node, i + 1);
  const rs = rng.getClientRects();
  if (!rs.length) return rng.getBoundingClientRect();
  let best = rs[0];
  for (const r of rs) if (r.width > best.width) best = r;
  if (best.width === 0 && rs.length > 1) best = rs[rs.length - 1];
  return best;
}
// closestPosition(toPoint:) over the mirror's laid-out text. Returns the
// insertion index, or −1 on MISS (tap outside the text band → caller must
// NOT move the caret — the fail-safe that replaces the end-of-text fallback).
function resolveCaretIndex(m, value, x, y, slop) {
  const node = m.firstChild;
  const n = node.data.length;
  const realLen = value.length;
  if (realLen === 0) return 0;
  const rF = charRectAt(node, 0), rL = charRectAt(node, n - 1);
  if (y < rF.top - slop || y > rL.bottom + slop) return -1; // MISS: caret stays
  // 1) any char on the target visual line: first i with bottom >= y
  let lo = 0, hi = n - 1;
  while (lo < hi) { const md = (lo + hi) >> 1;
    if (charRectAt(node, md).bottom < y) lo = md + 1; else hi = md; }
  const anch = charRectAt(node, lo);
  const mid = (anch.top + anch.bottom) / 2;
  // 2) line start a: first i with bottom > mid
  let l = 0, h = lo;
  while (l < h) { const md = (l + h) >> 1;
    if (charRectAt(node, md).bottom <= mid) l = md + 1; else h = md; }
  const a = l;
  // 3) line end b: last i with top < mid
  l = lo; h = n - 1;
  while (l < h) { const md = (l + h + 1) >> 1;
    if (charRectAt(node, md).top >= mid) h = md - 1; else l = md; }
  const b = l;
  // 4) nearest caret boundary in [a, b+1] by x (LTR-monotonic)
  const bx = j => j <= b ? charRectAt(node, j).left : charRectAt(node, b).right;
  l = a; h = b + 1;
  while (l < h) { const md = (l + h) >> 1;
    if (bx(md) < x) l = md + 1; else h = md; }
  let idx = (l === a) ? a
          : (l > b + 1 || bx(l) - x > x - bx(l - 1)) ? l - 1 : l;
  if (idx === b + 1 && b < realLen && value[b] === "\n") idx = b; // stay before hard \n
  return Math.min(idx, realLen); // strips the sentinel
}
function caretIndexFromPoint(clientX, clientY) {
  const ta = el.body, cs = getComputedStyle(ta), m = caretMirror;
  m.style.cssText = "position:absolute;visibility:hidden;top:0;left:0;z-index:-1;box-sizing:border-box;"
    + `width:${ta.clientWidth}px;padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};`
    + `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};`
    + `line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};white-space:pre-wrap;`
    + `overflow-wrap:${cs.overflowWrap};word-break:${cs.wordBreak};tab-size:${cs.tabSize}`;
  // sentinel keeps a trailing-\n empty last line measurable; clamped away later
  m.textContent = ta.value === "" ? "\u200b"
    : ta.value.endsWith("\n") ? ta.value + "\u200b" : ta.value;
  if (!m.parentNode) document.body.appendChild(m);
  // touch point → mirror content coords (READS ta.scrollTop, never writes it)
  const tr = ta.getBoundingClientRect(), mr = m.getBoundingClientRect();
  const x = mr.left + (clientX - tr.left - (parseFloat(cs.borderLeftWidth) || 0) + ta.scrollLeft);
  const y = mr.top + (clientY - tr.top - (parseFloat(cs.borderTopWidth) || 0) + ta.scrollTop);
  const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
  const idx = resolveCaretIndex(m, ta.value, x, y, lineH * 0.6);
  m.style.cssText = "position:absolute;visibility:hidden;top:0;left:0;z-index:-1"; // park
  return idx; // −1 = miss (caller must not move the caret)
}

let tapT0 = 0, tapX = 0, tapY = 0, tapOk = false, lastTapAt = 0, lastTapX = 0, lastTapY = 0;
el.body.addEventListener("touchstart", e => {
  // N031: drop the caret room at gesture start so a coast can never run
  // through the void — but ONLY when the resting scrollTop survives the
  // smaller extent (else the browser would clamp-jump ~kb px under the
  // finger; the room then self-heals on the first quiet scroll end).
  const ta = el.body;
  if (roomGated() && ta.classList.contains("caret-room")) {
    const kb = currentKbHeight() || estimateKb();
    if (ta.scrollTop <= Math.max(0, ta.scrollHeight - kb - ta.clientHeight))
      ta.classList.remove("caret-room");
  }
  tapOk = e.touches.length === 1;
  if (!tapOk) return;
  tapT0 = performance.now();
  tapX = e.touches[0].clientX; tapY = e.touches[0].clientY;
}, { passive: true });
el.body.addEventListener("touchmove", e => {
  if (tapOk && Math.hypot(e.touches[0].clientX - tapX, e.touches[0].clientY - tapY) > 8)
    tapOk = false;                                   // pan/drag-select: native
}, { passive: true });
el.body.addEventListener("touchend", e => {
  if (!interceptOn() || !tapOk) return;
  tapOk = false;
  if (userScrolling) return;       // N032: tap during a coast = native scroll-stopper, we write nothing
  if (performance.now() - tapT0 > 350) return;       // long-press: native loupe/menu
  const dbl = performance.now() - lastTapAt < 350
           && Math.hypot(tapX - lastTapX, tapY - lastTapY) < 30;
  lastTapAt = performance.now(); lastTapX = tapX; lastTapY = tapY;
  if (dbl) return;                                   // double tap: native word-select
  e.preventDefault();                                // ← no native focus, no queued reveal
  bodyTapAt = Date.now();                            // N017 window: reveal scroll ≠ user pan
  const ta = el.body;
  const kb = estimateKb();
  setKbHeight(kb);                                   // scroll range must exist BEFORE we scroll
  document.body.classList.add("kb");
  lastKb = 0;                                        // arm the one-shot re-aim at kb landing
  const idx = caretIndexFromPoint(tapX, tapY);
  if (idx >= 0) ta.setSelectionRange(idx, idx);      // N032 fail-safe: miss → caret stays where it was
  const target = caretScrollTarget(kb);
  if (target && target.to > ta.scrollTop + 2) { // instant, in-gesture (N030 order kept: room → scroll → focus)
    cancelAnimationFrame(tweenRaf); ta.scrollTop = target.to;
  }
  focusEl(ta);                                       // sync in the gesture → keyboard opens
}, { passive: false });

// engine-gate hook (mechanism wiring only)
window.__qn = Object.assign(window.__qn || {}, { caretIndexFromPoint, estimateKb, revealCaret });

// ---- field focus: give textarea scroll room; blur: undo, flush ----
document.addEventListener("focusin", e => {
  if (!narrow.matches || !FIELD.test(e.target.tagName)) return;
  // estimate first (robust to late/absent vv resize), onVV refines to the real value
  setKbHeight(estimateKb()); // N030: remembered height (was a raw 0.4·layoutHeight)
  document.body.classList.add("kb");
  lastKb = 0; // allow the next vv frame to fire the one-shot re-aim
  requestAnimationFrame(revealCaret);
});
document.addEventListener("focusout", () => {
  if (!narrow.matches) return;
  setTimeout(() => { // debounce so field→field moves don't flicker
    if (fieldFocused()) return;
    document.body.classList.remove("kb");
    el.body.classList.remove("caret-room"); // N031: the void never survives the keyboard
    setKbHeight(0);
    pinBodyHeight(); // N027 (P1): re-pin NOW that the field is blurred
    setTimeout(pinBodyHeight, 300); // belt: re-pin after the close animation settles
    flushPersist(); // guarantee the synced pipeline sees the final value
  }, 60);
});

// ---------- mobile header auto-hide ("revert to non-sticky") ----------
// The header is grid row 1 of a fixed body — permanently on screen, which the
// owner reads as "sticky, not enough room for a notes app". Mobile only: pan
// an inner list down → body.header-hidden collapses the row to 0 and slides
// #top up its measured height (--top-h); pan up or focusing the header's
// search brings it back. The fixed #drawer-edge is independent of #top, so
// the drawer stays reachable while the header is hidden. Desktop never hides.
const headerScrollers = [el.tree, el.body, el.preview];
const lastScroll = new WeakMap();
// N017: tapping/typing in the editor makes iOS scroll the TEXTAREA itself
// (caret reveal — the engine lifts the tapped/typed caret into view, e.g.
// above the keyboard). Those scroll events fire right after a tap or input
// with the finger already up, and used to read as user pans → the auto-hide
// yanked the whole layout by --top-h on every tap into the text ("drags/
// scrolls up when you click text in edit mode"). A real pan scrolls WHILE
// the finger is down, so #body toggles are suppressed only inside the short
// reveal window (250ms after a tap/keystroke) when no finger is down.
let bodyTapAt = 0, bodyInputAt = 0;
el.body.addEventListener("pointerup", () => { bodyTapAt = Date.now(); }, { passive: true });
el.body.addEventListener("input", () => { bodyInputAt = Date.now(); }, { passive: true });
function setHeaderHidden(hidden) {
  if (!narrow.matches) hidden = false;
  // measure BEFORE the class collapses the grid row to 0 (post-collapse
  // offsetHeight is garbage — the row's content box shrinks with it)
  if (hidden && !document.body.classList.contains("header-hidden"))
    document.documentElement.style.setProperty("--top-h", el.top.offsetHeight + "px");
  document.body.classList.toggle("header-hidden", hidden);
}
function onHeaderScroll(e) {
  const sc = e.currentTarget;
  if (!lastScroll.has(sc)) { lastScroll.set(sc, sc.scrollTop); return; } // first event: no direction yet
  const delta = sc.scrollTop - lastScroll.get(sc);
  lastScroll.set(sc, sc.scrollTop);
  if (sc === el.body && !pointerDown && Date.now() - Math.max(bodyTapAt, bodyInputAt) < 250) return; // caret reveal, not a pan (N017)
  if (delta > 2 && sc.scrollTop > 60) setHeaderHidden(true);
  else if (delta < -2) setHeaderHidden(false);
}
for (const sc of headerScrollers) sc?.addEventListener("scroll", onHeaderScroll, { passive: true });
el.search.addEventListener("focus", () => setHeaderHidden(false));

// ---------- boot ----------
switchUser(null);
el.sort.value = state.sort;
// ---- N027 (P3)/N033: bulletproof debug meter — the URL forms (?debug=1,
// #debug; ?debug=0 clears) persist in localStorage, AND the owner-proof
// trigger: SIX TAPS on the footer count line toggle it in any context
// (standalone, card, private tab) — the URL forms never showed on the
// owner's iPhone Safari, so the gesture bypasses URL/cache entirely.
// Mounted FIRST, own try/catch, top z-index, safe-area offset so the
// notch/header can never hide it.
function debugRequested() {
  try {
    const u = new URL(location.href);
    if (u.searchParams.get("debug") === "0") { try { localStorage.removeItem("qn:debug"); } catch {} return false; }
    const on = u.searchParams.has("debug") || /(^|[#&])debug\b/.test(location.hash);
    if (on) { try { localStorage.setItem("qn:debug", "1"); } catch {} return true; }
    return localStorage.getItem("qn:debug") === "1";
  } catch {
    return /debug/.test(location.search + location.hash);
  }
}
function mountDebugMeter() {
  if (!debugRequested() || document.getElementById("qn-vv-meter")) return;
  const m = document.createElement("pre");
  m.id = "qn-vv-meter";
  m.style.cssText = [
    "position:fixed",
    "top:calc(env(safe-area-inset-top,0px) + 2px)",
    "left:2px",
    "z-index:2147483647",
    "margin:0", "padding:4px 6px",
    "font:11px/1.25 ui-monospace,Menlo,monospace",
    "color:#0f0", "background:rgba(0,0,0,.72)",
    "white-space:pre", "pointer-events:none", "max-width:72vw"
  ].join(";");
  document.body.appendChild(m);
  const vv = window.visualViewport, ds = document.documentElement, sty = ds.style;
  const tick = () => {
    try {
      const r = (el.body || document.body).getBoundingClientRect();
      // N030: top-window vv lines — in the card the keyboard is only reported
      // there; ta.scrollTop is the textarea-internal caret motion discriminator
      let topLine = "top -";
      try {
        const tvv = window.top !== window && window.top.visualViewport;
        if (tvv) topLine = `top.vv ${Math.round(tvv.height)}  top.off ${Math.round(tvv.offsetTop)}`;
      } catch (_) {}
      m.textContent =
        `iH ${window.innerHeight}  cH ${document.documentElement.clientHeight}\n` +
        `vv ${vv ? Math.round(vv.height) : "-"}  off ${vv ? Math.round(vv.offsetTop) : "-"}  sc ${vv ? vv.scale.toFixed(2) : "-"}\n` +
        `${topLine}\n` +
        `ta.scroll ${el.body ? Math.round(el.body.scrollTop) : "-"} room ${el.body?.classList.contains("caret-room") ? 1 : 0}  scrollY ${Math.round(window.scrollY)}  scroll ${userScrolling ? 1 : 0}\n` +
        `body ${Math.round(r.top)}/${Math.round(r.bottom)}/${Math.round(r.height)}\n` +
        `kb ${sty.getPropertyValue("--kb-h").trim() || "0"}  app-v ${sty.getPropertyValue("--app-v").trim() || "-"}`;
    } catch (e) { m.textContent = "meter err: " + e.message; }
    if (!document.getElementById("qn-vv-meter")) return; // N033: unmounted by the toggle → stop the loop
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function toggleDebugMeter() {
  const had = !!document.getElementById("qn-vv-meter");
  try { had ? localStorage.removeItem("qn:debug") : localStorage.setItem("qn:debug", "1"); } catch (_) {}
  document.getElementById("qn-vv-meter")?.remove();
  try { if (!had) mountDebugMeter(); } catch (_) {}
}
// N033: six taps on the footer count line within 2.5s — the iOS-proof switch
let meterTaps = 0, meterTapTimer = 0;
el.status?.addEventListener("click", () => {
  clearTimeout(meterTapTimer);
  if (++meterTaps >= 6) { meterTaps = 0; toggleDebugMeter(); }
  else meterTapTimer = setTimeout(() => { meterTaps = 0; }, 2500);
});
try { mountDebugMeter(); } catch (_) { /* the meter must never block boot */ }
try { pinBodyHeight(); onVV(); } catch (e) {
  const x = document.getElementById("qn-vv-meter");
  if (x) x.textContent = "boot err: " + e.message;
}
// Narrow viewports hide the shortcut cheat-sheet, so the search placeholder
// shouldn't advertise keyboard shortcuts there either (Decision Log).
const setSearchPlaceholder = () =>
  el.search.placeholder = narrow.matches ? "Search" : "Search (Ctrl+K)  ·  Palette (Ctrl+P)";
setSearchPlaceholder();
narrow.addEventListener?.("change", setSearchPlaceholder);
if (!configured) setSync("local only — set js/config.js", "err");
watchAuth(user => switchUser(user));

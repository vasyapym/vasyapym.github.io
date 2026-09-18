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

// keyboard height = stable layout height − shrunken visual height
function currentKbHeight() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height));
}
function setKbHeight(px) {
  document.documentElement.style.setProperty("--kb-h", (px || 0) + "px");
}

// ---- in-app Done (S2): iOS Safari can omit the accessory bar in iframes ----
const doneBar = document.createElement("button");
doneBar.id = "done-bar"; doneBar.type = "button"; doneBar.textContent = "Done";
doneBar.setAttribute("aria-label", "Dismiss keyboard");
doneBar.hidden = true;
// pointerdown + preventDefault so the tap never steals focus before we blur.
doneBar.addEventListener("pointerdown", e => {
  e.preventDefault();
  const a = document.activeElement;
  if (a && FIELD.test(a.tagName)) a.blur();
});
addEventListener("DOMContentLoaded", () => document.body.appendChild(doneBar), { once: true });
function positionDoneBar() {
  const vv = window.visualViewport;
  if (doneBar.hidden || !vv) return;
  const y = Math.round(vv.offsetTop + vv.height - (doneBar.offsetHeight || 36));
  doneBar.style.transform = `translateY(${y}px)`; // anchor to the visible bottom
}
function showDoneBar(show) {
  if (show && narrow.matches) { doneBar.hidden = false; positionDoneBar(); }
  else doneBar.hidden = true;
}

// ---- single rAF-throttled vv reader: NO page movement, only Done + palette ---
let vvQueued = false;
function readViewport() {
  if (narrow.matches && fieldFocused()) setKbHeight(currentKbHeight());
  positionDoneBar();
  revealCaret(); // real keyboard height has landed — re-aim the caret
  fitPalette(); // keep: command-palette dialog placement
}
function onVV() {
  if (vvQueued) return;
  vvQueued = true;
  requestAnimationFrame(() => { vvQueued = false; readViewport(); });
}
window.visualViewport?.addEventListener("resize", onVV);
window.visualViewport?.addEventListener("scroll", onVV);
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
function revealCaret() {
  if (!narrow.matches || document.activeElement !== el.body) return;
  const ta = el.body;
  const kb = currentKbHeight() || Math.round(window.innerHeight * 0.4);
  const visible = ta.clientHeight - kb; // the area that stays above the keyboard
  if (visible <= 0) return;
  const caretY = caretContentY();
  // minimal movement: lift the caret only as far as the keyboard zone demands,
  // +20px margin (≈ one line) so a slightly-off mirror measure can't re-pan
  const desired = Math.round(caretY - visible + 20);
  const max = Math.max(0, ta.scrollHeight - ta.clientHeight);
  const to = Math.max(0, Math.min(desired, max));
  if (to > ta.scrollTop + 2) tweenScrollTo(ta, to); // high taps: no-op
}
let caretQueued = false;
document.addEventListener("selectionchange", () => {
  if (document.activeElement !== el.body) return;
  if (caretQueued) return;
  caretQueued = true;
  requestAnimationFrame(() => { caretQueued = false; revealCaret(); });
});

// ---- field focus: give textarea scroll room + show Done; blur: undo, flush ----
document.addEventListener("focusin", e => {
  if (!narrow.matches || !FIELD.test(e.target.tagName)) return;
  // estimate first (robust to late/absent vv resize), onVV refines to the real value
  setKbHeight(currentKbHeight() || Math.round(window.innerHeight * 0.4));
  document.body.classList.add("kb");
  showDoneBar(true);
  requestAnimationFrame(revealCaret); // N022: caret above the keyboard before iOS looks
});
document.addEventListener("focusout", () => {
  if (!narrow.matches) return;
  setTimeout(() => { // debounce so field→field moves don't flicker
    if (fieldFocused()) return;
    document.body.classList.remove("kb");
    setKbHeight(0);
    showDoneBar(false);
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
onVV();
// Narrow viewports hide the shortcut cheat-sheet, so the search placeholder
// shouldn't advertise keyboard shortcuts there either (Decision Log).
const setSearchPlaceholder = () =>
  el.search.placeholder = narrow.matches ? "Search" : "Search (Ctrl+K)  ·  Palette (Ctrl+P)";
setSearchPlaceholder();
narrow.addEventListener?.("change", setSearchPlaceholder);
if (!configured) setSync("local only — set js/config.js", "err");
watchAuth(user => switchUser(user));

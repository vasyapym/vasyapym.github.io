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

// ---------- helpers ----------
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
  el.viewToggle.textContent = state.view === "view" ? "✎ Edit" : "👁 Preview";
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
function softDeleteNote(id) {
  const n = state.notes[id]; if (!n || n.deleted) return;
  if (!confirm(`Delete "${n.title || "Untitled"}"?`)) return;
  n.deleted = true; n.updatedAt = Date.now(); n._dirty = true;
  persist(); schedulePush(id);
  if (state.activeId === id) state.activeId = null;
  renderAll(); el.search.focus();
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
  el.palInput.value = prefix; el.palette.showModal(); el.palInput.focus(); renderPalette();
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
    else if (drawer.isOpen()) { e.preventDefault(); drawer.close(); }
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
el.sort.value = state.sort;
// Narrow viewports hide the shortcut cheat-sheet, so the search placeholder
// shouldn't advertise keyboard shortcuts there either (Decision Log).
const narrow = matchMedia("(max-width:760px)");
const setSearchPlaceholder = () =>
  el.search.placeholder = narrow.matches ? "Search" : "Search (Ctrl+K)  ·  Palette (Ctrl+P)";
setSearchPlaceholder();
narrow.addEventListener?.("change", setSearchPlaceholder);
if (!configured) setSync("local only — set js/config.js", "err");
watchAuth(user => switchUser(user));

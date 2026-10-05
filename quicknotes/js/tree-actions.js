import { showMenu } from "./menu.js";
import { folderOf, baseOf, join, normalize, inFolder, allFolders, rewritePaths, moveNote } from "./paths.js";

/** Interactions over the nested details/summary tree rendered by app.js:
 *  context menu (right-click / 450ms long-press), row buttons ([data-act]),
 *  inline rename + inline new-folder, mouse drag&drop.
 *  getNotes() must return the CURRENT notes map (it is replaced on merge/sign-in).
 *  commit(ids) persists, schedules pushes for those ids, and re-renders.
 *  onDelete(ids) soft-deletes (no confirmation). createNote(path) creates+opens.
 *  expand(path) opens a folder chain. remapOpen(oldP, newP) re-keys fold memory.
 *  Returns { newFolder, menuFor }. */
export function initTreeActions({ tree, getNotes, commit, onOpen, onDelete, createNote, expand = () => {}, remapOpen = () => {}, notify = m => alert(m) }) {
  const N = () => getNotes();
  const attempt = fn => { try { const ids = fn() ?? []; if (ids.length) commit(ids); } catch (e) { notify(e.message); } };
  const liveIn = p => Object.values(N()).filter(n => !n.deleted && inFolder(n.path, p)).map(n => n.id);
  const folderExists = p => allFolders(N()).includes(p);
  const pretty = p => p ? p.split("/").join(" / ") : "/ (top level)";

  // Resolve any element to a target. note.folder = folder the note lives in;
  // folder.path = the folder itself. A note's path IS its folder.
  const hit = el => {
    const n = el.closest?.("[data-id]");
    if (n) return { kind: "note", id: n.dataset.id, folder: n.dataset.path || "", el: n };
    const f = el.closest?.(".folder[data-folder]");
    if (f) return { kind: "folder", path: f.dataset.folder, el: f };
    return { kind: "root", path: "", el: tree };
  };
  const dirOf = t => t.kind === "note" ? t.folder : t.path;
  const folderEl = p => p ? tree.querySelector(`.folder[data-folder="${CSS.escape(p)}"]`) : tree;

  // ---- operations ----
  // A note moves alone (its own path changes); a folder moves with everything
  // under it. Same-name targets refuse with an error — no silent merges.
  const move = (t, dir) => attempt(() => {
    if (t.kind === "note") { const ids = moveNote(N(), t.id, dir); expand(dir); return ids; }
    const to = join(dir, baseOf(t.path));
    if (to === t.path) return [];
    if (folderExists(to)) throw new Error(`"${to}" already exists`);
    const ids = rewritePaths(N(), t.path, to);
    remapOpen(t.path, to); expand(to);
    return ids;
  });

  const rename = t => {
    const label = t.el.querySelector(":scope > summary > .label"); if (!label) return;
    const input = Object.assign(document.createElement("input"), { className: "rename", value: baseOf(t.path) });
    label.replaceWith(input);
    edit(input, name => {
      input.replaceWith(label);
      if (!name || name === baseOf(t.path)) return;
      attempt(() => {
        if (name.includes("/")) throw new Error('name cannot contain "/" (use Move to… for nesting)');
        const to = join(folderOf(t.path), name);
        if (folderExists(to)) throw new Error(`"${to}" already exists`);
        const ids = rewritePaths(N(), t.path, to);
        remapOpen(t.path, to);
        return ids;
      });
    });
  };

  /** Inline "new folder" row inside `parent`; Enter creates the folder's first note. */
  const newFolder = (parent = "") => {
    parent = normalize(parent);
    const host = folderEl(parent) ?? tree;
    if (host !== tree) host.open = true;
    const list = host === tree ? tree : host.querySelector(":scope > .children");
    const row = document.createElement("details");
    row.className = "folder is-new"; row.open = true;
    row.innerHTML = '<summary><span class="twisty"></span><input class="rename" placeholder="Folder name" aria-label="Folder name"></summary>';
    list.insertBefore(row, list.querySelector(":scope > .folder"));
    edit(row.querySelector("input"), name => {
      row.remove();
      if (!name) return;
      attempt(() => {
        const p = join(parent, name); // "a/b" creates both levels — the old path-field habit, one gesture
        if (folderExists(p)) throw new Error(`"${p}" already exists`);
        expand(p);
        createNote?.(p); // a virtual folder exists through its first note
        return [];
      });
    });
  };

  /** Remove the folder shell: contents move up one level (may merge with siblings). */
  const flatten = t => attempt(() => {
    const ids = rewritePaths(N(), t.path, folderOf(t.path));
    remapOpen(t.path, folderOf(t.path));
    return ids;
  });
  const deleteFolder = t => {
    const ids = liveIn(t.path);
    if (ids.length > 1 && !confirm(`Delete "${pretty(t.path)}" and its ${ids.length} notes?`)) return;
    onDelete?.(ids);
  };

  const movePicker = (t, x, y) => {
    const from = dirOf(t);
    const items = allFolders(N())
      .filter(f => f !== from && !(t.kind === "folder" && inFolder(f, t.path)))
      .map(f => ({ label: pretty(f), run: () => move(t, f) }));
    showMenu(x, y, items.length ? items : [{ label: "No other folder", run: () => {} }]);
  };

  function menuFor(t, x, y) {
    const items = t.kind === "note" ? [
      { label: "Open", run: () => onOpen?.(t.id) },
      "-",
      { label: "Move to…", run: () => movePicker(t, x, y) },
      { label: "Delete", danger: true, run: () => onDelete?.([t.id]) }
    ] : [
      { label: "New note", run: () => createNote?.(t.path) },
      { label: t.kind === "root" ? "New folder" : "New subfolder", run: () => newFolder(t.path) },
      ...(t.kind === "folder" ? [
        "-",
        { label: "Rename", run: () => rename(t) },
        { label: "Move to…", run: () => movePicker(t, x, y) },
        "-",
        { label: "Remove folder (keep notes)", run: () => flatten(t) },
        { label: "Delete folder & notes", danger: true, run: () => deleteFolder(t) }
      ] : [])
    ];
    showMenu(x, y, items);
  }

  // ---- context menu: right-click + long-press ----
  tree.addEventListener("contextmenu", e => { e.preventDefault(); menuFor(hit(e.target), e.clientX, e.clientY); });

  let lp = null, suppressClick = false;
  tree.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" || e.target.closest("[data-act], input")) return;
    const { clientX: x, clientY: y, target } = e;
    lp = { x, y, t: setTimeout(() => { lp = null; suppressClick = true; navigator.vibrate?.(10); menuFor(hit(target), x, y); }, 450) };
  });
  const cancelLP = () => { if (lp) clearTimeout(lp.t); lp = null; };
  tree.addEventListener("pointermove", e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) cancelLP(); });
  for (const t of ["pointerup", "pointercancel", "pointerleave"]) tree.addEventListener(t, cancelLP);
  tree.addEventListener("click", e => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);

  // ---- row buttons (+ / ⋯): never fold the folder ----
  tree.addEventListener("click", e => {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const t = hit(btn);
    if (btn.dataset.act === "new") createNote(dirOf(t));
    else if (btn.dataset.act === "menu") { const r = btn.getBoundingClientRect(); menuFor(t, r.left, r.bottom + 2); }
  });

  // ---- drag & drop (mouse) ----
  let drag = null, hoverOpen = null;
  const clearDrop = () => {
    tree.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
    tree.classList.remove("drop-target");
    clearTimeout(hoverOpen?.t); hoverOpen = null;
  };
  // Dropping on a note = dropping into that note's folder.
  const dropSpot = e => {
    const d = hit(e.target);
    return { dir: dirOf(d), el: d.kind === "note" ? (d.el.closest(".folder[data-folder]") ?? tree) : d.el };
  };
  const canDrop = (src, dir) => {
    if (src.kind === "note") return src.folder !== dir;
    const to = join(dir, baseOf(src.path));
    return to !== src.path && !inFolder(to, src.path);
  };

  tree.addEventListener("dragstart", e => {
    const t = hit(e.target);
    if (t.kind === "root" || e.target.closest("input")) return e.preventDefault();
    drag = t;
    e.dataTransfer.setData("text/x-tree", t.kind === "note" ? t.id : t.path);
    e.dataTransfer.effectAllowed = "move";
    t.el.classList.add("dragging");
  });
  tree.addEventListener("dragover", e => {
    if (!drag) return;
    const { dir, el } = dropSpot(e);
    if (!canDrop(drag, dir)) return clearDrop(); // no preventDefault → "not allowed" cursor
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    if (el.classList.contains("drop-target")) return;
    clearDrop(); el.classList.add("drop-target");
    if (el !== tree && !el.open) hoverOpen = { el, t: setTimeout(() => { el.open = true; }, 600) };
  });
  tree.addEventListener("dragleave", e => { if (!tree.contains(e.relatedTarget)) clearDrop(); });
  tree.addEventListener("dragend", () => { clearDrop(); drag?.el.classList.remove("dragging"); drag = null; });
  tree.addEventListener("drop", e => {
    e.preventDefault();
    const src = drag, { dir } = dropSpot(e);
    clearDrop(); drag = null;
    if (src && canDrop(src, dir)) move(src, dir);
  });

  return { newFolder, menuFor };
}

/** Wire an inline text input: Enter/blur → done(value|null), Escape → done(null).
 *  Swallows events so the host <summary> does not toggle and tree hotkeys do not
 *  fire. Row dragging is suspended while naming so text selection works. */
function edit(input, done) {
  const dragHost = input.closest('[draggable="true"]');
  if (dragHost) dragHost.draggable = false;
  let finished = false;
  const finish = ok => {
    if (finished) return; finished = true;
    const v = input.value.trim();
    if (dragHost) dragHost.draggable = true;
    done(ok && v ? v : null);
  };
  input.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") finish(true); else if (e.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));
  input.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); });
  for (const t of ["pointerdown", "contextmenu", "dragstart"]) input.addEventListener(t, e => e.stopPropagation());
  input.focus(); input.select();
}

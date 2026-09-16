import { showMenu } from "./menu.js";
import { folderOf, baseOf, join, inFolder, allFolders, rewritePaths } from "./paths.js";

/** Wire tree context menus + long-press + drag&drop over a details/summary tree.
 *  getNotes() must return the CURRENT notes map (it is replaced on merge/sign-in).
 *  commit(ids) persists, schedules pushes for those ids, and re-renders. */
export function initTreeActions({ tree, getNotes, commit, onOpen, onDelete, createNote, notify = m => alert(m) }) {
  const N = () => getNotes();
  const attempt = fn => { try { commit(fn() ?? []); } catch (e) { notify(e.message); } };
  const liveIn = p => { let c = 0; for (const n of Object.values(N())) if (!n.deleted && inFolder(n.path, p)) c++; return c; };
  const folderExists = p => allFolders(N()).includes(p);

  const hit = el => {
    const n = el.closest?.("[data-id]");
    if (n) return { kind: "note", id: n.dataset.id, path: n.dataset.path || "", el: n };
    const f = el.closest?.("[data-folder]");
    if (f) return f.dataset.folder === "" ? { kind: "root", path: "", el: tree } : { kind: "folder", path: f.dataset.folder, el: f };
    return { kind: "root", path: "", el: tree };
  };

  const rename = t => inlineRename(t.el.querySelector(".label"), baseOf(t.path), name => attempt(() => {
    if (name.includes("/")) throw new Error('name cannot contain "/"');
    const to = join(folderOf(t.path), name);
    if (folderExists(to)) throw new Error(`folder "${to}" already exists`);
    return rewritePaths(N(), t.path, to);
  }));

  const moveTo = (t, dir) => attempt(() => {
    const to = join(dir, baseOf(t.path));
    if (t.kind === "folder" && folderExists(to)) throw new Error(`folder "${to}" already exists`);
    return rewritePaths(N(), t.path, to);
  });

  const movePicker = (t, x, y) => showMenu(x, y, allFolders(N())
    .filter(f => f !== folderOf(t.path) && !(t.kind === "folder" && inFolder(f, t.path)))
    .map(f => ({ label: f || "/", run: () => moveTo(t, f) })));

  const del = t => {
    const count = liveIn(t.path);
    if (count > 1 && !confirm(`Move "${t.path}" (${count} notes) to the root?`)) return;
    attempt(() => rewritePaths(N(), t.path, ""));
  };

  function menuFor(t, x, y) {
    const items = [];
    if (t.kind === "note") {
      items.push({ label: "Open", run: () => onOpen?.(t.id) });
      items.push("-",
        { label: "Move to…", run: () => movePicker(t, x, y) },
        { label: "Delete", danger: true, run: () => onDelete?.(t.id) });
    } else {
      if (createNote) items.push({ label: "New Note", run: () => createNote(t.path) });
      if (t.kind !== "root") items.push("-",
        { label: "Rename", run: () => rename(t) },
        { label: "Move to…", run: () => movePicker(t, x, y) },
        "-",
        { label: "Delete", danger: true, run: () => del(t) });
    }
    if (items.length) showMenu(x, y, items);
  }

  tree.addEventListener("contextmenu", e => { e.preventDefault(); menuFor(hit(e.target), e.clientX, e.clientY); });

  let lp = null, suppressClick = false;
  tree.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse") return;
    const { clientX: x, clientY: y, target } = e;
    lp = { x, y, t: setTimeout(() => { lp = null; suppressClick = true; navigator.vibrate?.(10); menuFor(hit(target), x, y); }, 450) };
  });
  const cancelLP = () => { if (lp) clearTimeout(lp.t); lp = null; };
  tree.addEventListener("pointermove", e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) cancelLP(); });
  for (const t of ["pointerup", "pointercancel", "pointerleave"]) tree.addEventListener(t, cancelLP);
  tree.addEventListener("click", e => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);

  const decorate = () => tree.querySelectorAll("[data-folder],[data-id]").forEach(el => { el.draggable = true; });
  decorate(); new MutationObserver(decorate).observe(tree, { childList: true, subtree: true });
  const clearDrop = () => tree.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));

  tree.addEventListener("dragstart", e => {
    const { kind, path, id } = hit(e.target);
    if (kind === "root") return e.preventDefault();
    e.dataTransfer.setData("text/x-tree", JSON.stringify({ kind, path, id }));
    e.dataTransfer.effectAllowed = "move";
  });
  tree.addEventListener("dragover", e => {
    const d = hit(e.target); if (d.kind === "note") return;
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    clearDrop(); d.el.classList.add("drop-target");
  });
  tree.addEventListener("dragleave", e => { if (!tree.contains(e.relatedTarget)) clearDrop(); });
  tree.addEventListener("dragend", clearDrop);
  tree.addEventListener("drop", e => {
    e.preventDefault(); clearDrop();
    let src = null;
    try { src = JSON.parse(e.dataTransfer.getData("text/x-tree") || "null"); } catch { src = null; }
    const dst = hit(e.target);
    if (src && dst.kind !== "note") moveTo(src, dst.path);
  });
}

function inlineRename(labelEl, current, done) {
  if (!labelEl) return;
  const input = Object.assign(document.createElement("input"), { className: "rename", value: current });
  labelEl.replaceWith(input); input.focus(); input.select();
  let finished = false;
  const finish = ok => {
    if (finished) return; finished = true;
    const v = input.value.trim(); input.replaceWith(labelEl);
    if (ok && v && v !== current) done(v);
  };
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") finish(true); else if (e.key === "Escape") finish(false);
    e.stopPropagation();
  });
  input.addEventListener("blur", () => finish(true));
  input.addEventListener("pointerdown", e => e.stopPropagation());
}

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

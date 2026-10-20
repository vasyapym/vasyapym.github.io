// Local-first storage: localStorage holds the signed-out "local" notebook + UI keys only.
// N040: signed-in users keep NO notes in localStorage — Firestore (and the SDK's IDB
// cache / mutation queue) is the source of truth. See applySnapshot + sweepLegacy.
const KEY = uid => `notes:${uid}`;

export function loadLocal(uid) {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || "{}"); }
  catch { return {}; }
}

export function saveLocal(uid, notes) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(notes)); }
  catch (e) { console.warn("localStorage full?", e); } // quota-full degrades silently (iOS Safari)
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

/**
 * N040: replaces mergeRemote. Remote is the COMPLETE set for this uid.
 * Per id: local wins only if local._dirty AND local.updatedAt > remote.updatedAt;
 * otherwise remote replaces it with _dirty := metadata.hasPendingWrites (_pending).
 * Locals absent from remote survive only while _dirty (unsent new/carried/legacy);
 * clean ones were deleted remotely -> drop. Pure: no side effects.
 * Returns {notes, changed}.
 */
export function applySnapshot(local, remote) {
  let changed = false;
  const out = {}, seen = new Set();
  for (const r of remote) {
    const { _pending, ...clean } = r;             // _pending is metadata, never stored
    seen.add(r.id);
    const l = local[r.id];
    if (l && l._dirty && (l.updatedAt || 0) > (r.updatedAt || 0)) { out[r.id] = l; continue; } // LWW: unsent local edit is newer
    const next = { ...clean, _dirty: !!_pending };
    out[r.id] = next;
    if (!l || (l.updatedAt || 0) !== (next.updatedAt || 0) || !!l._dirty !== next._dirty || !!l.deleted !== !!next.deleted) changed = true;
  }
  for (const id in local) {
    if (seen.has(id)) continue;
    if (local[id]._dirty) out[id] = local[id];     // not pushed yet (new note / carried orphan / legacy seed)
    else changed = true;                           // clean + gone from remote = deleted elsewhere
  }
  return { notes: out, changed };
}

/**
 * N040 migration sweep (idempotent). Collects _dirty entries from this uid's legacy
 * blob as carry seeds, removes that blob, then drops other stale `notes:*` blobs that
 * hold no _dirty entries (those belong to another account's next sign-in).
 * notes:local is never touched here. Returns an object of seed notes.
 */
export function sweepLegacy(uid) {
  const seeds = {};
  try {
    const mine = loadLocal(uid);
    for (const n of Object.values(mine)) if (n && n._dirty) seeds[n.id] = n;
    localStorage.removeItem(KEY(uid));             // removal works at zero free space
    for (let i = localStorage.length - 1; i >= 0; i--) { // backward: removal shrinks the index
      const k = localStorage.key(i);
      if (!k || !k.startsWith("notes:") || k === "notes:local" || k === KEY(uid)) continue;
      let blob = {};
      try { blob = JSON.parse(localStorage.getItem(k) || "{}"); } catch { blob = {}; }
      if (!Object.values(blob).some(n => n && n._dirty)) localStorage.removeItem(k);
    }
  } catch (e) { console.warn("legacy sweep skipped", e); }
  return seeds;
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

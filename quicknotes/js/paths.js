const SEP = "/";
export const normalize = p => String(p).split(SEP).map(s => s.trim()).filter(Boolean).join(SEP);
export const folderOf = p => p.includes(SEP) ? p.slice(0, p.lastIndexOf(SEP)) : "";
export const baseOf = p => p.slice(p.lastIndexOf(SEP) + 1);
export const join = (dir, name) => normalize(dir ? `${dir}${SEP}${name}` : name);
export const inFolder = (p, dir) => dir === "" || p === dir || p.startsWith(dir + SEP);

// N037: the walk starts AT the note's own path. The old folderOf-first start
// skipped every leaf folder (folders that hold notes directly), so "Move to…"
// never offered them and the "already exists" check misfired on them.
export function allFolders(notes) {
  const set = new Set([""]);
  for (const n of Object.values(notes)) {
    if (n.deleted) continue;
    for (let d = n.path || ""; d; d = folderOf(d)) set.add(d);
  }
  return [...set].sort();
}

// N037: move ONE note into folder `dir`. A note's path IS its folder, so this
// is a plain field write — the old drag path reused rewritePaths and dragged
// the whole source folder along (owner bug report). Returns changed ids.
export function moveNote(notes, id, dir, now = Date.now()) {
  const n = notes[id]; dir = normalize(dir);
  if (!n || n.deleted || (n.path || "") === dir) return [];
  n.path = dir; n.updatedAt = now; n._dirty = true;
  return [id];
}

/** Cascade rewrite: every live note at/under oldP keeps its suffix under newP.
 *  Folders are virtual (paths are not unique keys), so landing on an occupied
 *  path MERGES — nothing can be lost; callers refuse same-name moves upstream.
 *  Bumps updatedAt + _dirty. Returns changed ids. */
export function rewritePaths(notes, oldP, newP, now = Date.now()) {
  oldP = normalize(oldP); newP = normalize(newP);
  if (!oldP) throw new Error("the top level cannot be moved");
  if (oldP === newP) return [];
  if (inFolder(newP, oldP)) throw new Error("cannot move a folder into itself");
  const ids = [];
  for (const n of Object.values(notes)) {
    if (n.deleted || !inFolder(n.path, oldP)) continue;
    n.path = normalize(newP + n.path.slice(oldP.length));
    n.updatedAt = now; n._dirty = true; ids.push(n.id);
  }
  return ids;
}

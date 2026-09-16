const SEP = "/";
export const normalize = p => String(p).split(SEP).map(s => s.trim()).filter(Boolean).join(SEP);
export const folderOf = p => p.includes(SEP) ? p.slice(0, p.lastIndexOf(SEP)) : "";
export const baseOf = p => p.slice(p.lastIndexOf(SEP) + 1);
export const join = (dir, name) => normalize(dir ? `${dir}${SEP}${name}` : name);
export const inFolder = (p, dir) => dir === "" || p === dir || p.startsWith(dir + SEP);

export function allFolders(notes) {
  const set = new Set([""]);
  for (const n of Object.values(notes)) {
    if (n.deleted) continue;
    for (let d = folderOf(n.path); d; d = folderOf(d)) set.add(d);
  }
  return [...set].sort();
}

/** Cascade rewrite: every live note at/under oldP moves to the same suffix under newP.
 *  Works for a single note too (oldP === note.path). Bumps updatedAt + _dirty. Returns changed ids. */
export function rewritePaths(notes, oldP, newP, now = Date.now()) {
  oldP = normalize(oldP); newP = normalize(newP);
  if (oldP === newP) return [];
  if (oldP && newP.startsWith(oldP + SEP)) throw new Error("cannot move a folder into itself");

  const moves = [];
  for (const n of Object.values(notes))
    if (!n.deleted && inFolder(n.path, oldP)) moves.push([n, normalize(newP + n.path.slice(oldP.length))]);

  const moving = new Set(moves.map(([n]) => n.id));
  const taken = new Set();
  for (const m of Object.values(notes)) if (!m.deleted && !moving.has(m.id)) taken.add(m.path);
  for (const [, to] of moves) if (taken.has(to)) throw new Error(`"${to}" already exists`);

  for (const [n, to] of moves) { n.path = to; n.updatedAt = now; n._dirty = true; }
  return moves.map(([n]) => n.id);
}

const TOKEN_RE = /[^\s]+/g;
// Edges strip punctuation so "route," and "route" count as the same word;
// \p{L}\p{N} keeps Cyrillic and digits inside tokens (ё folds via toLowerCase).
const EDGE_RE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const t = m[0].toLowerCase().replace(EDGE_RE, "");
    if (t) out.push(t);
  }
  return out;
}

/** How many of `original`'s tokens (as a multiset) survive in `current`'s. */
export function remainingTokens(original: string[], current: string[]): number {
  const counts = new Map<string, number>();
  for (const t of original) counts.set(t, (counts.get(t) ?? 0) + 1);
  let remaining = 0;
  for (const t of current) {
    const c = counts.get(t) ?? 0;
    if (c > 0) {
      counts.set(t, c - 1);
      remaining++;
    }
  }
  return remaining;
}

/** FNV-1a, 32-bit, hex. Cheap and sync — good enough to detect content edits. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

import type { Unit, UnitGranularity } from "./types";

const WORD_RE = /(\S+)(\s*)/g;
const SENTENCE_FALLBACK_RE = /[^.!?\n]+(?:[.!?]+|\n|$)\s*/g;

export function segmentUnits(text: string, granularity: UnitGranularity): Unit[] {
  const raw: string[] = [];

  if (granularity === "sentence") {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const seg = new Intl.Segmenter(undefined, { granularity: "sentence" });
      for (const { segment } of seg.segment(text)) raw.push(segment);
    } else {
      raw.push(...(text.match(SENTENCE_FALLBACK_RE) ?? []));
    }
  } else {
    for (const m of text.matchAll(WORD_RE)) raw.push(m[0]);
  }

  const units: Unit[] = [];
  for (const piece of raw) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(piece);
    if (!m) continue;
    const [, leading, body, trailing] = m;
    if (leading && units.length) units[units.length - 1].trailing += leading;
    if (!body) continue;
    units.push({ id: units.length, text: body, chars: Array.from(body), trailing });
  }
  return units;
}

// Typographic → ASCII so users don't fight smart quotes / em dashes /
// guillemets; ё folds to е (Cyrillic keyboards and layouts disagree).
const CHAR_MAP: Record<string, string> = {
  "\u2018": "'", "\u2019": "'", "\u201A": "'",
  "\u201C": '"', "\u201D": '"', "\u201E": '"',
  "\u00AB": '"', "\u00BB": '"',
  "\u2013": "-", "\u2014": "-", "\u2212": "-",
  "\u00A0": " ",
  "\u0451": "\u0435",
  "\u0401": "\u0415",
};

export function normalizeChar(ch: string, caseSensitive: boolean): string {
  let c = ch.normalize("NFKC");
  c = CHAR_MAP[c] ?? c;
  if (/\s/.test(c)) return " ";
  return caseSensitive ? c : c.toLowerCase();
}

export const charsEqual = (a: string, b: string, caseSensitive: boolean) =>
  normalizeChar(a, caseSensitive) === normalizeChar(b, caseSensitive);

export const isWhitespace = (ch: string) => /\s/.test(ch);

/** FNV-1a, 32-bit, hex. Cheap and sync — good enough to detect content edits. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

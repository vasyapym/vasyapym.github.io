#!/usr/bin/env node
// split-lessons.mjs — extract lesson section arrays into one file per topic card.
//
// usage: node split-lessons.mjs <source.ts> <outDir> [--write] [--force]
//   default: dry run (report only). --write: write card files + rewrite source.
//   --force: allow overwriting existing card files whose content differs.

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------- CLI
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const FORCE = args.includes("--force");
const pos = args.filter((a) => !a.startsWith("--"));
if (pos.length !== 2) {
  console.error("usage: node split-lessons.mjs <source.ts> <outDir> [--write] [--force]");
  process.exit(2);
}
const [srcPath, outDir] = pos;
const src = fs.readFileSync(srcPath, "utf8");

// ---------------------------------------------------------------- helpers
const lineStarts = [0];
for (let i = 0; i < src.length; i++) if (src[i] === "\n") lineStarts.push(i + 1);
function lineOf(idx) {
  let lo = 0, hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}
function die(msg, idx) {
  const where = idx == null ? "" : `${srcPath}:${lineOf(idx)}: `;
  console.error(`error: ${where}${msg}`);
  process.exit(1);
}

/**
 * Walk code chars in [start,end), skipping strings/comments/template text.
 * cb(i, ch, depth) — for openers depth is before increment, for closers after
 * decrement (so a matching pair reports the same depth). Return true to stop.
 */
function walk(start, end, cb) {
  let i = start, depth = 0;
  const tpl = []; // depth at which each template ${ was opened
  const tplBody = (j) => {
    while (j < end) {
      const c = src[j];
      if (c === "\\") { j += 2; continue; }
      if (c === "`") return j + 1;
      if (c === "$" && src[j + 1] === "{") { tpl.push(depth); depth++; return j + 2; }
      j++;
    }
    die("unterminated template literal", start);
  };
  while (i < end) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "/") { const j = src.indexOf("\n", i); i = j < 0 ? end : j; continue; }
    if (c === "/" && n === "*") {
      const j = src.indexOf("*/", i + 2);
      if (j < 0) die("unterminated block comment", i);
      i = j + 2; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < end && src[j] !== c) {
        if (src[j] === "\\") j++;
        else if (src[j] === "\n") die("unterminated string", i);
        j++;
      }
      i = j + 1; continue;
    }
    if (c === "`") { i = tplBody(i + 1); continue; }
    if (c === "(" || c === "[" || c === "{") {
      if (cb(i, c, depth)) return i;
      depth++; i++; continue;
    }
    if (c === ")" || c === "]" || c === "}") {
      depth--;
      if (c === "}" && tpl.length && tpl.at(-1) === depth) { tpl.pop(); i = tplBody(i + 1); continue; }
      if (cb(i, c, depth)) return i;
      i++; continue;
    }
    if (cb(i, c, depth)) return i;
    i++;
  }
  return -1;
}

function matchBracket(open) {
  const close = walk(open, src.length, (i, c, d) => i !== open && d === 0 && ")]}".includes(c));
  if (close < 0) die(`unmatched '${src[open]}'`, open);
  const pair = { "[": "]", "{": "}", "(": ")" }[src[open]];
  if (src[close] !== pair) die(`mismatched bracket, expected '${pair}'`, close);
  return close;
}

// end of statement/property incl. trailing horizontal ws and one line terminator
function eatLineEnd(i) {
  while (src[i] === " " || src[i] === "\t") i++;
  if (src[i] === "\r" && src[i + 1] === "\n") return i + 2;
  if (src[i] === "\n") return i + 1;
  return i;
}
// start of line if only whitespace precedes idx on its line, else idx
function lineStartIfBlank(idx) {
  const ls = lineStarts[lineOf(idx) - 1];
  return /^[ \t]*$/.test(src.slice(ls, idx)) ? ls : idx;
}
const isIdent = (ch) => ch !== undefined && /[A-Za-z0-9_$]/.test(ch);

// [DEBUG-migr] type-declaration skip: the stray-sections scan must ignore
// type fields like `readonly sections: readonly LessonSection[];`
const TYPE_SKIP = /^export type \w+ = \{/;

// ---------------------------------------------------------------- 1. *Sections consts
/** name -> { kind:"array", declStart, declEnd, declText, arrText } | { kind:"composite", a, b, declStart, declEnd } */
const consts = new Map();

const reArr = /^[ \t]*const[ \t]+(\w+Sections\w*)\s*:\s*readonly\s+LessonSection\[\]\s*=\s*\[/gm;
for (let m; (m = reArr.exec(src)); ) {
  const name = m[1];
  const declStart = m.index + m[0].indexOf("const");
  const open = m.index + m[0].length - 1;
  const close = matchBracket(open);
  let j = close + 1;
  while (src[j] === " " || src[j] === "\t") j++;
  if (src[j] !== ";") die(`expected ';' after ${name} array`, j);
  if (consts.has(name)) die(`duplicate const ${name}`, declStart);
  const arrText = src.slice(open, close + 1);  // "[ ... ]"
  // composite form? `const X: readonly LessonSection[] = [...A, ...B];`
  const comp = /^\[\s*\.\.\.(\w+)\s*,\s*\.\.\.(\w+)\s*,?\s*\]$/.exec(arrText);
  consts.set(name, comp
    ? { kind: "composite", name, a: comp[1], b: comp[2],
        declStart: lineStartIfBlank(declStart),
        declEnd: eatLineEnd(j + 1) }
    : { kind: "array", name,
        declStart: lineStartIfBlank(declStart),
        declEnd: eatLineEnd(j + 1),
        declText: src.slice(declStart, j + 1),   // "const X: ... = [ ... ];"
        arrText });
  reArr.lastIndex = close;
}
for (const c of consts.values()) {
  if (c.kind !== "composite") continue;
  for (const part of [c.a, c.b]) {
    const p = consts.get(part);
    if (!p) die(`composite ${c.name} spreads unknown const ${part}`, c.declStart);
    if (p.kind !== "array") die(`composite ${c.name} spreads non-array const ${part}`, c.declStart);
  }
}

// ---------------------------------------------------------------- 2. topic cards
const cards = [];            // { id, source, fileText, removeStart, removeEnd, line }
const okSectionsIdx = new Set();
const skipRanges = [];       // [start,end) excluded from stray-sections check

const reTopics = /^[ \t]*(?:export[ \t]+)?const[ \t]+(\w+Topics\w*)\s*:\s*readonly\s+TopicCard\[\]\s*=\s*\[/gm;
for (let m; (m = reTopics.exec(src)); ) {
  const open = m.index + m[0].length - 1;
  const close = matchBracket(open);
  const cardOpens = [];
  walk(open + 1, close, (i, c, d) => { if (d === 0 && c === "{") cardOpens.push(i); });
  for (const co of cardOpens) processCard(co, matchBracket(co));
  reTopics.lastIndex = close;
}

function processCard(co, cc) {
  let id = null, idIdx = co;
  const deeps = [];
  walk(co + 1, cc, (i, c, d) => {
    if (d !== 0 || isIdent(src[i - 1]) || !/[A-Za-z_$]/.test(c)) return;
    const re = /(id|deepLesson)\s*:\s*/y;
    re.lastIndex = i;
    const k = re.exec(src);
    if (!k) return;
    if (k[1] === "id") {
      const rv = /(["'`])([^"'`\\\n]*)\1/y;
      rv.lastIndex = re.lastIndex;
      const v = rv.exec(src);
      if (!v) die("card id is not a plain string literal", i);
      if (id !== null) die("card has two id properties", i);
      id = v[2]; idIdx = i;
    } else {
      deeps.push({ keyIdx: i, valIdx: re.lastIndex });
    }
  });
  if (deeps.length === 0) return;
  if (deeps.length > 1) die("card has multiple deepLesson properties", deeps[1].keyIdx);
  if (id === null) die("card with deepLesson has no id", co);
  if (!/^[A-Za-z0-9._-]+$/.test(id)) die(`card id "${id}" is not a safe file name`, idIdx);

  const { keyIdx, valIdx } = deeps[0];
  if (src[valIdx] !== "{") die("deepLesson value is not an object literal", keyIdx);
  const objClose = matchBracket(valIdx);

  const secRe = /\s*sections\s*:\s*/y;
  secRe.lastIndex = valIdx + 1;
  const sm = secRe.exec(src);
  const sectionsIdx = sm ? src.indexOf("sections", valIdx + 1) : keyIdx;
  if (!sm) die("deepLesson is not `{ sections: NAME }` or `{ sections: [ ... ] }`", sectionsIdx);
  let v = secRe.lastIndex;

  let source, fileText, afterVal;
  const HEADER = `import type { LessonSection } from "../curriculum";\n\n`;
  if (src[v] === "[") {
    const ac = matchBracket(v);
    if (lineOf(ac) === lineOf(v)) die("inline sections array must be multiline", sectionsIdx);
    source = "inline";
    fileText = `${HEADER}export const sections: readonly LessonSection[] = ${src.slice(v, ac + 1)};\n`;
    afterVal = ac + 1;
  } else {
    const nm = /(\w+)/y; nm.lastIndex = v;
    const r = nm.exec(src);
    if (!r) die("deepLesson.sections is neither an identifier nor an array", sectionsIdx);
    source = r[1];
    const c = consts.get(source);
    if (!c) die(`sections references unknown const ${source}`, sectionsIdx);
    if (c.kind === "composite") {
      const A = consts.get(c.a), B = consts.get(c.b);
      fileText = `${HEADER}${A.declText}\n\n${B.declText}\n\n` +
        `export const sections: readonly LessonSection[] = [...${c.a}, ...${c.b}];\n`;
    } else {
      fileText = `${HEADER}export const sections: readonly LessonSection[] = ${c.arrText};\n`;
    }
    afterVal = nm.lastIndex;
  }
  const tail = /\s*,?\s*/y; tail.lastIndex = afterVal;
  tail.exec(src);
  if (tail.lastIndex !== objClose) die("deepLesson has properties other than `sections`", sectionsIdx);

  // whole property + trailing comma (+ line if it owns its lines)
  let end = objClose + 1;
  const tc = /[ \t]*,/y; tc.lastIndex = end;
  if (tc.exec(src)) end = tc.lastIndex;
  const start = lineStartIfBlank(keyIdx);
  end = start !== keyIdx ? eatLineEnd(end) : (() => { let e = end; while (src[e] === " " || src[e] === "\t") e++; return e; })();

  okSectionsIdx.add(lineOf(sectionsIdx));
  skipRanges.push([valIdx, objClose + 1]);
  cards.push({ id, source, fileText, removeStart: start, removeEnd: end, line: lineOf(keyIdx) });
}

// ---------------------------------------------------------------- 3. validation
const seen = new Map();
for (const c of cards) {
  if (seen.has(c.id)) die(`duplicate card id "${c.id}" (also line ${seen.get(c.id)})`, lineStarts[c.line - 1]);
  seen.set(c.id, c.line);
}

// which consts get deleted
const doomed = new Set();
for (const c of cards) {
  if (c.source === "inline") continue;
  const k = consts.get(c.source);
  doomed.add(k.name);
  if (k.kind === "composite") { doomed.add(k.a); doomed.add(k.b); }
}
for (const n of doomed) { const k = consts.get(n); skipRanges.push([k.declStart, k.declEnd]); }

// any other `sections:` line => abort
const inSkip = (idx) => skipRanges.some(([s, e]) => idx >= s && idx < e);
let inTypeBlock = false, typeIndent = "";
for (let ln = 1; ln <= lineStarts.length; ln++) {
  const s = lineStarts[ln - 1], e = ln < lineStarts.length ? lineStarts[ln] : src.length;
  const lineText = src.slice(s, e);
  if (TYPE_SKIP.test(lineText)) { inTypeBlock = true; typeIndent = "  "; continue; }
  if (inTypeBlock) {
    if (/^[ \t]*\}/.test(lineText)) { inTypeBlock = false; continue; }
    continue; // type-body lines are exempt from the stray `sections:` scan
  }
  const m = /\bsections\s*:/.exec(lineText);
  if (!m || okSectionsIdx.has(ln)) continue;
  if (inSkip(s + m.index)) continue;
  die("`sections:` line matches neither `deepLesson: { sections: NAME }` nor the inline form", s + m.index);
}

// ---------------------------------------------------------------- 4. rewrite source
const removals = [
  ...cards.map((c) => [c.removeStart, c.removeEnd]),
  ...[...doomed].map((n) => [consts.get(n).declStart, consts.get(n).declEnd]),
].sort((x, y) => x[0] - y[0]);
for (let i = 1; i < removals.length; i++)
  if (removals[i][0] < removals[i - 1][1]) die("overlapping edits", removals[i][0]);

let out = "", cur = 0;
for (const [s, e] of removals) { out += src.slice(cur, s); cur = e; }
out += src.slice(cur);

for (const n of doomed) {
  const m = new RegExp(`\\b${n}\\b`).exec(out);
  if (m) {
    const line = out.slice(0, m.index).split("\n").length;
    die(`${n} is deleted but still referenced in rewritten source (new line ${line})`);
  }
}

// ---------------------------------------------------------------- 5. report / write
const rows = cards.map((c) => {
  const file = path.join(outDir, `${c.id}.ts`);
  const bytes = Buffer.byteLength(c.fileText);
  const removed = Buffer.byteLength(src.slice(c.removeStart, c.removeEnd));
  let status = "new";
  if (fs.existsSync(file)) status = fs.readFileSync(file, "utf8") === c.fileText ? "same" : "DIFFERS";
  return { ...c, file, bytes, removed, status };
});

const pad = (s, n) => String(s).padEnd(n);
const wId = Math.max(2, ...rows.map((r) => r.id.length));
const wSrc = Math.max(6, ...rows.map((r) => r.source.length));
console.log(`${WRITE ? "WRITE" : "DRY RUN"}: ${srcPath} -> ${outDir}\n`);
console.log(`${pad("id", wId)}  ${pad("source", wSrc)}  path  (file bytes / removed from deepLesson prop)`);
for (const r of rows)
  console.log(`${pad(r.id, wId)}  ${pad(r.source, wSrc)}  ${r.file}  +${r.bytes} / -${r.removed}  [${r.status}]`);

const srcBefore = Buffer.byteLength(src), srcAfter = Buffer.byteLength(out);
const constBytes = [...doomed].reduce((a, n) => a + Buffer.byteLength(src.slice(consts.get(n).declStart, consts.get(n).declEnd)), 0);
console.log(`\ndeleted consts (${doomed.size}): ${[...doomed].join(", ") || "-"}  (-${constBytes} bytes)`);
console.log(`source: ${srcBefore} -> ${srcAfter} bytes (${srcAfter - srcBefore})`);
console.log(`new files: ${rows.length}, ${rows.reduce((a, r) => a + r.bytes, 0)} bytes`);

const clashes = rows.filter((r) => r.status === "DIFFERS");
if (clashes.length && !FORCE) {
  console.error(`\nerror: ${clashes.length} existing file(s) differ; rerun with --force to overwrite`);
  process.exit(1);
}
if (!WRITE) { console.log("\n(dry run — pass --write to apply)"); process.exit(0); }

fs.mkdirSync(outDir, { recursive: true });
for (const r of rows) fs.writeFileSync(r.file, r.fileText);
fs.writeFileSync(srcPath, out);
console.log("\nwritten.");

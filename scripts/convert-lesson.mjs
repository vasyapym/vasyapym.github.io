#!/usr/bin/env node
// scripts/convert-lesson.mjs
// Dependency-free markdown -> Practice Map DeepLesson TS converter.
// Node >= 20, ESM, stdlib only.

import fs from "node:fs";
import path from "node:path";

// Triple-backtick fence marker built without a literal ``` so the source
// itself never contains an accidental fence terminator.
const FENCE = "\u0060\u0060\u0060";

// ---------------------------------------------------------------------------
// Meta helpers
// ---------------------------------------------------------------------------

function parseMeta(content) {
  const m = content.match(/^\s*<!--([\s\S]*?)-->/);
  if (!m) return null;
  const inner = m[1];
  const idx = inner.indexOf("lesson-meta:");
  if (idx === -1) return null;
  const js = inner.slice(idx + "lesson-meta:".length).trim();
  try {
    return JSON.parse(js);
  } catch {
    return null;
  }
}

function stripLeadingComment(content) {
  return content.replace(/^\s*<!--[\s\S]*?-->\s*/, "");
}

// ---------------------------------------------------------------------------
// Table cell parsing
// ---------------------------------------------------------------------------

function parseCells(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

// ---------------------------------------------------------------------------
// Core converter (state machine)
// ---------------------------------------------------------------------------

function convert(content, titlesMap) {
  const lines = content.split("\n");

  const sections = [];
  let currentSection = null;

  let para = [];
  let list = null; // { ordered, items: [] }
  let tableRows = [];
  let bq = [];

  let inFence = false;
  let fenceInfo = "";
  let fenceLines = [];

  const reports = [];
  const warnings = [];
  const fallbackSeen = new Set();

  let tableRowCount = 0;
  let fenceCount = 0;

  function ensureSection() {
    if (!currentSection) {
      currentSection = { heading: null, blocks: [], examples: [] };
      sections.push(currentSection);
    }
  }

  function flushPara() {
    if (!para.length) {
      para = [];
      return;
    }
    const text = para.map((l) => l.trim()).join(" ").trim();
    para = [];
    if (!text) return;

    const m = text.match(
      /^\*\*(Как думают опытные|Мысль великих программистов)[.:]\*\*\s*(.*)$/
    );
    if (m) {
      ensureSection();
      currentSection.blocks.push({
        kind: "callout",
        variant: "key",
        title: m[1],
        text: m[2].trim(),
      });
      return;
    }

    if (text.includes("### ")) {
      warnings.push(`paragraph contains '### ' remnant: ${text.slice(0, 60)}`);
    }
    const bb = (text.match(/\*\*/g) || []).length;
    if (bb % 2 !== 0) {
      warnings.push(`unbalanced ** in paragraph: ${text.slice(0, 60)}`);
    }

    ensureSection();
    currentSection.blocks.push({ kind: "p", text });
  }

  function flushList() {
    if (!list || !list.items.length) {
      list = null;
      return;
    }
    const block = { kind: "list" };
    if (list.ordered) block.ordered = true;
    block.items = list.items;
    ensureSection();
    currentSection.blocks.push(block);
    list = null;
  }

  function flushTable() {
    if (!tableRows.length) return;
    const rows = tableRows;
    tableRows = [];
    const header = parseCells(rows[0]);
    let start = 1;
    if (rows[1] && /^\|[\s:|-]+\|?$/.test(rows[1].trim())) start = 2;
    const items = [];
    for (let i = start; i < rows.length; i++) {
      const cells = parseCells(rows[i]);
      while (cells.length < header.length) cells.push("");
      let item = `${cells[0] || ""} — ${cells[1] || ""}`;
      for (let k = 2; k < cells.length; k++) {
        if (cells[k] && cells[k] !== "") {
          const h = header[k] !== undefined ? header[k] : "";
          item += `; ${h}: ${cells[k]}`;
        }
      }
      items.push(item);
      tableRowCount++;
    }
    if (items.length) {
      ensureSection();
      currentSection.blocks.push({ kind: "list", items });
    }
  }

  function flushBQ() {
    if (!bq.length) return;
    const text = bq
      .map((l) => l.replace(/^\s*>\s?/, "").trim())
      .join(" ")
      .trim();
    bq = [];
    if (!text) return;

    let variant = "key";
    let title;
    let body = text;
    const m = text.match(/^\*\*(.+?)\*\*\s*(.*)$/);
    if (m && m[2].trim()) {
      title = m[1].trim();
      body = m[2].trim();
      if (/⚠|Предупрежд/.test(title)) variant = "warning";
    }
    const block = { kind: "callout", variant };
    if (title !== undefined) block.title = title;
    block.text = body;
    ensureSection();
    currentSection.blocks.push(block);
  }

  function flushAll() {
    flushPara();
    flushList();
    flushTable();
    flushBQ();
  }

  function addListItem(ordered, itemText) {
    if (list && list.ordered !== ordered) flushList();
    if (!list) list = { ordered, items: [] };
    list.items.push(itemText);
  }

  function closeFence() {
    fenceCount++;
    const k = fenceCount;
    ensureSection();
    const secHeading = currentSection.heading;
    const lang = fenceInfo || "no-lang";
    const firstLine = (fenceLines.find((l) => l.trim() !== "") || "")
      .trim()
      .slice(0, 80);

    const info =
      (titlesMap && (titlesMap[String(k)] || titlesMap[k])) || {};
    const title = info.title || `Блок ${k}`;
    const explanation = info.explanation || "Пояснение не заполнено.";

    currentSection.examples.push({
      title,
      code: fenceLines.join("\n"),
      explanation,
    });

    reports.push(
      `fence ${k} [section "${
        secHeading === null ? "null" : secHeading
      }" | ${lang}] first-line: ${firstLine}`
    );

    if (!info.title) {
      const secIdx = sections.indexOf(currentSection);
      const ctxKey = `${secIdx}|${lang}`;
      if (fallbackSeen.has(ctxKey)) {
        warnings.push(
          `two fences in section "${
            secHeading === null ? "null" : secHeading
          }" share fallback context (${lang})`
        );
      } else {
        fallbackSeen.add(ctxKey);
      }
    }
  }

  for (const raw of lines) {
    const line = raw;
    const trimmed = line.trim();

    // Fence handling has highest priority.
    if (inFence) {
      if (trimmed.startsWith(FENCE)) {
        closeFence();
        inFence = false;
        fenceInfo = "";
        fenceLines = [];
      } else {
        fenceLines.push(line);
      }
      continue;
    }
    if (trimmed.startsWith(FENCE)) {
      flushAll();
      inFence = true;
      fenceInfo = trimmed.slice(FENCE.length).trim();
      fenceLines = [];
      continue;
    }

    // Blank line: paragraph/list/table/blockquote boundary.
    if (trimmed === "") {
      flushAll();
      continue;
    }

    // Horizontal rule: structural separator, never content.
    if (/^-{3,}$/.test(trimmed)) {
      flushAll();
      continue;
    }

    // Headings.
    const hm = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      flushAll();
      const level = hm[1].length;
      const text = hm[2].trim();
      if (level === 1) {
        // document title -> skip
        continue;
      }
      if (level === 2) {
        currentSection = { heading: text, blocks: [], examples: [] };
        sections.push(currentSection);
        continue;
      }
      // level >= 3 -> bold lead-in paragraph block
      ensureSection();
      currentSection.blocks.push({ kind: "p", text: `**${text}**` });
      continue;
    }

    // Blockquote.
    if (trimmed.startsWith(">")) {
      flushPara();
      flushList();
      flushTable();
      bq.push(line);
      continue;
    }

    // Table.
    if (trimmed.startsWith("|")) {
      flushPara();
      flushList();
      flushBQ();
      tableRows.push(line);
      continue;
    }

    // Ordered list.
    let lm = line.match(/^\s{0,2}\d+\.\s+(.*)$/);
    if (lm) {
      flushPara();
      flushTable();
      flushBQ();
      addListItem(true, lm[1].trim());
      continue;
    }

    // Unordered list.
    lm = line.match(/^\s{0,2}-\s+(.*)$/);
    if (lm) {
      flushPara();
      flushTable();
      flushBQ();
      addListItem(false, lm[1].trim());
      continue;
    }

    // Prose line (paragraph). Prose flushes list/table/blockquote.
    flushList();
    flushTable();
    flushBQ();
    para.push(trimmed);
  }

  if (inFence) {
    throw new Error("unbalanced code fence (opened but never closed)");
  }
  flushAll();

  let totalBlocks = 0;
  let totalExamples = 0;
  for (const s of sections) {
    totalBlocks += s.blocks.length;
    totalExamples += s.examples.length;
  }

  return {
    sections,
    reports,
    warnings,
    counts: {
      sections: sections.length,
      blocks: totalBlocks,
      examples: totalExamples,
      tableRows: tableRowCount,
      fences: fenceCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Output builders
// ---------------------------------------------------------------------------

function sectionsToPlain(sections) {
  return sections.map((s) => {
    const obj = { heading: s.heading };
    if (s.blocks.length) obj.blocks = s.blocks;
    if (s.examples.length) obj.examples = s.examples;
    return obj;
  });
}

function emitJSON(sections) {
  return JSON.stringify({ sections: sectionsToPlain(sections) }, null, 2) + "\n";
}

function emitTS(sections, name) {
  let out = `const ${name}: readonly LessonSection[] = [\n`;
  for (const s of sections) {
    out += `  {\n`;
    out += `    heading: ${JSON.stringify(s.heading)},\n`;
    if (s.blocks.length) {
      out += `    blocks: [\n`;
      for (const b of s.blocks) out += `      ${JSON.stringify(b)},\n`;
      out += `    ],\n`;
    }
    if (s.examples.length) {
      out += `    examples: [\n`;
      for (const e of s.examples) out += `      ${JSON.stringify(e)},\n`;
      out += `    ],\n`;
    }
    out += `  },\n`;
  }
  out += `];\n`;
  return out;
}

function toVarName(file) {
  let b = path.basename(file).replace(/\.[^.]+$/, "");
  let parts = b.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  while (parts.length && /^\d+$/.test(parts[0])) parts.shift();
  if (!parts.length) parts = ["lesson"];
  const camel = parts
    .map((p, i) =>
      i === 0
        ? p.toLowerCase()
        : p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join("");
  return camel + "Sections";
}

function writeStdout(s) {
  // process.stdout.write + process.exit can truncate piped output (async drain);
  // writeSync(1, ...) blocks until the consumer has the bytes.
  fs.writeSync(1, s);
}

function printDiagnostics(result) {
  const c = result.counts;
  console.error(`sections: ${c.sections}`);
  console.error(`blocks: ${c.blocks}`);
  console.error(`examples: ${c.examples}`);
  console.error(`table rows: ${c.tableRows}`);
  console.error(`fences: ${c.fences}`);
  for (const r of result.reports) console.error(r);
  for (const w of result.warnings) console.error(`warn: ${w}`);
}

// ---------------------------------------------------------------------------
// Selftest sample (exercises every rule)
// ---------------------------------------------------------------------------

const SAMPLE = [
  "# Заголовок документа который пропускается",
  "",
  "Вводный абзац перед первым заголовком, который довольно длинный и",
  "переносится на несколько строк ради проверки склейки прозы.",
  "",
  "## Часть 1. Основы",
  "",
  "### Подраздел про инструменты",
  "",
  "- первый пункт списка",
  "- второй пункт с `кодом` и **жирным**",
  "",
  "1. первый шаг",
  "2. второй шаг",
  "",
  "| Инструмент | Назначение | Заметка |",
  "| --- | --- | --- |",
  "| kubectl | управление кластером | входит в CLI |",
  "| helm | менеджер пакетов | использует charts |",
  "",
  FENCE + "bash",
  "kubectl get pods -A",
  FENCE,
  "",
  "> Это цитата без жирного заголовка, просто мысль.",
  "",
  "> **Важно** всегда проверяйте контекст перед применением.",
  "",
  "**Как думают опытные:** они сначала читают документацию, потом код.",
  "",
  FENCE + "bash",
  "helm install app ./chart",
  FENCE,
  "",
].join("\n");

function runSelftest() {
  try {
    const result = convert(SAMPLE, {});
    const s = result.sections;

    // Round-trip sanity assertions.
    if (s.length !== 2) throw new Error(`expected 2 sections, got ${s.length}`);
    if (s[0].heading !== null) throw new Error("first section should be heading:null");
    if (s[1].heading !== "Часть 1. Основы")
      throw new Error(`unexpected heading: ${s[1].heading}`);
    if (result.counts.examples !== 2)
      throw new Error(`expected 2 examples, got ${result.counts.examples}`);
    if (result.counts.tableRows !== 2)
      throw new Error(`expected 2 table rows, got ${result.counts.tableRows}`);
    if (result.counts.fences !== 2)
      throw new Error(`expected 2 fences, got ${result.counts.fences}`);

    // Must contain a maxim callout and a bold-titled blockquote callout.
    const callouts = s[1].blocks.filter((b) => b.kind === "callout");
    const hasMaxim = callouts.some((c) => c.title === "Как думают опытные");
    const hasBoldBQ = callouts.some((c) => c.title === "Важно");
    const hasPlainBQ = callouts.some((c) => c.title === undefined);
    if (!hasMaxim) throw new Error("missing maxim callout");
    if (!hasBoldBQ) throw new Error("missing bold-title blockquote callout");
    if (!hasPlainBQ) throw new Error("missing plain blockquote callout");

    // Must contain both an ordered and an unordered list.
    const lists = s[1].blocks.filter((b) => b.kind === "list");
    if (!lists.some((l) => l.ordered === true))
      throw new Error("missing ordered list");
    if (!lists.some((l) => l.ordered === undefined))
      throw new Error("missing unordered list");

    writeStdout(emitJSON(s));
    process.exit(0);
  } catch (e) {
    console.error(`selftest failed: ${e.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  const opts = { json: false, meta: false, selftest: false };
  let file = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--meta") opts.meta = true;
    else if (a === "--selftest") opts.selftest = true;
    else if (a === "--name") opts.name = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else if (a === "--titles") opts.titles = argv[++i];
    else if (a.startsWith("--")) {
      console.error(`unknown option: ${a}`);
      process.exit(1);
    } else file = a;
  }

  if (opts.selftest) {
    runSelftest();
    return;
  }

  if (!file) {
    console.error("usage: node scripts/convert-lesson.mjs <lesson.md> [options]");
    process.exit(1);
  }

  // Load titles sidecar (fatal on missing/unparseable).
  let titlesMap = {};
  if (opts.titles) {
    let raw;
    try {
      raw = fs.readFileSync(opts.titles, "utf8");
    } catch {
      console.error(`--titles file missing/unreadable: ${opts.titles}`);
      process.exit(1);
    }
    try {
      titlesMap = JSON.parse(raw);
    } catch (e) {
      console.error(`--titles file unparseable: ${e.message}`);
      process.exit(1);
    }
  }

  // Read input.
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    console.error(`cannot read input: ${file}`);
    process.exit(1);
  }
  content = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  const meta = parseMeta(content);
  content = stripLeadingComment(content);

  if (opts.meta) {
    writeStdout((meta ? JSON.stringify(meta, null, 2) : "{}") + "\n");
    process.exit(0);
  }

  let result;
  try {
    result = convert(content, titlesMap);
  } catch (e) {
    console.error(`conversion error: ${e.message}`);
    process.exit(1);
  }

  const name = opts.name || toVarName(file);
  const output = opts.json
    ? emitJSON(result.sections)
    : emitTS(result.sections, name);

  if (opts.out) {
    try {
      fs.writeFileSync(opts.out, output);
    } catch (e) {
      console.error(`cannot write output: ${opts.out} (${e.message})`);
      process.exit(1);
    }
  } else {
    writeStdout(output);
  }

  printDiagnostics(result);
  process.exit(0);
}

main();

#!/usr/bin/env node
// scripts/wire-lesson.mjs
// Splice a converted Practice Map lesson into web/curriculum.ts + tiers.ts and
// emit the lesson's section array as its own lazy chunk (web/lesson-data/<id>.ts,
// loaded by web/lessons-loader.ts on first open — the page bundle stays lean).
// Companion to scripts/convert-lesson.mjs: the orchestrator authors only the
// theory snippet (problem/model/mechanics/pitfalls/whenNot) — the essay and the
// emitted TS never pass through the agent's chat context. Zero dependencies.
// Node >= 20, ESM.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CURRICULUM_DEFAULT = "portfolio/projects/practice-map/web/curriculum.ts";
const TIERS_DEFAULT = "portfolio/projects/practice-map/web/lib/tiers/tiers.ts";
const CURRICULUM_EXPORT = "export const curriculum: readonly PracticeArea[] = [";
const THEORY_FIELDS = ["problem", "model", "mechanics", "pitfalls", "whenNot"];

function fail(msg) {
  throw new Error(msg);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--selftest") { args.selftest = true; continue; }
    if (a === "--dry") { args.dry = true; continue; }
    if (a === "--front") { args.front = true; continue; }
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[++i];
      if (val === undefined || val.startsWith("--")) fail(`missing value for --${key}`);
      args[key] = val;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function parseMeta(content, file) {
  const m = content.match(/^\s*<!--([\s\S]*?)-->/);
  const idx = m ? m[1].indexOf("lesson-meta:") : -1;
  if (!m || idx === -1) fail(`no lesson-meta comment in ${file}`);
  try {
    return JSON.parse(m[1].slice(idx + "lesson-meta:".length).trim());
  } catch (e) {
    fail(`lesson-meta in ${file} is not valid JSON: ${e.message}`);
  }
}

// --- derivation: the orchestrator authors only practicePrompt/checkPrompt
// (+ optional summary line); everything else comes from the essay itself ---

function stripLeadingComments(content) {
  return content.replace(/^(?:\s*<!--[\s\S]*?-->)+\s*/, "");
}

function deriveId(file) {
  const base = path.basename(file).replace(/\.[^.]+$/, "");
  let slug = base
    .replace(/^\d+[-_]/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) fail(`cannot derive area id from filename: ${file}`);
  return slug;
}

function deriveTitle(content) {
  const body = stripLeadingComments(content);
  const m = body.match(/^#\s+(.+)$/m);
  if (!m) fail("no H1 title in the lesson body to derive the card title from");
  return m[1].trim();
}

function deriveSummary(content, cap = 500) {
  const body = stripLeadingComments(content);
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^#\s+/.test(l.trim()));
  let i = start + 1;
  while (i < lines.length && lines[i].trim() === "") i++;
  let para = [];
  while (i < lines.length && lines[i].trim() !== "" && !/^#{1,6}\s/.test(lines[i].trim())) {
    para.push(lines[i].trim());
    i++;
  }
  let text = para.join(" ").trim();
  if (!text) fail("no paragraph after the H1 to derive the summary from");
  if (text.length > cap) {
    const cut = text.slice(0, cap);
    const lastSentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\u00a0"));
    text = (lastSentence > 0 ? cut.slice(0, lastSentence + 1) : cut) + " …";
  }
  return text;
}

// --- theory: arrives with the essay as a second comment (preferred) or a /tmp TS file ---

function parseTheoryComment(content, file) {
  const m = content.match(/<!--\s*lesson-theory:([\s\S]*?)-->/);
  if (!m) return null;
  try {
    return JSON.parse(m[1].trim());
  } catch (e) {
    fail(`lesson-theory in ${file} is not valid JSON: ${e.message}`);
  }
}

function checkTheoryParses(text, file) {
  try {
    new Function(`return ({${text}})`);
  } catch (e) {
    fail(`theory snippet ${file} is not valid JS: ${e.message} (straight quotes inside a string?)`);
  }
}

function buildTheoryBody(obj) {
  const fields = ["problem", "model", "mechanics", "pitfalls", "whenNot"];
  for (const f of fields) if (obj[f] === undefined) fail(`lesson-theory comment is missing field "${f}"`);
  return [
    `problem: ${JSON.stringify(obj.problem)},`,
    `model: ${JSON.stringify(obj.model)},`,
    `mechanics: ${JSON.stringify(obj.mechanics)},`,
    `pitfalls: [\n${obj.pitfalls.map((p) => `  ${JSON.stringify(p)}`).join(",\n")}\n],`,
    `whenNot: ${JSON.stringify(obj.whenNot)}`,
  ].join("\n");
}

function readSections(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/const (\w+)Sections: readonly LessonSection\[\] = \[/);
  if (!m) fail(`--sections ${file} is not emitted converter TS (missing "const XSections")`);
  const end = raw.lastIndexOf("];");
  if (end === -1) fail(`no closing ]; in ${file}`);
  // the array text, from the decl's opening [ to the array's closing ];
  // the decl match itself ends with the array's opening [ — the annotation's
  // `[]` must not match, and a body scan would jump into the first block
  const open = m.index + m[0].length - 1;
  if (open === -1 || open > end) fail(`cannot locate the array opening [ in ${file}`);
  return { base: m[1], arrText: raw.slice(open, end + 2) };
}

function readTheory(file) {
  const text = fs.readFileSync(file, "utf8");
  if (/^\s*\{/.test(text)) fail(`theory snippet ${file} must be the object BODY (fields without braces)`);
  for (const field of THEORY_FIELDS) {
    if (!new RegExp(`(^|[^\\w])${field}\\s*:`).test(text)) {
      fail(`theory snippet ${file} is missing field "${field}"`);
    }
  }
  checkTheoryParses(text, file);
  // normalize: strip common indent, re-indent to the card's 6 spaces
  const lines = text.replace(/\t/g, "  ").split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  const min = Math.min(...nonEmpty.map((l) => l.match(/^ */)[0].length));
  return lines
    .map((l) => (l.trim() === "" ? "" : "      " + l.slice(min)))
    .join("\n")
    .replace(/\s+$/, "");
}

function prettyList(arr, ind) {
  return `[\n${arr.map((v) => `${ind}  ${JSON.stringify(v)}`).join(",\n")}\n${ind}]`;
}

function buildTopics(base, topicId, meta, theory) {
  const json = (v) => JSON.stringify(v);
  // No deepLesson on the card: the reader resolves sections lazily via
  // web/lessons-loader.ts → ./lesson-data/<topicId>.ts (one chunk per lesson).
  return [
    `const ${base}Topics: readonly TopicCard[] = [`,
    "  {",
    `    id: ${json(topicId)},`,
    `    title: ${json(meta.title)},`,
    `    summary: ${json(meta.summary)},`,
    "    concepts: [],",
    `    practicePrompt: ${json(meta.practicePrompt)},`,
    `    checkPrompt: ${json(meta.checkPrompt)},`,
    `    tier: ${meta.tier},`,
    `    complexity: ${meta.complexity},`,
    `    references: ${prettyList(meta.references, "    ")},`,
    "    lesson: {",
    theory,
    "    },",
    "  },",
    "];",
  ].join("\n");
}

const LESSON_DATA_HEADER = `import type { LessonSection } from "../curriculum";\n\n`;

function buildLessonData(topicId, arrText) {
  return `${LESSON_DATA_HEADER}export const sections: readonly LessonSection[] = ${arrText};\n`;
}

function spliceCurriculum(src, { base, areaId, topicId, meta, theory, areaTitle, areaDescription, lessonDataText }) {
  const first = src.indexOf(CURRICULUM_EXPORT);
  if (first === -1) fail("curriculum.ts: no `export const curriculum` anchor");
  if (src.includes(`topics: ${base}Topics`)) {
    fail(`area "${base}" appears already wired in curriculum.ts`);
  }
  if (src.includes(`id: "${topicId}"`)) fail(`topic card "${topicId}" already present`);
  const tail = src.slice(first);
  const closeRel = tail.lastIndexOf("];");
  if (closeRel === -1) fail("cannot locate closing ]; of the curriculum array");
  const areaEntry =
    `  {\n` +
    `    id: ${JSON.stringify(areaId)},\n` +
    `    title: ${JSON.stringify(areaTitle)},\n` +
    `    description: ${JSON.stringify(areaDescription)},\n` +
    `    tier: ${meta.tier},\n` +
    `    dependencies: [],\n` +
    `    topics: ${base}Topics,\n` +
    `  },\n`;
  const topicsText = buildTopics(base, topicId, meta, theory);
  const newTail = tail.slice(0, closeRel) + areaEntry + tail.slice(closeRel);
  return `${src.slice(0, first).trimEnd()}\n\n${topicsText}\n${newTail}`;
}

function spliceTiers(src, tierId, areaId, front = false) {
  const esc = tierId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\{ id: "${esc}", name: "${esc}", band: "[^"]+", areas: \\[)([^\\]]*)(\\])`);
  const m = src.match(re);
  if (!m) fail(`tiers.ts: no single-line tier entry for "${tierId}"`);
  const ids = m[2].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  if (ids.includes(areaId)) fail(`tiers.ts: "${areaId}" already in tier "${tierId}"`);
  if (front) ids.unshift(areaId); else ids.push(areaId);
  const rebuilt = m[1] + ids.map((i) => `"${i}"`).join(", ") + m[3];
  return src.slice(0, m.index) + rebuilt + src.slice(m.index + m[0].length);
}

function wire(opts) {
  const content = fs.readFileSync(opts.lessonPath, "utf8");
  const meta0 = parseMeta(content, opts.lessonPath);
  for (const k of ["practicePrompt", "checkPrompt"]) {
    if (meta0[k] === undefined) fail(`lesson-meta missing "${k}" (the only authored meta fields)`);
  }
  if (!Array.isArray(meta0.references) && meta0.references !== undefined) fail("lesson-meta references must be an array");
  if (Array.isArray(meta0.concepts) && meta0.concepts.length) {
    console.error("wire-lesson: warning: lesson-meta has concepts — cards never display them; wiring concepts: []");
  }
  // derive what the chat model does not author; explicit meta wins (back-compat)
  const meta = {
    id: meta0.id === undefined ? deriveId(opts.lessonPath) : meta0.id,
    title: meta0.title === undefined ? deriveTitle(content) : meta0.title,
    summary: meta0.summary === undefined ? deriveSummary(content) : meta0.summary,
    tier: meta0.tier === undefined ? 1 : meta0.tier,
    complexity: meta0.complexity === undefined ? 4 : meta0.complexity,
    references: meta0.references === undefined ? [] : meta0.references,
    practicePrompt: meta0.practicePrompt,
    checkPrompt: meta0.checkPrompt,
  };
  if (!Array.isArray(meta.references)) fail("lesson-meta references must be an array");
  const { base, arrText } = readSections(opts.sectionsPath);
  const theoryObj = parseTheoryComment(content, opts.lessonPath);
  if (!theoryObj && !opts.theoryPath) {
    fail("no lesson-theory comment in the lesson and no --theory file");
  }
  const theory = theoryObj ? buildTheoryBody(theoryObj) : readTheory(opts.theoryPath);
  const topicId = opts.topicId || `${meta.id}-full`;
  const areaTitle = opts.areaTitle || meta.title;
  const areaDescription = opts.areaDescription || meta.summary;
  const lessonDataDir = path.join(path.dirname(opts.curriculumPath), "lesson-data");
  const lessonDataPath = path.join(lessonDataDir, `${topicId}.ts`);
  const lessonDataText = buildLessonData(topicId, arrText);
  if (fs.existsSync(lessonDataPath)) {
    fail(`lesson chunk already exists: ${lessonDataPath} (delete it to rewire, or reuse its topic id)`);
  }
  let newCurriculum = spliceCurriculum(fs.readFileSync(opts.curriculumPath, "utf8"), {
    base,
    areaId: meta.id,
    topicId,
    meta,
    theory,
    areaTitle,
    areaDescription,
  });
  let newTiers = spliceTiers(fs.readFileSync(opts.tiersPath, "utf8"), opts.tier, meta.id, Boolean(opts.front));
  if (!opts.dry) {
    fs.mkdirSync(lessonDataDir, { recursive: true });
    fs.writeFileSync(lessonDataPath, lessonDataText);
    fs.writeFileSync(opts.curriculumPath, newCurriculum);
    fs.writeFileSync(opts.tiersPath, newTiers);
  }
  const notes = [
    `area "${meta.id}" → tier "${opts.tier}"${opts.front ? " (front)" : ""}; card "${topicId}"; lazy chunk ${path.relative(path.dirname(opts.curriculumPath), lessonDataPath)} + ${base}Topics`,
  ];
  if (opts.dry) notes.push("(dry run — nothing written)");
  return notes.join("; ");
}

function selftest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wire-lesson-"));
  let checks = 0;
  const assert = (cond, label) => {
    if (!cond) fail(`selftest check failed: ${label}`);
    checks++;
  };
  try {
    const curriculum = [
      "const goTopics: readonly TopicCard[] = [",
      "  {",
      '    id: "go-core",',
      '    title: "Go",',
      '    summary: "s",',
      "    concepts: [],",
      '    practicePrompt: "p",',
      '    checkPrompt: "c",',
      "    tier: 1,",
      "    complexity: 1,",
      "    references: [],",
      "    lesson: {",
      '      problem: "x",',
      '      model: "x",',
      '      mechanics: "x",',
      "      pitfalls: [],",
      '      whenNot: "x",',
      "    },",
      "  },",
      "];",
      "",
      CURRICULUM_EXPORT,
      "  {",
      '    id: "go",',
      '    title: "Go",',
      '    description: "d",',
      "    tier: 1,",
      "    dependencies: [],",
      "    topics: goTopics,",
      "  },",
      "];",
      "",
    ].join("\n");
    const tiers =
      `export const TIERS: readonly Tier[] = [\n` +
      `  { id: "fable-5.1-high", name: "fable-5.1-high", band: "high", areas: ["kubernetes", "agi"] },\n` +
      `  { id: "fable-5.1-low", name: "fable-5.1-low", band: "low", areas: ["go"] },\n` +
      `] as const;\n`;
    const sections =
      "const testSections: readonly LessonSection[] = [\n" +
      '  { heading: "h", blocks: [{ kind: "p", text: "t" }] },\n' +
      "];\n" +
      "sections: 1\nblocks: 1\nexamples: 0\ntable rows: 0\nfences: 0\n";
    const theory = `problem: "p",\nmodel: "m",\nmechanics: "me",\npitfalls: [\n  "x",\n],\nwhenNot: "w"`;
    const meta = {
      id: "test", title: "T", summary: "S", tier: 1, complexity: 3,
      practicePrompt: "P", checkPrompt: "C", references: ["r1", "r2"], concepts: [],
    };
    const md = `<!--\nlesson-meta: ${JSON.stringify(meta)}\n-->\n# T\n`;
    const curriculumPath = path.join(dir, "curriculum.ts");
    const tiersPath = path.join(dir, "tiers.ts");
    const lessonPath = path.join(dir, "001-test.md");
    const sectionsPath = path.join(dir, "test-sections.ts");
    const theoryPath = path.join(dir, "theory.ts");
    fs.writeFileSync(curriculumPath, curriculum);
    fs.writeFileSync(tiersPath, tiers);
    fs.writeFileSync(sectionsPath, sections);
    fs.writeFileSync(theoryPath, theory);
    fs.writeFileSync(lessonPath, md);

    const note = wire({
      curriculumPath, tiersPath, lessonPath, sectionsPath, theoryPath,
      topicId: "test-first-lesson", areaTitle: "Test", areaDescription: "D",
      tier: "fable-5.1-high",
    });
    const after = fs.readFileSync(curriculumPath, "utf8");
    const tiersAfter = fs.readFileSync(tiersPath, "utf8");
    assert(note.includes("test-first-lesson"), "summary names the card");
    assert(!after.includes("const testSections"), "sections const NOT inserted into curriculum");
    assert(!after.includes("deepLesson"), "no deepLesson on the wired card");
    assert(after.includes(`topics: testTopics`), "area references the topics const");
    assert(after.includes('id: "test"'), "area entry present");
    assert(after.includes('id: "test-first-lesson"'), "topic card present");
    const chunkPath = path.join(dir, "lesson-data", "test-first-lesson.ts");
    assert(fs.existsSync(chunkPath), "lazy lesson chunk emitted");
    const chunk = fs.readFileSync(chunkPath, "utf8");
    assert(chunk.includes('import type { LessonSection } from "../curriculum";'), "chunk imports the type");
    assert(chunk.includes("export const sections: readonly LessonSection[] = ["), "chunk exports the array");
    assert(chunk.includes("export const sections: readonly LessonSection[] = [\n"), "chunk array opens cleanly (no doubled decl)");
    assert(!chunk.includes("] = [] = ["), "chunk does not splice the annotation brackets");
    assert(chunk.includes('text: "t"'), "chunk carries the array text verbatim");
    assert(tiersAfter.includes('areas: ["kubernetes", "agi", "test"]'), "tier areas appended");
    assert(!tiersAfter.includes('"kubernetes", "agi", "test", "test"'), "no duplicate area");

    let threw = false;
    try {
      wire({
        curriculumPath, tiersPath, lessonPath, sectionsPath, theoryPath,
        topicId: "test-first-lesson", areaTitle: "Test", areaDescription: "D",
        tier: "fable-5.1-high",
      });
    } catch {
      threw = true;
    }
    assert(threw, "second run is rejected (already wired)");

    const badTheoryPath = path.join(dir, "theory-bad.ts");
    fs.writeFileSync(badTheoryPath, `{ problem: "p", model: "m", mechanics: "me", pitfalls: [], whenNot: "w" }`);
    let braceThrew = false;
    try {
      wire({
        curriculumPath, tiersPath, lessonPath, sectionsPath, theoryPath: badTheoryPath,
        topicId: "test-first-lesson", areaTitle: "Test", areaDescription: "D",
        tier: "fable-5.1-high",
      });
    } catch {
      braceThrew = true;
    }
    assert(braceThrew, "brace-wrapped theory snippet is rejected");

    // --- minimal-meta wiring: chat model ships only practice/check prompts
    // and a lesson-theory comment; id/title/summary/topic/area derive ---

    const cur2 = curriculum.replace('id: "go",', 'id: "go-occupied",');
    const cur2Path = path.join(dir, "curriculum2.ts");
    const tiers2Path = path.join(dir, "tiers2.ts");
    fs.writeFileSync(cur2Path, cur2);
    fs.writeFileSync(tiers2Path, tiers);
    const miniPath = path.join(dir, "099-mini-topic.md");
    const miniMeta = { practicePrompt: "MP", checkPrompt: "MC" };
    const miniTheory = { problem: "mp", model: "mm", mechanics: "mme", pitfalls: ["mp1", "mp2"], whenNot: "mw" };
    const miniContent =
      `<!--\nlesson-meta: ${JSON.stringify(miniMeta)}\n-->\n` +
      `<!-- lesson-theory: ${JSON.stringify(miniTheory)} -->\n` +
      "# Mini Topic Title\n\nFirst paragraph drives the summary.\n\n## Part One\n\nBody text.\n";
    fs.writeFileSync(miniPath, miniContent);
    const miniNote = wire({
      curriculumPath: cur2Path, tiersPath: tiers2Path, lessonPath: miniPath,
      sectionsPath, tier: "fable-5.1-low", front: true,
    });
    const cur2After = fs.readFileSync(cur2Path, "utf8");
    const tiers2After = fs.readFileSync(tiers2Path, "utf8");
    assert(miniNote.includes("card \"mini-topic-full\""), `minimal wiring derives the card id (${miniNote})`);
    assert(cur2After.includes('id: "mini-topic"'), "minimal wiring derives the area id");
    assert(cur2After.includes('title: "Mini Topic Title"'), "card title derived from H1");
    assert(cur2After.includes('summary: "First paragraph drives the summary."'), "summary derived from the first paragraph");
    assert(cur2After.includes("tier: 1,\n    complexity: 4,"), "tier 1 / complexity 4 defaulted");
    assert(cur2After.includes("references: []"), "references defaulted to empty");
    assert(cur2After.includes('title: "Mini Topic Title"') && cur2After.includes(`description: "First paragraph drives the summary."`), "area title/description derived");
    assert(/id: "fable-5.1-low", name: "fable-5.1-low", band: "low", areas: \["mini-topic", "go"\]/.test(tiers2After), "front flag puts the area first in the tier");
    const miniChunk = fs.readFileSync(path.join(dir, "lesson-data", "mini-topic-full.ts"), "utf8");
    assert(miniChunk.includes("export const sections"), "minimal wiring emitted the lazy chunk");
    assert(cur2After.includes('"mp1"') && cur2After.includes('"mp2"'), "theory comment reached the curriculum card");
    let miniReThrew = false;
    try {
      wire({ curriculumPath: cur2Path, tiersPath: tiers2Path, lessonPath: miniPath, sectionsPath, tier: "fable-5.1-low" });
    } catch {
      miniReThrew = true;
    }
    assert(miniReThrew, "minimal wiring re-run is rejected (already wired)");

    // pre-flight: unparseable theory file (straight quotes inside a string) fails before writing
    const quoteTheoryPath = path.join(dir, "theory-quotes.ts");
    fs.writeFileSync(quoteTheoryPath, `problem: "say "hello" loudly", model: "m", mechanics: "me", pitfalls: [], whenNot: "w"`);
    const cur3Path = path.join(dir, "curriculum3.ts");
    fs.writeFileSync(cur3Path, cur2);
    let quotesThrew = false;
    try {
      wire({ curriculumPath: cur3Path, tiersPath: tiers2Path, lessonPath, sectionsPath, theoryPath: quoteTheoryPath, topicId: "never-written", tier: "fable-5.1-high" });
    } catch {
      quotesThrew = true;
    }
    assert(quotesThrew, "theory with stray straight quotes is rejected before writing");
    assert(!fs.existsSync(path.join(dir, "lesson-data", "never-written.ts")), "rejected wire wrote no chunk");
    console.log(`selftest: PASS (${checks} checks)`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selftest) return void selftest();
  for (const k of ["lesson", "sections", "tier"]) {
    if (!args[k]) fail(`missing --${k}`);
  }
  const note = wire({
    lessonPath: args.lesson,
    sectionsPath: args.sections,
    theoryPath: args.theory,
    topicId: args["topic-id"],
    areaTitle: args["area-title"],
    areaDescription: args["area-description"],
    tier: args.tier,
    front: Boolean(args.front),
    curriculumPath: args.curriculum || CURRICULUM_DEFAULT,
    tiersPath: args.tiers || TIERS_DEFAULT,
    dry: Boolean(args.dry),
  });
  console.log(`wired: ${note}`);
  console.log("next: (portfolio/) npm run typecheck && npm run build; node projects/practice-map/tests/practice-map.check.mjs");
}

try {
  main();
} catch (e) {
  console.error(`wire-lesson: ${e.message}`);
  process.exit(1);
}

#!/usr/bin/env node
// scripts/wire-lesson.mjs
// Splice a converted Practice Map lesson into web/curriculum.ts + tiers.ts.
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

function readSections(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/const (\w+)Sections: readonly LessonSection\[\] = \[/);
  if (!m) fail(`--sections ${file} is not emitted converter TS (missing "const XSections")`);
  const end = raw.lastIndexOf("];");
  if (end === -1) fail(`no closing ]; in ${file}`);
  // cut the converter's trailing report (sections: N / blocks: N / ...)
  return { base: m[1], text: raw.slice(0, end + 2).trimEnd() };
}

function readTheory(file) {
  const text = fs.readFileSync(file, "utf8");
  if (/^\s*\{/.test(text)) fail(`theory snippet ${file} must be the object BODY (fields without braces)`);
  for (const field of THEORY_FIELDS) {
    if (!new RegExp(`(^|[^\\w])${field}\\s*:`).test(text)) {
      fail(`theory snippet ${file} is missing field "${field}"`);
    }
  }
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
    "    deepLesson: {",
    `      sections: ${base}Sections,`,
    "    },",
    "  },",
    "];",
  ].join("\n");
}

function spliceCurriculum(src, { base, areaId, topicId, meta, theory, sectionsText, areaTitle, areaDescription }) {
  const first = src.indexOf(CURRICULUM_EXPORT);
  if (first === -1) fail("curriculum.ts: no `export const curriculum` anchor");
  if (src.includes(`const ${base}Sections`) || src.includes(`topics: ${base}Topics`)) {
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
  return `${src.slice(0, first).trimEnd()}\n\n${sectionsText}\n${topicsText}\n${newTail}`;
}

function spliceTiers(src, tierId, areaId) {
  const esc = tierId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\{ id: "${esc}", name: "${esc}", band: "[^"]+", areas: \\[)([^\\]]*)(\\])`);
  const m = src.match(re);
  if (!m) fail(`tiers.ts: no single-line tier entry for "${tierId}"`);
  const ids = m[2].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  if (ids.includes(areaId)) fail(`tiers.ts: "${areaId}" already in tier "${tierId}"`);
  ids.push(areaId);
  const rebuilt = m[1] + ids.map((i) => `"${i}"`).join(", ") + m[3];
  return src.slice(0, m.index) + rebuilt + src.slice(m.index + m[0].length);
}

function wire(opts) {
  const meta = parseMeta(fs.readFileSync(opts.lessonPath, "utf8"), opts.lessonPath);
  for (const k of ["id", "title", "summary", "tier", "complexity", "practicePrompt", "checkPrompt", "references"]) {
    if (meta[k] === undefined) fail(`lesson-meta missing "${k}"`);
  }
  if (!Array.isArray(meta.references)) fail("lesson-meta references must be an array");
  if (Array.isArray(meta.concepts) && meta.concepts.length) {
    console.error("wire-lesson: warning: lesson-meta has concepts — cards never display them; wiring concepts: []");
  }
  const { base, text: sectionsText } = readSections(opts.sectionsPath);
  const theory = readTheory(opts.theoryPath);
  let newCurriculum = spliceCurriculum(fs.readFileSync(opts.curriculumPath, "utf8"), {
    base,
    areaId: meta.id,
    topicId: opts.topicId,
    meta,
    theory,
    sectionsText,
    areaTitle: opts.areaTitle,
    areaDescription: opts.areaDescription,
  });
  let newTiers = spliceTiers(fs.readFileSync(opts.tiersPath, "utf8"), opts.tier, meta.id);
  if (!opts.dry) {
    fs.writeFileSync(opts.curriculumPath, newCurriculum);
    fs.writeFileSync(opts.tiersPath, newTiers);
  }
  const notes = [
    `area "${meta.id}" → tier "${opts.tier}"; card "${opts.topicId}"; consts ${base}Sections + ${base}Topics`,
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
      "const goSections: readonly LessonSection[] = [];",
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
      "    deepLesson: {",
      "      sections: goSections,",
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
    assert(after.includes("const testSections"), "sections const inserted");
    assert(after.indexOf("const testSections") < after.indexOf(CURRICULUM_EXPORT), "sections precede export");
    assert(after.indexOf("const testTopics") < after.indexOf(CURRICULUM_EXPORT), "topics precede export");
    assert(after.includes(`topics: testTopics`), "area references the topics const");
    assert(after.includes('id: "test"'), "area entry present");
    assert(after.includes('id: "test-first-lesson"'), "topic card present");
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
    console.log(`selftest: PASS (${checks} checks)`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selftest) return void selftest();
  for (const k of ["lesson", "sections", "theory", "topic-id", "area-title", "area-description", "tier"]) {
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

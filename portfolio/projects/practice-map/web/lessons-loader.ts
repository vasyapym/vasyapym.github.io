import type { DeepLesson, LessonSection } from "./curriculum";

// One chunk per lesson: the heavy section arrays live in ./lesson-data/<id>.ts
// and are fetched on first open, not shipped with the page bundle.
const modules = import.meta.glob("./lesson-data/*.ts") as Record<
  string,
  () => Promise<{ sections: readonly LessonSection[] }>
>;

export async function loadDeepLesson(topicId: string): Promise<DeepLesson> {
  const load = modules[`./lesson-data/${topicId}.ts`];
  if (!load) throw new Error(`no lesson data file for "${topicId}"`);
  const mod = await load();
  return { sections: mod.sections };
}

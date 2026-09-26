import { projectModules } from "../catalog/discover-projects";
import type { AboutCopy } from "./AboutPage";

// R033 — the owner's about copy, seated verbatim as catalogue segments.
// Superscript numbers are DERIVED from the landing's display order
// (catalog/discover-projects) so they can never drift from the index.

const catalogueNumber = (id: string): number => {
  const index = projectModules.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`about copy: unknown project id "${id}"`);
  return index + 1;
};

const project = (id: string, text: string) => ({
  n: catalogueNumber(id),
  to: `/projects/${id}/`,
  text,
});

export const aboutCopy: AboutCopy = {
  home: { to: "/", label: "Vasily Argounov" },
  lead: [
    "All eight projects live on vasyapym.github.io, each self-contained. If you'd rather meet them in the dark, switch on ",
    { em: "the deep" },
    " and they'll come to your lantern.",
  ],
  paragraphs: [
    [
      "A friend of mine loves Hello Kitty. I love the tone of Dark Souls. ",
      project("kitty-run", "Cat Runner"),
      " is where the two met.",
    ],
    [
      project("quicknotes", "Quicknotes"),
      " signs in with Google and syncs across devices, and one button copies text. Quickness is the whole feature.",
    ],
    [
      "I came to code from linguistics, so language models were always going to catch me. What holds me is watching LLM think: how it rebuilds language, and a picture of the world, out of nothing but the texts it read. That's ",
      project("practice-map", "Waste of tokens"),
      ".",
    ],
    [
      "Some things I made just to see them work. In ",
      project("raft-cluster", "raft-cluster"),
      ", Rust in WebAssembly, you crash the leader and watch the survivors vote in a new term. ",
      project("spine", "Spine"),
      " puts a Go core in WebAssembly under a flexbox and grid editor that exports clean HTML and CSS.",
    ],
    [
      "Some I made because I love how they look. ",
      project("evening-forest", "Evening Forest"),
      " is an 8-bit walk into a forest at dusk. ",
      project("explosion", "Explosion"),
      " is a paper-lantern moon breaking into 600 shards on the GPU.",
    ],
    [
      "And ",
      project("planck-to-now", "Planck to Now"),
      " lets you scrub from the first instant of the universe to this one, on a log scale. A reminder that we're all cosmic dust.",
    ],
  ],
};

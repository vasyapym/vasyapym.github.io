import { projectModules } from "../catalog/discover-projects";
import type { AboutCopy } from "./AboutPage";

// R032 — the owner's about copy, seated verbatim as catalogue segments.
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
  home: { to: "/", label: "index" },
  paragraphs: [
    [
      "A friend of mine loves Hello Kitty. I love the tone of Dark Souls: the quiet, the weight of each step. ",
      project("kitty-run", "kitty-run"),
      " is where the two met. It's a chill endless runner where the mechanics are simple and what they add up to isn't.",
    ],
    [
      "I wanted notes that are open before I finish reaching for them. ",
      project("quicknotes", "quicknotes"),
      " signs in with Google and syncs across devices, and one button copies the note as markdown. Quickness is the whole feature.",
    ],
    [
      "I came to code from linguistics, so language models were always going to catch me. They're brilliant only sometimes. What holds me is watching one think: how it rebuilds language, and a picture of the world, out of nothing but the texts it read. That's ",
      project("practice-map", "waste of tokens"),
      ".",
    ],
    [
      "Some things I made just to see them work. In ",
      project("raft-cluster", "raft-cluster"),
      ", Rust in WebAssembly, you crash the leader and watch the survivors vote in a new term. ",
      project("spine", "spine"),
      " puts a Go core in WebAssembly under a flexbox and grid editor that exports clean HTML and CSS. It's a look at what sits behind a frontend.",
    ],
    [
      "Some I made because I love how they look. ",
      project("evening-forest", "evening-forest"),
      " is an 8-bit walk into a forest at dusk. ",
      project("explosion", "explosion"),
      " is a paper-lantern moon breaking into 600 shards on the GPU.",
    ],
    [
      "And ",
      project("planck-to-now", "planck-to-now"),
      " lets you scrub from the first instant of the universe to this one, on a log scale. It's a reminder that we're all cosmic dust.",
    ],
    [
      "All eight live on vasyapym.github.io, each self-contained, each with its own tests. If you'd rather meet them in the dark, switch on ",
      { em: "the deep" },
      " and they'll come to your lantern.",
    ],
  ],
  email: "vasyapym@gmail.com",
};

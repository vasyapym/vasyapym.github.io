import { projectModules } from "../catalog/discover-projects";
import type { AboutCopy } from "./AboutPage";

// the owner's about copy, seated verbatim as catalogue segments (R039 swap).
// Superscript numbers are DERIVED from the landing's display order
// (catalog/discover-projects) so they can never drift from the index.
// The plain pasted text carries no symbols: every project mention keeps its
// ochre catalogue number here, and "the deep" keeps its special door voice.

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
    ["I love making systems work."],
    ["Eight projects live on vasyapym.github.io, and each one stands on its own: open it and it runs."],
    [
      "If you'd rather meet them in the dark, switch on ",
      { to: "/deep", deep: true, text: "the deep" },
      " and they'll come to your lantern.",
    ],
  ],
  paragraphs: [
    [
      "A friend of mine loves Hello Kitty. I love the tone of Dark Souls. ",
      project("kitty-run", "Cat Runner"),
      " is where the two met.",
    ],
    [
      project("quicknotes", "Quicknotes"),
      " is a notepad that stays out of the way. Google sign-in, sync across devices, one button to copy. Quickness is the whole feature.",
    ],
    [
      "I came to code from linguistics, so language models were always going to catch me. What holds me is watching a model rebuild a picture of the world out of nothing but the text it has read. That's ",
      project("practice-map", "Waste of tokens"),
      ".",
    ],
    [
      "Some things I made just to see them work. ",
      project("raft-cluster", "raft-cluster"),
      " is Rust compiled to WebAssembly: crash the leader and watch the survivors elect another and carry on in a new term. ",
      project("spine", "Spine"),
      " puts a Go core, also in WebAssembly, under a flexbox-and-grid editor that exports HTML and CSS clean enough to paste into whatever you're building.",
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
      " lets you scrub from the first instant of the universe to this one. The scale is logarithmic, because on a linear one all of human history fits inside the last pixel. A reminder that we're all cosmic dust, and late arrivals at that.",
    ],
    [
      "That's all eight. Where speed mattered I reached for Rust or Go and compiled to WebAssembly; where looks mattered, the GPU. If one of them caught your light, feel free to reach me.",
    ],
  ],
};

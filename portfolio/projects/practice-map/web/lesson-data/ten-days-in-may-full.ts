import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"The job offer said Scheme."},
      {"kind":"p","text":"That was the bait, and Brendan Eich took it: come to Netscape, in the spring of 1995, and put a programming language inside the web browser — Scheme, specifically: small, severe, the language MIT used to teach programming. He arrived in April."},
      {"kind":"p","text":"By the time he arrived, the offer had changed. Netscape was negotiating with Sun to put Java in the browser, and Java was going to be the serious language, for the people who built components and compiled things. The browser still needed a second language, a small one, for everyone else: the people who would type a few lines straight into an HTML page to make a button do something. Upper management had one requirement for it. It must look like Java."},
      {"kind":"p","text":"That ruled out Scheme. It also ruled out Perl, Python and Tcl. It did not rule out a new language that looked like Java on the outside and was something else on the inside, and there was, as it happened, a demo coming up. Eich had ten days."},
      {"kind":"p","text":"Ten days is not long enough to invent much. It is long enough to choose. On the inside he chose two things he already believed in. From Scheme: a function is a value — a thing you can keep in a variable, hand to another function, or give to a button to be called later. From a research language called Self: you don't need classes, because objects can simply borrow from other objects. Both choices were unfashionable in 1995, and both are still there, underneath everything added since."},
      {"kind":"p","text":"On the outside he put Java. Curly braces. Semicolons. The word new. Plain strings and numbers that are not objects, standing next to capital-letter String and Number objects that are — a split Java has, and one Eich later listed among his regrets."},
      {"kind":"p","text":"And a Date object, ported straight across from Java's java.util.Date, because that was the fastest way to have dates at all. It brought Java's habits with it, including the bad ones. Java counted months from zero and reported the year as a distance from 1900. So in JavaScript the sixth of January 2026 is written new Date(2026, 0, 6), and if you ask that date for its year with getYear(), it says 126."},
      {"kind":"p","text":"That was all of it: something small and Scheme-like wearing Java's clothes, written in ten days — and almost everything anyone has since called strange about JavaScript is one of those three facts showing through."},
      {"kind":"p","text":"The prototype had been called Mocha. In September it shipped, in the beta of Navigator 2.0, as LiveScript. In December, after a press release Netscape wrote with Sun, it was JavaScript — a name chosen for the same reason as the braces."},
      {"kind":"p","text":"What mattered about the ten days was less what happened in them than what happened next: it shipped. A language in a browser is used the day it ships, by people who do not read release notes, on pages that will never be edited again. From then on very little could be fixed by changing it; it could only be added to. When the language was standardised in June 1997, the committee wrote down what was already there, with January still at zero. It could not call the standard JavaScript, because Sun owned the name, so it settled on ECMAScript, which Eich has said sounds like a skin disease."},
      {"kind":"p","text":"getYear() is deprecated. It has been deprecated for most of its life. Every browser still answers it, because somewhere a page from 1996 is still asking."},
    ],
  },
];;

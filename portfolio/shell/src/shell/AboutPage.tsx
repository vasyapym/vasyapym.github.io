import { Fragment, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  clearProjectReturnIntent,
  readProjectReturnLandingScrollY,
  readProjectReturnPath,
  readProjectReturnScrollY,
  rememberProjectReturnIntent,
} from "./project-return-intent";
import "./about-page.css";

// R032 — "colophon": the about page reads like the back matter of an
// exhibition catalogue. One prose column on ink, a mono rail of paragraph
// marks on desktop, each project link carrying its landing catalogue number
// as an ochre superscript. No imagery, no cards, no second colour.

/* ── copy model ─────────────────────────────────────────── */

export type Segment =
  | string
  | { em: string }
  | { n: number; to: string; text: string } // project link, n = catalogue number 1–8
  | { to: string; text: string; deep?: true }; // unnumbered link; deep:true = "the deep" special voice

export type AboutCopy = {
  lead?: Segment[][];      // unnumbered opening paragraphs, above the ¶ entries
  paragraphs: Segment[][]; // numbered ¶ entries
  email?: string;          // optional sign-off; omitted when the copy has none
  home: { to: string; label: string }; // return control
};

/* ── router seam: integrator supplies this ──────────────── */

export type LinkProps = { to: string; className: string; children: ReactNode };
export type RenderLink = (props: LinkProps) => ReactNode;

const anchor: RenderLink = ({ to, className, children }) => (
  <a href={to} className={className}>{children}</a>
);

/* ── helpers ────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
const idx = (i: number) => ({ "--i": i }) as CSSProperties;
const isEm = (s: Segment): s is { em: string } => typeof s === "object" && "em" in s;
const isProject = (s: Segment): s is { n: number; to: string; text: string } =>
  typeof s === "object" && "n" in s;

function segment(seg: Segment, key: number, link: RenderLink): ReactNode {
  if (typeof seg === "string") return seg;
  if (isEm(seg)) return <em key={key}>{seg.em}</em>;
  if ("n" in seg) {
    return (
      <Fragment key={key}>
        {link({
          to: seg.to,
          className: "ab-link",
          children: (
            <>
              <span className="ab-link-t">{seg.text}</span>
              <span className="ab-n" aria-hidden="true">{pad(seg.n)}</span>
            </>
          ),
        })}
      </Fragment>
    );
  }
  return (
    <Fragment key={key}>
      {link({
        to: seg.to,
        className: seg.deep ? "ab-link ab-link--deep" : "ab-link",
        children: <span className="ab-link-t">{seg.text}</span>,
      })}
    </Fragment>
  );
}

/* ── page ───────────────────────────────────────────────── */

export default function AboutPage({
  copy,
  renderLink = anchor,
}: {
  copy: AboutCopy;
  renderLink?: RenderLink;
}) {
  const end = (copy.lead?.length ?? 0) + copy.paragraphs.length;

  // The stagger entrance belongs to the initial entry only: a return from a
  // project (the intent's path is /about) mounts settled — no text animation.
  // Seeded during render, before the restore effect consumes the intent —
  // and frozen in a ref: the effect's re-arm would flip a later render.
  const returningRef = useRef<boolean | null>(null);
  if (returningRef.current === null) {
    returningRef.current = readProjectReturnPath() === "/about";
  }
  const returning = returningRef.current;
  const enterClass = (base: string, i: number) =>
    returning ? base : `${base} ab-enter`;
  const enterStyle = (i: number) => (returning ? undefined : idx(i));

  // Returning from a project opened here: land directly at the row the
  // visitor left — pre-paint, instant (no painted frame at a wrong offset,
  // no glide). The intent's path gates it (the landing owns its own restore).
  useLayoutEffect(() => {
    if (readProjectReturnPath() !== "/about") {
      return;
    }
    const scrollY = readProjectReturnScrollY();
    const landingScrollY = readProjectReturnLandingScrollY();
    clearProjectReturnIntent();
    // Re-arm the landing's own offset (carried through the about detour) so
    // the later exit-about still restores it.
    if (landingScrollY != null) {
      rememberProjectReturnIntent(landingScrollY, "/");
    }
    if (scrollY == null) {
      return;
    }
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(Math.max(0, scrollY), maxScroll), behavior: "instant" });
  }, []);

  return (
    <div className="ab">
      <header className="ab-bar">
        <div className="ab-bar-in">
          {renderLink({
            to: copy.home.to,
            className: "ab-back",
            children: (
              <>
                <span className="ab-arrow" aria-hidden="true">←</span>
                {copy.home.label}
              </>
            ),
          })}
          <h1 className="ab-title">about</h1>
        </div>
      </header>

      <main className="ab-main">
        <div className="ab-body">
          {copy.lead?.map((p, i) => (
            <Fragment key={`lead-${i}`}>
              <span className={enterClass("ab-mark ab-mark--ghost", i)} style={enterStyle(i)} aria-hidden="true" />
              <p className={enterClass("ab-p", i)} style={enterStyle(i)}>
                {p.map((s, j) => segment(s, j, renderLink))}
              </p>
            </Fragment>
          ))}

          {copy.paragraphs.map((p, i) => (
            <Fragment key={i}>
              <span
                className={enterClass("ab-mark", i)}
                style={enterStyle(i)}
                aria-hidden="true"
              >
                ¶ {pad(i + 1)}
              </span>
              <p className={enterClass("ab-p", i)} style={enterStyle(i)}>
                {p.map((s, j) => segment(s, j, renderLink))}
              </p>
            </Fragment>
          ))}

          {copy.email && (
            <>
              <span className="ab-rule" aria-hidden="true" />
              <span className="ab-mark" aria-hidden="true" />
              <address className="ab-email" style={enterStyle(end)}>
                {copy.email}
              </address>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── integration check: expect(checkAboutCopy(copy)).toEqual([]) ── */

export function checkAboutCopy(c: AboutCopy): string[] {
  const out: string[] = [];
  const segs = c.paragraphs.flat();
  const projects = segs.filter(isProject);
  const nums = new Set(projects.map((p) => p.n));

  if (c.paragraphs.length !== 7) out.push(`paragraphs: ${c.paragraphs.length}, expected 7`);
  if (!c.lead?.length) out.push("lead missing");
  if (projects.length !== 8) out.push(`project links: ${projects.length}, expected 8`);
  if (nums.size !== projects.length || [...nums].some((n) => n < 1 || n > 8))
    out.push("catalogue numbers must be unique, 1–8");
  if (!c.home?.to) out.push("home link missing");
  return out;
}

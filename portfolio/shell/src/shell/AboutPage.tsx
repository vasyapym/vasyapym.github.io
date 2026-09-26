import { Fragment, type CSSProperties, type ReactNode } from "react";
import "./about-page.css";

// R032 — "colophon": the about page reads like the back matter of an
// exhibition catalogue. One prose column on ink, a mono rail of paragraph
// marks on desktop, each project link carrying its landing catalogue number
// as an ochre superscript. No imagery, no cards, no second colour.

/* ── copy model ─────────────────────────────────────────── */

export type Segment =
  | string
  | { em: string }
  | { n: number; to: string; text: string }; // project link, n = catalogue number 1–8

export type AboutCopy = {
  paragraphs: Segment[][]; // 7
  email: string; // rendered as the last line
  home: { to: string; label: string }; // return control = the 9th link
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

/* ── page ───────────────────────────────────────────────── */

export default function AboutPage({
  copy,
  renderLink = anchor,
}: {
  copy: AboutCopy;
  renderLink?: RenderLink;
}) {
  const end = copy.paragraphs.length;

  return (
    <div className="ab">
      <header className="ab-bar">
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
      </header>

      <main className="ab-main">
        <div className="ab-body">
          {copy.paragraphs.map((p, i) => (
            <Fragment key={i}>
              <span className="ab-mark ab-enter" style={idx(i)} aria-hidden="true">
                ¶ {pad(i + 1)}
              </span>
              <p className="ab-p ab-enter" style={idx(i)}>
                {p.map((s, j) => segment(s, j, renderLink))}
              </p>
            </Fragment>
          ))}

          <span className="ab-mark ab-end ab-enter" style={idx(end)} aria-hidden="true" />
          <address className="ab-email ab-end ab-enter" style={idx(end)}>
            {copy.email}
          </address>
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
  const ems = segs.filter(isEm).length;

  if (c.paragraphs.length !== 7) out.push(`paragraphs: ${c.paragraphs.length}, expected 7`);
  if (projects.length !== 8) out.push(`project links: ${projects.length}, expected 8`);
  if (nums.size !== projects.length || [...nums].some((n) => n < 1 || n > 8))
    out.push("catalogue numbers must be unique, 1–8");
  if (ems !== 1) out.push(`em: ${ems}, expected 1`);
  if (!c.home?.to) out.push("home link missing");
  if (!/^\S+@\S+\.\S+$/.test(c.email)) out.push("email malformed");
  return out;
}

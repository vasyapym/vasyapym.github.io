const GITHUB_URL = "https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/planck-to-now";

const FACTS = [
  ["runtime", "webgl · three.js"],
  ["span", "13.8 billion years"],
  ["controls", "orbit · zoom · scrub"],
];

export default function PlanckToNowPage() {
  return (
    <div className="planck-field">
      <section className="planck-page" aria-labelledby="planck-to-now-title">
        <header className="planck-hero">
          <h1 id="planck-to-now-title">
            13.8 billion years.
            <span>One scrub.</span>
          </h1>
          <nav className="planck-actions" aria-label="Planck to Now project links">
            <a className="planck-action-primary" href="#planck-simulation">
              Open the simulation <span aria-hidden="true">↓</span>
            </a>
            <a className="planck-action-secondary" href={GITHUB_URL} rel="noreferrer" target="_blank">
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </header>

        <section className="planck-simulation" id="planck-simulation" aria-label="Live simulation">
          <p className="planck-simulation-meta">
            live · webgl playback
            <a href="/planck-to-now/" rel="noreferrer" target="_blank">
              open standalone <span aria-hidden="true">↗</span>
            </a>
          </p>
          <iframe
            className="planck-frame"
            src="/planck-to-now/"
            title="Interactive Planck to Now cosmology simulation"
            allow="fullscreen"
          />
        </section>

        <ul className="planck-facts" aria-label="Simulation facts">
          {FACTS.map(([term, value], index) => (
            <li key={term}>
              <span>{String(index + 1).padStart(2, "0")}</span> / {term} — {value}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

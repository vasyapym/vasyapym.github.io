const GITHUB_URL = "https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/planck-to-now";

export default function PlanckToNowPage() {
  return (
    <section className="planck-to-now-page section-shell" aria-labelledby="planck-to-now-title">
      <header className="planck-to-now-hero">
        <div className="planck-to-now-hero-copy">
          <p className="eyebrow planck-to-now-eyebrow">planck-to-now · cosmology simulation</p>
          <h1 id="planck-to-now-title">
            Watch the universe
            <span>take shape.</span>
          </h1>
          <p className="planck-to-now-intro">
            Cosmic history on a logarithmic time axis — from the Planck epoch to today.
          </p>
          <nav className="planck-to-now-actions" aria-label="Planck to Now project links">
            <a className="planck-to-now-action-primary" href="#planck-to-now-simulation">
              Open simulation <span aria-hidden="true">↓</span>
            </a>
            <a
              className="planck-to-now-action-secondary"
              href={GITHUB_URL}
              rel="noreferrer"
              target="_blank"
            >
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>

        <dl className="planck-to-now-facts">
          <div>
            <dt>Runtime</dt>
            <dd>WebGL / Three.js</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>13.8 billion years</dd>
          </div>
          <div>
            <dt>Interaction</dt>
            <dd>Orbit, zoom, scrub, playback</dd>
          </div>
        </dl>
      </header>

      <section
        className="planck-to-now-simulation-shell"
        id="planck-to-now-simulation"
        aria-labelledby="planck-to-now-simulation-title"
      >
        <div className="planck-to-now-simulation-heading">
          <div>
            <p className="eyebrow planck-to-now-eyebrow">Live artifact</p>
            <h2 id="planck-to-now-simulation-title">The Big Bang in motion.</h2>
          </div>
          <a href="/planck-to-now/" rel="noreferrer" target="_blank">
            Open standalone <span aria-hidden="true">↗</span>
          </a>
        </div>
        <iframe
          className="planck-to-now-simulation-frame"
          src="/planck-to-now/"
          title="Interactive Planck to Now cosmology simulation"
          allow="fullscreen"
        />
      </section>

      <footer className="planck-to-now-footer">
        <a href={GITHUB_URL} rel="noreferrer" target="_blank">
          View source on GitHub <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </section>
  );
}

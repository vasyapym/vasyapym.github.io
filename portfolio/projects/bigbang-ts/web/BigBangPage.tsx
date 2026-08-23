const GITHUB_URL = "https://github.com/vasyapym/vasyapym.github.io/tree/main/portfolio/projects/bigbang-ts";

export default function BigBangPage() {
  return (
    <section className="bigbang-page section-shell" aria-labelledby="bigbang-title">
      <header className="bigbang-hero">
        <div className="bigbang-hero-copy">
          <p className="eyebrow bigbang-eyebrow">bigbang-ts · cosmology simulation</p>
          <h1 id="bigbang-title">
            Watch the universe
            <span>take shape.</span>
          </h1>
          <p className="bigbang-intro">
            Cosmic history on a logarithmic time axis — from the Planck epoch to today.
          </p>
          <nav className="bigbang-actions" aria-label="Big Bang project links">
            <a className="bigbang-action-primary" href="#bigbang-simulation">
              Open simulation <span aria-hidden="true">↓</span>
            </a>
            <a
              className="bigbang-action-secondary"
              href={GITHUB_URL}
              rel="noreferrer"
              target="_blank"
            >
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>

        <dl className="bigbang-facts">
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
            <dd>Orbit, zoom, playback</dd>
          </div>
        </dl>
      </header>

      <section className="bigbang-simulation-shell" id="bigbang-simulation" aria-labelledby="bigbang-simulation-title">
        <div className="bigbang-simulation-heading">
          <div>
            <p className="eyebrow bigbang-eyebrow">Live artifact</p>
            <h2 id="bigbang-simulation-title">The Big Bang in motion.</h2>
          </div>
          <a href="/bigbang-ts/" rel="noreferrer" target="_blank">
            Open standalone <span aria-hidden="true">↗</span>
          </a>
        </div>
        <iframe
          className="bigbang-simulation-frame"
          src="/bigbang-ts/"
          title="Interactive bigbang-ts cosmology simulation"
          allow="fullscreen"
        />
      </section>

      <footer className="bigbang-footer">
        <a href={GITHUB_URL} rel="noreferrer" target="_blank">
          View source on GitHub <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </section>
  );
}

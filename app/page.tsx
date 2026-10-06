import Link from "next/link";
import { TrackExperiment } from "./track-experiment";

export default function Home() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#experiment">Skip to experiment</a>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Continuity home">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 4H7a3 3 0 0 0-3 3v8M9 20h8a3 3 0 0 0 3-3V9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 9h6v6H9z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          continuity
        </Link>
        <a className="source-link" href="https://github.com/francozeta/continuity">
          View source <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="experiment" tabIndex={-1}>
        <div className="experiment-heading">
          <div>
            <p className="eyebrow">Interaction study / 001</p>
            <h1>A track, uninterrupted.</h1>
          </div>
          <p className="instruction">Open the track. Take it further.<br />Bring it back.</p>
        </div>
        <TrackExperiment />
      </main>
      <footer className="site-footer">
        <p>Preserve identity, not animations.</p>
        <p>An experiment by <a href="https://github.com/francozeta">Franco Zeta <span aria-hidden="true">↗</span></a></p>
      </footer>
    </div>
  );
}

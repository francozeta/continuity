import { TrackExperiment } from "./track-experiment";

export default function Home() {
  return (
    <main id="experiment" aria-label="Continuity music experiment">
      <h1 className="sr-only">Continuity music experiment</h1>
      <TrackExperiment />
    </main>
  );
}

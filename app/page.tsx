import { BeetlePreview } from "./beetle-preview";
import "./beetle.css";

export default function Home() {
  return (
    <main className="beetle-stage" aria-label="Beetle component preview">
      <BeetlePreview />
    </main>
  );
}

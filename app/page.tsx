import type { Metadata } from "next";
import { BeetlePreview } from "./beetle-preview";
import "./beetle.css";

export const metadata: Metadata = {
  title: "Beetle — Continuity",
  description: "A component-only study of identity and state across surfaces.",
};

export default function Home() {
  return (
    <main className="beetle-stage" aria-label="Beetle component preview">
      <BeetlePreview />
    </main>
  );
}

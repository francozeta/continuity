import type { Metadata } from "next";
import { BrightnessProof } from "./brightness-proof";
import "./beetle.css";

export const metadata: Metadata = {
  title: "Beetle — Linked brightness",
  description: "One brightness control for a photograph or a pair.",
};

export default function BeetlePage() {
  return (
    <main className="beetle-stage">
      <h1 className="sr-only">Photo brightness</h1>
      <BrightnessProof />
    </main>
  );
}

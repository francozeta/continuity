import type { Metadata } from "next";
import { BeetleExperiment } from "./beetle/experiment";

export const metadata: Metadata = {
  title: "Beetle — Continuity",
  description: "A touch interaction experiment using checklists.",
};

export default function Home() {
  return <BeetleExperiment />;
}

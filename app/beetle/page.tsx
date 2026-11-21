import type { Metadata } from "next";
import { PlayerStudy } from "./player-study";
import "./player.css";

export const metadata: Metadata = {
  title: "Beetle — Persistent player",
  description: "One recording in a compact and expanded player.",
};

export default function BeetlePage() {
  return (
    <main className="beetle-player-stage">
      <div className="beetle-player-anchor">
        <PlayerStudy />
      </div>
    </main>
  );
}

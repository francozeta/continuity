import { MusicProvider } from "./music-provider";
import { MusicShell } from "./music-shell";
import "./music.css";

export const metadata = { title: "Music — Continuity reference client" };

export default function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MusicProvider>
      <MusicShell>{children}</MusicShell>
    </MusicProvider>
  );
}

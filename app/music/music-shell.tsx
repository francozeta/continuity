"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Music2, Search, ArrowUpLeft, Images } from "lucide-react";
import { type ReactNode } from "react";
import { MusicPlayer } from "./music-player";

export function MusicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="music-app">
      <a className="music-skip" href="#music-content">
        Skip to content
      </a>
      <aside className="music-sidebar">
        <Link href="/music" className="music-brand" aria-label="Music library">
          <Music2 className="size-6" aria-hidden="true" />
          Music
        </Link>
        <nav aria-label="Music navigation">
          <Link
            href="/music"
            aria-current={
              pathname === "/music" || pathname.startsWith("/music/album/")
                ? "page"
                : undefined
            }
          >
            <Library className="size-[18px]" aria-hidden="true" />
            Library
          </Link>
          <Link
            href="/music/search"
            aria-current={pathname === "/music/search" ? "page" : undefined}
          >
            <Search className="size-[18px]" aria-hidden="true" />
            Search
          </Link>
          <Link href="/photos">
            <Images className="size-[18px]" aria-hidden="true" />
            Photos
          </Link>
        </nav>
        <Link className="music-demo-link" href="/">
          <ArrowUpLeft className="size-4" aria-hidden="true" />
          Continuity demo
        </Link>
      </aside>
      <main id="music-content" className="music-content" tabIndex={-1}>
        {children}
      </main>
      <MusicPlayer />
    </div>
  );
}

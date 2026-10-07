"use client";

import Image from "next/image";
import Link from "next/link";
import { MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Pause,
  Play,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { appleMusicTracks } from "../apple-music-tracks";

const albumTrack = appleMusicTracks[0];

function ScrollScene({
  kind,
  title,
  subtitle,
  artwork,
  primary,
  secondary,
  children,
}: {
  kind: "album" | "profile";
  title: string;
  subtitle: string;
  artwork: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const reducedMotion = useReducedMotionPreference();
  useEffect(() => {
    const viewport = viewportRef.current!;
    const update = () => {
      const next = compactRef.current
        ? viewport.scrollTop > 100
        : viewport.scrollTop >= 160;
      if (next !== compactRef.current) {
        compactRef.current = next;
        setCompact(next);
      }
    };
    viewport.addEventListener("scroll", update, { passive: true });
    return () => viewport.removeEventListener("scroll", update);
  }, []);
  return (
    <MotionConfig
      transition={{
        layout: reducedMotion
          ? { type: false, duration: 0 }
          : { type: "spring", stiffness: 330, damping: 34, mass: 0.85 },
      }}
    >
      <motion.div
        ref={viewportRef}
        layoutScroll
        className="scroll-scene"
        data-kind={kind}
        data-compact={compact}
        role="region"
        aria-label={`${title} scroll preview`}
        tabIndex={0}
      >
        <motion.header layoutRoot className="scroll-identity">
          <motion.div
            layout
            className="scroll-art"
            aria-hidden="true"
            animate={{ opacity: compact ? 0 : 1 }}
            transition={{ opacity: { duration: reducedMotion ? 0 : 0.14 } }}
          >
            {artwork}
          </motion.div>
          <motion.div layout className="scroll-title">
            <motion.h2 layout="position">{title}</motion.h2>
          </motion.div>
          <div className="scroll-subtitle" aria-hidden={compact}>
            {subtitle}
          </div>
          <motion.div layout className="scroll-primary">
            {primary}
          </motion.div>
          {secondary && (
            <motion.div layout className="scroll-secondary">
              {secondary}
            </motion.div>
          )}
        </motion.header>
        <div className="scroll-hero-space" aria-hidden="true" />
        <div className="scroll-content">{children}</div>
      </motion.div>
    </MotionConfig>
  );
}

function AlbumExample() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  function togglePreview() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setError("");
      if (audio.ended) audio.currentTime = 0;
      void audio
        .play()
        .catch(() =>
          setError(
            "This preview is unavailable. Open the album on Apple Music.",
          ),
        );
    } else audio.pause();
  }
  return (
    <section className="scroll-example" aria-labelledby="album-example-label">
      <div className="scroll-example-label">
        <h1 id="album-example-label">Album</h1>
        <span>Scroll to explore</span>
      </div>
      <ScrollScene
        kind="album"
        title={albumTrack.album}
        subtitle={`${albumTrack.artist} · Audio preview`}
        artwork={
          <Image
            src={albumTrack.artwork}
            alt=""
            width={180}
            height={180}
            sizes="180px"
            draggable={false}
          />
        }
        primary={
          <Button
            className="scroll-play"
            aria-label={playing ? "Pause album preview" : "Play album preview"}
            onClick={togglePreview}
          >
            {playing ? (
              <Pause
                className="size-5"
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
            ) : (
              <Play
                className="size-5"
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
            )}
          </Button>
        }
        secondary={
          <Button
            variant="ghost"
            className="scroll-save"
            aria-label={saved ? "Unsave album" : "Save album"}
            aria-pressed={saved}
            onClick={() => setSaved((value) => !value)}
          >
            <Star
              className="size-5"
              fill={saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </Button>
        }
      >
        <div className="scroll-track-row">
          <span>01</span>
          <div>
            <h3>{albumTrack.title}</h3>
            <p>{albumTrack.artist}</p>
          </div>
          <small>Preview</small>
        </div>
        <section className="scroll-album-about">
          <p className="scroll-eyebrow">Underworld</p>
          <h3>A Hundred Days Off</h3>
          <p>
            One track from the public Apple Music catalog. Save the album or
            play its short preview while you explore.
          </p>
          <a href={albumTrack.url} target="_blank" rel="noreferrer">
            Listen on Apple Music{" "}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </section>
        <div className="scroll-album-art" aria-hidden="true">
          <Image
            src={albumTrack.artwork}
            alt=""
            width={500}
            height={500}
            sizes="(max-width: 640px) 80vw, 360px"
          />
        </div>
      </ScrollScene>
      <audio
        ref={audioRef}
        src={albumTrack.preview}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setError(
            "This preview is unavailable. Open the album on Apple Music.",
          );
        }}
      />
      <p className={error ? "scroll-error" : "sr-only"} role="status">
        {error}
      </p>
    </section>
  );
}

function ProfileExample() {
  const [following, setFollowing] = useState(false);
  return (
    <section className="scroll-example" aria-labelledby="profile-example-label">
      <div className="scroll-example-label">
        <h1 id="profile-example-label">Profile</h1>
        <span>Local interaction</span>
      </div>
      <ScrollScene
        kind="profile"
        title="Continuity"
        subtitle="@continuity · Interface experiments"
        artwork={<span className="scroll-avatar">c.</span>}
        primary={
          <Button
            variant="outline"
            className="scroll-follow"
            aria-pressed={following}
            onClick={() => setFollowing((value) => !value)}
          >
            {following && <Check className="size-4" aria-hidden="true" />}
            {following ? "Following" : "Follow"}
          </Button>
        }
      >
        <section className="scroll-profile-about">
          <h3>Interfaces should remember where things came from.</h3>
          <p>Identity stays. Presentation changes.</p>
          <a
            href="https://github.com/francozeta/continuity"
            target="_blank"
            rel="noreferrer"
          >
            francozeta/continuity{" "}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </section>
        <div className="scroll-profile-posts">
          <article>
            <p className="scroll-eyebrow">01 · Music</p>
            <h3>From MiniPlayer to Now Playing.</h3>
            <p>
              The track keeps playing as its context opens, closes and changes.
            </p>
            <Link href="/music">
              Open Music <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
          <article>
            <p className="scroll-eyebrow">02 · Photos</p>
            <h3>A closer look, then back.</h3>
            <p>
              Open a photo, add a caption and return to its place in the
              collection.
            </p>
            <Link href="/photos">
              Open Photos <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
          <article>
            <p className="scroll-eyebrow">03 · Context</p>
            <h3>Keep the useful parts in reach.</h3>
            <p>
              The same title and action settle into the header as you scroll.
            </p>
          </article>
        </div>
      </ScrollScene>
    </section>
  );
}

export function ScrollExamples() {
  return (
    <div className="examples-app">
      <nav className="examples-navigation" aria-label="Reference examples">
        <Link href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Continuity
        </Link>
        <div>
          <Link href="/music">Music</Link>
          <Link href="/photos">Photos</Link>
          <Link href="/examples" aria-current="page">
            Examples
          </Link>
        </div>
      </nav>
      <main>
        <div className="scroll-examples">
          <AlbumExample />
          <ProfileExample />
        </div>
      </main>
    </div>
  );
}

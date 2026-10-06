"use client";

import Image from "next/image";
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

type TrackState = "compact" | "preview" | "player";

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d={direction === "left" ? "m11 5-7 7 7 7M4 12h16" : "m13 5 7 7-7 7M20 12H4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrackExperiment() {
  const [state, setState] = useState<TrackState>("compact");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [position, setPosition] = useState(84);
  const prefersReducedMotion = useReducedMotion();
  const openRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"open" | "back" | "expand" | null>(null);

  function changeState(next: TrackState) {
    pendingFocus.current = next === "compact" ? "open" : state === "player" ? "expand" : "back";
    setState(next);
  }

  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const target = pendingFocus.current === "open" ? openRef : pendingFocus.current === "expand" ? expandRef : backRef;
    target.current?.focus({ preventScroll: true });
    pendingFocus.current = null;
  }, [state]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 330, damping: 34, mass: 0.85 };

  return (
    <MotionConfig reducedMotion="user" transition={{ layout: transition }}>
      <LayoutGroup id="track-experiment">
        <div className="experiment-canvas" data-state={state}>
          <div className="canvas-heading"><span>On repeat</span><span className="eyebrow">A quiet collection</span></div>
          <div className="track-stage">
            <motion.section
              layout={!prefersReducedMotion}
              className="track-surface"
              data-state={state}
              style={{ borderRadius: state === "compact" ? 12 : 20 }}
              aria-label={`Teardrop ${state}`}
              onKeyDown={(event) => {
                if (event.key === "Escape" && state !== "compact") {
                  event.preventDefault();
                  changeState(state === "player" ? "preview" : "compact");
                }
              }}
            >
              <motion.div className="track-cover" layoutId="track:teardrop:cover" layout={!prefersReducedMotion} style={{ borderRadius: 6 }}>
                <Image src="/teardrop-study.svg" alt="Original study artwork: a pale orbit around a dark, etched sphere" width={640} height={640} priority draggable={false} />
              </motion.div>
              <motion.h2 className="track-title" layoutId="track:teardrop:title" layout={!prefersReducedMotion}>Teardrop</motion.h2>
              <motion.p className="track-artist" layoutId="track:teardrop:artist" layout={!prefersReducedMotion}>Massive Attack</motion.p>
              <button ref={openRef} className="track-open" type="button" hidden={state !== "compact"} aria-expanded={state !== "compact"} aria-controls="track-details" aria-label="Preview Teardrop by Massive Attack" onClick={() => changeState("preview")}>
                <span className="open-arrow"><Arrow /></span>
              </button>
              <button ref={backRef} className="back-button icon-button" type="button" hidden={state === "compact"} aria-label={state === "player" ? "Back to preview" : "Close preview"} onClick={() => changeState(state === "player" ? "preview" : "compact")}>
                {state === "player" ? <Arrow direction="left" /> : <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </button>
              <motion.p className="player-context eyebrow" hidden={state !== "player"} initial={false} animate={{ opacity: state === "player" ? 1 : 0 }} transition={{ duration: 0.16 }}>Now playing / 03</motion.p>
              <motion.div id="track-details" className="track-details" hidden={state === "compact"} initial={false} animate={{ opacity: state === "compact" ? 0 : 1 }} transition={{ duration: 0.16 }}>
                <p className="track-album">Mezzanine <span aria-hidden="true">·</span> 1998</p>
                <p className="track-duration">04:30 <span> / Track 03</span></p>
              </motion.div>
              <motion.div className="track-timeline" hidden={state !== "player"} initial={false} animate={{ opacity: state === "player" ? 1 : 0 }} transition={{ duration: 0.16 }}>
                <label className="sr-only" htmlFor="track-position">Playback position (silent demo)</label>
                <input id="track-position" type="range" min={0} max={270} step={1} value={position} aria-valuetext={`${Math.floor(position / 60)} minutes ${position % 60} seconds of 4 minutes 30 seconds`} onChange={(event) => setPosition(Number(event.target.value))} />
                <div className="timeline-times" aria-hidden="true"><span>{formatTime(position)}</span><span>04:30</span></div>
              </motion.div>
              <motion.div className="track-controls" hidden={state === "compact"} initial={false} animate={{ opacity: state === "compact" ? 0 : 1 }} transition={{ duration: 0.16 }}>
                <button className="play-button" type="button" aria-label={isPlaying ? "Pause Teardrop (silent demo)" : "Play Teardrop (silent demo)"} aria-pressed={isPlaying} onClick={() => setIsPlaying(!isPlaying)}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">{isPlaying ? <path d="M7 5h4v14H7zm6 0h4v14h-4z" /> : <path d="m8 4 13 8-13 8z" />}</svg>
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                </button>
                <button className="save-button icon-button" type="button" aria-label={isSaved ? "Remove Teardrop from saved tracks" : "Save Teardrop"} aria-pressed={isSaved} onClick={() => setIsSaved(!isSaved)}>
                  <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"}><path d="M6 4h12v17l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                </button>
                <button className="icon-button restart-button" type="button" hidden={state !== "player"} aria-label="Restart Teardrop (silent demo)" onClick={() => setPosition(0)}>
                  <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </motion.div>
              <button ref={expandRef} className="expand-button" type="button" hidden={state !== "preview"} onClick={() => changeState("player")}>
                Open player <Arrow />
              </button>
            </motion.section>
          </div>
          <p className="canvas-note">{state === "compact" ? "One track. Start here." : state === "preview" ? "A closer look. Keep going." : "More space. Still the same track."}</p>
        </div>
        <div className="experiment-caption">
          <ol className="state-path" aria-label="Track presentation">
            <li aria-current={state === "compact" ? "step" : undefined}><span>01</span> Compact</li>
            <li className="path-divider" aria-hidden="true">↔</li>
            <li aria-current={state === "preview" ? "step" : undefined}><span>02</span> Preview</li>
            <li className="path-divider" aria-hidden="true">↔</li>
            <li aria-current={state === "player" ? "step" : undefined}><span>03</span> Player</li>
          </ol>
          <p>Static track. Silent playback. Original study artwork.</p>
        </div>
        <p className="sr-only" role="status">{state === "compact" ? "" : `Teardrop ${state} opened.`}</p>
      </LayoutGroup>
    </MotionConfig>
  );
}

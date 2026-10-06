"use client";

import Image from "next/image";
import { LayoutGroup, MotionConfig, arc, motion } from "motion/react";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

type TrackState = "compact" | "preview" | "player";

// Route the labels around the cover. Explicit directions keep the return bend
// on the same side without sharing an automatic path's direction memory.
const labelsToPlayer = arc({ strength: 1.2, direction: "ccw" });
const labelsToPreview = arc({ strength: 1.2, direction: "cw" });

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

// Motion 14's hook snapshots this preference at mount. Subscribe to the browser
// so changing the OS setting also updates an already-open experiment.
function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(reducedMotionQuery);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerReducedMotionSnapshot() {
  return true;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={
          direction === "left"
            ? "m11 5-7 7 7 7M4 12h16"
            : "m13 5 7 7-7 7M20 12H4"
        }
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrackExperiment() {
  const [state, setState] = useState<TrackState>("compact");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [position, setPosition] = useState(84);
  const labelPath = state === "player" ? labelsToPlayer : labelsToPreview;
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const openRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"open" | "back" | "expand" | null>(null);

  function changeState(next: TrackState) {
    pendingFocus.current =
      next === "compact" ? "open" : state === "player" ? "expand" : "back";
    setState(next);
  }

  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const target =
      pendingFocus.current === "open"
        ? openRef
        : pendingFocus.current === "expand"
          ? expandRef
          : backRef;
    target.current?.focus();
    pendingFocus.current = null;
  }, [state]);

  const transition = prefersReducedMotion
    ? { type: false as const, duration: 0 }
    : { type: "spring" as const, stiffness: 330, damping: 34, mass: 0.85 };

  return (
    // Keep projection identities stable: Motion 14 snapshots layout options at
    // creation. A reactive instant transition reduces travel without remounting.
    <MotionConfig transition={{ layout: transition }}>
      <LayoutGroup id="track-experiment">
        <div className="experiment-canvas" data-state={state}>
          <div className="canvas-heading">
            <span>On repeat</span>
            <span className="eyebrow">A quiet collection</span>
          </div>
          <div className="track-stage">
            <motion.section
              id="track-details"
              layout
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
              <motion.div
                className="track-cover"
                layoutId="track:teardrop:cover"
                layout
                style={{ borderRadius: 6 }}
              >
                <Image
                  src="/teardrop-study.svg"
                  alt="Original study artwork: a pale orbit around a dark, etched sphere"
                  width={640}
                  height={640}
                  priority
                  draggable={false}
                />
              </motion.div>
              <motion.div
                className="track-identity"
                layout
                layoutAnchor={false}
                transition={{
                  layout: {
                    ...transition,
                    path: prefersReducedMotion ? undefined : labelPath,
                  },
                }}
              >
                <motion.h2
                  className="track-title"
                  layoutId="track:teardrop:title"
                  layout
                >
                  Teardrop
                </motion.h2>
                <motion.p
                  className="track-artist"
                  layoutId="track:teardrop:artist"
                  layout
                >
                  Massive Attack
                </motion.p>
              </motion.div>
              <button
                ref={openRef}
                className="track-open"
                type="button"
                hidden={state !== "compact"}
                aria-expanded={state !== "compact"}
                aria-controls="track-details"
                aria-label="Preview Teardrop by Massive Attack"
                onClick={() => changeState("preview")}
              >
                <span className="open-arrow">
                  <Arrow />
                </span>
              </button>
              {state !== "compact" && (
                <>
                  <motion.button
                    layout="position"
                    layoutAnchor={{ x: 1, y: 0 }}
                    ref={backRef}
                    className="back-button icon-button"
                    type="button"
                    aria-label={
                      state === "player" ? "Back to preview" : "Close preview"
                    }
                    onClick={() =>
                      changeState(state === "player" ? "preview" : "compact")
                    }
                  >
                    {state === "player" ? (
                      <Arrow direction="left" />
                    ) : (
                      <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="m6 6 12 12M6 18 18 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </motion.button>
                  {state === "player" && (
                    <motion.p
                      layout="position"
                      className="player-context eyebrow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, layout: transition }}
                    >
                      Now playing / 03
                    </motion.p>
                  )}
                  <motion.div
                    key={state}
                    layout="position"
                    className="track-details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.12,
                      duration: 0.16,
                      layout: transition,
                    }}
                  >
                    <p className="track-album">
                      Mezzanine <span aria-hidden="true">·</span> 1998
                    </p>
                    <p className="track-duration">
                      04:30 <span> / Track 03</span>
                    </p>
                  </motion.div>
                  {state === "player" && (
                    <motion.div
                      layout="position"
                      className="track-timeline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, layout: transition }}
                    >
                      <label className="sr-only" htmlFor="track-position">
                        Playback position (silent demo)
                      </label>
                      <input
                        id="track-position"
                        type="range"
                        min={0}
                        max={270}
                        step={1}
                        value={position}
                        aria-valuetext={`${Math.floor(position / 60)} minutes ${position % 60} seconds of 4 minutes 30 seconds`}
                        onChange={(event) =>
                          setPosition(Number(event.target.value))
                        }
                      />
                      <div className="timeline-times" aria-hidden="true">
                        <span>{formatTime(position)}</span>
                        <span>04:30</span>
                      </div>
                    </motion.div>
                  )}
                  <motion.div
                    layout="position"
                    className="track-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16, layout: transition }}
                  >
                    <button
                      className="play-button"
                      type="button"
                      aria-label={
                        isPlaying
                          ? "Pause Teardrop (silent demo)"
                          : "Play Teardrop (silent demo)"
                      }
                      aria-pressed={isPlaying}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        {isPlaying ? (
                          <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
                        ) : (
                          <path d="m8 4 13 8-13 8z" />
                        )}
                      </svg>
                      <span>{isPlaying ? "Pause" : "Play"}</span>
                    </button>
                    <button
                      className="save-button icon-button"
                      type="button"
                      aria-label={
                        isSaved
                          ? "Remove Teardrop from saved tracks"
                          : "Save Teardrop"
                      }
                      aria-pressed={isSaved}
                      onClick={() => setIsSaved(!isSaved)}
                    >
                      <svg
                        aria-hidden="true"
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "currentColor" : "none"}
                      >
                        <path
                          d="M6 4h12v17l-6-4-6 4V4Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {state === "player" && (
                      <button
                        className="icon-button restart-button"
                        type="button"
                        aria-label="Restart Teardrop (silent demo)"
                        onClick={() => setPosition(0)}
                      >
                        <svg
                          aria-hidden="true"
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M4 10a8 8 0 1 1 1 8M4 4v6h6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </motion.div>
                  {state === "preview" && (
                    <motion.button
                      layout="position"
                      ref={expandRef}
                      className="expand-button"
                      type="button"
                      onClick={() => changeState("player")}
                    >
                      Open player <Arrow />
                    </motion.button>
                  )}
                </>
              )}
            </motion.section>
          </div>
          <p className="canvas-note">
            {state === "compact"
              ? "One track. Start here."
              : state === "preview"
                ? "A closer look. Keep going."
                : "More space. Still the same track."}
          </p>
        </div>
        <div className="experiment-caption">
          <ol className="state-path" aria-label="Track presentation">
            <li aria-current={state === "compact" ? "step" : undefined}>
              <span>01</span> Compact
            </li>
            <li className="path-divider" aria-hidden="true">
              ↔
            </li>
            <li aria-current={state === "preview" ? "step" : undefined}>
              <span>02</span> Preview
            </li>
            <li className="path-divider" aria-hidden="true">
              ↔
            </li>
            <li aria-current={state === "player" ? "step" : undefined}>
              <span>03</span> Player
            </li>
          </ol>
          <p>Static track. Silent playback. Original study artwork.</p>
        </div>
        <p className="sr-only" role="status">
          {state === "compact" ? "" : `Teardrop ${state} opened.`}
        </p>
      </LayoutGroup>
    </MotionConfig>
  );
}

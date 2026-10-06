"use client";

import Image from "next/image";
import { LayoutGroup, MotionConfig, arc, motion } from "motion/react";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type TrackState = "compact" | "preview" | "player";
const MotionButton = motion.create(Button);

// Route the labels around the cover. Explicit directions keep the return bend
// on the same side without sharing an automatic path's direction memory.
const labelsToPlayer = arc({ strength: 1.35, direction: "ccw" });
const labelsToPreview = arc({ strength: 1.35, direction: "cw" });

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
        <div className="track-stage" data-state={state}>
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
            <Button
              variant="ghost"
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
                <ArrowRight
                  aria-hidden="true"
                  className="size-[18px]"
                  strokeWidth={1.5}
                />
              </span>
            </Button>
            {state !== "compact" && (
              <>
                <MotionButton
                  variant="ghost"
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
                    <ArrowLeft
                      aria-hidden="true"
                      className="size-[18px]"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <X
                      aria-hidden="true"
                      className="size-[18px]"
                      strokeWidth={1.5}
                    />
                  )}
                </MotionButton>
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
                    <Slider
                      id="track-position"
                      min={0}
                      max={270}
                      step={1}
                      value={[position]}
                      getAriaLabel={() => "Playback position (silent demo)"}
                      getAriaValueText={(_, value) =>
                        `${Math.floor(value / 60)} minutes ${value % 60} seconds of 4 minutes 30 seconds`
                      }
                      onValueChange={(value) =>
                        setPosition(typeof value === "number" ? value : value[0])
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
                  <Button
                    variant="ghost"
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
                    <span
                      className="t-icon-swap"
                      data-state={isPlaying ? "b" : "a"}
                      aria-hidden="true"
                    >
                      <span className="t-icon" data-icon="a">
                        <Play
                          className="size-[18px]"
                          fill="currentColor"
                          strokeWidth={0}
                        />
                      </span>
                      <span className="t-icon" data-icon="b">
                        <Pause
                          className="size-[18px]"
                          fill="currentColor"
                          strokeWidth={0}
                        />
                      </span>
                    </span>
                    <span className="play-label">
                      {isPlaying ? "Pause" : "Play"}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
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
                    <Bookmark
                      aria-hidden="true"
                      className="size-[19px]"
                      fill={isSaved ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  </Button>
                  {state === "player" && (
                    <Button
                      variant="ghost"
                      className="icon-button restart-button"
                      type="button"
                      aria-label="Restart Teardrop (silent demo)"
                      onClick={() => setPosition(0)}
                    >
                      <RotateCcw
                        aria-hidden="true"
                        className="size-[19px]"
                        strokeWidth={1.5}
                      />
                    </Button>
                  )}
                </motion.div>
                {state === "preview" && (
                  <MotionButton
                    variant="ghost"
                    layout="position"
                    ref={expandRef}
                    className="expand-button"
                    type="button"
                    onClick={() => changeState("player")}
                  >
                    Open player{" "}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-[18px]"
                      strokeWidth={1.5}
                    />
                  </MotionButton>
                )}
              </>
            )}
          </motion.section>
        </div>
        <p className="sr-only" role="status">
          {state === "compact" ? "" : `Teardrop ${state} opened.`}
        </p>
      </LayoutGroup>
    </MotionConfig>
  );
}

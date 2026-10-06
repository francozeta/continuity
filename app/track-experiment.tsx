"use client";

import { LayoutGroup, MotionConfig, arc, motion } from "motion/react";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";

type TrackState = "compact" | "preview" | "player";
const MotionButton = motion.create(Button);
const MotionSkeleton = motion.create(Skeleton);
// Keep the text beside the cover until it reaches the player's lower composition.
const toPlayer = arc({ strength: 1.35, direction: "cw" });
const toPreview = arc({ strength: 0.9, direction: "ccw" });
const toNarrowPreview = arc({ strength: 1.8, direction: "ccw" });

// Motion 14's hook snapshots this preference at mount. Subscribe to the browser
// so changing the OS setting also updates an already-open experiment.
function mediaPreference(query: string, serverValue: boolean) {
  return {
    subscribe(onChange: () => void) {
      const preference = window.matchMedia(query);
      preference.addEventListener("change", onChange);
      return () => preference.removeEventListener("change", onChange);
    },
    getSnapshot: () => window.matchMedia(query).matches,
    getServerSnapshot: () => serverValue,
  };
}
const reducedMotionPreference = mediaPreference(
  "(prefers-reduced-motion: reduce)",
  true,
);
const narrowViewportPreference = mediaPreference("(max-width: 640px)", false);

export function TrackExperiment() {
  const [state, setState] = useState<TrackState>("compact");
  const [previousState, setPreviousState] = useState<TrackState>("compact");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [position, setPosition] = useState(0);
  const prefersReducedMotion = useSyncExternalStore(
    reducedMotionPreference.subscribe,
    reducedMotionPreference.getSnapshot,
    reducedMotionPreference.getServerSnapshot,
  );
  const isNarrow = useSyncExternalStore(
    narrowViewportPreference.subscribe,
    narrowViewportPreference.getSnapshot,
    narrowViewportPreference.getServerSnapshot,
  );
  const openRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"open" | "back" | "expand" | null>(null);

  function changeState(next: TrackState) {
    setPreviousState(state);
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
            style={{
              borderRadius:
                state === "compact" ? 22 : state === "preview" ? 28 : 34,
            }}
            aria-label={`Track ${state}`}
            aria-describedby="track-demo-description"
            onKeyDown={(event) => {
              if (event.key === "Escape" && state !== "compact") {
                event.preventDefault();
                changeState(state === "player" ? "preview" : "compact");
              }
            }}
          >
            <MotionSkeleton
              className="track-cover"
              layoutId="track:cover"
              layout
              style={{ borderRadius: state === "compact" ? 10 : 18 }}
              aria-hidden="true"
            />
            <motion.div
              className="track-identity"
              layout
              layoutAnchor={false}
              aria-hidden="true"
              transition={{
                layout: {
                  ...transition,
                  path: prefersReducedMotion
                    ? undefined
                    : state === "player"
                      ? toPlayer
                      : state === "preview"
                        ? isNarrow && previousState === "player"
                          ? toNarrowPreview
                          : toPreview
                        : undefined,
                },
              }}
            >
              <MotionSkeleton
                className="track-title"
                layoutId="track:title"
                layout
                style={{ borderRadius: 6 }}
              />
              <MotionSkeleton
                className="track-artist"
                layoutId="track:artist"
                layout
                style={{ borderRadius: 6 }}
              />
            </motion.div>
            <Button
              variant="ghost"
              ref={openRef}
              className="track-open"
              type="button"
              hidden={state !== "compact"}
              aria-expanded={state !== "compact"}
              aria-controls="track-details"
              aria-label="Open preview"
              onClick={() => changeState("preview")}
            >
              <span className="open-arrow">
                <ArrowUpRight
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
                  layoutAnchor={{ x: 0.5, y: 0 }}
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
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={2}
                  />
                </MotionButton>
                {state === "preview" && (
                  <motion.div
                    key={state}
                    layout="position"
                    className="track-details"
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.12,
                      duration: 0.16,
                      layout: transition,
                    }}
                  >
                    <span />
                    <span />
                  </motion.div>
                )}
                {state === "player" && (
                  <motion.div
                    layout="position"
                    className="track-timeline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16, layout: transition }}
                  >
                    <Slider
                      id="track-progress"
                      min={0}
                      max={100}
                      step={1}
                      value={[position]}
                      getAriaLabel={() => "Progress"}
                      getAriaValueText={(_, value) => `${value}%`}
                      onValueChange={(value) =>
                        setPosition(
                          typeof value === "number" ? value : value[0],
                        )
                      }
                    />
                    <div className="timeline-times" aria-hidden="true">
                      <span />
                      <span />
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
                    className="favorite-button icon-button"
                    type="button"
                    aria-label={
                      isFavorite ? "Remove from favorites" : "Favorite"
                    }
                    aria-pressed={isFavorite}
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Star
                      aria-hidden="true"
                      className="size-[19px]"
                      fill={isFavorite ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    className="play-button"
                    type="button"
                    aria-label={isPlaying ? "Pause" : "Play"}
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
                  </Button>
                  <Button
                    variant="ghost"
                    className="icon-button restart-button"
                    type="button"
                    aria-label="Reset progress"
                    onClick={() => setPosition(0)}
                  >
                    <RotateCcw
                      aria-hidden="true"
                      className="size-[19px]"
                      strokeWidth={1.5}
                    />
                  </Button>
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
                    Open player
                  </MotionButton>
                )}
              </>
            )}
          </motion.section>
        </div>
        <p id="track-demo-description" className="sr-only">
          Interactive track layout prototype with static placeholders. Controls
          demonstrate state changes without audio.
        </p>
        <p className="sr-only" role="status">
          {state === "compact" ? "" : `Track ${state} opened.`}
        </p>
      </LayoutGroup>
    </MotionConfig>
  );
}

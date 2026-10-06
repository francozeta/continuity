"use client";

import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  arc,
  motion,
  useIsPresent,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  Star,
  Rewind,
  FastForward,
  Volume1,
  Volume2,
  ListMusic,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { appleMusicTracks } from "./apple-music-tracks";

type TrackState = "compact" | "preview" | "player";
const MotionButton = motion.create(Button);
const MotionSkeleton = motion.create(Skeleton);
// Keep the text beside the cover until it reaches the player's lower composition.
const toPlayer = arc({ strength: 1.3, direction: "cw" });
const toNarrowPlayer = arc({ strength: 0.9, direction: "cw" });
const toPreview = arc({ strength: 0.95, direction: "ccw" });
const toNarrowPreview = arc({ strength: 1, direction: "ccw" });

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

function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function PlayButton({
  playing,
  onClick,
  compact = false,
}: {
  playing: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      className={`play-button${compact ? " compact-play" : ""}`}
      type="button"
      aria-label={playing ? "Pause" : "Play"}
      aria-pressed={playing}
      onClick={onClick}
    >
      <span
        className="t-icon-swap"
        data-state={playing ? "b" : "a"}
        aria-hidden="true"
      >
        <span className="t-icon" data-icon="a">
          <Play className="size-[18px]" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="t-icon" data-icon="b">
          <Pause className="size-[18px]" fill="currentColor" strokeWidth={0} />
        </span>
      </span>
    </Button>
  );
}

function MiniPlayerControls({
  playing,
  onPlay,
  onNext,
  reduce,
  nextDisabled,
  ref,
}: {
  playing: boolean;
  onPlay: () => void;
  onNext: () => void;
  reduce: boolean;
  nextDisabled: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  const present = useIsPresent();
  return (
    <motion.div
      ref={ref}
      className="compact-controls"
      layout="position"
      inert={!present}
      initial={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }}
      transition={{ duration: 0.14 }}
    >
      <PlayButton playing={playing} compact onClick={onPlay} />
      <Button
        variant="ghost"
        className="icon-button"
        aria-label="Next track"
        onClick={onNext}
        disabled={nextDisabled}
      >
        <FastForward
          className="size-5"
          fill="currentColor"
          strokeWidth={0}
          aria-hidden="true"
        />
      </Button>
    </motion.div>
  );
}

function QueuePanel({
  trackIndex,
  history,
  onSelect,
  onClearHistory,
  headingRef,
  reduce,
}: {
  trackIndex: number;
  history: { key: number; index: number }[];
  onSelect: (index: number) => void;
  onClearHistory: () => void;
  headingRef: Ref<HTMLHeadingElement>;
  reduce: boolean;
}) {
  const present = useIsPresent();
  const upcoming = appleMusicTracks.slice(trackIndex + 1);
  const row = (index: number, key: number) => {
    const item = appleMusicTracks[index];
    return (
      <li key={key}>
        <Button
          variant="ghost"
          className="queue-track"
          onClick={() => onSelect(index)}
        >
          <Image
            src={item.artwork}
            alt=""
            width={44}
            height={44}
            sizes="44px"
            draggable={false}
          />
          <span>
            <span className="queue-track-title">{item.title}</span>
            <small>{item.artist}</small>
          </span>
        </Button>
      </li>
    );
  };
  return (
    <motion.div
      className="music-queue"
      id="music-queue"
      role="region"
      aria-labelledby="queue-heading"
      inert={!present}
      initial={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }}
      transition={{ duration: reduce ? 0 : 0.14 }}
    >
      <div className="queue-section-heading">
        <h3 id="queue-heading" ref={headingRef} tabIndex={-1}>
          Playing next
        </h3>
        <span>
          {upcoming.length} {upcoming.length === 1 ? "song" : "songs"}
        </span>
      </div>
      {upcoming.length ? (
        <ul aria-label="Upcoming songs">
          {upcoming.map((item, offset) =>
            row(trackIndex + offset + 1, item.id),
          )}
        </ul>
      ) : (
        <p className="queue-empty">You’re at the end of this selection.</p>
      )}
      {history.length > 0 && (
        <>
          <div className="queue-section-heading queue-history-heading">
            <h3>History</h3>
            <Button
              variant="ghost"
              className="clear-history"
              onClick={onClearHistory}
            >
              Clear
            </Button>
          </div>
          <ul aria-label="Previously played songs">
            {history.map((entry) => row(entry.index, entry.key))}
          </ul>
        </>
      )}
    </motion.div>
  );
}

export function TrackExperiment() {
  const [appearance, setAppearance] = useState<"default" | "apple">("default");
  const [state, setState] = useState<TrackState>("compact");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [position, setPosition] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [volume, setVolume] = useState(50);
  const [previewDuration, setPreviewDuration] = useState(30);
  const [audioError, setAudioError] = useState("");
  const [queueOpen, setQueueOpen] = useState(false);
  const [history, setHistory] = useState<{ key: number; index: number }[]>([]);
  const historyKey = useRef(0);
  const playedTrack = useRef<number | null>(null);
  const queueTriggerRef = useRef<HTMLButtonElement>(null);
  const queueHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingQueueFocus = useRef<"heading" | "trigger" | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isApple = appearance === "apple";
  const track = appleMusicTracks[trackIndex];
  const favorite = isApple ? favorites.includes(track.id) : isFavorite;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let current = true;
    if (isApple && isPlaying) {
      void audio.play().catch(() => {
        if (!current) return;
        setIsPlaying(false);
        setAudioError("This preview is unavailable. Listen on Apple Music.");
      });
    } else {
      audio.pause();
    }
    return () => {
      current = false;
    };
  }, [isApple, isPlaying, trackIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  function seek(value: number | readonly number[]) {
    const next = typeof value === "number" ? value : value[0];
    setPosition(next);
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime = (next / 100) * audioRef.current.duration;
    }
  }

  function selectTrack(index: number) {
    const next = Math.max(0, Math.min(index, appleMusicTracks.length - 1));
    if (next === trackIndex) return;
    if (playedTrack.current === track.id) {
      const entry = { key: ++historyKey.current, index: trackIndex };
      setHistory((current) => [entry, ...current].slice(0, 12));
    }
    playedTrack.current = null;
    // Only restore focus when selection removes its focused row/control.
    // Natural playback advancement should not take focus from another control.
    if (
      queueOpen &&
      (document.activeElement?.closest(".queue-track") ||
        (next === appleMusicTracks.length - 1 &&
          document.activeElement?.getAttribute("aria-label") === "Next track"))
    )
      pendingQueueFocus.current = "heading";
    setTrackIndex(next);
    setPosition(0);
    setPreviewDuration(30);
    setAudioError("");
  }

  function toggleQueue(open: boolean) {
    pendingQueueFocus.current = open ? "heading" : "trigger";
    setQueueOpen(open);
  }

  useLayoutEffect(() => {
    if (!pendingQueueFocus.current) return;
    const target =
      pendingQueueFocus.current === "heading"
        ? queueHeadingRef.current
        : queueTriggerRef.current;
    target?.focus({ preventScroll: true });
    pendingQueueFocus.current = null;
  }, [queueOpen, trackIndex]);

  function toggleFavorite() {
    if (!isApple) {
      setIsFavorite(!isFavorite);
      return;
    }
    setFavorites((current) =>
      favorite
        ? current.filter((id) => id !== track.id)
        : [...current, track.id],
    );
  }
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
    pendingQueueFocus.current = null;
    setQueueOpen(false);
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
        <div
          className="comparison-toolbar"
          role="group"
          aria-label="Component appearance"
        >
          <Button
            variant="ghost"
            aria-pressed={!isApple}
            onClick={() => {
              setIsPlaying(false);
              setQueueOpen(false);
              setAppearance("default");
            }}
          >
            Default
          </Button>
          <Button
            variant="ghost"
            aria-pressed={isApple}
            onClick={() => {
              setIsPlaying(false);
              setAppearance("apple");
            }}
          >
            Apple Music
          </Button>
        </div>
        <div
          className="track-stage"
          data-state={state}
          data-appearance={appearance}
        >
          <motion.section
            id="track-details"
            layout
            className="track-surface"
            data-state={state}
            data-appearance={appearance}
            data-panel={isApple && queueOpen ? "queue" : "artwork"}
            style={{
              borderRadius:
                state === "compact" ? 22 : state === "preview" ? 28 : 34,
            }}
            aria-label={`${isApple ? track.title : "Track"} ${state}`}
            aria-describedby="track-demo-description"
            onKeyDown={(event) => {
              if (
                event.key === "Escape" &&
                state !== "compact" &&
                !event.defaultPrevented
              ) {
                event.preventDefault();
                if (queueOpen) {
                  toggleQueue(false);
                  return;
                }
                changeState(state === "player" ? "preview" : "compact");
              }
            }}
          >
            {isApple && (
              <div className="track-backdrop" aria-hidden="true">
                <Image
                  src={track.artwork}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  draggable={false}
                />
              </div>
            )}
            <MotionSkeleton
              className="track-cover"
              layoutId="track:cover"
              layout
              style={{ borderRadius: state === "compact" ? 10 : 18 }}
              aria-hidden="true"
            >
              {isApple && (
                <Image
                  src={track.artwork}
                  alt=""
                  width={700}
                  height={700}
                  sizes="(max-width: 640px) 100vw, 400px"
                  loading="eager"
                  draggable={false}
                />
              )}
            </MotionSkeleton>
            <motion.div
              className="track-identity"
              layout
              layoutAnchor={false}
              aria-hidden={!isApple}
              transition={{
                layout: {
                  ...transition,
                  path: prefersReducedMotion
                    ? undefined
                    : isApple && queueOpen
                      ? isNarrow
                        ? toNarrowPreview
                        : toPreview
                      : state === "player"
                        ? isNarrow
                          ? toNarrowPlayer
                          : toPlayer
                        : state === "preview"
                          ? isNarrow
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
              >
                {isApple && (
                  <motion.h2 layout="position">{track.title}</motion.h2>
                )}
              </MotionSkeleton>
              <MotionSkeleton
                className="track-artist"
                layoutId="track:artist"
                layout
                style={{ borderRadius: 6 }}
              >
                {isApple && (
                  <motion.p layout="position">{track.artist}</motion.p>
                )}
              </MotionSkeleton>
            </motion.div>
            <MotionButton
              layout="position"
              variant="ghost"
              ref={openRef}
              className="track-open"
              type="button"
              hidden={state !== "compact"}
              aria-expanded={state !== "compact"}
              aria-controls="track-details"
              aria-label="Open preview"
              onClick={() => changeState("preview")}
            ></MotionButton>
            <AnimatePresence initial={false} mode="popLayout">
              {isApple && state === "compact" && (
                <MiniPlayerControls
                  key="mini-controls"
                  playing={isPlaying}
                  onPlay={() => setIsPlaying(!isPlaying)}
                  onNext={() => selectTrack(trackIndex + 1)}
                  nextDisabled={trackIndex === appleMusicTracks.length - 1}
                  reduce={prefersReducedMotion}
                />
              )}
            </AnimatePresence>
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
                    aria-hidden={!isApple}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.12,
                      duration: 0.16,
                      layout: transition,
                    }}
                  >
                    {isApple ? (
                      <>
                        <p>{track.album}</p>
                        <span className="preview-label">Audio preview</span>
                      </>
                    ) : (
                      <>
                        <span />
                        <span />
                      </>
                    )}
                  </motion.div>
                )}
                {isApple && state === "player" && (
                  <motion.div layout="position" className="apple-track-actions">
                    <MotionButton
                      variant="ghost"
                      layout="position"
                      className="apple-favorite icon-button"
                      aria-label={
                        favorite ? "Remove from favorites" : "Favorite"
                      }
                      aria-pressed={favorite}
                      onClick={toggleFavorite}
                    >
                      <Star
                        className="size-5"
                        fill={favorite ? "currentColor" : "none"}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </MotionButton>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="ghost"
                            className="icon-button track-more"
                            aria-label="More track actions"
                          />
                        }
                      >
                        <MoreHorizontal className="size-5" aria-hidden="true" />
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        align="end"
                        className="track-actions-menu"
                      >
                        <PopoverTitle className="sr-only">
                          Track actions
                        </PopoverTitle>
                        <a
                          className="music-source"
                          href={track.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Listen on Apple Music
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </a>
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                )}
                <AnimatePresence initial={false} mode="popLayout">
                  {isApple && state === "player" && queueOpen && (
                    <QueuePanel
                      key="queue"
                      trackIndex={trackIndex}
                      history={history}
                      onSelect={selectTrack}
                      onClearHistory={() => {
                        setHistory([]);
                        queueHeadingRef.current?.focus({ preventScroll: true });
                      }}
                      headingRef={queueHeadingRef}
                      reduce={prefersReducedMotion}
                    />
                  )}
                </AnimatePresence>
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
                      getAriaLabel={() =>
                        isApple ? "Preview position" : "Progress"
                      }
                      getAriaValueText={(_, value) =>
                        isApple
                          ? `${formatTime((value / 100) * previewDuration)} of ${formatTime(previewDuration)}`
                          : `${value}%`
                      }
                      onValueChange={seek}
                    />
                    <div className="timeline-times" aria-hidden="true">
                      {isApple ? (
                        <>
                          <span>
                            {formatTime((position / 100) * previewDuration)}
                          </span>
                          <span>
                            −
                            {formatTime(previewDuration * (1 - position / 100))}
                          </span>
                        </>
                      ) : (
                        <>
                          <span />
                          <span />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
                <motion.div
                  layout="position"
                  className="track-controls"
                  initial={{
                    opacity: 0,
                    filter: prefersReducedMotion ? "blur(0px)" : "blur(4px)",
                  }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.16, layout: transition }}
                >
                  {(!isApple || state === "preview") && (
                    <Button
                      variant="ghost"
                      className="favorite-button icon-button"
                      type="button"
                      aria-label={
                        favorite ? "Remove from favorites" : "Favorite"
                      }
                      aria-pressed={favorite}
                      onClick={toggleFavorite}
                    >
                      <Star
                        aria-hidden="true"
                        className="size-[19px]"
                        fill={favorite ? "currentColor" : "none"}
                        strokeWidth={1.5}
                      />
                    </Button>
                  )}
                  {isApple && (
                    <Button
                      variant="ghost"
                      className="icon-button previous-button"
                      aria-label="Previous track"
                      onClick={() =>
                        position > 10 || trackIndex === 0
                          ? seek(0)
                          : selectTrack(trackIndex - 1)
                      }
                    >
                      <Rewind
                        className="size-7"
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                      />
                    </Button>
                  )}
                  <PlayButton
                    playing={isPlaying}
                    onClick={() => {
                      setAudioError("");
                      setIsPlaying(!isPlaying);
                    }}
                  />
                  <Button
                    variant="ghost"
                    className="icon-button restart-button"
                    type="button"
                    aria-label={isApple ? "Next track" : "Reset progress"}
                    disabled={
                      isApple && trackIndex === appleMusicTracks.length - 1
                    }
                    onClick={() =>
                      isApple ? selectTrack(trackIndex + 1) : seek(0)
                    }
                  >
                    {isApple ? (
                      <FastForward
                        className="size-7"
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                      />
                    ) : (
                      <RotateCcw
                        aria-hidden="true"
                        className="size-[19px]"
                        strokeWidth={1.5}
                      />
                    )}
                  </Button>
                </motion.div>
                {isApple && state === "player" && (
                  <motion.div
                    layout="position"
                    className="apple-extras"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16, layout: transition }}
                  >
                    <div className="volume-row">
                      <Volume1 aria-hidden="true" className="size-4" />
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[volume]}
                        getAriaLabel={() => "Volume"}
                        getAriaValueText={(_, value) => `${value}%`}
                        onValueChange={(value) =>
                          setVolume(
                            typeof value === "number" ? value : value[0],
                          )
                        }
                      />
                      <Volume2 aria-hidden="true" className="size-4" />
                    </div>
                    <div className="apple-footer">
                      <p className="preview-disclosure">
                        30-second audio preview
                      </p>
                      <Button
                        variant="ghost"
                        className="icon-button queue-toggle"
                        ref={queueTriggerRef}
                        aria-label="Playing next"
                        aria-expanded={queueOpen}
                        aria-controls="music-queue"
                        aria-pressed={queueOpen}
                        onClick={() => toggleQueue(!queueOpen)}
                      >
                        <ListMusic className="size-5" aria-hidden="true" />
                      </Button>
                    </div>
                  </motion.div>
                )}
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
        <audio
          ref={audioRef}
          src={track.preview}
          preload="none"
          onPlaying={() => {
            playedTrack.current = track.id;
          }}
          onLoadedMetadata={(event) => {
            const audio = event.currentTarget;
            if (Number.isFinite(audio.duration)) {
              setPreviewDuration(audio.duration);
              audio.currentTime = (position / 100) * audio.duration;
            }
          }}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            if (isApple && Number.isFinite(audio.duration))
              setPosition((audio.currentTime / audio.duration) * 100);
          }}
          onEnded={() => {
            if (isApple && trackIndex < appleMusicTracks.length - 1)
              selectTrack(trackIndex + 1);
            else setIsPlaying(false);
          }}
          onError={() => {
            if (isApple) {
              setIsPlaying(false);
              setAudioError(
                "This preview is unavailable. Listen on Apple Music.",
              );
            }
          }}
        />
        <p className={audioError ? "audio-notice" : "sr-only"} role="status">
          {audioError}
        </p>
        <p id="track-demo-description" className="sr-only">
          {isApple
            ? "Independent Apple Music interface study with public catalog artwork and short audio previews."
            : "Experimental default presentation with static placeholders. Controls demonstrate state changes without audio."}
        </p>
        <p className="sr-only" role="status">
          {state === "compact" ? "" : `Track ${state} opened.`}
        </p>
      </LayoutGroup>
    </MotionConfig>
  );
}

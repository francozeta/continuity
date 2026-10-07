"use client";

import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  arc,
  motion,
  useIsPresent,
} from "motion/react";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowUpRight,
  ChevronDown,
  FastForward,
  ListMusic,
  MoreHorizontal,
  Pause,
  Play,
  Rewind,
  Star,
  Volume1,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { findTrack, useMusicSession, useMusicTiming } from "./music-provider";

const MotionPopup = motion.create(Dialog.Popup);
const textPath = arc({ strength: 0.9, direction: "cw" });
const reducePreference = {
  subscribe(callback: () => void) {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  },
  getSnapshot: () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  getServerSnapshot: () => true,
};

export function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function PlaybackButton({ compact = false }: { compact?: boolean }) {
  const { session, togglePlayback } = useMusicSession();
  return (
    <Button
      variant="ghost"
      className={`play-button${compact ? " compact-play" : ""}`}
      aria-label={session.playing ? "Pause" : "Play"}
      onClick={togglePlayback}
    >
      <span
        className="t-icon-swap"
        data-state={session.playing ? "b" : "a"}
        aria-hidden="true"
      >
        <span className="t-icon" data-icon="a">
          <Play className="size-8" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="t-icon" data-icon="b">
          <Pause className="size-8" fill="currentColor" strokeWidth={0} />
        </span>
      </span>
    </Button>
  );
}

function CurrentParts({
  compact = false,
  reduce,
}: {
  compact?: boolean;
  reduce: boolean;
}) {
  const { track } = useMusicSession();
  return (
    <>
      <motion.div
        className="track-cover"
        layout
        layoutId={`${track.id}:cover`}
        style={{ borderRadius: compact ? 8 : 18 }}
        aria-hidden="true"
      >
        <Image
          src={track.artwork}
          alt=""
          width={700}
          height={700}
          sizes={compact ? "48px" : "(max-width: 640px) 100vw, 440px"}
          loading="eager"
          draggable={false}
        />
      </motion.div>
      <div className="track-identity">
        <motion.div
          className="track-title"
          layoutId={`${track.id}:title`}
          layout
          transition={{ layout: { path: reduce ? undefined : textPath } }}
        >
          {compact ? (
            <motion.p layout="position">{track.title}</motion.p>
          ) : (
            <Dialog.Title render={<motion.h2 layout="position" />}>
              {track.title}
            </Dialog.Title>
          )}
        </motion.div>
        <motion.div
          className="track-artist"
          layoutId={`${track.id}:artist`}
          layout
          transition={{ layout: { path: reduce ? undefined : textPath } }}
        >
          <motion.p layout="position">{track.artist}</motion.p>
        </motion.div>
      </div>
    </>
  );
}

function MiniPlayer({
  reduce,
  openRef,
}: {
  reduce: boolean;
  openRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { track, session, next } = useMusicSession();
  return (
    <section
      className="track-surface music-mini"
      style={{ borderRadius: 22 }}
      data-state="compact"
      data-appearance="apple"
      aria-label="MiniPlayer"
    >
      <CurrentParts compact reduce={reduce} />
      <Dialog.Trigger
        ref={openRef}
        render={<Button variant="ghost" className="track-open" />}
        aria-label={`Open player for ${track.title}`}
      />
      <div className="compact-controls">
        <PlaybackButton compact />
        <Button
          variant="ghost"
          className="icon-button"
          aria-label="Next track"
          onClick={next}
          disabled={!session.queue.length}
        >
          <FastForward
            className="size-5"
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
          />
        </Button>
      </div>
    </section>
  );
}

function PlayerTimeline() {
  const { elapsed, duration, seek } = useMusicTiming();
  return (
    <div className="track-timeline">
      <Slider
        min={0}
        max={100}
        step={1}
        value={[duration ? (elapsed / duration) * 100 : 0]}
        disabled={!duration}
        getAriaLabel={() => "Preview position"}
        getAriaValueText={(_, value) =>
          `${formatTime((duration * value) / 100)} of ${formatTime(duration)}`
        }
        onValueChange={(value) =>
          seek(typeof value === "number" ? value : value[0])
        }
      />
      <div className="timeline-times" aria-hidden="true">
        <span>{formatTime(elapsed)}</span>
        <span>−{formatTime(Math.max(0, duration - elapsed))}</span>
      </div>
    </div>
  );
}

function PlayerVolume() {
  const { volume, setVolume } = useMusicTiming();
  return (
    <div className="volume-row">
      <Volume1 className="size-4" aria-hidden="true" />
      <Slider
        min={0}
        max={100}
        step={1}
        value={[volume]}
        getAriaLabel={() => "Volume"}
        getAriaValueText={(_, value) => `${value}%`}
        onValueChange={(value) =>
          setVolume(typeof value === "number" ? value : value[0])
        }
      />
      <Volume2 className="size-4" aria-hidden="true" />
    </div>
  );
}

function PlayerActions() {
  const { track, session, dispatch } = useMusicSession();
  const favorite = session.favorites.includes(track.id);
  return (
    <div className="apple-track-actions">
      <Button
        variant="ghost"
        className="icon-button apple-favorite"
        aria-label={favorite ? "Remove from favorites" : "Favorite"}
        aria-pressed={favorite}
        onClick={() => dispatch({ type: "favorite", trackId: track.id })}
      >
        <Star
          className="size-5"
          strokeWidth={1.5}
          fill={favorite ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              className="icon-button"
              aria-label="More track actions"
            />
          }
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="end" className="track-actions-menu">
          <PopoverTitle className="sr-only">Track actions</PopoverTitle>
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
    </div>
  );
}

function PlayingNext({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { session, playQueued, playTrack, dispatch } = useMusicSession();
  return (
    <div
      className="music-queue"
      role="region"
      aria-labelledby="reference-queue-heading"
    >
      <div className="queue-section-heading">
        <h3 id="reference-queue-heading" ref={headingRef} tabIndex={-1}>
          Playing next
        </h3>
        <span>
          {session.queue.length} {session.queue.length === 1 ? "song" : "songs"}
        </span>
      </div>
      {session.queue.length ? (
        <ul aria-label="Upcoming songs">
          {session.queue.map((entry) => {
            const track = findTrack(entry.trackId);
            return (
              <li key={entry.key}>
                <Button
                  variant="ghost"
                  className="queue-track"
                  onClick={() => {
                    playQueued(entry.key);
                    headingRef.current?.focus({ preventScroll: true });
                  }}
                >
                  <Image
                    src={track.artwork}
                    alt=""
                    width={44}
                    height={44}
                    sizes="44px"
                  />
                  <span>
                    <span className="queue-track-title">{track.title}</span>
                    <small>{track.artist}</small>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="queue-empty">
          Nothing queued. Add a song from your library.
        </p>
      )}
      {session.history.length > 0 && (
        <>
          <div className="queue-section-heading queue-history-heading">
            <h3>History</h3>
            <Button
              variant="ghost"
              className="clear-history"
              onClick={() => {
                dispatch({ type: "clear-history" });
                headingRef.current?.focus({ preventScroll: true });
              }}
            >
              Clear
            </Button>
          </div>
          <ul aria-label="Previously played songs">
            {session.history.map((entry) => {
              const track = findTrack(entry.trackId);
              return (
                <li key={entry.key}>
                  <Button
                    variant="ghost"
                    className="queue-track"
                    onClick={() => playTrack(track.id)}
                  >
                    <Image
                      src={track.artwork}
                      alt=""
                      width={44}
                      height={44}
                      sizes="44px"
                    />
                    <span>
                      <span className="queue-track-title">{track.title}</span>
                      <small>{track.artist}</small>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function FullPlayer({
  reduce,
  queueOpen,
  toggleQueue,
  closeRef,
  openRef,
  queueRef,
  headingRef,
}: {
  reduce: boolean;
  queueOpen: boolean;
  toggleQueue: (open: boolean) => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  openRef: React.RefObject<HTMLButtonElement | null>;
  queueRef: React.RefObject<HTMLButtonElement | null>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const present = useIsPresent();
  const { track, session, next, previous, error } = useMusicSession();
  return (
    <>
      <Dialog.Backdrop
        render={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          />
        }
        className="music-player-backdrop"
      />
      <Dialog.Viewport className="music-player-viewport">
        <MotionPopup
          className="music-now-playing"
          data-appearance="apple"
          layoutRoot
          layoutScroll
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: reduce ? 0 : 0.18 } }}
          initialFocus={closeRef}
          finalFocus={openRef}
          inert={!present}
        >
          <Dialog.Description className="sr-only">
            Public catalog audio preview. Playback continues when this player
            closes.
          </Dialog.Description>
          <div className="track-backdrop" aria-hidden="true">
            <Image
              src={track.artwork}
              alt=""
              fill
              sizes="100vw"
              draggable={false}
            />
          </div>
          <Dialog.Close
            ref={closeRef}
            render={
              <Button
                variant="ghost"
                className="icon-button music-player-close"
              />
            }
            aria-label="Close player"
          >
            <ChevronDown className="size-5" aria-hidden="true" />
          </Dialog.Close>
          <motion.section
            className="track-surface music-full-player"
            data-state="player"
            data-appearance="apple"
            data-panel={queueOpen ? "queue" : "artwork"}
            layout
            style={{ borderRadius: 0 }}
            aria-label="Playback controls"
          >
            <CurrentParts reduce={reduce} />
            <PlayerActions />
            {queueOpen && <PlayingNext headingRef={headingRef} />}
            <PlayerTimeline />
            <div className="track-controls">
              <Button
                variant="ghost"
                className="icon-button"
                aria-label="Previous track"
                onClick={previous}
              >
                <Rewind
                  className="size-7"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              </Button>
              <PlaybackButton />
              <Button
                variant="ghost"
                className="icon-button"
                aria-label="Next track"
                onClick={next}
                disabled={!session.queue.length}
              >
                <FastForward
                  className="size-7"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                />
              </Button>
            </div>
            <div className="apple-extras">
              <PlayerVolume />
              <div className="apple-footer">
                <p className="preview-disclosure">Audio preview</p>
                <Button
                  ref={queueRef}
                  variant="ghost"
                  className="icon-button queue-toggle"
                  aria-label="Playing next"
                  aria-expanded={queueOpen}
                  aria-pressed={queueOpen}
                  onClick={() => toggleQueue(!queueOpen)}
                >
                  <ListMusic className="size-5" aria-hidden="true" />
                </Button>
              </div>
              <p
                className={error ? "music-player-error" : "sr-only"}
                role="status"
              >
                {error}
              </p>
            </div>
          </motion.section>
        </MotionPopup>
      </Dialog.Viewport>
    </>
  );
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const reduce = useSyncExternalStore(
    reducePreference.subscribe,
    reducePreference.getSnapshot,
    reducePreference.getServerSnapshot,
  );
  const namespace = useId();
  const openRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<"queue" | "heading" | null>(null);
  const actionsRef = useRef<Dialog.Root.Actions>(null);
  function toggleQueue(next: boolean) {
    pendingFocus.current = next ? "heading" : "queue";
    setQueueOpen(next);
  }
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    (pendingFocus.current === "heading" ? headingRef : queueRef).current?.focus(
      { preventScroll: true },
    );
    pendingFocus.current = null;
  }, [queueOpen]);
  const transition = reduce
    ? { type: false as const, duration: 0 }
    : { type: "spring" as const, stiffness: 330, damping: 34, mass: 0.85 };
  return (
    <MotionConfig transition={{ layout: transition }}>
      <LayoutGroup id={`music-${namespace}`}>
        <Dialog.Root
          open={open}
          actionsRef={actionsRef}
          onOpenChange={(next, details) => {
            if (!next && details.reason === "escape-key" && queueOpen) {
              details.cancel();
              toggleQueue(false);
              return;
            }
            if (!next) details.preventUnmountOnClose();
            else setQueueOpen(false);
            setOpen(next);
          }}
        >
          <div className="music-mini-dock">
            <MiniPlayer reduce={reduce} openRef={openRef} />
          </div>
          <Dialog.Portal>
            <AnimatePresence
              initial={false}
              onExitComplete={() => {
                if (!open) actionsRef.current?.unmount();
              }}
            >
              {open && (
                <FullPlayer
                  key="now-playing"
                  reduce={reduce}
                  queueOpen={queueOpen}
                  toggleQueue={toggleQueue}
                  closeRef={closeRef}
                  openRef={openRef}
                  queueRef={queueRef}
                  headingRef={headingRef}
                />
              )}
            </AnimatePresence>
          </Dialog.Portal>
        </Dialog.Root>
      </LayoutGroup>
    </MotionConfig>
  );
}

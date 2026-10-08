"use client";

import Image from "next/image";
import { Reorder, motion, useDragControls } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { GripHorizontal, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { findTrack, useMusicSession } from "./music-provider";
import type { QueueEntry } from "./music-session";

function QueueRow({
  entry,
  index,
  count,
  reduce,
  headingRef,
  onSelect,
  onRemove,
  onMove,
}: {
  entry: QueueEntry;
  index: number;
  count: number;
  reduce: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onSelect: (entry: QueueEntry) => void;
  onRemove: (entry: QueueEntry) => void;
  onMove: (entry: QueueEntry, offset: -1 | 1) => void;
}) {
  const track = findTrack(entry.trackId);
  const drag = useDragControls();
  const [menuOpen, setMenuOpen] = useState(false);
  const removing = useRef(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  return (
    <Reorder.Item
      as="li"
      value={entry}
      id={`queued-${entry.key}`}
      className="reference-queue-row"
      dragListener={false}
      dragControls={drag}
      transition={
        reduce
          ? { type: false, duration: 0 }
          : { type: "spring", stiffness: 500, damping: 40 }
      }
    >
      <Button
        variant="ghost"
        className="queue-track"
        onClick={() => onSelect(entry)}
        aria-label={`Play ${track.title}`}
      >
        <Image
          src={track.artwork}
          alt=""
          width={44}
          height={44}
          sizes="44px"
          draggable={false}
        />
        <span>
          <span className="queue-track-title">{track.title}</span>
          <small>{track.artist}</small>
        </span>
      </Button>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger
          ref={moreRef}
          render={
            <Button
              variant="ghost"
              className="icon-button"
              aria-label={`Queue actions for ${track.title}`}
            />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="music-row-actions"
          finalFocus={() =>
            removing.current ? headingRef.current : moreRef.current
          }
        >
          <PopoverTitle className="sr-only">
            Queue actions for {track.title}
          </PopoverTitle>
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => {
              onMove(entry, -1);
              setMenuOpen(false);
            }}
          >
            Move up
          </Button>
          <Button
            variant="ghost"
            disabled={index === count - 1}
            onClick={() => {
              onMove(entry, 1);
              setMenuOpen(false);
            }}
          >
            Move down
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              removing.current = true;
              setMenuOpen(false);
              onRemove(entry);
            }}
          >
            Remove from Queue
          </Button>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        className="icon-button queue-drag-handle"
        aria-label={`Reorder ${track.title}`}
        aria-describedby="queue-reorder-instructions"
        onClick={() => {
          if (!menuOpen) {
            moreRef.current?.focus({ preventScroll: true });
            setMenuOpen(true);
          }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          drag.start(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" && index > 0) {
            event.preventDefault();
            onMove(entry, -1);
          }
          if (event.key === "ArrowDown" && index < count - 1) {
            event.preventDefault();
            onMove(entry, 1);
          }
        }}
      >
        <GripHorizontal className="size-4" aria-hidden="true" />
      </Button>
    </Reorder.Item>
  );
}

export function MusicQueue({
  headingRef,
  reduce,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  reduce: boolean;
}) {
  const { session, playQueued, playTrack, dispatch } = useMusicSession();
  const previousRow = useRef<Element | null>(null);
  const [announcement, announce] = useState("");

  useLayoutEffect(() => {
    // Preserve surviving rows through a reorder. Only repair a removed focus
    // target; automatic playback must not steal focus from seek or volume.
    if (
      previousRow.current &&
      !previousRow.current.isConnected &&
      document.activeElement === document.body
    )
      headingRef.current?.focus({ preventScroll: true });
    if (previousRow.current && !previousRow.current.isConnected)
      previousRow.current = null;
  }, [session.queue, session.history, session.current.key, headingRef]);

  function move(entry: QueueEntry, offset: -1 | 1) {
    const index = session.queue.findIndex((item) => item.key === entry.key);
    const destination = index + offset;
    if (index < 0 || destination < 0 || destination >= session.queue.length)
      return;
    dispatch({ type: "move", key: entry.key, offset });
    announce(
      `${findTrack(entry.trackId).title} moved to position ${destination + 1} of ${session.queue.length}.`,
    );
  }

  return (
    <motion.div
      layoutScroll
      className="music-queue"
      role="region"
      aria-labelledby="reference-queue-heading"
      data-base-ui-swipe-ignore
      onFocusCapture={(event) => {
        previousRow.current = (event.target as Element).closest(
          ".reference-queue-row, .reference-history-row",
        );
      }}
    >
      <div className="queue-section-heading">
        <h3 id="reference-queue-heading" ref={headingRef} tabIndex={-1}>
          Playing next
        </h3>
        <Button
          variant="ghost"
          className="clear-history"
          disabled={!session.queue.length}
          onClick={() => {
            dispatch({ type: "clear-queue" });
            headingRef.current?.focus({ preventScroll: true });
            announce("Queue cleared.");
          }}
        >
          Clear
        </Button>
      </div>
      <p className="sr-only" id="queue-reorder-instructions">
        Drag to reorder. With the reorder button focused, use the up and down
        arrow keys. Press Enter or Space to open queue actions.
      </p>
      {session.queue.length ? (
        <Reorder.Group
          as="ul"
          axis="y"
          values={session.queue}
          onReorder={(entries) =>
            dispatch({
              type: "reorder",
              keys: entries.map((entry) => entry.key),
            })
          }
          aria-label="Upcoming songs"
        >
          {session.queue.map((entry, index) => (
            <QueueRow
              key={entry.key}
              entry={entry}
              index={index}
              count={session.queue.length}
              reduce={reduce}
              headingRef={headingRef}
              onMove={move}
              onSelect={(selected) => {
                previousRow.current = document.getElementById(
                  `queued-${selected.key}`,
                );
                playQueued(selected.key);
              }}
              onRemove={(removed) => {
                previousRow.current = document.getElementById(
                  `queued-${removed.key}`,
                );
                dispatch({ type: "remove", key: removed.key });
                announce(
                  `${findTrack(removed.trackId).title} removed from queue.`,
                );
              }}
            />
          ))}
        </Reorder.Group>
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
                announce("History cleared.");
              }}
            >
              Clear
            </Button>
          </div>
          <ul aria-label="Previously played songs">
            {session.history.map((entry) => {
              const track = findTrack(entry.trackId);
              return (
                <li key={entry.key} className="reference-history-row">
                  <Button
                    variant="ghost"
                    className="queue-track"
                    onClick={(event) => {
                      previousRow.current = event.currentTarget.closest("li");
                      playTrack(track.id);
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
        </>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </motion.div>
  );
}

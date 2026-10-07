"use client";

import Image from "next/image";
import { useState } from "react";
import { MoreHorizontal, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMusicSession, type MusicTrack } from "./music-provider";

export function PlayCollection({ trackIds }: { trackIds: readonly number[] }) {
  const { playTrack } = useMusicSession();
  return (
    <Button
      className="music-play-collection"
      onClick={() => playTrack(trackIds[0], trackIds)}
    >
      <Play
        className="size-4"
        fill="currentColor"
        strokeWidth={0}
        aria-hidden="true"
      />
      Play preview
    </Button>
  );
}

function TrackActions({ track }: { track: MusicTrack }) {
  const { addToQueue, session, dispatch } = useMusicSession();
  const [open, setOpen] = useState(false);
  const favorite = session.favorites.includes(track.id);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="icon-button music-row-more"
            aria-label={`Actions for ${track.title}`}
          />
        }
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="music-row-actions">
        <PopoverTitle className="sr-only">
          Actions for {track.title}
        </PopoverTitle>
        <Button
          variant="ghost"
          onClick={() => {
            addToQueue(track.id, true);
            setOpen(false);
          }}
        >
          Play Next
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            addToQueue(track.id, false);
            setOpen(false);
          }}
        >
          Add to Queue
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            dispatch({ type: "favorite", trackId: track.id });
            setOpen(false);
          }}
        >
          {favorite ? "Remove from Favorites" : "Favorite"}
        </Button>
        <a href={track.url} target="_blank" rel="noreferrer">
          Listen on Apple Music
        </a>
      </PopoverContent>
    </Popover>
  );
}

export function CatalogTracks({
  tracks,
  collection,
}: {
  tracks: readonly MusicTrack[];
  collection?: readonly number[];
}) {
  const { session, playTrack } = useMusicSession();
  return (
    <ul className="music-track-list">
      {tracks.map((track) => {
        const current = session.current.trackId === track.id;
        return (
          <li key={track.id} data-current={current}>
            <Button
              variant="ghost"
              className="music-catalog-track"
              onClick={() => playTrack(track.id, collection)}
              aria-label={`Play ${track.title} by ${track.artist}`}
            >
              <span className="music-row-art">
                <Image
                  src={track.artwork}
                  alt=""
                  width={48}
                  height={48}
                  sizes="48px"
                />
                {current && session.playing && (
                  <span className="music-row-playing">
                    <Volume2 className="size-5" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="music-row-identity">
                <span>{track.title}</span>
                <small>{track.artist}</small>
              </span>
              {current && <span className="sr-only">Current track</span>}
            </Button>
            <span className="music-row-album">{track.album}</span>
            <TrackActions track={track} />
          </li>
        );
      })}
    </ul>
  );
}

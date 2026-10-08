"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { appleMusicTracks } from "../apple-music-tracks";
import {
  createMusicSession,
  musicSessionReducer,
  type MusicAction,
  type MusicSession,
} from "./music-session";

export type MusicTrack = (typeof appleMusicTracks)[number];
export const previewTracks = appleMusicTracks;
export function findTrack(id: number): MusicTrack {
  const track = previewTracks.find((item) => item.id === id);
  if (!track) throw new Error(`Unknown preview track: ${id}`);
  return track;
}

type SessionContext = {
  session: MusicSession;
  track: MusicTrack;
  dispatch: (action: MusicAction) => void;
  playTrack: (id: number, collection?: readonly number[]) => void;
  togglePlayback: () => void;
  next: () => void;
  previous: () => void;
  playQueued: (key: number) => void;
  addToQueue: (id: number, next: boolean) => void;
  error: string;
};
type TimingContext = {
  elapsed: number;
  duration: number;
  volume: number;
  seek: (percent: number) => void;
  setVolume: (percent: number) => void;
};
const Session = createContext<SessionContext | null>(null);
const Timing = createContext<TimingContext | null>(null);

export function useMusicSession() {
  const value = useContext(Session);
  if (!value)
    throw new Error("Music session requires the reference app layout.");
  return value;
}
export function useMusicTiming() {
  const value = useContext(Timing);
  if (!value)
    throw new Error("Music timing requires the reference app layout.");
  return value;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(
    musicSessionReducer,
    previewTracks.map((track) => track.id),
    createMusicSession,
  );
  const [timing, setTiming] = useState({ elapsed: 0, duration: 0 });
  const [volume, setVolume] = useState(50);
  const [error, setError] = useState("");
  const [announcement, announce] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const track = findTrack(session.current.trackId);

  useEffect(() => {
    // Repeated queue occurrences can share a URL. Reload each occurrence so a
    // paused Next action still resets its timeline and receives fresh metadata.
    audioRef.current?.load();
  }, [session.current.key]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let active = true;
    if (session.playing) {
      void audio.play().catch(() => {
        if (!active) return;
        dispatch({ type: "play", playing: false });
        setError(
          "This audio preview is unavailable. Try another song or listen on Apple Music.",
        );
      });
    } else audio.pause();
    return () => {
      active = false;
      audio.pause();
    };
  }, [session.playing, session.current.key]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const controls = useMemo<SessionContext>(() => {
    function resetTiming() {
      setTiming({ elapsed: 0, duration: 0 });
      setError("");
    }
    return {
      session,
      track,
      dispatch,
      error,
      playTrack(id, collection = previewTracks.map((item) => item.id)) {
        findTrack(id);
        const index = collection.indexOf(id);
        if (index < 0)
          throw new Error("The selected song must belong to its collection.");
        if (id !== track.id) resetTiming();
        else {
          setError("");
          if (audioRef.current?.ended) {
            audioRef.current.currentTime = 0;
            setTiming((current) => ({ ...current, elapsed: 0 }));
          }
        }
        dispatch({
          type: "select",
          trackId: id,
          following: collection.slice(index + 1),
        });
      },
      togglePlayback() {
        setError("");
        if (audioRef.current?.ended) {
          audioRef.current.currentTime = 0;
          setTiming((current) => ({ ...current, elapsed: 0 }));
        }
        dispatch({ type: "toggle-play" });
      },
      next() {
        if (!session.queue.length) return;
        resetTiming();
        dispatch({ type: "advance" });
      },
      previous() {
        const audio = audioRef.current;
        if (!session.history.length || (audio?.currentTime ?? 0) > 3) {
          if (audio) audio.currentTime = 0;
          setTiming((current) => ({ ...current, elapsed: 0 }));
          return;
        }
        resetTiming();
        dispatch({ type: "previous" });
      },
      playQueued(key) {
        if (!session.queue.some((entry) => entry.key === key)) return;
        resetTiming();
        dispatch({ type: "advance", key });
        dispatch({ type: "play", playing: true });
      },
      addToQueue(id, next) {
        const added = findTrack(id);
        dispatch({ type: "add", trackId: id, next });
        announce(
          `${added.title} added ${next ? "next" : "to the queue"}. ${session.queue.length + 1} songs waiting.`,
        );
      },
    };
  }, [session, track, error]);

  const clock = useMemo<TimingContext>(
    () => ({
      ...timing,
      volume,
      setVolume,
      seek(percent) {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration)) return;
        const elapsed =
          (Math.max(0, Math.min(100, percent)) / 100) * audio.duration;
        audio.currentTime = elapsed;
        setTiming((current) => ({ ...current, elapsed }));
      },
    }),
    [timing, volume],
  );

  return (
    <Session.Provider value={controls}>
      <Timing.Provider value={clock}>
        {children}
        <audio
          ref={audioRef}
          data-music-audio
          src={track.preview}
          preload="none"
          onPlaying={() => dispatch({ type: "played", trackId: track.id })}
          onLoadedMetadata={(event) => {
            const audio = event.currentTarget;
            if (Number.isFinite(audio.duration))
              setTiming({
                elapsed: audio.currentTime,
                duration: audio.duration,
              });
          }}
          onTimeUpdate={(event) => {
            const audio = event.currentTarget;
            if (Number.isFinite(audio.duration))
              setTiming({
                elapsed: audio.currentTime,
                duration: audio.duration,
              });
          }}
          onEnded={() => {
            if (session.queue.length) {
              setTiming({ elapsed: 0, duration: 0 });
              dispatch({ type: "advance" });
            } else dispatch({ type: "play", playing: false });
          }}
          onError={(event) => {
            const audio = event.currentTarget;
            // load() clears the previous resource's error. An already queued
            // error event must not stop a newer, healthy media request.
            if (!audio.error || audio.currentSrc !== track.preview) return;
            dispatch({ type: "play", playing: false });
            setError(
              "This audio preview is unavailable. Try another song or listen on Apple Music.",
            );
          }}
        />
        <p className="sr-only" role="status">
          {announcement}
        </p>
      </Timing.Provider>
    </Session.Provider>
  );
}

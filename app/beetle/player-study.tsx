"use client";

import { Button } from "@base-ui/react/button";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";

function timeLabel(seconds: number) {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

export function PlayerStudy() {
  const titleId = useId();
  const artworkId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const position = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const attachAudio = useCallback((audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
    // The browser can load the metadata before this client component hydrates.
    if (audio && Number.isFinite(audio.duration)) setDuration(audio.duration);
  }, []);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }

    setError("");
    void audio.play().catch((cause: unknown) => {
      // A rapid Pause cancels a pending play request in the browser.
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("Playback unavailable");
    });
  }

  function seek(value: number | readonly number[]) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const percent = typeof value === "number" ? value : value[0];
    audio.currentTime = (duration * percent) / 100;
    setElapsed(audio.currentTime);
  }

  return (
    <section
      className="beetle-player"
      data-expanded={expanded}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded) {
          event.preventDefault();
          setExpanded(false);
        }
      }}
    >
      <div className="beetle-player-artwork" id={artworkId}>
        <Image
          src="/beetle/piano.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
          draggable={false}
        />
      </div>
      <div className="beetle-player-heading">
        <div>
          <h1 id={titleId}>Gymnopédie No. 1</h1>
          <p role="status">{error || "Erik Satie"}</p>
        </div>
        <Button
          className="beetle-player-expand"
          aria-label={expanded ? "Minimize player" : "Expand player"}
          aria-expanded={expanded}
          aria-controls={artworkId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
        </Button>
      </div>
      <div className="beetle-player-transport">
        <Button
          className="beetle-player-play"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlayback}
        >
          {playing ? (
            <Pause aria-hidden="true" fill="currentColor" />
          ) : (
            <Play aria-hidden="true" fill="currentColor" />
          )}
        </Button>
        <Slider
          className="beetle-player-progress"
          disabled={!duration}
          min={0}
          max={100}
          step={0.1}
          largeStep={5}
          value={[position]}
          getAriaLabel={() => "Playback position"}
          getAriaValueText={(_, value) =>
            `${timeLabel((duration * value) / 100)} of ${timeLabel(duration)}`
          }
          onValueChange={seek}
        />
        <span className="beetle-player-time" aria-hidden="true">
          {timeLabel(elapsed)} <span>/</span> {duration ? timeLabel(duration) : "–:––"}
        </span>
      </div>
      <audio
        ref={attachAudio}
        src="/beetle/gymnopedie.mp3"
        preload="metadata"
        hidden
        onDurationChange={({ currentTarget }) =>
          setDuration(Number.isFinite(currentTarget.duration) ? currentTarget.duration : 0)
        }
        onTimeUpdate={({ currentTarget }) => setElapsed(currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setDuration(0);
          setError("Recording unavailable");
        }}
      />
    </section>
  );
}

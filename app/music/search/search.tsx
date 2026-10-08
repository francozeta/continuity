"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { appleMusicTracks } from "../../apple-music-tracks";
import { CatalogTracks } from "../track-list";

export function MusicSearch() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const tracks = appleMusicTracks.filter((track) =>
    `${track.title} ${track.artist} ${track.album}`
      .toLowerCase()
      .includes(normalized),
  );
  return (
    <>
      <label className="music-search-field">
        <Search className="size-5" aria-hidden="true" />
        <span className="sr-only">Search this collection</span>
        <input
          type="search"
          name="music-search"
          autoComplete="off"
          placeholder="Songs, artists, albums"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <section
        className="music-songs-section"
        aria-labelledby="search-results-heading"
      >
        <h2 id="search-results-heading">
          {normalized ? "Results" : "All songs"}
        </h2>
        {tracks.length ? (
          <CatalogTracks tracks={tracks} />
        ) : (
          <p className="music-no-results">No songs found in this collection.</p>
        )}
        <p className="sr-only" role="status">
          {normalized
            ? `${tracks.length} ${tracks.length === 1 ? "song" : "songs"} found.`
            : ""}
        </p>
      </section>
    </>
  );
}

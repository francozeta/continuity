import { appleMusicTracks } from "../apple-music-tracks";

export const albums = appleMusicTracks.map((track) => ({
  slug: track.id.toString(),
  title: track.album,
  artist: track.artist,
  artwork: track.artwork,
  tracks: [track.id],
}));

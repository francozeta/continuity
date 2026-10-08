import Image from "next/image";
import Link from "next/link";
import { albums } from "./catalog";
import { CatalogTracks } from "./track-list";
import { appleMusicTracks } from "../apple-music-tracks";

export default function LibraryPage() {
  return (
    <>
      <header className="music-page-heading">
        <p>Your collection</p>
        <h1>Library</h1>
      </header>
      <ul className="music-albums" aria-label="Albums">
        {albums.map((album) => (
          <li key={album.slug}>
            <Link href={`/music/album/${album.slug}`}>
              <Image
                src={album.artwork}
                alt=""
                width={320}
                height={320}
                sizes="(max-width: 640px) 44vw, (max-width: 1000px) 28vw, 320px"
              />
              <h2>{album.title}</h2>
              <p>{album.artist}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section
        className="music-songs-section"
        aria-labelledby="collection-heading"
      >
        <h2 id="collection-heading">Songs</h2>
        <CatalogTracks tracks={appleMusicTracks} />
      </section>
    </>
  );
}

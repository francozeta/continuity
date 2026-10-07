import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { albums } from "../../catalog";
import { appleMusicTracks } from "../../../apple-music-tracks";
import { CatalogTracks, PlayCollection } from "../../track-list";

export function generateStaticParams() {
  return albums.map(({ slug }) => ({ slug }));
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = albums.find((item) => item.slug === slug);
  if (!album) notFound();
  const tracks = appleMusicTracks.filter((track) =>
    album.tracks.includes(track.id),
  );
  return (
    <>
      <Link className="music-back-link" href="/music">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Library
      </Link>
      <header className="music-album-heading">
        <Image
          src={album.artwork}
          alt=""
          width={400}
          height={400}
          sizes="(max-width: 640px) 240px, 280px"
        />
        <div>
          <p className="music-eyebrow">Album</p>
          <h1>{album.title}</h1>
          <p className="music-album-artist">{album.artist}</p>
          <p className="music-album-note">Available audio preview</p>
          <PlayCollection trackIds={album.tracks} />
        </div>
      </header>
      <section className="music-songs-section" aria-label="Album previews">
        <CatalogTracks tracks={tracks} collection={album.tracks} />
        <p className="music-catalog-disclosure">
          A selection of public catalog previews.
        </p>
      </section>
    </>
  );
}

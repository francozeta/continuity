import type { Metadata } from "next";
import { PhotoGallery } from "./photo-gallery";
import "./photos.css";

export const metadata: Metadata = {
  title: "Photos — Continuity reference client",
  description:
    "A photo keeps its identity across a gallery, a full-window viewer and its details.",
};

export default function PhotosPage() {
  return <PhotoGallery />;
}

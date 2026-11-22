import type { Metadata } from "next";
import { PhotoExperiment } from "./experiment";

export const metadata: Metadata = {
  title: "Photos — Beetle",
};

export default function PhotosPage() {
  return <PhotoExperiment />;
}

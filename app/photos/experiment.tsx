"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@base-ui/react/button";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPhotoInteraction, type PhotoInteraction } from "./interaction";
import { photos } from "./photos";
import styles from "./experiment.module.css";

const aspectRatios = photos.map(({ width, height }) => width / height);
type Selection = { trigger: number; index: number; open: boolean };

function PhotoImage({ index, thumbnail = false, eager }: {
  index: number;
  thumbnail?: boolean;
  eager: boolean;
}) {
  const photo = photos[index];
  return (
    <Image
      src={`/beetle-photos/${photo.file}.webp`}
      alt={thumbnail ? "" : photo.alt}
      width={photo.width}
      height={photo.height}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      unoptimized
    />
  );
}

function Viewer({ index, thumbnail, interaction }: {
  index: number;
  thumbnail: (index: number) => HTMLElement | null;
  interaction: RefObject<PhotoInteraction | null>;
}) {
  const popup = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLUListElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!popup.current || !backdrop.current || !toolbar.current || !viewport.current || !rail.current) return;
    return interaction.current?.attach({
      popup: popup.current,
      backdrop: backdrop.current,
      toolbar: toolbar.current,
      viewport: viewport.current,
      rail: rail.current,
    });
  }, [interaction]);

  return (
    <>
      <Dialog.Backdrop ref={backdrop} className={styles.backdrop} />
      <Dialog.Popup
        ref={popup}
        initialFocus={close}
        finalFocus={() => thumbnail(index)}
        className={styles.popup}
        onKeyDown={(event) => {
          if (event.altKey || event.metaKey || event.ctrlKey || event.defaultPrevented) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            interaction.current?.pageBy(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <Dialog.Title className="sr-only">Photo viewer</Dialog.Title>
        <header ref={toolbar} className={styles.toolbar}>
          <div className={styles.navigation}>
            <Button
              aria-label="Previous photo"
              disabled={index === 0}
              focusableWhenDisabled
              className={styles.control}
              onClick={() => interaction.current?.pageBy(-1)}
            >
              <ChevronLeft size={22} aria-hidden />
            </Button>
            <Button
              aria-label="Next photo"
              disabled={index === photos.length - 1}
              focusableWhenDisabled
              className={styles.control}
              onClick={() => interaction.current?.pageBy(1)}
            >
              <ChevronRight size={22} aria-hidden />
            </Button>
          </div>
          <span className={styles.count} aria-hidden>{index + 1} / {photos.length}</span>
          <Dialog.Close ref={close} className={styles.control} aria-label="Close viewer">
            <X size={22} aria-hidden />
          </Dialog.Close>
          <span className="sr-only" role="status">{photos[index].label}, {index + 1} of {photos.length}</span>
        </header>
        <div
          ref={viewport}
          className={styles.viewport}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button === 0) event.preventDefault();
            interaction.current?.dragViewer(event.currentTarget, event.nativeEvent);
          }}
        >
          <ul ref={rail} className={styles.rail} aria-label="Viewer photos" role="list" hidden>
            {photos.map((photo, position) => (
              <li key={photo.file} className={styles.slide} aria-hidden={position !== index}>
                <PhotoImage index={position} eager={Math.abs(position - index) <= 1} />
              </li>
            ))}
          </ul>
        </div>
      </Dialog.Popup>
    </>
  );
}

export function PhotoExperiment() {
  const interaction = useRef<PhotoInteraction | null>(null);
  const thumbnails = useRef<(HTMLElement | null)[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);

  useLayoutEffect(() => {
    const instance = createPhotoInteraction({
      aspectRatios,
      thumbnail: (index) => thumbnails.current[index] ?? null,
      open(index) {
        setSelection({ trigger: index, index, open: true });
      },
      select(index) {
        setSelection((current) => current && { ...current, index });
      },
      close() {
        setSelection((current) => current && { ...current, open: false });
      },
    });
    interaction.current = instance;
    return () => {
      instance.destroy();
      interaction.current = null;
    };
  }, []);

  return (
    <Dialog.Root
      open={selection?.open ?? false}
      triggerId={selection ? `photo-${selection.trigger}` : null}
      onOpenChange={(open, details) => {
        if (open && details.trigger instanceof HTMLElement) {
          const index = Number(details.trigger.dataset.photoIndex);
          if (photos[index]) interaction.current?.press(index);
        } else if (!open) {
          details.cancel();
          interaction.current?.dismiss(details.reason === "escape-key");
        }
      }}
    >
      <main className={styles.gallery} aria-label="Photos" data-viewing={selection?.open || undefined}>
        <ul className={styles.grid} role="list">
          {photos.map((photo, index) => (
            <li key={photo.file}>
              <Dialog.Trigger
                ref={(node: HTMLElement | null) => { thumbnails.current[index] = node; }}
                id={`photo-${index}`}
                data-photo-index={index}
                className={styles.thumbnail}
                aria-label={photo.label}
                onPointerDown={(event) => {
                  interaction.current?.dragThumbnail(event.currentTarget, event.nativeEvent, index);
                }}
              >
                <PhotoImage index={index} thumbnail eager={index < 4} />
              </Dialog.Trigger>
            </li>
          ))}
        </ul>
      </main>
      {selection && (
        <Dialog.Portal>
          <Viewer
            index={selection.index}
            thumbnail={(index) => thumbnails.current[index] ?? null}
            interaction={interaction}
          />
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}

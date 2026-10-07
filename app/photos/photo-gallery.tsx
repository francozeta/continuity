"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContinuityBoundary,
  useContinuity,
  type ContinuityPartId,
} from "@/components/continuity/continuity";
import { photos, photoDate, type Photo } from "./catalog";

const MotionPopup = motion.create(Dialog.Popup);

function PhotoNavigation({
  direction,
  disabled,
  navigate,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  navigate: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (disabled && document.activeElement === buttonRef.current) {
      buttonRef.current?.parentElement
        ?.querySelector<HTMLButtonElement>(
          '.photos-filmstrip [aria-pressed="true"]',
        )
        ?.focus({ preventScroll: true });
    }
  }, [disabled]);
  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      className="photos-icon"
      aria-label={direction === "previous" ? "Previous photo" : "Next photo"}
      disabled={disabled}
      focusableWhenDisabled
      tabIndex={disabled ? -1 : 0}
      onClick={navigate}
    >
      {direction === "previous" ? (
        <ChevronLeft className="size-5" aria-hidden="true" />
      ) : (
        <ChevronRight className="size-5" aria-hidden="true" />
      )}
    </Button>
  );
}

function PhotoImage({
  photo,
  partId,
  thumbnail = false,
  zoomed = false,
}: {
  photo: Photo;
  partId: ContinuityPartId;
  thumbnail?: boolean;
  zoomed?: boolean;
}) {
  return (
    <motion.div
      layout
      layoutId={partId(photo.id, "image")}
      className={thumbnail ? "photos-thumbnail" : "photos-picture"}
      style={
        {
          borderRadius: thumbnail ? 10 : 0,
          "--photo-ratio": photo.width / photo.height,
        } as CSSProperties
      }
    >
      <Image
        src={photo.src}
        alt={thumbnail ? "" : photo.alt}
        fill
        sizes={
          thumbnail
            ? "(max-width: 640px) calc((100vw - 52px) / 2), (max-width: 1100px) calc((100vw - 120px) / 2), (max-width: 1440px) calc((100vw - 144px) / 3), 432px"
            : `(max-width: 640px) 100vw, min(calc(100vw - 48px), calc((100vh - 184px) * ${photo.width / photo.height}))`
        }
        loading={thumbnail ? "lazy" : "eager"}
        draggable={false}
        className={zoomed ? "photos-zoomed" : undefined}
      />
    </motion.div>
  );
}

function PhotoDetails({
  photo,
  caption,
  setCaption,
  headingRef,
  reduce,
}: {
  photo: Photo;
  caption: string;
  setCaption: (value: string) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  reduce: boolean;
}) {
  const present = useIsPresent();
  return (
    <motion.aside
      id="photo-details"
      className="photos-details"
      aria-labelledby="photo-details-heading"
      inert={!present}
      data-exiting={!present}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.14 }}
    >
      <h3 id="photo-details-heading" tabIndex={-1} ref={headingRef}>
        Details
      </h3>
      <dl>
        <div>
          <dt>Catalog date</dt>
          <dd>{photoDate(photo.date)}</dd>
        </div>
        <div>
          <dt>Photographer</dt>
          <dd>{photo.photographer}</dd>
        </div>
        <div>
          <dt>Image</dt>
          <dd>
            {photo.width} × {photo.height}
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>NASA Image and Video Library</dd>
        </div>
      </dl>
      <label htmlFor="photo-caption">Caption</label>
      <textarea
        id="photo-caption"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Add a caption"
        rows={3}
        maxLength={400}
      />
      <a
        href={`https://images.nasa.gov/details/${photo.id}`}
        target="_blank"
        rel="noreferrer"
      >
        View original <ArrowUpRight className="size-4" aria-hidden="true" />
      </a>
    </motion.aside>
  );
}

function PhotoViewer({
  photo,
  partId,
  collection,
  selected,
  select,
  favorite,
  toggleFavorite,
  zoomed,
  toggleZoom,
  caption,
  setCaption,
  detailsOpen,
  toggleDetails,
  closeRef,
  infoRef,
  headingRef,
  finalFocus,
  reduce,
}: {
  photo: Photo;
  partId: ContinuityPartId;
  collection: readonly string[];
  selected: string;
  select: (id: string) => void;
  favorite: boolean;
  toggleFavorite: () => void;
  zoomed: boolean;
  toggleZoom: () => void;
  caption: string;
  setCaption: (value: string) => void;
  detailsOpen: boolean;
  toggleDetails: (open: boolean) => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  infoRef: React.RefObject<HTMLButtonElement | null>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  finalFocus: () => HTMLElement | false;
  reduce: boolean;
}) {
  const present = useIsPresent();
  const index = collection.indexOf(selected);
  return (
    <>
      <Dialog.Backdrop
        className="photos-backdrop"
        inert={!present}
        style={{ pointerEvents: present ? undefined : "none" }}
        render={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
          />
        }
      />
      <Dialog.Viewport
        className="photos-viewport"
        inert={!present}
        style={{ pointerEvents: present ? undefined : "none" }}
      >
        <MotionPopup
          className="photos-viewer"
          layoutRoot
          layoutScroll
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: reduce ? 0 : 0.18 } }}
          initialFocus={closeRef}
          finalFocus={finalFocus}
          inert={!present}
        >
          <Dialog.Description className="sr-only">
            Photo viewer. Favorites, captions and zoom stay with each photo.
            Escape closes details before the viewer.
          </Dialog.Description>
          <header className="photos-viewer-bar">
            <Dialog.Close
              ref={closeRef}
              render={<Button variant="ghost" className="photos-icon" />}
              aria-label="Close photo"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
            <div className="photos-viewer-identity">
              <motion.div layout layoutId={partId(photo.id, "title")}>
                <Dialog.Title render={<motion.h2 layout="position" />}>
                  {photo.title}
                </Dialog.Title>
              </motion.div>
              <p>{photoDate(photo.date)}</p>
            </div>
            <div className="photos-viewer-actions">
              <Button
                variant="ghost"
                className="photos-icon"
                aria-label={
                  favorite ? "Remove photo from favorites" : "Favorite photo"
                }
                aria-pressed={favorite}
                onClick={toggleFavorite}
              >
                <Heart
                  className="size-5"
                  fill={favorite ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </Button>
              <Button
                variant="ghost"
                className="photos-icon"
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
                aria-pressed={zoomed}
                onClick={toggleZoom}
              >
                {zoomed ? (
                  <Minus className="size-5" aria-hidden="true" />
                ) : (
                  <Plus className="size-5" aria-hidden="true" />
                )}
              </Button>
              <Button
                ref={infoRef}
                variant="ghost"
                className="photos-icon"
                aria-label="Photo details"
                aria-expanded={detailsOpen}
                aria-controls={detailsOpen ? "photo-details" : undefined}
                onClick={() => toggleDetails(!detailsOpen)}
              >
                <Info className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </header>
          <div className="photos-viewer-layout" data-details={detailsOpen}>
            <motion.div layout className="photos-canvas">
              <PhotoImage photo={photo} zoomed={zoomed} partId={partId} />
            </motion.div>
            <AnimatePresence initial={false}>
              {detailsOpen && (
                <PhotoDetails
                  key="details"
                  photo={photo}
                  caption={caption}
                  setCaption={setCaption}
                  headingRef={headingRef}
                  reduce={reduce}
                />
              )}
            </AnimatePresence>
          </div>
          <footer className="photos-viewer-footer">
            <PhotoNavigation
              direction="previous"
              disabled={index <= 0}
              navigate={() => select(collection[index - 1])}
            />
            <div className="photos-filmstrip" aria-label="Photos in this view">
              {collection.map((id) => {
                const item = photos.find((photo) => photo.id === id)!;
                return (
                  <Button
                    key={id}
                    variant="ghost"
                    aria-label={`View ${item.title}`}
                    aria-pressed={selected === id}
                    onClick={() => select(id)}
                  >
                    <Image
                      src={item.src}
                      alt=""
                      width={56}
                      height={40}
                      sizes="56px"
                    />
                  </Button>
                );
              })}
            </div>
            <PhotoNavigation
              direction="next"
              disabled={index < 0 || index >= collection.length - 1}
              navigate={() => select(collection[index + 1])}
            />
            <p className="sr-only" role="status">
              {index + 1} of {collection.length}: {photo.title}
            </p>
          </footer>
        </MotionPopup>
      </Dialog.Viewport>
    </>
  );
}

export function PhotoGallery() {
  const [selected, setSelected] = useState(photos[0].id);
  const [collection, setCollection] = useState<readonly string[]>(
    photos.map((photo) => photo.id),
  );
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState<Record<string, boolean>>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const sources = useRef(new Map<string, HTMLButtonElement>());
  const galleryHeading = useRef<HTMLHeadingElement>(null);
  const continuity = useContinuity({
    returnFocus: () => sources.current.get(selected),
    fallbackFocus: () => galleryHeading.current,
  });
  const { open, reducedMotion: reduce, partId } = continuity;
  const closeRef = useRef<HTMLButtonElement>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const detailsHeading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<"details" | "info" | null>(null);
  const photo = photos.find((photo) => photo.id === selected)!;
  const visible =
    filter === "all"
      ? photos
      : photos.filter((photo) => favorites.includes(photo.id));
  const toggleFavorite = (id: string) =>
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  function toggleDetails(next: boolean) {
    pendingFocus.current = next ? "details" : "info";
    setDetailsOpen(next);
  }
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    (pendingFocus.current === "details"
      ? detailsHeading
      : infoRef
    ).current?.focus({ preventScroll: true });
    pendingFocus.current = null;
  }, [detailsOpen]);
  return (
    <ContinuityBoundary controller={continuity}>
      <Dialog.Root
        open={open}
        actionsRef={continuity.actionsRef}
        onOpenChange={(next, details) => {
          if (!next && details.reason === "escape-key" && detailsOpen) {
            details.cancel();
            toggleDetails(false);
            return;
          }
          if (next) setDetailsOpen(false);
          continuity.onOpenChange(next, details);
        }}
      >
        <div className="photos-app">
          <a href="#photos-library" className="photos-skip">
            Skip to photos
          </a>
          <nav className="photos-navigation" aria-label="Reference examples">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Continuity
            </Link>
            <div>
              <Link href="/music">Music</Link>
              <Link href="/photos" aria-current="page">
                Photos
              </Link>
              <Link href="/examples">Examples</Link>
            </div>
          </nav>
          <main id="photos-library">
            <header className="photos-library-heading">
              <div>
                <p>From orbit</p>
                <h1 ref={galleryHeading} tabIndex={-1}>
                  Photos
                </h1>
              </div>
              <div
                className="photos-filters"
                role="group"
                aria-label="Photo filter"
              >
                <Button
                  variant="ghost"
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  Library
                </Button>
                <Button
                  variant="ghost"
                  aria-pressed={filter === "favorites"}
                  onClick={() => setFilter("favorites")}
                >
                  Favorites
                </Button>
              </div>
            </header>
            <p className="photos-count" role="status">
              {visible.length} {visible.length === 1 ? "photo" : "photos"}
            </p>
            {visible.length ? (
              <ul
                className="photos-grid"
                aria-label={
                  filter === "all" ? "Photo library" : "Favorite photos"
                }
              >
                {visible.map((photo) => (
                  <li key={photo.id}>
                    <Dialog.Trigger
                      ref={(element: HTMLButtonElement | null) => {
                        if (element) sources.current.set(photo.id, element);
                        else sources.current.delete(photo.id);
                      }}
                      render={
                        <Button variant="ghost" className="photos-open" />
                      }
                      aria-label={`Open ${photo.title}`}
                      onClick={() => {
                        setSelected(photo.id);
                        setCollection(visible.map((item) => item.id));
                      }}
                    >
                      <PhotoImage photo={photo} thumbnail partId={partId} />
                      <div className="photos-card-caption">
                        <motion.div layout layoutId={partId(photo.id, "title")}>
                          <motion.span layout="position">
                            {photo.title}
                          </motion.span>
                        </motion.div>
                        <span>{photoDate(photo.date)}</span>
                      </div>
                    </Dialog.Trigger>
                    <Button
                      variant="ghost"
                      className="photos-icon photos-card-favorite"
                      aria-label={`${favorites.includes(photo.id) ? "Unfavorite" : "Favorite"} ${photo.title}`}
                      aria-pressed={favorites.includes(photo.id)}
                      onClick={() => toggleFavorite(photo.id)}
                    >
                      <Heart
                        className="size-4"
                        fill={
                          favorites.includes(photo.id) ? "currentColor" : "none"
                        }
                        aria-hidden="true"
                      />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="photos-empty">
                Your favorites will appear here. Save a photo from your library.
              </p>
            )}
            <p className="photos-credit">
              Photography from the{" "}
              <a
                href="https://images.nasa.gov/"
                target="_blank"
                rel="noreferrer"
              >
                NASA Image and Video Library
              </a>
              .
            </p>
          </main>
        </div>
        <Dialog.Portal>
          <AnimatePresence
            initial={false}
            onExitComplete={continuity.onExitComplete}
          >
            {open && (
              <PhotoViewer
                key="photo-viewer"
                photo={photo}
                partId={partId}
                selected={selected}
                collection={collection}
                select={setSelected}
                favorite={favorites.includes(selected)}
                toggleFavorite={() => toggleFavorite(selected)}
                zoomed={Boolean(zoom[selected])}
                toggleZoom={() =>
                  setZoom((current) => ({
                    ...current,
                    [selected]: !current[selected],
                  }))
                }
                caption={captions[selected] ?? ""}
                setCaption={(value) =>
                  setCaptions((current) => ({
                    ...current,
                    [selected]: value,
                  }))
                }
                detailsOpen={detailsOpen}
                toggleDetails={toggleDetails}
                closeRef={closeRef}
                infoRef={infoRef}
                headingRef={detailsHeading}
                finalFocus={continuity.finalFocus}
                reduce={reduce}
              />
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </ContinuityBoundary>
  );
}

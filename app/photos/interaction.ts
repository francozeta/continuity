import { projectDistance } from "@ui-sdk/core/gesture";
import { createHorizontalDrag } from "../beetle/horizontal-drag";
import { createBeetleSpring } from "../beetle/spring";

const TRAVEL = 132;
type Direction = -1 | 1;
type Motion = "surface" | "paging";
type Surface = {
  popup: HTMLDivElement;
  backdrop: HTMLDivElement;
  toolbar: HTMLElement;
  viewport: HTMLDivElement;
  rail: HTMLUListElement;
};
type Projection = {
  thumbnail: HTMLElement;
  image: HTMLImageElement;
  x: number;
  y: number;
  scale: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createPhotoInteraction({
  aspectRatios,
  thumbnail,
  open,
  select,
  close,
}: {
  aspectRatios: readonly number[];
  thumbnail: (index: number) => HTMLElement | null;
  open: (index: number) => void;
  select: (index: number) => void;
  close: () => void;
}) {
  const drag = createHorizontalDrag();
  const spring = createBeetleSpring();
  const last = aspectRatios.length - 1;
  let surface: Surface | null = null;
  let images: HTMLImageElement[] = [];
  let projection: Projection | null = null;
  let index = 0;
  let openView = false;
  let motion: Motion | null = null;
  let travel = 0;
  let destination: 0 | 1 = 0;
  let forward: Direction = -1;
  let page = 0;
  let pageWidth = 1;
  let closeAfterPaging = false;

  function paintPage() {
    if (surface) surface.rail.style.transform = `translate3d(${-page * 100}%, 0, 0)`;
  }

  function paintSurface() {
    if (!surface) return;
    surface.backdrop.style.opacity = String(travel);
    surface.toolbar.style.opacity = String(clamp((travel - 0.2) / 0.8, 0, 1));
    if (projection) {
      const remainder = 1 - travel;
      const { image, x, y, scale } = projection;
      image.style.transform = `translate3d(${x * remainder}px, ${y * remainder}px, 0) scale(${1 + (scale - 1) * remainder})`;
    }
  }

  function clearProjection() {
    if (!projection) return;
    projection.thumbnail.removeAttribute("data-lifted");
    projection.image.style.transform = "";
    projection = null;
  }

  function measureProjection(ensureThumbnailIsVisible: boolean) {
    const image = images[index];
    const thumb = thumbnail(index);
    if (!surface || !thumb || !image) return;

    const viewport = surface.viewport.getBoundingClientRect();
    let tile = thumb.getBoundingClientRect();
    if (ensureThumbnailIsVisible && (tile.top < 0 || tile.bottom > window.innerHeight)) {
      thumb.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      tile = thumb.getBoundingClientRect();
    }
    if (projection?.thumbnail !== thumb) clearProjection();

    // Both images use object-fit: contain. The scale maps their fitted
    // rectangles while the translation aligns their centers.
    const aspect = aspectRatios[index];
    const tileWidth = Math.min(tile.width, tile.height * aspect);
    const fittedWidth = Math.min(viewport.width, viewport.height * aspect);
    projection = {
      thumbnail: thumb,
      image,
      x: tile.left + tile.width / 2 - (viewport.left + viewport.width / 2),
      y: tile.top + tile.height / 2 - (viewport.top + viewport.height / 2),
      scale: fittedWidth > 0 ? tileWidth / fittedWidth : 1,
    };
    thumb.setAttribute("data-lifted", "");
  }

  function setMotion(next: Motion | null) {
    motion = next;
    if (next) surface?.popup.setAttribute("data-motion", next);
    else surface?.popup.removeAttribute("data-motion");
  }

  function settleSurface(next: 0 | 1, velocity = 0) {
    destination = next;
    setMotion("surface");
    spring.settle({
      from: travel * TRAVEL,
      to: next * TRAVEL,
      velocity,
      paint(position) {
        travel = clamp(position / TRAVEL, 0, 1);
        paintSurface();
      },
      done() {
        travel = next;
        paintSurface();
        if (next === 0 && surface) surface.popup.style.visibility = "hidden";
        clearProjection();
        setMotion(null);
        if (next === 0) {
          openView = false;
          close();
        }
      },
    });
  }

  function returnToGrid(direction: Direction) {
    forward = direction;
    setMotion("surface");
    measureProjection(true);
  }

  function settlePage(next: number, velocity = 0) {
    if (index !== next) {
      index = next;
      select(next);
    }
    setMotion("paging");
    const width = pageWidth;
    spring.settle({
      from: page * width,
      to: next * width,
      velocity,
      paint(position) {
        page = clamp(position / width, 0, last);
        paintPage();
      },
      done() {
        page = next;
        paintPage();
        setMotion(null);
        if (!closeAfterPaging) return;
        closeAfterPaging = false;
        returnToGrid(-1);
        settleSurface(0);
      },
    });
  }

  function lift(next: number) {
    openView = true;
    page = index = next;
    travel = destination = 0;
    forward = -1;
    closeAfterPaging = false;
    if (surface) surface.popup.style.visibility = "";
    setMotion("surface");
    open(next);
  }

  function surfaceOwner(previous: 0 | 1) {
    return {
      move(deltaX: number) {
        travel = clamp(travel + forward * deltaX / TRAVEL, 0, 1);
        paintSurface();
      },
      release(velocityX: number) {
        const velocity = forward * velocityX;
        const projected = travel + projectDistance(velocity, 0.985) / TRAVEL;
        settleSurface(projected < 0.5 ? 0 : 1, velocity);
      },
      cancel() {
        settleSurface(previous);
      },
    };
  }

  function pagingOwner(previous: number) {
    closeAfterPaging = false;
    setMotion("paging");
    const min = Math.max(0, Math.min(previous - 1, Math.floor(page)));
    const max = Math.min(last, Math.max(previous + 1, Math.ceil(page)));
    return {
      move(deltaX: number) {
        page = clamp(page - deltaX / pageWidth, min, max);
        paintPage();
      },
      release(velocityX: number) {
        const velocity = -velocityX;
        const projected = page + projectDistance(velocity, 0.992) / pageWidth;
        settlePage(Math.round(clamp(projected, min, max)), velocity);
      },
      cancel() {
        settlePage(previous);
      },
    };
  }

  return {
    attach(elements: Surface) {
      surface = elements;
      images = Array.from(elements.rail.querySelectorAll("img"));
      elements.popup.style.visibility = "";
      setMotion(motion);
      const measure = () => {
        pageWidth = elements.viewport.getBoundingClientRect().width || 1;
        if (motion === "surface") measureProjection(false);
        paintPage();
        paintSurface();
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(elements.viewport);
      return () => {
        observer.disconnect();
        clearProjection();
        surface = null;
        images = [];
      };
    },
    press(next: number) {
      if (openView || drag.active) return;
      lift(next);
      settleSurface(1);
    },
    dragThumbnail(element: HTMLElement, down: PointerEvent, next: number) {
      if (openView) return;
      drag.start(element, down, (direction) => {
        if (direction > 0) return;
        lift(next);
        return surfaceOwner(0);
      });
    },
    dragViewer(element: HTMLElement, down: PointerEvent) {
      if (!openView) return;
      const previous = destination;
      const previousIndex = index;
      const started = drag.start(element, down, (direction) => {
        if (motion === "surface") return surfaceOwner(previous);
        // Once claimed, an inward reversal stays with the same owner.
        const atStart = index === 0 && direction > 0;
        const atEnd = index === last && direction < 0;
        if (motion !== "paging" && (atStart || atEnd)) {
          returnToGrid(direction === 1 ? -1 : 1);
          return surfaceOwner(1);
        }
        return pagingOwner(previousIndex);
      }, () => {
        if (motion === "surface") settleSurface(previous);
        if (motion === "paging") settlePage(previousIndex);
      });
      if (started) spring.stop();
    },
    pageBy(direction: Direction) {
      if (!openView || motion === "surface") return;
      const next = clamp(index + direction, 0, last);
      if (next === index) return;
      drag.stop();
      closeAfterPaging = false;
      settlePage(next);
    },
    dismiss(escape: boolean) {
      if (!openView) return;
      if (escape && drag.active) {
        drag.cancel();
        return;
      }
      drag.stop();
      if (motion === "paging") {
        closeAfterPaging = true;
        settlePage(index);
        return;
      }
      if (motion !== "surface") returnToGrid(-1);
      settleSurface(0);
    },
    destroy() {
      drag.destroy();
      spring.destroy();
      clearProjection();
    },
  };
}

export type PhotoInteraction = ReturnType<typeof createPhotoInteraction>;

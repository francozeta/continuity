import { projectDistance } from "@ui-sdk/core/gesture";
import { createHorizontalDrag } from "./horizontal-drag";
import { createBeetleSpring } from "./spring";

const COMPACT = 0;
const PREVIEW = 1;
const EXPANDED = 2;
const DRAG_STEP = 112;

type Stage = typeof COMPACT | typeof PREVIEW | typeof EXPANDED;
type Bounds = { x: number; y: number; width: number; height: number };
type Surface = {
  frame: HTMLDivElement;
  popup: HTMLDivElement;
  backdrop: HTMLDivElement;
  scrollport: HTMLDivElement;
};

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

/** Coordinates one source row with one live dialog, independent of its content. */
export function createBeetleInteraction({
  open,
  resize,
  close,
}: {
  open: (source: HTMLElement) => void;
  resize: (expanded: boolean) => void;
  close: () => void;
}) {
  const drag = createHorizontalDrag();
  const spring = createBeetleSpring();
  let surface: Surface | null = null;
  let source: HTMLElement | null = null;
  let bounds: [Bounds, Bounds, Bounds] | null = null;
  let layoutHeight = 0;
  let progress = 0;
  let target: Stage = COMPACT;
  let moving = false;

  function paint() {
    if (!surface || !bounds) return;

    const from = progress <= PREVIEW ? bounds[0] : bounds[1];
    const to = progress <= PREVIEW ? bounds[1] : bounds[2];
    const fraction = progress <= PREVIEW ? progress : progress - PREVIEW;
    const x = from.x + (to.x - from.x) * fraction;
    const y = from.y + (to.y - from.y) * fraction;
    const width = from.width + (to.width - from.width) * fraction;
    const height = from.height + (to.height - from.height) * fraction;
    const clipRight = Math.max(0, bounds[2].width - width);
    const clipBottom = Math.max(0, layoutHeight - height);

    surface.popup.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    surface.popup.style.clipPath =
      clipRight > 0.01 || clipBottom > 0.01
        ? `inset(0 ${clipRight}px ${clipBottom}px 0 round 12px)`
        : "";
    surface.backdrop.style.opacity = String(clamp(progress, 1) * 0.32);
  }

  function setLayoutHeight() {
    if (!surface || !bounds) return;
    // The scrollport only changes size at the boundaries of travel. During
    // travel the clip reveals the same laid-out content.
    const height = bounds[moving ? EXPANDED : target].height;
    if (height !== layoutHeight) {
      layoutHeight = height;
      surface.popup.style.height = `${height}px`;
    }
  }

  function measure() {
    if (!surface || !source) return;
    const viewport = surface.frame.getBoundingClientRect();
    let row = source.getBoundingClientRect();
    if (row.bottom <= viewport.top || row.top >= viewport.bottom) {
      // Resizing can leave the original row outside the scroll viewport.
      source.scrollIntoView({ block: "nearest", inline: "nearest" });
      row = source.getBoundingClientRect();
    }
    const height = Math.max(row.height, viewport.height);
    const width = Math.max(row.width, viewport.width);
    const previewHeight = Math.max(row.height, Math.min(268, Math.round(height * 0.66)));
    bounds = [
      { x: row.left - viewport.left, y: row.top - viewport.top, width: row.width, height: row.height },
      { x: 0, y: clamp(row.top - viewport.top, height - previewHeight), width, height: previewHeight },
      { x: 0, y: 0, width, height },
    ];
    surface.popup.style.width = `${width}px`;
    setLayoutHeight();
    paint();
  }

  function setMoving(next: boolean) {
    moving = next;
    surface?.popup.toggleAttribute("data-moving", next);
    setLayoutHeight();
  }

  function finish() {
    progress = target;
    setMoving(false);
    paint();

    if (target === COMPACT) {
      if (surface) surface.popup.style.visibility = "hidden";
      source?.removeAttribute("data-lifted");
      source = null;
      close();
      return;
    }

    const focused = document.activeElement;
    if (focused instanceof HTMLElement && surface?.scrollport.contains(focused)) {
      focused.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function settle(next: Stage, velocity = 0) {
    target = next;
    if (next !== COMPACT) resize(next === EXPANDED);
    spring.settle({
      from: progress * DRAG_STEP,
      to: next * DRAG_STEP,
      velocity,
      start: () => setMoving(true),
      paint(position) {
        progress = clamp(position / DRAG_STEP, EXPANDED);
        paint();
      },
      done: finish,
    });
  }

  function lift(row: HTMLElement) {
    source = row;
    open(row);
  }

  function press(row: HTMLElement) {
    if (source || drag.active) return;
    lift(row);
    settle(PREVIEW);
  }

  function startDrag(element: HTMLElement, down: PointerEvent, fromRow: boolean) {
    if (fromRow ? source : !source) return;
    const previousTarget = target;
    const resume = () => {
      if (source && moving) settle(previousTarget);
    };
    const started = drag.start(element, down, (direction) => {
      if (fromRow && direction > 0) return;
      if (fromRow) lift(element);
      setMoving(true);
      return {
        move(deltaX) {
          // Integrating deltas lets a reversal leave either end immediately.
          progress = clamp(progress - deltaX / DRAG_STEP, EXPANDED);
          paint();
        },
        release(velocityX) {
          const velocity = -velocityX;
          const projected = progress + projectDistance(velocity, 0.985) / DRAG_STEP;
          settle(Math.round(clamp(projected, EXPANDED)) as Stage, velocity);
        },
        cancel: resume,
      };
    }, resume);
    // A new press holds the last painted position, even before it wins the axis.
    if (started) spring.stop();
  }

  return {
    attach(elements: Surface) {
      surface = elements;
      layoutHeight = 0;
      elements.popup.style.visibility = "";
      elements.popup.toggleAttribute("data-moving", moving);
      measure();
      source?.setAttribute("data-lifted", "");
      const observer = new ResizeObserver(measure);
      observer.observe(elements.frame);
      return () => {
        observer.disconnect();
        surface = null;
        bounds = null;
      };
    },
    press,
    startDrag,
    toggle() {
      if (!source) return;
      drag.stop();
      settle(target === EXPANDED ? PREVIEW : EXPANDED);
    },
    dismiss(escape: boolean) {
      if (!source) return;
      if (drag.active) {
        drag.cancel();
        if (escape || !source) return;
      }
      if (escape && target === COMPACT && moving) return;
      settle(escape && target === EXPANDED ? PREVIEW : COMPACT);
    },
    destroy() {
      drag.destroy();
      spring.destroy();
      source?.removeAttribute("data-lifted");
    },
  };
}

export type BeetleInteraction = ReturnType<typeof createBeetleInteraction>;

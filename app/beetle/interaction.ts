import { bindDrag } from "@ui-sdk/core";
import { createVelocityTracker, projectDistance, solveSpring } from "@ui-sdk/core/gesture";

const COMPACT = 0;
const PREVIEW = 1;
const EXPANDED = 2;
const DRAG_STEP = 112;
const SLOP = 8;

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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const tracker = createVelocityTracker({ maxSpeed: 1.5 });
  const listeners = new AbortController();
  let surface: Surface | null = null;
  let source: HTMLElement | null = null;
  let bounds: [Bounds, Bounds, Bounds] | null = null;
  let layoutHeight = 0;
  let progress = 0;
  let target: Stage = COMPACT;
  let moving = false;
  let frame = 0;
  let gesture: { down: PointerEvent; cancel: () => void; stop: () => void } | null = null;
  let canceledPointer: number | null = null;

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

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
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
    stopFrame();
    target = next;
    if (next !== COMPACT) resize(next === EXPANDED);
    if (reduceMotion.matches || Math.abs(progress - next) < 0.002) {
      finish();
      return;
    }

    setMoving(true);
    const spring = solveSpring(0.3, 1, (progress - next) * DRAG_STEP, velocity);
    const started = performance.now();
    function tick(now: number) {
      frame = 0;
      const elapsed = Math.max(0, now - started);
      const distance = spring.position(elapsed);
      if (Math.abs(distance) < 0.3 && Math.abs(spring.velocity(elapsed)) < 0.02) {
        finish();
        return;
      }
      progress = clamp(next + distance / DRAG_STEP, EXPANDED);
      paint();
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  function lift(row: HTMLElement) {
    source = row;
    open(row);
  }

  function press(row: HTMLElement) {
    if (source || gesture) return;
    lift(row);
    settle(PREVIEW);
  }

  function startDrag(element: HTMLElement, down: PointerEvent, fromRow: boolean) {
    if (gesture || !down.isPrimary || down.button !== 0 || (fromRow ? source : !source)) return;

    // Hold the last painted position on contact, even before this press wins
    // the axis. A tap or a native scroll can resume the interrupted settle.
    stopFrame();
    const previousTarget = target;
    const dragListeners = new AbortController();
    let claimed = false;
    let lastX = down.clientX;
    tracker.reset();
    tracker.add(down.timeStamp, lastX);

    function move(x: number, time: number) {
      // Integrating deltas makes a reversal leave either end immediately,
      // even after the finger kept going past the available travel.
      progress = clamp(progress + (lastX - x) / DRAG_STEP, EXPANDED);
      lastX = x;
      tracker.add(time, x);
      paint();
    }

    function stop() {
      dragListeners.abort();
      gesture = null;
      unbind();
    }

    function cancel() {
      canceledPointer = down.pointerId;
      stop();
      if (source && moving) settle(previousTarget);
    }

    const unbind = bindDrag(element, down, {
      threshold: SLOP,
      onStart(event) {
        const dx = event.clientX - down.clientX;
        const dy = event.clientY - down.clientY;
        claimed = Math.abs(dx) > Math.abs(dy) && (!fromRow || dx < 0);
        // Let the binding finish a rejected press so it can suppress its
        // drag click. The browser can still take over a vertical touch.
        if (!claimed) return;
        if (fromRow) lift(element);
        setMoving(true);
      },
      onMove(sample) {
        if (claimed) move(sample.x, sample.event.timeStamp);
      },
      onEnd(event, canceled) {
        dragListeners.abort();
        gesture = null;
        if (!source) return;
        if (canceled || !claimed) {
          if (moving) settle(previousTarget);
          return;
        }

        if (event.clientX !== lastX) move(event.clientX, event.timeStamp);
        const velocity = -tracker.velocity(event.timeStamp);
        const projected = progress + projectDistance(velocity, 0.985) / DRAG_STEP;
        const next = Math.round(clamp(projected, EXPANDED)) as Stage;
        settle(next, velocity);
      },
      cancelOnEscape: true,
    });
    gesture = { down, cancel, stop };

    const options = { signal: dragListeners.signal };
    element.addEventListener("lostpointercapture", (event) => {
      if (event.target === element && event.pointerId === down.pointerId) cancel();
    }, options);
    window.addEventListener("blur", cancel, options);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancel();
    }, options);
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.isPrimary) canceledPointer = null;
    if (gesture?.down.pointerType === "touch" && event.pointerType === "touch" &&
        event.pointerId !== gesture.down.pointerId) {
      gesture.cancel();
    }
  }, { capture: true, signal: listeners.signal });

  document.addEventListener("click", (event) => {
    if (canceledPointer === null || event.detail === 0) return;
    if (event instanceof PointerEvent && event.pointerId !== canceledPointer) return;
    canceledPointer = null;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true, signal: listeners.signal });

  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches && frame) {
      stopFrame();
      finish();
    }
  }, { signal: listeners.signal });

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
      if (gesture) {
        canceledPointer = gesture.down.pointerId;
        gesture.stop();
      }
      settle(target === EXPANDED ? PREVIEW : EXPANDED);
    },
    dismiss(escape: boolean) {
      if (!source) return;
      if (gesture) {
        gesture.cancel();
        if (escape || !source) return;
      }
      if (escape && target === COMPACT && moving) return;
      settle(escape && target === EXPANDED ? PREVIEW : COMPACT);
    },
    destroy() {
      listeners.abort();
      gesture?.stop();
      stopFrame();
      source?.removeAttribute("data-lifted");
    },
  };
}

export type BeetleInteraction = ReturnType<typeof createBeetleInteraction>;

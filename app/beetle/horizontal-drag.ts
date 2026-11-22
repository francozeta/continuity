import { bindDrag } from "@ui-sdk/core";
import { createVelocityTracker } from "@ui-sdk/core/gesture";

type DragOwner = {
  move: (deltaX: number) => void;
  release: (velocityX: number) => void;
  cancel: () => void;
};

/** Adds axis ownership and cancellation to the UI SDK pointer binding. */
export function createHorizontalDrag() {
  const tracker = createVelocityTracker({ maxSpeed: 1.5 });
  const listeners = new AbortController();
  let press: { down: PointerEvent; cancel: () => void; stop: () => void } | null = null;
  let canceledPointer: number | null = null;

  function start(
    element: HTMLElement,
    down: PointerEvent,
    claim: (direction: -1 | 1) => DragOwner | undefined,
    unclaimed?: () => void,
  ) {
    if (press || !down.isPrimary || down.button !== 0) return false;

    const dragListeners = new AbortController();
    let owner: DragOwner | undefined;
    let lastX = down.clientX;
    tracker.reset();
    tracker.add(down.timeStamp, lastX);

    function move(x: number, time: number) {
      owner?.move(x - lastX);
      lastX = x;
      tracker.add(time, x);
    }

    function stop() {
      dragListeners.abort();
      press = null;
      unbind();
    }

    function rollback() {
      if (owner) owner.cancel();
      else unclaimed?.();
    }

    function cancel() {
      canceledPointer = down.pointerId;
      stop();
      rollback();
    }

    const unbind = bindDrag(element, down, {
      threshold: 8,
      onStart(event) {
        const dx = event.clientX - down.clientX;
        const dy = event.clientY - down.clientY;
        // A rejected press can still finish or be canceled by native scroll.
        // Let the binding suppress any click produced after crossing slop.
        if (Math.abs(dx) > Math.abs(dy)) owner = claim(dx < 0 ? -1 : 1);
      },
      onMove(sample) {
        if (owner) move(sample.x, sample.event.timeStamp);
      },
      onEnd(event, canceled) {
        dragListeners.abort();
        press = null;
        if (canceled || !owner) {
          rollback();
          return;
        }
        if (event.clientX !== lastX) move(event.clientX, event.timeStamp);
        owner.release(tracker.velocity(event.timeStamp));
      },
      cancelOnEscape: true,
    });
    press = { down, cancel, stop };

    const options = { signal: dragListeners.signal };
    element.addEventListener("lostpointercapture", (event) => {
      if (event.target === element && event.pointerId === down.pointerId) cancel();
    }, options);
    window.addEventListener("blur", cancel, options);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancel();
    }, options);
    return true;
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.isPrimary) canceledPointer = null;
    if (press?.down.pointerType === "touch" && event.pointerType === "touch" &&
        event.pointerId !== press.down.pointerId) {
      press.cancel();
    }
  }, { capture: true, signal: listeners.signal });

  document.addEventListener("click", (event) => {
    if (canceledPointer === null || event.detail === 0) return;
    if (event instanceof PointerEvent && event.pointerId !== canceledPointer) return;
    canceledPointer = null;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true, signal: listeners.signal });

  return {
    start,
    get active() { return press !== null; },
    cancel() { press?.cancel(); },
    stop() {
      if (!press) return;
      canceledPointer = press.down.pointerId;
      press.stop();
    },
    destroy() {
      listeners.abort();
      press?.stop();
    },
  };
}

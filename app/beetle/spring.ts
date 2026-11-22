import { solveSpring } from "@ui-sdk/core/gesture";

/** Settles a painted position in pixels and can stop between any two frames. */
export function createBeetleSpring() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let complete: (() => void) | undefined;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    complete = undefined;
  }

  function finish() {
    const onFinish = complete;
    stop();
    onFinish?.();
  }

  function respectPreference() {
    if (reduced.matches) finish();
  }

  reduced.addEventListener("change", respectPreference);

  return {
    stop,
    settle({ from, to, velocity, start, paint, done }: {
      from: number;
      to: number;
      velocity: number;
      start?: () => void;
      paint: (position: number) => void;
      done: () => void;
    }) {
      stop();
      if (reduced.matches || Math.abs(from - to) < 0.25) {
        done();
        return;
      }

      start?.();
      complete = done;
      const spring = solveSpring(0.3, 1, from - to, velocity);
      const started = performance.now();
      function tick(now: number) {
        const elapsed = Math.max(0, now - started);
        const distance = spring.position(elapsed);
        if (Math.abs(distance) < 0.3 && Math.abs(spring.velocity(elapsed)) < 0.02) {
          finish();
          return;
        }
        paint(to + distance);
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    },
    destroy() {
      stop();
      reduced.removeEventListener("change", respectPreference);
    },
  };
}

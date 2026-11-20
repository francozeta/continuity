"use client";

import { spring as springGenerator, type SpringOptions } from "motion";
import { animate } from "motion/mini";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

// The installed TypeScript DOM lib predates the atomic move API.
type MoveTarget = HTMLElement & {
  moveBefore?: (node: Node, before: Node | null) => void;
};

export type BeetleProps = {
  /** A mounted, same-document destination. Null leaves the last placement intact. */
  destination: HTMLElement | null;
  /** Motion's spring options. Omit for an immediate move. */
  spring?: SpringOptions;
  children: ReactNode;
};

export function Beetle({ destination, spring, children }: BeetleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  const flight = useRef<ReturnType<typeof animate> | null>(null);
  const settle = useCallback(() => {
    flight.current?.cancel();
    flight.current = null;
  }, []);

  useLayoutEffect(() => {
    const container = (hostRef.current ??= document.createElement("div"));
    const preference = window.matchMedia(reducedMotionQuery);
    const listeners = new AbortController();
    const capture = { capture: true, passive: true, signal: listeners.signal };
    let heldPointer: number | null = null;

    function handlePreference(event: MediaQueryListEvent) {
      if (event.matches) settle();
    }

    // Hold the live target under a pressed pointer so native click/cancel works.
    function hold(event: PointerEvent) {
      const moving = flight.current;
      if (event.button !== 0 || heldPointer !== null || !moving) return;
      if (moving.state !== "running" && moving.state !== "paused") return;
      heldPointer = event.pointerId;
      const time = moving.time;
      moving.pause();
      moving.time = time;
    }

    function release() {
      if (heldPointer === null) return;
      heldPointer = null;
      const moving = flight.current;
      // Native click needs the same hit target through the end of this press.
      requestAnimationFrame(() => {
        if (
          heldPointer === null &&
          flight.current === moving &&
          moving?.state === "paused"
        ) {
          moving.play();
        }
      });
    }

    function releasePointer(event: PointerEvent) {
      if (event.pointerId === heldPointer) release();
    }

    function leaveWindow(event: PointerEvent) {
      if (event.relatedTarget === null) releasePointer(event);
    }

    container.addEventListener("pointerdown", hold, capture);
    window.addEventListener("pointerup", releasePointer, capture);
    window.addEventListener("pointercancel", releasePointer, capture);
    window.addEventListener("pointerout", leaveWindow, capture);
    window.addEventListener("blur", release, { signal: listeners.signal });
    window.addEventListener("resize", settle, { signal: listeners.signal });
    preference.addEventListener("change", handlePreference, { signal: listeners.signal });

    return () => {
      listeners.abort();
      settle();
      container.remove();
    };
  }, [settle]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !destination) return;
    const target: MoveTarget = destination;
    if (
      target.getRootNode() !== host.ownerDocument ||
      target === host.parentElement ||
      host.contains(target)
    ) {
      return;
    }

    // Read the current painted box before removing any previous translation.
    const current =
      host.isConnected && spring && !window.matchMedia(reducedMotionQuery).matches
        ? host.getBoundingClientRect()
        : null;
    settle();

    if (host.isConnected && target.moveBefore) {
      target.moveBefore(host, null);
    } else {
      const active = host.ownerDocument.activeElement;
      target.append(host);
      if (
        active instanceof HTMLElement &&
        host.contains(active) &&
        host.ownerDocument.activeElement !== active
      ) {
        active.focus({ preventScroll: true });
      }
    }

    if (!portalHost) {
      // Attach before mounting children so ref callbacks can measure and register them.
      setPortalHost(host);
    }
    if (!current) return;
    const next = host.getBoundingClientRect();
    const x = current.left - next.left;
    const y = current.top - next.top;
    if (x || y) {
      flight.current = animate(
        host,
        { transform: [`translate(${x}px, ${y}px)`, "none"] },
        { type: springGenerator, ...spring },
      );
    }
  }, [destination, portalHost, settle, spring]);

  return portalHost ? createPortal(children, portalHost) : null;
}

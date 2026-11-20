"use client";

import { Slider } from "@base-ui/react/slider";
import { Toggle } from "@base-ui/react/toggle";
import { Link2 } from "lucide-react";
import { spring } from "motion";
import { animate } from "motion/mini";
import Image from "next/image";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const handoff = { stiffness: 420, damping: 36, mass: 0.75 };
const motionPreference = "(prefers-reduced-motion: reduce)";

// The installed TypeScript DOM lib predates the atomic move API.
type Dock = HTMLDivElement & {
  moveBefore?: (node: Node, before: Node | null) => void;
};

export function BrightnessProof() {
  const id = useId();
  const [proof, setProof] = useState({ linked: false, first: 100, second: 100 });
  const [singleDock, setSingleDock] = useState<HTMLDivElement | null>(null);
  const [pairDock, setPairDock] = useState<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  const flight = useRef<ReturnType<typeof animate> | null>(null);
  const { linked, first, second } = proof;

  useLayoutEffect(() => {
    const container = (hostRef.current ??= document.createElement("div"));
    const preference = window.matchMedia(motionPreference);
    const listeners = new AbortController();
    const capture = { capture: true, passive: true, signal: listeners.signal };
    let heldPointer: number | null = null;

    function settle() {
      flight.current?.cancel();
      flight.current = null;
    }

    function handlePreference(event: MediaQueryListEvent) {
      if (event.matches) settle();
    }

    // Keep the actual target under a held pointer so native click/cancel still works.
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
      // Let native click finish hit-testing before allowing the button to move.
      requestAnimationFrame(() => {
        if (heldPointer === null && flight.current === moving && moving?.state === "paused") {
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
  }, []);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const destination: Dock | null = linked ? pairDock : singleDock;
    if (!host || !destination?.isConnected || host.parentElement === destination) return;

    // The previous animation still contributes to the painted box.
    const current = host.isConnected && !window.matchMedia(motionPreference).matches
      ? host.getBoundingClientRect()
      : null;
    flight.current?.cancel();
    flight.current = null;

    if (host.isConnected && destination.moveBefore) {
      destination.moveBefore(host, null);
    } else {
      const active = document.activeElement;
      destination.append(host);
      if (
        active instanceof HTMLElement &&
        host.contains(active) &&
        document.activeElement !== active
      ) {
        active.focus({ preventScroll: true });
      }
    }

    if (!portalHost) {
      // Attach before mounting children so ref callbacks can measure and register them.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPortalHost(host);
    }
    if (!current) return;
    const next = host.getBoundingClientRect();
    const x = current.left - next.left;
    const y = current.top - next.top;
    if (x || y) {
      flight.current = animate(
        portalHost,
        { transform: [`translate(${x}px, ${y}px)`, "none"] },
        { type: spring, ...handoff },
      );
    }
  }, [linked, pairDock, portalHost, singleDock]);

  function changeBrightness(value: number) {
    setProof((current) => ({
      ...current,
      first: value,
      second: current.linked ? value : current.second,
    }));
  }

  function linkBrightness(pressed: boolean) {
    setProof((current) => ({
      ...current,
      linked: pressed,
      second: pressed ? current.first : current.second,
    }));
  }

  return (
    <section className="beetle-proof" aria-label="Photograph pair">
      <figure className="beetle-frame">
        <div className="beetle-print" id={`${id}-first`}>
          <Image
            src="/beetle/salt-flats.webp"
            alt="Salt flats below a rocky slope in Death Valley"
            fill
            unoptimized
            draggable={false}
            style={{ filter: `brightness(${first}%)` }}
          />
        </div>
        <div className="beetle-dock beetle-dock--single" ref={setSingleDock} />
      </figure>
      <figure className="beetle-frame">
        <div className="beetle-print" id={`${id}-second`}>
          <Image
            src="/beetle/mountains.webp"
            alt="Sunlit desert mountains beneath streaked clouds"
            fill
            unoptimized
            draggable={false}
            style={{ filter: `brightness(${second}%)` }}
          />
        </div>
      </figure>
      <div className="beetle-dock beetle-dock--pair" ref={setPairDock} />
      {portalHost && createPortal(
        <div className="beetle-tool">
          <div className="beetle-reading" aria-hidden="true">
            <span>Brightness</span>
            <span className="beetle-value">{first}%</span>
          </div>
          <Slider.Root
            min={60}
            max={140}
            defaultValue={100}
            onValueChange={changeBrightness}
          >
            <Slider.Control className="beetle-slider">
              <Slider.Track className="beetle-track">
                <Slider.Indicator className="beetle-indicator" />
                <Slider.Thumb
                  className="beetle-thumb"
                  getAriaLabel={() =>
                    linked
                      ? "Brightness for both photographs"
                      : "Brightness for the first photograph"
                  }
                  getAriaValueText={(_, value) => `${value}%`}
                />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
          <Toggle
            className="beetle-link"
            aria-label="Link brightness"
            aria-controls={`${id}-first ${id}-second`}
            pressed={linked}
            onPressedChange={linkBrightness}
          >
            <Link2 aria-hidden="true" size={16} strokeWidth={1.75} />
            <span>Link</span>
          </Toggle>
        </div>,
        portalHost,
      )}
    </section>
  );
}

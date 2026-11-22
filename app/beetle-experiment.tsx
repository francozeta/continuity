"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, MoveUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./beetle.css";

type Position = "compact" | "peek" | "open";
type GestureSample = { y: number; time: number };
const positions: Position[] = ["open", "peek", "compact"];

function resistance(value: number, maximum: number) {
  if (value < 0) return -58 * (1 - Math.exp(value / 58));
  if (value > maximum) return maximum + 58 * (1 - Math.exp(-(value - maximum) / 58));
  return value;
}

export function BeetleExperiment() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef<(position: Position) => void>(() => {});
  const [position, setPosition] = useState<Position>("compact");

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    const handle = handleRef.current;
    const body = bodyRef.current;
    if (!stage || !card || !handle || !body) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduce.matches;
    let maximum = 0;
    let offset = 0;
    let target = 0;
    let speed = 0;
    let frame = 0;
    let lastFrame = 0;
    let pointer: number | null = null;
    let pointerStart = 0;
    let offsetStart = 0;
    let dragged = false;
    let samples: GestureSample[] = [];
    let current: Position = "compact";
    let alive = true;

    const anchor = (p: Position) =>
      p === "open" ? 0 : p === "peek" ? maximum * 0.52 : maximum;

    const closest = (value: number): Position =>
      positions.reduce((best, candidate) =>
        Math.abs(anchor(candidate) - value) < Math.abs(anchor(best) - value)
          ? candidate
          : best,
      );

    function paint() {
      card!.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
      const progress = maximum ? Math.max(0, Math.min(1, 1 - offset / maximum)) : 0;
      body!.style.opacity = String(Math.max(0, Math.min(1, (progress - 0.19) * 2.7)));
    }

    function cancelAnimation() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }

    function tick(now: number) {
      frame = 0;
      if (!alive || pointer !== null) return;
      if (reduceMotion) {
        offset = target;
        speed = 0;
        paint();
        return;
      }
      const dt = Math.min((now - (lastFrame || now)) / 1000, 0.025);
      lastFrame = now;
      const force = (target - offset) * 470 - speed * 39;
      speed += force * dt;
      offset += speed * dt;
      if (Math.abs(target - offset) < 0.2 && Math.abs(speed) < 1) {
        offset = target;
        speed = 0;
        paint();
        return;
      }
      paint();
      frame = requestAnimationFrame(tick);
    }

    function travel(next: Position, initialSpeed = 0) {
      current = next;
      setPosition(next);
      target = anchor(next);
      speed = reduceMotion ? 0 : initialSpeed;
      cancelAnimation();
      if (reduceMotion) {
        offset = target;
        paint();
      } else {
        frame = requestAnimationFrame(tick);
      }
    }

    function pointerDown(event: PointerEvent) {
      if (pointer !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointer = event.pointerId;
      pointerStart = event.clientY;
      offsetStart = offset;
      samples = [{ y: event.clientY, time: performance.now() }];
      dragged = false;
      speed = 0;
      cancelAnimation();
      handle!.setPointerCapture(event.pointerId);
    }

    function pointerMove(event: PointerEvent) {
      if (pointer !== event.pointerId) return;
      const displacement = event.clientY - pointerStart;
      if (Math.abs(displacement) > 3) dragged = true;
      if (!dragged) return;
      offset = resistance(offsetStart + displacement, maximum);
      const now = performance.now();
      samples.push({ y: event.clientY, time: now });
      samples = samples.filter((point) => now - point.time <= 95);
      paint();
    }

    function pointerEnd(event: PointerEvent, cancelled = false) {
      if (pointer !== event.pointerId) return;
      pointer = null;
      if (handle!.hasPointerCapture(event.pointerId)) handle!.releasePointerCapture(event.pointerId);
      if (cancelled) {
        travel(closest(offset));
        return;
      }
      if (!dragged) {
        const index = positions.indexOf(current);
        travel(positions[index === 0 ? 2 : index - 1]);
        return;
      }
      const now = performance.now();
      samples.push({ y: event.clientY, time: now });
      const start = samples[0];
      const dt = Math.max(0.001, (now - start.time) / 1000);
      const velocity = Math.max(-1600, Math.min(1600, (event.clientY - start.y) / dt));
      const projected = offset + velocity * 0.13;
      let next = closest(projected);
      if (Math.abs(velocity) > 700) {
        const index = positions.indexOf(closest(offset)) + (velocity > 0 ? 1 : -1);
        next = positions[Math.max(0, Math.min(positions.length - 1, index))];
      }
      travel(next, velocity);
    }

    function pointerUp(event: PointerEvent) { pointerEnd(event); }
    function pointerCancel(event: PointerEvent) { pointerEnd(event, true); }
    function captureLost(event: PointerEvent) {
      if (pointer === event.pointerId) {
        pointer = null;
        travel(closest(offset));
      }
    }

    function keyDown(event: KeyboardEvent) {
      let next: Position | undefined;
      const index = positions.indexOf(current);
      switch (event.key) {
        case "ArrowUp": next = positions[Math.max(0, index - 1)]; break;
        case "ArrowDown": next = positions[Math.min(2, index + 1)]; break;
        case "Home": next = "open"; break;
        case "End": case "Escape": next = "compact"; break;
        case "Enter": case " ": next = current === "compact" ? "open" : "compact"; break;
      }
      if (next) {
        event.preventDefault();
        travel(next);
      }
    }

    function measure() {
      maximum = Math.max(0, card!.offsetHeight - handle!.offsetHeight);
      if (pointer === null) {
        target = anchor(current);
        offset = target;
        speed = 0;
        cancelAnimation();
        paint();
      }
    }

    function motionChange() {
      reduceMotion = reduce.matches;
      if (reduceMotion && pointer === null) {
        cancelAnimation();
        offset = target;
        speed = 0;
        paint();
      }
    }

    handle.addEventListener("pointerdown", pointerDown);
    handle.addEventListener("pointermove", pointerMove);
    handle.addEventListener("pointerup", pointerUp);
    handle.addEventListener("pointercancel", pointerCancel);
    handle.addEventListener("lostpointercapture", captureLost);
    handle.addEventListener("keydown", keyDown);
    reduce.addEventListener("change", motionChange);
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(card);
    navigateRef.current = (next) => travel(next);
    measure();

    return () => {
      alive = false;
      cancelAnimation();
      observer.disconnect();
      reduce.removeEventListener("change", motionChange);
      handle.removeEventListener("pointerdown", pointerDown);
      handle.removeEventListener("pointermove", pointerMove);
      handle.removeEventListener("pointerup", pointerUp);
      handle.removeEventListener("pointercancel", pointerCancel);
      handle.removeEventListener("lostpointercapture", captureLost);
      handle.removeEventListener("keydown", keyDown);
      navigateRef.current = () => {};
    };
  }, []);

  return (
    <main className="beetle-only">
      <div className="beetle-stage" ref={stageRef}>
        <div className="beetle-card" ref={cardRef} data-position={position}>
          <Button
            ref={handleRef}
            type="button"
            variant="ghost"
            className="beetle-grip"
            aria-expanded={position !== "compact"}
            aria-controls="beetle-content"
            aria-label="Beetle. Drag vertically or use arrow keys to change size."
          >
            <span className="beetle-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
                <path d="M16 3.5 19.4 12.6 28.5 16 19.4 19.4 16 28.5 12.6 19.4 3.5 16 12.6 12.6 16 3.5Z" fill="currentColor" />
                <circle cx="16" cy="16" r="2.3" fill="#171717"/>
              </svg>
            </span>
            <span className="beetle-heading">
              <strong>Beetle</strong>
              <small>{position === "compact" ? "Drag to open" : position === "peek" ? "Keep going" : "Pull down to close"}</small>
            </span>
            <span className="beetle-direction" aria-hidden="true">{position === "open" ? <ArrowDown size={18}/> : <ArrowUp size={18}/>}</span>
          </Button>
          <div id="beetle-content" ref={bodyRef} className="beetle-content" inert={position === "compact"}>
            <div className="beetle-art" aria-hidden="true">
              <div className="beetle-orbit beetle-orbit-one"/>
              <div className="beetle-orbit beetle-orbit-two"/>
              <svg viewBox="0 0 100 100" width="74" height="74" fill="none" aria-hidden="true">
                <path d="M50 8 60.6 39.4 92 50 60.6 60.6 50 92 39.4 60.6 8 50 39.4 39.4 50 8Z" fill="currentColor"/>
                <circle cx="50" cy="50" r="7.5" fill="#dcdcdc"/>
              </svg>
            </div>
            <div className="beetle-content-bottom">
              <span className="beetle-index">001 / BEETLE</span>
              <div className="beetle-statement">Feel the<br/><em>movement.</em></div>
              <div className="beetle-bottom-bar">
                <span>Touch · release · interrupt</span>
                <Button type="button" variant="outline" className="beetle-collapse" onClick={() => navigateRef.current("compact")} aria-label="Collapse Beetle">
                  <MoveUpRight size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

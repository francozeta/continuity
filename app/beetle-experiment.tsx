"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { ArrowDown, ArrowUp, CornerDownLeft, RotateCcw, MoveVertical, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./beetle.css";

type Snap = "compact" | "peek" | "expanded";
type Feel = "precise" | "soft" | "elastic";
type Phase = "READY" | "DRAGGING" | "SETTLING" | "INTERRUPTED";
type RecordedPoint = { y: number; t: number };

const ORDER: Snap[] = ["expanded", "peek", "compact"];
const PRESETS: Record<Feel, { stiffness: number; damping: number }> = {
  precise: { stiffness: 510, damping: 42 },
  soft: { stiffness: 290, damping: 32 },
  elastic: { stiffness: 640, damping: 30 },
};

function elasticClamp(y: number, max: number) {
  if (y < 0) return -70 * (1 - Math.exp(y / 70));
  if (y > max) return max + 70 * (1 - Math.exp(-(y - max) / 70));
  return y;
}

export function BeetleExperiment() {
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const jumpRef = useRef<(target: Snap) => void>(() => {});
  const snapRef = useRef<Snap>("compact");
  const presetRef = useRef<Feel>("precise");
  const [snap, setSnap] = useState<Snap>("compact");
  const [feel, setFeel] = useState<Feel>("precise");
  const [reduced, setReduced] = useState(false);

  presetRef.current = feel;

  useEffect(() => {
    const stage = stageRef.current;
    const surface = surfaceRef.current;
    const grip = handleRef.current;
    const content = contentRef.current;
    if (!stage || !surface || !grip || !content) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionPreference.matches;
    let max = 0;
    let y = 0;
    let velocity = 0;
    let target = 0;
    let frame = 0;
    let lastFrame = 0;
    let pointerId: number | null = null;
    let startY = 0;
    let startPosition = 0;
    let moved = false;
    let points: RecordedPoint[] = [];
    let phase: Phase | null = null;
    let mounted = true;

    function anchor(value: Snap) {
      if (value === "expanded") return 0;
      if (value === "peek") return max * 0.52;
      return max;
    }

    function nearest(position: number): Snap {
      return ORDER.reduce((best, candidate) =>
        Math.abs(anchor(candidate) - position) < Math.abs(anchor(best) - position)
          ? candidate
          : best,
      );
    }

    function status(next: Phase) {
      if (phase !== next && phaseRef.current) {
        phaseRef.current.textContent = next;
        phase = next;
      }
    }

    function paint() {
      surface!.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
      const progress = max > 0 ? Math.max(0, Math.min(1, 1 - y / max)) : 0;
      content!.style.opacity = String(Math.min(1, Math.max(0, (progress - 0.14) * 2.1)));
      surface!.style.borderRadius = (24 + progress * 7).toFixed(2) + "px";
    }

    function cancelFrame() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }

    function animate(timestamp: number) {
      frame = 0;
      if (!mounted || pointerId !== null) return;
      if (reduceMotion) {
        y = target;
        velocity = 0;
        paint();
        status("READY");
        return;
      }
      const dt = Math.min((timestamp - (lastFrame || timestamp)) / 1000, 0.034);
      lastFrame = timestamp;
      const preset = PRESETS[presetRef.current];
      const acceleration = (target - y) * preset.stiffness - velocity * preset.damping;
      velocity += acceleration * dt;
      y += velocity * dt;
      paint();
      if (Math.abs(target - y) <= 0.2 && Math.abs(velocity) <= 1) {
        y = target;
        velocity = 0;
        paint();
        status("READY");
        return;
      }
      frame = requestAnimationFrame(animate);
    }

    function startAnimation() {
      cancelFrame();
      status("SETTLING");
      frame = requestAnimationFrame(animate);
    }

    function navigate(next: Snap, initialVelocity = 0) {
      snapRef.current = next;
      setSnap(next);
      target = anchor(next);
      velocity = reduceMotion ? 0 : initialVelocity;
      if (reduceMotion) {
        cancelFrame();
        y = target;
        paint();
        status("READY");
      } else {
        startAnimation();
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (pointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointerId = event.pointerId;
      startY = event.clientY;
      startPosition = y;
      moved = false;
      points = [{ y: event.clientY, t: performance.now() }];
      if (frame) status("INTERRUPTED");
      cancelFrame();
      velocity = 0;
      grip!.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientY - startY;
      if (Math.abs(distance) > 4) moved = true;
      if (!moved) return;
      y = elasticClamp(startPosition + distance, max);
      const now = performance.now();
      points.push({ y: event.clientY, t: now });
      points = points.filter((point) => now - point.t <= 90);
      if (speedRef.current && points.length > 1) {
        const first = points[0];
        const seconds = Math.max(0.001, (now - first.t) / 1000);
        speedRef.current.textContent = String(Math.round((event.clientY - first.y) / seconds)) + " px/s";
      }
      status("DRAGGING");
      paint();
    }

    function release(event: PointerEvent, cancelled = false) {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (grip!.hasPointerCapture(event.pointerId)) grip!.releasePointerCapture(event.pointerId);
      if (!moved || cancelled) {
        const next = !moved && !cancelled
          ? ORDER[Math.max(0, ORDER.indexOf(snapRef.current) - 1)]
          : nearest(y);
        navigate(next);
        return;
      }
      const now = performance.now();
      points.push({ y: event.clientY, t: now });
      const earliest = points[0];
      const elapsed = Math.max(0.001, (now - earliest.t) / 1000);
      const speed = (event.clientY - earliest.y) / elapsed;
      const projected = y + speed * 0.11;
      let next = nearest(projected);
      if (Math.abs(speed) > 420) {
        const current = nearest(y);
        const index = ORDER.indexOf(current) + (speed > 0 ? 1 : -1);
        next = ORDER[Math.max(0, Math.min(ORDER.length - 1, index))];
      }
      navigate(next, Math.max(-1500, Math.min(1500, speed)));
    }

    function onPointerUp(event: PointerEvent) {
      release(event);
    }

    function onPointerCancel(event: PointerEvent) {
      release(event, true);
    }

    function onLostCapture(event: PointerEvent) {
      if (pointerId === event.pointerId) release(event, true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        navigate(ORDER[Math.max(0, ORDER.indexOf(snapRef.current) - 1)]);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        navigate(ORDER[Math.min(2, ORDER.indexOf(snapRef.current) + 1)]);
      } else if (event.key === "Home") {
        event.preventDefault();
        navigate("expanded");
      } else if (event.key === "End" || event.key === "Escape") {
        event.preventDefault();
        navigate("compact");
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate(snapRef.current === "compact" ? "expanded" : "compact");
      }
    }

    function measure() {
      max = Math.max(0, surface!.offsetHeight - 82);
      target = anchor(snapRef.current);
      if (pointerId === null) {
        cancelFrame();
        y = target;
        velocity = 0;
        paint();
      }
    }

    function onMotionPreference() {
      reduceMotion = motionPreference.matches;
      setReduced(reduceMotion);
      if (reduceMotion && pointerId === null) {
        cancelFrame();
        y = target;
        velocity = 0;
        paint();
        status("READY");
      }
    }

    grip.addEventListener("pointerdown", onPointerDown);
    grip.addEventListener("pointermove", onPointerMove);
    grip.addEventListener("pointerup", onPointerUp);
    grip.addEventListener("pointercancel", onPointerCancel);
    grip.addEventListener("lostpointercapture", onLostCapture);
    grip.addEventListener("keydown", onKeyDown);
    motionPreference.addEventListener("change", onMotionPreference);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(stage);
    resizeObserver.observe(surface);
    jumpRef.current = navigate;
    setReduced(reduceMotion);
    measure();
    status("READY");
    return () => {
      mounted = false;
      cancelFrame();
      resizeObserver.disconnect();
      motionPreference.removeEventListener("change", onMotionPreference);
      grip.removeEventListener("pointerdown", onPointerDown);
      grip.removeEventListener("pointermove", onPointerMove);
      grip.removeEventListener("pointerup", onPointerUp);
      grip.removeEventListener("pointercancel", onPointerCancel);
      grip.removeEventListener("lostpointercapture", onLostCapture);
      grip.removeEventListener("keydown", onKeyDown);
      jumpRef.current = () => {};
    };
  }, []);

  return (
    <main className="beetle-page">
      <header className="beetle-topbar">
        <div className="beetle-wordmark"><span aria-hidden="true">✳</span> continuity <span className="beetle-slash">/</span> beetle</div>
        <a className="beetle-previous" href="/track">Track experiment <ArrowUpRight size={15} aria-hidden="true" /></a>
      </header>

      <section className="beetle-intro" aria-labelledby="beetle-heading">
        <div className="beetle-eyebrow">EXPERIMENT 001 <span>•</span> DIRECT MANIPULATION</div>
        <h1 id="beetle-heading">Beetle<span className="beetle-title-dot">.</span></h1>
        <p>One surface. Three positions. Touch it, interrupt it, make it yours.</p>
      </section>

      <div className="beetle-shell">
        <section className="beetle-stage" ref={stageRef} aria-label="Interactive Beetle surface laboratory">
          <div className="beetle-stage-top">
            <span>TACTILE SURFACE / 001</span>
            <span className="beetle-phase" ref={phaseRef}>READY</span>
          </div>
          <div className="beetle-target" aria-hidden="true">
            <div className="beetle-target-ring"><MoveVertical size={26} strokeWidth={1.2}/></div>
            <span>DRAG THE HANDLE</span>
            <small>Try to catch it mid-flight.</small>
          </div>
          <div className="beetle-surface" ref={surfaceRef} aria-label="Beetle surface" data-snap={snap}>
            <div className="beetle-handle" ref={handleRef} role="button" tabIndex={0} aria-label="Move the Beetle surface; up and down arrows change position" aria-expanded={snap !== "compact"} aria-controls="beetle-inner">
              <div className="beetle-handle-icon" aria-hidden="true"><MoveVertical size={21} strokeWidth={1.65} /></div>
              <div className="beetle-handle-label"><strong>Beetle Surface</strong><small>Grab · release · interrupt</small></div>
              <div className="beetle-handle-chevron" aria-hidden="true">{snap === "expanded" ? <ArrowDown size={19}/> : <ArrowUp size={19}/>}</div>
            </div>
            <div id="beetle-inner" className="beetle-inner" ref={contentRef} inert={snap === "compact"}>
              <div className="beetle-hero">
                <div className="beetle-hero-index">BEETLE / INTERACTION STUDY</div>
                <div className="beetle-hero-title">Motion you<br/>can <em>interrupt.</em></div>
                <p>This is not a drawer library. It is a test of touch, momentum, and how a web surface responds when you change your mind.</p>
              </div>
              <Tabs.Root defaultValue="behavior" className="beetle-tabs">
                <Tabs.List className="beetle-tabs-list" aria-label="Inspect the experiment">
                  <Tabs.Tab value="behavior" className="beetle-tab">Behavior</Tabs.Tab>
                  <Tabs.Tab value="anatomy" className="beetle-tab">Anatomy</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="behavior" className="beetle-tab-panel">
                  <div className="beetle-detail-row"><span>Direct manipulation</span><strong>pointer events</strong></div>
                  <div className="beetle-detail-row"><span>Animation</span><strong>spring / RAF</strong></div>
                  <div className="beetle-detail-row"><span>Coordinates</span><strong>transform only</strong></div>
                  <div className="beetle-detail-row"><span>Accessibility</span><strong>keyboard + reduce</strong></div>
                </Tabs.Panel>
                <Tabs.Panel value="anatomy" className="beetle-tab-panel">
                  <p className="beetle-anatomy-copy">Base UI provides the accessible tabs and buttons. The gesture loop is deliberately isolated from React rendering, inspired by UI SDK&apos;s behavior-first architecture.</p>
                  <p className="beetle-anatomy-copy">No public Beetle API yet. No extra animation runtime. This is research, not a replacement for Base UI or Motion.</p>
                </Tabs.Panel>
              </Tabs.Root>
            </div>
          </div>
        </section>

        <section className="beetle-controls" aria-label="Experiment controls">
          <div className="beetle-control-group">
            <div className="beetle-control-heading"><span>01 / Position</span><span>THREE SNAP POINTS</span></div>
            <div className="beetle-control-buttons" role="group" aria-label="Move to position">
              {(["compact", "peek", "expanded"] as Snap[]).map((value) =>
                <Button type="button" key={value} variant={snap === value ? "secondary" : "outline"} aria-pressed={snap === value} onClick={() => jumpRef.current(value)}>{value}</Button>
              )}
            </div>
          </div>
          <div className="beetle-control-group">
            <div className="beetle-control-heading"><span>02 / Physics</span><span>SPRING PRESETS</span></div>
            <div className="beetle-control-buttons" role="group" aria-label="Spring preset">
              {(["precise", "soft", "elastic"] as Feel[]).map((value) =>
                <Button type="button" key={value} variant={feel === value ? "secondary" : "outline"} aria-pressed={feel === value} onClick={() => setFeel(value)}>{value}</Button>
              )}
            </div>
          </div>
        </section>
        <div className="beetle-footnote">
          <div><span className="beetle-footnote-label">LAST GESTURE</span><strong ref={speedRef}>— px/s</strong></div>
          <div><span className="beetle-footnote-label">SYSTEM MOTION</span><strong>{reduced ? "REDUCED" : "ENABLED"}</strong></div>
          <Button type="button" size="sm" variant="ghost" onClick={() => jumpRef.current("compact")}><RotateCcw size={14} aria-hidden="true"/> Reset</Button>
        </div>
      </div>
      <footer className="beetle-footer">
        <span>Built on Base UI · UI SDK behavior model</span>
        <span>Swipe, tap, or use <CornerDownLeft size={12} aria-label="Enter"/> and arrow keys.</span>
      </footer>
    </main>
  );
}

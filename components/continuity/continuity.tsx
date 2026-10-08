"use client";

import { LayoutGroup, MotionConfig } from "motion/react";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

export type ContinuityPartId = (
  entityId: string | number,
  part: string,
) => string;
const partId: ContinuityPartId = (entityId, part) =>
  JSON.stringify([entityId, part]);
type SurfaceActions = { unmount: () => void; close: () => void };
type ChangeDetails = { preventUnmountOnClose: () => void };

/** Internal experiment: the app supplies identity and focus destinations.
 * Motion owns projection; Base UI still owns the modal and its dismissal rules.
 * Use one controller and boundary for each independent source/surface pairing.
 */
export function useContinuity({
  returnFocus,
  fallbackFocus,
}: {
  returnFocus: () => HTMLElement | null | undefined;
  fallbackFocus?: () => HTMLElement | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const latestOpen = useRef(false);
  const actionsRef = useRef<SurfaceActions>(null);
  const scope = useId();
  const reducedMotion = useReducedMotionPreference();
  const onOpenChange = useCallback((next: boolean, details: ChangeDetails) => {
    if (!next) details.preventUnmountOnClose();
    latestOpen.current = next;
    setOpen(next);
  }, []);
  const onExitComplete = useCallback(() => {
    // An old exit may finish after a new open request. Never unmount that surface.
    if (!latestOpen.current) actionsRef.current?.unmount();
  }, []);
  const finalFocus = useCallback(() => {
    const source = returnFocus();
    if (source?.isConnected) return source;
    const fallback = fallbackFocus?.();
    return fallback?.isConnected ? fallback : false;
  }, [returnFocus, fallbackFocus]);
  return {
    open,
    scope,
    partId,
    reducedMotion,
    actionsRef,
    onOpenChange,
    onExitComplete,
    finalFocus,
  };
}

export function ContinuityBoundary({
  controller,
  children,
}: {
  controller: ReturnType<typeof useContinuity>;
  children: ReactNode;
}) {
  const transition = controller.reducedMotion
    ? { type: false as const, duration: 0 }
    : { type: "spring" as const, stiffness: 330, damping: 34, mass: 0.85 };
  return (
    <MotionConfig transition={{ layout: transition }}>
      <LayoutGroup id={controller.scope}>{children}</LayoutGroup>
    </MotionConfig>
  );
}

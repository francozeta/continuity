"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useRef, useState } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContinuityBoundary,
  useContinuity,
  type ContinuityPartId,
} from "@/components/continuity/continuity";

const MotionPopup = motion.create(Dialog.Popup);
const entity = "beetle:prototype";

function Shell({
  expanded,
  linked,
  partId,
}: {
  expanded: boolean;
  linked: boolean;
  partId: ContinuityPartId;
}) {
  return (
    <motion.span
      layout
      layoutId={partId(entity, "shell")}
      className="beetle-shell"
      data-expanded={expanded}
      data-linked={linked}
      style={{ borderRadius: expanded ? 28 : 15 }}
      aria-hidden="true"
    >
      <span className="beetle-shell__core" />
      <span className="beetle-shell__wing beetle-shell__wing--left" />
      <span className="beetle-shell__wing beetle-shell__wing--right" />
      <span className="beetle-shell__seam" />
    </motion.span>
  );
}

function Expanded({
  partId,
  linked,
  setLinked,
  reduce,
  closeRef,
  finalFocus,
}: {
  partId: ContinuityPartId;
  linked: boolean;
  setLinked: (next: boolean) => void;
  reduce: boolean;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  finalFocus: () => HTMLElement | false;
}) {
  const present = useIsPresent();

  return (
    <>
      <Dialog.Backdrop
        className="beetle-backdrop"
        inert={!present}
        style={{ pointerEvents: present ? undefined : "none" }}
        render={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
          />
        }
      />
      <Dialog.Viewport
        className="beetle-viewport"
        inert={!present}
        style={{ pointerEvents: present ? undefined : "none" }}
      >
        <MotionPopup
          className="beetle-popup"
          layoutRoot
          layoutScroll
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: reduce ? 0 : 0.2 } }}
          initialFocus={closeRef}
          finalFocus={finalFocus}
          inert={!present}
        >
          <Dialog.Description className="beetle-sr-only">
            Beetle maintains an interactive identity between its compact source
            and this expanded portal. Press Escape or Fold to return.
          </Dialog.Description>

          <Dialog.Close
            ref={closeRef}
            render={<Button variant="ghost" className="beetle-close" />}
            aria-label="Fold Beetle"
          >
            <X size={18} strokeWidth={1.7} aria-hidden="true" />
          </Dialog.Close>

          <div className="beetle-popup__identity">
            <Shell expanded linked={linked} partId={partId} />
            <div className="beetle-popup__words">
              <span className="beetle-eyebrow">CONTINUITY / 001</span>
              <Dialog.Title
                render={
                  <motion.h2
                    layout
                    layoutId={partId(entity, "title")}
                    className="beetle-popup__title"
                  />
                }
              >
                Beetle
              </Dialog.Title>
              <motion.p
                className="beetle-popup__subtitle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.12 }}
              >
                One identity, different shapes.
              </motion.p>
            </div>
          </div>

          <div className="beetle-popup__footer">
            <button
              type="button"
              className="beetle-state-control"
              aria-pressed={linked}
              onClick={() => setLinked(!linked)}
            >
              <span className="beetle-state-control__check" aria-hidden="true">
                {linked && <Check size={13} strokeWidth={2.5} />}
              </span>
              <span>Preserve state</span>
              <span className="beetle-state-control__value">
                {linked ? "On" : "Off"}
              </span>
            </button>
            <span className="beetle-footer-hint">ESC TO FOLD</span>
          </div>
        </MotionPopup>
      </Dialog.Viewport>
    </>
  );
}

/**
 * Component-only study. Reuses the branch's internal Continuity coordination:
 * cross-portal part IDs, interruption-safe exit and returning focus.
 * This is deliberately NOT a published or stabilized Beetle API.
 */
export function BeetlePreview() {
  const [linked, setLinked] = useState(true);
  const sourceRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const continuity = useContinuity({
    returnFocus: () => sourceRef.current,
  });
  const { open, partId, reducedMotion: reduce } = continuity;

  return (
    <ContinuityBoundary controller={continuity}>
      <Dialog.Root
        open={open}
        actionsRef={continuity.actionsRef}
        onOpenChange={continuity.onOpenChange}
      >
        <Dialog.Trigger
          ref={sourceRef}
          render={<button type="button" className="beetle-trigger" />}
          aria-label="Unfold Beetle"
        >
          <Shell expanded={false} linked={linked} partId={partId} />
          <span className="beetle-trigger__words">
            <motion.span
              layout
              layoutId={partId(entity, "title")}
              className="beetle-trigger__title"
            >
              Beetle
            </motion.span>
            <span className="beetle-trigger__subtitle">
              {linked ? "Identity retained" : "Identity unlocked"}
            </span>
          </span>
          <ArrowUpRight
            className="beetle-trigger__arrow"
            size={18}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <AnimatePresence
            initial={false}
            onExitComplete={continuity.onExitComplete}
          >
            {open && (
              <Expanded
                key="beetle"
                partId={partId}
                linked={linked}
                setLinked={setLinked}
                reduce={reduce}
                closeRef={closeRef}
                finalFocus={continuity.finalFocus}
              />
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </ContinuityBoundary>
  );
}

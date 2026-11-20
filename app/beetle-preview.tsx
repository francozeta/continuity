"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useId, useRef, useState } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContinuityBoundary,
  useContinuity,
  type ContinuityPartId,
} from "@/components/continuity/continuity";

const MotionPopup = motion.create(Dialog.Popup);
const ENTITY = "beetle:note";
const MAX_LENGTH = 240;

/**
 * The mark is a moving part of the same entity, not an illustration.
 * The two plates subtly part when the working surface is open.
 */
function BeetleMark({
  partId,
  expanded,
}: {
  partId: ContinuityPartId;
  expanded: boolean;
}) {
  return (
    <motion.span
      layout
      layoutId={partId(ENTITY, "mark")}
      className="beetle-mark"
      data-expanded={expanded}
      style={{ borderRadius: expanded ? 17 : 12 }}
      aria-hidden="true"
    >
      <span className="beetle-mark__left" />
      <span className="beetle-mark__right" />
      <span className="beetle-mark__center" />
    </motion.span>
  );
}

function BeetleSurface({
  partId,
  note,
  setNote,
  reduce,
  editorRef,
  finalFocus,
  inputId,
}: {
  partId: ContinuityPartId;
  note: string;
  setNote: (next: string) => void;
  reduce: boolean;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  finalFocus: () => HTMLElement | false;
  inputId: string;
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
            transition={{ duration: reduce ? 0 : 0.15 }}
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
          layout
          layoutRoot
          layoutScroll
          layoutId={partId(ENTITY, "surface")}
          initial={false}
          exit={{ opacity: 0 }}
          transition={{
            layout: reduce
              ? { type: false, duration: 0 }
              : { type: "spring", stiffness: 420, damping: 38, mass: 0.8 },
            opacity: { duration: reduce ? 0 : 0.12 },
          }}
          initialFocus={editorRef}
          finalFocus={finalFocus}
          inert={!present}
          style={{ borderRadius: 25 }}
        >
          <Dialog.Description className="beetle-visually-hidden">
            Edit the note. Your text remains in this component when it folds.
            Escape closes the surface and returns focus to its trigger.
          </Dialog.Description>

          <header className="beetle-popup__header">
            <BeetleMark expanded partId={partId} />
            <div className="beetle-popup__identity">
              <span className="beetle-popup__eyebrow">CONTINUITY / 001</span>
              <Dialog.Title
                render={
                  <motion.h2
                    layout="position"
                    layoutId={partId(ENTITY, "name")}
                    className="beetle-popup__name"
                  />
                }
              >
                Beetle
              </Dialog.Title>
            </div>
            <Dialog.Close
              render={<Button variant="ghost" className="beetle-close" />}
              aria-label="Close Beetle"
            >
              <X size={17} aria-hidden="true" strokeWidth={1.8} />
            </Dialog.Close>
          </header>

          <div className="beetle-popup__body">
            <label className="beetle-popup__label" htmlFor={inputId}>
              Note
            </label>
            <textarea
              ref={editorRef}
              id={inputId}
              className="beetle-popup__editor"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={MAX_LENGTH}
              rows={3}
              spellCheck={false}
              placeholder="Write something…"
            />
          </div>

          <footer className="beetle-popup__footer">
            <span className="beetle-popup__retained">
              <Check size={14} aria-hidden="true" strokeWidth={1.8} />
              Retained in this instance
            </span>
            <span className="beetle-popup__count">
              {note.length}/{MAX_LENGTH}
            </span>
          </footer>
        </MotionPopup>
      </Dialog.Viewport>
    </>
  );
}

/**
 * A deliberately narrow component-only study.
 * Base UI owns dialog semantics, Motion owns projection and the existing
 * Continuity integration owns return focus and interruption-safe exit.
 * It is not yet a public primitive.
 */
export function BeetlePreview() {
  const [note, setNote] = useState("Interfaces should remember where they came from.");
  const sourceRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
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
          render={
            <motion.button
              type="button"
              className="beetle-trigger"
              layout
              layoutId={partId(ENTITY, "surface")}
              style={{ borderRadius: 19 }}
            />
          }
          aria-label="Open Beetle note"
        >
          <BeetleMark partId={partId} expanded={false} />
          <span className="beetle-trigger__identity">
            <motion.span
              className="beetle-trigger__name"
              layout="position"
              layoutId={partId(ENTITY, "name")}
            >
              Beetle
            </motion.span>
            <span className="beetle-trigger__excerpt">
              {note.trim() || "Write something…"}
            </span>
          </span>
          <ArrowUpRight
            className="beetle-trigger__arrow"
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <AnimatePresence
            initial={false}
            onExitComplete={continuity.onExitComplete}
          >
            {open && (
              <BeetleSurface
                key="beetle"
                partId={partId}
                note={note}
                setNote={setNote}
                reduce={reduce}
                editorRef={editorRef}
                finalFocus={continuity.finalFocus}
                inputId={inputId}
              />
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </ContinuityBoundary>
  );
}

# Beetle Experiment 002

Experiment 001 in [PR #9](https://github.com/francozeta/continuity/pull/9) drove
three vertical stops in a single sheet with a local spring and a handle. The
track study already showed that one persistent React owner can preserve values
across layouts. Experiment 002 tests what it takes to carry an active pointer
from an in-flow, scrollable row into a separately rendered modal surface and
back. [Continuity v0](./experiment-v0.md)

## Upstream source review

| Library | What its implementation already does |
| --- | --- |
| **Base UI** | Drawer combines a dialog-derived focus lifecycle with controlled snap points, swipe CSS variables, release handling, and touch arbitration with nested scroll targets. Dialog provides modal focus management, outside dismissal, scroll locking, and transition-aware unmount. The installed 1.8.0 and upstream head were both reviewed. [Drawer viewport](https://github.com/mui/base-ui/blob/52fac378e79c7eeccb38ae97adb9d33d9650b177/packages/react/src/drawer/viewport/DrawerViewport.tsx) · [Dialog popup in 1.8.0](https://github.com/mui/base-ui/blob/v1.8.0/packages/react/src/dialog/popup/DialogPopup.tsx) · [Animation completion](https://github.com/mui/base-ui/blob/v1.8.0/packages/react/src/internals/useAnimationsFinished.ts) |
| **Vercel UI SDK** | Drawer already handles scroll–sheet handoff in either direction, velocity, and interruptible Web Animations API settles along its configured edge. Its public `bindDrag` coalesces samples per frame, captures the pointer and suppresses the click a drag can generate. The SDK also exports focus recovery for removed controls and presence helpers that wait on animations. [Drawer driver](https://github.com/vercel-labs/ui/blob/06a7633f9543125163574d508a0bbdc3a173042d/packages/core/src/foundation/popups/sheet-pointer.ts) · [Drag binding](https://github.com/vercel-labs/ui/blob/f01f1739644ce83a0ba09fafc591d4050a2bbe83/packages/core/src/foundation/drag-and-drop/pointer.ts) · [Focus recovery](https://github.com/vercel-labs/ui/blob/06a7633f9543125163574d508a0bbdc3a173042d/packages/core/src/foundation/focus/focus-recovery.ts) · [Presence](https://github.com/vercel-labs/ui/blob/06a7633f9543125163574d508a0bbdc3a173042d/packages/core/src/foundation/motion/presence.ts) |
| **Vaul** | Composes Radix Dialog for semantics and focus, with configurable autofocus. Its pointer driver checks selection and scroll position, then retains drag ownership once claimed. It writes transforms during the drag and switches to CSS transitions on release. The maintainer marks the project unmaintained. [Drawer](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/index.tsx) · [Snap points](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/src/use-snap-points.ts) · [Maintenance status](https://github.com/emilkowalski/vaul/blob/3e97aac6a38e4481bade71d7233ed6002e80f9b0/README.md) |
| **Sonner** | Toasts lock a swipe axis and write two transform variables while dragged. Release uses distance or velocity to dismiss. Removal waits on a fixed timeout, CSS handles exit and reduced motion, and the toaster has keyboard entry and focus restoration. [Toast and toaster](https://github.com/emilkowalski/sonner/blob/8e4662b39255120b62138312058f5d77c0139a5e/src/index.tsx) · [Styles](https://github.com/emilkowalski/sonner/blob/8e4662b39255120b62138312058f5d77c0139a5e/src/styles.css) |

## Tested composition

- Base UI `Dialog.Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Title`, and
  `Close` own the modal. The popup uses `initialFocus` and `finalFocus` for the
  handoff. `Button` provides the size control, and `Checkbox.Root` and
  `Checkbox.Indicator` provide the interactive checklist controls.
- UI SDK `bindDrag` owns capture, frame scheduling and normal click suppression.
  `createVelocityTracker`, `projectDistance` and `solveSpring` from
  `@ui-sdk/core/gesture` supply release tracking, projection and settling.
  The experiment pins `@ui-sdk/core@0.1.0-beta.13`. The drag binding is marked
  stable in source, while the gesture math exports are experimental. There is
  no second React adapter in the runtime.
- Beetle measures the actual row and modal frame, keeps the row in flow and
  keeps the active pointer on that row as the dialog takes over visually.
  Preview and workspace share one mounted popup, scrollport and set of controls.
  At close, the dialog returns to the same row before Base UI restores focus.
  Checkbox values live in the experiment and survive closing and reopening.
- A horizontal press that passes slop can lift the row or move the panel from
  its header. Vertical panning on a row remains native list scrolling, and
  panning in a checklist scrolls the checklist. Re-grabbing stops the settle
  at its last painted position. Pointer cancellation, lost capture or another
  finger returns to the previous target. Reduced motion removes autonomous
  travel and keeps the direct scrub.
- The drag loop writes transform, clip and opacity. Geometry is measured at
  lift and frame resize, and the scrollport's layout height changes at surface
  boundaries. In a local Chromium Pixel 7 profile on the production build,
  24 trusted touch moves after claim triggered zero additional React commits and
  zero layouts. Blink recorded 24 style recalculations totaling about 3.2 ms.
  The probe covers the held drag and leaves device paint cost and frame pacing open.

Neither drawer's public interface takes an in-flight drag from an arbitrary row
and maps it to source and destination rectangles while keeping the same live
modal through subsequent layout changes. The useful code here is the
coordination of those boundaries. One checklist scenario still leaves a
standalone Beetle API unproven. Ordinary snap points and nested sheet scrolling
are already covered upstream.

## Verification

Run `pnpm lint`, `pnpm exec next typegen && pnpm exec tsc --noEmit`, and
`pnpm test:e2e`. The browser suite builds and serves the production app. Install
its browsers with `pnpm exec playwright install chromium webkit`.

- Chromium uses trusted touch events for native scrolling, a single stroke
  spanning both open surfaces, reversal at the travel limit, and interruption
  by cancellation, a second finger or capture loss.
- The mobile Chromium and WebKit profiles cover tap and keyboard activation,
  live DOM and focus retention, re-grab, scroll position, reduced motion,
  viewport resize and the `/track` route. WebKit uses touch taps and mouse drags.
- On a phone, start near the right edge of a row and swipe left. Keep moving
  through preview, reverse before lifting, and re-grab during a settle. Scroll
  vertically on the list and inside Packing, toggle a task, then shrink and
  reopen. Physical iOS Safari and Android Chrome latency, gesture competition
  with browser chrome, and VoiceOver and TalkBack still need device testing.

# Beetle Experiment 003

The photo experiment at `/photos` tests two horizontal behaviors on the same
surface. A leftward drag lifts a thumbnail from the scrolling grid. Once the
viewer is at rest, dragging toward an adjacent photo pages through the viewer.
Dragging outward from the first or last photo returns it to the grid. Tap,
arrow keys, Previous, Next, Close and Escape provide alternatives. [Experiment 002](./beetle-experiment-002.md)

## Gesture ownership

- The grid and viewer use `touch-action: pan-y pinch-zoom`. The grid keeps
  native vertical scrolling. Beetle claims horizontal movement after it passes
  the movement threshold.
- The press retains its owner until release or cancellation. An inward
  reversal during an edge dismissal restores the current photo. After
  paging to either edge, a fresh outward press can dismiss it.
- A press during a settle freezes the last painted position. It can reverse
  either the grid transition or paging. Cancellation returns to the intended
  resting state at the start of that press. Reduced motion removes the
  autonomous settle.
- Paging keeps the dialog and its controls mounted. Closing returns the last
  viewed photo to its own thumbnail and restores focus there. If the thumbnail
  is offscreen, the grid scrolls it into view before the return.
- An idle tap in the black letterbox around the painted photo dismisses the
  viewer. The image's DOM box fills the viewport, so the hit target is measured
  from the fitted image's actual aspect ratio, not the DOM element bounds.
  A tap on the photo itself does nothing; a horizontal drag from the empty
  area still pages or dismisses at an edge. The toolbar and its controls
  remain independent.
- During a transition, the viewer lays out its photo layer once the thumbnail
  is hidden and the projection is positioned. On close, the layer leaves
  layout before the thumbnail returns, with the final transform held until
  the dialog detaches.

## MDS review: “toque de la nada” (escape tap)

This is a local photo-viewer interaction, not a new global Beetle gesture.
The viewer's empty space is an intentional dismissal target only when no
surface animation or drag owns the gesture. The tap detector rejects movement
of at least 8 CSS pixels and ignores canceled and non-primary pointers.
Clicking the visible photo must not close it. Close, Escape, edge swipe, and
empty-space tap all retain the same surface-return animation and Base UI focus
restoration to the last photo.

The original iPhone capture showed the Earth image and thumbnail painted at
once. The prior handoff regression validates the photo layer exits layout
before the thumbnail returns; actual-device visual verification still matters.

## What the two experiments share

Beetle is an interaction primitive built on Base UI primitives and the Vercel
UI SDK. It coordinates changes of surface while preserving the user's active
gesture, visual origin and focus target.

Both use the private `createHorizontalDrag` and `createBeetleSpring` functions.
The first uses UI SDK `bindDrag` and `createVelocityTracker` for capture, frame
sampling, release velocity and cancellation. The second uses `solveSpring` and
owns interruption and the reduced-motion preference. Each experiment uses
`projectDistance` to choose a release target, and Base UI Dialog manages the
modal and focus. The photo viewer also uses Base UI Button for paging. The
checklist's clip and scrollport geometry and the viewer's scaled photo and
paging rules live in their respective experiments.

UI SDK Carousel uses native touch scrolling and CSS scroll snap. Its public
controller pages the carousel, while the viewer needs to assign a horizontal
press to one owner before the browser begins to pan. Directional
`touch-action` values are supported in the Chromium test browser and
unsupported in the WebKit test browser. The viewer uses a small local paging
track driven by the same input binding as the photo transition.
[Carousel touch implementation](https://github.com/vercel-labs/ui/blob/f01f1739644ce83a0ba09fafc591d4050a2bbe83/packages/core/src/components/carousel/carousel-motion.ts) ·
[`touch-action` and gesture start](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)

The two examples support reusing input ownership and interruptible motion
inside Continuity. Surface geometry, navigation boundaries and focus targets
still follow the individual interaction. A public Beetle API remains open.

## Verification

Run `pnpm lint`, `pnpm exec next typegen && pnpm exec tsc --noEmit`, and
`pnpm test:e2e`. The production browser suite covers both experiments and
`/track`. The photo cases cover focus after paging, re-grabbing both settles,
rotation, native grid scroll, routing a swipe at both edges, and cancellation.
The Earth photo regression checks that the viewer's photo layer has left
layout at the instant the scrolled thumbnail reappears. A separate WebKit run
with trusted touch input covered opening from a tile, paging both ways, edge
dismissal and focus return.

Two production-build Chromium traces each sent 24 trusted touch moves after
ownership was claimed. Both the page drag and the edge return changed the
painted transform with zero additional layouts or React commits. Each trace
included 24 style recalculations. Physical iPhone and Android review remains open.

On a phone, drag left from the right half of the first thumbnail. In the
viewer, swipe left to the second photo, then swipe right to the first. Start
another rightward drag, pause, and reverse with the same finger. On release,
the photo should either settle in the viewer or return to its thumbnail,
according to position and release speed.

## Photos

NASA imagery is served as local WebP files. The grid and viewer use the same
files so the opening photo can reuse the loaded resource.
[NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)

- [The Bahamas](https://images.nasa.gov/details/iss071e449837)
- [Aurora over Earth](https://images.nasa.gov/details/iss058e005282)
- [Waning Moon](https://images.nasa.gov/details/iss058e024106)
- [Grand Canyon](https://images.nasa.gov/details/iss074e0208848)
- [Orbital sunrise](https://images.nasa.gov/details/iss071e439624)
- [Mount Fuji](https://images.nasa.gov/details/iss074e0459411)
- [The Himalayas](https://images.nasa.gov/details/iss069e003192)
- [Hurricane Rita](https://images.nasa.gov/details/iss011e13532)
- [Mississippi River](https://images.nasa.gov/details/iss061e026278)
- [Earth from DSCOVR](https://images.nasa.gov/details/GSFC_20171208_Archive_e000676)
- [Namib Desert](https://images.nasa.gov/details/iss067e033271)
- [Clouds over New Zealand](https://images.nasa.gov/details/sl4-137-3566)

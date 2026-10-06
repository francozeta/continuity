# Experiment v0 — Track continuity

## Purpose

Test the product thesis before designing a library.

One track moves through three representations:

```
compact ↔ preview ↔ player
```

The demo should feel like one object changing context, not three screens crossfading.

## Entity

Use a single static track fixture. No API, database, auth, playlist system, or real player behavior is needed.

Suggested content:

- title
- artist
- cover
- secondary metadata
- a few inert playback actions

## Shared parts

Start with exactly three identities:

```
cover
title
artist
```

Anything else enters/exits normally.

## State 1 — compact

A restrained horizontal track card or row.

It must be obviously interactive without looking like a generic dashboard card.

## State 2 — preview

A contextual expanded surface.

Desktop and narrow screens may use different geometry, but the same logical state must remain active.

## State 3 — player

A larger composition that substantially reorganizes the same content.

The transition from preview → player is essential. If only compact → preview looks good, the experiment has not validated Continuity.

## Required interaction tests

### Reversal

Trigger:

```
compact → preview
```

then reverse before settling.

Repeat for:

```
preview → player
```

No snap, delayed close, or obvious restart should occur.

### Repeated navigation

Run:

```
compact → preview → player → preview → compact
```

several times. Geometry must remain stable.

### Reduced motion

Preserve semantic state changes while replacing spatial travel with a restrained fallback.

### Keyboard

All controls that change state must remain reachable and understandable by keyboard.

### Responsive presentation

Resize while preview is active.

The same entity/state should survive the presentation change.

## Implementation

For the first implementation, use Motion directly.

Do not create `Continuity.Root`, `State`, or `Shared` components at the start.

Instead, implement the demo normally and keep notes on repeated code and coordination pain.

After the interaction works, extract the smallest candidate abstraction and compare both implementations.

## Evidence log

### Phase 0 — reconciliation (2026-10-05, America/Lima)

- Local folder had no `.git`; all source was therefore untracked, not a divergent
  local commit history. Backed up the original files outside the repository.
- Attached the existing feature branch without overwriting local files, committed
  the App Router setup and merged `origin/main`. The latter only expanded research.
- Kept Next 16.3.8, React 19.2.8, TypeScript, Tailwind 4 and pnpm 11.23.0.
  Generated the missing lockfile. Motion is the only added runtime dependency.
- Read Issue #1 and all product documents. Starter opened in Chromium before edits.

### Phase 1 — direct Motion baseline

- A single persistent section changes its CSS grid instead of mounting unrelated
  cards. Cover/title/artist are the only named identities. No measurement code,
  portal or transition scheduler is needed yet.
- Focus is application logic: opening focuses Close; closing restores the track
  trigger. It cannot wait for an animation callback because reversal is immediate.
- Preview becomes an in-canvas bottom sheet through CSS alone. It remains a
  nonmodal disclosure at both sizes, so no breakpoint-specific focus trap is needed.
- Playback/saved state belongs to the persistent track owner, outside presentation.
  Controls are a silent demonstration, with no audio or external service.
- This topology makes `layoutId` redundant with persistent `layout` nodes. Keep the
  three explicit identities while investigating the third state; do not invent a
  wrapper to make them look more necessary.

### Phase 2 — third state

- Preview is a centered vertical composition; player places a much larger cover
  beside title, metadata, seek and playback controls. Player stacks at narrow sizes.
  There are still only three named identities, not a pairwise transition mapping.
- The same button acts as Close in preview and Back in player. Escape moves back
  one state. Player → preview restores focus to Open player; preview → compact
  restores the track trigger, independently of spring completion.
- A seek value now joins playing/saved state as a preservation probe. All three are
  held by the track, so changing presentation or viewport cannot reset them.
- Only contextual extras fade (160ms). Motion owns layout measurement, projection,
  spring retargeting and scale correction. No abstraction was needed to add player.

### Phase 3 — problems found in the browser

- `focus({ preventScroll: true })` kept Back offscreen at 320×568 and 844×390
  after opening player. Native `focus()` can keep keyboard focus visible without
  a custom focus scroll engine. This is product behavior, not identity boilerplate.
- Motion 14.0.0's installed `useReducedMotion` reads a `useState` snapshot at mount;
  toggling the preference in an existing session left spatial motion enabled.
  A local `useSyncExternalStore` subscription to `matchMedia` makes the preference
  reactive. Under reduce, layout transition is instant; contextual opacity remains
  a restrained 160ms. Dynamically changing `MotionConfig.reducedMotion` retained
  its mount-time flag. Disabling `layout` during hydration also left projection
  options disabled after re-enabling it. Frame-by-frame measurement caught jumps
  that state/focus assertions and settled screenshots missed. Keep `layout`/IDs
  stable and change the layout transition directly. This is a version-specific
  integration finding, not evidence for a new animation engine.
  Motion deliberately retains one frame at progress zero even for instant layout
  changes. The reduced-motion probe therefore checks only old/destination geometry
  in the first frames and no projection afterward, rather than mistaking that
  initial measurement frame for animated travel.
- Reserved the scrollbar gutter to keep vertical scrolling from shifting geometry.
  Enlarged the native seek target to 44px. At 320px, shortened state-path spacing
  to keep each label together. Fixed the missing space when the instruction's line
  break is hidden on narrow screens.
- axe found a footer link distinguishable only by color. Added an underline.
- Slow-motion frames exposed stretched controls/metadata inside the scaling shell.
  Unnamed `layout="position"` children supply Motion's scale correction. Contextual
  content mounts when relevant so it does not animate from a previously hidden
  zero-sized box. The cover/title/artist still persist; entity-owned playing,
  saved and seek values survive contextual-control remounts. No exit queue is needed.
- Correcting scale exposed contextual controls outside the growing shell in early
  frames. Clipped the shell to reveal them within its silhouette, and put the
  compact trigger's focus outline on the shell so clipping cannot hide that ring.
  A pointer reversal at 90ms then exposed Back drifting outside that clip during
  preview → player. Motion's native `layoutAnchor={{ x: 1, y: 0 }}` keeps its 44px
  target 8px from the animated shell's top/right edges. Both transitions now
  reverse through actual pointer clicks at 90ms, before the spring settles.
- Intermediate frames also exposed the labels crossing the cover on preview →
  player. Independent curved paths made title and artist collide during reversal.
  A persistent, unnamed text group now moves along Motion's native `arc` path;
  title and artist retain their own identities and scale correction inside it.
  The two explicit bend directions keep the return on the same side. In Motion
  14, relative-target interpolation bypassed the curve, so the group's native
  `layoutAnchor={false}` lets the path control its travel. Metadata remounts with
  a 120ms delayed fade to avoid competing with the moving labels. Five sampled
  checks cover both directions at desktop/320px and interruption at 140ms: no
  cover/label or label/label overlap was observed. This is product choreography
  using Motion, not evidence for a Continuity path engine.

While building, record:

- repeated IDs or naming conventions
- state coordination duplicated between representations
- focus/state preservation problems
- responsive presentation problems
- interruption problems
- code that disappears after extraction
- code that becomes harder after extraction

## Exit criteria

At the end, answer one question:

> Is there a small semantic primitive here that makes a real product interaction easier to build and reason about than direct Motion code?

If yes, design the API from the evidence.

If no, keep the experiment as research and change direction.

## Phase 4 — evidence review

1. **What repeats?** Three explicit identity strings occur once each. The Back
   destination appears in both click and Escape handlers; several contextual
   opacity/layout transitions are alike. These are small local product/animation
   choices. There is no duplicated graph mapping, entity store, portal manager or
   shared-element registration code to remove.
2. **What belongs to Motion?** Measurement, projection, scale correction, springs,
   interruption and layout paths. Keep their props visible. `layout="position"`
   on contextual children is scale correction, not a new semantic shared part.
3. **What is Continuity semantics?** A track is the same entity; compact, preview
   and player are its presentations; cover/title/artist convey that identity. This
   is a useful product description, but is already expressible by one React owner,
   a state union and CSS. Naming it does not establish a missing runtime primitive.
4. **Would entity/state/part reduce complexity?** Not in this topology. Persistent
   nodes and parent-owned values removed most coordination before any extraction.
   Focus destinations are specific to this product, not generic entity behavior.
5. **Is an abstraction clearer?** Here, the literal IDs and Motion props are more
   transparent. IDs are even redundant while each part persists in one DOM owner.
6. **What minimum API could be tested later?** At most, typed identity generation
   if multiple entities/independent render sites produce real naming repetition.
   There is no evidence yet for state registration, wrappers, context, presence
   ownership, engines or adapters.

| Candidate                      | Direct Motion baseline                        | Extra cost                                                                  | Decision       |
| ------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------- | -------------- |
| ID-generation helper           | Three readable ID literals                    | Three calls, an entity declaration and helper/types; no behavior disappears | Do not extract |
| Entity / State / Part wrappers | One local state and three persistent elements | Wrappers/registration while CSS, focus and Motion remain necessary          | Do not extract |

### Phase 5 decision

**Skipped because the evidence does not justify an internal Continuity prototype.**
No abstracted version was implemented. The table above compares the added cost;
adding a third state did not produce pairwise wiring.
The identity interaction can be reviewed now; library usefulness remains unproven.

This does not prove that independent render owners, routes or portals are equally
simple. None were necessary here, and the experiment does not claim to validate them.
Human perception, actual screen readers and other browser engines still need review.

## Verification record

Verified by interacting with the production build in Chromium through Playwright
CLI, not only by compiling. Temporary scripts, JSON results, screenshots and video
are kept locally in ignored `output/playwright/`; axe-core was unpacked there for
the audit and is not a project dependency.

| Check                        | Observed result                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`, `pnpm build`    | Clean lint; TypeScript and production build pass                                                                                                               |
| Keyboard-only full cycle     | Skip link → track → Close → Play → Save → Open player → Back → seek. Enter/Space/arrow keys work; Escape returns one state with the expected focus destination |
| Internal values              | Playing, saved and seek survive the complete roundtrip and 12 rapidly interrupted cycles                                                                       |
| Reversal at 140ms            | Both transitions have intermediate sampled geometry, reverse before reaching the target, and settle to the original 52px/160px cover widths                    |
| Pointer reversal at 90ms     | Back stays inside the growing shell at its current visual position; actual pointer clicks reverse compact → preview and preview → player before completion     |
| Label path                   | Sampled preview ↔ player at desktop/320px and desktop reversal at 140ms: title/artist remain together without overlap with each other or the cover             |
| Rapid toggling               | 12 interrupted full cycles, with 50ms gaps, settle to preview; identity DOM nodes remain the same                                                              |
| Preview resize               | 390×844, 320×568, 844×390, 768×1024 and 1440×1000 preserve entity/state, cover/title nodes and focused Play; no horizontal overflow                            |
| Player resize                | Seek remains focused and retains its value when resized to 320px                                                                                               |
| Short viewports              | Focused Back remains visible at 320×568 and 844×390 after the native-focus fix                                                                                 |
| Reduced motion               | Dynamic preference change removes spatial projection; switching back restores real motion. Loading with reduce enabled also has no spatial projection          |
| 200% CSS zoom / reflow probe | Preview and player remain operable without horizontal overflow; narrow-width reflow is separately covered above                                                |
| Automated accessibility      | axe-core 4.14.0: zero violations with WCAG 2 A/AA, 2.1 AA, 2.2 AA and best-practice tags in all three desktop states plus preview/player at 320px              |
| Visual review                | Settled desktop/narrow captures and sampled transition frames. A 60fps recording and a 10%-speed copy are available locally                                    |
| Runtime errors               | None observed during the final production interaction checks                                                                                                   |

The executable probes made 36 interaction assertions, 11 motion/accessibility
assertions, two pointer reversal assertions and five label-path assertions.
Initial reduced-motion boot was checked separately. These are local observations,
not claims of full screen-reader conformance or cross-browser coverage.

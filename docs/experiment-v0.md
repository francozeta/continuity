# Experiment v0 — Track continuity

## Purpose

Test the product thesis before designing a library.

One track moves through three representations:

```
compact ↔ preview ↔ player
```

The demo should feel like one object changing context, not three screens crossfading.

## Entity

Compare an anonymous Default study with an applied Apple Music study in the same
track owner. Default has static cover/title/artist placeholders without a loading
animation. Apple uses public catalog metadata, artwork and short preview audio;
it does not connect an account or provide full-song playback. Both retain the
same three presentation states and shared nodes. Earlier iterations remain below
as historical evidence.

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
The table below records the initial presentation; the component-only iteration
is documented afterward.

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

The initial executable probes made 36 interaction assertions, 11 motion/accessibility
assertions, two pointer reversal assertions and five label-path assertions.
Initial reduced-motion boot was checked separately. These are local observations,
not claims of full screen-reader conformance or cross-browser coverage.

## Component-only presentation — 2026-10-06

- Removed the page header, explanatory copy, canvas labels and footer. Only the
  track is visible; the page heading and state announcements remain available to
  assistive technology. Narrow preview now reaches the viewport bottom.
- Added the official shadcn Base UI Button and Slider. Their behavior collaborates
  with Motion; the track still owns playback, saved and seek values. Motion wraps
  Button for the moving Back and Open player controls and retains DOM refs/focus.
- Play/Pause uses the [transitions.dev icon swap](https://transitions.dev/skill.html)
  with both icons mounted, a 250ms blur/scale crossfade and its reduced-motion guard.
  UI styling, motion and accessibility skills informed this iteration.
- The shadcn CLI is a development dependency. The component sources remain local;
  no Continuity component API or additional application features were introduced.
- Base UI migration exposed the generated Button's fixed height on the absolute
  compact trigger. Overriding that height restores the whole-row click target.
- Moving the experiment to the viewport center exposed a one-frame title/cover
  intersection during a 140ms reversal. Increasing the native arc strength to
  1.35 restored clearance; sampled labels stay inside the surface in both directions.
- Rechecked the production build: lint/build pass; 41 interaction, 11 motion/axe,
  two pointer-reversal and five label-path assertions pass. axe found zero
  violations in the three desktop states and narrow preview/player. Checked the
  whole-row target, viewport-bottom sheet, Base UI seek keyboard/value/focus,
  Play/Pause icon visibility and its reduced-motion guard. Desktop/narrow captures
  and the local probe results are in `output/playwright/`. The Phase 4 extraction
  decision remains unchanged.

## Static iOS-style study — 2026-10-06

- Removed the track fixture and artwork asset. Cover, title and artist are static
  shadcn Skeleton shapes, hidden from assistive technology; this is a layout
  prototype, not a loading state. No pulse, shimmer, elapsed time or simulated
  audio is displayed. Controls retain meaningful names and a hidden description
  explains their demonstration purpose.
- A neutral rounded surface now contains a horizontal preview header (72px
  cover) and a portrait player (up to 312px cover). Both expanded states become
  bottom sheets on narrow screens. The downward chevron stays centered 8px from
  the surface top with a 44px target during interruption. Play/Pause, favorite
  and normalized progress remain local React state.
- Apple Music-style interaction is the direction for a future component. This
  iteration uses the [iPhone player controls](https://support.apple.com/en-ca/guide/iphone/iph676daac9b/ios)
  as a reference, without a music service integration or a stable component API.
- The horizontal-to-portrait composition exposed cover/label intersections.
  Native Motion arcs now use strength 1.35 toward player, 0.9 toward preview,
  and 1.8 for the narrow player-to-preview return. Local previous presentation
  selects that narrow return without affecting compact-to-preview. This is
  product choreography; projection, interruption and path interpolation remain
  Motion's responsibility. The three persistent names are `track:cover`,
  `track:title` and `track:artist`; no Continuity extraction is justified.
- Verified the final production build: lint/build pass; 43 interaction, 11
  motion/accessibility, two pointer-reversal and ten shape-path assertions pass.
  axe reports zero violations in the three desktop states and narrow expanded
  states. Static idle geometry, keyboard/focus, rapid reversals, resize and the
  reactive reduced-motion preference were checked. Desktop/narrow captures,
  sampled frames, a 60fps recording and a 10%-speed copy are kept locally in
  `output/playwright/`. Frame probes keep the test tab foregrounded to avoid
  background-browser throttling. These observations do not establish stable
  Apple Music parity or cross-browser conformance.

## Default / Apple Music comparison — 2026-10-06

- A small appearance selector compares the anonymous developer baseline with an
  independent Apple Music application of the same interaction. Switching retains
  presentation, normalized progress, selected track and the three persistent
  nodes, and pauses audio. No reusable public API was introduced.
- Public catalog samples select Underworld's Two Months Off, Aphex Twin's Xtal
  and Burial's Archangel. One persistent HTML audio element owns actual streamed
  previews; previous/next, seek, volume and the Base UI queue control real media.
  Favorites remain local and track-specific. Media rejection cannot overwrite a
  newer playback request, and unavailable audio gets explicit feedback.
- Apple's current player screenshot informed the artwork-derived blurred
  backdrop, immersive cover, top dismissal handle and progress/volume bars without
  visible knobs. Base UI retains the native slider inputs, 44px drag targets and
  track-level keyboard focus. The preview disclosure remains visible; the external
  Apple Music link moves into the queue to reduce clutter.
- The reported stretched mini controls came from ancestor layout projection.
  Unnamed position projection corrects their scale; 140ms blur/fade presence
  softens entrance/exit, with exiting controls inert. Shared cover/title/artist
  stay outside presence. The Default opener loses its decorative arrow and uses
  only the surface focus ring. See the Jakub references in `research.md`.
- Adding the selector exposed narrow placeholder paths clipping the surface.
  Native arc strengths are now 1.3 toward desktop player, 0.9 toward narrow
  player, 0.95 toward desktop preview and 1 toward narrow preview. The previous
  presentation state is no longer needed. Motion still owns interruption and
  interpolation; these values are local choreography.

The extraction decision is unchanged: customization, media ownership and
contextual presence have not exposed a missing Continuity runtime primitive.

Verified the production comparison in Chromium: clean lint/build, 43 Default
interaction assertions, 30 applied interaction assertions, 15 motion/axe
assertions, ten Default shape-path assertions and two pointer reversals at 90ms.
Ten desktop/narrow axe audits reported no violations. Six additional media/slider
checks passed: cross-appearance seeking updates real media time, knob-free bars
retain keyboard focus, progress clicks and volume drags work, the open queue has
no axe violations, and deliberately blocked audio exposes feedback and its source
link. The latter produces an expected failed network request. Final screenshots,
sampled opening frames and a 60fps recording with a 10%-speed copy are local in
`output/playwright/`. This remains a Chromium experiment, not a stable API or
verified cross-browser Apple Music replica.

## Desktop reference audit — 2026-10-06

No application code changed in this review. See the primary Apple references and
the proposed design direction in `research.md`.

| Viewport | Apple player | Cover | Observation |
| --- | --- | --- | --- |
| 1440 × 900 | 400 × 713px | 400 × 360px | Portrait composition occupies only 28% of viewport width. |
| 1280 × 720 | 400 × 553px | 400 × 200px | The cover shrinks disproportionately as viewport height falls. |
| 685 × 572 | 400 × 533px | 400 × 180px | Footer bottom is 625px; vertical scrolling is required. |
| 390 × 844 | 375 × 677px | 375 × 324px | Portrait bottom-sheet presentation fits this viewport. |

Reviewed both appearances, the three applied states, compact hover/focus, queue,
all three catalog covers and the existing 10%-speed motion capture. The square
Aphex artwork loses its outer composition under the immersive crop/fade. The
system font stack resolves differently on Windows than Apple's reference devices;
optical text/icon metrics still need an applied-design pass.

Six fresh preview/player/reversal samples at 1280 × 900 and 390 × 844 collected
274 animation frames. Five samples briefly intersected text bounds with cover
bounds; four briefly intersected title/artist line boxes. These geometric probes
are indicators, not pixel-ink collision tests. Settled frames had no intersections.
The applied trajectories and contextual timing need visual refinement independently
of the already passing Default placeholder paths. A fresh opening capture also
shows transport controls appearing while the timeline is still moving.

The Apple dismissal handle currently executes a click; it does not track a drag.
Either implement follow-pointer dismissal/cancellation or use a dismissal affordance
that accurately describes the available action. Native Apple timing/gesture behavior,
Safari and cross-browser material rendering were not verified in this review.

Design verdict: needs changes, chiefly desktop composition, artwork handling and
applied transition choreography. The existing direct-Motion extraction decision
is unchanged. Local review probes and captures remain in `output/playwright/`.

## Integrated Apple queue — 2026-10-06

- Queue visibility is an internal player panel. The existing cover/title/artist
  nodes shrink into the current-track header; no fourth `TrackState`, duplicate
  current-track representation or additional named projection identity was added.
  Rows have actual catalog artwork, title and artist. Playback controls remain
  available below the scrollable list, with an active queue toggle.
- The finite upcoming selection excludes the current track. Selecting a row
  updates the persistent audio owner; an ended preview advances to the next item
  and the final preview stops. Next is disabled at the end. History is populated
  by actual audio playing events, not by merely selecting or seeking a track.
  History rows can be played and the history can be cleared independently.
- The source link moves into the shadcn/Base UI track-actions popover alongside
  the existing favorite control. Unsupported service controls were not added.
  Escape hides the queue first and restores its trigger; a removed focused row
  returns focus to the heading. Natural playback advancement does not steal focus
  from other surviving controls. Closed presence content is inert.
- The player source keeps square artwork geometry. Per the user's correction,
  its previous dark gradient and fading cover are restored. The queue has stronger
  top dimming because text occupies that area. The dismissal chevron accurately
  presents the existing click action. Gesture dismissal is still unimplemented.
- Slow motion review exposed a wrong text curve on entry into the queue header.
  Reusing the native preview-return arc for that direction corrected it. Six
  desktop/mobile open/close/reversal probes collected 296 frames: no text-range
  bounds intersected the cover or clipped the surface, and transport/action icons
  retained their aspect ratio. Full-width heading boxes had false-positive clipping;
  the refined probe measures text ranges instead. This is geometric evidence, not
  a general pixel-ink or native-animation parity claim.

Validation: clean lint/build; 36 applied queue checks and five Default regression
checks pass. Five queue viewport audits (1440×900, 1280×720, 685×572, 390×844,
320×568) and the three Default states reported zero axe violations. Checked real
audio advancement/stopping, source popover, keyboard/escape/focus, no fabricated
history, reduced motion, persistent shared nodes/audio and horizontal reflow.
Short viewports retain vertical scrolling; this remains a portrait composition
on desktop. Local recordings, a 10%-speed review and frame probes are in
`output/playwright/`. Cross-browser rendering and native gestures remain unverified.

The queue demonstrates another presentation within one track owner. Direct React
state, CSS and Motion still handle its coordination. It does not supply evidence
for extracting a Continuity public API or packaging a component library.

## Cover restoration and review handoff — 2026-10-06

The latest review restores the original edge-to-edge, cropped player artwork
with its dark fade. The source, selection, backdrop and current control/queue
design remain intact. The artwork extends through the top padding; its height is
bounded by the player's content width so narrow screens preserve the previous
layout below the cover. Container-relative sizing avoids a viewport-specific
scrollbar assumption. This supersedes the square cover choice above.

Before/after measurements across five viewports and three settled presentations
(Apple player, Apple queue, Default player) found no changes to surface size,
identity, timeline, transport or extras geometry. Queue and Default artwork bounds
also remain unchanged. Player text arcs are slightly flatter: return/reversal
probes exposed a few transient pixels outside the surface with the wider cover.
Six final desktop/mobile probes sampled 247 frames, with no text-range clipping
or cover intersections and no material icon aspect distortion. A 10%-speed
recording and selected frames were inspected; these checks do not establish
native gesture behavior or pixel-perfect Apple parity.

Production lint/build, the 36 applied queue checks and five Default regression
checks pass after restoration. The five queue viewport audits and three Default
state audits report zero axe violations.
Local captures and reports remain in ignored `output/playwright/`. The README now
describes the integrated queue, contextual source action and dismissal chevron.
The next review should address desktop composition, real dismissal gestures and
coordination across an independent owner or portal, in that order. Extraction
remains deferred until those cases provide evidence that direct Motion code is
repeating coordination that a smaller semantic layer could actually simplify.

## Published experiment — 2026-10-06

The production demo is live at [continuity.francozeta.com](https://continuity.francozeta.com)
on the Vercel project `continuity`. The cloud Next.js build passed using the pinned
pnpm 11.23.0 through Corepack. Deployment `dpl_J3QwwnstNnMjm8G7vew1aUxdsuq8`
contains application commit `7f4d802`; subsequent deployment documentation does
not change that application. The domain is verified and serves public HTTPS with
an HTTP 200 response.

Eight hosted smoke checks passed in Chromium: the applied player renders at the
custom URL, artwork loads, real preview audio plays, the upcoming queue opens,
the 390×844 queue has no horizontal overflow, Escape restores its trigger,
switching to Default retains player state and pauses audio, and those interactions
produce no runtime errors. Desktop and mobile captures were inspected and remain
in ignored `output/playwright/`. This deployment check supplements the local
evidence above; it does not establish additional browser or native-gesture parity.

## PR readiness review — 2026-10-06

### Findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `app/track-experiment.tsx`, queue selection | Every focused queue row moved focus to the heading. | Check whether the focused DOM row actually disconnected after selection. | Preserve keyboard position when a row survives natural advancement or history selection. |
| MEDIUM | `app/track-experiment.tsx`, appearance buttons | Apple preview errors remained visible in Default. | Clear the error on appearance changes. | Announce errors only in their relevant context. |
| LOW | `app/globals.css`, `.music-queue` | A fixed mask faded the last row even at the scroll end. | Remove the queue mask. | Keep the final row and its focus indicator visible. |

The review also synchronizes documented arc strengths and anchors Vercel's local
capture exclusions. A dry run includes 33 files and no local QA/build/environment
entries. Trailing-slash patterns retained empty directory entries, so the root
directories use `/output` and `/.playwright-cli`.

### Verification and verdict

Lint and production build pass. Nine targeted Chromium checks pass for surviving
and removed row focus, disabled Next focus, unmasked final rows, Escape, error
clearing across appearances and a zero-violation axe audit. Playback lifecycle
events were dispatched for deterministic focus cases; these supplement the real
media checks above. Screen-reader speech and additional browsers were not tested.
Verdict: Approve for the existing experimental scope; the follow-up limitations
above remain.

## Reference consumer, stage 1 — 2026-10-06

The user authorized a staged application example after the reference research.
`/music` adds independent route owners and a Base UI body portal while preserving
the original study at `/`. Playback state is application-owned in the persistent
music layout. Current cover/title/artist are projected between a surviving
MiniPlayer and the portal with direct Motion. Catalog copies do not all register
as transition sources. See [the reference client log](reference-client.md).

Thirteen production Chromium checks, lint and build passed for this stage. The
origin catalog row was filtered out before closing; the audio element remained
identical and playing, and focus returned to the MiniPlayer. This exercises a
previously missing topology. It has not yet exposed repetition that would justify
a public entity API; extraction remains evidence-driven.

## Reference consumer, stages 2–3 — 2026-10-06

The reference client now has editable queue occurrences and mobile dismissal
through Base UI Drawer. Direct Motion projects current cover/title/artist between
the MiniPlayer and a full-window body portal. The supplied desktop reference is a
centered square cover over its controls; narrow layouts retain full-width fading
artwork. The original v0 composition remains unchanged.

The final production build passes lint, TypeScript and 57 Chromium checks for
route/audio ownership, fullscreen sizing, queue editing, pointer/touch/keyboard
input, cancelled and interrupted dismissal, real preview advancement, focus,
failure recovery, reduced motion and the original Default study. Six grouped
session checks pass in Node. The open player/queue and all three Default states
report zero axe violations. Details and review findings are in
[the reference client log](reference-client.md).

This supplies evidence for independent owners and a portal, but still one domain.
Audio/session ownership stays in the app, occurrence keys stay separate from
song IDs, and transition participants are deliberately paired. No reusable
Continuity API was extracted. Local Chromium touch emulation does not establish
Safari/native-device parity or field performance; those remain follow-up work.

# Research notes

## Existing territory

### Motion

Motion already provides `layout`, `layoutId`, `LayoutGroup`, presence, gestures, springs, and shared-layout transitions. It is the animation engine for v0, not something Continuity should replace.

### React View Transitions

React now exposes native View Transition primitives for larger view changes and shared elements. Continuity should not become a prettier wrapper around view-transition names.

### Motion Primitives

Strong copy-first interaction primitives and polished morphing components. This establishes a high quality bar, but its unit is primarily the individual primitive.

### React Morpheus

Models a controlled collapsed surface and expanded surface, measuring and animating geometry and surface styles. This is close to the simple `A → B` version of Continuity.

### Vista Sheet

A trigger morphs into a modal sheet using shared layout identity. Another example showing that trigger-to-surface morphing alone is not sufficient differentiation.

### SwiftUI

`matchedGeometryEffect` lets multiple views synchronize geometry through an explicit namespace and identity. The important lesson is that persistent identity can be modeled separately from the view hierarchy.

### Jetpack Compose

Compose now has stable high-level shared-transition APIs:

- `SharedTransitionLayout`
- `sharedElement`
- `sharedBounds`
- integration with animated content, visibility, and navigation
- explicit behavior for overlays, clipping, resize modes, and dynamically enabled shared elements

This is important evidence that shared identity is a real UI primitive rather than a visual trick.

It is also a warning: Continuity cannot claim that shared-element identity itself is novel.

## Current opportunity

The interesting question is whether React is missing a small, product-oriented layer that models **one semantic entity across a graph of UI states**, rather than pairing two DOM nodes for one transition.

```
track:teardrop
  ├─ compact
  ├─ preview
  └─ player
```

Possible differentiators to validate:

1. Identity belongs to the entity, not to a particular transition.
2. A shared part can participate across 3+ states without manually coordinating pairwise transitions.
3. Presentation can change by context or breakpoint while semantic state survives.
4. Reversal/interruption is treated as normal interaction.
5. The abstraction stays small enough that using it is better than direct Motion code.

## What would invalidate Continuity

Stop or reposition the project if the v0 experiment shows that:

- repeated `layoutId` is already clearer than the abstraction
- 3+ states do not create meaningful new coordination problems
- responsive presentation does not benefit from explicit identity
- accessibility/state preservation requires owning too much unrelated behavior
- the API becomes an animation DSL

## Open questions

- Is a state graph actually useful, or merely a nicer mental model?
- Should Continuity know about entity identity, shared-part identity, or both?
- How should shared identity behave when only some states contain an element?
- Can presentation change at a breakpoint without remounting important state?
- What happens under repeated interruption?
- Which concerns belong to Continuity versus Base UI / Motion?
- Can the primitive remain tiny?

## Checked against the v0 implementation

| Existing tool                    | Primary source                                                                                                                             | Implication for Continuity                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Motion layout                    | [Layout animations](https://motion.dev/docs/react-layout-animations)                                                                       | Matching IDs are not limited to two states. Motion owns projection, scale correction and springs. Horizontal resizing deliberately suppresses layout animation.                                                                                                         |
| Motion paths                     | [arc](https://motion.dev/docs/arc)                                                                                                         | Curved paths and interruption behavior are animation-engine concerns already exposed by Motion. v0 uses a native arc on the text group to avoid crossing the cover. No Continuity path API was built.                                                                   |
| React ViewTransition             | [React reference](https://react.dev/reference/react/ViewTransition)                                                                        | Snapshot boundaries are another renderer choice, not evidence for an entity layer. The installed `react@19.2.8` package exported no `ViewTransition` in Node inspection; Next's compiled React is a separate concern. No experimental flag or React upgrade was needed. |
| Motion AnimateView / animateView | [React](https://motion.dev/docs/react-animate-view), [view animations](https://motion.dev/docs/animate-view)                               | Snapshot transition interruption is different from retargeting live layout springs. Documented queue/immediate policies do not prove physical reversal equivalence. Neither was added or benchmarked here.                                                              |
| Motion Primitives                | [Morphing Dialog](https://motion-primitives.com/docs/morphing-dialog)                                                                      | A composed dialog solves useful interaction details. One morphing dialog is not a multi-state entity model.                                                                                                                                                             |
| React Morpheus                   | [Maintainer repository](https://github.com/shivekkhurana/react-morpheus)                                                                   | Its controlled collapsed/expanded surface API is a close two-surface pattern; application state remains caller-owned.                                                                                                                                                   |
| Vista Sheet                      | [Maintainer repository](https://github.com/seansmithworks/vista-sheet)                                                                     | Owns a draggable trigger and modal sheet morph, with an explicit shared-part API. That surface lifecycle was intentionally not rebuilt here.                                                                                                                            |
| SwiftUI                          | [matchedGeometryEffect](<https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)>) | Namespace and identity are explicit API arguments. Identity is not a novel Continuity concept.                                                                                                                                                                          |
| Compose                          | [Shared elements](https://developer.android.com/develop/ui/compose/animation/shared-elements)                                              | Remembered keys coordinate content; the docs even model entity/origin/part keys. A graph of product states cannot be claimed as novel simply because it has three states.                                                                                               |

**Inference from this experiment:** React state ownership + persistent DOM + CSS +
direct Motion already solve this topology. The investigated web libraries do not
establish a missing generic entity primitive, and the demo does not establish one
either. Do not position Continuity as an engine or a novel shared-identity mechanism.

### Installed-version findings

Motion 14.0.0 was tested, rather than assuming its current docs covered runtime
preference changes. Its reduced-motion hook and visual-element reduction flag
snapshot at mount. Projection layout options are also established at creation.
Stable `layout`/IDs with a reactive instant transition avoided remounting or
patching Motion internals. These are integration observations, not proof of a core
Continuity responsibility. See the evidence log for the failed and repaired cases.

### Applied music study — 2026-10-06

- [Apple's iOS 27 player guide](https://support.apple.com/en-euro/guide/iphone/iph676daac9b/27/ios/27)
  and its MiniPlayer/Now Playing screenshots informed the applied controls,
  immersive artwork, favorite, scrubbing, volume and queue. This is an independent
  web study with short catalog previews, not an Apple Music account integration.
- [Jakub's shared-layout example](https://jakub.kr/work/shared-layout-animations)
  keeps shared parts outside presence and blurs/fades contextual controls.
  [His interface details](https://jakub.kr/writing/details-that-make-interfaces-feel-better)
  and [interfaces.dev's cheat sheet](https://interfaces.dev/cheat-sheet) reinforce
  restrained, interruptible icon transitions. Blur softens the lifecycle; unnamed
  Motion position projection fixes the actual ancestor-scale distortion observed
  in our compact controls. Neither concern requires a Continuity runtime.
- Public US catalog samples are recorded in `app/apple-music-tracks.ts`. Media
  remains external and can fail; the player exposes an error and source-song link.

### Desktop and Apple fidelity review — 2026-10-06

This is a reference review, not a UI implementation or a native-app gesture test.

- Compare the [iPhone player](https://support.apple.com/es-us/guide/iphone/iph676daac9b/27/ios/27)
  and [iPad player](https://support.apple.com/es-us/guide/ipad/ipad9a4ba1e8/27/ipados/27)
  with the [Mac MiniPlayer](https://support.apple.com/en-ie/guide/music/mus71d7dcfce/mac)
  and [Mac Full Screen Player](https://support.apple.com/en-lamr/guide/music/-musf438ffc97/mac).
  These are different product compositions. The iPhone guide opens Now Playing
  directly from MiniPlayer; our mandatory preview and Open player action belong
  to the three-state experiment. Keep that distinction explicit when assessing
  fidelity, rather than presenting this navigation as an exact Apple replica.
- Apple's [motion specifications](https://help.apple.com/itc/albummotionguide/#/bc5165604402)
  deliver separate 3:4 and 1:1 album-page assets. Its [safe-area guidance](https://help.apple.com/itc/albummotionguide/#/bca8ccc58922)
  accounts for UI overlays, gradients and important artwork. Those specifications
  do not prove that every Now Playing composition uses those exact dimensions.
  Our static square catalog covers are not interchangeable with dedicated
  immersive artwork. Preserve the whole square cover as a fallback; reserve
  edge-to-edge treatment for suitable artwork instead of cropping every album.
- [Apple's Liquid Glass session](https://developer.apple.com/videos/play/wwdc2025/219/)
  separates content from the floating control/navigation layer and adapts
  material contrast to its surroundings. A heavy black fade and a generally
  blurred panel do not reproduce that hierarchy. Refine contrast, tint and
  control placement together; increasing blur alone is insufficient.
- Proposed next design pass: adapt the same entity to a wider desktop composition
  and a portrait mobile composition, with container-height-aware spacing. A wide
  artwork/controls arrangement would be our web adaptation, not a literal copy
  of Apple's square expanded MiniPlayer. Then refine artwork fallback, text/icon
  metrics, contextual-control timing and the dismissal-handle affordance. Keep
  unsupported controls out of the study.

The next Continuity validation remains preserving track, playback, seek and focus
through a meaningful presentation change. Visual refinement still does not justify
a public API; a later independent-owner or portal case must expose actual repeated
coordination before extraction.

### Integrated queue reference — 2026-10-06

The user's five screenshots establish the requested composition: complete square
artwork, a small current-track header in queue/history views, artwork alongside
song rows, and playback controls below the list. Apple's [queue guide](https://support.apple.com/en-euro/guide/iphone/ipha4521ef7d/ios)
and [iPhone/iPad/Android queue support](https://support.apple.com/en-gb/109336)
confirm queue visibility, selecting upcoming songs and playback history. The
official Now Playing queue screenshot was also inspected. These references do not
establish native animation timing or exact parity across platform versions.

The applied study now uses that hierarchy inside the persistent player rather
than a floating list. The user explicitly preferred the previous dark gradient;
it and the cover fade are retained, while the artwork source keeps square geometry.
Only supported controls are shown. Upcoming items follow the finite sample order,
and session history comes from actual audio playing events. Lyrics, casting,
recommendation AutoPlay, shuffle, repeat and editable queue order remain outside
this pass. Reusing the same three nodes in the queue header is useful visual
evidence, but the single-owner implementation still does not justify extraction.

The subsequent review explicitly restores the first edge-to-edge, cropped hero
cover while retaining the current controls and integrated queue. This supersedes
the square player-artwork choice above. The cover is a deliberate visual preference
for this web study, not a claim of exact native Apple Music artwork presentation.

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
| Motion paths                     | [arc](https://motion.dev/docs/arc)                                                                                                         | Curved paths and interruption behavior are animation-engine concerns already exposed by Motion. No Continuity path API was built.                                                                                                                                       |
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

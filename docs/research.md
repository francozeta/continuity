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

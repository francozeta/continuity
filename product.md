# Product

## Thesis

Continuity explores a React primitive for preserving visual, spatial, and interaction identity as an interface moves through multiple states.

The interesting problem is not `A → B` morphing. Existing tools already handle that well.

The hypothesis is that a developer should be able to model:

```
entity
  ├─ compact
  ├─ preview
  └─ player
```

and explicitly identify which pieces remain the same across those states.

## Problem

Modern product interfaces repeatedly recreate the same continuity work:

- matching elements between layouts
- coordinating layout and presence
- preserving perceived identity across portals and surfaces
- handling interruption and reversal
- adapting presentation across breakpoints
- respecting reduced motion
- keeping interaction semantics correct

Motion, React View Transitions, and accessible primitives provide powerful lower-level building blocks. Continuity should only exist if a useful abstraction can live above them.

## v0 hypothesis

A three-state music interaction can feel like one continuous object rather than three disconnected screens.

States:

1. `compact` — track row/card
2. `preview` — expanded contextual surface
3. `player` — immersive/full player

Shared identity candidates:

- cover
- title
- artist

## Validation

The experiment is successful if:

- the transition remains understandable without explaining the implementation
- users perceive the same object moving through states
- moving forward and backward feels symmetrical
- reversing mid-transition does not feel broken
- responsive presentation can change without losing identity
- the API discovered from the implementation is meaningfully simpler than hand-written Motion code

## Non-goals

For v0, Continuity is not:

- a shadcn component collection
- a replacement for Motion
- a replacement for Base UI
- a general animation engine
- a design system
- a collection of morphing dialogs
- an npm package

## Implementation constraints

Start with:

- React
- Motion
- accessible semantic HTML / Base UI where useful

Do not add multiple animation engines or adapters until the experiment proves a need.

## Principle

Implementation follows evidence.

Do not design a large public API before the first interaction works.

## Finding from v0

The interaction can be implemented with one persistent track owner, one local
presentation state, CSS grid and Motion. The three identities occur once; no
pairwise graph mapping is needed. Stateful playback/saved/seek probes survive
presentation changes and resizing through ordinary React state ownership.

This supports the visual interaction hypothesis, subject to human review. It does
not establish a missing React primitive. Three states alone are not differentiation:
Motion identities can already participate in more than two layouts.

Do not extract `Entity / State / Part` from this result. Future evidence would have
to show repeated coordination across independent render owners or real portals,
and demonstrate that a smaller semantic layer improves the direct implementation.
Those concerns have not been exercised by this in-canvas, single-entity study.

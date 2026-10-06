# Research notes

## Existing territory

### Motion Primitives

Strong copy-first interaction primitives and polished morphing components. This establishes a high quality bar, but its unit is primarily the individual primitive.

### React Morpheus

Models a controlled collapsed surface and expanded surface, measuring and animating geometry and surface styles. This is close to the simple `A → B` version of Continuity.

### Vista Sheet

A trigger morphs into a modal sheet using shared layout identity. Another example showing that trigger-to-surface morphing alone is not sufficient differentiation.

### Motion / React View Transitions

Already solve much of the underlying interpolation and shared-element work. Continuity should compose these capabilities rather than compete with them.

## Current differentiation

Continuity should focus on **identity across a state graph**, not a single morph:

```
compact ↔ preview ↔ player
```

The same semantic entity may have multiple presentations and multiple shared pieces.

A future API might describe:

- entity identity
- named states
- shared parts

but v0 should discover that API from the experiment.

## Open questions

- Does a state graph provide enough value over repeated `layoutId` usage?
- How should shared identity behave when only some states contain an element?
- Can presentation change at a breakpoint while state is preserved?
- What should happen when a transition is interrupted repeatedly?
- Which concerns belong to Continuity versus Base UI / Motion?
- Can the primitive remain tiny?

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

# Continuity

Interfaces should remember where things came from.

Continuity is an experiment in preserving identity across multiple interface states.

Instead of treating a card, preview, drawer, and full view as unrelated UI, Continuity explores a model where they are different states of the same interface entity.

## Status

Experimental. v0 is a working three-state music interaction built directly with
Motion. A useful React primitive remains unproven: one persistent React tree handles
this experiment without a Continuity abstraction.

## First experiment

A music track moves through:

```
compact → preview → player → preview → compact
```

The cover, title, and artist preserve identity while presentation, layout, and surrounding content change.

The experiment must remain:

- interruptible
- keyboard accessible
- respectful of reduced motion
- responsive
- small enough to understand

## Thesis

> Preserve identity, not animations.

If the experiment proves useful, the primitive will be extracted from the implementation rather than designed in advance.

## Site

Planned: `continuity.francozeta.com`

For the current implementation and verification evidence, read
[`docs/experiment-v0.md`](docs/experiment-v0.md). Research and source links live in
[`docs/research.md`](docs/research.md).

## License

TBD

## Local development

The existing Next.js App Router setup uses React, TypeScript, Tailwind CSS 4,
and pnpm. Keep this app as the experiment host.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm lint` checks source and `pnpm build` checks
production compilation. Node.js 20.9+ is required by Next.js; the package manager
version is recorded in `package.json`.

Use the track row to open preview, then **Open player**. Close/Back and Escape
return one state at a time while focus is inside the track. Playback, saving and
seek are silent state-preservation probes; there is no audio or backend. Artwork
is an original local SVG study, not the official album cover. Timing is a demo fixture.

The page shows only the experimental track. Buttons and seek use shadcn's Base UI
components; the Play/Pause icon swap uses [transitions.dev](https://transitions.dev).
Motion still owns the three-state layout transition.

Preview becomes a bottom sheet at narrow sizes. It is a nonmodal region, so
Tab follows the document. Resize either
expanded state without resetting the track. Reduced motion replaces spatial travel
with an immediate layout change and a short contextual fade.

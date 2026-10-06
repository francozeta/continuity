# Continuity

Interfaces should remember where things came from.

Continuity is an experiment in preserving identity across multiple interface states.

Instead of treating a card, preview, drawer, and full view as unrelated UI, Continuity explores a model where they are different states of the same interface entity.

## Status

Experimental. The first goal is not to ship a component library. It is to validate whether continuity across 3+ interface states can become a useful React primitive.

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

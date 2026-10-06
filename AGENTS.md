# AGENTS.md

## Project

Continuity is an experimental React project about preserving interface identity across multiple states.

## Current objective

Validate one interaction:

```
compact ↔ preview ↔ player
```

Do not expand scope until this experiment is convincing.

## Rules

- Prefer evidence from the working interaction over speculative abstractions.
- Do not build a component library yet.
- Do not create a large public API before implementation exposes repeated structure.
- Use Motion for v0.
- Keep accessibility and reduced motion in the experiment, not as later cleanup.
- Optimize for interruptible interaction.
- Keep dependencies minimal.
- Treat Base UI or other primitives as collaborators, not targets to replace.
- Preserve the distinction between semantic identity and animation implementation.
- Keep visual design quiet; the interaction should be the demo.

## Product references

Read `product.md` before changing architecture.
Read `docs/research.md` before proposing a competing abstraction.

## Current implementation and verification

- Work on `feat/continuity-v0`; preserve the existing App Router setup and pnpm lockfile.
- `app/track-experiment.tsx` owns the entity's local state. Presentation uses CSS
  grid in `app/globals.css`. Only the static cover, title and artist placeholders
  have `layoutId`; this version has no track fixture or loading animation.
- Keep projection identities stable. The reactive reduced-motion preference changes
  the transition to instant; see the Motion 14 findings in `docs/experiment-v0.md`.
- Context controls can remount; keep their persistent values in the track owner.
- Buttons and seek use the shadcn Base UI components in `components/ui/`. Keep
  their accessible behavior and keep the page focused on the experiment alone.
- Skeleton is a static shadcn component. Keep placeholders decorative and retain
  meaningful accessible names for controls; do not announce a loading state.
- Run `pnpm lint` and `pnpm build`. Also inspect live interruption, keyboard/focus,
  narrow layouts, resizing and reduced motion; compilation is not visual validation.
- Local browser captures/scripts go in ignored `output/playwright/`. Keep evidence
  and the extraction decision in the existing experiment document.
- No public API or internal Continuity prototype is justified by this experiment yet.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project

Continuity is an experimental React project about preserving interface identity across multiple states.

## Current objective

Preserve the original interaction and validate its repeated coordination in the
two authorized reference clients:

```
compact ↔ preview ↔ player
```

`/music` exercises a persistent media session and Drawer portal; `/photos`
exercises gallery → viewer → details and a disappearing source. Keep extraction
limited to evidence shared by these consumers; do not add new domains or a public
library without an explicit request.

The subsequent authorized scroll cases live at `/examples`: album and profile
hero → sticky header. Read `docs/scroll-context.md`. These have a single DOM
header and direct sticky/layout behavior; do not force them through the modal
controller or introduce an entity registry for this topology.

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
  grid in `app/globals.css`. Only cover, title and artist have `layoutId`.
  Default uses static placeholders; the Apple Music study uses the same nodes
  with the public catalog sample in `app/apple-music-tracks.ts` and preview audio.
- Keep projection identities stable. The reactive reduced-motion preference changes
  the transition to instant; see the Motion 14 findings in `docs/experiment-v0.md`.
- Context controls can remount; keep their persistent values in the track owner.
- Buttons and seek use the shadcn Base UI components in `components/ui/`. Keep
  their accessible behavior and keep the page focused on the experiment alone.
- Skeleton is a static shadcn component. Keep placeholders decorative and retain
  meaningful accessible names for controls; do not announce a loading state.
- The appearance selector keeps presentation and normalized progress. Pause real
  audio on appearance changes. Keep media, volume and track-specific favorites
  owned by the experiment; do not fabricate elapsed playback or full-song access.
- Contextual mini controls use blur/fade presence with exiting controls inert.
  Unnamed position projection corrects their scaling; do not put the three shared
  parts inside presence. The compact surface supplies one keyboard focus ring.
- Apple progress/volume bars have no visible thumb; preserve Base UI's native
  input, 44px control and track focus ring. Keep the artwork-derived dark gradient
  and edge-to-edge fading artwork in player, as requested. The integrated queue is a
  player panel, not a fourth presentation state: the three shared nodes form its
  small current-track header. The source link lives in the Base UI actions popover.
- Upcoming rows exclude the current track. Playback advances through the finite
  catalog selection and stops at its end. History records actual playing events,
  not merely selections or seeks. Preserve the track owner, audio element, seek,
  volume, favorites and focus across queue changes. Escape closes the queue first.
- Run `pnpm lint` and `pnpm build`. Also inspect live interruption, keyboard/focus,
  narrow layouts, resizing and reduced motion; compilation is not visual validation.
- Local browser captures/scripts go in ignored `output/playwright/`. Keep evidence
  and the extraction decision in the existing experiment document.
- The original study alone does not justify a public entity API. The authorized
  internal extraction for Music and Photos is documented in
  `docs/continuity-extraction.md`; keep the original study direct for comparison.

## Reference client

- The authorized `/music` application example preserves the original `/` study.
  Read `docs/reference-client.md` for its stages and acceptance evidence.
- `music-provider.tsx` owns one layout-persistent audio element. Session and timing
  contexts are separate; route changes, queue edits and portal dismissal keep that
  owner. Leaving `/music` ends its session.
- Queue keys identify occurrences, including repeated songs; catalog IDs identify
  songs. Only the current MiniPlayer/portal cover, title and artist participate in
  the namespaced LayoutGroup. Do not register every catalog copy as a source.
- The Base UI Drawer body portal fills the viewport. Desktop centers square art;
  narrow layouts retain the full-width fading cover. Swipe dismissal is mobile;
  scrolling, reorder handles, sliders and buttons opt out. The outer popup is not
  projected and uses one swipe transform; shared projection stays inside it.
- Keep the finite preview catalog honest. Preserve paused intent, actual playing
  history, occurrence-specific reloads, visible media errors and focus on surviving
  or replacement controls. Queue reorder supports keyboard/menu alternatives.
- Music and Photos consume `useContinuity` and `ContinuityBoundary` from
  `components/continuity/continuity.tsx`. Motion owns projection; Base UI owns
  modal semantics and dismissal. Keep nested Escape, swipe policy, application
  state and focus repair for disappearing controls in the consumers.
- The hook coordinates open/exit, connected return/fallback targets, namespaced
  part IDs and reactive reduced motion. Pass its exit callback to AnimatePresence
  and its actions ref to Base UI. Delegate accepted changes to onOpenChange so a
  stale exit cannot unmount a reopened surface.
- Photos captures the visible collection when opening so filtering/removing an
  origin does not replace the selected viewer. Captions, zoom and favorites belong
  to the page session; source metadata is credited in `public/photos/README.md`.
- This is an internal experimental integration, not a released runtime, stable
  component API or registry entry. No additional animation engine is needed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

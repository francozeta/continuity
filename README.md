# Continuity

Interfaces should remember where things came from.

Continuity is an experiment in preserving identity across multiple interface states.

Instead of treating a card, preview, drawer, and full view as unrelated UI, Continuity explores a model where they are different states of the same interface entity.

## Status

Experimental. v0 is a working three-state music interaction built directly with
Motion. A separate reference client now tests independent route owners and a body
portal over a persistent media session. `/photos` adds a gallery, full-window viewer
and details. Both reference clients now consume a small internal Continuity hook
and boundary, extracted after comparing the direct implementations. Motion and
Base UI remain responsible for projection and accessible surfaces. This is not
a published package or stable component API.

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

Live: [continuity.francozeta.com](https://continuity.francozeta.com).

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

The appearance selector compares **Default** (static, anonymous placeholders)
with **Apple Music** (an independent applied interface study). Both use the same
three persistent parts and presentation state. Switch appearance while expanded
to compare the same context; normalized progress and selected track are retained.
The selector pauses audio when switching.

Use the compact surface to open preview, then **Open player**. The downward
chevron and Escape return one state at a time. Default remains silent. The Apple
Music study uses real public catalog metadata, artwork and streamed short previews;
Play/Pause, seek, volume, previous/next and the queue control that preview audio.
Favorites stay local and track-specific. The integrated queue shows upcoming tracks
and actual playback history; selecting a row retains the player and audio owner.
The track-actions popover includes Listen on Apple Music to open the source song.
The sample selects Underworld, Aphex Twin and Burial.
There is no account connection or full-song playback. Catalog examples are
recorded in `app/apple-music-tracks.ts`; external media can become unavailable.

The page contains the selector and experiment. Buttons, sliders and the track-actions
popover use shadcn's Base UI primitives. Skeleton has no pulse or shimmer. The
applied player takes cues from [Apple's current player controls](https://support.apple.com/en-euro/guide/iphone/iph676daac9b/27/ios/27).
Contextual controls use a brief blur/fade, following [Jakub's shared-layout example](https://jakub.kr/work/shared-layout-animations),
while stable shared parts stay outside presence. Play/Pause retains the
[transitions.dev](https://transitions.dev) icon swap. Motion owns layout and scale
correction.

The applied player has thumb-free progress/volume bars with 44px drag targets and
keyboard focus on the track, an artwork-derived backdrop, an edge-to-edge cover
fading into the player and a top dismissal chevron. Default retains its neutral
slider styling.

Default is a developer-facing experiment baseline, not a released component API.
The original study keeps its direct implementation for comparison.

**Open app** opens the reference consumer at `/music`. Library, album and search
are independent routes over one layout-owned playback session. Its persistent
MiniPlayer opens Now Playing directly in a full-window Base UI Drawer portal.
Desktop centers a square cover above the controls; mobile keeps the full-width
fading artwork. The queue supports next/later insertion, duplicate occurrences,
removal, pointer/touch dragging and keyboard reordering. A mobile swipe can be
cancelled or committed. Navigation, queue edits and dismissal preserve the audio
owner. The original study remains at `/`.
Implementation stages and evidence live in [`docs/reference-client.md`](docs/reference-client.md).

**Photos** in the Music navigation opens `/photos`: a credited NASA collection
with a full-window viewer, filmstrip, zoom, favorites and editable captions.
Details use a side panel on desktop and a scrollable lower panel on mobile.
The selected photo survives removal from the Favorites gallery; closing restores
focus to its surviving source or the gallery heading. Photo edits stay in the
current page session and reset on reload or when leaving the example.

The shared experiment lives in `components/continuity/continuity.tsx`. It centralizes
part identity, projection scope, live reduced motion, exit coordination and return
focus. Application state, styling, routing, audio and nested panels stay with
their consumers. Read [`docs/continuity-extraction.md`](docs/continuity-extraction.md)
for the direct-versus-extracted comparison, integration wiring and limits.

**Examples** in Photos opens `/examples`, with album and profile scroll studies
inspired by sticky product headers. Each has one header title and primary control
that remain mounted while presentation changes. Album preview playback and saving,
and the profile's local Follow state, survive the roundtrip. These direct CSS/Motion
cases deliberately test where a single owner is sufficient. They do not introduce
a global entity registry. See [`docs/scroll-context.md`](docs/scroll-context.md).

In the original study, preview and player become bottom-aligned sheets at narrow sizes. They remain
nonmodal regions, so Tab follows the document. Resize either
expanded state without resetting the track. Reduced motion replaces spatial travel
with an immediate layout change and a short contextual fade.

## Deployment

The Vercel project is `continuity` in the `franco-zetas-projects` scope. Production
uses the domain above. `vercel.json` selects Next.js, and the project environment
sets `ENABLE_EXPERIMENTAL_COREPACK=1` for Production and Preview so Vercel uses
the pnpm version pinned in `package.json`.

From an authenticated checkout:

```sh
vercel link --project continuity --scope franco-zetas-projects
vercel deploy --prod --scope franco-zetas-projects
```

The linked Vercel Git integration builds pull-request previews; the CLI commands
above remain available for manual production deployments. `.vercelignore` excludes
local build output, browser captures and environment files from uploads.

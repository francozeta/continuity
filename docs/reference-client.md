# Music reference client

The independent study at `/` remains available. `/music` is an application example
that tests the same entity across independent render owners and a body portal.
It uses the existing three public catalog samples and short audio previews. It is
not an Apple Music account integration or a consumer of a published Continuity API.

## Stages

1. **Application and portal:** library, album and search routes; a layout-owned
   audio session; a persistent MiniPlayer; Now Playing in a Base UI modal portal.
2. **Concurrent interactions:** add next/later from catalog rows, edit and reorder
   queue occurrences, preserve focus and support interrupted dismissal.
3. **Evidence:** check real media, navigation, keyboard, interruption, resizing,
   reduced motion, accessibility and the existing Default study. Record what
   coordination repeated before deciding whether any abstraction is useful.

## Ownership

- `app/music/layout.tsx` retains the reference application's provider across its
  routes. Leaving the music application unmounts and stops that session.
- `music-session.ts` owns queue occurrences, actual playback history and favorites.
  A queue key identifies one occurrence; a catalog ID identifies the song.
- `music-provider.tsx` owns a single audio element. Progress and volume use a
  separate context so time updates do not notify catalog/session consumers.
- `track-list.tsx` and route pages consume application state independently.
- `music-player.tsx` owns presentation, a namespaced Motion LayoutGroup, the
  MiniPlayer and a portal. Only current cover/title/artist share projection IDs.
  Catalog rows do not all participate merely because their catalog IDs match.
- Motion supplies layout projection and springs; Base UI supplies modal and
  accessible control behavior. No Continuity runtime or public API was extracted.

Opening and closing the modal does not transfer the audio element between
containers. Source rows can disappear while the persistent MiniPlayer remains a
valid visual and keyboard return target. The reference client opens Now Playing
directly; the original experiment retains its optional preview presentation.

## Stage 1 evidence — 2026-10-06

Lint, TypeScript and production build passed. Thirteen Chromium checks passed:
real Xtal preview playback; audio/mini identity through album and search navigation;
filtered origin removal; body portal placement; initial and return focus; volume
binding; uninterrupted playback on close; 390px reflow; live reduced motion; no
application runtime errors; and zero axe violations for the open portal.

The cover's immersive crop and dark artwork-derived fade remain. The reference
client adds a dark dismissal control so it remains visible over bright artwork.
Following the user's fullscreen correction, Now Playing covers the whole viewport
with no card frame. Desktop separates artwork and controls; narrow layouts retain
the immersive vertical composition. The body portal and persistent audio owner
remain the same.
Captured evidence and executable browser probes are in ignored `output/playwright/`.

Next.js 16.3.8 blocks dev resources requested from `127.0.0.1` by default. The
development configuration explicitly permits this loopback hostname; no wildcard
or change to production request handling is needed. Production playback and
interaction checks were run separately from the failed initial HMR session.

Stage 2 and the wider acceptance checks remain to be recorded. These results do
not establish WebKit/native gesture parity, field performance, or API savings.

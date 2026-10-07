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
- `music-queue.tsx` edits stable queue occurrences. Motion supplies ordering;
  explicit focus repair only acts when the focused row disappears.
- `music-player.tsx` owns presentation, a namespaced Motion LayoutGroup, the
  MiniPlayer and a portal. Only current cover/title/artist share projection IDs.
  Catalog rows do not all participate merely because their catalog IDs match.
- Motion supplies layout projection and springs; Base UI supplies modal,
  dismissal gestures and accessible control behavior. The initial stages below
  used direct implementations; the subsequent internal extraction is recorded in
  [the two-consumer comparison](continuity-extraction.md).

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
with no card frame. The user's supplied desktop reference supersedes the initial
two-column proposal: a square cover is centered over metadata, timeline, transport
and volume against the full-window artwork backdrop. Narrow layouts have a
full-width fading cover, including intermediate pane widths. The body portal and
persistent audio owner remain the same.
Captured evidence and executable browser probes are in ignored `output/playwright/`.

Next.js 16.3.8 blocks dev resources requested from `127.0.0.1` by default. The
development configuration explicitly permits this loopback hostname; no wildcard
or change to production request handling is needed. Production playback and
interaction checks were run separately from the failed initial HMR session.

## Stage 2 — concurrent queue and dismissal

Catalog actions add a song next or later without replacing the current session.
Repeated songs receive distinct queue occurrence keys. Upcoming rows can be
dragged by their handles, moved with arrow keys or through their actions popover,
removed, selected or cleared. History remains based on real playing events.
Selecting a queued row consumes the preceding queue prefix, as an explicit skip.
Paused Next stays paused, including when two occurrences share the same URL.

The modal now uses [Base UI Drawer](https://base-ui.com/react/components/drawer),
which extends Dialog with dismissal gestures. Narrow layouts follow a downward
swipe and return to the full viewport when it is cancelled. Desktop retains the
close button and Escape. Queue scrolling, row dragging, seek, volume and buttons
opt out of swipe dismissal. Motion continues to project only the inner shared
parts; the unprojected outer popup follows the Drawer's movement variable once.

Focus follows surviving DOM rows through reorder. Removed or consumed rows return
to the queue heading; a newly disabled Next returns focus to Play. Media events
do not move focus from unrelated controls. Escape closes a row actions popover,
then the queue, then the player. Media failure is visible and announced with
either the MiniPlayer or full player active.

## Stage 3 evidence — 2026-10-06

Lint and production build pass, including TypeScript and the three generated album
routes. The final production build passed 57 Chromium checks across seven probes:

| Probe                  | Checks | Evidence                                                                                                                                                          |
| ---------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistent client      |     13 | Real preview playback, independent routes, filtered origin, portal ownership, focus, volume, live reduced motion and a zero-violation axe audit.                  |
| Fullscreen composition |      5 | 1440×900, 1343×607, 556×600, 390×844 and 320×568; square centered desktop art, full-width narrow art, no frame or horizontal overflow.                            |
| Editable queue         |     12 | Next/later, independent duplicates, pointer and keyboard reorder, row identity, removal focus, nested Escape, mobile layout, empty queue and zero axe violations. |
| Dismissal              |      6 | Emulated touch follows its 40px displacement once, cancelled/committed swipes, volume gesture isolation and rapid open-close-open.                                |
| Media lifecycle        |      8 | Actual preview completion, repeated URLs, playback history, paused Next, final-control focus, finite stopping, injected network failure and recovery.             |
| Concurrent edges       |      8 | Favorites/volume through route changes, long scrollable queue, touch reorder, nested popover dismissal, three queue viewport sizes and reduced-motion reorder.    |
| Original Default       |      5 | Compact/preview/player axe audits, keyboard focus and persistent favorite/play intent.                                                                            |

Six Node assertions separately check duplicate occurrence identity, invalid
permutation rejection, stable object ownership, prefix consumption, actual history,
finite stopping and stale row selection. These are local evidence probes in ignored
`output/playwright/`, not a newly introduced test framework. Desktop, intermediate
pane and narrow production captures were visually inspected.

### Findings and verdict

| Severity | Location        | Before                                                                                         | After                                                                                    | Why                                                                                |
| -------- | --------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| MEDIUM   | Fullscreen CSS  | A bounded cover and initial two-column desktop proposal did not match the supplied references. | Full-window backdrop; centered desktop square; narrow cover reaches both viewport edges. | Preserve the requested desktop and mobile compositions.                            |
| MEDIUM   | Queue grid      | Artwork-mode specificity placed the new queue in an implicit grid column.                      | Queue explicitly owns its five grid rows at all widths.                                  | Keep the current-track header, list and controls aligned.                          |
| MEDIUM   | Next control    | Disabling the final Next dropped keyboard focus to the body.                                   | Base UI retains focus until presentation returns it to Play.                             | Leave a usable keyboard target without taking focus during unrelated media events. |
| MEDIUM   | Swipe transform | Combining the primitive's transform with CSS translate doubled the displacement.               | The outer popup applies one transform from the movement variable.                        | Follow the pointer accurately without scaling shared artwork.                      |

Verdict: the reference application passes its local acceptance checks. These
results do not establish Safari/iPhone behavior, screen-reader speech, field
performance or component/API savings. Swipe verification used Chromium touch
emulation; it was not a physical-device test. The injected failure intentionally
produced a failed media request. Ordinary route/player interactions had no
application runtime errors.

## Extraction decision

Application state, routing and audio do not belong in a Continuity primitive.
The stable media owner and explicit MiniPlayer/portal projection pairing already
solve this client's topology with direct Motion and Base UI. Queue occurrence
identity is distinct from song identity and transition participation; matching
every catalog copy by song ID would introduce ambiguity.

The repeated pieces worth studying were shared-part identity, a surviving
return target and interruption/lifecycle coordination. At the end of these stages
they had only been demonstrated in one domain. No public API, registry entry or
runtime was added in the initial Music stages.

On 2026-10-07 the user authorized Photos and a limited extraction. Both reference
clients now consume the same internal hook and boundary; the original Default
study remains direct. See [the comparison and current evidence](continuity-extraction.md).

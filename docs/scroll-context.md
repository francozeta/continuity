# Scroll context studies

## Scope — 2026-10-07

The user supplied Spotify album and social-profile references, then requested
additional cases in the ongoing implementation/PR. `/examples` adds two interactive
studies of hero → sticky header → hero. This starts the direct implementation
proposed in [issue #3](https://github.com/francozeta/continuity/issues/3).

The album uses the existing verified Underworld catalog sample, artwork and real
short audio preview. The profile represents the Continuity experiment and uses a
local Follow toggle; it is not a connection to a social account and invents no
follower counts or feed activity. Its entries link the actual reference examples.

## One owner, one header

Each scene keeps one header title, artwork node and primary control mounted.
One scrollable region owns the sticky header and its content. CSS keeps the header
at the top; Motion moves the same inner nodes between expanded and compact layouts.
No Hero/Compact component pair, duplicated event listeners or shared `layoutId`
pairing is needed for this case. The decorative album image lower in the content
is ordinary content, not another header representation.

The application owners retain audio, playing/saved state and the profile toggle.
The scroller reserves its expanded hero space so a layout change does not change
the scroll range. A passive local scroll listener requests React updates only when
presentation crosses a threshold: collapse at 160px, expand at 100px. The interval
between those thresholds prevents repeated toggling around a single boundary.
Motion's `layoutScroll` and `layoutRoot` account for the scroller and sticky parent.
The header title and action stay focusable and semantic throughout; controls remain
44px, and focus is not moved just because the user scrolls.

The shared reactive preference in `lib/use-reduced-motion.ts` is used by these
scenes and the Music/Photos controller. Reduced motion changes layout immediately
while keeping the same owner and DOM identities. Each scroll region has an
accessible name and keyboard focus, so native PageDown/arrow scrolling is available.

## Extraction result

These two cases need CSS sticky, ordinary local state and Motion layout. They do
not need the modal controller, a source resolver or an entity registry. This is
evidence that Continuity should not promise that every visual handoff needs a new
runtime primitive, nor that developers must eliminate all separate presentations.
The value tested here is preserving one identity, state and event ownership.

Music and Photos still exercise the shared internal controller across separate
source/portal representations. A future issue #3 stage can test a route-owned hero
and independently owned app-shell header; this PR does not claim that topology was
implemented. Issue #3 stays open. Route transitions, responsive popover/sheet
adaptation and a general Continuity graph remain separate experiments.

## Review

The acceptance probe checks stable title/action/audio DOM nodes, real playback,
saved/follow state, sticky geometry, both threshold directions, fast reversals,
focused control retention, keyboard scrolling, two independent scroll regions,
390px/320px layouts and live reduced motion. Expanded and compact axe audits and
manual desktop/narrow inspection complement these behavior checks. The final
verification record is in `docs/continuity-extraction.md`.

Browser-managed animations were sampled with the browser's animation playback rate
set to 0.1, then restored to 1. Motion layout spring frames were also sampled during
the handoff. This does not claim every JavaScript-driven animation was slowed by
the browser control. Physical Safari/iPhone and screen-reader speech remain untested.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | Scroll threshold | One threshold could alternate presentations under small changes near the boundary. | Separate expand/collapse thresholds; only update on a presentation change. | Keep reversals stable without rendering for every scroll event. |
| LOW | Hero layout | Shrinking normal-flow header height would alter scroll position/range. | Fixed sticky header footprint and reserved hero space. | Avoid feedback between layout and scroll classification. |

Verdict: retain these direct studies as comparison cases. Do not extract another
primitive from a topology that a single owner already handles.

References: [CSS position/sticky](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position),
[Motion layout](https://motion.dev/docs/react-layout-animations), and
[Motion element scroll](https://motion.dev/docs/react-use-scroll).

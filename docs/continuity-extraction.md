# Two consumers and an internal extraction

## Scope — 2026-10-07

Music already exercised independent routes, a persistent audio owner and a body
portal. The authorized second example at `/photos` exercises a gallery, full-window
viewer and details. Both now consume the same small Continuity integration.
The original Default/Apple study at `/` remains direct.

Photos uses six credited, unmodified NASA images stored locally; sources and
catalog metadata are in `public/photos/README.md`. Favorites, captions and zoom
start empty and stay in the page owner. They survive viewer/details remounts and
photo selection, but are not persisted across reloads or leaving `/photos`.
This is an illustrative consumer, not an Apple Photos integration.

## Evidence before design

Commit `2fcc4bb` contains Photos built directly with Motion and Base UI Dialog.
The direct version passed 25 Chromium checks before extraction. The identical
probe passed all 25 after migration, including on the production build.

| Concern | Music | Photos |
| --- | --- | --- |
| Stable application owner | Layout-owned audio/session across routes | Page-owned selection, edits and captured collection |
| Projection pair | Current MiniPlayer → portal | Selected gallery image/title → portal |
| Accessible surface | Base UI Drawer with mobile swipe | Base UI Dialog |
| Nested view | Queue, then row action popovers | Details panel |
| Origin disappears | A catalog row is filtered; MiniPlayer survives | Removing a favorite unmounts the matching gallery source |
| Return focus | Persistent MiniPlayer trigger | Selected source, then gallery heading if absent |

Capturing the collection at opening keeps the selected photo and filmstrip usable
when the filtered gallery changes. This is a Photos rule, not a Continuity rule.

## What is shared

`components/continuity/continuity.tsx` exports an internal `useContinuity` hook,
`ContinuityBoundary`, and a part-ID function type. There is no registry, package,
adapter system or entity/state graph.

The hook owns controlled open state and an immediately updated open ref. Accepted
close requests ask Base UI to defer unmounting; AnimatePresence calls the shared
exit handler. An exit cannot unmount a surface that has since reopened. Return
focus resolves the current caller-supplied source and optional fallback at closing,
rejecting detached nodes. If neither exists, it suppresses restoration; consumers
must supply an appropriate destination.

The boundary supplies a per-controller `useId` LayoutGroup scope and the existing
layout spring. A reactive reduced-motion store changes spatial transitions to
instant without changing projection identity or remounting the domain owner.
`partId(entityId, part)` encodes the pair as JSON, keeping delimiter-containing
IDs and string/number IDs distinct within a scope. Consumers explicitly choose
participating copies: Music does not register every catalog row, and Photos does
not register filmstrip thumbnails as competing sources.

## Integration wiring

Consumers retain their Base UI and Motion nodes:

| Consumer node | Shared value |
| --- | --- |
| Surrounding `ContinuityBoundary` | `controller={continuity}` |
| Base UI Root | `open={continuity.open}`, `actionsRef={continuity.actionsRef}` |
| Accepted Root change | `continuity.onOpenChange(next, details)` |
| AnimatePresence | `onExitComplete={continuity.onExitComplete}` |
| Base UI Popup | `finalFocus={continuity.finalFocus}` |
| Explicit Motion shared parts | `layoutId={continuity.partId(entityId, "image")}` |
| Application fades and gesture choices | `continuity.reducedMotion` |

Music supplies `returnFocus: () => openRef.current`. Photos supplies the selected
photo's current source ref and `fallbackFocus: () => galleryHeading.current`.
Consumers cancel nested Escape or desktop swipe before delegating accepted
changes. They still provide initial focus, portal placement, exiting inert state,
labels and semantic primitives. The hook does not manufacture accessibility.

## Comparison with the direct implementation

Physical source lines, including imports and whitespace, compare the direct
consumers at `2fcc4bb` with the extraction snapshot at `5939e17`:

| File | Direct | Extracted | Difference |
| --- | ---: | ---: | ---: |
| Music player | 533 | 508 | −25 |
| Photo gallery/viewer | 617 | 584 | −33 |
| Shared integration | 0 | 95 | +95 |
| Total | 1150 | 1187 | +37 |

There is no net line saving with two consumers, and no component was eliminated.
The benefit is one implementation of repeated coordination policies, with
explicit domain-specific decisions. Passing part IDs and focus callbacks adds
consumer wiring. Direct Motion/Base UI remains reasonable for one interaction;
retain the integration only if consistent behavior across consumers justifies it.

Audio, queue occurrences/history, routing, favorites, captions, zoom, collection
filtering, nested-panel focus and finite-navigation repair remain in their apps.
Visual styling and artwork-derived Music gradients are application choices.

## Verification

Lint, TypeScript and production compilation passed. The extracted production build
passed the 57 Music/Default checks in `reference-client.md`, plus the same 25 Photos
checks run on the direct baseline. Six Node assertions rechecked queue/session
invariants. Probes and captures remain in ignored `output/playwright/`, following
the existing repository workflow.

Photos checks cover local asset loading; full-window portal placement; image
geometry; initial/return/nested focus; caption, zoom and favorite ownership;
finite next focus; entity changes; removed origin and fallback; focus containment;
live reduced motion; 1440×900, 390×844 and 320×568 resizing; and no runtime errors.
Axe reported zero violations for the library, open details/viewer and empty
Favorites. This supplements visual inspection, not screen-reader speech or
physical-device testing.

The final build, including the subsequent scroll cases and Photos exit fixes,
passed **116 Chromium checks**: 57 Music/Default, 25 Photos baseline checks,
14 Photos interruption/selection checks, and 20 album/profile scroll checks.
The latter preserve the actual title/action/audio nodes, focused playback control,
saved/follow state, threshold hysteresis and fast reversal. Twelve Photos
close/reopen cycles remained valid while exiting. Expanded/compact scroll scenes
also had zero axe violations. The six Node session assertions were rerun.
Browser-managed motion was sampled at 0.1 playback rate; layout frames and final
desktop/narrow captures were visually reviewed. See `scroll-context.md` for the
scope and remaining separate-owner experiment.

### Findings and verdict

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | Photo canvas | Whole-viewport sizing could exceed the remaining space when mobile details opened. | Image uses its canvas container height and preserves aspect ratio. | Keep the full unzoomed photo visible. |
| MEDIUM | Finite navigation | Disabling the focused last Next could leave no useful focus target. | Retain focus until it moves to the selected filmstrip item. | Preserve keyboard navigation without moving unrelated focus. |
| MEDIUM | Exit coordination | Each direct consumer kept its own exit/unmount policy. | One handler checks the latest accepted open request before unmounting. | Keep reopening safe while an earlier exit finishes. |
| MEDIUM | Photo portal hit testing | The exiting backdrop could intercept a click intended to reopen the gallery source. | Exiting backdrop and viewport are inert and stop receiving pointer input. | Allow reversal while the previous exit is still animating. |
| LOW | Details exit layout | The fading panel could occupy an implicit grid row after its layout mode closed. | The exiting panel leaves grid flow while it fades. | Keep the image canvas stable during reversal. |

Follow-up review corrected thumbnail `sizes` to match the actual grid and removed
unnecessary eager thumbnail preloads. Viewer requests account for available desktop
height. The reduced-motion preference is now a shared utility in
`lib/use-reduced-motion.ts`, also consumed by the new scroll examples. The line
table above records the original extraction decision, not a running savings metric.

Verdict: retain this small internal extraction for the two reference clients.
A public API still needs independent-instance/nesting coverage, Safari and physical
mobile testing, assistive-technology checks, performance measurements, consumer
documentation and a licensing/distribution decision. These checks do not establish
rendering speed, field performance or component-count savings.

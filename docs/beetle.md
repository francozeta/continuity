# Beetle

Beetle moves a live React subtree between mounted regions of one document. Use it when the destination needs to become the subtree’s actual DOM parent and replacing the controls would discard focus or state.

The standalone `/beetle` preview lets a single brightness control apply to the first photograph or to both. **Link** synchronizes the second photograph to the first and moves the control under the pair. Unlinking keeps each photograph’s current brightness. The slider, toggle and their focus targets survive the round trip. Brightness is a CSS image adjustment held in the current page session.

## Research

The original track experiment found that React ownership, CSS layout and Motion were sufficient within one persistent DOM parent. PR #4’s Music and Photos clients found a different shared problem. Their Base UI Drawer and Dialog own dismissal and focus semantics, while Motion matches selected surface parts. The internal `useContinuity` guards stale exit callbacks and resolves a surviving return target. Music keeps the media session in its layout. Photos keeps edits and its captured collection in the page and supplies a focus fallback if the source disappears. The review also found that exiting overlays could block reopening and projected scale could stretch controls. Beetle’s preview instead uses a single nonmodal subtree and moves it without projecting scale. [Track research](research.md) · [Experiment findings](experiment-v0.md) · [PR #4 extraction](https://github.com/francozeta/continuity/blob/e9834819aaef2b025e2bc4df19c2af8de6cf1387/docs/continuity-extraction.md)

| Reference | Decision for Beetle |
| --- | --- |
| Base UI | Controlled Toggle, uncontrolled Slider, native input semantics and composed refs remain with the application. Connect the portal host before rendering children so Base UI can register their refs. [Composition](https://base-ui.com/react/handbook/composition) · [Controlled state](https://base-ui.com/react/handbook/customization) |
| Radix Primitives | Composition depends on forwarding props and refs and retaining the behavior of the chosen element. Beetle accepts children directly and leaves their element types, refs and event handlers intact. [Composition](https://www.radix-ui.com/primitives/docs/guides/composition) |
| Motion | `layout` covers layout changes to a persistent node and `layoutId` matches distinct representations. The installed Motion 14.0 animates one host’s translation through its native animation API. The documented imperative `animateLayout` starts in 14.1 and could supply future layout measurement while leaving DOM ownership to the caller. [React layout](https://motion.dev/docs/react-layout-animations) · [animate](https://motion.dev/docs/animate) · [animateLayout](https://motion.dev/docs/layout-animations) |
| Motion Primitives | Transition Panel is narrow and controlled by an active index. Its keyed content enters and exits, which suits panel transitions. Beetle’s narrow behavior keeps an interactive subtree mounted. [Transition Panel source](https://github.com/ibelick/motion-primitives/blob/main/components/core/transition-panel.tsx) |
| Rauno Freiberg | Test whether the interface responds where the user’s finger or cursor actually is. Reserve an unobstructed path and check hit testing frame by frame. [Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) |
| Emil Kowalski | Use motion to explain the change in scope. Exercise reversal before rest, respond to pointer presses immediately and honor reduced motion. [Great Animations](https://emilkowal.ski/ui/great-animations) |
| Jakub Krehel | Preserve the recognizable parts of an object through the transition. In this example the entire control stays at one size and the destination alignment explains the scope. [Shared layout animations](https://jakub.kr/work/shared-layout-animations) · [Interface details](https://jakub.kr/writing/details-that-make-interfaces-feel-better) |

The study consulted MDS at `c090bd9155aa8b78579f421d3e11d888c8c7583c` as a reference snapshot for a bounded before/after experiment, restrained motion, and input and focus checks.

## Proposed API

```tsx
<Beetle destination={linked ? pairDock : singleDock} spring={handoffSpring}>
  <BrightnessControls />
</Beetle>
```

- `destination: HTMLElement | null` is controlled by the caller. Supply mounted, block-capable slots in the same light DOM document. Keep both slots mounted while moving between them. A null destination leaves the last placement intact.
- `children: ReactNode` renders into one stable portal host. The host attaches before the children mount. React context and synthetic event bubbling follow the original React tree. CSS, DOM order and browser semantics follow the new DOM parent.
- `spring?: SpringOptions` is passed to Motion. Omit it for immediate placement. With motion enabled, Beetle measures the currently painted position, commits the move and lets Motion translate the real host to its new position. Movement reverses from its current position. A held pointer pauses translation through native click or cancellation. A resize or a live change to reduced motion settles at the accepted destination.

Beetle uses `Element.moveBefore` for an atomic move where supported. The fallback appends the same host and restores its previously focused descendant if the browser drops focus. That fallback can fire native blur and focus events. Browser-owned state such as IME composition and pointer capture has platform-specific behavior. [React portals](https://react.dev/reference/react-dom/createPortal) · [Atomic DOM movement](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)

The caller owns destination semantics, domain state, focus policy for a disappearing or hidden region, and the geometry. This preview uses equally sized slots with a clear path in one coordinate space. Different transform scales, clipped scrolling boundaries, top-layer and modal transitions, and other documents are outside this prototype’s scope.

## Comparison

Both the Chromium fixture and the preview used a Base UI Slider with an uncontrolled default of 100 and a Link toggle. The check pressed End, then focused and activated Link.

| Implementation | DOM placement after Link | Slider | Focus |
| --- | --- | --- | --- |
| React and CSS grid with one Motion `layout` node | Same parent | Same node, 140 → 140 | Retained |
| React portal changes destination with a stable key and Motion `layoutId` | New parent | New node, 140 → 100 | Lost |
| Stable host, atomic move and Motion, wired directly in the preview | New parent | Same node, 140 → 140 | Retained |
| Beetle | New parent | Same node, 140 → 140 | Retained |

When a shared layout parent is available, the first option is simpler. A reverse portal already preserves a subtree through a stable container. Beetle combines that technique with an atomic DOM move and coordination for focus fallback and a live, interruptible hit target. View transitions are useful for repainting snapshots during larger changes. This example needs the painted control to keep taking input during its travel. [Reverse portal source](https://github.com/httptoolkit/react-reverse-portal/blob/main/src/index.tsx) · [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

The direct preview is preserved at `3c972f3`. The consumer went from 222 to 104 lines, with 150 lines of shared implementation added. The extraction removes both DOM and animation effects from the consumer at a net cost of 32 lines. The caller still chooses the destinations, supplies CSS geometry and owns brightness and link state. An independent consumer would establish whether centralizing these rules is worth the extra component.

## Verification

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm lint
pnpm build
pnpm test:beetle
```

Run `pnpm test:beetle --project=chromium` for the Chromium check alone. The runner starts the production build. `BEETLE_TEST_URL` can point it to another running build.

Both production builds passed the same 26 tests across Chromium, Firefox and WebKit. The suite checks native keyboard and touch interaction, node identity, fallback focus, held mouse press and cancellation, live slider input before rest, repeated reversals, narrow and short layouts, resize during travel, and reduced motion at load and during travel. Across three engines, each build sampled 252 frames during handoffs for viewport bounds, size, photo clearance and hit targets. Axe reported zero violations in both locations at wide and narrow sizes. The touch test ran in Chromium and WebKit. Physical devices and spoken screen-reader output remain unverified.

The direct prototype exposed two issues that settled screenshots missed. An empty destination could intercept clicks, and a button could leave the pointer during a held press. Destination boxes now allow pointer input through to the control, and the live press holds its target. Production also exposed a Base UI thumb registration failure when mounting inside a detached host. Attaching the host before mounting its children resolved it.

The desktop move is about 212 px. At 320 px the shared slot shifts 16 px horizontally and 20 px vertically to make the handoff legible. The spring is close to critically damped. In Chromium, the sampled return reached 90% of the distance in about 180 ms at 1440 px and 198 ms at 320 px. Linking and reversal frames were visually reviewed at both sizes. The control maintains its size and opacity throughout the move.

## Photographs

Both photographs are by Ansel Adams and held by the U.S. National Archives. The Commons records identify them as public domain in the United States. The local grayscale WebP files trim scan edges and reduce the original dimensions. [Death Valley National Monument, 79-AA-D01](https://commons.wikimedia.org/wiki/File:Ansel_Adams_-_National_Archives_79-AA-D01.jpg) · [Near Death Valley, 79-AA-D02](https://commons.wikimedia.org/wiki/File:Ansel_Adams_-_National_Archives_79-AA-D02.jpg)
